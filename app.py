import os
from flask import Flask, request, jsonify, abort
from uuid import uuid4
from flask_cors import CORS

app = Flask(__name__)

# Allow front‑end origins; during dev you can use "*" and tighten later
CORS(app, resources={r"/*": {
    "origins": ["http://localhost:8000", "http://localhost:3000", "http://getaway-academy.duckdns.org", "https://the-getaway-spa.github.io"],
    "allow_headers": ["Content-Type", "X-User-Role"]
}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LESSONS_DIR = os.path.join(BASE_DIR, "lessons")

# Temporary in-memory store
lessons = []

def is_admin(request):
    # For now, trust a header from your front end; later you can validate Firebase ID tokens
    return request.headers.get("X-User-Role") == "admin"

@app.get("/api/lessons")
def list_lessons():
    return jsonify(lessons)

@app.post("/api/lessons")
def create_lesson():
  if not is_admin(request):
    abort(403)
    
  # Log what the client actually sent
  data = request.get_json(force=True) or {}
  app.logger.info("create_lesson data=%r", data)

  data = request.get_json(force=True) or {}
  raw_name = (data.get("name") or "").strip()
  if not raw_name:
    return jsonify({"error": "name required"}), 400

  # Example: "bob" or "Lesson 3 - Hair"
  # 1) safe id/filename
  safe = "".join(c for c in raw_name.lower() if c.isalnum() or c in ("-", "_")).strip("-_")
  if not safe:
    return jsonify({"error": "invalid_name"}), 400

  filename = safe + ".html"
  file_path = os.path.join(LESSONS_DIR, filename)

  # 2) if file exists, reject
  if os.path.exists(file_path):
    return jsonify({"error": "file_exists"}), 409

  # 3) derive title from raw_name (capitalize nicely)
  title = raw_name.strip().title()

  initial_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>
</head>
<body>
  <h1>{title}</h1>
  <p>This is a new lesson. Edit this file to add content.</p>
</body>
</html>
"""

  os.makedirs(LESSONS_DIR, exist_ok=True)
  try:
    with open(file_path, "x", encoding="utf-8") as f:
      f.write(initial_html)
  except FileExistsError:
    return jsonify({"error": "file_exists"}), 409

  lesson_id = safe               # e.g. "bob"
  lesson_path = f"lessons/{filename}"

  new_lesson = {"id": lesson_id, "title": title, "path": lesson_path}
  lessons.append(new_lesson)

  return jsonify(new_lesson), 201

@app.delete("/api/lessons/<lesson_id>")
def delete_lesson(lesson_id):
    if not is_admin(request):
        abort(403)
    global lessons
    before = len(lessons)
    lessons = [l for l in lessons if l["id"] != lesson_id]
    if len(lessons) == before:
        return jsonify({"error": "not found"}), 404
    return "", 204


@app.route("/api/lessons/<lesson_id>", methods=["PUT", "PATCH"]) 
def update_lesson_content(lesson_id):
  if not is_admin(request):
    abort(403)

  data = request.get_json(force=True) or {}
  content = data.get("content")
  if content is None:
    return jsonify({"error": "content required"}), 400

  # Find lesson entry to determine file path
  lesson = next((l for l in lessons if l["id"] == lesson_id), None)
  if lesson:
    file_path = os.path.join(BASE_DIR, lesson["path"])
  else:
    # Fallback: construct from lesson_id
    filename = f"{lesson_id}.html"
    file_path = os.path.join(LESSONS_DIR, filename)

  # Ensure directory exists and file is writable
  try:
    # Write the new content to the file
    with open(file_path, "w", encoding="utf-8") as f:
      f.write(content)
  except FileNotFoundError:
    return jsonify({"error": "lesson file not found"}), 404
  except Exception as e:
    app.logger.exception("Failed to save lesson content: %s", e)
    return jsonify({"error": "failed to save"}), 500

  return jsonify({"status": "saved"}), 200

@app.route("/lessons/<path:filename>")
def serve_lesson(filename):
    file_path = os.path.join(LESSONS_DIR, filename)
    if not os.path.exists(file_path):
        return "Lesson not found", 404
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read(), 200, {"Content-Type": "text/html; charset=utf-8"}

@app.route("/lessons/<path:filename>", methods=["PUT", "PATCH"])
def update_lesson_file(filename):
    if not is_admin(request):
        abort(403)
    
    data = request.get_json(force=True) or {}
    content = data.get("content")
    if content is None:
        return jsonify({"error": "content required"}), 400
    
    file_path = os.path.join(LESSONS_DIR, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "lesson file not found"}), 404
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        return jsonify({"status": "saved"}), 200
    except Exception as e:
        app.logger.exception("Failed to save lesson: %s", e)
        return jsonify({"error": "failed to save"}), 500


