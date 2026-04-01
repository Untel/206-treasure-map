import { initializeApp } from "firebase/app";
import { doc, updateDoc, getFirestore } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyAYSXsijQgzFIRnCyBRF26JtHTh-mYtFbs",
  authDomain: "map-b8e70.firebaseapp.com",
  projectId: "map-b8e70",
  storageBucket: "map-b8e70.firebasestorage.app",
  messagingSenderId: "711874835896",
  appId: "1:711874835896:web:ccff17ef84d7f33a514b4d",
});

const db = getFirestore(app);

const docRef = doc(db, "s1_2_S10206", "wLzybHzBZqn7BGCqDPKK");
await updateDoc(docRef, { item: "stone-totem" });
console.log("Updated (224, 818): stone-pillar -> stone-totem");
process.exit(0);
