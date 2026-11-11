<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  userSettings: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['close', 'save-settings']);

const dialogRef = ref(null);
const authorInput = ref(props.userSettings.author || '');
const tokenInput = ref(props.userSettings.mapboxToken || '');
const styleInput = ref(props.userSettings.styleId || 'mapbox/dark-v11');

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      authorInput.value = props.userSettings.author || '';
      tokenInput.value = props.userSettings.mapboxToken || '';
      styleInput.value = props.userSettings.styleId || 'mapbox/dark-v11';
      dialogRef.value?.showModal();
    } else {
      dialogRef.value?.close();
    }
  }
);

function handleSubmit() {
  emit('save-settings', {
    author: authorInput.value.trim() || 'Anonymous Explorer',
    mapboxToken: tokenInput.value.trim(),
    styleId: styleInput.value,
  });
  emit('close');
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <dialog ref="dialogRef" class="settings-dialog" @cancel.prevent="handleClose">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>Instance & User Settings</h3>
        <button type="button" class="btn-close-dialog" @click="handleClose">✕</button>
      </div>

      <form class="settings-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="setting-author-input">Your Contributor Name / Persona:</label>
          <input
            type="text"
            id="setting-author-input"
            v-model="authorInput"
            placeholder="e.g., Transit Advocate, Food Lover"
            required
          >
          <small class="form-help">
            Saved in your browser's localStorage (Week 8) to attribute pins you submit.
          </small>
        </div>

        <div class="form-group">
          <label for="setting-token-input">Mapbox Access Token (Optional):</label>
          <input
            type="password"
            id="setting-token-input"
            v-model="tokenInput"
            placeholder="pk.eyJ1..."
          >
          <small class="form-help">
            Enter your public Mapbox token to render custom Mapbox styles via <code>process_mapbox.js</code> and use Mapbox Geocoding v6. If left empty, the globe automatically uses free open vector tiles!
          </small>
        </div>

        <div class="form-group">
          <label for="setting-style-select">Mapbox Vector Style:</label>
          <select id="setting-style-select" v-model="styleInput">
            <option value="mapbox/dark-v11">Mapbox Dark (mapbox/dark-v11)</option>
            <option value="mapbox/satellite-streets-v12">Mapbox Satellite (mapbox/satellite-streets-v12)</option>
            <option value="mapbox/streets-v12">Mapbox Streets (mapbox/streets-v12)</option>
            <option value="mapbox/light-v11">Mapbox Light (mapbox/light-v11)</option>
          </select>
          <small class="form-help">Processed via <code>processMapboxStyle()</code> when token is present.</small>
        </div>

        <div class="dialog-actions">
          <button type="submit" class="btn btn-primary" id="save-settings-btn">Save Settings</button>
          <button type="button" class="btn btn-secondary" id="cancel-settings-btn" @click="handleClose">Cancel</button>
        </div>
      </form>
    </div>
  </dialog>
</template>
