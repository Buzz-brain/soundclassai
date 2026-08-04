"""
Prediction service.

Loads the trained Keras model once at startup and exposes a single
method that turns a preprocessed tensor into a readable prediction.

Because the model is heavy, it is instantiated a single time and reused
for every request (module-level singleton).
"""

import os

import numpy as np
import tensorflow as tf

from backend import config
from backend.preprocessing import AudioLoadError, extract_features


class ModelNotLoadedError(Exception):
    """Raised when the model file is missing or fails to load."""


class PredictionError(Exception):
    """Raised when inference on a valid audio file fails."""


class SoundClassifier:
    """Thread-safe wrapper around the trained Keras model."""

    def __init__(self, model_path=None):
        """
        Initialise the classifier and load the model.

        Args:
            model_path (str, optional): Path to the .keras file. Defaults
                to config.MODEL_PATH.

        Raises:
            ModelNotLoadedError: When the file does not exist or Keras
                cannot import it.
        """
        self.model_path = model_path or config.MODEL_PATH
        self.model = self._load_model(self.model_path)
        self.class_names = config.CLASS_NAMES

    @staticmethod
    def _load_model(model_path):
        """Load a Keras model from disk with a descriptive error."""
        if not os.path.exists(model_path):
            raise ModelNotLoadedError(
                "Model file not found. Expected: " f"{model_path}"
            )
        try:
            return tf.keras.models.load_model(model_path)
        except Exception as exc:
            raise ModelNotLoadedError(
                "The model file exists but could not be loaded. "
                "It may be corrupted or incompatible with this "
                "TensorFlow version."
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
            predictions = self.model.predict(
                features, verbose=0
            ).flatten()
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


def get_model_info():
    """
    Build a metadata payload for the "Model" dashboard.

    Values are read live from the loaded Keras model (input shape, output
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
        model_shape = instance.model.inputs[0].shape
        if len(model_shape) == 4:
            input_shape = (model_shape[1], model_shape[2], model_shape[3])

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
        "num_params": _model_params(instance),
    }


def _model_params(instance):
    """Count trainable model parameters when the model is loaded."""
    if instance is None:
        return None
    try:
        return int(instance.model.count_params())
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Module-level singleton so the model is loaded exactly once.
# ---------------------------------------------------------------------------
classifier = None


def get_classifier():
    """
    Lazily build and cache the global SoundClassifier instance.

    Returns:
        SoundClassifier: Shared instance reused by every request.
    """
    global classifier
    if classifier is None:
        classifier = SoundClassifier()
    return classifier


def warm_up():
    """Load the model eagerly on startup so the first request is fast."""
    try:
        get_classifier()
    except ModelNotLoadedError:
        # Startup should not crash when the model is missing; requests
        # will return a clear error instead.
        pass
