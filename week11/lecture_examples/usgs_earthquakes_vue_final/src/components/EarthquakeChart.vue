<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import bb, { scatter } from 'billboard.js';
import 'billboard.js/dist/billboard.css';
import * as d3 from 'd3';

const props = defineProps({
  binnedData: {
    type: Object,
    required: true,
  },
});

const chartContainer = ref(null);
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
  if (!chartContainer.value) return;

  chartInstance = bb.generate({
    bindto: chartContainer.value,
    data: buildChartData(props.binnedData),
    point: {
      type: 'rectangle',
      r: 6,
    },
    transition: {
      duration: null,
    },
    axis: {
      x: {
        label: 'Depth (km)',
        tick: {
          fit: false,
        },
      },
      y: {
        label: 'Magnitude',
      },
    },
    legend: {
      show: false,
    },
    tooltip: {
      format: {
        title: (x) => `Depth: ${x.toLocaleString(undefined, { maximumFractionDigits: 2 })} km`,
        value: (value, ratio, id, index) => {
          const count = currentCounts[index] ?? 1;
          return `Mag ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${count} quake${count === 1 ? '' : 's'})`;
        },
      },
    },
  });
});

watch(
  props.binnedData,
  (newBinnedData) => {
    if (chartInstance) {
      chartInstance.load(buildChartData(newBinnedData));
    }
  },
);

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});
</script>

<template>
  <section class="chart-section">
    <h3>Magnitude vs. Depth Heatmap</h3>
    <div id="earthquake-chart" ref="chartContainer"></div>
  </section>
</template>

