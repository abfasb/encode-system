import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const secondFirebaseConfig = {
  apiKey: "AIzaSyBAPuUHFKVrzMHA_CWxBITCqci6-RK5Beg",
  authDomain: "pharma-kiosk-ad218.firebaseapp.com",
  projectId: "pharma-kiosk-ad218",
  storageBucket: "pharma-kiosk-ad218.appspot.com",
  messagingSenderId: "270716874976",
  appId: "1:270716874976:web:cd7c864190e61919912085",
};

const secondApp = initializeApp(secondFirebaseConfig, "secondApp");

export const storage = getStorage(secondApp);

const secondStorage = getStorage(secondApp);

export const uploadFileToFirebase = async (file, path) => {
  try {
    const storageRef = ref(secondStorage, path); 
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url; 
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
};
