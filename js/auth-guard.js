import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

/**
 * Call on every admin page load.
 * Redirects to /admin/login.html if no authenticated user.
 * Returns a promise that resolves with the user once confirmed.
 */
export function requireAuth() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "/admin/login.html";
      } else {
        resolve(user);
      }
    });
  });
}
