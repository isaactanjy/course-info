/**
 * Client-Side Persistence with localStorage
 *
 * Persists user-specific settings so that reloading the browser retains:
 * 1. The contributor's name/handle
 * 2. The active vibe filter
 * 3. The optional Mapbox access token and preferred style ID
 */

const STORAGE_KEYS = {
  AUTHOR: 'vibe-atlas-author',
  FILTER: 'vibe-atlas-filter',
  MAPBOX_TOKEN: 'vibe-atlas-mapbox-token',
  MAPBOX_STYLE: 'vibe-atlas-style-id',
};

export const UserStorage = {
  getAuthor(defaultHandle = 'Anonymous Explorer') {
    return localStorage.getItem(STORAGE_KEYS.AUTHOR) || defaultHandle;
  },

  setAuthor(name) {
    if (name && name.trim()) {
      localStorage.setItem(STORAGE_KEYS.AUTHOR, name.trim());
    }
  },

  getFilter(defaultFilter = 'all') {
    return localStorage.getItem(STORAGE_KEYS.FILTER) || defaultFilter;
  },

  setFilter(filter) {
    if (filter) {
      localStorage.setItem(STORAGE_KEYS.FILTER, filter);
    }
  },

  getMapboxToken(fallbackToken = '') {
    return (localStorage.getItem(STORAGE_KEYS.MAPBOX_TOKEN) || fallbackToken || '').trim();
  },

  setMapboxToken(token) {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.MAPBOX_TOKEN, token.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.MAPBOX_TOKEN);
    }
  },

  getStyleId(defaultStyle = 'mapbox/dark-v11') {
    return localStorage.getItem(STORAGE_KEYS.MAPBOX_STYLE) || defaultStyle;
  },

  setStyleId(styleId) {
    if (styleId) {
      localStorage.setItem(STORAGE_KEYS.MAPBOX_STYLE, styleId.trim());
    }
  },
};
