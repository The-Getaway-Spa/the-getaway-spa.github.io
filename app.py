from flask import Flask, request, jsonify, abort
from uuid import uuid4
from flask_cors import CORS

app = Flask(__name__)

# Allow front‑end origins; during dev you can use "*" and tighten later
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:8000", "http://getaway-academy.duckdns.org/"]}})

# Temporary in-memory store
lessons = [
    {"id": "lesson1", "title": "Lesson 1: Introduction", "path": "lessons/lesson1.html"},
    {"id": "lesson2", "title": "Lesson 2: Nail Basics",  "path": "lessons/lesson2.html"},
]

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
    data = request.get_json(force=True) or {}
    title = data.get("title")
    path  = data.get("path")
    if not title or not path:
        return jsonify({"error": "title and path required"}), 400

    lesson_id = data.get("id") or str(uuid4())
    new_lesson = {"id": lesson_id, "title": title, "path": path}
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
