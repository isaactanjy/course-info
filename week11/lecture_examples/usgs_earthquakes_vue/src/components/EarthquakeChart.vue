<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import bb, { scatter } from 'billboard.js';
import 'billboard.js/dist/billboard.css';
import * as d3 from 'd3';

// TODO (Live Code Break #2): Declare props for binnedData
// const props = defineProps({
//   binnedData: {
//     type: Object,
//     default: () => ({ depths: [], magnitudes: [], counts: [], maxCount: 0 }),
//   },
// });

// TODO (Live Code Break #2): Create template ref for the chart container element
// const chartContainer = ref(null);
let chartInstance = null;
let currentCounts = [];

function buildChartData(binnedData) {
  currentCounts = binnedData?.counts || [];
  const minCount = currentCounts.length > 0
    ? currentCounts.reduce((min, c) => Math.min(min, c), currentCounts[0])
    : 0;
  const maxCount = binnedData?.maxCount || 1;
  const range = maxCount - minCount;

  return {
    xs: {
      magnitude: 'depth',
    },
    columns: [
      ['depth', ...(binnedData?.depths || [])],
      ['magnitude', ...(binnedData?.magnitudes || [])],
    ],
    type: scatter(),
    colors: {
      magnitude: (d) => {
        const count = currentCounts[d.index] ?? 1;
        const t = range > 0 ? (count - minCount) / range : 0.5;
        return d3.interpolateYlOrRd(0.2 + 0.8 * t);
      },
    },
  };
}

onMounted(() => {
  // TODO (Live Code Break #2): Initialize bb.generate() with bindto: chartContainer.value
  // if (!chartContainer.value) return;

  // chartInstance = bb.generate({
  //   bindto: chartContainer.value,
  //   data: buildChartData(props.binnedData),
  //   point: {
  //     type: 'rectangle',
  //     r: 6,
  //   },
  //   transition: {
  //     duration: null,
  //   },
  //   axis: {
  //     x: {
  //       label: 'Depth (km)',
  //       tick: { fit: false },
  //     },
  //     y: {
  //       label: 'Magnitude',
  //     },
  //   },
  //   legend: { show: false },
  // });
});

// TODO (Live Code Break #2): Watch () => props.binnedData and call chartInstance.load(...)
// watch(
//   props.binnedData,
//   (newBinnedData) => {
//     if (chartInstance) {
//       chartInstance.load(buildChartData(newBinnedData));
//     }
//   },
// );

onBeforeUnmount(() => {
  // TODO (Live Code Break #2): Clean up chartInstance with chartInstance.destroy()
  // if (chartInstance) {
  //   chartInstance.destroy();
  //   chartInstance = null;
  // }
});
</script>

<template>
  <section class="chart-section">
    <h3>Magnitude vs. Depth Heatmap</h3>
    <!-- TODO (Live Code Break #2): Attach ref="chartContainer" -->
    <div id="earthquake-chart"></div>
    <!-- ref="chartContainer" -->
  </section>
</template>
