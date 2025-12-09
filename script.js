// script.js — used on main.html only

const API_BASE = "https://the-getaway-academy.onrender.com";
const role = sessionStorage.getItem("role");
const lessonList = document.getElementById("lesson-list");
const addLessonBtn = document.getElementById("add-lesson-btn");

// --------------------
// Auth / role handling
// --------------------

// Simple front-end guard: require login
if (sessionStorage.getItem('loggedIn') !== 'true') {
  window.location.href = 'index.html';
}

// Read role set by register.js ('admin' or 'student')
const adminBadge = document.getElementById('admin-badge');
if (role === 'admin' && adminBadge) {
  adminBadge.style.display = 'block';   // show ADMIN MODE
} else if (adminBadge) {
  adminBadge.style.display = 'none';    // hide for students
}

// Show admin controls (add button) only for admins
const adminControls = document.getElementById('admin-controls');
if (adminControls) {
  adminControls.style.display = role === 'admin' ? 'block' : 'none';
}

// simple in-memory store; you can persist to backend later
const lessons = [];

// Helper to create a sidebar item
function createLessonListItem(lesson) {
  const li = document.createElement("li");
  li.classList.add("admin-owned");
  li.dataset.lessonId = lesson.id;

  const titleSpan = document.createElement("span");
  titleSpan.textContent = lesson.title;

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "✕";
  removeBtn.className = "remove-lesson-btn";
  removeBtn.onclick = (e) => {
    e.stopPropagation();                 // don’t trigger li click
    removeLesson(lesson.id, li);
  };

  // Single click handler for the whole list item
  li.onclick = () => {
    // Clear previous selection
    document
      .querySelectorAll(".sidebar ul li.selected")
      .forEach(el => el.classList.remove("selected"));

    // Mark this one as selected
    li.classList.add("selected");

    // Load lesson content
    loadLessonContent(lesson);
  };

  li.appendChild(titleSpan);
  li.appendChild(removeBtn);
  return li;
} // end function createLessonListItem

async function removeLesson(lessonId, liElement) {
  if (!confirm("Remove this lesson?")) return;

  const res = await fetch(`${API_BASE}/api/lessons/${encodeURIComponent(lessonId)}`, {
    method: "DELETE",
    headers: {
      "X-User-Role": role
    }
  });

  if (!res.ok && res.status !== 204) {
    alert("Failed to remove lesson.");
    return;
  }

  // Remove from DOM
  if (liElement && liElement.parentNode) {
    liElement.parentNode.removeChild(liElement);
  }
  const contentEl = document.getElementById(lessonId);
  if (contentEl && contentEl.parentNode) {
    contentEl.parentNode.removeChild(contentEl);
  }
} // end method removeLesson

// When admin clicks "+ Add Lesson"
if (addLessonBtn && role === "admin") {
  addLessonBtn.addEventListener("click", async () => {
    const name = prompt("Enter a name for the new lesson:");
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

  // optional: keep local cache in the outer `lessons` array
  lessons.length = 0;
  apiLessons.forEach(l => lessons.push(l));

  apiLessons.forEach(lesson => {
    const li = createLessonListItem(lesson);
    lessonList.appendChild(li);
  });
}

function loadLessonContent(lesson) {
  const container = document.getElementById("lesson-container");
  if (!container) return;

  fetch(lesson.path)
    .then(r => r.text())
    .then(html => {
      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Sorry, this lesson could not be loaded.</p>";
    });
}

// Call this after you verify user is logged in
loadSidebarLessons();
