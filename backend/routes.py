"""
API route definitions.

Implements the REST endpoints consumed by the front end:

    POST /api/predict     - classify an uploaded audio file
    GET  /api/model-info  - model & preprocessing metadata
    GET  /api/health      - service health + model readiness

The blueprint approach keeps routing separate from application setup so
the project stays modular and easy to extend. Errors are centralised
through ``_api_error`` so the client always receives a consistent shape.
"""

import logging
import time

from flask import Blueprint, jsonify, request

from backend import config
from backend.predictor import (
    ModelNotLoadedError,
    PredictionError,
    get_classifier,
    get_model_info,
)
from backend.preprocessing import AudioLoadError
from backend.utils import allowed_file, cleanup_file, save_upload

log = logging.getLogger(__name__)

api = Blueprint("api", __name__)

# Human-readable error codes shared with the front end.
ERROR_CODES = {
    "NO_FILE": "No audio file was uploaded.",
    "BAD_TYPE": "Unsupported file format. Only .wav and .mp3 files are accepted.",
    "DECODE": "The audio file could not be decoded. Please upload a valid WAV or MP3 file.",
    "TOO_SHORT": "The audio file is too short.",
    "MODEL": "The model is not loaded. Please place best_model.keras in backend/model/.",
    "PREDICTION": "Prediction failed while analysing the audio file.",
    "SERVER": "An unexpected server error occurred.",
}


def _api_error(code, status=400, message=None):
    """Build a standardised JSON error response."""
    payload = {
        "status": "error",
        "code": code,
        "message": message or ERROR_CODES.get(code, ERROR_CODES["SERVER"]),
    }
    return jsonify(payload), status


@api.route("/health", methods=["GET"])
def health():
    """Lightweight endpoint used to confirm the server is running."""
    from backend.predictor import classifier as cached

    return jsonify(
        {
            "status": "ok",
            "model_loaded": cached is not None,
            "classes": config.CLASS_NAMES,
        }
    )


@api.route("/model-info", methods=["GET"])
def model_info():
    """Serve live model & preprocessing metadata for the dashboard."""
    return jsonify(get_model_info())


@api.route("/predict", methods=["POST"])
def predict():
    """
    Classify an uploaded audio file.

    Expected form data:
        audio: the WAV file.

    Returns:
        200 JSON: { prediction, confidence, probabilities, top_probabilities }
        4xx/5xx JSON: descriptive error via ``_api_error``.
    """
    started = time.perf_counter()

    if "audio" not in request.files:
        return _api_error("NO_FILE")

    file_storage = request.files["audio"]

    if not file_storage or file_storage.filename == "":
        return _api_error("NO_FILE")

    # Measure the real upload so we can diagnose decode problems.
    file_storage.stream.seek(0, 2)
    upload_bytes = file_storage.stream.tell()
    file_storage.stream.seek(0)
    log.info(
        "Received upload: %s (%s bytes, %s)",
        file_storage.filename,
        upload_bytes,
        file_storage.mimetype,
    )

    if not allowed_file(file_storage.filename):
        log.warning("Rejected upload with extension: %s", file_storage.filename)
        return _api_error("BAD_TYPE")

    # Persist the upload so librosa can stream-decode it reliably.
    saved_path = None
    try:
        saved_path = save_upload(file_storage)
        classifier = get_classifier()
    except ModelNotLoadedError as exc:
        log.error("Model not loaded: %s", exc)
        return _api_error("MODEL", status=503, message=str(exc))
    except Exception:
        log.exception("Unexpected error while saving upload")
        return _api_error("SERVER", status=500)

    try:
        result = classifier.predict_file(saved_path)
    except AudioLoadError as exc:
        log.exception("AudioLoadError for %s", saved_path)
        message = str(exc)
        code = "TOO_SHORT" if "short" in message else "DECODE"
        return _api_error(code, message=message)
    except PredictionError as exc:
        log.exception("Prediction failed for %s", saved_path)
        return _api_error("PREDICTION", status=500, message=str(exc))
    except Exception:
        log.exception("Unexpected error during prediction")
        return _api_error("SERVER", status=500)
    finally:
        cleanup_file(saved_path)

    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    result["status"] = "success"
    result["latency_ms"] = elapsed_ms
    return jsonify(result)
