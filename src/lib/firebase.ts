import { initializeApp } from 'firebase/app'
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import type { PositionDraft, PositionRecord } from '../types/map'

type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null
const db = app ? getFirestore(app) : null
const LOCAL_STORAGE_KEY = 'map-research-positions'

function mapDocToPosition(
  id: string,
  data: Record<string, unknown>,
): PositionRecord {
  const createdAt = data.createdAt
  const timestamp =
    createdAt instanceof Timestamp ? createdAt.toDate().toISOString() : new Date().toISOString()

  return {
    id,
    x: Number(data.x ?? 0),
    y: Number(data.y ?? 0),
    status:
      data.status === 'found'
        ? 'found'
        : data.status === 'nothing'
          ? 'nothing'
          : 'scrap',
    item: typeof data.item === 'string' && data.item.length > 0 ? data.item : null,
    note: typeof data.note === 'string' ? data.note : '',
    createdAt: timestamp,
  }
}

export function subscribeToPositions(
  onData: (positions: PositionRecord[]) => void,
  onError: (message: string) => void,
) {
  if (!db) {
    const loadLocalPositions = () => {
      try {
        const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        const parsed = raw ? (JSON.parse(raw) as PositionRecord[]) : []
        onData(parsed)
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Unable to load local positions.')
      }
    }

    loadLocalPositions()
    window.addEventListener('storage', loadLocalPositions)
    return () => window.removeEventListener('storage', loadLocalPositions)
  }

  const positionsQuery = query(collection(db, 'positions'), orderBy('createdAt', 'desc'))

  return onSnapshot(
    positionsQuery,
    (snapshot) => {
      const positions = snapshot.docs.map((doc) =>
        mapDocToPosition(doc.id, doc.data() as Record<string, unknown>),
      )
      onData(positions)
    },
    (error) => {
      onError(error.message)
    },
  )
}

export async function savePosition(position: PositionDraft) {
  if (!db) {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    const existing = raw ? (JSON.parse(raw) as PositionRecord[]) : []
    const nextRecord: PositionRecord = {
      ...position,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([nextRecord, ...existing]))
    return
  }

  await addDoc(collection(db, 'positions'), {
    ...position,
    createdAt: serverTimestamp(),
  })
}

export function isFirebaseReady() {
  return hasFirebaseConfig
}
