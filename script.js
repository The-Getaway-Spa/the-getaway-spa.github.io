/// Variable declarations
let totalQuestions = document.querySelectorAll('.quiz').length;
let correctAnswers = 0;
let currentLesson = null;

// event listeners
document.getElementById('startQuizBtn').addEventListener('click', () => {
  // Hide intro
  document.getElementById('introPage').style.display = 'none';
  // Show quiz container and first question
  const quizContainer = document.querySelector('.quiz-container');
  quizContainer.style.display = 'block';

  resetQuiz();
});

/// Functions

// Source - https://stackoverflow.com/a
// Posted by bharatadk
// Retrieved 2025-11-19, License - CC BY-SA 4.0
const video = document.querySelector('video');
const playButton = document.querySelector('button');
playButton.addEventListener('click', function() {
 video.play();
});

function setTotalQuestions(numOfQuestions) {
  totalQuestions = numOfQuestions;
} // end function setTotalQuestions

function resetQuiz() {
  // Reset scores and button colors
  correctAnswers = 0;
  const quizzes = document.querySelectorAll('.quiz');
  quizzes.forEach((q, i) => {
    q.style.display = i === 0 ? 'block' : 'none';
    resetButtonColors(q);
  });

  // Clear previous results if any
  document.getElementById('quizResults').innerHTML = '';
} // end function resetQuiz
function resetButtonColors(quizDiv) {
  const buttons = quizDiv.querySelectorAll('button');
  buttons.forEach(button => {
    button.classList.remove('correct', 'wrong');
  });
} // end function resetButtonColors

function checkAnswer(btn, isCorrect, unlockLessonId = "lesson3") {
  if (isCorrect) {
    correctAnswers++;
    btn.classList.add("correct");
    //alert("Correct!");
  } else {
    btn.classList.add("wrong");
    //alert("Wrong, try again!");
  }
  setTimeout(function () {
    const current = btn.closest('.quiz');
    current.style.display = 'none';
    const next = current.nextElementSibling;
    if (next && next.classList.contains('quiz')) {
      next.style.display = 'block';
    } else {
      // End of quiz - show results inside the quizResults container
      const scorePercent = (correctAnswers / totalQuestions) * 100;
      if (scorePercent >= 70) { 
        if (unlockLessonId) unlockSidebarSection(unlockLessonId);
      } // Unlock sections if passed
      const resultsDiv = document.getElementById('quizResults');
      resultsDiv.innerHTML = `
        <h2>Quiz Completed!</h2>
        <p>Your score: ${scorePercent.toFixed(2)}%</p>
        ${scorePercent >= 70 ? '<p>Congratulations, you passed!</p>' :
          '<p>You did not pass. Please try again.</p>'}
        <button id="retakeBtn">Retake Quiz</button>
      `;


      // Add retake quiz functionality
      document.getElementById('retakeBtn').addEventListener('click', () => {
      resultsDiv.innerHTML = '';
      correctAnswers = 0;
      const quizzes = document.querySelectorAll('.quiz');
      quizzes.forEach((q, i) => q.style.display = i === 0 ? 'block' : 'none');
      });
      //resetQuiz();
        // Reset scores and button colors
    //correctAnswers = 0;
    const quizzes = document.querySelectorAll('.quiz');
    quizzes.forEach((q, i) => {
    //q.style.display = i === 0 ? 'block' : 'none';
    resetButtonColors(q);
  });

  // Clear previous results if any
  //document.getElementById('quizResults').innerHTML = '';
  }
  }, 500);
} // end function checkAnswer

function showIfUnlocked(lessonId) {

} // end function showIfUnlocked

function showLesson(lessonId) {
  const lessonItem = document.getElementById(lessonId);
  if (lessonItem && lessonItem.classList.contains('locked')) {
    alert('This lesson is locked. Please complete the previous lessons to unlock it.');
    return false;
  }

  // Hide all content areas
  document.querySelectorAll('.lesson-content').forEach(div => div.style.display = 'none');
  document.querySelectorAll('.quiz-container').forEach(div => div.style.display = 'none');

  // Prefer the *_content element; if not found, use the base id
  const contentEl = document.getElementById(lessonId + '_content') || document.getElementById(lessonId);
  if (contentEl) {
    contentEl.style.display = 'block';
  }
}// end function showLesson

function unlockSidebarSection(SectionId) {
  const lockedItems = document.querySelectorAll('.sidebar .locked');
  lockedItems.forEach(item => {
    if (item.id === SectionId) {
      // Unlock this specific lesson
      item.classList.remove('locked');
      item.style.color = '';            // Reset color
      item.style.cursor = 'pointer';   // Restore pointer cursor
      // Enable clicking by replacing onclick handler
      item.onclick = function () { showLesson(this.id); };
    }
  });
}


/// Objects

// Lesson class
function Lesson(id, title, contentPath) {
  this.id = id;            // logical id, e.g. "lesson1"
  this.title = title;      // display title
  this.content = contentPath; // e.g. "lessons/lesson1.html"
}

Lesson.prototype.openLesson = async function () {
  // Hide quizzes / other lesson content
  document.querySelectorAll('.lesson-content').forEach(div => div.style.display = 'none');
  document.querySelectorAll('.quiz-container').forEach(div => div.style.display = 'none');

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
  if (container) {
    container.innerHTML = '';
  }
};
// end class Lesson

// Quiz class
function Quiz(id, passPercent, unlockLessonId) {
  this.id = id;                    // e.g. 'lesson2quiz'
  this.passPercent = passPercent;  // e.g. 70
  this.unlockLessonId = unlockLessonId || null;
  this.questions = [];
}

Quiz.prototype.addQuestion = function (text, answers) {
  // answers: [{ text: 'Painting nails', isCorrect: true }, ...]
  this.questions.push({ text, answers });
};

Quiz.prototype.render = function () {
  //alert(`Rendering quiz: ${this.id}`);

  // Hide other content
  //document.querySelectorAll('.lesson-content').forEach(div => div.style.display = 'none');
  //document.querySelectorAll('.quiz-container').forEach(div => div.style.display = 'none');

  const lesson_container = document.getElementById('lesson-container');
  if (lesson_container) {
    //alert('Clearing lesson container for quiz rendering.');
    lesson_container.innerHTML = '';
  }

  const quiz_container = document.querySelector('.quiz-container');
  if (!quiz_container) {
    alert('Quiz container not found!');
    return;
  } else {
    alert('Quiz container was found!');
  }

  // Clear old quiz
  quiz_container.innerHTML = '';

  // Intro / start button (optional; you can reuse your existing introPage markup)
  lesson_container.innerHTML = `
    <div id="introPage" style="text-align:center; padding:30px;">
      <h2>Welcome to the Quiz!</h2>
      <p>Test your knowledge with this quiz.</p>
      <button id="startQuizBtn">Start Quiz</button>
    </div>
    <div id="quizResults" style="padding:20px; font-size:1.2em;"></div>
  `;

  // Create question blocks
  this.questions.forEach((q, index) => {
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

    container.insertBefore(qDiv, document.getElementById('quizResults'));
  });

  // Re‑wire start button and totals
  const startBtn = document.getElementById('startQuizBtn');
  startBtn.addEventListener('click', () => {
    document.getElementById('introPage').style.display = 'none';
    document.querySelector('.quiz').style.display = 'block';
    setTotalQuestions(this.questions.length);
    resetQuiz();
  });
};
// end class Quiz


/// Object instances

// sample lessons
const lesson1 = new Lesson('lesson1', 'Lesson 1: Introduction', 'lessons/lesson1.html');
const lesson2 = new Lesson('lesson2', 'Lesson 2: Nail Basics', 'lessons/lesson2.html');

// sample quizzes
// lesson 2 quiz
const lesson2Quiz = new Quiz('lesson2quiz', 70, 'lesson3');
lesson2Quiz.addQuestion('What is nail polish used for?', [
  { text: 'Painting nails',   isCorrect: true },
  { text: 'Facial treatment', isCorrect: false },
  { text: 'Skin care',        isCorrect: false }
]);

lesson2Quiz.addQuestion('Where does shampoo go?', [
  { text: 'on your back',          isCorrect: false },
  { text: 'between your fingers',  isCorrect: false },
  { text: 'in your hair',          isCorrect: true }
]);
// lesson 3+4 quiz
const lesson3plus4Quiz = new Quiz('lesson3+4Quiz', 70, 'lesson3');
lesson3plus4Quiz.addQuestion('What is nail polish used for?', [
  { text: 'Painting nails',   isCorrect: true },
  { text: 'Facial treatment', isCorrect: false },
  { text: 'Skin care',        isCorrect: false }
]);

lesson3plus4Quiz.addQuestion('Where does shampoo go?', [
  { text: 'on your back',          isCorrect: false },
  { text: 'between your fingers',  isCorrect: false },
  { text: 'in your hair',          isCorrect: true }
]);

// You can create lesson3+4 quiz the same way with its own questions
