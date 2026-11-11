<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import _ from 'lodash';
import { VIBE_CATEGORIES } from '../config.js';

const props = defineProps({
  activeFilter: {
    type: String,
    default: 'all',
  },
  mapboxToken: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['select-location', 'update:activeFilter']);

const searchQuery = ref('');
const suggestions = ref([]);
const isSuggestionsVisible = ref(false);
const isGeolocating = ref(false);
const searchContainer = ref(null);

async function searchMapboxGeocoding(query, token) {
  const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&limit=5&access_token=${token}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Mapbox search status ${response.status}`);
  const data = await response.json();
  return (data.features || []).map((feat) => {
    const [lng, lat] = feat.geometry?.coordinates || [0, 0];
    const placeName = feat.properties?.full_address || feat.properties?.name || query;
    return { placeName, lng, lat };
  });
}

async function searchNominatim(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Nominatim search status ${response.status}`);
  const data = await response.json();
  return data.map((item) => ({
    placeName: item.display_name,
    lng: parseFloat(item.lon),
    lat: parseFloat(item.lat),
  }));
}

const performSearch = _.debounce(async () => {
  const q = searchQuery.value.trim();
  if (q.length < 2) {
    suggestions.value = [];
    isSuggestionsVisible.value = false;
    return;
  }

  try {
    let results = [];
    if (props.mapboxToken && props.mapboxToken.startsWith('pk.')) {
      results = await searchMapboxGeocoding(q, props.mapboxToken);
    } else {
      results = await searchNominatim(q);
    }
    suggestions.value = results;
    isSuggestionsVisible.value = true;
  } catch (err) {
    console.warn('[SearchBar] Search error:', err);
  }
}, 400);

function handleInput() {
  performSearch();
}

function handleSelectSuggestion(item) {
  searchQuery.value = item.placeName;
  isSuggestionsVisible.value = false;
  emit('select-location', {
    lng: item.lng,
    lat: item.lat,
    placeName: item.placeName,
    zoom: 14,
    source: 'search-autocomplete',
  });
}

function handleGeolocate() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  isGeolocating.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      isGeolocating.value = false;
      const { latitude: lat, longitude: lng } = position.coords;
      searchQuery.value = 'My Current Location';
      isSuggestionsVisible.value = false;
      emit('select-location', {
        lng,
        lat,
        placeName: 'My Current Location',
        zoom: 15,
        source: 'geolocation',
      });
    },
    (err) => {
      isGeolocating.value = false;
      console.warn('[SearchBar] Geolocation error:', err);
      alert('Could not determine your location.');
    },
    { timeout: 8000 }
  );
}

function handleOutsideClick(e) {
  if (searchContainer.value && !searchContainer.value.contains(e.target)) {
    isSuggestionsVisible.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<template>
  <div class="map-floating-controls">
    <!-- Debounced Place Search -->
    <div ref="searchContainer" class="search-container" id="search-container">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          v-model="searchQuery"
          @input="handleInput"
          @focus="suggestions.length > 0 && (isSuggestionsVisible = true)"
          id="place-search-input"
          class="search-input"
          placeholder="Search any city or street (e.g., Taipei, Mexico City)..."
          autocomplete="off"
        >
        <button
          type="button"
          @click="handleGeolocate"
          id="geolocate-btn"
          class="geolocate-btn"
          :title="isGeolocating ? 'Locating...' : 'Jump to my location'"
          :disabled="isGeolocating"
        >
          {{ isGeolocating ? '⏳' : '📍' }}
        </button>
      </div>

      <ul v-if="isSuggestionsVisible" id="place-suggestions" class="suggestions-list">
        <li v-if="suggestions.length === 0" class="suggestion-item">
          <button type="button" disabled style="opacity: 0.6;">No locations found.</button>
        </li>
        <li
          v-for="(item, idx) in suggestions"
          :key="idx"
          class="suggestion-item"
        >
          <button type="button" @click="handleSelectSuggestion(item)">
            {{ item.placeName }}
          </button>
        </li>
      </ul>
    </div>

    <!-- Curated Vibe Lens Filter Dropdown -->
    <div class="filter-container">
      <label for="vibe-filter-select" class="filter-label">Filter Vibe:</label>
      <select
        id="vibe-filter-select"
        class="filter-select"
        :value="activeFilter"
        @change="emit('update:activeFilter', $event.target.value)"
      >
        <option value="all">🌐 All Vibes</option>
        <option
          v-for="cat in Object.values(VIBE_CATEGORIES)"
          :key="cat.id"
          :value="cat.id"
        >
          {{ cat.icon }} {{ cat.label }}
        </option>
      </select>
    </div>
  </div>
</template>
