// Loaded on main.html. Restores the Firebase sign-in from the login page and
// exposes window.appAuth so script.js can attach an ID token to admin API calls.
// The backend verifies that token, so the admin role can't be faked in the browser.
import { auth } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// Resolves once Firebase has restored the saved session (user, or null if signed out)
const userReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    resolve(user);
  });
});

window.appAuth = {
  // Returns a fresh ID token (Firebase refreshes it automatically when it expires)
  async getIdToken() {
    const user = await userReady;
    return user ? user.getIdToken() : null;
  },
  signOut() {
    return signOut(auth);
  }
};
window.dispatchEvent(new Event("app-auth-ready"));

// No Firebase session (e.g. expired or signed out elsewhere): send back to login
userReady.then((user) => {
  if (!user) {
    try { sessionStorage.removeItem("loggedIn"); sessionStorage.removeItem("role"); } catch (e) {}
    window.location.href = "index.html";
  }
});
