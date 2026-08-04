"""
Generate a random-weight placeholder model at backend/model/best_model.keras.

This makes the web application runnable end-to-end before a real model has
been trained. Predictions from this placeholder are NOT meaningful.

The architecture mirrors ``Sound_Classifier.ipynb`` (MobileNetV2 transfer
learning, 224x224 grayscale input) so preprocessing stays aligned.

Replace the generated file with your trained model for real classification.
"""

import os

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

from backend import config


def build_model(num_classes=len(config.CLASS_NAMES)):
    """Build the notebook's MobileNetV2 transfer-learning architecture."""
    inputs = keras.Input(shape=config.INPUT_SHAPE)
    x = layers.Conv2D(3, (3, 3), padding="same")(inputs)

    base_model = tf.keras.applications.MobileNetV2(
        input_shape=(config.INPUT_SHAPE[0], config.INPUT_SHAPE[1], 3),
        include_top=False,
        weights=None,  # random initialisation
    )
    base_model.trainable = False

    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(256, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = keras.Model(inputs, outputs)
    model.compile(
        optimizer="adam",
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    os.makedirs(config.MODEL_DIR, exist_ok=True)
    model = build_model()
    model.save(config.MODEL_PATH)
    print(f"Placeholder model saved to {config.MODEL_PATH}")
    print("WARNING: predictions from this model are random. Train a real model")
    print("and replace this file before relying on the results.")


if __name__ == "__main__":
    main()
