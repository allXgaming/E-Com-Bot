// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// তোমার নিজের Firebase কনফিগ এখানে বসাও
    const firebaseConfig = {
  apiKey: "AIzaSyAYA7KkyMjuspnNjaxBAiWUUtCb_bJDuhQ",
  authDomain: "testing-4-e92b8.firebaseapp.com",
  databaseURL: "https://testing-4-e92b8-default-rtdb.firebaseio.com",
  projectId: "testing-4-e92b8",
  storageBucket: "testing-4-e92b8.firebasestorage.app",
  messagingSenderId: "786753674701",
  appId: "1:786753674701:web:746c0bad857eec0b2df884",
  measurementId: "G-CGWL05MEDT"
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);
const firestore = getFirestore(app);

export { app, rtdb, firestore };