from datetime import datetime, timezone

from flask import Blueprint, jsonify
from pymongo.errors import PyMongoError

from services.db import ping_database


health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    database = None
    status = "success"
    code = 200

    try:
        database = ping_database()
    except PyMongoError as error:
        status = "error"
        code = 503
        database = {
            "connected": False,
            "message": "MongoDB belum tersambung.",
            "detail": str(error),
        }

    return jsonify(
        {
            "status": status,
            "service": "ikhsan-portfolio-backend",
            "message": "Backend portfolio aktif.",
            "database": database,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    ), code
