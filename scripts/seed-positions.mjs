import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  getDocs,
  getFirestore,
  query,
} from 'firebase/firestore'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '..')

function loadEnvFile(filename) {
  const filepath = resolve(rootDir, filename)
  if (!existsSync(filepath)) {
    return
  }

  const content = readFileSync(filepath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const equalsIndex = trimmed.indexOf('=')
    if (equalsIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, equalsIndex)
    const value = trimmed.slice(equalsIndex + 1)
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.VITE_FIREBASE_APP_ID ?? '',
}

if (Object.values(firebaseConfig).some((value) => !value)) {
  throw new Error('Missing Firebase config in .env.local or environment.')
}

const records = [
  { x: 399, y: 287, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 419, y: 573, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 115, y: 847, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 345, y: 657, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 20, y: 240, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 381, y: 437, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 394, y: 242, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 67, y: 53, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 63, y: 31, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 23, y: 37, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 132, y: 34, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 60, y: 662, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 20, y: 590, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 206, y: 684, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 428, y: 652, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 85, y: 881, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 171, y: 871, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 116, y: 238, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 321, y: 189, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 230, y: 298, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 192, y: 456, status: 'empty', item: null, note: 'SCRAP position, item not found' },
  { x: 369, y: 867, status: 'found', item: 'Tower of Barrens', note: 'Imported building position' },
  { x: 246, y: 636, status: 'found', item: 'Giant Egg', note: 'Imported building position' },
  { x: 46, y: 202, status: 'found', item: 'Portal / Gate', note: 'Imported building position' },
  { x: 330, y: 46, status: 'found', item: 'Straw Hall', note: 'Imported building position' },
  { x: 454, y: 466, status: 'found', item: 'Sandstorm Fortress II', note: 'Imported building position' },
  { x: 378, y: 816, status: 'found', item: 'Sandstorm Fortress I', note: 'Imported building position' },
  { x: 34, y: 522, status: 'found', item: 'Blue Gem', note: 'Imported building position' },
  { x: 279, y: 29, status: 'found', item: 'Flower Bed / Reservoir 1', note: 'Imported building position' },
  { x: 298, y: 100, status: 'found', item: 'Canopy Tent', note: 'Imported building position' },
  { x: 284, y: 162, status: 'found', item: 'Beast Bone Totem', note: 'Imported building position' },
  { x: 224, y: 428, status: 'found', item: 'Water Reservoir II', note: 'Imported building position' },
  { x: 129, y: 671, status: 'found', item: 'Water Reservoir I / Seashell', note: 'Imported building position' },
  { x: 308, y: 270, status: 'found', item: 'Treasure Hunter / Shell', note: 'Imported building position' },
  { x: 229, y: 973, status: 'found', item: 'Boss Throne', note: 'Imported building position' },
  { x: 208, y: 240, status: 'found', item: 'Signpost', note: 'Imported building position' },
]

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const positionsCollection = collection(db, 'positions')

const existingSnapshot = await getDocs(query(positionsCollection))
const existingKeys = new Set(
  existingSnapshot.docs.map((doc) => {
    const data = doc.data()
    return `${data.x}:${data.y}:${data.status}:${data.item ?? ''}`
  }),
)

let inserted = 0
let skipped = 0

for (const record of records) {
  const key = `${record.x}:${record.y}:${record.status}:${record.item ?? ''}`
  if (existingKeys.has(key)) {
    skipped += 1
    continue
  }

  await addDoc(positionsCollection, {
    ...record,
    createdAt: new Date(),
  })
  existingKeys.add(key)
  inserted += 1
}

console.log(`Inserted ${inserted} positions, skipped ${skipped} duplicates.`)
