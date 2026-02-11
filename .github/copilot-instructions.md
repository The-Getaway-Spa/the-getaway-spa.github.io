# Copilot Instructions for The Getaway Academy eLearning Platform

## Overview
This project is a web-based eLearning platform for The Getaway Spa, featuring lesson and quiz management for students and admins. It uses a Flask backend (with Supabase for lesson storage) and a JavaScript/HTML/CSS frontend. The platform supports role-based access (admin/student), lesson editing, quiz creation, and dynamic content loading.

## Architecture
- **Backend:**
  - `app.py` (Flask): Serves API endpoints for lesson CRUD, lesson HTML, and enforces admin actions via `X-User-Role` header. Lessons are stored in a Supabase table (`id`, `title`, `html`).
  - **Endpoints:**
    - `GET /api/lessons` — List lessons (id, title)
    - `POST /api/lessons` — Create lesson (admin only)
    - `DELETE /api/lessons/<id>` — Delete lesson (admin only)
    - `PUT /lessons/<id>` — Update lesson HTML/title (admin only)
    - `GET /lessons/<id>` — Serve lesson HTML
- **Frontend:**
  - `main.html` + `script.js`: Main app UI, lesson/quiz sidebar, dynamic lesson/quiz loading, admin WYSIWYG/quiz editors, role-based UI.
  - `register.js` + `index.html`: Handles login (Firebase Auth), sets sessionStorage for role/email, redirects to main app.
  - `styles.css`: Unified styling for all pages.
  - `api/lessons/`: Example static lesson/quiz HTML (for local dev/demo only; real lessons are stored in Supabase).

## Key Patterns & Conventions
- **Role Handling:**
  - User role (`admin` or `student`) is set in `sessionStorage` after login and sent to backend via `X-User-Role` header.
  - Admins see extra UI (add/edit lesson/quiz, drag-reorder sidebar, etc.).
- **Lesson/Quiz Management:**
  - Lessons and quizzes are stored as HTML in Supabase, not as local files.
  - Quizzes are embedded as `<script id="quiz-data" type="application/json">` in lesson HTML.
  - Admins use in-browser WYSIWYG and quiz editors (see `script.js`).
  - Sidebar supports drag-and-drop reordering (admin only), persisted via API or localStorage fallback.
- **Frontend-Backend Integration:**
  - All lesson/quiz CRUD is via REST API to Flask backend, not direct file edits.
  - Use `API_BASE` in `script.js` for all API calls.
- **Styling:**
  - Use `styles.css` for all UI; avoid inline styles except for dynamic/JS-generated elements.
- **Testing/Debugging:**
  - No automated tests; manual testing via browser.
  - For local dev, set `SUPABASE_URL` and `SUPABASE_KEY` env vars.
  - Use `gunicorn app:app` (see `Procfile`) for production.
- **Deployment:**
  - Static frontend can be deployed to GitHub Pages (see `.github/workflows/static.yml`).
  - Backend expects to run on Render or similar with env vars set.

## Examples
- **Add Lesson/Quiz:** Admin clicks "+ Add Lesson" → chooses type → fills editor → saves (calls API).
- **Edit Lesson:** Admin selects lesson → clicks "Edit Lesson" → uses WYSIWYG editor → saves (calls API).
- **Edit Quiz:** Admin selects quiz → clicks "Edit Quiz" → uses quiz editor → saves (calls API).
- **Student Flow:** Logs in → sees lessons/quizzes → can only view/take, not edit.

## Key Files
- `app.py` — Flask API, Supabase integration
- `script.js` — Main frontend logic, editors, role handling
- `register.js` — Login/auth logic
- `main.html`, `index.html` — App entry points
- `styles.css` — Styling
- `.github/workflows/static.yml` — GitHub Pages deploy

## Project-Specific Notes
- Do **not** edit lesson/quiz HTML files directly; always use the API.
- Always check/update `sessionStorage` for role/email before showing admin UI.
- Quizzes must have at least 2 options per question and a correct answer marked.
- For new lessons/quizzes, use the provided templates in `script.js`.
- All API calls must include `X-User-Role` for admin actions.
