import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBcEGAIsdY3l9V3jR_yclhzkvE7gQy-jEU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "muradgraphics-f6d59.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "muradgraphics-f6d59",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "muradgraphics-f6d59.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "333295319911",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:333295319911:web:18341a803848ce2ec80dc2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "1:333295319911:web:18341a803848ce2ec80dc2"
};

// Initialize Firebase safely (avoid multi-initialization in HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Enable client IndexedDB caching persistence for super fast queries and refresh
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const storage = getStorage(app);

export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || "AFpFL3xlZTeWPtf89mkeRHVU0sj1";
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "muradexplore2012@gmail.com";
export const SUPER_ADMIN_UID = "AFpFL3xlZTeWPtf89mkeRHVU0sj1";
export const SUPER_ADMIN_EMAIL = "muradexplore2012@gmail.com";

export default app;
