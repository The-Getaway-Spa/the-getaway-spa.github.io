import os
from flask import Flask, request, jsonify, abort
from uuid import uuid4
from flask_cors import CORS
from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    resp = supabase.table("lessons").select("id,title").execute()
    return jsonify(resp.data), 200

@app.get("/lessons/<lesson_id>")
def serve_lesson(lesson_id):
    resp = supabase.table("lessons").select("html").eq("id", lesson_id).single().execute()
    if not resp.data:
        return "Lesson not found", 404
    return resp.data["html"], 200, {"Content-Type": "text/html; charset=utf-8"}

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

    resp = supabase.table("lessons").insert({
        "id": safe,
        "title": title,
        "html": initial_html
    }).execute()

    return jsonify(resp.data[0]), 201

@app.delete("/api/lessons/<lesson_id>")
def delete_lesson(lesson_id):
    if not is_admin(request):
        abort(403)
    resp = supabase.table("lessons").delete().eq("id", lesson_id).execute()
    if not resp.data:
        return jsonify({"error": "not found"}), 404
    return "", 204

@app.route("/lessons/<lesson_id>", methods=["PUT", "PATCH"])
def update_lesson_file(lesson_id):
    if not is_admin(request):
        abort(403)

    data = request.get_json(force=True) or {}
    content = data.get("content")
    if content is None:
        return jsonify({"error": "content required"}), 400

    resp = supabase.table("lessons").update({"html": content}).eq("id", lesson_id).execute()
    if not resp.data:
        return jsonify({"error": "lesson not found"}), 404
    return jsonify({"status": "saved"}), 200


