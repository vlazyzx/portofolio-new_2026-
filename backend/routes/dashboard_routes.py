from flask import Blueprint, jsonify
from pymongo.errors import PyMongoError

from services.db import get_collection, mongo_error_response, now_iso


dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/stats")
def get_dashboard_stats():
    try:
        total_projects = get_collection("projects").count_documents({})
        total_messages = get_collection("contact_messages").count_documents({})
        unread_messages = get_collection("contact_messages").count_documents(
            {"$or": [{"read": False}, {"isUnread": True}]}
        )
        github_setting = get_collection("settings").find_one({"key": "github"})
        github_connected = bool(github_setting and github_setting.get("value", {}).get("isConnected"))

        return jsonify(
            {
                "status": "success",
                "data": {
                    "totalProjects": total_projects,
                    "totalMessages": total_messages,
                    "unreadMessages": unread_messages,
                    "githubConnected": github_connected,
                    "githubStatus": "connected" if github_connected else "disconnected",
                    "lastUpdated": now_iso(),
                },
            }
        )
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status
