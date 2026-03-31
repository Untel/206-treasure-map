#!/usr/bin/env node
/**
 * Migrate positions from `positions_v2` → `s1_2_S10206`
 * and normalize item names to canonical IDs (matching image filenames).
 */

import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'

const SOURCE = 'positions_v2'
const TARGET = 's1_2_S10206'

// ── Firebase config (same as app) ──
const firebaseConfig = {
  apiKey: 'AIzaSyAYSXsijQgzFIRnCyBRF26JtHTh-mYtFbs',
  authDomain: 'map-b8e70.firebaseapp.com',
  projectId: 'map-b8e70',
  storageBucket: 'map-b8e70.firebasestorage.app',
  messagingSenderId: '711874835896',
  appId: '1:711874835896:web:ccff17ef84d7f33a514b4d',
}

// ── Item alias → canonical ID lookup ──
// This maps every known name/alias to the correct item definition ID
// so that found items reference the right image.
const ITEM_ALIASES = new Map([
  // S1 pool items
  ['tower of barrens', 'tower-of-barrens'],
  ['tour des terres arides', 'tower-of-barrens'],
  ['portal / gate', 'portal-gate'],
  ['portal', 'portal-gate'],
  ['portail', 'portal-gate'],
  ['portal gate', 'portal-gate'],
  ['giant egg', 'giant-egg'],
  ['œuf géant', 'giant-egg'],
  ['straw hall', 'straw-hall'],
  ['hall de paille', 'straw-hall'],
  ['eroded cave', 'eroded-cave'],
  ['grotte érodée', 'eroded-cave'],
  ['weathered cave', 'eroded-cave'],
  ['stone totem', 'stone-totem'],
  ['totem de pierre', 'stone-totem'],
  ['outpost', 'outpost'],
  ['avant-poste', 'outpost'],
  ['sandstorm fortress i', 'sandstorm-fortress-i'],
  ['forteresse - tempête de i', 'sandstorm-fortress-i'],
  ['sandstorm fortress ii', 'sandstorm-fortress-ii'],
  ['forteresse - tempête de ii', 'sandstorm-fortress-ii'],
  ['sandstorm fortress', 'sandstorm-fortress-ii'],
  ['straw hut', 'straw-hut'],
  ['hutte de paille', 'straw-hut'],
  ['blue gem', 'blue-gem'],
  ['gemme bleue', 'blue-gem'],
  ['flower bed', 'flower-bed'],
  ['lit de fleur', 'flower-bed'],
  ['signpost', 'signpost'],
  ['panneau', 'signpost'],
  ['canopy tent', 'canopy-tent'],
  ['tente à auvent', 'canopy-tent'],
  ['beast bone totem', 'beast-bone-totem'],
  ["totem d'os de bête", 'beast-bone-totem'],
  ['water reservoir i', 'water-reservoir-i'],
  ["réservoir d'eau i", 'water-reservoir-i'],
  ['water reservoir ii', 'water-reservoir-ii'],
  ["réservoir d'eau ii", 'water-reservoir-ii'],
  ['shell', 'shell'],
  ['coquille', 'shell'],
  ['seashell', 'shell'],
  ['boss throne', 'boss-throne'],
  ['trône du boss', 'boss-throne'],
  ['stone pillar', 'stone-pillar'],
  ['pilier en pierre', 'stone-pillar'],

  // Ambiguous old items → map to best match
  ['treasure hunter / shell', 'shell'],
  ['treasure hunter', 'shell'],
  ['leather boots', 'shell'],
  ['water reservoir i / seashell', 'water-reservoir-i'],
  ['flower bed / reservoir 1', 'flower-bed'],

  // Other theme items (keep working if they show up)
  ['sphinx statue', 'sphinx-statue'],
  ['pyramid', 'pyramid'],
  ['water wheel', 'water-wheel'],
  ['sandstorm pavilion a', 'sandstorm-pavilion-a'],
  ['sandstorm pavilion b', 'sandstorm-pavilion-b'],
  ['colored ore', 'colored-ore'],
  ['sandstorm castle', 'sandstorm-castle'],
  ['sandstorm bunker', 'sandstorm-bunker'],
  ['fern cluster', 'fern-cluster'],
  ['eroded arch i', 'eroded-arch-i'],
  ['eroded arch ii', 'eroded-arch-ii'],
  ['eroded arch iii', 'eroded-arch-iii'],
  ['eroded fountain', 'eroded-fountain'],
  ['eroded altar', 'eroded-altar'],
  ['mineral cave', 'mineral-cave'],
  ['ruby mine', 'ruby-mine'],
  ['stone mine', 'stone-mine'],
  ['eroded stone', 'eroded-stone'],
])

function resolveItemId(rawItem) {
  if (!rawItem || typeof rawItem !== 'string') return null
  const key = rawItem.trim().toLowerCase()
  return ITEM_ALIASES.get(key) ?? rawItem // keep original if no match
}

// ── Main ──
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log(`Reading from "${SOURCE}"...`)
const sourceSnapshot = await getDocs(query(collection(db, SOURCE), orderBy('createdAt', 'desc')))
console.log(`  Found ${sourceSnapshot.size} documents.`)

if (sourceSnapshot.empty) {
  console.log('Nothing to migrate.')
  process.exit(0)
}

// Check existing in target to avoid duplicates
console.log(`Checking existing in "${TARGET}"...`)
const targetSnapshot = await getDocs(query(collection(db, TARGET)))
const existingKeys = new Set(
  targetSnapshot.docs.map((doc) => {
    const d = doc.data()
    return `${d.x}:${d.y}`
  }),
)
console.log(`  Found ${targetSnapshot.size} existing documents.`)

let migrated = 0
let skipped = 0
let resolved = 0

for (const doc of sourceSnapshot.docs) {
  const data = doc.data()
  const key = `${data.x}:${data.y}`

  if (existingKeys.has(key)) {
    skipped++
    continue
  }

  // Normalize item name to canonical ID
  const originalItem = data.item
  const normalizedItem = data.status === 'found' ? resolveItemId(originalItem) : null

  if (originalItem && normalizedItem !== originalItem) {
    console.log(`  Resolved: "${originalItem}" → "${normalizedItem}"`)
    resolved++
  }

  // Normalize status: 'empty' → 'scrap' (old seed used 'empty')
  const status = data.status === 'empty' ? 'scrap' : (data.status ?? 'scrap')

  await addDoc(collection(db, TARGET), {
    x: Number(data.x ?? 0),
    y: Number(data.y ?? 0),
    status,
    item: normalizedItem,
    nickname: data.nickname ?? '',
    playerId: data.playerId ?? '',
    note: data.note ?? '',
    createdAt: data.createdAt ?? serverTimestamp(),
  })

  existingKeys.add(key)
  migrated++
}

console.log(`\nDone!`)
console.log(`  Migrated: ${migrated}`)
console.log(`  Skipped (duplicate coords): ${skipped}`)
console.log(`  Item names resolved: ${resolved}`)
