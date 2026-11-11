<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { loadGlobeStyle } from '../process_mapbox.js';
import { VIBE_CATEGORIES, instanceSettings } from '../config.js';

const props = defineProps({
  pins: {
    type: Array,
    default: () => [],
  },
  selectedLocation: {
    type: Object,
    default: null,
  },
  userSettings: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['select-location', 'select-pin', 'map-moved']);

const mapContainer = ref(null);
let mapInstance = null;
let currentMarkers = [];
let selectionMarker = null;

function flyToLocation(coordinates, targetZoom = 14) {
  if (!mapInstance) return;
  mapInstance.flyTo({
    center: coordinates,
    zoom: targetZoom,
    duration: 2200,
    essential: true,
  });
}

function updateSelectionMarker(coordinates) {
  clearSelectionMarker();
  if (!mapInstance) return;

  const el = document.createElement('div');
  el.className = 'selected-point-marker';
  el.style.width = '30px';
  el.style.height = '30px';
  el.style.borderRadius = '50%';
  el.style.border = '2.5px dashed #990000';
  el.style.backgroundColor = 'rgba(153, 0, 0, 0.2)';
  el.style.pointerEvents = 'none';

  selectionMarker = new maplibregl.Marker({ element: el })
    .setLngLat(coordinates)
    .addTo(mapInstance);
}

function clearSelectionMarker() {
  if (selectionMarker) {
    selectionMarker.remove();
    selectionMarker = null;
  }
}

function renderVibePins(pins = []) {
  if (!mapInstance) return;

  currentMarkers.forEach(m => m.remove());
  currentMarkers = [];

  const popup = new maplibregl.Popup({
    offset: 16,
    closeButton: true,
    closeOnClick: false,
  });

  pins.forEach((pin) => {
    const coords = pin.location?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return;

    const [lng, lat] = coords;
    const categoryInfo = VIBE_CATEGORIES[pin.vibeCategory] || {
      icon: '📍',
      color: '#011f5b',
      label: 'Street Vibe',
    };

    const el = document.createElement('div');
    el.className = 'vibe-marker-element';
    el.setAttribute('data-id', pin.id);
    el.setAttribute('data-category', pin.vibeCategory || 'other');
    el.style.backgroundColor = categoryInfo.color;
    el.innerHTML = categoryInfo.icon;
    el.title = `${pin.placeName || 'Street Vibe'}: ${categoryInfo.label}`;

    const popupContent = `
      <div class="vibe-popup-content">
        <strong style="color: ${categoryInfo.color}; font-size: 0.85rem; display: block; margin-bottom: 2px;">
          ${categoryInfo.icon} ${categoryInfo.label}
        </strong>
        <h4 style="font-size: 0.95rem; margin-bottom: 4px; color: #011f5b;">
          ${pin.placeName || 'Vibe Pin'}
        </h4>
        <p style="font-size: 0.85rem; margin-bottom: 6px; font-style: italic;">
          "${pin.sensoryNote || ''}"
        </p>
        <div style="font-size: 0.75rem; color: #666; display: flex; justify-content: space-between; align-items: center;">
          <span>Energy: ${'⚡'.repeat(pin.energyLevel || 3)}</span>
          <span>✨ ${pin.endorsements || 1}</span>
        </div>
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .addTo(mapInstance);

    el.addEventListener('click', () => {
      popup
        .setLngLat([lng, lat])
        .setHTML(popupContent)
        .addTo(mapInstance);
      emit('select-pin', { pin });
    });

    currentMarkers.push(marker);
  });
}

onMounted(async () => {
  const initialStyle = await loadGlobeStyle(
    props.userSettings.styleId,
    props.userSettings.mapboxToken
  );

  mapInstance = new maplibregl.Map({
    container: mapContainer.value,
    style: initialStyle,
    center: instanceSettings.initialCenter || [-75.1932, 39.9522],
    zoom: instanceSettings.initialZoom || 2.2,
    pitch: 0,
    maxPitch: 75,
  });

  mapInstance.on('style.load', () => {
    try {
      mapInstance.setProjection({ type: 'globe' });
    } catch (err) {
      console.warn('[GlobeMap] Could not set globe projection:', err);
    }
  });

  mapInstance.addControl(new maplibregl.NavigationControl({
    visualizePitch: true,
    showZoom: true,
    showCompass: true,
  }), 'bottom-right');

  mapInstance.on('click', (e) => {
    if (e.originalEvent.target.closest('.vibe-marker-element')) return;
    const { lng, lat } = e.lngLat;
    emit('select-location', {
      lng,
      lat,
      placeName: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      source: 'map-click',
    });
  });

  mapInstance.on('moveend', () => {
    const center = mapInstance.getCenter();
    emit('map-moved', { lng: center.lng, lat: center.lat });
  });

  renderVibePins(props.pins);
});

watch(() => props.pins, (newPins) => {
  renderVibePins(newPins || []);
}, { deep: true });

watch(() => props.selectedLocation, (loc) => {
  if (loc && typeof loc.lng === 'number' && typeof loc.lat === 'number') {
    flyToLocation([loc.lng, loc.lat], loc.zoom || 14);
    updateSelectionMarker([loc.lng, loc.lat]);
  } else {
    clearSelectionMarker();
  }
});

watch(
  () => [props.userSettings.mapboxToken, props.userSettings.styleId],
  async ([newToken, newStyle]) => {
    if (!mapInstance) return;
    const newStyleObj = await loadGlobeStyle(newStyle, newToken);
    mapInstance.setStyle(newStyleObj);
  }
);

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});
</script>

<template>
  <div class="globe-wrapper">
    <div id="map" ref="mapContainer" class="globe-map-container"></div>
    <div class="map-center-target" id="map-center-target" title="Center point for new vibe pin">
      <div class="target-ring"></div>
      <div class="target-dot"></div>
    </div>
  </div>
</template>

<style scoped>
.globe-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
