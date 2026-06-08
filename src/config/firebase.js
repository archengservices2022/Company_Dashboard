import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCVRhhYTTleujfYR6MPTa9w-espJuqeke4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "companydashboard-fa832.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://companydashboard-fa832-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "companydashboard-fa832",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "companydashboard-fa832.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "330321053170",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:330321053170:web:0ebcb02d9f044942cc976b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-E25TSKMNC5"
};

console.log('Firebase Config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export default app;
