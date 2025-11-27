import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ Storage added

const firebaseConfig = {
  apiKey: "AIzaSyCx1gO7_w_wLUYkwB5bWntBmOAgCMt3CYQ",
  authDomain: "fuverse-25f5c.firebaseapp.com",
  projectId: "fuverse-25f5c",
  storageBucket: "fuverse-25f5c.appspot.com", // ✅ required for storage
  messagingSenderId: "440751650454",
  appId: "1:440751650454:web:4844685a4a07ad403bb4b7",
};

const app = initializeApp(firebaseConfig);

// ✅ Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // ✅ NEW: add storage

// ✅ Auth Utilities
const provider = new GoogleAuthProvider();
setPersistence(auth, browserLocalPersistence).catch((error) =>
  console.error("Persistence error:", error)
);

// ✅ Exports
export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logout = () => signOut(auth);
export const getCurrentUser = () => auth.currentUser;

export { db, storage }; // ✅ Export storage
