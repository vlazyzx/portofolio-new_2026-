from flask import request
from pymongo.errors import PyMongoError

from services.db import get_collection, now_iso


def create_session(email: str, token: str) -> dict:
    session = {
        "email": email,
        "token": token,
        "createdAt": now_iso(),
    }
    get_collection("sessions").insert_one(session)
    return session


def get_bearer_token() -> str:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return ""
    return header.replace("Bearer ", "", 1).strip()


def get_current_session() -> dict | None:
    token = get_bearer_token()
    if not token:
        return None

    try:
        return get_collection("sessions").find_one({"token": token})
    except PyMongoError:
        return None
