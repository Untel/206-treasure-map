import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import type { PositionDraft, PositionRecord } from "../types/map";

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const firebaseEnvMap = {
  VITE_FIREBASE_API_KEY: "AIzaSyAYSXsijQgzFIRnCyBRF26JtHTh-mYtFbs",
  VITE_FIREBASE_AUTH_DOMAIN: "map-b8e70.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "map-b8e70",
  VITE_FIREBASE_STORAGE_BUCKET: "map-b8e70.firebasestorage.app",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "711874835896",
  VITE_FIREBASE_APP_ID: "1:711874835896:web:ccff17ef84d7f33a514b4d",
} as const;

const firebaseConfig: FirebaseConfig = {
  apiKey: firebaseEnvMap.VITE_FIREBASE_API_KEY,
  authDomain: firebaseEnvMap.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnvMap.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnvMap.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnvMap.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnvMap.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

const SERVER_CLUSTERS: Record<string, string> = {
  S10205: "S10206",
  S10196: "S10206",
  S10198: "S10206",
  S10197: "S10206",
};

export function resolveServer(server: string): string {
  return SERVER_CLUSTERS[server] ?? server;
}

export function getCollectionName(
  theme: string,
  period: number,
  server: string,
): string {
  return `${theme}_${period}_${resolveServer(server)}`;
}

/**
 * Finds the highest period (1–4) that has at least one document
 * for the given theme + server. Returns 1 as fallback.
 */
export async function detectLatestPeriod(
  theme: string,
  server: string,
  maxPeriod = 4,
): Promise<number> {
  if (!db) return 1;

  for (let p = maxPeriod; p >= 1; p--) {
    const name = getCollectionName(theme, p, server);
    const q = query(collection(db, name), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return p;
  }

  return 1;
}

function mapDocToPosition(
  id: string,
  data: Record<string, unknown>,
): PositionRecord {
  const createdAt = data.createdAt;
  const timestamp =
    createdAt instanceof Timestamp
      ? createdAt.toDate().toISOString()
      : new Date().toISOString();

  const deletedAt = data.deletedAt;
  const deletedTimestamp =
    deletedAt instanceof Timestamp
      ? deletedAt.toDate().toISOString()
      : undefined;

  return {
    id,
    x: Number(data.x ?? 0),
    y: Number(data.y ?? 0),
    status:
      data.status === "found"
        ? "found"
        : data.status === "nothing"
          ? "nothing"
          : "scrap",
    item:
      typeof data.item === "string" && data.item.length > 0 ? data.item : null,
    nickname: typeof data.nickname === "string" ? data.nickname : "",
    playerId: typeof data.playerId === "string" ? data.playerId : "",
    note: typeof data.note === "string" ? data.note : "",
    createdAt: timestamp,
    deletedAt: deletedTimestamp,
  };
}

export function subscribeToPositions(
  collectionName: string,
  onData: (positions: PositionRecord[]) => void,
  onError: (message: string) => void,
) {
  if (!db) {
    const localKey = `map-positions-${collectionName}`;
    const loadLocalPositions = () => {
      try {
        const raw = window.localStorage.getItem(localKey);
        const parsed = raw ? (JSON.parse(raw) as PositionRecord[]) : [];
        onData(parsed);
      } catch (error) {
        onError(
          error instanceof Error
            ? error.message
            : "Unable to load local positions.",
        );
      }
    };

    loadLocalPositions();
    window.addEventListener("storage", loadLocalPositions);
    return () => window.removeEventListener("storage", loadLocalPositions);
  }

  const positionsQuery = query(
    collection(db, collectionName),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    positionsQuery,
    (snapshot) => {
      const positions = snapshot.docs.map((doc) =>
        mapDocToPosition(doc.id, doc.data() as Record<string, unknown>),
      );
      onData(positions);
    },
    (error) => {
      onError(error.message);
    },
  );
}

export async function savePosition(
  collectionName: string,
  position: PositionDraft,
) {
  if (!db) {
    const localKey = `map-positions-${collectionName}`;
    const raw = window.localStorage.getItem(localKey);
    const existing = raw ? (JSON.parse(raw) as PositionRecord[]) : [];
    const nextRecord: PositionRecord = {
      ...position,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(
      localKey,
      JSON.stringify([nextRecord, ...existing]),
    );
    return;
  }

  await addDoc(collection(db, collectionName), {
    ...position,
    createdAt: serverTimestamp(),
  });
}

export async function softDeletePosition(
  collectionName: string,
  positionId: string,
  playerId: string,
) {
  if (!db) {
    const localKey = `map-positions-${collectionName}`;
    const raw = window.localStorage.getItem(localKey);
    const existing = raw ? (JSON.parse(raw) as PositionRecord[]) : [];
    const updated = existing.map((p) =>
      p.id === positionId && p.playerId === playerId
        ? { ...p, deletedAt: new Date().toISOString() }
        : p,
    );
    window.localStorage.setItem(localKey, JSON.stringify(updated));
    return;
  }

  const docRef = doc(db, collectionName, positionId);
  await updateDoc(docRef, {
    deletedAt: serverTimestamp(),
    deletedBy: playerId,
  });
}
