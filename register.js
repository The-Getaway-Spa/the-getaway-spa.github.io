  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries



  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAcOZZprs4Y2XY2aaWskIMrNuFFMKys5WU",
    authDomain: "the-getaway-academy.firebaseapp.com",
    projectId: "the-getaway-academy",
    storageBucket: "the-getaway-academy.firebasestorage.app",
    messagingSenderId: "270634245640",
    appId: "1:270634245640:web:f02625c503b2ddeaebfbbd",
    measurementId: "G-PL6PL1V4V8"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);

  import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
const auth = getAuth(app);

const ADMIN_EMAILS = ["info@mygetawayspa.com"]; // change to your real admin email

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email);
}

// Correct input references (match HTML IDs)
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const submit = document.getElementById('submit');
const status = document.getElementById('login-status');

// Reusable login handler used by click and Enter key
async function handleLogin(event) {
  if (event && typeof event.preventDefault === 'function') event.preventDefault();
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    status.textContent = 'Please enter email and password';
    return;
  }

  // Start login attempt
  status.textContent = 'Logging in...';

  try {
    // Attempt to sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // If successful, redirect to main page
    window.location.href = 'main.html';
  } catch (error) {
    // On error, show a friendly message. Do not leak internal error details to the user.
    console.error('Firebase sign-in failed:', error);
    status.textContent = 'Email and/or password are incorrect.';
  }
}

// Wire up click to the handler
submit.addEventListener('click', handleLogin);

// Trigger same handler when user presses Enter in the email or password inputs
[loginEmail, loginPassword].forEach(function(el) {
  if (!el) return;
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      handleLogin(e);
    }
  });
});