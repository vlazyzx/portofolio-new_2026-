import logging

from flask import Blueprint, jsonify
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from config import Config
from services.github_service import fetch_github_contributions
from services.db import get_collection, mongo_error_response, now_iso, serialize_document


github_bp = Blueprint("github", __name__)
LOGGER = logging.getLogger(__name__)


def _settings():
    return get_collection("settings")


def _save_github_status(value: dict) -> dict:
    timestamp = now_iso()
    value["fetchedAt"] = value.get("fetchedAt") or timestamp
    value["source"] = value.get("source") or "live"
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
                "fetchedAt": data.get("fetchedAt"),
                "source": data.get("source", "live"),
            }
        )
        LOGGER.info(
            "GitHub contributions live saved username=%s total=%s days=%s fetchedAt=%s",
            data["user"]["login"],
            data["totalContributions"],
            len(data["days"]),
            data.get("fetchedAt"),
        )
        return jsonify({"status": "success", **data, "isConnected": True, "meta": serialize_document(setting)})
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
        cached_fetched_at = cached_value.get("fetchedAt")
        cached_source = cached_value.get("source") or "cache"

        if cached_connected and not cached_fetched_at and cached:
            cached_fetched_at = now_iso()
            _settings().update_one(
                {"key": "github"},
                {"$set": {"value.fetchedAt": cached_fetched_at, "updatedAt": cached_fetched_at}},
            )

        if cached_connected:
            LOGGER.warning(
                "GitHub contributions fallback cache used username=%s total=%s days=%s fetchedAt=%s error=%s",
                cached_login,
                cached_total,
                len(cached_days),
                cached_fetched_at,
                error,
            )
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
                    "fetchedAt": cached_fetched_at,
                    "source": cached_source,
                    "meta": serialize_document(cached) if cached else None,
                    "fallback": True,
                    "detail": str(error),
                }
            )

        LOGGER.error("GitHub contributions live fetch failed without usable cache error=%s", error)
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
