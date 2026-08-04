"""
Convert the trained Keras model to ONNX for serving.

The deployed app never imports TensorFlow: it runs best_model.onnx
through ONNX Runtime, keeping memory well inside Render's free tier.
Re-run this whenever the model is retrained.

Requirements (dev-only, NOT in requirements.txt):
    pip install tensorflow onnx tf2onnx

Usage (from the project root):
    python tools/convert_to_onnx.py
"""

import os
import sys

# Allow running from the repo root or from tools/.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np  # noqa: E402
import keras  # noqa: E402

from backend import config  # noqa: E402

SRC = config.MODEL_PATH
DST = config.ONNX_MODEL_PATH


def main():
    print(f"Loading Keras model from {SRC} ...")
    model = keras.models.load_model(SRC)

    print("Building the model graph ...")
    model(np.zeros((1, *config.INPUT_SHAPE), dtype=np.float32))

    print(f"Exporting ONNX to {DST} ...")
    model.export(DST, format="onnx")

    size = os.path.getsize(DST)
    print(f"Done: {DST} ({size / 1e6:.2f} MB)")


if __name__ == "__main__":
    main()
