/**
 * JSON blob persistence.
 * Local files by default; if MONGODB_URI is set, load/save to Atlas (free M0).
 * Render + Node 24 often fails Atlas TLS (alert 80) unless we force IPv4 / Node 20.
 */
const fs = require('fs');
const { dataFile, DIR } = require('./dataDir');

const URI = process.env.MONGODB_URI || process.env.MONGO_URL || '';
const DB_NAME = process.env.MONGODB_DB || 'helion';
const COLL = 'blobs';

const cache = Object.create(null);
let col = null;
let ready = false;
let saveQueue = Promise.resolve();

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
  if (!col) return;
  saveQueue = saveQueue.then(async () => {
    await col.updateOne(
      { _id: name },
      { $set: { data, updatedAt: new Date() } },
      { upsert: true }
    );
  }).catch((e) => {
    console.warn('[blobStore] mongo save', name, e.message);
  });
}

function shortErr(e) {
  const m = String((e && e.message) || e || '');
  if (/tlsv1 alert internal error|SSL alert number 80/i.test(m)) {
    return 'Atlas TLS/IPv6 (alert 80). Aseta Renderiin NODE_VERSION=20 ja Atlas Network Access 0.0.0.0/0';
  }
  return m.slice(0, 240);
}

async function tryConnect(MongoClient, opts) {
  const client = new MongoClient(URI, opts);
  await client.connect();
  await client.db(DB_NAME).command({ ping: 1 });
  return client;
}

async function init() {
  if (ready) return { backend: col ? 'mongodb' : 'file', dir: DIR };
  if (!URI) {
    ready = true;
    console.log('[blobStore] tiedostot:', DIR, '(Render pyyhkii nämä — aseta MONGODB_URI)');
    return { backend: 'file', dir: DIR };
  }

  try {
    const { MongoClient } = require('mongodb');
    const attempts = [
      {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        family: 4,
        tls: true
      },
      {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        family: 4,
        tls: true,
        tlsAllowInvalidCertificates: true
      }
    ];

    let client = null;
    let last = null;
    for (const opts of attempts) {
      try {
        client = await tryConnect(MongoClient, opts);
        break;
      } catch (e) {
        last = e;
        console.warn('[blobStore] mongo yritys epäonnistui:', shortErr(e));
      }
    }
    if (!client) throw last || new Error('Mongo connect failed');

    col = client.db(DB_NAME).collection(COLL);
    const docs = await col.find({}).toArray();
    for (const d of docs) {
      if (d && d._id && d.data != null) {
        cache[d._id] = d.data;
        writeFile(d._id, d.data);
      }
    }
    ready = true;
    console.log('[blobStore] MongoDB ok, blobit:', docs.map((d) => d._id).join(', ') || '(tyhjä)');
    return { backend: 'mongodb', dir: DIR, count: docs.length };
  } catch (e) {
    ready = true;
    col = null;
    console.error('[blobStore] Mongo ei käytössä:', shortErr(e));
    console.error('[blobStore] Rekisteröinti toimii, mutta tilit katoavat restartissa kunnes Mongo toimii.');
    return { backend: 'file', dir: DIR, error: shortErr(e) };
  }
}

function backend() {
  return col ? 'mongodb' : 'file';
}

module.exports = { get, set, init, backend, DIR };
