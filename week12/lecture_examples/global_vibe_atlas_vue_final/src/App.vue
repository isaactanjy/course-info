<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import GlobeMap from './components/GlobeMap.vue';
import SearchBar from './components/SearchBar.vue';
import VibePanel from './components/VibePanel.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import { instanceSettings } from './config.js';
import { UserStorage } from './storage.js';
import {
  initBackend,
  subscribeToPins,
  unsubscribeFromPins,
  savePin,
  endorsePin,
} from './backend.js';

// Reactive State
const pins = ref([]);
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

const isLoading = ref(true);
const isSaving = ref(false);
const lastSavedPin = ref(null);
const isSettingsOpen = ref(false);

// 1. Lifecycle Initialization & Real-Time onSnapshot Listener
onMounted(async () => {
  console.log('[App] Initializing backend and real-time subscription...');
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

// 2. Filter Change Handler with Server-Side Re-Subscription
function handleFilterChange(newFilter) {
  activeFilter.value = newFilter;
  UserStorage.setFilter(newFilter);

  subscribeToPins(newFilter, (incomingPins) => {
    pins.value = incomingPins;
  });
}

// 3. Pin Submission Handler (Writing to Firestore with addDoc)
async function handlePinSubmit(pinData) {
  UserStorage.setAuthor(pinData.author);
  userSettings.value.author = pinData.author;

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
}

// 4. Endorsement Handler (Atomic updateDoc + increment)
function handleEndorsePin(pinId) {
  if (selectedPin.value && selectedPin.value.id === pinId) {
    selectedPin.value.endorsements = (selectedPin.value.endorsements || 1) + 1;
  }
  endorsePin(pinId, 1);
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
