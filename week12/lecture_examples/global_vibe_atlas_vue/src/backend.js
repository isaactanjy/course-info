/**
 * Backend Persistence Service (Cloud Firestore)
 *
 * Persists all vibe observations and endorsements to Google Cloud Firestore.
 *
 * Demonstrates:
 * 1. Initializing Firebase & Firestore from bundled npm packages
 * 2. Real-time push subscriptions via onSnapshot() with server-side query() + where()
 * 3. Adding documents via addDoc()
 * 4. Atomic increments via updateDoc() + increment()
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import _ from 'lodash';
import { firebaseConfig } from './config.js';

// Initialize Firebase App & Cloud Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTION_NAME = 'vibe_pins';

// Seed sample pins shown when database collection is empty
export const SEED_PINS = [
  {
    placeName: 'Raohe Street Night Market, Taipei',
    vibeCategory: 'night_market_food',
    energyLevel: 5,
    sensoryNote: 'Sizzling black pepper buns in tandoor-style ovens, herbal medicinal soups, neon temple glow, scooters weaving through alleys.',
    author: 'Mei-Ling',
    location: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [121.5775, 25.0509] },
    },
    endorsements: 12,
    submittedAt: '2026-10-20T14:30:00.000Z',
  },
  {
    placeName: 'Tom Mboya Street, Nairobi',
    vibeCategory: 'bustling_transit_chaos',
    energyLevel: 5,
    sensoryNote: 'Vibrant graffiti-painted matatus blasting gengetone music, conductors whistling rhythmically, roasted maize smoke in the evening breeze.',
    author: 'Karanja',
    location: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [36.8258, -1.2841] },
    },
    endorsements: 8,
    submittedAt: '2026-10-20T16:15:00.000Z',
  },
  {
    placeName: 'Parque México, Condesa, Mexico City',
    vibeCategory: 'nature_water_sanctuary',
    energyLevel: 2,
    sensoryNote: 'Towering jacaranda trees dropping purple blossoms, art deco fountains splashing, dogs playing on grassy paths, acoustic guitar echoing.',
    author: 'Mateo',
    location: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-99.1687, 19.4124] },
    },
    endorsements: 15,
    submittedAt: '2026-10-20T18:00:00.000Z',
  },
  {
    placeName: '46th & Baltimore Ave, West Philadelphia',
    vibeCategory: 'street_music_culture',
    energyLevel: 4,
    sensoryNote: 'Trolley metal wheels squealing on the turn, jazz porchfest brass horns echoing through Victorian porches, Ethiopian coffee beans roasting.',
    author: 'MUSA Explorer',
    location: {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-75.2155, 39.9486] },
    },
    endorsements: 19,
    submittedAt: '2026-10-21T01:00:00.000Z',
  },
];

let activeUnsubscribe = null;
const pendingDeltas = {};

/**
 * Normalizes document submittedAt date whether it's an ISO string or a Firestore Timestamp.
 */
function normalizeSubmittedAt(raw) {
  if (!raw) return new Date().toISOString();
  if (typeof raw.toDate === 'function') {
    return raw.toDate().toISOString();
  }
  return raw;
}

/**
 * Initializes the backend service, seeds if needed, and starts real-time subscription.
 *
 * @param {Object} options
 * @param {string} options.filter 'all' or category ID
 * @param {Function} options.onPinsUpdated Callback receiving updated Array of pins
 * @param {Function} [options.onError] Error callback
 * @returns {Promise<Function>} Unsubscribe function
 */
export async function initBackend({ filter = 'all', onPinsUpdated, onError } = {}) {
  await checkAndSeedDatabase();
  subscribeToPins(filter, onPinsUpdated, onError);
  return unsubscribeFromPins;
}

/**
 * Subscribes to real-time updates from Firestore via onSnapshot().
 * Uses query() and where() for server-side filtering when a category is selected.
 *
 * @param {string} filter 'all' or category ID
 * @param {Function} onPinsUpdated Callback receiving updated Array of pins
 * @param {Function} [onError] Error callback
 */
export function subscribeToPins(filter = 'all', onPinsUpdated, onError) {
  unsubscribeFromPins();

  const collRef = collection(db, COLLECTION_NAME);
  let targetQuery;

  if (filter && filter !== 'all') {
    targetQuery = query(collRef, where('vibeCategory', '==', filter));
  } else {
    targetQuery = collRef;
  }

  activeUnsubscribe = onSnapshot(
    targetQuery,
    (querySnapshot) => {
      const pins = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        pins.push({
          id: docSnap.id,
          ...data,
          submittedAt: normalizeSubmittedAt(data.submittedAt),
        });
      });

      // Sort newest first
      pins.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

      if (typeof onPinsUpdated === 'function') {
        onPinsUpdated(pins);
      }
    },
    (err) => {
      console.error('[backend] Firestore onSnapshot subscription error:', err);
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  );
}

/**
 * Cleans up active onSnapshot listener if present.
 */
export function unsubscribeFromPins() {
  if (typeof activeUnsubscribe === 'function') {
    activeUnsubscribe();
    activeUnsubscribe = null;
  }
}

/**
 * Writes a new pin to Cloud Firestore using addDoc().
 *
 * @param {Object} pinData Pin properties
 * @returns {Promise<Object>} Saved pin with id and normalized submittedAt
 */
export async function savePin(pinData) {
  const collRef = collection(db, COLLECTION_NAME);
  const docPayload = {
    ...pinData,
    submittedAt: pinData.submittedAt ? pinData.submittedAt : serverTimestamp(),
  };

  const docRef = await addDoc(collRef, docPayload);
  return {
    id: docRef.id,
    ...pinData,
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Endorses a pin using Firestore updateDoc() + increment() with debouncing.
 *
 * @param {string} pinId Document ID
 * @param {number} [delta=1] Incremental endorsement count
 */
export function endorsePin(pinId, delta = 1) {
  if (!pinId) return;
  pendingDeltas[pinId] = (pendingDeltas[pinId] || 0) + delta;
  debouncedFlushEndorsement(pinId);
}

const debouncedFlushEndorsement = _.debounce(async (pinId) => {
  const delta = pendingDeltas[pinId];
  if (!delta) return;
  delete pendingDeltas[pinId];

  try {
    const pinRef = doc(db, COLLECTION_NAME, pinId);
    await updateDoc(pinRef, {
      endorsements: increment(delta),
    });
  } catch (err) {
    console.warn(`[backend] Could not update endorsement in Firestore for doc ${pinId}:`, err);
  }
}, 1000);

/**
 * Helper to seed initial pins if the collection is empty.
 */
async function checkAndSeedDatabase() {
  try {
    const collRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(collRef);
    if (snapshot.empty) {
      console.log('[backend] Firestore collection empty. Seeding initial pins...');
      for (const pin of SEED_PINS) {
        await addDoc(collRef, pin);
      }
      console.log('[backend] Initial pins seeded.');
    }
  } catch (err) {
    console.warn('[backend] Note on seeding check (may be permission/network related):', err);
  }
}
