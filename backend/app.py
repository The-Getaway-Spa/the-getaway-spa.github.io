from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def health():
    return "OK"

@app.route("/api/lessons")
def list_lessons():
    # for now, hard-code; later you can read a DB or the filesystem
    lessons = [
        {"id": "lesson1", "title": "Lesson 1: Introduction", "path": "lessons/lesson1.html"},
        {"id": "lesson2", "title": "Lesson 2: Nail Basics",  "path": "lessons/lesson2.html"},
    ]
    return jsonify(lessons)
