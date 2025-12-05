// vairable declarations
let totalQuestions = document.querySelectorAll('.quiz').length;
let correctAnswers = 0;

// event listeners
document.getElementById('startQuizBtn').addEventListener('click', () => {
  // Hide intro
  document.getElementById('introPage').style.display = 'none';
  // Show quiz container and first question
  const quizContainer = document.querySelector('.quiz-container');
  quizContainer.style.display = 'block';

  resetQuiz();
});

// functions

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

// Objects
function Lesson(id, title, content) {
  this.id = id;          // e.g. 'lesson1'
  this.title = title;    // e.g. 'Introduction'
  this.content = content; // not strictly needed if HTML is already on page
}

// Show the lesson div whose id matches this.id
Lesson.prototype.openLesson = function () {
  // Hide all lesson/quiz containers
  document.querySelectorAll('.lesson-content, .quiz-container')
    .forEach(div => div.style.display = 'none');

  const el = document.getElementById(this.id + '_content') || document.getElementById(this.id);
  if (el) {
    el.style.display = 'block';
  }
};

// Hide only this lesson’s content
Lesson.prototype.closeLesson = function () {
  const el = document.getElementById(this.id + '_content') || document.getElementById(this.id);
  if (el) {
    el.style.display = 'none';
  }
};
