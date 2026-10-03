/**
 * Jaffna Freelance Connect — Firebase Authentication & User State Service
 * Uses Google Firebase Web SDK (v10 modular)
 */

import { initializeApp, getApps, getApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// Retrieve config
const config = window.JFC_FIREBASE_CONFIG || {
  projectId: "sinuous-brace-583d0",
  appId: "1:918560598414:web:7017cf2c257fa246701cdf",
  apiKey: "AIzaSyB9yMqEChxAWfo2SHq4p9uJt4XjeiS-2xU",
  authDomain: "sinuous-brace-583d0.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-jaffnafreelancec-fa923445-9f95-4bc3-a3e8-b440b0ff4ebd",
  storageBucket: "sinuous-brace-583d0.firebasestorage.app",
  messagingSenderId: "918560598414"
};

// Initialize App
const app = getApps().length ? getApp() : initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId || undefined);

// Validate connection per Firebase Skill guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore offline or network check required:", error.message);
    }
  }
}
testFirestoreConnection();

/**
 * Fetch or build User profile data from Firestore
 */
async function fetchUserProfile(uid, fallbackEmail = "", fallbackDisplayName = "") {
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);

    let role = 'FREELANCER';
    let profileData = null;

    if (snap.exists()) {
      profileData = snap.data();
      role = profileData.role || 'FREELANCER';
    }

    // Check admin authority
    if (fallbackEmail === 'mukundram165250@gmail.com' || fallbackEmail === 'admin@jaffnafreelance.lk') {
      role = 'ADMIN';
    } else {
      try {
        const adminSnap = await getDoc(doc(db, 'admins', uid));
        if (adminSnap.exists()) role = 'ADMIN';
      } catch (e) {
        // Ignored if rules deny non-admins
      }
    }

    return {
      uid,
      email: fallbackEmail || profileData?.email || "",
      displayName: fallbackDisplayName || profileData?.displayName || "Jaffna Member",
      role,
      accountStatus: profileData?.accountStatus || 'ACTIVE',
      createdAt: profileData?.createdAt || new Date().toISOString()
    };
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return {
      uid,
      email: fallbackEmail,
      displayName: fallbackDisplayName || "Jaffna Member",
      role: (fallbackEmail === 'mukundram165250@gmail.com') ? 'ADMIN' : 'FREELANCER'
    };
  }
}

const JFCAuth = {
  app,
  auth,
  db,
  currentUser: null,
  isInitialized: false,
  _listeners: [],

  onAuthChanged(fn) {
    this._listeners.push(fn);
    if (this.isInitialized) {
      fn(this.currentUser);
    }
  },

  _notify(user) {
    this.currentUser = user;
    this.isInitialized = true;
    this._listeners.forEach(fn => {
      try { fn(user); } catch (e) { console.error(e); }
    });
  },

  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    const userProfile = await fetchUserProfile(cred.user.uid, cred.user.email, cred.user.displayName);
    this._notify(userProfile);
    return userProfile;
  },

  async register(displayName, email, password, role = 'FREELANCER') {
    const safeRole = role === 'CLIENT' ? 'CLIENT' : 'FREELANCER';
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const user = cred.user;

    // Set auth profile displayName
    if (displayName) {
      await updateProfile(user, { displayName: displayName.trim() }).catch(console.warn);
    }

    // Provision user document in Cloud Firestore
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email.toLowerCase(),
      displayName: displayName.trim() || user.email.split('@')[0],
      role: safeRole,
      accountStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userRef, userData);
    this._notify(userData);
    return userData;
  },

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    // Check if Firestore user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    let userData;
    if (!snap.exists()) {
      userData = {
        uid: user.uid,
        email: user.email.toLowerCase(),
        displayName: user.displayName || user.email.split('@')[0],
        role: (user.email === 'mukundram165250@gmail.com') ? 'ADMIN' : 'FREELANCER',
        accountStatus: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userDocRef, userData);
    } else {
      userData = await fetchUserProfile(user.uid, user.email, user.displayName);
    }

    this._notify(userData);
    return userData;
  },

  async forgotPassword(email) {
    if (!email || !email.includes('@')) {
      throw new Error("Please enter a valid email address.");
    }
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  },

  async logout() {
    await signOut(auth);
    this._notify(null);
  }
};

// Listen to Firebase Auth state
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser) {
    const profile = await fetchUserProfile(
      firebaseUser.uid,
      firebaseUser.email,
      firebaseUser.displayName
    );
    JFCAuth._notify(profile);
  } else {
    JFCAuth._notify(null);
  }
});

// Expose globally for vanilla frontend
window.JFCAuth = JFCAuth;
export default JFCAuth;
