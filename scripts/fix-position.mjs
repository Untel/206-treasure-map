#!/usr/bin/env node
/** Fix: position at (237,267) by Apple should be sandstorm-fortress-ii, not sandstorm-fortress-i */

import { initializeApp } from 'firebase/app'
import { collection, getDocs, getFirestore, query, updateDoc, doc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAYSXsijQgzFIRnCyBRF26JtHTh-mYtFbs',
  authDomain: 'map-b8e70.firebaseapp.com',
  projectId: 'map-b8e70',
  storageBucket: 'map-b8e70.firebasestorage.app',
  messagingSenderId: '711874835896',
  appId: '1:711874835896:web:ccff17ef84d7f33a514b4d',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const COLLECTION = 's1_2_S10206'

const snapshot = await getDocs(query(collection(db, COLLECTION)))
let fixed = 0

for (const d of snapshot.docs) {
  const data = d.data()
  if (data.x === 237 && data.y === 267 && data.item === 'sandstorm-fortress-i') {
    console.log(`Found: (${data.x},${data.y}) by "${data.nickname}" — "${data.item}"`)
    await updateDoc(doc(db, COLLECTION, d.id), { item: 'sandstorm-fortress-ii' })
    console.log(`  → Fixed to "sandstorm-fortress-ii"`)
    fixed++
  }
}

console.log(fixed ? `Done! Fixed ${fixed} document(s).` : 'No matching document found.')
