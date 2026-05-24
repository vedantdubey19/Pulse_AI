/**
 * Simple reactive state store (pub/sub pattern).
 */

const state = {
  currentView: 'dashboard',
  incidentsCount: 3,
  testRunning: false,
  incidents: [],
  metrics: {},
  anomalies: [],
  chatOpen: false,
  commandPaletteOpen: false,
  sidebarOpen: false
};

const listeners = new Map();

/**
 * Get the current state value.
 * @param {string} key
 * @returns {any}
 */
export function getState(key) {
  return state[key];
}

/**
 * Get the full state object (read-only copy).
 * @returns {object}
 */
export function getFullState() {
  return { ...state };
}

/**
 * Set a state value and notify subscribers.
 * @param {string} key
 * @param {any} value
 */
export function setState(key, value) {
  const prev = state[key];
  state[key] = value;

  if (listeners.has(key)) {
    for (const fn of listeners.get(key)) {
      fn(value, prev);
    }
  }
}

/**
 * Subscribe to state changes for a specific key.
 * @param {string} key
 * @param {(newVal: any, prevVal: any) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribe(key, callback) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }
  listeners.get(key).add(callback);

  return () => {
    listeners.get(key).delete(callback);
  };
}

/**
 * Batch multiple state updates, notifying once per key.
 * @param {Record<string, any>} updates
 */
export function batchUpdate(updates) {
  for (const [key, value] of Object.entries(updates)) {
    setState(key, value);
  }
}
