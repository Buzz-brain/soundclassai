"""
Configuration module.

Centralises every tunable value used across the application.

IMPORTANT: every audio-preprocessing value below mirrors the training
pipeline in ``Sound_Classifier.ipynb`` EXACTLY:

    librosa.load(path, sr=22050, duration=4.0)
    librosa.feature.melspectrogram(y, sr=22050, n_mels=224,
                                   n_fft=2048, hop_length=512)
    librosa.power_to_db(S, ref=np.max)
    -> pad/truncate time axis to 224 columns
    -> min-max normalise to [0, 1]
    -> input tensor (224, 224, 1)

Changing any value here without retraining the model breaks predictions.
"""

import os

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Directory that stores the trained Keras model.
MODEL_DIR = os.path.join(BASE_DIR, "backend", "model")

# Weights of the trained MobileNetV2 classifier.
MODEL_PATH = os.path.join(MODEL_DIR, "best_model.keras")

# Directory where uploaded audio files are temporarily stored.
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

# Directory that serves static assets (CSS / JS) to the browser.
STATIC_FOLDER = os.path.join(BASE_DIR, "static")

# Directory containing the custom front-end (index.html + assets).
FRONTEND_FOLDER = os.path.join(BASE_DIR, "frontend")

# ---------------------------------------------------------------------------
# Audio preprocessing — MUST match Sound_Classifier.ipynb training pipeline.
# ---------------------------------------------------------------------------
SAMPLE_RATE = 22050          # librosa.load(..., sr=22050)
AUDIO_DURATION = 4.0         # librosa.load(..., duration=4.0) — first 4s.
TARGET_SAMPLES = int(SAMPLE_RATE * AUDIO_DURATION)

N_MELS = 224                 # n_mels=224 in the notebook.
N_FFT = 2048                 # n_fft=2048 in the notebook.
HOP_LENGTH = 512             # hop_length=512 in the notebook.
FMIN = 0                     # librosa default fmin=None -> 0 Hz.
FMAX = SAMPLE_RATE // 2      # librosa default fmax=None -> Nyquist.

# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
# Output class order MUST match ``flow_from_directory`` alphabetical sort
# observed during training: ['car_horn', 'dog_bark', 'engine_idling',
# 'siren', 'street_music'].
CLASS_NAMES = [
    "Car Horn",
    "Dog Bark",
    "Engine Idling",
    "Siren",
    "Street Music",
]

INPUT_SHAPE = (N_MELS, 224, 1)  # (height, width, channels) — 224x224x1.

MODEL_NAME = "MobileNetV2"
MODEL_FRAMEWORK = "TensorFlow / Keras"
MODEL_LEARNING = "Transfer Learning"
MODEL_INPUT_TYPE = "Mel Spectrogram"

# Reported by the notebook evaluation cell (Cell 17).
TEST_ACCURACY = 85.78

# ---------------------------------------------------------------------------
# Upload validation
# ---------------------------------------------------------------------------
ALLOWED_EXTENSIONS = {"wav", "mp3"}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB.
MIN_AUDIO_DURATION = 0.5               # Seconds, below this we reject the file.

# ---------------------------------------------------------------------------
# ffmpeg (needed for MP3 decoding via pydub)
# ---------------------------------------------------------------------------
FFMPEG_PATH = os.path.join(BASE_DIR, "ffmpeg", "ffmpeg.exe")
