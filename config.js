/**
 * Helion frontend config — single place for API URL.
 *
 * Local (localhost / 127.0.0.1) → http://localhost:3001
 * GitHub Pages / production host → Render API
 *
 * Override before this script: window.HELION_BACKEND_URL = 'https://...'
 */
(function (global) {
  var host = (global.location && global.location.hostname) || '';
  var local = host === 'localhost' || host === '127.0.0.1' || host === '';

  global.HELION_CONFIG = {
    BACKEND_URL:
      global.HELION_BACKEND_URL ||
      (local
        ? 'http://localhost:3001'
        : 'https://testnetworkserver.onrender.com')
  };
})(typeof window !== 'undefined' ? window : this);
