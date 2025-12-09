// script.js — used on main.html only

// --------------------
// Auth / role handling
// --------------------

// Simple front-end guard: require login
if (sessionStorage.getItem('loggedIn') !== 'true') {
  window.location.href = 'index.html';
}

// Read role set by register.js ('admin' or 'student')
const role = sessionStorage.getItem('role');
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

const lessonList = document.getElementById('lesson-list');
const addLessonBtn = document.getElementById('add-lesson-btn');

// simple in-memory store; you can persist to backend later
const lessons = [];

// Helper to create a sidebar item
function createLessonListItem(lesson) {
  const li = document.createElement('li');
  li.textContent = lesson.title;
  li.dataset.lessonId = lesson.id;
  li.onclick = () => showLesson(lesson.id);  // reuse your existing showLesson
  return li;
}

// When admin clicks "+ Add Lesson"
if (addLessonBtn && role === 'admin') {
  addLessonBtn.addEventListener('click', () => {
    const title = prompt('Enter a title for the new lesson:');
    if (!title) return;

    // create a simple id from the title
    const idBase = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
    const id = idBase || `lesson-${lessons.length + 1}`;

    const newLesson = {
      id,
      title,
    };
    lessons.push(newLesson);

    // add to sidebar
    const li = createLessonListItem(newLesson);
    lessonList.appendChild(li);

    // optionally create a placeholder content div
    const content = document.createElement('div');
    content.id = id;
    content.className = 'lesson-content';
    content.style.display = 'none';
    content.innerHTML = `
      <h1>${title}</h1>
      <p>This is a new lesson created by the admin.</p>
    `;
    const contentArea = document.querySelector('main .content');
    if (contentArea) {
      contentArea.appendChild(content);
    }
  });
}

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

// Sample instances (modify as needed)
const lesson1 = new Lesson('lesson1', 'Lesson 1: Introduction', 'lessons/lesson1.html');
const lesson2 = new Lesson('lesson2', 'Lesson 2: Nail Basics', 'lessons/lesson2.html');

const lesson2Quiz = new Quiz('lesson2quiz', 70, 'lesson3');
lesson2Quiz.addQuestion('What is nail polish used for?', [
  { text: 'Painting nails', isCorrect: true },
  { text: 'Facial treatment', isCorrect: false },
  { text: 'Skin care', isCorrect: false }
]);
lesson2Quiz.addQuestion('Where does shampoo go?', [
  { text: 'on your back', isCorrect: false },
  { text: 'between your fingers', isCorrect: false },
  { text: 'in your hair', isCorrect: true }
]);
