/**
 * JSON blob persistence.
 * Local files by default; if Upstash Redis REST is configured, also load/save there.
 * Survives Render deploys without a paid disk (no MongoDB needed).
 *
 * Env:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 * Optional:
 *   UPSTASH_PREFIX=helion   (key prefix)
 */
const fs = require('fs');
const { dataFile, DIR } = require('./dataDir');

const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL || '').trim().replace(/\/$/, '');
const UPSTASH_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
const PREFIX = (process.env.UPSTASH_PREFIX || 'helion').trim() || 'helion';

const cache = Object.create(null);
let remoteOk = false;
let ready = false;
let saveQueue = Promise.resolve();

function blobKey(name) {
  return PREFIX + ':blob:' + name;
}

function indexKey() {
  return PREFIX + ':blobs';
}

function readFile(name) {
  const p = dataFile(name);
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn('[blobStore] luku epäonnistui', name, e.message);
  }
  return null;
}

function writeFile(name, data) {
  try {
    fs.writeFileSync(dataFile(name), JSON.stringify(data, null, 2));
  } catch (e) {
    console.warn('[blobStore] kirjoitus epäonnistui', name, e.message);
  }
}

function get(name, fallback) {
  if (Object.prototype.hasOwnProperty.call(cache, name)) return cache[name];
  const fromDisk = readFile(name);
  cache[name] = fromDisk == null ? (fallback !== undefined ? fallback : {}) : fromDisk;
  return cache[name];
}

function set(name, data) {
  cache[name] = data;
  writeFile(name, data);
  if (!remoteOk) return;
  const payload = JSON.stringify(data);
  saveQueue = saveQueue
    .then(async () => {
      await upstash(['SET', blobKey(name), payload]);
      await upstash(['SADD', indexKey(), name]);
    })
    .catch((e) => {
      console.warn('[blobStore] upstash save', name, e.message);
    });
}

async function upstash(command) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    throw new Error('Upstash env puuttuu');
  }
  const res = await fetch(UPSTASH_URL, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + UPSTASH_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(command)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body.error || body.message || res.statusText || String(res.status);
    throw new Error(msg);
  }
  if (body.error) throw new Error(body.error);
  return body.result;
}

async function init() {
  if (ready) return { backend: remoteOk ? 'upstash' : 'file', dir: DIR };

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    ready = true;
    remoteOk = false;
    console.log(
      '[blobStore] tiedostot:',
      DIR,
      '(Render pyyhkii nämä restartissa — aseta UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)'
    );
    return { backend: 'file', dir: DIR };
  }

  try {
    // Connectivity check
    await upstash(['PING']);

    const names = (await upstash(['SMEMBERS', indexKey()])) || [];
    const list = Array.isArray(names) ? names : [];
    for (const name of list) {
      if (!name) continue;
      const raw = await upstash(['GET', blobKey(name)]);
      if (raw == null || raw === '') continue;
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        cache[name] = data;
        writeFile(name, data);
      } catch (e) {
        console.warn('[blobStore] upstash parse', name, e.message);
      }
    }

    remoteOk = true;
    ready = true;
    console.log(
      '[blobStore] Upstash Redis ok, blobit:',
      list.join(', ') || '(tyhjä)'
    );
    return { backend: 'upstash', dir: DIR, count: list.length };
  } catch (e) {
    const msg = e && e.message ? e.message : String(e);
    console.error('[blobStore] Upstash-yhteys epäonnistui:', msg);
    console.error('[blobStore] Tarkista UPSTASH_REDIS_REST_URL ja UPSTASH_REDIS_REST_TOKEN');
    remoteOk = false;
    ready = true;
    console.warn('[blobStore] Jatketaan tiedostoilla:', DIR);
    return { backend: 'file', dir: DIR, upstashError: msg };
  }
}

function backend() {
  return remoteOk ? 'upstash' : 'file';
}

module.exports = { get, set, init, backend, DIR };
