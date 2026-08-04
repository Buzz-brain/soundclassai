"""
Application entry point.

Creates the Flask app, registers the API blueprint and serves the
custom front end. Run with:

    python app.py

The server listens on http://127.0.0.1:5000 by default.
"""

import logging
import os

from flask import Flask, send_from_directory

from backend import config
from backend.predictor import get_classifier, warm_up
from backend.routes import api
from backend.utils import ensure_directory

# Configure structured logging once, at import time.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
log = logging.getLogger(__name__)

# Flask needs to know where its (empty) static folder lives before the
# first request, otherwise it refuses to start in some environments.
ensure_directory(config.STATIC_FOLDER)
ensure_directory(config.UPLOAD_FOLDER)


def create_app():
    """
    Application factory.

    Keeps setup side-effect free until `create_app()` is called, which
    makes the project easy to test with Flask's test client.
    """
    app = Flask(
        __name__,
        static_folder=config.STATIC_FOLDER,
        static_url_path="/static",
    )

    app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH
    app.config["UPLOAD_FOLDER"] = config.UPLOAD_FOLDER

    app.register_blueprint(api, url_prefix="/api")

    @app.route("/")
    def index():
        """Serve the single-page front end."""
        return send_from_directory(config.FRONTEND_FOLDER, "index.html")

    @app.route("/css/<path:filename>")
    def css(filename):
        """Serve front-end stylesheets."""
        return send_from_directory(os.path.join(config.FRONTEND_FOLDER, "css"), filename)

    @app.route("/js/<path:filename>")
    def js(filename):
        """Serve front-end scripts."""
        return send_from_directory(os.path.join(config.FRONTEND_FOLDER, "js"), filename)

    @app.route("/assets/<path:filename>")
    def assets(filename):
        """Serve front-end images and icons."""
        return send_from_directory(os.path.join(config.FRONTEND_FOLDER, "assets"), filename)

    @app.errorhandler(413)
    def file_too_large(_error):
        """Reply with a clean message when an upload exceeds the limit."""
        return (
            {
                "status": "error",
                "code": "TOO_LARGE",
                "message": "The file is too large. Maximum size is 16 MB.",
            },
            413,
        )

    @app.errorhandler(404)
    def not_found(_error):
        return ({"status": "error", "code": "NOT_FOUND", "message": "Endpoint not found."}, 404)

    @app.errorhandler(500)
    def internal_error(_error):
        log.exception("Unhandled server error")
        return (
            {
                "status": "error",
                "code": "SERVER",
                "message": "An unexpected server error occurred.",
            },
            500,
        )

    # Pre-load the CNN so the first prediction is not slow.
    log.info("Warming up CNN model from %s", config.MODEL_PATH)
    warm_up()
    log.info("Model warm-up finished (loaded=%s)", get_classifier() is not None)

    return app


app = create_app()


if __name__ == "__main__":
    # host=0.0.0.0 exposes the app to the local network, useful for
    # demos. Port/host/debug come from the environment so the same entry
    # point works on Render (PORT is injected there). Disable the
    # reloader to avoid loading the model twice.
    debug = os.environ.get("FLASK_DEBUG", "0").lower() in {"1", "true", "yes"}
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5000"))
    app.run(debug=debug, host=host, port=port, use_reloader=False)
