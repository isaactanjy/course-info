<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import GlobeMap from './components/GlobeMap.vue';
import SearchBar from './components/SearchBar.vue';
import VibePanel from './components/VibePanel.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import { instanceSettings } from './config.js';
import { UserStorage } from './storage.js';
import {
  SEED_PINS,
  initBackend,
  subscribeToPins,
  unsubscribeFromPins,
  savePin,
  endorsePin,
} from './backend.js';

// Reactive State
// In the starter app, we seed pins with sample data so the 3D globe works immediately.
// Once TODO 1 is uncommented, onSnapshot will replace these with live database records!
const pins = ref([...SEED_PINS]);
const activeFilter = ref(UserStorage.getFilter(instanceSettings.defaultVibeFilter || 'all'));
const userSettings = ref({
  author: UserStorage.getAuthor('Anonymous Explorer'),
  mapboxToken: UserStorage.getMapboxToken(instanceSettings.mapboxToken),
  styleId: UserStorage.getStyleId(instanceSettings.mapboxStyleId),
});

const selectedLocation = ref(null);
const mapCenter = ref({
  lng: instanceSettings.initialCenter[0],
  lat: instanceSettings.initialCenter[1],
});
const selectedPin = ref(null);
const panelMode = ref('closed'); // 'closed' | 'details' | 'form' | 'thank-you'

const isLoading = ref(false);
const isSaving = ref(false);
const lastSavedPin = ref(null);
const isSettingsOpen = ref(false);

// =============================================================================
// TODO 1: Lifecycle Initialization & Real-Time onSnapshot Listener
// =============================================================================
// In class, uncomment the onMounted and onBeforeUnmount hooks below to connect
// to Cloud Firestore! onSnapshot will immediately push all pins from the database,
// replacing our local SEED_PINS with live collaborative data from everyone in class.
//
/*
onMounted(async () => {
  console.log('[App] Initializing backend and real-time subscription...');
  isLoading.value = true;
  await initBackend({
    filter: activeFilter.value,
    onPinsUpdated: (incomingPins) => {
      console.log(`[App] onSnapshot delivered ${incomingPins.length} pins.`);
      pins.value = incomingPins;
      isLoading.value = false;
    },
    onError: (err) => {
      console.error('[App] Real-time subscription error:', err);
      isLoading.value = false;
    },
  });
});

onBeforeUnmount(() => {
  console.log('[App] Unsubscribing from real-time Firestore updates...');
  unsubscribeFromPins();
});
*/

// =============================================================================
// TODO 2: Filter Change Handler with Server-Side Re-Subscription
// =============================================================================
// In class, uncomment subscribeToPins below. When the filter changes,
// we re-subscribe to Firestore using query() + where('vibeCategory', '==', newFilter).
//
function handleFilterChange(newFilter) {
  activeFilter.value = newFilter;
  UserStorage.setFilter(newFilter);

  /*
  subscribeToPins(newFilter, (incomingPins) => {
    pins.value = incomingPins;
  });
  */
}

// =============================================================================
// TODO 3: Pin Submission Handler (Writing to Firestore with addDoc)
// =============================================================================
// In class, replace the local fallback with the async savePin(pinData) call below!
// Notice: we do NOT need pins.value.push(saved), because onSnapshot is
// already listening and will push the updated pins to us automatically!
//
async function handlePinSubmit(pinData) {
  UserStorage.setAuthor(pinData.author);
  userSettings.value.author = pinData.author;

  // --- UNCOMMENT FOR FIRESTORE (TODO 3) ---
  /*
  isSaving.value = true;
  try {
    const saved = await savePin(pinData);
    lastSavedPin.value = saved;
    panelMode.value = 'thank-you';
  } catch (err) {
    console.error('[App] Failed to save pin to Firestore:', err);
    alert('Could not save pin to Firestore. Check console for details.');
  } finally {
    isSaving.value = false;
  }
  */

  // --- TEMPORARY LOCAL FALLBACK (Comment out when activating Firestore above) ---
  const localPin = { id: `local-${Date.now()}`, ...pinData };
  pins.value = [localPin, ...pins.value];
  lastSavedPin.value = localPin;
  panelMode.value = 'thank-you';
}

// =============================================================================
// TODO 4: Endorsement Handler (Atomic updateDoc + increment)
// =============================================================================
// In class, uncomment endorsePin below to persist endorsements to Firestore:
//
function handleEndorsePin(pinId) {
  // Optimistic UI update for the open details panel
  if (selectedPin.value && selectedPin.value.id === pinId) {
    selectedPin.value.endorsements = (selectedPin.value.endorsements || 1) + 1;
  }

  /*
  endorsePin(pinId, 1);
  */
}

// UI Navigation Handlers
function handleLocationSelect(loc) {
  selectedLocation.value = loc;
  panelMode.value = 'form';
}

function handlePinSelect({ pin }) {
  selectedPin.value = pin;
  panelMode.value = 'details';
}

function handleMapMoved(center) {
  mapCenter.value = center;
}

function handleOpenNewPinForm() {
  selectedLocation.value = {
    lng: mapCenter.value.lng,
    lat: mapCenter.value.lat,
    placeName: `Location (${mapCenter.value.lat.toFixed(4)}, ${mapCenter.value.lng.toFixed(4)})`,
  };
  panelMode.value = 'form';
}

function handleClosePanel() {
  panelMode.value = 'closed';
  selectedLocation.value = null;
}

function handleSaveSettings(newSettings) {
  UserStorage.setAuthor(newSettings.author);
  UserStorage.setMapboxToken(newSettings.mapboxToken);
  UserStorage.setStyleId(newSettings.styleId);

  userSettings.value = { ...newSettings };
}
</script>

<template>
  <!-- App Header -->
  <header class="app-header">
    <div class="header-content">
      <div class="brand">
        <h1 class="app-title">Global Street Vibe Atlas</h1>
        <p class="app-tagline">Crowdsourcing the sensory character of street corners across the globe</p>
      </div>
      <div class="user-meta">
        <span
          class="user-handle-badge"
          id="user-handle-badge"
          title="Click to change your contributor name"
          @click="isSettingsOpen = true"
        >
          👤 <span>{{ userSettings.author }}</span>
        </span>
        <button
          type="button"
          id="open-settings-btn"
          class="btn-settings"
          title="Instance Settings & Mapbox Key"
          @click="isSettingsOpen = true"
        >
          ⚙️ Settings
        </button>
      </div>
    </div>
  </header>

  <!-- Main Viewport Area -->
  <main class="viewport-main">
    <!-- Floating Search & Vibe Filter -->
    <SearchBar
      :active-filter="activeFilter"
      :mapbox-token="userSettings.mapboxToken"
      @select-location="handleLocationSelect"
      @update:active-filter="handleFilterChange"
    />

    <!-- MapLibre 3D Globe Map -->
    <GlobeMap
      :pins="pins"
      :selected-location="selectedLocation"
      :user-settings="userSettings"
      @select-location="handleLocationSelect"
      @select-pin="handlePinSelect"
      @map-moved="handleMapMoved"
    />

    <!-- Floating Action Button: Drop Pin -->
    <button
      type="button"
      id="drop-pin-btn"
      class="btn-drop-pin"
      @click="handleOpenNewPinForm"
    >
      <span class="btn-icon">📍</span>
      <span class="btn-text">Drop a Vibe Pin Here</span>
    </button>

    <!-- Sliding Content Panel -->
    <VibePanel
      :mode="panelMode"
      :selected-pin="selectedPin"
      :selected-location="selectedLocation"
      :default-author="userSettings.author"
      :is-saving="isSaving"
      :saved-pin="lastSavedPin"
      @close="handleClosePanel"
      @submit-pin="handlePinSubmit"
      @endorse-pin="handleEndorsePin"
    />

    <!-- Loading Overlay -->
    <div v-if="isLoading" id="loading-overlay" class="loading-overlay">
      <div class="loading-box">
        <div class="progress-bar-container indeterminate">
          <div class="progress-bar"></div>
        </div>
        <p class="loading-text" id="loading-message">Connecting to Cloud Firestore...</p>
      </div>
    </div>
  </main>

  <!-- Settings Dialog -->
  <SettingsDialog
    :is-open="isSettingsOpen"
    :user-settings="userSettings"
    @close="isSettingsOpen = false"
    @save-settings="handleSaveSettings"
  />
</template>
