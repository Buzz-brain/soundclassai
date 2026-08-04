"""
Audio preprocessing pipeline.

Replicates the training preprocessing from ``Sound_Classifier.ipynb``
exactly so inference sees the same distribution the model learned on:

    input audio
        -> librosa.load(path, sr=22050, duration=4.0)     (first 4 s)
        -> melspectrogram(y, n_mels=224, n_fft=2048, hop_length=512)
        -> power_to_db(S, ref=np.max)
        -> pad/truncate time axis to 224 columns
        -> min-max normalise to [0, 1]
        -> tensor of shape (224, 224, 1)
"""

import io
import os
import warnings

import librosa
import numpy as np

from backend import config

# librosa emits harmless "PySoundFile failed" warnings for some containers.
warnings.filterwarnings("ignore", category=UserWarning)

# Lazy import pydub only when needed.
_pydub_available = None


def _get_pydub():
    """Return the pydub module or None if unavailable."""
    global _pydub_available
    if _pydub_available is None:
        try:
            from pydub import AudioSegment as _AS
            # Configure ffmpeg path if it exists on disk.
            if os.path.isfile(config.FFMPEG_PATH):
                _AS.converter = config.FFMPEG_PATH
            _pydub_available = _AS
        except ImportError:
            _pydub_available = False
    return _pydub_available if _pydub_available is not False else None


def _decode_with_pydub(path):
    """
    Decode an MP3 (or other format) to a numpy waveform via pydub/ffmpeg.

    Returns a 1-D mono float32 array resampled to config.SAMPLE_RATE,
    or raises on failure.
    """
    AudioSegment = _get_pydub()
    if AudioSegment is None:
        raise RuntimeError("pydub not available")

    audio = AudioSegment.from_file(path)
    audio = audio.set_frame_rate(config.SAMPLE_RATE).set_channels(1).set_sample_width(2)
    samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
    return samples / 32768.0


class AudioLoadError(Exception):
    """Raised when an audio file cannot be decoded or is too short."""


def load_audio(path):
    """
    Load the FIRST ``config.AUDIO_DURATION`` seconds of an audio file.

    Identical to ``librosa.load(path, sr=22050, duration=4.0)`` used in
    the training notebook: files longer than 4 s are truncated at the
    beginning; shorter files are returned whole (padded later).

    For MP3 files where soundfile fails, pydub+ffmpeg is used as a
    fallback decoder, then the first 4 s are trimmed in numpy.

    Args:
        path (str): Absolute path of the audio file.

    Returns:
        np.ndarray: 1-D mono float waveform resampled to SAMPLE_RATE.

    Raises:
        AudioLoadError: When decoding fails or audio is too short.
    """
    y = None
    try:
        # NOTE: res_type is intentionally NOT overridden — the notebook
        # calls librosa.load(path, sr=22050, duration=4.0) and relies on
        # the library default (soxr_hq on librosa >= 0.11). Overriding it
        # with "kaiser_best" previously required the optional "resampy"
        # package and crashed on non-22050 Hz uploads.
        y, _ = librosa.load(
            path,
            sr=config.SAMPLE_RATE,
            mono=True,
            duration=config.AUDIO_DURATION,
        )
    except Exception:
        # librosa/soundfile failed — try pydub fallback for MP3.
        ext = os.path.splitext(path)[1].lower()
        if ext == ".mp3":
            try:
                full = _decode_with_pydub(path)
                max_samples = int(config.SAMPLE_RATE * config.AUDIO_DURATION)
                y = full[:max_samples]
            except Exception as pydub_exc:
                raise AudioLoadError(
                    "The audio file could not be decoded. "
                    "Please upload a valid WAV or MP3 file."
                ) from pydub_exc
        else:
            raise AudioLoadError(
                "The audio file could not be decoded. Please upload a valid WAV or MP3 file."
            )

    if len(y) == 0:
        raise AudioLoadError("The audio file is empty.")

    duration = len(y) / config.SAMPLE_RATE
    if duration < config.MIN_AUDIO_DURATION:
        raise AudioLoadError(
            "The audio file is too short. Minimum duration is "
            f"{config.MIN_AUDIO_DURATION:.1f} seconds."
        )

    return y


def to_mel_spectrogram(y):
    """
    Build a power Mel spectrogram using the notebook's exact parameters.

    Args:
        y (np.ndarray): 1-D waveform.

    Returns:
        np.ndarray: Power spectrogram of shape (N_MELS, frames).
    """
    return librosa.feature.melspectrogram(
        y=y,
        sr=config.SAMPLE_RATE,
        n_mels=config.N_MELS,
        n_fft=config.N_FFT,
        hop_length=config.HOP_LENGTH,
        fmin=config.FMIN,
        fmax=config.FMAX,
    )


def to_db(spectrogram):
    """
    Convert power to decibel scale, exactly as training did.

    Args:
        spectrogram (np.ndarray): Power Mel spectrogram.

    Returns:
        np.ndarray: dB-scaled spectrogram.
    """
    return librosa.power_to_db(spectrogram, ref=np.max)


def fixed_width(spectrogram):
    """
    Pad or truncate the time axis to the notebook's width (224).

    Mirror of the notebook logic:
        if S_db.shape[1] < 224:  pad the right side with zeros.
        else:                    keep the first 224 columns.

    Args:
        spectrogram (np.ndarray): 2-D dB spectrogram.

    Returns:
        np.ndarray: Spectrogram of shape (N_MELS, 224).
    """
    width = config.INPUT_SHAPE[1]
    _, frames = spectrogram.shape

    if frames < width:
        return np.pad(spectrogram, ((0, 0), (0, width - frames)), mode="constant")
    return spectrogram[:, :width]


def normalize(spectrogram):
    """
    Min-max normalise to [0, 1], exactly as the notebook's inference code.

    Args:
        spectrogram (np.ndarray): dB spectrogram.

    Returns:
        np.ndarray: Normalised spectrogram.
    """
    min_value = float(np.min(spectrogram))
    max_value = float(np.max(spectrogram))
    if max_value - min_value < 1e-9:
        return np.zeros_like(spectrogram)
    return (spectrogram - min_value) / (max_value - min_value)


def extract_features(path):
    """
    Full preprocessing pipeline: audio file -> model-ready tensor.

    Args:
        path (str): Absolute path of the audio file.

    Returns:
        np.ndarray: Float32 array of shape config.INPUT_SHAPE.

    Raises:
        AudioLoadError: On decode or duration errors.
    """
    y = load_audio(path)
    spectrogram = to_mel_spectrogram(y)
    spectrogram = to_db(spectrogram)
    spectrogram = fixed_width(spectrogram)
    spectrogram = normalize(spectrogram)

    # Add the single grayscale channel: (224, 224) -> (224, 224, 1).
    return spectrogram[..., np.newaxis].astype(np.float32)


def warm_audio_pipeline():
    """
    Pre-compile librosa's numba kernels at startup.

    librosa JIT-compiles its DSP helpers (STFT, mel filterbank) lazily on
    the FIRST call. Doing that during a live request — on top of the model
    — previously spiked memory past Render's 512 MB free tier and the OS
    OOM-killed the worker. Running one mel spectrogram here, before the
    server takes traffic, moves that cost out of the request path.
    """
    silence = np.zeros(int(config.SAMPLE_RATE * 1.0), dtype=np.float32)
    to_mel_spectrogram(silence)
