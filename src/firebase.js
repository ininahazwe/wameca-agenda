import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  // COLLEZ ICI VOS IDENTIFIANTS DE L'ÉTAPE 1.3
    apiKey: "AIzaSyDd3ZGuJ46j8Vnn2_5nDxC-jfo8VRCiXP8",
    authDomain: "wemeca-agenda.firebaseapp.com",
    databaseURL: "https://wemeca-agenda-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "wemeca-agenda",
    storageBucket: "wemeca-agenda.firebasestorage.app",
    messagingSenderId: "982350044603",
    appId: "1:982350044603:web:6e7ed5e4a586b9fa9f789e"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);