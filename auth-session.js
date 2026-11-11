// Loaded on main.html. Restores the Firebase sign-in from the login page and
// exposes window.appAuth so script.js can attach an ID token to admin API calls.
// The backend verifies that token, so the admin role can't be faked in the browser.
import { app, auth } from "./firebase-init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-storage.js";

const storage = getStorage(app);

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
  },

  // Upload an image/video straight to Firebase Storage and return its public
  // download URL. kind is "image" or "video"; storage.rules only allow admins
  // to create files named "<kind>-..." of the matching type and size.
  // Files live at the bucket root (no folders) to keep URLs simple.
  async uploadMedia(file, kind, contentType, onProgress) {
    const user = await userReady;
    if (!user) throw new Error("You are signed out. Please log in again.");

    const ext = (file.name.match(/\.[^.]+$/) || [""])[0].toLowerCase();
    const stem = file.name.slice(0, file.name.length - ext.length)
      .replace(/[^A-Za-z0-9._-]+/g, "-")
      .replace(/^[-._]+|[-._]+$/g, "") || kind;
    const id = crypto.randomUUID().replace(/-/g, "");
    const fileRef = ref(storage, `${kind}-${id}-${stem}${ext}`);

    const task = uploadBytesResumable(fileRef, file, { contentType });
    await new Promise((resolve, reject) => {
      task.on(
        "state_changed",
        (snap) => {
          if (onProgress && snap.totalBytes) {
            onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
          }
        },
        reject,
        resolve
      );
    });
    return getDownloadURL(task.snapshot.ref);
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
