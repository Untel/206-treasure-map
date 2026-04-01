import { initializeApp } from "firebase/app";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
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

const COLLECTIONS = ["s1_1_S10206", "s1_2_S10206"];

// Same alias map as items.ts
const ITEMS = [
  { id: "tower-of-barrens", aliases: ["Tower of Barrens", "Tour des Terres Arides"] },
  { id: "portal-gate", aliases: ["Portal / Gate", "Portal", "Portail", "Portal Gate"] },
  { id: "giant-egg", aliases: ["Giant Egg", "Œuf Géant"] },
  { id: "straw-hall", aliases: ["Straw Hall", "Hall de Paille"] },
  { id: "eroded-cave", aliases: ["Eroded Cave", "Grotte Érodée", "Weathered Cave"] },
  { id: "stone-totem", aliases: ["Stone Totem", "Totem de Pierre"] },
  { id: "outpost", aliases: ["Outpost", "Avant-poste"] },
  { id: "sandstorm-fortress-i", aliases: ["Sandstorm Fortress I", "Forteresse - Tempête de I"] },
  { id: "sandstorm-fortress-ii", aliases: ["Sandstorm Fortress II", "Forteresse - Tempête de II", "Sandstorm Fortress"] },
  { id: "straw-hut", aliases: ["Straw Hut", "Hutte de Paille"] },
  { id: "blue-gem", aliases: ["Blue Gem", "Gemme Bleue"] },
  { id: "flower-bed", aliases: ["Flower Bed", "Lit de Fleur", "Flower Bed / Reservoir 1"] },
  { id: "signpost", aliases: ["Signpost", "Panneau"] },
  { id: "canopy-tent", aliases: ["Canopy Tent", "Tente à Auvent"] },
  { id: "beast-bone-totem", aliases: ["Beast Bone Totem", "Totem d'os de Bête"] },
  { id: "water-reservoir-i", aliases: ["Water Reservoir I", "Réservoir d'Eau I", "Water Reservoir I / Seashell"] },
  { id: "water-reservoir-ii", aliases: ["Water Reservoir II", "Réservoir d'Eau II"] },
  { id: "shell", aliases: ["Shell", "Coquille", "Seashell", "Treasure Hunter / Shell"] },
  { id: "boss-throne", aliases: ["Boss Throne", "Trône du Boss"] },
  { id: "stone-pillar", aliases: ["Stone Pillar", "Pilier en Pierre"] },
  { id: "sphinx-statue", aliases: ["Sphinx Statue", "Statue du Sphinx"] },
  { id: "eroded-altar", aliases: ["Eroded Altar", "Autel Érodée", "Weathered Altar"] },
];

// Build lookup
const lookup = new Map();
for (const item of ITEMS) {
  lookup.set(item.id.toLowerCase(), item.id);
  for (const alias of item.aliases) {
    lookup.set(alias.toLowerCase(), item.id);
  }
}

function resolve(name) {
  if (!name) return null;
  return lookup.get(name.trim().toLowerCase()) ?? null;
}

async function normalize(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  console.log(`\n"${collectionName}": ${snap.size} documents`);

  let updated = 0;
  let skipped = 0;
  let unresolved = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const item = data.item;
    if (!item || item.length === 0) {
      skipped++;
      continue;
    }

    const canonical = resolve(item);
    if (!canonical) {
      console.log(`  UNRESOLVED (${data.x}, ${data.y}) item="${item}"`);
      unresolved++;
      continue;
    }

    if (item === canonical) {
      skipped++;
      continue;
    }

    await updateDoc(doc(db, collectionName, d.id), { item: canonical });
    console.log(`  UPDATE (${data.x}, ${data.y}) "${item}" -> "${canonical}"`);
    updated++;
  }

  console.log(`  Done: ${updated} updated, ${skipped} already ok, ${unresolved} unresolved`);
}

async function main() {
  for (const name of COLLECTIONS) {
    await normalize(name);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
