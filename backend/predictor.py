"""
Prediction service.

Loads the trained ONNX model once at startup and exposes a single
method that turns a preprocessed tensor into a readable prediction.

ONNX Runtime replaces TensorFlow/Keras at serving time. Keeping the
heavy TF stack out of the web process is what makes the app fit inside
Render's free tier (512 MB): the full process now sits around 150 MB
instead of ~450 MB, and builds no longer pull the ~200 MB TF wheel.

The model is instantiated a single time and reused for every request
(module-level singleton, guarded by a lock so concurrent warm-up and
first requests cannot create two sessions).
"""

import logging
import os
import threading

import numpy as np
import onnxruntime as ort

from backend import config
from backend.preprocessing import AudioLoadError, extract_features, warm_audio_pipeline

log = logging.getLogger(__name__)


class ModelNotLoadedError(Exception):
    """Raised when the model file is missing or fails to load."""


class PredictionError(Exception):
    """Raised when inference on a valid audio file fails."""


class SoundClassifier:
    """Thread-safe wrapper around the ONNX model."""

    def __init__(self, model_path=None):
        """
        Initialise the classifier and load the model.

        Args:
            model_path (str, optional): Path to the .onnx file. Defaults
                to config.ONNX_MODEL_PATH.

        Raises:
            ModelNotLoadedError: When the file does not exist or ONNX
                Runtime cannot load it.
        """
        self.model_path = model_path or config.ONNX_MODEL_PATH
        self.session = self._load_session(self.model_path)
        self.input_name = self.session.get_inputs()[0].name
        self.class_names = config.CLASS_NAMES

    @staticmethod
    def _load_session(model_path):
        """Load an ONNX inference session with a descriptive error."""
        if not os.path.exists(model_path):
            raise ModelNotLoadedError(
                "Model file not found. Expected: " f"{model_path}"
            )
        try:
            return ort.InferenceSession(
                model_path,
                providers=["CPUExecutionProvider"],
                sess_options=_session_options(),
            )
        except Exception as exc:
            raise ModelNotLoadedError(
                "The model file exists but could not be loaded. "
                "It may be corrupted or incompatible with this "
                "ONNX Runtime version."
            ) from exc

    def predict_file(self, path):
        """
        Run the full pipeline for an audio file and return top results.

        Args:
            path (str): Absolute path of the uploaded audio file.

        Returns:
            dict: Contains `prediction`, `confidence`, `probabilities`
                (full ranked list) and `top_probabilities`.

        Raises:
            AudioLoadError: On decode / duration problems.
            PredictionError: When inference itself fails.
        """
        try:
            features = extract_features(path)
            features = features[np.newaxis, ...]  # Add batch dimension.
            predictions = self.session.run(
                None, {self.input_name: features}
            )[0].flatten()
        except AudioLoadError:
            raise
        except Exception as exc:
            raise PredictionError(
                "The model could not analyse this audio file."
            ) from exc

        return self._format_result(predictions)

    def _format_result(self, predictions):
        """
        Convert raw model output into a clean, sorted API response.

        Args:
            predictions (np.ndarray): Softmax probabilities per class.

        Returns:
            dict: Structured prediction payload.
        """
        order = np.argsort(predictions)[::-1]
        probabilities = [
            {"class": self.class_names[idx], "probability": round(float(predictions[idx]) * 100, 2)}
            for idx in order
        ]

        top = probabilities[0]
        return {
            "prediction": top["class"],
            "confidence": top["probability"],
            "probabilities": probabilities,
            "top_probabilities": probabilities[:5],
        }


def _session_options():
    """Cap ONNX Runtime's CPU thread usage for small cloud instances."""
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    return options


def get_model_info():
    """
    Build a metadata payload for the "Model" dashboard.

    Values are read live from the loaded ONNX model (input shape, output
    classes) and from the preprocessing configuration, so the dashboard
    can never drift from the real pipeline.

    Returns:
        dict: Model architecture, framework, input details, class names
            and dataset statistics.
    """
    instance = None
    try:
        instance = get_classifier()
    except ModelNotLoadedError:
        pass

    input_shape = config.INPUT_SHAPE
    if instance is not None:
        onnx_shape = instance.session.get_inputs()[0].shape
        if len(onnx_shape) == 4:
            input_shape = (onnx_shape[1], onnx_shape[2], onnx_shape[3])

    return {
        "status": "ok",
        "model_loaded": instance is not None,
        "architecture": config.MODEL_NAME,
        "framework": config.MODEL_FRAMEWORK,
        "learning": config.MODEL_LEARNING,
        "input_type": config.MODEL_INPUT_TYPE,
        "sample_rate": config.SAMPLE_RATE,
        "audio_duration": config.AUDIO_DURATION,
        "audio_length": f"{config.AUDIO_DURATION:.1f} s",
        "input_size": f"{input_shape[0]} × {input_shape[1]} × {input_shape[2]}",
        "classes": len(config.CLASS_NAMES),
        "class_names": config.CLASS_NAMES,
        "test_accuracy": config.TEST_ACCURACY,
        "num_params": config.MODEL_PARAMS if instance is not None else None,
    }


# ---------------------------------------------------------------------------
# Module-level singleton so the model is loaded exactly once.
# ---------------------------------------------------------------------------
classifier = None
_classifier_lock = threading.Lock()


def get_classifier():
    """
    Lazily build and cache the global SoundClassifier instance.

    Thread-safe: concurrent callers block on a lock so only one session
    is ever created, even while the background warm-up is running.

    Returns:
        SoundClassifier: Shared instance reused by every request.
    """
    global classifier
    if classifier is None:
        with _classifier_lock:
            if classifier is None:
                classifier = SoundClassifier()
    return classifier


def warm_up():
    """
    Warm the model and the audio pipeline BEFORE serving traffic.

    Runs synchronously at startup: loading the ONNX session and
    compiling librosa's numba kernels (melspectrogram helpers) blocks
    until finished. This is deliberate — numba serialises compilation
    behind a global lock, so if any request arrived while the kernels
    were still compiling it would stall until the compile finished and
    gunicorn would time it out (180 s) and kill the worker.

    With the compile done up front, every prediction after boot runs in
    well under a second.
    """
    try:
        get_classifier()
        warm_audio_pipeline()
        log.info("Model + audio pipeline warmed up")
    except ModelNotLoadedError:
        # Startup should not crash when the model is missing; requests
        # will return a clear error instead.
        log.error("Model warm-up failed: model not loaded")
    except Exception:
        log.exception("Model warm-up failed")
