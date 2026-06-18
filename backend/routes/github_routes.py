from flask import Blueprint, jsonify
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from config import Config
from services.github_service import fetch_github_contributions
from services.db import get_collection, mongo_error_response, now_iso, serialize_document


github_bp = Blueprint("github", __name__)


def _settings():
    return get_collection("settings")


def _save_github_status(value: dict) -> dict:
    timestamp = now_iso()
    return _settings().find_one_and_update(
        {"key": "github"},
        {
            "$set": {
                "value": value,
                "updatedAt": timestamp,
            },
            "$setOnInsert": {
                "key": "github",
                "createdAt": timestamp,
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )


@github_bp.get("/contributions")
def get_github_contributions():
    if not Config.GITHUB_TOKEN:
        pending = {
            "login": Config.GITHUB_USERNAME,
            "isConnected": False,
            "syncWebhook": False,
            "totalContributions": 0,
            "days": [],
        }

        try:
            setting = _save_github_status(pending)
            return jsonify(
                {
                    "status": "pending",
                    "message": "GITHUB_TOKEN belum diset di backend.",
                    "user": {
                        "login": Config.GITHUB_USERNAME,
                        "name": None,
                        "avatarUrl": None,
                    },
                    "totalContributions": 0,
                    "days": [],
                    "meta": serialize_document(setting),
                }
            )
        except PyMongoError as error:
            body, status = mongo_error_response(error)
            return jsonify(body), status

    try:
        data = fetch_github_contributions(Config.GITHUB_USERNAME, Config.GITHUB_TOKEN)
        setting = _save_github_status(
            {
                "login": data["user"]["login"],
                "name": data["user"]["name"],
                "avatarUrl": data["user"]["avatarUrl"],
                "isConnected": True,
                "syncWebhook": True,
                "totalContributions": data["totalContributions"],
                "days": data["days"],
            }
        )
        return jsonify({"status": "success", **data, "meta": serialize_document(setting)})
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status
    except Exception as error:
        cached = _settings().find_one({"key": "github"})
        cached_value = cached.get("value", {}) if cached else {}
        cached_days = cached_value.get("days") if isinstance(cached_value.get("days"), list) else []
        cached_login = str(cached_value.get("login") or Config.GITHUB_USERNAME)
        cached_name = cached_value.get("name")
        cached_avatar = cached_value.get("avatarUrl")
        cached_total = int(cached_value.get("totalContributions") or 0)
        cached_connected = bool(cached_value.get("isConnected")) or bool(cached_login)

        if cached_connected:
            return jsonify(
                {
                    "status": "success",
                    "message": "Menggunakan cache kontribusi GitHub terakhir.",
                    "user": {
                        "login": cached_login,
                        "name": cached_name,
                        "avatarUrl": cached_avatar,
                    },
                    "totalContributions": cached_total,
                    "days": cached_days,
                    "isConnected": True,
                    "meta": serialize_document(cached) if cached else None,
                    "fallback": True,
                    "detail": str(error),
                }
            )

        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Gagal mengambil kontribusi GitHub.",
                    "detail": str(error),
                }
            ),
            500,
        )
