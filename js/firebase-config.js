/**
 * firebase-config.js
 * Firebase initialization for Sarberia Pally Seba Samity Membership System
 *
 * Firebase Project: club-web-8d752
 *
 * NOTE: Firebase Storage has been removed (paid tier).
 * Screenshot upload is NOT supported in this build.
 * Members submit their Transaction ID only — no file upload.
 */

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAKeSVhii8zThOz1y3YNeIzCIxq4ytsKAU",
  authDomain: "club-web-8d752.firebaseapp.com",
  projectId: "club-web-8d752",
  storageBucket: "club-web-8d752.firebasestorage.app",
  messagingSenderId: "299327649429",
  appId: "1:299327649429:web:b02d0abe61a49af7220d9c",
  measurementId: "G-5PEHCGW46G"
};
// ─────────────────────────────────────────────────────────────────────────────

// Initialize Firebase (singleton — safe to import from multiple files)
const app = initializeApp(firebaseConfig);

// Firestore — stores all membership applications and admin_users docs
const db = getFirestore(app);

// Auth — used for admin login only (Email/Password provider)
const auth = getAuth(app);

// Analytics — passive, no code depends on it
// (imported separately by pages that need it — not exported here)

export { app, db, auth };