<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  earthquakes: {
    type: Array,
    required: true,
  },
});

const mapContainer = ref(null);
let mapInstance = null;
let markerLayer = null;

function getColorFromDepth(depth) {
  if (depth < 70) return '#e63946';
  if (depth < 300) return '#f4a261';
  return '#e76f51';
}

function renderMarkers(earthquakes = []) {
  if (!markerLayer) return;

  markerLayer.clearLayers();

  for (const eq of earthquakes) {
    const lat = eq.geometry?.coordinates?.[1];
    const lng = eq.geometry?.coordinates?.[0];
    const depth = eq.geometry?.coordinates?.[2] ?? 0;
    const mag = eq.properties?.mag ?? 0;
    const place = eq.properties?.place || 'Unknown location';

    if (lat === undefined || lng === undefined) continue;

    const marker = L.circleMarker([lat, lng], {
      stroke: false,
      radius: Math.max(mag * 2.5, 2),
      fillColor: getColorFromDepth(depth),
      fillOpacity: 0.65,
    });

    marker.bindPopup(`
      <strong>${place}</strong><br>
      Magnitude: ${Number(mag).toFixed(1)}<br>
      Depth: ${Number(depth).toFixed(1)} km
    `);

    marker.addTo(markerLayer);
  }
}

onMounted(() => {
  if (!mapContainer.value) return;

  mapInstance = L.map(mapContainer.value).setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(mapInstance);

  markerLayer = L.layerGroup().addTo(mapInstance);
  renderMarkers(props.earthquakes);
});

watch(
  props.earthquakes,
  (newEarthquakes) => {
    renderMarkers(newEarthquakes);
  },
);

onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove();
    mapInstance = null;
  }
});
</script>

<template>
  <section class="map-section">
    <div id="map" ref="mapContainer" class="map visualization-container"></div>
  </section>
</template>

