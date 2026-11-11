<script setup>
import { ref, computed, watch } from 'vue';
import { VIBE_CATEGORIES } from '../config.js';

const props = defineProps({
  mode: {
    type: String,
    default: 'closed', // 'closed' | 'details' | 'form' | 'thank-you'
  },
  selectedPin: {
    type: Object,
    default: null,
  },
  selectedLocation: {
    type: Object,
    default: null,
  },
  defaultAuthor: {
    type: String,
    default: 'Anonymous Explorer',
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  savedPin: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close', 'submit-pin', 'endorse-pin']);

// Local form state
const formPlaceName = ref('');
const formVibeCategory = ref('night_market_food');
const formEnergyLevel = ref(3);
const formSensoryNote = ref('');
const formAuthor = ref(props.defaultAuthor);

// Sync form defaults when location changes or panel opens
watch(
  () => props.selectedLocation,
  (loc) => {
    if (loc) {
      formPlaceName.value = loc.placeName || 'Selected Location';
    }
  },
  { immediate: true }
);

watch(
  () => props.defaultAuthor,
  (author) => {
    if (author) {
      formAuthor.value = author;
    }
  },
  { immediate: true }
);

const panelTitle = computed(() => {
  if (props.mode === 'details') {
    return props.selectedPin?.placeName || 'Street Vibe Details';
  }
  if (props.mode === 'form') {
    return 'Log a Street Vibe';
  }
  if (props.mode === 'thank-you') {
    return 'Vibe Logged!';
  }
  return 'Location Information';
});

const selectedPinCategory = computed(() => {
  if (!props.selectedPin) return null;
  return VIBE_CATEGORIES[props.selectedPin.vibeCategory] || {
    icon: '📍',
    color: '#011f5b',
    label: 'Street Vibe',
  };
});

const energyMeter = computed(() => {
  if (!props.selectedPin) return '';
  const level = props.selectedPin.energyLevel || 3;
  return '⚡'.repeat(level) + '⚪'.repeat(5 - level);
});

const formattedPinDate = computed(() => {
  if (!props.selectedPin?.submittedAt) return 'Recent';
  try {
    return new Date(props.selectedPin.submittedAt).toLocaleDateString();
  } catch {
    return 'Recent';
  }
});

function handleSubmit() {
  const coords = props.selectedLocation
    ? [props.selectedLocation.lng || 0, props.selectedLocation.lat || 0]
    : [0, 0];

  const pinData = {
    placeName: formPlaceName.value.trim() || 'Selected Location',
    vibeCategory: formVibeCategory.value,
    energyLevel: Number(formEnergyLevel.value),
    sensoryNote: formSensoryNote.value.trim(),
    author: formAuthor.value.trim() || 'Anonymous Explorer',
    location: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: coords,
      },
    },
    endorsements: 1,
    submittedAt: new Date().toISOString(),
  };

  emit('submit-pin', pinData);
}

function handleEndorse() {
  if (props.selectedPin?.id) {
    emit('endorse-pin', props.selectedPin.id);
  }
}
</script>

<template>
  <aside
    id="content-panel"
    class="content-panel"
    :class="{ hidden: mode === 'closed' }"
  >
    <div class="panel-header">
      <div class="panel-drag-handle"></div>
      <h2 id="panel-title" class="panel-title">{{ panelTitle }}</h2>
      <button
        id="close-panel-btn"
        class="close-panel-btn"
        title="Close panel"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>

    <div id="panel-body" class="panel-body">
      <!-- Mode 1: Pin Details -->
      <div v-if="mode === 'details' && selectedPin" class="vibe-detail-card">
        <div
          class="vibe-badge"
          :data-category="selectedPin.vibeCategory || 'other'"
          :style="{ backgroundColor: selectedPinCategory.color }"
        >
          <span>{{ selectedPinCategory.icon }}</span>
          <span>{{ selectedPinCategory.label }}</span>
        </div>

        <div class="energy-meter">
          <strong>Energy Level:</strong>
          <span class="energy-dots" :title="`${selectedPin.energyLevel || 3} out of 5`">
            {{ energyMeter }}
          </span>
          <span>({{ selectedPin.energyLevel || 3 }}/5)</span>
        </div>

        <blockquote class="sensory-note-quote">
          "{{ selectedPin.sensoryNote || 'No sensory notes provided.' }}"
        </blockquote>

        <div class="pin-meta">
          <p><strong>Contributed by:</strong> {{ selectedPin.author || 'Anonymous Explorer' }}</p>
          <p><strong>Logged on:</strong> {{ formattedPinDate }}</p>
          <p v-if="selectedPin.location?.geometry?.coordinates">
            <strong>Coordinates:</strong> [{{ selectedPin.location.geometry.coordinates[0].toFixed(4) }}, {{ selectedPin.location.geometry.coordinates[1].toFixed(4) }}]
          </p>
        </div>

        <div class="card-actions" style="margin-top: 0.5rem;">
          <button
            id="endorse-pin-btn"
            class="btn btn-primary"
            style="width: 100%;"
            @click="handleEndorse"
          >
            <span>✨ Feel This Vibe</span>
            <span id="endorsement-counter">(+{{ selectedPin.endorsements || 1 }})</span>
          </button>
        </div>
      </div>

      <!-- Mode 2: Submission Form -->
      <form v-else-if="mode === 'form'" id="new-vibe-form" class="vibe-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="form-place-name">Place / Street Name:</label>
          <input
            type="text"
            id="form-place-name"
            v-model="formPlaceName"
            required
          >
        </div>

        <div class="form-group">
          <label for="form-vibe-category">Dominant Sensory Vibe:</label>
          <select id="form-vibe-category" v-model="formVibeCategory" required>
            <option
              v-for="cat in Object.values(VIBE_CATEGORIES)"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.icon }} {{ cat.label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="form-energy-level">Energy Level (1 = Zen / Quiet, 5 = Electric / Chaotic):</label>
          <div class="form-range-wrapper">
            <input
              type="range"
              id="form-energy-level"
              min="1"
              max="5"
              step="1"
              v-model.number="formEnergyLevel"
            >
            <span id="range-indicator" style="font-family: var(--font-mono); font-weight: bold;">
              ⚡ {{ formEnergyLevel }}/5
            </span>
          </div>
        </div>

        <div class="form-group">
          <label for="form-sensory-note">Sensory Memory / What do you hear, smell, and see?:</label>
          <textarea
            id="form-sensory-note"
            rows="3"
            v-model="formSensoryNote"
            placeholder="e.g., Sizzling woks, scooters humming, neon reflection on wet pavement..."
            required
          ></textarea>
          <small class="form-help">Capture the unique atmosphere of this corner for other explorers.</small>
        </div>

        <div class="form-group">
          <label for="form-author-name">Contributor Name:</label>
          <input
            type="text"
            id="form-author-name"
            v-model="formAuthor"
            required
          >
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            id="submit-pin-btn"
            style="flex: 1;"
            :disabled="isSaving"
          >
            <span>🌐</span>
            <span>{{ isSaving ? 'Saving to Atlas...' : 'Share to Global Atlas' }}</span>
          </button>
          <button
            type="button"
            class="btn btn-secondary"
            id="cancel-form-btn"
            @click="emit('close')"
          >
            Cancel
          </button>
        </div>
      </form>

      <!-- Mode 3: Thank-You Confirmation -->
      <div v-else-if="mode === 'thank-you'" class="thank-you-view" style="text-align: center; padding: 1rem 0;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
        <h3 style="color: var(--color-primary); margin-bottom: 0.5rem;">Added to the Global Atlas!</h3>
        <p style="font-size: 0.9rem; color: #444; margin-bottom: 1rem;">
          Your observation for <strong>{{ savedPin?.placeName || 'this location' }}</strong> is now visible to everyone exploring the atlas.
        </p>
        <button id="close-thank-you-btn" class="btn btn-primary" style="margin: auto;" @click="emit('close')">
          Explore the Globe
        </button>
      </div>
    </div>
  </aside>
</template>
