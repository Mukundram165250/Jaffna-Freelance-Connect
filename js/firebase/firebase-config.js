/**
 * Jaffna Freelance Connect — Client Firebase Configuration
 * Supports GitHub Pages, AI Studio, and local development environments.
 */

const firebaseConfig = window.__FIREBASE_CONFIG__ || {
  projectId: "sinuous-brace-583d0",
  appId: "1:918560598414:web:7017cf2c257fa246701cdf",
  apiKey: "AIzaSyB9yMqEChxAWfo2SHq4p9uJt4XjeiS-2xU",
  authDomain: "sinuous-brace-583d0.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-jaffnafreelancec-fa923445-9f95-4bc3-a3e8-b440b0ff4ebd",
  storageBucket: "sinuous-brace-583d0.firebasestorage.app",
  messagingSenderId: "918560598414"
};

if (typeof window !== "undefined") {
  window.JFC_FIREBASE_CONFIG = firebaseConfig;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = firebaseConfig;
}
