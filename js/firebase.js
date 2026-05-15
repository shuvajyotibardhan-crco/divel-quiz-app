import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBRal2zR6T8OBa9WIJIc9lBxzBh5_FSf8I",
  authDomain: "divel-quiz.firebaseapp.com",
  projectId: "divel-quiz",
  storageBucket: "divel-quiz.firebasestorage.app",
  messagingSenderId: "591389473832",
  appId: "1:591389473832:web:0d714c26dc3ce705dcc91d"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
