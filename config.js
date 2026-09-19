/**
 * Helion frontend config — ainoa paikka API-osoitteelle.
 * GitHub Pages (julkinen repo) → Render API (private server-repo).
 *
 * Local: default localhost:3001 (node server.js).
 * Override: window.HELION_BACKEND_URL before this script, or edit below.
 */
(function (global) {
  var host = global.location && global.location.hostname;
  var local = host === 'localhost' || host === '127.0.0.1';

  global.HELION_CONFIG = {
    BACKEND_URL:
      (global.HELION_BACKEND_URL) ||
      (local
        ? 'http://localhost:3001'
        : 'https://testnetworkserver.onrender.com')
  };
})(typeof window !== 'undefined' ? window : this);
