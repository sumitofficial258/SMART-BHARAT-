import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  increment
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use custom Firestore Database ID if specified, or default db
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create/update user doc in Firestore
    await saveUserToFirestore(user);
    return user;
  } catch (error) {
    console.error("Google Sign-In failed:", error);
    throw error;
  }
}

export async function saveUserToFirestore(user: any, additionalDetails?: { name?: string; state?: string; preferredLanguage?: string }) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: additionalDetails?.name || user.displayName || "Smart Citizen",
      email: user.email || "",
      state: additionalDetails?.state || "Bihar",
      preferredLanguage: additionalDetails?.preferredLanguage || "Hindi",
      joinedAt: new Date().toISOString()
    });
  } else if (additionalDetails) {
    // Merge updates
    await setDoc(userRef, {
      ...userSnap.data(),
      ...additionalDetails
    }, { merge: true });
  }
}

export async function logOut() {
  await signOut(auth);
}
