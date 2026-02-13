import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCQbKvqlDHS6l0eJA73KFYyYmCgmV1BENw",
  authDomain: "web1auth.firebaseapp.com",
  projectId: "web1auth",
  storageBucket: "web1auth.firebasestorage.app",
  messagingSenderId: "210242582176",
  appId: "1:210242582176:web:f2cb5dd820a77a80807bc5",
  measurementId: "G-5RE154X2TD"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const analytics = getAnalytics(app);