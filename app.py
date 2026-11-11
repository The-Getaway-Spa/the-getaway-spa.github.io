
import os
import re
from flask import Flask, request, jsonify, abort
from uuid import uuid4
from flask_cors import CORS
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

# --- Firestore integration ---
# Install: pip install google-cloud-firestore
# 1. Download your service account key from Firebase Console > Project Settings > Service Accounts > Generate new private key
# 2. Save it as serviceAccountKey.json in your project root (or set GOOGLE_APPLICATION_CREDENTIALS env var)
# 3. Replace 'your-collection-name' with your Firestore collection name (e.g. 'lessons')
from google.cloud import firestore
from google.cloud import storage
from urllib.parse import quote
firestore_client = firestore.Client()
LESSONS_COLLECTION = 'lessons'  # Change if you use a different collection name

# --- Firebase Storage (for uploaded PowerPoint files) ---
# Uses the same service account credentials as Firestore.
# Storage must be enabled in Firebase Console > Build > Storage.
STORAGE_BUCKET = os.environ.get("FIREBASE_STORAGE_BUCKET", "the-getaway-academy.firebasestorage.app")
storage_client = storage.Client()

# Microsoft's Office Online viewer (used to display the slides) only accepts
# PowerPoint files up to 10 MB, so enforce the same limit here.
MAX_SLIDESHOW_BYTES = 10 * 1024 * 1024
SLIDESHOW_TYPES = {
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppsx": "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pps": "application/vnd.ms-powerpoint",
}

app = Flask(__name__)
# Reject oversized request bodies early (limit + small allowance for form overhead)
app.config["MAX_CONTENT_LENGTH"] = MAX_SLIDESHOW_BYTES + 1024 * 1024

# Allow front‑end origins; during dev you can use "*" and tighten later
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:8000", "http://localhost:3000", "http://getaway-academy.duckdns.org", "https://the-getaway-spa.github.io"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# --- Admin check ---
# The front end sends the signed-in user's Firebase ID token as
# "Authorization: Bearer <token>". We verify Google's signature on it, then
# check the email against this list. Override with an ADMIN_EMAILS env var
# (comma-separated) on Render to change admins without a code change.
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "the-getaway-academy")
ADMIN_EMAILS = {
    e.strip().lower()
    for e in os.environ.get("ADMIN_EMAILS", "info@mygetawayspa.com,angeldmomo@gmail.com").split(",")
    if e.strip()
}
_google_request = google_requests.Request()


def is_admin(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return False
    try:
        claims = google_id_token.verify_firebase_token(
            header[len("Bearer "):].strip(),
            _google_request,
            audience=FIREBASE_PROJECT_ID,
            clock_skew_in_seconds=10,
        )
    except Exception as e:  # expired, malformed, wrong signature, etc.
        app.logger.info("Rejected admin token: %s", e)
        return False
    if not claims or claims.get("iss") != f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}":
        return False
    return (claims.get("email") or "").lower() in ADMIN_EMAILS

@app.get("/api/lessons")
def list_lessons():
    # Firestore: get all lessons (id, title)
    lessons = []
    docs = firestore_client.collection(LESSONS_COLLECTION).stream()
    for doc in docs:
        data = doc.to_dict()
        lessons.append({"id": doc.id, "title": data.get("title", "")})
    return jsonify(lessons), 200

@app.get("/lessons/<lesson_id>")
def serve_lesson(lesson_id):
    # Firestore: get lesson HTML by id
    doc = firestore_client.collection(LESSONS_COLLECTION).document(lesson_id).get()
    if not doc.exists:
        return "Lesson not found", 404
    data = doc.to_dict()
    return data.get("html", "<p>No content</p>"), 200, {"Content-Type": "text/html; charset=utf-8"}

@app.post("/api/lessons")
def create_lesson():
    if not is_admin(request):
        abort(403)

    data = request.get_json(force=True) or {}
    raw_name = (data.get("name") or "").strip()
    if not raw_name:
        return jsonify({"error": "name required"}), 400

    safe = "".join(c for c in raw_name.lower() if c.isalnum() or c in ("-", "_")).strip("-_")
    if not safe:
        return jsonify({"error": "invalid_name"}), 400

    title = raw_name.strip().title()
    initial_html = f"""<!DOCTYPE html>
<html lang=\"en\">
<head>
  <meta charset=\"UTF-8\">
  <title>{title}</title>
</head>
<body>
  <p>This is a new lesson. Edit this file to add content.</p>
</body>
</html>
"""

    # Firestore: create lesson document
    doc_ref = firestore_client.collection(LESSONS_COLLECTION).document(safe)
    doc_ref.set({
        "title": title,
        "html": initial_html
    })
    return jsonify({"id": safe, "title": title}), 201

@app.post("/api/uploads/slideshow")
def upload_slideshow():
    """Upload a PowerPoint file to Firebase Storage and return a public URL.

    Expects multipart/form-data with a single field named "file".
    """
    if not is_admin(request):
        abort(403)

    file = request.files.get("file")
    if file is None or not file.filename:
        return jsonify({"error": "no file uploaded"}), 400

    original_name = os.path.basename(file.filename.replace("\\", "/"))
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in SLIDESHOW_TYPES:
        return jsonify({"error": "Only PowerPoint files (.pptx, .ppsx, .ppt, .pps) are allowed."}), 400

    data = file.read()
    if len(data) == 0:
        return jsonify({"error": "file is empty"}), 400
    if len(data) > MAX_SLIDESHOW_BYTES:
        return jsonify({"error": "File is larger than 10 MB."}), 413

    # Keep a readable but safe file name; prefix with a uuid to avoid collisions
    stem = os.path.splitext(original_name)[0]
    safe_stem = re.sub(r"[^A-Za-z0-9._-]+", "-", stem).strip("-._") or "slideshow"
    # Store at the bucket root (no "folder/"): a "/" becomes "%2F" in the Firebase
    # URL, and the Office Online viewer decodes it, which makes Firebase reject
    # the request and the viewer show "File not found".
    object_path = f"slideshow-{uuid4().hex}-{safe_stem}{ext}"

    # A Firebase download token makes the file readable via a public URL,
    # which the Office Online viewer needs in order to fetch it.
    token = str(uuid4())
    blob = storage_client.bucket(STORAGE_BUCKET).blob(object_path)
    blob.metadata = {"firebaseStorageDownloadTokens": token}
    blob.content_disposition = f'inline; filename="{safe_stem}{ext}"'
    blob.upload_from_string(data, content_type=SLIDESHOW_TYPES[ext])

    public_url = (
        f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o/"
        f"{quote(object_path, safe='')}?alt=media&token={token}"
    )
    return jsonify({"url": public_url, "name": original_name}), 201


@app.errorhandler(413)
def too_large(_e):
    return jsonify({"error": "File is larger than 10 MB."}), 413


@app.delete("/api/lessons/<lesson_id>")
def delete_lesson(lesson_id):
    if not is_admin(request):
        abort(403)
    doc_ref = firestore_client.collection(LESSONS_COLLECTION).document(lesson_id)
    if not doc_ref.get().exists:
        return jsonify({"error": "not found"}), 404
    doc_ref.delete()
    return "", 204

@app.route("/lessons/<lesson_id>", methods=["PUT", "PATCH"])
def update_lesson_file(lesson_id):
    if not is_admin(request):
        abort(403)

    data = request.get_json(force=True) or {}
    content = data.get("content")
    title = data.get("title")

    if content is None and title is None:
        return jsonify({"error": "content or title required"}), 400

    doc_ref = firestore_client.collection(LESSONS_COLLECTION).document(lesson_id)
    doc = doc_ref.get()
    if not doc.exists:
        return jsonify({"error": "lesson not found"}), 404
    updates = {}
    # If title provided, normalize
    if isinstance(title, str):
        new_title = title.strip()
        if new_title:
            updates["title"] = new_title
    # If content provided, optionally inject the provided title into <title> and first <h1>
    if isinstance(content, str):
        updated_content = content
        if updates.get("title"):
            # replace or inject <title>...</title>
            if re.search(r"<title>.*?</title>", updated_content, flags=re.IGNORECASE | re.DOTALL):
                updated_content = re.sub(r"(<title>).*?(</title>)", r"\1" + updates["title"] + r"\2", updated_content, flags=re.IGNORECASE | re.DOTALL)
            else:
                # try to inject into <head>
                updated_content = re.sub(r"(</head>)", f"  <title>{updates['title']}</title>\n\1", updated_content, count=1, flags=re.IGNORECASE | re.DOTALL)
            # replace first <h1>...</h1> if present
            if re.search(r"<h1[^>]*>.*?</h1>", updated_content, flags=re.IGNORECASE | re.DOTALL):
                updated_content = re.sub(r"(<h1[^>]*>).*?(</h1>)", r"\1" + updates["title"] + r"\2", updated_content, count=1, flags=re.IGNORECASE | re.DOTALL)
        updates["html"] = updated_content
    if not updates:
        return jsonify({"error": "nothing to update"}), 400
    doc_ref.update(updates)
    return jsonify({"status": "saved"}), 200


