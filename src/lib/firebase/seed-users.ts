import { doc, setDoc } from "firebase/firestore";
import { db } from "./config";
import { COLLECTIONS } from "./paths";

const SEED_USERS = [
  {
    uid: "seed_user_alex",
    email: "alex@example.com",
    displayName: "Alex Rivera",
  },
  {
    uid: "seed_user_taylor",
    email: "taylor@example.com",
    displayName: "Taylor Swift",
  },
  {
    uid: "seed_user_jordan",
    email: "jordan@example.com",
    displayName: "Jordan Katz",
  },
];

export async function seedUsers() {
  for (const user of SEED_USERS) {
    try {
      const ref = doc(db, COLLECTIONS.USERS, user.uid);
      await setDoc(ref, {
        email: user.email,
        displayName: user.displayName,
        createdAt: Date.now(),
      });
    } catch (e) {
      console.warn("Could not seed user:", user.email, e);
    }
  }
}
