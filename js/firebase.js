
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Conserva aquí tu configuración original de Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAHze_MhcticjPcf5n1B6BAx73oUAcSw-o",
  authDomain: "salud360-95aad.firebaseapp.com",
  projectId: "salud360-95aad",
  storageBucket: "salud360-95aad.firebasestorage.app",
  messagingSenderId: "50237061222",
  appId: "1:50237061222:web:d3b8cc6a96a394e95d55a7",
  measurementId: "G-3J73ZWQM21"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);




