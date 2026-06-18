import logging
import os
import time
import uuid
from typing import Any

from flask import Flask, g, jsonify, request
from flask_cors import CORS

from config import Config
from routes.auth_routes import auth_bp
from routes.contact_routes import contact_bp
from routes.dashboard_routes import dashboard_bp
from routes.github_routes import github_bp
from routes.health_routes import health_bp
from routes.project_routes import projects_bp
from routes.settings_routes import settings_bp
from services.db import ensure_indexes, ping_database, redact_mongo_uri


SENSITIVE_KEYS = {
    "authorization",
    "cookie",
    "mongo_uri",
    "password",
    "secret",
    "session",
    "token",
}


def redact_sensitive(value: Any) -> Any:
    if isinstance(value, dict):
        redacted = {}
        for key, item in value.items():
            lowered = str(key).lower()
            redacted[key] = "***redacted***" if any(secret in lowered for secret in SENSITIVE_KEYS) else redact_sensitive(item)
        return redacted
    if isinstance(value, list):
        return [redact_sensitive(item) for item in value]
    return value


def configure_logging(app: Flask) -> None:
    level = getattr(logging, Config.LOG_LEVEL.upper(), logging.INFO)
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    app.logger.handlers.clear()
    app.logger.setLevel(level)
    app.logger.propagate = False

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    app.logger.addHandler(stream_handler)

    if Config.API_LOG_FILE:
        log_file = Config.API_LOG_FILE
        if not os.path.isabs(log_file):
            log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), log_file)
        os.makedirs(os.path.dirname(log_file), exist_ok=True)

        file_handler = logging.FileHandler(log_file, encoding="utf-8")
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)

    logging.getLogger("werkzeug").setLevel(logging.WARNING)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    configure_logging(app)

    is_main_process = os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not Config.DEBUG

    if is_main_process:
        app.logger.info(
            "Backend starting host=%s port=%s debug=%s",
            Config.HOST,
            Config.PORT,
            Config.DEBUG,
        )
        app.logger.info("MongoDB connecting...")

    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}})

    @app.before_request
    def log_api_request():
        if not request.path.startswith("/api"):
            return

        g.request_started_at = time.perf_counter()
        g.request_id = uuid.uuid4().hex[:8]

        body = None
        if Config.API_LOG_BODY and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            if request.is_json:
                body = redact_sensitive(request.get_json(silent=True) or {})
            elif request.form:
                body = redact_sensitive(request.form.to_dict(flat=False))

        g.request_body = body
        g.request_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "-").split(",")[0].strip()

    @app.after_request
    def log_api_response(response):
        if request.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            response.headers["Surrogate-Control"] = "no-store"

            started_at = getattr(g, "request_started_at", time.perf_counter())
            duration_ms = (time.perf_counter() - started_at) * 1000
            request_id = getattr(g, "request_id", "-")
            ip_address = getattr(g, "request_ip", "-")
            body = getattr(g, "request_body", None)

            app.logger.info(
                "API id=%s %s %s - status=%s (%.1fms) ip=%s body=%s",
                request_id,
                request.method,
                request.full_path.rstrip("?"),
                response.status_code,
                duration_ms,
                ip_address,
                body if body is not None else "-",
            )
        return response

    @app.teardown_request
    def log_api_exception(error):
        if error and request.path.startswith("/api"):
            request_id = getattr(g, "request_id", "-")
            app.logger.error(
                "API !! id=%s %s %s error=%s",
                request_id,
                request.method,
                request.full_path.rstrip("?"),
                error,
                exc_info=(type(error), error, error.__traceback__),
            )

    if is_main_process:
        with app.app_context():
            try:
                database_info = ping_database()
                app.logger.info(
                    "MongoDB connected database=%s uri=%s",
                    database_info["database"],
                    database_info["uri"],
                )
                ensure_indexes()
                app.logger.info("MongoDB indexes ready collections=projects,contact_messages,settings,sessions")
            except Exception as error:
                # Server tetap hidup; endpoint health akan melaporkan detail koneksi MongoDB.
                app.logger.error("MongoDB startup check failed: %s", error)

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(projects_bp, url_prefix="/api/projects")
    app.register_blueprint(contact_bp, url_prefix="/api/contact")
    app.register_blueprint(github_bp, url_prefix="/api/github")
    app.register_blueprint(settings_bp, url_prefix="/api")
    if is_main_process:
        app.logger.info("API routes ready prefix=/api")

    @app.get("/")
    def index():
        return jsonify(
            {
                "service": "ikhsan-portfolio-backend",
                "status": "online",
                "docs": "/api/health",
            }
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG, use_reloader=False)
