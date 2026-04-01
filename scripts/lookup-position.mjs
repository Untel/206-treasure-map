import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyAYSXsijQgzFIRnCyBRF26JtHTh-mYtFbs",
  authDomain: "map-b8e70.firebaseapp.com",
  projectId: "map-b8e70",
  storageBucket: "map-b8e70.firebasestorage.app",
  messagingSenderId: "711874835896",
  appId: "1:711874835896:web:ccff17ef84d7f33a514b4d",
});

const db = getFirestore(app);

for (const col of ["s1_1_S10206", "s1_2_S10206"]) {
  const snap = await getDocs(collection(db, col));
  for (const d of snap.docs) {
    const data = d.data();
    if (data.x === 224 && data.y === 818) {
      console.log(`Collection: ${col}`);
      console.log(`Doc ID: ${d.id}`);
      console.log(`Data:`, JSON.stringify(data, null, 2));
      console.log();
    }
  }
}

process.exit(0);
