/**
 * Mock book balances (not on-chain).
 * wallet USDC for testnet faucet + transfer to spot.
 */
const blob = require('./blobStore');

const FAUCET_USDC = Number(process.env.USDC_FAUCET_AMOUNT || 1000);
const FAUCET_COOLDOWN_MS = Number(process.env.USDC_FAUCET_COOLDOWN_MS || 0); // 0 = unlimited in testnet

function load() {
  return blob.get('balances.json', {});
}

function save(data) {
  blob.set('balances.json', data);
}

let store = load();

function reload() {
  store = blob.get('balances.json', store);
}

function norm(u) {
  return String(u || '').trim().toLowerCase();
}

function ensure(username) {
  const k = norm(username);
  if (!store[k]) {
    store[k] = { usdc: 0, lastFaucetAt: 0 };
    save(store);
  }
  if (store[k].usdc == null) store[k].usdc = 0;
  if (store[k].lastFaucetAt == null) store[k].lastFaucetAt = 0;
  return store[k];
}

function getUsdc(username) {
  return Number(ensure(username).usdc) || 0;
}

function setUsdc(username, amount) {
  const row = ensure(username);
  const n = Number(amount);
  if (!(n >= 0) || !Number.isFinite(n)) throw new Error('Invalid USDC amount');
  row.usdc = n;
  save(store);
  return row.usdc;
}

function creditUsdc(username, amount) {
  const a = Number(amount);
  if (!(a > 0)) throw new Error('creditUsdc: amount > 0');
  const row = ensure(username);
  row.usdc = (Number(row.usdc) || 0) + a;
  save(store);
  return row.usdc;
}

function debitUsdc(username, amount) {
  const a = Number(amount);
  if (!(a > 0)) throw new Error('debitUsdc: amount > 0');
  const row = ensure(username);
  const cur = Number(row.usdc) || 0;
  if (cur + 1e-12 < a) throw new Error('Insufficient wallet USDC');
  row.usdc = cur - a;
  save(store);
  return row.usdc;
}

/** @returns {{ ok: true, amount: number, usdc: number } | { ok: false, error: string }} */
function faucetUsdc(username) {
  const row = ensure(username);
  const now = Date.now();
  if (FAUCET_COOLDOWN_MS > 0 && row.lastFaucetAt && now - row.lastFaucetAt < FAUCET_COOLDOWN_MS) {
    const waitSec = Math.ceil((FAUCET_COOLDOWN_MS - (now - row.lastFaucetAt)) / 1000);
    return { ok: false, error: `Faucet cooldown: wait ${waitSec}s` };
  }
  row.usdc = (Number(row.usdc) || 0) + FAUCET_USDC;
  row.lastFaucetAt = now;
  save(store);
  return { ok: true, amount: FAUCET_USDC, usdc: row.usdc };
}

module.exports = {
  reload,
  FAUCET_USDC,
  getUsdc,
  setUsdc,
  creditUsdc,
  debitUsdc,
  faucetUsdc
};
