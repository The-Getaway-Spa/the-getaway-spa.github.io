// Shared Firebase setup, imported by register.js (login page) and auth-session.js (main page).
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAcOZZprs4Y2XY2aaWskIMrNuFFMKys5WU",
  authDomain: "the-getaway-academy.firebaseapp.com",
  projectId: "the-getaway-academy",
  storageBucket: "the-getaway-academy.firebasestorage.app",
  messagingSenderId: "270634245640",
  appId: "1:270634245640:web:f02625c503b2ddeaebfbbd",
  measurementId: "G-PL6PL1V4V8"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
