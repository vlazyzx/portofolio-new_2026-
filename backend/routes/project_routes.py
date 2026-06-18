from uuid import uuid4

from flask import Blueprint, jsonify, request
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError, PyMongoError

from services.db import get_collection, mongo_error_response, now_iso, serialize_document, serialize_documents


projects_bp = Blueprint("projects", __name__)


def _projects():
    return get_collection("projects")


def _normalize_project(payload: dict, existing: dict | None = None) -> dict:
    title = str(payload.get("title", existing.get("title", "") if existing else "")).strip()
    slug = str(payload.get("slug", existing.get("slug", "") if existing else "")).strip()
    stack = payload.get("stack", existing.get("stack", []) if existing else [])
    tech_stack = payload.get("techStack", existing.get("techStack", stack) if existing else stack)
    live_url = str(payload.get("liveUrl", existing.get("liveUrl", "") if existing else "")).strip()
    demo_url = str(payload.get("demoUrl", existing.get("demoUrl", live_url) if existing else live_url)).strip()
    github_url = str(payload.get("githubUrl", existing.get("githubUrl", "") if existing else "")).strip()
    repo_url = str(payload.get("repoUrl", existing.get("repoUrl", github_url) if existing else github_url)).strip()
    featured = bool(payload.get("featured", existing.get("featured", False) if existing else False))
    is_featured = bool(payload.get("isFeatured", existing.get("isFeatured", featured) if existing else featured))

    if not slug and title:
        slug = "-".join(title.lower().split())

    return {
        "title": title,
        "slug": slug,
        "description": str(payload.get("description", existing.get("description", "") if existing else "")).strip(),
        "longDescription": str(
            payload.get("longDescription", existing.get("longDescription", "") if existing else "")
        ).strip(),
        "category": payload.get("category", existing.get("category", "Other") if existing else "Other"),
        "stack": stack,
        "techStack": tech_stack,
        "images": payload.get("images", existing.get("images", []) if existing else []),
        "liveUrl": live_url,
        "demoUrl": demo_url,
        "githubUrl": github_url,
        "repoUrl": repo_url,
        "featured": featured,
        "isFeatured": is_featured,
        "status": payload.get("status", existing.get("status", "draft") if existing else "draft"),
    }


@projects_bp.get("")
@projects_bp.get("/")
def get_projects():
    try:
        cursor = _projects().find().sort("createdAt", DESCENDING)
        data = serialize_documents(cursor)
        return jsonify({"status": "success", "total": len(data), "data": data})
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@projects_bp.post("")
@projects_bp.post("/")
def create_project():
    payload = request.get_json(silent=True) or {}
    project = _normalize_project(payload)

    if not project["title"]:
        return jsonify({"status": "error", "message": "Judul project wajib diisi."}), 400

    timestamp = now_iso()
    project.update(
        {
            "id": payload.get("id") or f"project-{uuid4().hex[:10]}",
            "createdAt": timestamp,
            "updatedAt": timestamp,
        }
    )

    try:
        _projects().insert_one(project)
        return jsonify({"status": "success", "message": "Project disimpan ke MongoDB.", "data": serialize_document(project)}), 201
    except DuplicateKeyError:
        return jsonify({"status": "error", "message": "Project dengan id atau slug itu sudah ada."}), 409
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@projects_bp.get("/<project_id>")
def get_project(project_id: str):
    try:
        project = _projects().find_one({"id": project_id})
        if project is None:
            return jsonify({"status": "error", "message": "Project tidak ditemukan.", "data": None}), 404

        return jsonify({"status": "success", "data": serialize_document(project)})
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@projects_bp.patch("/<project_id>")
@projects_bp.put("/<project_id>")
def update_project(project_id: str):
    payload = request.get_json(silent=True) or {}

    try:
        existing = _projects().find_one({"id": project_id})
        if existing is None:
            return jsonify({"status": "error", "message": "Project tidak ditemukan."}), 404

        update = _normalize_project(payload, existing)
        update["updatedAt"] = now_iso()
        _projects().update_one({"id": project_id}, {"$set": update})
        updated = _projects().find_one({"id": project_id})
        return jsonify({"status": "success", "message": "Project diperbarui.", "data": serialize_document(updated)})
    except DuplicateKeyError:
        return jsonify({"status": "error", "message": "Slug project sudah dipakai."}), 409
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@projects_bp.delete("/<project_id>")
def delete_project(project_id: str):
    try:
        result = _projects().delete_one({"id": project_id})
        if result.deleted_count == 0:
            return jsonify({"status": "error", "message": "Project tidak ditemukan."}), 404

        return jsonify({"status": "success", "message": "Project dihapus dari MongoDB."})
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status
