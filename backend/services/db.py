from datetime import datetime, timezone
from typing import Any, Dict, Iterable, Optional

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError

from config import Config


client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=2500)
db: Database = client[Config.MONGO_DATABASE]


def ping_database() -> Dict[str, Any]:
    client.admin.command("ping")
    return {
        "connected": True,
        "database": Config.MONGO_DATABASE,
        "uri": redact_mongo_uri(Config.MONGO_URI),
    }


def get_collection(name: str) -> Collection:
    return db[name]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def serialize_document(document: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if document is None:
        return None

    serialized: Dict[str, Any] = {}
    for key, value in document.items():
        if key == "_id":
            serialized["_id"] = str(value)
        elif isinstance(value, ObjectId):
            serialized[key] = str(value)
        elif isinstance(value, datetime):
            serialized[key] = value.isoformat()
        elif isinstance(value, list):
            serialized[key] = [
                serialize_document(item) if isinstance(item, dict) else item for item in value
            ]
        elif isinstance(value, dict):
            serialized[key] = serialize_document(value)
        else:
            serialized[key] = value

    return serialized


def serialize_documents(documents: Iterable[Dict[str, Any]]) -> list[Dict[str, Any]]:
    return [serialize_document(document) for document in documents if document is not None]


def ensure_indexes() -> None:
    get_collection("projects").create_index([("id", ASCENDING)], unique=True)
    get_collection("projects").create_index([("slug", ASCENDING)], unique=True, sparse=True)
    get_collection("contact_messages").create_index([("id", ASCENDING)], unique=True)
    get_collection("contact_messages").create_index([("createdAt", DESCENDING)])
    get_collection("settings").create_index([("key", ASCENDING)], unique=True)
    get_collection("sessions").create_index([("token", ASCENDING)], unique=True)


def mongo_error_response(error: Exception) -> tuple[Dict[str, Any], int]:
    detail = str(error)
    hint = (
        "Kalau memakai MongoDB Atlas, cek Network Access/IP whitelist, pastikan cluster aktif, "
        "dan pastikan MONGO_URI di backend/.env adalah connection string yang benar."
    )
    return (
        {
            "status": "error",
            "message": "MongoDB belum tersambung, jadi data admin belum bisa dipakai.",
            "hint": hint,
            "detail": detail,
        },
        503,
    )


def is_mongo_error(error: Exception) -> bool:
    return isinstance(error, PyMongoError)


def redact_mongo_uri(uri: str) -> str:
    if "@" not in uri or "://" not in uri:
        return uri
    scheme, rest = uri.split("://", 1)
    host = rest.split("@", 1)[1]
    return f"{scheme}://***:***@{host}"
