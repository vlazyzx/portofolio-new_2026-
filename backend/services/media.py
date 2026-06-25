import io
import os
import re
import shutil
from typing import Iterable

from flask import current_app
from PIL import Image, UnidentifiedImageError
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from config import Config


class MediaError(ValueError):
    pass


def require_image_upload(file: FileStorage | None, field_name: str) -> FileStorage:
    if file is None or not file.filename:
        raise MediaError(f"File {field_name} wajib diunggah.")
    return file


def _validate_image(file: FileStorage) -> None:
    if not file.mimetype or not file.mimetype.startswith("image/"):
        raise MediaError("File harus berupa gambar.")

    file.stream.seek(0, os.SEEK_END)
    size_bytes = file.stream.tell()
    file.stream.seek(0)

    max_size_bytes = Config.MAX_IMAGE_SIZE_MB * 1024 * 1024
    if size_bytes > max_size_bytes:
        raise MediaError(f"Ukuran gambar maksimal {Config.MAX_IMAGE_SIZE_MB}MB.")


def _load_image(file: FileStorage) -> Image.Image:
    _validate_image(file)

    try:
        file.stream.seek(0)
        image = Image.open(file.stream)
        image.load()
        file.stream.seek(0)
        return image
    except (UnidentifiedImageError, OSError) as error:
        raise MediaError("Gagal membaca file gambar.") from error


def ensure_directory(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def save_image_as_jpg(file: FileStorage, destination_path: str, *, max_width: int = 1600, quality: int = 82) -> str:
    image = _load_image(file)
    image = image.convert("RGB")

    if image.width > max_width:
        ratio = max_width / float(image.width)
        image = image.resize((max_width, max(1, int(image.height * ratio))), Image.LANCZOS)

    ensure_directory(os.path.dirname(destination_path))
    image.save(destination_path, format="JPEG", quality=quality, optimize=True)
    return destination_path


def build_media_url(*parts: str) -> str:
    prefix = Config.UPLOAD_URL_PREFIX.rstrip("/")
    suffix = "/".join(part.strip("/\\") for part in parts if part)
    return f"{prefix}/{suffix}" if suffix else prefix or "/uploads"


def is_data_image_url(value: str) -> bool:
    return bool(re.match(r"^data:image/[a-zA-Z0-9.+-]+;base64,", str(value or "").strip(), re.IGNORECASE))


def is_allowed_image_reference(value: str) -> bool:
    raw = str(value or "").strip()
    if raw == "":
        return True
    if is_data_image_url(raw):
        return False
    if raw.startswith(Config.UPLOAD_URL_PREFIX.rstrip("/") + "/"):
        return True
    if raw.startswith("http://") or raw.startswith("https://"):
        return True
    return False


def validate_image_reference(value: str, field_name: str) -> str:
    raw = str(value or "").strip()
    if not is_allowed_image_reference(raw):
        raise MediaError(f"{field_name} harus berupa URL gambar valid. Data base64 tidak diizinkan.")
    return raw


def validate_image_references(values: list[str], field_name: str, *, max_items: int | None = None) -> list[str]:
    if not isinstance(values, list):
        raise MediaError(f"{field_name} harus berupa list URL gambar.")
    normalized = [validate_image_reference(value, field_name) for value in values if str(value or "").strip()]
    if max_items is not None and len(normalized) > max_items:
        raise MediaError(f"{field_name} maksimal {max_items} item.")
    return normalized


def project_directory(project_id: str) -> str:
    return os.path.join(Config.UPLOAD_ROOT, "projects", secure_filename(project_id))


def profile_directory() -> str:
    return os.path.join(Config.UPLOAD_ROOT, "foto-profil", "img")


def lanyard_directory() -> str:
    return os.path.join(Config.UPLOAD_ROOT, "lanyard", "img")


def remove_project_directory(project_id: str) -> None:
    target = project_directory(project_id)
    if os.path.isdir(target):
        shutil.rmtree(target)


def list_project_image_urls(project_id: str, gallery_count: int) -> list[str]:
    urls = [build_media_url("projects", project_id, "cover.jpg")]
    urls.extend(build_media_url("projects", project_id, f"gallery-{index}.jpg") for index in range(1, gallery_count + 1))
    return urls
