// script.js — used on main.html only

const API_BASE = "https://the-getaway-academy.onrender.com";
const role = sessionStorage.getItem("role");
const lessonList = document.getElementById("lesson-list");
const addLessonBtn = document.getElementById("add-lesson-btn");

// --------------------
// Auth / role handling
// --------------------

if (sessionStorage.getItem('loggedIn') !== 'true') {
  window.location.href = 'index.html';
}

const adminBadge = document.getElementById('admin-badge');
const adminSeparator = document.getElementById('admin-separator');
const usernameDisplay = document.getElementById('username-display');
const userSeparator = document.getElementById('user-separator');

const usernameVal = sessionStorage.getItem('username') || sessionStorage.getItem('email') || sessionStorage.getItem('user') || null;

if (role === 'admin' && adminBadge) {
  adminBadge.style.display = 'block';
  if (adminSeparator) adminSeparator.style.display = 'inline';
} else if (adminBadge) {
  adminBadge.style.display = 'none';
  if (adminSeparator) adminSeparator.style.display = 'none';
}

if (usernameVal && usernameDisplay) {
  usernameDisplay.textContent = usernameVal;
  usernameDisplay.style.display = 'block';
  if (userSeparator) userSeparator.style.display = 'inline';
} else {
  if (usernameDisplay) usernameDisplay.style.display = 'none';
  if (userSeparator) userSeparator.style.display = 'none';
}

const logoutBtn = document.getElementById('logoutBtn');
function logoutUser() {
  try {
    sessionStorage.removeItem('loggedIn');
    sessionStorage.removeItem('role');
  } catch (e) {}
  window.location.href = 'index.html';
}
if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);

(function arrangeTopBar() {
  const topCenter = document.getElementById('top-center');
  const topRight = document.getElementById('top-right');
  if (!topCenter || !topRight) return;

  if (role === 'admin') {
    if (usernameDisplay) topCenter.appendChild(usernameDisplay);
    if (userSeparator) topCenter.appendChild(userSeparator);
    if (logoutBtn) topCenter.appendChild(logoutBtn);
    topCenter.style.display = 'flex';
    topCenter.style.alignItems = 'center';
    topCenter.style.gap = '8px';
    if (adminBadge) topRight.appendChild(adminBadge);
    if (adminSeparator) topRight.appendChild(adminSeparator);
  } else {
    topCenter.style.display = 'none';
    if (usernameDisplay) topRight.appendChild(usernameDisplay);
    if (userSeparator) topRight.appendChild(userSeparator);
    if (logoutBtn) topRight.appendChild(logoutBtn);
    if (adminBadge) adminBadge.style.display = 'none';
    if (adminSeparator) adminSeparator.style.display = 'none';
  }
})();

function showLoading(show, message) {
  const el = document.getElementById('global-loading');
  if (!el) return;
  const text = el.querySelector('.loading-text');
  if (text && message) text.textContent = message;
  el.style.display = show ? 'flex' : 'none';
}

const adminControls = document.getElementById('admin-controls');
if (adminControls) {
  adminControls.style.display = role === 'admin' ? 'block' : 'none';
}

const lessons = [];

function createLessonListItem(lesson) {
  const li = document.createElement("li");
  li.classList.add("admin-owned");
  li.dataset.lessonId = lesson.id;

  const titleSpan = document.createElement("span");
  titleSpan.textContent = lesson.title;

  let _wasDragged = false;
  li.onclick = function() {
    if (_wasDragged) return;
    var selectedEls = document.querySelectorAll(".sidebar ul li.selected");
    selectedEls.forEach(function(el) { el.classList.remove("selected"); });
    li.classList.add("selected");
    loadLessonContent(lesson);
  };
  li.appendChild(titleSpan);
  if (role === 'admin') {
    li.setAttribute('draggable', 'true');
    li.style.cursor = 'move';
    li.addEventListener('dragstart', function(e) {
      try { li.focus(); } catch (err) {}
      _wasDragged = true;
      li.classList.add('dragging');
    });
    li.addEventListener('dragend', function() {
      li.classList.remove('dragging');
      setTimeout(function() { _wasDragged = false; }, 0);
    });
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "✕";
    removeBtn.className = "remove-lesson-btn";
    removeBtn.onclick = function(e) {
      e.stopPropagation();
      removeLesson(lesson.id, li);
    };
    li.appendChild(removeBtn);
  }
  return li;
}

async function removeLesson(lessonId, liElement) {
  if (!confirm("Remove this lesson?")) return;
  const res = await fetch(API_BASE + '/api/lessons/' + encodeURIComponent(lessonId), {
    method: "DELETE",
    headers: {
      "X-User-Role": role
    }
  });
  if (!res.ok && res.status !== 204) {
    alert("Failed to remove lesson.");
    return;
  }
  if (liElement && liElement.parentNode) {
    liElement.parentNode.removeChild(liElement);
  }
  const contentEl = document.getElementById(lessonId);
  if (contentEl && contentEl.parentNode) {
    contentEl.parentNode.removeChild(contentEl);
  }
}

if (addLessonBtn && role === "admin") {
  function showCreateChoiceDialog() {
    return new Promise(function(resolve) {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:2000;';
      const box = document.createElement('div');
      box.style.cssText = 'background:#fff;padding:18px;border-radius:8px;min-width:280px;box-shadow:0 8px 24px rgba(0,0,0,0.2);text-align:center;';
      const title = document.createElement('div');
      title.textContent = 'Create new item';
      title.style.cssText = 'font-weight:700;margin-bottom:8px';
      const msg = document.createElement('div');
      msg.textContent = 'Would you like to create a Lesson or a Quiz?';
      msg.style.marginBottom = '14px';
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:8px;justify-content:center;';
      const lessonBtn = document.createElement('button');
      lessonBtn.textContent = 'Lesson';
      lessonBtn.style.cssText = 'padding:8px 12px;border-radius:6px;border:1px solid #1976d2;background:#fff;color:#1976d2;cursor:pointer;';
      lessonBtn.onclick = function() { document.body.removeChild(overlay); resolve('lesson'); };
      const quizBtn = document.createElement('button');
      quizBtn.textContent = 'Quiz';
      quizBtn.style.cssText = 'padding:8px 12px;border-radius:6px;border:none;background:#1976d2;color:#fff;cursor:pointer;';
      quizBtn.onclick = function() { document.body.removeChild(overlay); resolve('quiz'); };
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = 'padding:8px 12px;border-radius:6px;border:1px solid #ccc;background:#fff;color:#333;cursor:pointer;';
      cancelBtn.onclick = function() { document.body.removeChild(overlay); resolve(null); };
      btnRow.appendChild(lessonBtn);
      btnRow.appendChild(quizBtn);
      btnRow.appendChild(cancelBtn);
      box.appendChild(title);
      box.appendChild(msg);
      box.appendChild(btnRow);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      quizBtn.focus();
    });
  }
  addLessonBtn.addEventListener("click", async function() {
    const choice = await showCreateChoiceDialog();
    if (!choice) return;
    const makeQuiz = choice === 'quiz';
    var name = prompt('Enter a name for the new ' + (makeQuiz ? 'quiz' : 'lesson') + ':');
    if (!name) return;

    try {
      const res = await fetch(`${API_BASE}/api/lessons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": role
        },
        body: JSON.stringify({ name })
      });

      if (res.status === 409) {
        alert("A lesson file with that name already exists. Delete it or use a different name.");
        return;
      }

      if (!res.ok) {
        alert("Failed to create lesson.");
        return;
      }

      const savedLesson = await res.json();
      const li = createLessonListItem(savedLesson);
      lessonList.appendChild(li);

      // If admin chose Quiz, immediately replace the new file with a quiz template and open quiz editor
      if (makeQuiz) {
        // Build initial quiz HTML wrapper with an empty questions array inside a script tag
        const title = savedLesson.title || name;
        const quizTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
</head>
<body>
  <h1>${title}</h1>
  <div data-quiz="true"></div>
  <script id="quiz-data" type="application/json">${JSON.stringify({questions: []})}</script>
</body>
</html>`;

        // Save the quiz template to the lesson file using the same save routine (which uses file path)
        // create a temporary statusDiv to pass into saveLessonContent
        const tempStatus = document.createElement('div');
        tempStatus.textContent = 'Saving quiz...';
        await saveLessonContent(savedLesson, quizTemplate, tempStatus);

        // After saving, load the lesson content and open quiz editor
        loadLessonContent(savedLesson);
        // Open editor once content loads (give a moment)
        setTimeout(() => addQuizEditor(savedLesson, document.getElementById('lesson-container')), 300);
      }
    } catch (err) {
      console.error(err);
      alert("Network error while creating lesson.");
    }
  });
} // end addLessonBtn listener


// --------------------
// Quiz / lesson logic
// --------------------

// Variable declarations
let totalQuestions = document.querySelectorAll('.quiz').length;
let correctAnswers = 0;
let currentLesson = null;

// Event listeners
const startQuizBtn = document.getElementById('startQuizBtn');
if (startQuizBtn) {
  startQuizBtn.addEventListener('click', () => {
    const intro = document.getElementById('introPage');
    if (intro) intro.style.display = 'none';

    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) quizContainer.style.display = 'block';

    resetQuiz();
  });
}

// Functions

function setTotalQuestions(numOfQuestions) {
  totalQuestions = numOfQuestions;
}

function resetQuiz() {
  correctAnswers = 0;
  const quizzes = document.querySelectorAll('.quiz');
  quizzes.forEach((q, i) => {
    q.style.display = i === 0 ? 'block' : 'none';
    resetButtonColors(q);
  });

  const results = document.getElementById('quizResults');
  if (results) results.innerHTML = '';
}

function resetButtonColors(quizDiv) {
  const buttons = quizDiv.querySelectorAll('button');
  buttons.forEach(button => {
    button.classList.remove('correct', 'wrong');
  });
}

function checkAnswer(btn, isCorrect, unlockLessonId = 'lesson3') {
  if (isCorrect) {
    correctAnswers++;
    btn.classList.add('correct');
  } else {
    btn.classList.add('wrong');
  }

  setTimeout(() => {
    const current = btn.closest('.quiz');
    current.style.display = 'none';
    const next = current.nextElementSibling;

    if (next && next.classList.contains('quiz')) {
      next.style.display = 'block';
    } else {
      const scorePercent = (correctAnswers / totalQuestions) * 100;
      if (scorePercent >= 70 && unlockLessonId) {
        unlockSidebarSection(unlockLessonId);
      }

      const resultsDiv = document.getElementById('quizResults');
      if (resultsDiv) {
        resultsDiv.innerHTML = `
          <h2>Quiz Completed!</h2>
          <p>Your score: ${scorePercent.toFixed(2)}%</p>
          ${
            scorePercent >= 70
              ? '<p>Congratulations, you passed!</p>'
              : '<p>You did not pass. Please try again.</p>'
          }
          <button id="retakeBtn">Retake Quiz</button>
        `;

        const retakeBtn = document.getElementById('retakeBtn');
        if (retakeBtn) {
          retakeBtn.addEventListener('click', () => {
            resultsDiv.innerHTML = '';
            correctAnswers = 0;
            const quizzes = document.querySelectorAll('.quiz');
            quizzes.forEach((q, i) => (q.style.display = i === 0 ? 'block' : 'none'));
          });
        }
      }

      const quizzes = document.querySelectorAll('.quiz');
      quizzes.forEach(q => resetButtonColors(q));
    }
  }, 500);
}

function showLesson(lessonId) {
  const lessonItem = document.getElementById(lessonId);
  if (lessonItem && lessonItem.classList.contains('locked')) {
    alert('This lesson is locked. Please complete the previous lessons to unlock it.');
    return false;
  }

  document.querySelectorAll('.lesson-content').forEach(div => (div.style.display = 'none'));
  document.querySelectorAll('.quiz-container').forEach(div => (div.style.display = 'none'));

  // Clear dynamic lesson container if you use it
  const lessonContainer = document.getElementById('lesson-container');
  if (lessonContainer) lessonContainer.innerHTML = '';

  const contentEl =
    document.getElementById(lessonId + '_content') ||
    document.getElementById(lessonId);

  if (contentEl) contentEl.style.display = 'block';
}

function unlockSidebarSection(SectionId) {
  const lockedItems = document.querySelectorAll('.sidebar .locked');
  lockedItems.forEach(item => {
    if (item.id === SectionId) {
      item.classList.remove('locked');
      item.style.color = '';
      item.style.cursor = 'pointer';
      item.onclick = function () {
        showLesson(this.id);
      };
    }
  });
}

// Lesson class
function Lesson(id, title, contentPath) {
  this.id = id;
  this.title = title;
  this.content = contentPath;
}

Lesson.prototype.openLesson = async function () {
  unlockSidebarInSidebar(this.id);

  const container = document.getElementById('lesson-container');
  if (!container) return;

  try {
    const response = await fetch(this.content);
    const html = await response.text();
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p>Sorry, this lesson could not be loaded.</p>';
  }
};

Lesson.prototype.closeLesson = function () {
  const container = document.getElementById('lesson-container');
  if (container) container.innerHTML = '';
};

// Helper to unlock a specific lesson in the sidebar
function unlockSidebarInSidebar(lessonId) {
  const item = document.getElementById(lessonId);
  if (!item) return;
  item.classList.remove('locked');
  item.style.color = '';
  item.style.cursor = 'pointer';
}

// Quiz class
function Quiz(id, passPercent, unlockLessonId) {
  this.id = id;
  this.passPercent = passPercent;
  this.unlockLessonId = unlockLessonId || null;
  this.questions = [];
}

Quiz.prototype.addQuestion = function (text, answers) {
  this.questions.push({ text, answers });
};

Quiz.prototype.render = function () {
  const lesson_container = document.getElementById('lesson-container');
  if (lesson_container) lesson_container.innerHTML = '';

  const quiz_container = document.querySelector('.quiz-container');
  if (!quiz_container) {
    alert('Quiz container not found!');
    return;
  }

  quiz_container.innerHTML = '';

  lesson_container.innerHTML = `
    <div id="introPage" style="text-align:center; padding:30px;">
      <h2>Welcome to the Quiz!</h2>
      <p>Test your knowledge with this quiz.</p>
      <button id="startQuizBtn">Start Quiz</button>
    </div>
    <div id="quizResults" style="padding:20px; font-size:1.2em;"></div>
  `;

  this.questions.forEach(q => {
    const qDiv = document.createElement('div');
    qDiv.className = 'quiz';
    qDiv.style.display = 'none';
    qDiv.innerHTML = `<p>${q.text}</p>`;

    q.answers.forEach(ans => {
      const btn = document.createElement('button');
      btn.textContent = ans.text;
      btn.onclick = () => checkAnswer(btn, ans.isCorrect, this.unlockLessonId);
      qDiv.appendChild(btn);
    });

    lesson_container.insertBefore(qDiv, document.getElementById('quizResults'));
  });

  const startBtn = document.getElementById('startQuizBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      document.getElementById('introPage').style.display = 'none';
      document.querySelector('.quiz').style.display = 'block';
      setTotalQuestions(this.questions.length);
      resetQuiz();
    });
  }
};

async function loadSidebarLessons() {
  const lessonList = document.getElementById("lesson-list");
  lessonList.innerHTML = "";

  const res = await fetch(`${API_BASE}/api/lessons`);
  const apiLessons = await res.json();   // <- renamed

  // If a client-side saved order exists (fallback), apply it
  try {
    const saved = JSON.parse(localStorage.getItem('lessonOrder') || 'null');
    if (Array.isArray(saved) && saved.length) {
      apiLessons.sort((a, b) => (saved.indexOf(a.id) - saved.indexOf(b.id)));
    }
  } catch (e) { /* ignore parse errors */ }

  // optional: keep local cache in the outer `lessons` array
  lessons.length = 0;
  apiLessons.forEach(l => lessons.push(l));

  apiLessons.forEach(lesson => {
    const li = createLessonListItem(lesson);
    lessonList.appendChild(li);
  });
  // Enable drag-and-drop reordering for admins
  try { enableLessonDragReorder(); } catch (e) { /* ignore if not available */ }
} // end function loadSidebarLessons

// Find the closest element after the pointer for reordering
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function reorderLessonsArray(newOrderIds) {
  if (!Array.isArray(newOrderIds)) return;
  const map = new Map(lessons.map(l => [l.id, l]));
  const reordered = [];
  newOrderIds.forEach(id => {
    if (map.has(id)) reordered.push(map.get(id));
  });
  // append any missing lessons (defensive)
  lessons.forEach(l => { if (!reordered.find(r => r.id === l.id)) reordered.push(l); });
  // mutate existing lessons array
  lessons.length = 0;
  reordered.forEach(r => lessons.push(r));
}

async function persistLessonOrder(ids) {
  if (!ids || !ids.length) return;
  try {
    const res = await fetch(`${API_BASE}/api/lessons/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-User-Role': role },
      body: JSON.stringify({ order: ids })
    });
    if (!res.ok) throw new Error('Server rejected reorder');
    // clear any local fallback
    localStorage.removeItem('lessonOrder');
    return true;
  } catch (e) {
    // Fallback: save to localStorage so order persists in-browser
    try { localStorage.setItem('lessonOrder', JSON.stringify(ids)); } catch (err) { /* ignore */ }
    return false;
  }
}

function enableLessonDragReorder() {
  if (role !== 'admin') return;
  const list = document.getElementById('lesson-list');
  if (!list) return;

  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterEl = getDragAfterElement(list, e.clientY);
    const dragging = list.querySelector('.dragging');
    if (!dragging) return;
    if (!afterEl) {
      list.appendChild(dragging);
    } else {
      list.insertBefore(dragging, afterEl);
    }
  });

  list.addEventListener('drop', async (e) => {
    e.preventDefault();
    const ids = Array.from(list.querySelectorAll('li')).map(li => li.dataset.lessonId);
    reorderLessonsArray(ids);
    await persistLessonOrder(ids);
  });
}

function loadLessonContent(lesson) {
  const container = document.getElementById("lesson-container");
  if (!container) {
    alert("Lesson container not found.");
    return;
  }

  container.innerHTML = "<p>Loading lesson...</p>";
  showLoading(true, "Loading lesson...");

  if (!lesson || !lesson.id) {
    container.innerHTML = "<p>Lesson id not found.</p>";
    showLoading(false);
    return;
  }

  // Call /lessons/<id> (no .html)
  const url = `${API_BASE}/lessons/${encodeURIComponent(lesson.id)}`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error("Failed to load lesson HTML");
      }
      return res.text();
    })
    .then(html => {
      container.innerHTML = html;
      showLoading(false);

      // Determine role at runtime (in case sessionStorage changed)
      const currentRole = sessionStorage.getItem('role') || role;

      // Detect if this lesson contains quiz data
      const quizScript = container.querySelector('#quiz-data');
      const isQuiz = !!quizScript || !!container.querySelector('[data-quiz]');

      if (isQuiz) {
        // If non-admin, render the quiz UI for users
        if (currentRole !== 'admin') {
          renderQuizFromContainer(container);
          return;
        }

        // Admins: add an Edit Quiz button
        const existingEditQuizBtn = document.getElementById('lesson-edit-quiz-btn');
        if (existingEditQuizBtn && existingEditQuizBtn.parentNode) existingEditQuizBtn.parentNode.removeChild(existingEditQuizBtn);

        const editQuizBtn = document.createElement('button');
        editQuizBtn.id = 'lesson-edit-quiz-btn';
        editQuizBtn.textContent = 'Edit Quiz';
        editQuizBtn.style.cssText = "display: inline-block; margin-top: 18px; margin-left: 8px; padding: 8px 14px; background: #1976d2; color: #fff; border: none; border-radius: 6px; cursor: pointer;";

        editQuizBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const existingEditor = document.getElementById('lesson-editor-panel');
          if (existingEditor) return;
          // Hide/disable the edit button while the editor is open
          editQuizBtn.disabled = true;
          editQuizBtn.style.display = 'none';
          addQuizEditor(lesson, container);
        });

        // Build and attach a read-only preview of the quiz below the edit button
        var previewId = 'lesson-quiz-preview-' + lesson.id;
        // Remove any existing preview for this lesson
        const existingPreview = document.getElementById(previewId);
        if (existingPreview && existingPreview.parentNode) existingPreview.parentNode.removeChild(existingPreview);

        const previewDiv = document.createElement('div');
        previewDiv.id = previewId;
        previewDiv.className = 'quiz-preview';
        previewDiv.style.cssText = 'margin-top:12px;padding:12px;background:#fff;border-radius:6px;border:1px solid #e0e0e0;';

        // Populate preview from quiz data if available
        try {
          const raw = quizScript ? quizScript.textContent.trim() : null;
          const quizData = raw ? JSON.parse(raw) : { questions: [] };
          if (!quizData.questions || !quizData.questions.length) {
            previewDiv.innerHTML = '<em>No questions in quiz.</em>';
          } else {
            const list = document.createElement('div');
            quizData.questions.forEach((q, i) => {
              const qWrap = document.createElement('div');
              qWrap.style.marginBottom = '10px';
              const qTitle = document.createElement('div');
              qTitle.style.fontWeight = '700';
              qTitle.textContent = (i + 1) + '. ' + (q.text || 'Untitled question');
              qWrap.appendChild(qTitle);
              const opts = document.createElement('ul');
              opts.style.margin = '6px 0 0 18px';
              (q.options || []).forEach(opt => {
                const li = document.createElement('li');
                li.textContent = opt;
                opts.appendChild(li);
              });
              qWrap.appendChild(opts);
              list.appendChild(qWrap);
            });
            previewDiv.appendChild(list);
          }
        } catch (e) {
          previewDiv.innerHTML = '<em>Preview unavailable.</em>';
        }

        container.appendChild(editQuizBtn);
        container.appendChild(previewDiv);
        return;
      }

      // If not a quiz, provide the regular lesson editor for admins only
      if (currentRole === 'admin') {
        // Remove any existing edit button to avoid duplicates
        const existingEditBtn = document.getElementById('lesson-edit-btn');
        if (existingEditBtn && existingEditBtn.parentNode) existingEditBtn.parentNode.removeChild(existingEditBtn);

        const editBtn = document.createElement('button');
        editBtn.id = 'lesson-edit-btn';
        editBtn.textContent = 'Edit Lesson';
        editBtn.style.cssText = "display: inline-block; margin-top: 18px; margin-left: 8px; padding: 8px 14px; background: #2196f3; color: #fff; border: none; border-radius: 6px; cursor: pointer;";

        // When clicked, show the editor (if not already open)
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const existingEditor = document.getElementById('lesson-editor-panel');
          if (existingEditor) {
            const ta = document.getElementById('lesson-content-editor');
            if (ta) ta.focus();
            return;
          }

          // Hide/disable the edit button immediately while editor opens
          editBtn.disabled = true;
          editBtn.style.display = 'none';
          addLessonEditor(lesson, container);
        });

        // Append the edit button after the lesson content
        container.appendChild(editBtn);
      }
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Sorry, this lesson could not be loaded.</p>";
      showLoading(false);
    });
} // end function loadLessonContent

// Add a user-friendly WYSIWYG editor for admins to edit lesson content
function addLessonEditor(lesson, container) {
  // Create editor panel
  const editorPanel = document.createElement("div");
  editorPanel.id = "lesson-editor-panel";
  editorPanel.style.cssText = `
    margin-top: 30px;
    padding: 20px;
    border: 2px solid #2196f3;
    border-radius: 8px;
    background: #f9f9f9;
  `;

  const editorTitle = document.createElement("h3");
  editorTitle.textContent = "Edit Lesson Content";
  editorPanel.appendChild(editorTitle);

  // Title input so admins can change the lesson title
  const titleLabel = document.createElement('div');
  titleLabel.textContent = 'Title:';
  titleLabel.style.cssText = 'font-weight:700;margin-top:6px;margin-bottom:6px;';
  const titleInput = document.createElement('input');
  titleInput.id = 'lesson-editor-title';
  titleInput.type = 'text';
  titleInput.value = lesson.title || '';
  titleInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-bottom:10px;box-sizing:border-box;';
  editorPanel.appendChild(titleLabel);
  editorPanel.appendChild(titleInput);

  // Create the contentEditable editor element
  const editor = document.createElement('div');
  editor.id = 'lesson-html-editor';
  editor.contentEditable = true;
  editor.style.cssText = `
    width: 100%;
    min-height: 300px;
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 1rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin-bottom: 15px;
    box-sizing: border-box;
  `;
  // Parse existing HTML content from lesson and populate editor
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = lesson.html || '';
  // Extract just the body content (skip DOCTYPE and head)
  const bodyMatch = (lesson.html || '').match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    editor.innerHTML = bodyMatch[1];
  } else {
    editor.innerHTML = tempDiv.innerHTML;
  }
  editorPanel.appendChild(editor);

  // Create toolbar
  const toolbar = document.createElement("div");
  toolbar.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px;padding:10px;background:#fff;border:1px solid #ddd;border-radius:4px;';

  // Helper to create toolbar buttons
  const createToolbarBtn = (label, onClick) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.style.cssText = 'padding:6px 12px;background:#2196f3;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.9rem;font-weight:500;';
    btn.onmouseover = () => btn.style.background = '#1976d2';
    btn.onmouseout = () => btn.style.background = '#2196f3';
    btn.onclick = onClick;
    return btn;
  };

  // Helper function to insert HTML elements
  const insertElement = (tag, text) => {
    const el = document.createElement(tag);
    el.textContent = text;
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.insertNode(el);
      editor.focus();
    } else {
      editor.appendChild(el);
      editor.focus();
    }
  };

  // Helper function to insert images
  const insertImage = (url) => {
    const img = document.createElement('img');
    img.src = url;
    img.style.cssText = 'max-width:100%;height:auto;margin:8px 0;border-radius:4px;';
    editor.appendChild(img);
    editor.focus();
  };

  // Helper function to insert YouTube videos
  const insertVideo = (url) => {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      alert('Invalid YouTube URL');
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.style.cssText = 'width:100%;max-width:600px;height:400px;margin:12px 0;border-radius:4px;';
    iframe.allow = 'accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture';
    iframe.allowFullscreen = true;
    editor.appendChild(iframe);
    editor.focus();
  };

  // Heading buttons
  toolbar.appendChild(createToolbarBtn("H1", () => insertElement("h1", "Heading 1")));
  toolbar.appendChild(createToolbarBtn("H2", () => insertElement("h2", "Heading 2")));
  toolbar.appendChild(createToolbarBtn("H3", () => insertElement("h3", "Heading 3")));

  // Paragraph button
  toolbar.appendChild(createToolbarBtn("Paragraph", () => insertElement("p", "Your text here")));

  // Text formatting
  toolbar.appendChild(createToolbarBtn("Bold", () => insertElement("strong", "bold text")));
  toolbar.appendChild(createToolbarBtn("Italic", () => insertElement("em", "italic text")));

  // Image button
  toolbar.appendChild(createToolbarBtn("🖼 Insert Image", () => {
    const url = prompt("Enter image URL:");
    if (url) insertImage(url);
  }));

  // Video button
  toolbar.appendChild(createToolbarBtn("🎬 Insert Video", () => {
    const url = prompt("Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=...):");
    if (url) insertVideo(url);
  }));

  // Slideshow button
  toolbar.appendChild(createToolbarBtn("📽 Insert Slideshow", () => {
    showSlideshowDialog();
  }));

  editorPanel.insertBefore(toolbar, editor);

  // Slideshow dialog and insertion logic
  function showSlideshowDialog() {
    // Modal dialog for slideshow creation
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.25);z-index:9999;display:flex;align-items:center;justify-content:center;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;padding:24px 28px;border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,0.18);min-width:340px;max-width:95vw;';
    box.innerHTML = '<h3 style="margin-top:0">Create Slideshow</h3>';
    const slides = [];
    const slidesList = document.createElement('div');
    slidesList.style.cssText = 'margin-bottom:12px;';
    function renderSlides() {
      slidesList.innerHTML = '';
      slides.forEach((slide, i) => {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
        const typeSel = document.createElement('select');
        typeSel.innerHTML = '<option value="text">Text</option><option value="image">Image</option>';
        typeSel.value = slide.type;
        typeSel.onchange = () => { slide.type = typeSel.value; renderSlides(); };
        row.appendChild(typeSel);
        if (slide.type === 'text') {
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = 'Slide text';
          input.value = slide.content;
          input.style.cssText = 'flex:1;padding:4px 8px;';
          input.oninput = () => slide.content = input.value;
          row.appendChild(input);
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = 'Image URL';
          input.value = slide.content;
          input.style.cssText = 'flex:1;padding:4px 8px;';
          input.oninput = () => slide.content = input.value;
          row.appendChild(input);
        }
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Remove';
        delBtn.onclick = () => { slides.splice(i,1); renderSlides(); };
        row.appendChild(delBtn);
        slidesList.appendChild(row);
      });
    }
    renderSlides();
    box.appendChild(slidesList);
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add Slide';
    addBtn.onclick = () => { slides.push({type:'text',content:''}); renderSlides(); };
    box.appendChild(addBtn);
    box.appendChild(document.createElement('br'));
    box.appendChild(document.createElement('br'));
    const insertBtn = document.createElement('button');
    insertBtn.textContent = 'Insert Slideshow';
    insertBtn.style.cssText = 'margin-right:10px;background:#2196f3;color:#fff;padding:8px 16px;border:none;border-radius:4px;cursor:pointer;';
    insertBtn.onclick = () => {
      if (!slides.length) { alert('Add at least one slide.'); return; }
      // Insert a custom HTML block for the slideshow
      const slideshowId = 'slideshow-' + Math.random().toString(36).slice(2,10);
      let html = `<div class="gta-slideshow" data-slideshow-id="${slideshowId}" style="max-width:600px;margin:18px auto 18px auto;background:#f5f5f5;border-radius:8px;padding:18px 12px;box-shadow:0 2px 8px #0001;">
        <div class="gta-slide" style="min-height:60px;text-align:center;font-size:1.2em;"></div>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:10px;">
          <button class="gta-prev-slide">Previous</button>
          <span class="gta-slide-num"></span>
          <button class="gta-next-slide">Next</button>
        </div>
        <script type="application/json" class="gta-slideshow-data">${JSON.stringify(slides)}</script>
      </div>`;
      // Insert at caret
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const frag = document.createDocumentFragment();
        while (temp.firstChild) frag.appendChild(temp.firstChild);
        range.insertNode(frag);
      }
      document.body.removeChild(modal);
      editor.focus();
      setTimeout(() => renderAllSlideshows(), 100);
    };
    box.appendChild(insertBtn);
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => document.body.removeChild(modal);
    box.appendChild(cancelBtn);
    modal.appendChild(box);
    document.body.appendChild(modal);
  }

  // Render all slideshows in the editor preview (for admin preview)
  function renderAllSlideshows() {
    const slideshows = editor.querySelectorAll('.gta-slideshow');
    slideshows.forEach(slideshow => {
      renderSlideshow(slideshow);
    });
  }

  // Render a single slideshow (shared with student view)
  function renderSlideshow(slideshow) {
    const dataScript = slideshow.querySelector('.gta-slideshow-data');
    if (!dataScript) return;
    let slides = [];
    try { slides = JSON.parse(dataScript.textContent); } catch (e) { return; }
    let idx = 0;
    const slideDiv = slideshow.querySelector('.gta-slide');
    const numSpan = slideshow.querySelector('.gta-slide-num');
    const prevBtn = slideshow.querySelector('.gta-prev-slide');
    const nextBtn = slideshow.querySelector('.gta-next-slide');
    function showSlide(i) {
      idx = i;
      if (idx < 0) idx = 0;
      if (idx >= slides.length) idx = slides.length-1;
      const s = slides[idx];
      if (s.type === 'text') {
        slideDiv.innerHTML = `<div style="padding:18px 0;">${s.content.replace(/</g,'&lt;').replace(/\n/g,'<br>')}</div>`;
      } else if (s.type === 'image') {
        slideDiv.innerHTML = `<img src="${s.content}" style="max-width:100%;max-height:320px;border-radius:6px;box-shadow:0 2px 8px #0002;\" alt="Slide image">`;
      }
      numSpan.textContent = `Slide ${idx+1} of ${slides.length}`;
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === slides.length-1;
    }
    prevBtn.onclick = () => showSlide(idx-1);
    nextBtn.onclick = () => showSlide(idx+1);
    showSlide(0);
  }

  // Render slideshows on initial open
  setTimeout(() => renderAllSlideshows(), 100);

  // Create buttons container
  const buttonDiv = document.createElement("div");
  buttonDiv.style.cssText = "display: flex; gap: 10px; margin-top: 15px; align-items: center;";

  // Inline status message
  const statusDiv = document.createElement('div');
  statusDiv.id = 'lesson-editor-status';
  statusDiv.style.cssText = 'margin-right: 12px; color: #333; font-size: 0.95rem;';
  statusDiv.textContent = '';

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save Changes";
  saveBtn.style.cssText = `
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    padding: 10px 20px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  `;

  // When editor opens, disable the Edit button to avoid duplicates
  const editBtn = document.getElementById('lesson-edit-btn');
  if (editBtn) editBtn.disabled = true;

  // Cancel handler: remove editor and re-enable edit button
  cancelBtn.onclick = () => {
    editorPanel.remove();
    if (editBtn) {
      editBtn.disabled = false;
      editBtn.style.display = 'inline-block';
    }
  };

  // Save handler: disable buttons, show inline status, perform save, then re-enable or reload
  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    if (editBtn) editBtn.disabled = true;
    statusDiv.textContent = 'Saving...';

    const success = await saveLessonContent(lesson, editor.innerHTML, statusDiv);

    if (!success) {
      // Re-enable if failed
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
      if (editBtn) editBtn.disabled = false;
    } else {
      // On successful save, close the editor and reload so admin sees the updated page
      try {
        if (editorPanel && editorPanel.parentNode) editorPanel.parentNode.removeChild(editorPanel);
      } catch (e) { /* ignore */ }
      // Reload only the lesson area so admin can see updated content
      setTimeout(() => {
        try { loadLessonContent(lesson); } catch (e) { console.error('Failed to reload lesson after save', e); }
      }, 200);
    }
  };

  buttonDiv.appendChild(statusDiv);
  buttonDiv.appendChild(saveBtn);
  buttonDiv.appendChild(cancelBtn);
  editorPanel.appendChild(buttonDiv);
  container.appendChild(editorPanel);

  // Focus the editor so admin can start editing immediately
  editor.focus();
} // end function addLessonEditor

// Helper to extract YouTube video ID
function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

// Render a quiz UI for non-admin users from a loaded lesson container
function renderQuizFromContainer(container) {
  try {
    const script = container.querySelector('#quiz-data');
    const raw = script ? script.textContent.trim() : null;
    const quiz = raw ? JSON.parse(raw) : { questions: [] };

    // Build quiz UI
    const quizRoot = document.createElement('div');
    quizRoot.className = 'user-quiz-root';
    quizRoot.style.cssText = 'padding:20px; background:#fff; border-radius:8px;';

    if (!quiz.questions || !quiz.questions.length) {
      quizRoot.innerHTML = '<p>No questions available for this quiz.</p>';
      container.innerHTML = '';
      container.appendChild(quizRoot);
      return;
    }

    let current = 0;
    const answers = new Array(quiz.questions.length).fill(null);

    function showQuestion(i) {
      const q = quiz.questions[i];
      quizRoot.innerHTML = '';
      const qnum = document.createElement('div');
      qnum.textContent = `Question ${i + 1} of ${quiz.questions.length}`;
      qnum.style.fontWeight = '700';
      qnum.style.marginBottom = '8px';
      quizRoot.appendChild(qnum);

      const qtext = document.createElement('div');
      qtext.textContent = q.text;
      qtext.style.marginBottom = '12px';
      quizRoot.appendChild(qtext);

      const opts = document.createElement('div');
      opts.style.display = 'flex';
      opts.style.flexDirection = 'column';
      opts.style.gap = '8px';

      q.options.forEach((opt, idx) => {
        const label = document.createElement('label');
        label.style.cursor = 'pointer';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'quiz-option';
        radio.checked = answers[i] === idx;
        radio.onchange = () => answers[i] = idx;
        label.appendChild(radio);
        const span = document.createElement('span');
        span.textContent = ' ' + opt;
        label.appendChild(span);
        opts.appendChild(label);
      });

      quizRoot.appendChild(opts);

      const nav = document.createElement('div');
      nav.style.display = 'flex';
      nav.style.justifyContent = 'space-between';
      nav.style.marginTop = '16px';

      const prev = document.createElement('button');
      prev.textContent = '← Previous';
      prev.disabled = i === 0;
      prev.onclick = () => { current = Math.max(0, current - 1); showQuestion(current); };

      const next = document.createElement('button');
      next.textContent = i === quiz.questions.length - 1 ? 'Submit' : 'Next →';
      next.onclick = () => {
        // require answer
        if (answers[i] === null) { alert('Please select an answer before continuing.'); return; }
        if (i < quiz.questions.length - 1) { current++; showQuestion(current); } else { finishQuiz(); }
      };

      nav.appendChild(prev);
      nav.appendChild(next);
      quizRoot.appendChild(nav);
    }

    function finishQuiz() {
      let correct = 0;
      quiz.questions.forEach((q, idx) => { if (answers[idx] === q.correct) correct++; });
      const pct = Math.round((correct / quiz.questions.length) * 100);
      quizRoot.innerHTML = `<h3>Quiz Complete</h3><p>Your score: ${pct}% (${correct}/${quiz.questions.length})</p>`;
      const msg = document.createElement('div');
      msg.style.marginTop = '12px';
      if (pct >= 75) {
        msg.innerHTML = '<strong style="color:green">You passed the quiz!</strong>';
      } else {
        msg.innerHTML = '<strong style="color:red">You did not pass. Try again.</strong>';
      }
      quizRoot.appendChild(msg);

      const retry = document.createElement('button');
      retry.textContent = 'Retake Quiz';
      retry.style.marginTop = '12px';
      retry.onclick = () => { for (let i=0;i<answers.length;i++) answers[i]=null; current=0; showQuestion(0); };
      quizRoot.appendChild(retry);
    }

    container.innerHTML = '';
    container.appendChild(quizRoot);
    showQuestion(0);
  } catch (err) {
    console.error('Failed to render quiz', err);
  }
}

// Admin quiz editor: allows creating/editing multiple-choice questions and saving them into the lesson file
function addQuizEditor(lesson, container) {
  // Parse existing quiz data if present
  const existingScript = container.querySelector('#quiz-data');
  let quiz = { questions: [] };
  if (existingScript) {
    try { quiz = JSON.parse(existingScript.textContent || '{}'); } catch (e) { quiz = { questions: [] }; }
  }

  // Create editor panel similar to lesson editor
  const editorPanel = document.createElement('div');
  editorPanel.id = 'lesson-editor-panel';
  editorPanel.style.cssText = `
    margin-top: 30px;
    padding: 20px;
    border: 2px solid #8e24aa;
    border-radius: 8px;
    background: #fff;
  `;

  const title = document.createElement('h3');
  title.textContent = 'Quiz Editor';
  editorPanel.appendChild(title);

  // Title input for quiz (allows changing the lesson/quiz title)
  const titleLabel = document.createElement('div');
  titleLabel.textContent = 'Title:';
  titleLabel.style.cssText = 'font-weight:700;margin-top:6px;margin-bottom:6px;';
  const titleInput = document.createElement('input');
  titleInput.id = 'lesson-editor-title';
  titleInput.type = 'text';
  titleInput.value = lesson.title || '';
  titleInput.style.cssText = 'width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-bottom:10px;box-sizing:border-box;';
  editorPanel.appendChild(titleLabel);
  editorPanel.appendChild(titleInput);

  const list = document.createElement('div');
  list.id = 'quiz-question-list';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '12px';

  function renderQuestionEditor(q, idx) {
    const wrap = document.createElement('div');
    wrap.style.border = '1px solid #ddd';
    wrap.style.padding = '10px';
    wrap.style.borderRadius = '6px';

    const qLabel = document.createElement('input');
    qLabel.type = 'text';
    qLabel.value = q.text || '';
    qLabel.placeholder = 'Question text';
    qLabel.style.width = '100%';
    wrap.appendChild(qLabel);

    const optsWrap = document.createElement('div');
    optsWrap.style.display = 'flex';
    optsWrap.style.flexDirection = 'column';
    optsWrap.style.marginTop = '8px';
    q.options = q.options || [];

    q.options.forEach((opt, i) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.style.alignItems = 'center';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = `correct-${idx}`;
      radio.checked = q.correct === i;
      radio.onchange = () => q.correct = i;

      const optInput = document.createElement('input');
      optInput.type = 'text';
      optInput.value = opt;
      optInput.style.flex = '1';
      optInput.oninput = () => q.options[i] = optInput.value;

      const removeOpt = document.createElement('button');
      removeOpt.textContent = 'Remove';
      removeOpt.onclick = () => { q.options.splice(i,1); refreshList(); };

      row.appendChild(radio);
      row.appendChild(optInput);
      row.appendChild(removeOpt);
      optsWrap.appendChild(row);
    });

    const addOpt = document.createElement('button');
    addOpt.textContent = 'Add Option';
    addOpt.onclick = () => { q.options.push('New option'); refreshList(); };
    addOpt.style.marginTop = '8px';
    wrap.appendChild(optsWrap);
    wrap.appendChild(addOpt);

    const removeQ = document.createElement('button');
    removeQ.textContent = 'Remove Question';
    removeQ.style.marginLeft = '8px';
    removeQ.onclick = () => { quiz.questions.splice(idx,1); refreshList(); };
    wrap.appendChild(removeQ);

    return {wrap, qLabel};
  }

  function refreshList() {
    list.innerHTML = '';
    quiz.questions.forEach((q, idx) => {
      const {wrap, qLabel} = renderQuestionEditor(q, idx);
      // update q.text from input on blur
      qLabel.onblur = () => q.text = qLabel.value;
      list.appendChild(wrap);
    });
  }

  refreshList();
  editorPanel.appendChild(list);

  // If the edit button exists, disable/hide it while editor is open
  const editQuizBtn = document.getElementById('lesson-edit-quiz-btn');
  const previewEl = document.getElementById(`lesson-quiz-preview-${lesson.id}`);
  if (editQuizBtn) {
    editQuizBtn.disabled = true;
    editQuizBtn.style.display = 'none';
  }
  if (previewEl) {
    previewEl.style.display = 'none';
  }

  const addQ = document.createElement('button');
  addQ.textContent = 'Add Question';
  addQ.onclick = () => { quiz.questions.push({ text: 'New question', options: ['Option 1','Option 2'], correct: 0 }); refreshList(); };
  addQ.style.marginTop = '10px';
  editorPanel.appendChild(addQ);

  const statusDiv = document.createElement('div');
  statusDiv.style.marginTop = '12px';
  editorPanel.appendChild(statusDiv);

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save Quiz';
  saveBtn.style.marginTop = '12px';
  saveBtn.onclick = async () => {
    // Basic validation
    for (const q of quiz.questions) {
      if (!q.text || !q.options || q.options.length < 2) { alert('Each question needs text and at least two options.'); return; }
      if (typeof q.correct !== 'number' || q.correct < 0 || q.correct >= q.options.length) { alert('Please mark a correct option for every question.'); return; }
    }

    const ti = document.getElementById('lesson-editor-title');
    const titleVal = (ti && ti.value && ti.value.trim()) ? ti.value.trim() : (lesson.title || 'Quiz');
    const html = `<!DOCTYPE html>
  <html lang="en">
  <head><meta charset="utf-8"><title>${titleVal}</title></head>
  <body>
    <h1>${titleVal}</h1>
    <div data-quiz="true"></div>
    <script id="quiz-data" type="application/json">${JSON.stringify(quiz)}</script>
  </body>
  </html>`;

    statusDiv.textContent = 'Saving quiz...';
    const ok = await saveLessonContent(lesson, html, statusDiv);
      if (ok) {
        statusDiv.textContent = 'Saved.';
        // Re-enable/show edit button in case load fails
        if (editQuizBtn) {
          editQuizBtn.disabled = false;
          editQuizBtn.style.display = 'inline-block';
        }
        // reload lesson content to show updated view (this will recreate preview)
        loadLessonContent(lesson);
        if (editorPanel && editorPanel.parentNode) editorPanel.remove();
      } else {
        statusDiv.textContent = 'Save failed.';
        // Re-enable the edit button so admin can try again
        if (editQuizBtn) {
          editQuizBtn.disabled = false;
          editQuizBtn.style.display = 'inline-block';
        }
        if (previewEl) previewEl.style.display = 'block';
      }
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.marginLeft = '8px';
    cancelBtn.onclick = () => {
      if (editorPanel && editorPanel.parentNode) editorPanel.remove();
      if (editQuizBtn) {
        editQuizBtn.disabled = false;
        editQuizBtn.style.display = 'inline-block';
      }
      if (previewEl) previewEl.style.display = 'block';
    };

    editorPanel.appendChild(saveBtn);
    editorPanel.appendChild(cancelBtn);

    container.appendChild(editorPanel);
  }

// Save edited lesson content back to the backend
async function saveLessonContent(lesson, html, statusDiv) {
  if (!lesson || !lesson.id) {
    if (statusDiv) statusDiv.textContent = "Missing lesson id.";
    return false;
  }

  const url = `${API_BASE}/lessons/${encodeURIComponent(lesson.id)}`;

  try {
    const body = { content: html };
    // If a title input exists in the editor, include it in the request
    try {
      const titleInput = document.getElementById('lesson-editor-title');
      if (titleInput && titleInput.value && titleInput.value.trim()) {
        body.title = titleInput.value.trim();
      }
    } catch (e) { /* ignore DOM errors */ }

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Role": role
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      if (statusDiv) statusDiv.textContent = `Save failed: ${res.status}`;
      return false;
    }

    if (statusDiv) statusDiv.textContent = "Saved!";

    // If title changed, update client-side model and sidebar label
    try {
      if (body.title) {
        lesson.title = body.title;
        const li = document.querySelector(`#lesson-list li[data-lesson-id="${lesson.id}"]`);
        if (li) {
          const span = li.querySelector('span');
          if (span) span.textContent = body.title;
        }
      }
    } catch (e) { /* ignore DOM update errors */ }

    return true;
  } catch (err) {
    console.error(err);
    if (statusDiv) statusDiv.textContent = "Save failed (network error).";
    return false;
  }
} // end function saveLessonContent 

// Call this after you verify user is logged in — show loading while sidebar populates
(async function initAfterLogin() {
  try {
    showLoading(true, 'Loading lessons...');
    await loadSidebarLessons();
  } catch (e) {
    console.error('Failed to load sidebar lessons', e);
  } finally {
    showLoading(false);
  }
})();
