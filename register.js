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

// Correct input references (match HTML IDs)
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const submit = document.getElementById('submit');
const status = document.getElementById('login-status');

// Login button click handler
submit.addEventListener('click', function(event) {
    event.preventDefault();
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    if (!email || !password) {
        status.textContent = 'Please enter email and password';
        return;
    }
    
    // Firebase login (import auth first, see below)
    //alert('Login button clicked - Firebase login triggered!');
    status.textContent = 'Login attempt started...';
});