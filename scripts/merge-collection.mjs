import { initializeApp } from "firebase/app";
import {
  collection,
  getDocs,
  addDoc,
  getFirestore,
} from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyAYSXsijQgzFIRnCyBRF26JtHTh-mYtFbs",
  authDomain: "map-b8e70.firebaseapp.com",
  projectId: "map-b8e70",
  storageBucket: "map-b8e70.firebasestorage.app",
  messagingSenderId: "711874835896",
  appId: "1:711874835896:web:ccff17ef84d7f33a514b4d",
});

const db = getFirestore(app);

const SOURCE = "s1_1_S10198";
const TARGET = "s1_2_S10206";

async function merge() {
  // Read all docs from source
  const sourceSnap = await getDocs(collection(db, SOURCE));
  console.log(`Source "${SOURCE}": ${sourceSnap.size} documents`);

  if (sourceSnap.empty) {
    console.log("Nothing to merge.");
    process.exit(0);
  }

  // Read existing docs in target to deduplicate by (x, y)
  const targetSnap = await getDocs(collection(db, TARGET));
  const existingCoords = new Set();
  for (const doc of targetSnap.docs) {
    const d = doc.data();
    existingCoords.add(`${d.x},${d.y}`);
  }
  console.log(`Target "${TARGET}": ${targetSnap.size} existing documents`);

  let added = 0;
  let skipped = 0;

  for (const doc of sourceSnap.docs) {
    const data = doc.data();
    const key = `${data.x},${data.y}`;

    if (existingCoords.has(key)) {
      console.log(`  SKIP duplicate (${data.x}, ${data.y})`);
      skipped++;
      continue;
    }

    await addDoc(collection(db, TARGET), data);
    existingCoords.add(key);
    added++;
    console.log(`  ADD (${data.x}, ${data.y}) status=${data.status} item=${data.item ?? "none"}`);
  }

  console.log(`\nDone: ${added} added, ${skipped} skipped (duplicates)`);
  process.exit(0);
}

merge().catch((err) => {
  console.error(err);
  process.exit(1);
});
