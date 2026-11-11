/**
 * Module for fetching, filtering, and manipulating USGS Earthquakes data.
 */

// D3 may come in handy for things like binning or scaling.
import * as d3 from 'd3';

// URL for the USGS all earthquakes in the past 7 days GeoJSON feed
const DATA_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';

/**
 * Fetches the USGS earthquake GeoJSON feed for the past 7 days.
 *
 * @returns {Promise<Array<Object>>} Array of GeoJSON feature objects.
 */
async function fetchEarthquakes() {
  const data = await d3.json(DATA_URL);
  return data.features || [];
}

/**
 * Filters an array of earthquake features based on magnitude and depth constraints.
 *
 * @param {Array<Object>} earthquakes Array of GeoJSON feature objects.
 * @param {Object} filters Filter parameters.
 * @param {number} filters.minMag Minimum magnitude (inclusive).
 * @param {number} filters.minDepth Minimum depth in km (inclusive).
 * @param {number} filters.maxDepth Maximum depth in km (inclusive).
 * @returns {Array<Object>} Filtered array of earthquake features.
 */
function filterEarthquakes(earthquakes, filters = {}) {
  const minMag = filters.minMag ?? 0;
  const minDepth = filters.minDepth ?? 0;
  const maxDepth = filters.maxDepth ?? 700;

  return earthquakes.filter((eq) => {
    const mag = eq.properties.mag;
    const depth = eq.geometry.coordinates[2];
    return (
      mag >= minMag
      && depth >= minDepth
      && depth <= maxDepth
    );
  });
}

/**
 * Bins earthquakes by magnitude and depth to prepare data for a heatmap scatter plot.
 * Groups features into discrete bins and calculates the earthquake count in each bin.
 *
 * @param {Array<Object>} earthquakes Array of GeoJSON feature objects.
 * @param {number} [magBinCount=10] Number of magnitude bins.
 * @param {number} [depthBinCount=10] Number of depth bins in km.
 * @returns {{ depths: Array<number>, magnitudes: Array<number>, counts: Array<number>, maxCount: number }}
 */
function binEarthquakes(earthquakes, magBinCount = 10, depthBinCount = 10) {
  if (!earthquakes || earthquakes.length === 0) {
    return { magnitudes: [], depths: [], counts: [], maxCount: 0 };
  }

  // 1. Create an empty two-dimensional array
  const eqBins = [];
  for (let m = 0; m < magBinCount; m++) {
    eqBins[m] = [];
    for (let d = 0; d < depthBinCount; d++) {
      eqBins[m][d] = [];
    }
  }

  // 2. Figure out min and max values for each dimension
  const [magMin, magMax] = d3.extent(earthquakes, (eq) => eq.properties.mag);
  const [depthMin, depthMax] = d3.extent(earthquakes, (eq) => eq.geometry.coordinates[2]);

  // Handle case where all filtered items have identical mag or depth
  const effectiveMagMax = magMax === magMin ? magMin + 1 : magMax;
  const effectiveDepthMax = depthMax === depthMin ? depthMin + 1 : depthMax;

  // 3. Figure out the size of each dimension of our bins
  const magBinSize = (effectiveMagMax - magMin) / magBinCount;
  const depthBinSize = (effectiveDepthMax - depthMin) / depthBinCount;

  // 4. Loop over all of our earthquakes and assign each one to a bin
  for (const eq of earthquakes) {
    const mag = eq.properties.mag;
    const depth = eq.geometry.coordinates[2];

    const m = mag >= effectiveMagMax
      ? magBinCount - 1
      : Math.floor((mag - magMin) / magBinSize);
    const d = depth >= effectiveDepthMax
      ? depthBinCount - 1
      : Math.floor((depth - depthMin) / depthBinSize);

    if (eqBins[m] && eqBins[m][d]) {
      eqBins[m][d].push(eq);
    }
  }

  // 5. Figure out where our threshold values are for each dimension
  const magThresholds = [];
  for (let m = 0; m < magBinCount; m++) {
    magThresholds.push(m * magBinSize + magMin);
  }

  const depthThresholds = [];
  for (let d = 0; d < depthBinCount; d++) {
    depthThresholds.push(d * depthBinSize + depthMin);
  }

  // 6. Convert our bins to arrays
  const magnitudes = [];
  const depths = [];
  const counts = [];

  for (let m = 0; m < magBinCount; m++) {
    for (let d = 0; d < depthBinCount; d++) {
      const bin = eqBins[m][d];
      if (bin.length > 0) {
        magnitudes.push(magThresholds[m]);
        depths.push(depthThresholds[d]);
        counts.push(bin.length);
      }
    }
  }

  return {
    magnitudes,
    depths,
    counts,
    maxCount: counts.length > 0 ? Math.max(...counts) : 0,
  };
}

export {
  fetchEarthquakes,
  filterEarthquakes,
  binEarthquakes,
};

