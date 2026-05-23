/**
 * localStorage wrapper for settings persistence
 */

const STORAGE_KEY = 'pulse_ai_settings';

const DEFAULTS = {
  errorRateThreshold: 10,
  latencyThreshold: 2000,
  uptimeSLA: 99.9,
  channels: {
    discord: true,
    slack: false,
    email: true,
    pagerduty: false
  },
  notifications: {
    critical: true,
    warning: true,
    recovery: true,
    autoRCA: true
  },
  monitoredEndpoints: [
    '/api/orders/checkout',
    '/api/auth/verify',
    '/api/products/search',
    '/api/payments/process',
    '/api/users/profile',
    '/api/webhooks/stripe'
  ],
  refreshInterval: 3,
  theme: 'dark'
};

/**
 * Load all settings, merging with defaults.
 * @returns {object}
 */
export function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULTS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
  return { ...DEFAULTS };
}

/**
 * Save a specific setting.
 * @param {string} key
 * @param {any} value
 */
export function saveSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

/**
 * Save all settings at once.
 * @param {object} settings
 */
export function saveAllSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

/**
 * Reset settings to defaults.
 */
export function resetSettings() {
  localStorage.removeItem(STORAGE_KEY);
  return { ...DEFAULTS };
}

export { DEFAULTS };
