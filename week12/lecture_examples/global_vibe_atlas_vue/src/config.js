/**
 * Global Street Vibe Atlas - Configuration
 *
 * Supports optional Vite environment variables (VITE_*) with fallbacks
 * to the shared classroom configuration.
 */

export const instanceSettings = {
  instanceTitle: 'Global Street Vibe Atlas',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  mapboxStyleId: 'mapbox/dark-v11',
  initialCenter: [-75.1932, 39.9522],
  initialZoom: 2.2,
  defaultVibeFilter: 'all',
};

export const VIBE_CATEGORIES = {
  night_market_food: {
    id: 'night_market_food',
    label: 'Night Market & Street Food',
    icon: '🍜',
    color: '#e65100',
    description: 'Sizzling woks, spices, food carts, neon signs, and aroma',
  },
  street_music_culture: {
    id: 'street_music_culture',
    label: 'Street Music & Culture',
    icon: '🎺',
    color: '#8e24aa',
    description: 'Busker melodies, drum beats, outdoor theater, gallery walls',
  },
  nature_water_sanctuary: {
    id: 'nature_water_sanctuary',
    label: 'Quiet Sanctuary & Nature',
    icon: '🌿',
    color: '#2e7d32',
    description: 'Rustling leaves, fountain babble, birds, peaceful courtyard',
  },
  bustling_transit_chaos: {
    id: 'bustling_transit_chaos',
    label: 'Bustling Transit Energy',
    icon: '⚡',
    color: '#c62828',
    description: 'Rattling trains, honking horns, crowd movement, city pulse',
  },
  cafe_third_place: {
    id: 'cafe_third_place',
    label: 'Cafe & Third Place',
    icon: '☕',
    color: '#0277bd',
    description: 'Espresso hiss, book pages turning, murmur of conversation',
  },
};

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDWPfC2CzZGFKTELlp3gUFvbGcSdoGkYi8',
  authDomain: 'global-vibes-collab-2026.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'global-vibes-collab-2026',
  storageBucket: 'global-vibes-collab-2026.firebasestorage.app',
  messagingSenderId: '1053812110565',
  appId: '1:1053812110565:web:76c52fb671474b528bd00c',
  measurementId: 'G-P66P3B16ZD',
};
