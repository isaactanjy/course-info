<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchEarthquakes, filterEarthquakes, binEarthquakes } from './utils/earthquakes.js';
import EarthquakeControls from './components/EarthquakeControls.vue';
import EarthquakeChart from './components/EarthquakeChart.vue';
import EarthquakeMap from './components/EarthquakeMap.vue';

const allEarthquakes = ref([]);
const filters = ref({
  minMag: 0,
  minDepth: 0,
  maxDepth: 700,
});

// TODO (Live Code Break #1): Compute filtered earthquakes using filterEarthquakes helper
const filteredEarthquakes = computed(() => {
  return filterEarthquakes(allEarthquakes.value, filters.value);
});

// TODO (Live Code Break #2): Compute binned heatmap data using binEarthquakes helper
const binnedData = computed(() => {
  return binEarthquakes(filteredEarthquakes.value);
});

onMounted(async () => {
  allEarthquakes.value = await fetchEarthquakes();
});

// TODO (Live Code Break #1): Handle @update:filters event from EarthquakeControls
function handleFilterUpdate(newFilters) {
  filters.value = newFilters;
}
</script>

<template>
  <header>
    <h1>USGS Earthquakes: Magnitude &amp; Depth Filter</h1>
    <p class="info">Explore global earthquake activity with interactive filtering and binned scatter visualization</p>
  </header>
  <main>
    <div class="sidebar-layout">
      <aside class="sidebar">
        <!-- TODO (Live Code Break #1): Pass :filters, :count, and listen for @update:filters -->
        <EarthquakeControls />
        <!-- :filters="filters" -->
        <!-- :count="filteredEarthquakes.length" -->
        <!-- @update:filters="handleFilterUpdate" -->

        <!-- TODO (Live Code Break #2): Pass :binned-data to EarthquakeChart -->
        <EarthquakeChart />
        <!-- :binned-data="binnedData" -->
      </aside>

      <!-- TODO (Live Code Break #3): Pass :earthquakes to EarthquakeMap -->
      <EarthquakeMap />
      <!-- :earthquakes="filteredEarthquakes" -->
    </div>
  </main>
  <footer>
    <p>Data from <a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php" target="_blank" rel="noopener">USGS Earthquake Hazards Program</a>.</p>
  </footer>
</template>
