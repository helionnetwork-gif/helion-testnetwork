/**
 * Local cache directory for file fallback when Upstash is not configured.
 * Production persistence = Upstash Redis (UPSTASH_REDIS_REST_URL + TOKEN).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function writable(dir) {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const probe = path.join(dir, '.helion-write');
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    return true;
  } catch (_) {
    return false;
  }
}

function resolveDir() {
  const wanted = (process.env.DATA_DIR || '').trim();
  const candidates = [];
  if (wanted) candidates.push(wanted);
  candidates.push(__dirname);
  candidates.push(path.join(os.tmpdir(), 'helion-data'));
  for (const d of candidates) {
    if (writable(d)) {
      if (wanted && path.resolve(d) !== path.resolve(wanted)) {
        console.warn('[dataDir] ' + wanted + ' ei kirjoitettavissa. Käytetään ' + d);
        console.warn('[dataDir] Poista DATA_DIR envistä Renderissä. Pysyvyys: Upstash Redis');
      }
      return d;
    }
  }
  return __dirname;
}

const DIR = resolveDir();

function dataFile(name) {
  return path.join(DIR, name);
}

module.exports = { DIR, dataFile };
