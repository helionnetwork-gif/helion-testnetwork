/**
 * Helion frontend config — ainoa paikka API-osoitteelle.
 * GitHub Pages (julkinen repo) → Render API (private server-repo).
 */
(function (global) {
  var host = global.location && global.location.hostname;
  var local = host === 'localhost' || host === '127.0.0.1';

  global.HELION_CONFIG = {
    /** Tyhjä string = sama origin (jos joskus hostaat HTML:n Renderissä) */
    BACKEND_URL: local
      ? 'http://localhost:3001'
      : 'https://testnetworkserver.onrender.com'
  };

  /** GitHub Pages: /repo ilman /-loppuja rikkoo suhteelliset polut */
  try {
    var p = global.location.pathname;
    if (p && !p.endsWith('/') && !/\.html?$/i.test(p)) {
      global.location.replace(p + '/' + global.location.search + global.location.hash);
    }
  } catch (_) {}
})(typeof window !== 'undefined' ? window : this);
