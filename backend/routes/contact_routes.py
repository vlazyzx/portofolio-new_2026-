from uuid import uuid4

from flask import Blueprint, jsonify, request
from pymongo import DESCENDING, ReturnDocument
from pymongo.errors import PyMongoError

from services.db import get_collection, mongo_error_response, now_iso, serialize_document


contact_bp = Blueprint("contact", __name__)


def _messages():
    return get_collection("contact_messages")


def _normalize_message(document: dict) -> dict:
    data = serialize_document(document)
    data["name"] = data.get("name") or data.get("sender", "")
    data["sender"] = data.get("sender") or data.get("name", "")
    data["message"] = data.get("message") or data.get("content", "")
    data["content"] = data.get("content") or data.get("message", "")
    data["read"] = bool(data.get("read", not data.get("isUnread", False)))
    data["isUnread"] = bool(data.get("isUnread", not data["read"]))
    data["createdAt"] = data.get("createdAt") or data.get("timestamp") or now_iso()
    data["timestamp"] = data.get("timestamp") or data.get("createdAt")
    return data


@contact_bp.get("/messages")
def get_contact_messages():
    try:
        data = [_normalize_message(item) for item in _messages().find().sort("createdAt", DESCENDING)]
        return jsonify({"status": "success", "total": len(data), "data": data})
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@contact_bp.post("/messages")
def create_contact_message():
    payload = request.get_json(silent=True) or {}
    required_fields = ("name", "email", "message")
    missing_fields = [field for field in required_fields if not str(payload.get(field, "")).strip()]

    if missing_fields:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Lengkapi nama, email, dan pesan.",
                    "missingFields": missing_fields,
                }
            ),
            400,
        )

    timestamp = now_iso()
    name = str(payload.get("name", "")).strip()
    content = str(payload.get("message", "")).strip()
    message = {
        "id": f"msg-{uuid4().hex[:10]}",
        "name": name,
        "sender": name,
        "email": str(payload.get("email", "")).strip(),
        "subject": str(payload.get("subject", "Pesan dari portfolio")).strip() or "Pesan dari portfolio",
        "message": content,
        "content": content,
        "timestamp": timestamp,
        "createdAt": timestamp,
        "updatedAt": timestamp,
        "read": False,
        "isUnread": True,
    }

    try:
        _messages().insert_one(message)
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Pesan diterima dan disimpan ke MongoDB.",
                    "data": _normalize_message(message),
                }
            ),
            202,
        )
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@contact_bp.patch("/messages/<message_id>/read")
def mark_contact_message_read(message_id: str):
    try:
        result = _messages().find_one_and_update(
            {"id": message_id},
            {"$set": {"read": True, "isUnread": False, "updatedAt": now_iso()}},
            return_document=ReturnDocument.AFTER,
        )
        if result is None:
            return jsonify({"status": "error", "message": "Pesan tidak ditemukan."}), 404

        return jsonify({"status": "success", "data": _normalize_message(result)})
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@contact_bp.delete("/messages/<message_id>")
def delete_contact_message(message_id: str):
    try:
        result = _messages().delete_one({"id": message_id})
        if result.deleted_count == 0:
            return jsonify({"status": "error", "message": "Pesan tidak ditemukan."}), 404

        return jsonify({"status": "success", "message": "Pesan dihapus dari MongoDB."})
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status
