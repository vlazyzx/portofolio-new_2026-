import secrets

from flask import Blueprint, jsonify, request
from pymongo.errors import PyMongoError

from config import Config
from services.auth import create_session, delete_session, get_bearer_token, get_current_session
from services.db import mongo_error_response, serialize_document


auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = str(payload.get("email", "")).strip()
    password = str(payload.get("password", "")).strip()

    if email != Config.ADMIN_EMAIL or password != Config.ADMIN_PASSWORD:
        return jsonify({"status": "error", "message": "Email atau password admin salah."}), 401

    token = secrets.token_urlsafe(32)

    try:
        session = create_session(email, token)
        return jsonify(
            {
                "status": "success",
                "message": "Login berhasil.",
                "token": token,
                "user": {
                    "id": "admin",
                    "email": email,
                    "name": Config.ADMIN_NAME,
                    "role": "admin",
                },
                "session": serialize_document(session),
            }
        )
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        body["message"] = "Login belum bisa diproses karena MongoDB belum tersambung."
        return jsonify(body), status


@auth_bp.get("/me")
def me():
    session = get_current_session()

    if session is None:
        return jsonify({"status": "error", "message": "Sesi admin berakhir atau token tidak valid."}), 401

    return jsonify(
        {
            "status": "success",
            "user": {
                "id": "admin",
                "email": session["email"],
                "name": Config.ADMIN_NAME,
                "role": "admin",
            },
            "session": serialize_document(session),
        }
    )


@auth_bp.post("/logout")
def logout():
    token = get_bearer_token()
    if token:
        try:
            delete_session(token)
        except PyMongoError:
            return jsonify({"status": "error", "message": "Gagal menghapus sesi admin."}), 500

    return jsonify({"status": "success", "message": "Logout berhasil."})
