from datetime import datetime, timedelta, timezone

from flask import request
from pymongo.errors import PyMongoError

from config import Config
from services.db import get_collection, now_iso


def parse_iso_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def create_session(email: str, token: str) -> dict:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=Config.ADMIN_SESSION_MAX_AGE_MINUTES)

    session = {
        "email": email,
        "token": token,
        "createdAt": now.isoformat(),
        "lastActiveAt": now.isoformat(),
        "expiresAt": expires_at.isoformat(),
    }
    get_collection("sessions").insert_one(session)
    return session


def get_bearer_token() -> str:
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return ""
    return header.replace("Bearer ", "", 1).strip()


def is_session_expired(session: dict) -> bool:
    now = datetime.now(timezone.utc)

    expires_at = parse_iso_datetime(session.get("expiresAt"))
    if expires_at and now >= expires_at:
        return True

    last_active_at = parse_iso_datetime(session.get("lastActiveAt"))
    if last_active_at and now >= last_active_at + timedelta(minutes=Config.ADMIN_IDLE_TIMEOUT_MINUTES):
        return True

    return False


def touch_session(token: str) -> str:
    last_active_at = now_iso()
    get_collection("sessions").update_one(
        {"token": token},
        {"$set": {"lastActiveAt": last_active_at}},
    )
    return last_active_at


def delete_session(token: str) -> None:
    get_collection("sessions").delete_one({"token": token})


def get_current_session() -> dict | None:
    token = get_bearer_token()
    if not token:
        return None

    try:
        session = get_collection("sessions").find_one({"token": token})
        if session is None:
            return None

        if is_session_expired(session):
            delete_session(token)
            return None

        session["lastActiveAt"] = touch_session(token)
        return session
    except PyMongoError:
        return None
