// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyB6e6GiyI4zwpGlXflnkLS-X6jaEabRmcc",
  authDomain: "deserto-terminal.firebaseapp.com",
  databaseURL: "https://deserto-terminal-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "deserto-terminal",
  storageBucket: "deserto-terminal.firebasestorage.app",
  messagingSenderId: "407431125870",
  appId: "1:407431125870:web:e77eacc2d4c24104537f7f"
};

// ------------------------------------------------------------
const SESSION_KEY = "deserto-mesa-01";

// ------------------------------------------------------------
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const sessionRef = db.ref("sessions/" + SESSION_KEY);
firebase.auth().signInAnonymously().catch(e => console.error("auth falhou:", e));
