import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBbHEBDcoOUteOdmW-V7w_EGcyI7CPGL1U",
  authDomain: "mineops10-12f2e.firebaseapp.com",
  projectId: "mineops10-12f2e",
  storageBucket: "mineops10-12f2e.firebasestorage.app",
  messagingSenderId: "176971455920",
  appId: "1:176971455920:web:7c1987baa7fe0cb6ea4a75",
  measurementId: "G-M79C9V3Q54",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analyticsPromise = isSupported().then((supported) => (supported ? getAnalytics(app) : null));

export { app, analyticsPromise, auth, db, storage, firebaseConfig };
export default app;
