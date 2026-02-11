
import os
import re
from flask import Flask, request, jsonify, abort
from uuid import uuid4
from flask_cors import CORS

# --- Firestore integration ---
# Install: pip install google-cloud-firestore
# 1. Download your service account key from Firebase Console > Project Settings > Service Accounts > Generate new private key
# 2. Save it as serviceAccountKey.json in your project root (or set GOOGLE_APPLICATION_CREDENTIALS env var)
# 3. Replace 'your-collection-name' with your Firestore collection name (e.g. 'lessons')
from google.cloud import firestore
firestore_client = firestore.Client()
LESSONS_COLLECTION = 'lessons'  # Change if you use a different collection name

app = Flask(__name__)

# Allow front‑end origins; during dev you can use "*" and tighten later
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:8000", "http://localhost:3000", "http://getaway-academy.duckdns.org", "https://the-getaway-spa.github.io"],
    "allow_headers": ["Content-Type", "X-User-Role"]
}})

def is_admin(request):
    # For now, trust a header from your front end; later you can validate Firebase ID tokens
    return request.headers.get("X-User-Role") == "admin"

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
  <h1>{title}</h1>
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


