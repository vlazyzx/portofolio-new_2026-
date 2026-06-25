from flask import Blueprint, jsonify, request
from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from services.auth import require_admin_session
from services.db import get_collection, mongo_error_response, now_iso, serialize_document
from services.media import MediaError, build_media_url, lanyard_directory, profile_directory, save_image_as_jpg, validate_image_reference


settings_bp = Blueprint("settings", __name__)


DEFAULT_HOME_EYEBROW = "Pengembang DevOps / Pengembang Backend"
DEFAULT_HOME_DESCRIPTION = "Saya adalah pelajar RPL yang tertarik pada web development, backend, dan full-stack development. Saya terbiasa menggunakan React, TypeScript, Python, Flask, MongoDB, dan Git untuk membuat aplikasi yang berguna, rapi, dan mudah digunakan."
DEFAULT_HOME_BADGE_SUBTITLE = "Backend / DevOps / Indonesia / Terbuka untuk kerja"

DEFAULT_HOME_CARDS = [
    {
        "id": "card-projects",
        "page": "projects",
        "tag": "Pilihan",
        "title": "Proyek Terbaru",
        "desc": "Kumpulan karya web, backend, dan eksperimen yang sedang saya bangun.",
        "meta": "Lihat proyek",
    },
    {
        "id": "card-about",
        "page": "about",
        "tag": "Profil",
        "title": "Tentang Saya",
        "desc": "Perjalanan belajar, skill inti, dan nilai kerja yang saya pegang.",
        "meta": "Kenal lebih dekat",
    },
    {
        "id": "card-student",
        "page": "student",
        "tag": "Akademik",
        "title": "Perjalanan Pelajar",
        "desc": "Ringkasan studi, pencapaian, dan fokus belajar saya saat ini.",
        "meta": "Lihat detail",
    },
    {
        "id": "card-contact",
        "page": "contact",
        "tag": "Kontak",
        "title": "Hubungi Saya",
        "desc": "Terbuka untuk diskusi project, kolaborasi, dan peluang kerja.",
        "meta": "Kirim pesan",
    },
]


def _settings():
    return get_collection("settings")


def _projects():
    return get_collection("projects")


def _get_setting(key: str) -> dict:
    return _settings().find_one({"key": key})


def _normalize_progress(value, minimum: float = 0, maximum: float = 100, *, allow_decimal: bool = False):
    try:
        numeric = float(value)
        clamped = max(minimum, min(maximum, numeric))
        return round(clamped, 1) if allow_decimal else int(round(clamped))
    except (TypeError, ValueError):
        return round(minimum, 1) if allow_decimal else int(minimum)


def _normalize_stat_value(key: str, value, fallback: str, minimum: float, maximum: float, *, allow_decimal: bool = False) -> str:
    if key == "completedProjects":
        return fallback

    raw = str(value or fallback).strip().replace(",", ".")
    if key == "learningYears":
        raw = raw.replace("+", "")
        numeric = _normalize_progress(raw, minimum, maximum)
        return f"{numeric}+"

    numeric = _normalize_progress(raw, minimum, maximum, allow_decimal=allow_decimal)
    return str(numeric)


def _normalize_home_value(raw_home: dict | None, existing_home: dict | None = None) -> dict:
    source_home = existing_home if isinstance(existing_home, dict) else {}
    incoming_home = raw_home if isinstance(raw_home, dict) else {}
    home = {**source_home, **incoming_home}
    source_stats = source_home.get("stats") if isinstance(source_home.get("stats"), dict) else {}
    incoming_stats = incoming_home.get("stats") if isinstance(incoming_home.get("stats"), dict) else {}
    raw_stats = {**source_stats, **incoming_stats}
    project_count = _projects().count_documents({})

    def stat(
        key: str,
        fallback_label: str,
        fallback_value: str,
        fallback_progress: float,
        minimum: float,
        maximum: float,
        *,
        allow_decimal: bool = False,
    ) -> dict:
        source = raw_stats.get(key) if isinstance(raw_stats.get(key), dict) else {}
        return {
            "id": key,
            "label": str(source.get("label") or fallback_label),
            "value": _normalize_stat_value(key, source.get("value"), str(project_count) if key == "completedProjects" else fallback_value, minimum, maximum, allow_decimal=allow_decimal),
            "progress": _normalize_progress(source.get("progress", fallback_progress), minimum, maximum, allow_decimal=allow_decimal),
        }

    raw_cards = home.get("cards")
    cards = raw_cards if isinstance(raw_cards, list) and len(raw_cards) > 0 else DEFAULT_HOME_CARDS

    return {
        "name": str(home.get("name") or ""),
        "eyebrow": str(home.get("eyebrow") or DEFAULT_HOME_EYEBROW),
        "heroDescription": str(home.get("heroDescription") or DEFAULT_HOME_DESCRIPTION),
        "badgeSubtitle": str(home.get("badgeSubtitle") or DEFAULT_HOME_BADGE_SUBTITLE),
        "lanyardImage": str(home.get("lanyardImage") or ""),
        "stats": {
            "completedProjects": stat("completedProjects", "Proyek selesai", str(project_count), 88, 0, 100),
            "mainStack": stat("mainStack", "Stack utama", "8", 8, 0, 18),
            "learningYears": stat("learningYears", "Tahun belajar", "3+", 3, 0, 30),
            "gpa": stat("gpa", "IPK saat ini", "3.8", 3.8, 0, 98, allow_decimal=True),
        },
        "cards": cards,
    }


def _update_setting(key: str, payload: dict) -> dict:
    timestamp = now_iso()
    current_setting = _get_setting(key)
    current_value = current_setting.get("value", {}) if current_setting else {}
    value = _normalize_home_value(payload, current_value) if key == "home" else {**current_value, **payload}
    return _settings().find_one_and_update(
        {"key": key},
        {
            "$set": {
                "value": value,
                "updatedAt": timestamp,
            },
            "$setOnInsert": {
                "createdAt": timestamp,
                "key": key,
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )


def _get_response(key: str):
    try:
        setting = _get_setting(key)
        data = _normalize_home_value(setting.get("value", {})) if key == "home" else (setting.get("value", {}) if setting else {})
        if setting is None:
            return jsonify(
                {
                    "status": "success",
                    "message": "Data belum ada di MongoDB.",
                    "data": data,
                    "meta": {"key": key, "exists": False},
                }
            )

        return jsonify(
            {
                "status": "success",
                "data": data,
                "meta": {**serialize_document(setting), "exists": True},
            }
        )
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


def _patch_response(key: str):
    payload = request.get_json(silent=True) or {}

    try:
        if key == "profile" and "avatar" in payload:
            payload = {**payload, "avatar": validate_image_reference(payload.get("avatar", ""), "avatar")}
        if key == "home" and "lanyardImage" in payload:
            payload = {**payload, "lanyardImage": validate_image_reference(payload.get("lanyardImage", ""), "lanyardImage")}

        setting = _update_setting(key, payload)
        data = _normalize_home_value(setting["value"]) if key == "home" else setting["value"]
        return jsonify({"status": "success", "message": "Data disimpan ke MongoDB.", "data": data})
    except MediaError as error:
        return jsonify({"status": "error", "message": str(error)}), 400
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@settings_bp.get("/profile")
def get_profile():
    return _get_response("profile")


@settings_bp.post("/profile/avatar")
def upload_profile_avatar():
    session, error_response = require_admin_session()
    if error_response:
        return error_response

    file = request.files.get("image")
    if file is None or not file.filename:
        return jsonify({"status": "error", "message": "File image wajib diunggah."}), 400

    try:
        save_image_as_jpg(file, f"{profile_directory()}/profile.jpg")
        profile = _update_setting("profile", {"avatar": build_media_url("foto-profil", "img", "profile.jpg")})
        return jsonify({
            "status": "success",
            "message": "Foto profil berhasil diunggah.",
            "data": profile["value"],
        })
    except MediaError as error:
        return jsonify({"status": "error", "message": str(error)}), 400
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@settings_bp.patch("/profile")
@settings_bp.put("/profile")
def update_profile():
    session, error_response = require_admin_session()
    if error_response:
        return error_response
    return _patch_response("profile")


@settings_bp.get("/home")
def get_home():
    return _get_response("home")


@settings_bp.post("/home/lanyard-image")
def upload_home_lanyard_image():
    session, error_response = require_admin_session()
    if error_response:
        return error_response

    file = request.files.get("image")
    if file is None or not file.filename:
        return jsonify({"status": "error", "message": "File image wajib diunggah."}), 400

    try:
        save_image_as_jpg(file, f"{lanyard_directory()}/lanyard.jpg")
        home = _update_setting("home", {"lanyardImage": build_media_url("lanyard", "img", "lanyard.jpg")})
        return jsonify({
            "status": "success",
            "message": "Gambar lanyard berhasil diunggah.",
            "data": home["value"],
        })
    except MediaError as error:
        return jsonify({"status": "error", "message": str(error)}), 400
    except PyMongoError as error:
        body, status = mongo_error_response(error)
        return jsonify(body), status


@settings_bp.patch("/home")
@settings_bp.put("/home")
def update_home():
    session, error_response = require_admin_session()
    if error_response:
        return error_response
    return _patch_response("home")


@settings_bp.get("/about")
def get_about():
    return _get_response("about")


@settings_bp.patch("/about")
@settings_bp.put("/about")
def update_about():
    session, error_response = require_admin_session()
    if error_response:
        return error_response
    return _patch_response("about")


@settings_bp.get("/student")
def get_student():
    return _get_response("student")


@settings_bp.patch("/student")
@settings_bp.put("/student")
def update_student():
    session, error_response = require_admin_session()
    if error_response:
        return error_response
    return _patch_response("student")


@settings_bp.get("/social-links")
def get_social_links():
    return _get_response("social-links")


@settings_bp.patch("/social-links")
@settings_bp.put("/social-links")
def update_social_links():
    session, error_response = require_admin_session()
    if error_response:
        return error_response
    return _patch_response("social-links")
