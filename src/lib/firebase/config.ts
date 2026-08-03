import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import firebaseConfig from "./firebase-config.json";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not set browserLocalPersistence:", err);
});

export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
