<script setup>
import { ref, watch } from 'vue';

// TODO (Live Code Break #1): Define props for filters and count
// const props = defineProps({
//   filters: {
//     type: Object,
//     default: () => ({ minMag: 0, minDepth: 0, maxDepth: 700 }),
//   },
//   count: {
//     type: Number,
//     default: 0,
//   },
// });

// TODO (Live Code Break #1): Define emits for updating filters
// const emit = defineEmits(['update:filters']);

const minMag = ref(props.filters.minMag ?? 0);
const minDepth = ref(props.filters.minDepth ?? 0);
const maxDepth = ref(props.filters.maxDepth ?? 700);

watch(
  props.filters,
  (newFilters) => {
    if (newFilters) {
      minMag.value = newFilters.minMag ?? 0;
      minDepth.value = newFilters.minDepth ?? 0;
      maxDepth.value = newFilters.maxDepth ?? 700;
    }
  },
  { deep: true },
);

// TODO (Live Code Break #1): Implement emitFilter and slider constraint handlers
// function emitFilter() {
//   emit('update:filters', {
//     minMag: minMag.value,
//     minDepth: minDepth.value,
//     maxDepth: maxDepth.value,
//   });
// }

// function handleMinDepth() {
//   if (minDepth.value > maxDepth.value) {
//     maxDepth.value = minDepth.value;
//   }
//   emitFilter();
// }

// function handleMaxDepth() {
//   if (maxDepth.value < minDepth.value) {
//     minDepth.value = maxDepth.value;
//   }
//   emitFilter();
// }
</script>

<template>
  <form id="earthquake-controls" class="controls" @submit.prevent>
    <h2>Filter Earthquakes</h2>

    <div class="form-group">
      <label for="mag-slider">
        Minimum Magnitude: <span id="mag-value">{{ minMag.toFixed(1) }}</span>
      </label>
      <!-- TODO (Live Code Break #1): Bind range slider with v-model.number -->
      <input
        type="range"
        id="mag-slider"
        name="mag-slider"
        min="0"
        max="10"
        step="0.5"
      />
      <!-- v-model.number="minMag" -->
      <!-- @input="emitFilter" -->
    </div>

    <div class="form-group">
      <label for="min-depth-slider">
        Minimum Depth (km): <span id="min-depth-value">{{ minDepth }}</span>
      </label>
      <!-- TODO (Live Code Break #1): Bind range slider with v-model.number and handle min/max sync -->
      <input
        type="range"
        id="min-depth-slider"
        name="min-depth-slider"
        min="0"
        max="700"
        step="10"
      />
      <!-- v-model.number="minDepth" -->
      <!-- @input="handleMinDepth" -->
    </div>

    <div class="form-group">
      <label for="max-depth-slider">
        Maximum Depth (km): <span id="max-depth-value">{{ maxDepth }}</span>
      </label>
      <!-- TODO (Live Code Break #1): Bind range slider with v-model.number and handle min/max sync -->
      <input
        type="range"
        id="max-depth-slider"
        name="max-depth-slider"
        min="0"
        max="700"
        step="10"
      />
      <!-- v-model.number="maxDepth" -->
      <!-- @input="handleMaxDepth" -->
    </div>

    <div class="count-display">
      <p>Showing <span id="earthquake-count">{{ count.toLocaleString() }}</span> earthquakes</p>
    </div>
  </form>
</template>
