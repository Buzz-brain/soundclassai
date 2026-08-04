"""
Small, dependency-free helpers shared across the application.

These utilities deal with file names, safe directory creation and
validating uploaded audio files before they reach the model.
"""

import os

from werkzeug.utils import secure_filename

from backend import config


def allowed_file(filename):
    """
    Return True when a filename carries a whitelisted extension.

    Args:
        filename (str): Original file name coming from the upload form.

    Returns:
        bool: True if the extension is in config.ALLOWED_EXTENSIONS.
    """
    if not filename or "." not in filename:
        return False
    extension = filename.rsplit(".", 1)[1].lower()
    return extension in config.ALLOWED_EXTENSIONS


def safe_join_path(*parts):
    """Join path parts after ensuring every segment is safe to use."""
    return os.path.join(*[secure_filename(p) if not os.path.isabs(p) else p for p in parts])


def ensure_directory(path):
    """
    Create a directory (and parents) when it does not exist yet.

    Args:
        path (str): Directory to create.

    Returns:
        str: The same path, for convenience.
    """
    os.makedirs(path, exist_ok=True)
    return path


def save_upload(file_storage, upload_folder=None):
    """
    Persist an uploaded file to disk with a safe, collision-free name.

    Args:
        file_storage: A Werkzeug FileStorage object (request.files entry).
        upload_folder (str, optional): Destination directory.

    Returns:
        str: Absolute path of the saved file.
    """
    folder = upload_folder or config.UPLOAD_FOLDER
    ensure_directory(folder)
    safe_name = secure_filename(file_storage.filename or "audio.wav")
    destination = os.path.join(folder, safe_name)
    file_storage.save(destination)
    return destination


def cleanup_file(path):
    """
    Delete a file from disk, ignoring any failure (best effort).

    Args:
        path (str): File path to remove.
    """
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
