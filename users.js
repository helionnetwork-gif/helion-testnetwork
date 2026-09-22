/**
 * Helion users — register/login + email verify + PIN + linked wallets
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const blob = require('./blobStore');

const VERIFY_TTL_MS = Number(process.env.EMAIL_VERIFY_TTL_MS || 24 * 60 * 60 * 1000);

function load() {
  return blob.get('users.json', {});
}

function save(data) {
  blob.set('users.json', data);
}

function reload() {
  store = blob.get('users.json', store);
}

let store = load();

function norm(u) {
  return String(u || '').trim().toLowerCase();
}

function normEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(e));
}

function usernameExists(username) {
  return !!store[norm(username)];
}

function emailTaken(email, exceptUsername) {
  const em = normEmail(email);
  if (!em) return false;
  const except = exceptUsername ? norm(exceptUsername) : null;
  for (const [k, u] of Object.entries(store)) {
    if (except && k === except) continue;
    if (normEmail(u.email) === em) return true;
  }
  return false;
}

function makeVerifyToken() {
  return crypto.randomBytes(3).toString('hex');
}

function isLegacyVerified(u) {
  if (!u) return false;
  if (u.emailVerified === true) return true;
  if (!u.email && u.passwordHash && u.createdAt) return true;
  return false;
}

/**
 * New registrations require email. Account starts unverified (24h).
 */
async function register(username, password, custodialAddress, email) {
  const key = norm(username);
  const em = normEmail(email);
  if (!key || !password) return { ok: false, error: 'username ja password vaaditaan' };
  if (!em || !isValidEmail(em)) return { ok: false, error: 'Kelvollinen sähköposti vaaditaan' };
  if (store[key]) return { ok: false, error: 'Käyttäjänimi on jo varattu.' };
  if (emailTaken(em)) return { ok: false, error: 'Sähköposti on jo käytössä.' };

  const hash = await bcrypt.hash(password, 10);
  const token = makeVerifyToken();
  const expiresAt = Date.now() + VERIFY_TTL_MS;

  store[key] = {
    username: key,
    passwordHash: hash,
    email: em,
    emailVerified: false,
    verifyToken: token,
    verifyExpiresAt: expiresAt,
    pinHash: null,
    walletAddress: custodialAddress || null,
    linkedWallets: [],
    createdAt: Date.now()
  };
  save(store);
  return {
    ok: true,
    username: key,
    walletAddress: custodialAddress || null,
    email: em,
    emailVerified: false,
    verifyToken: token,
    verifyExpiresAt: expiresAt
  };
}

async function verifyLogin(username, password) {
  const key = norm(username);
  const u = store[key];
  if (!u) return { ok: false, error: 'Virheellinen tunnus tai salasana' };

  if (!isLegacyVerified(u) && u.emailVerified !== true) {
    if (u.verifyExpiresAt && Date.now() > u.verifyExpiresAt) {
      return { ok: false, error: 'Vahvistus vanhentui. Rekisteröidy uudelleen.', code: 'VERIFY_EXPIRED' };
    }
    return {
      ok: false,
      error: 'Vahvista sähköposti ennen kirjautumista.',
      code: 'EMAIL_NOT_VERIFIED',
      email: u.email || null
    };
  }

  const ok = await bcrypt.compare(password, u.passwordHash || '');
  if (!ok) return { ok: false, error: 'Virheellinen tunnus tai salasana' };
  return {
    ok: true,
    username: key,
    walletAddress: u.walletAddress || null,
    emailVerified: true,
    hasPin: !!u.pinHash
  };
}

async function verifyLoginPin(username, pin) {
  const key = norm(username);
  const u = store[key];
  if (!u || !u.pinHash) return { ok: false, error: 'PIN ei ole käytössä' };
  if (!isLegacyVerified(u) && u.emailVerified !== true) {
    return { ok: false, error: 'Vahvista sähköposti ennen kirjautumista.', code: 'EMAIL_NOT_VERIFIED' };
  }
  const pinStr = String(pin || '').replace(/\D/g, '');
  if (pinStr.length < 4 || pinStr.length > 8) return { ok: false, error: 'Virheellinen PIN' };
  const ok = await bcrypt.compare(pinStr, u.pinHash);
  if (!ok) return { ok: false, error: 'Virheellinen PIN' };
  return {
    ok: true,
    username: key,
    walletAddress: u.walletAddress || null,
    emailVerified: true,
    hasPin: true
  };
}

function verifyEmailToken(token) {
  // Always re-read from blob (Upstash/file) so multi-instance / restart stays in sync
  try { reload(); } catch (_) {}
  const t = String(token || '').trim().toLowerCase();
  if (!t) return { ok: false, error: 'Token puuttuu' };
  for (const [k, u] of Object.entries(store)) {
    if (!u.verifyToken) continue;
    if (String(u.verifyToken).toLowerCase() !== t) continue;
    if (u.verifyExpiresAt && Date.now() > u.verifyExpiresAt) {
      return { ok: false, error: 'Vahvistuslinkki vanhentui. Rekisteröidy uudelleen.', code: 'VERIFY_EXPIRED', username: k };
    }
    u.emailVerified = true;
    u.verifyToken = null;
    u.verifyExpiresAt = null;
    u.verifiedAt = Date.now();
    save(store);
    return { ok: true, username: k, email: u.email };
  }
  return { ok: false, error: 'Virheellinen tai käytetty vahvistuskoodi' };
}

function resendVerification(username) {
  const key = norm(username);
  const u = store[key];
  if (!u) return { ok: false, error: 'Käyttäjää ei löydy' };
  if (u.emailVerified) return { ok: false, error: 'Sähköposti on jo vahvistettu' };
  if (!u.email) return { ok: false, error: 'Sähköpostia ei ole' };
  const token = makeVerifyToken();
  u.verifyToken = token;
  u.verifyExpiresAt = Date.now() + VERIFY_TTL_MS;
  save(store);
  return {
    ok: true,
    username: key,
    email: u.email,
    verifyToken: token,
    verifyExpiresAt: u.verifyExpiresAt
  };
}

async function setPin(username, pin) {
  const key = norm(username);
  const u = store[key];
  if (!u) return { ok: false, error: 'Käyttäjää ei löydy' };
  if (!isLegacyVerified(u) && u.emailVerified !== true) {
    return { ok: false, error: 'Vahvista sähköposti ensin' };
  }
  const pinStr = String(pin || '').replace(/\D/g, '');
  if (pinStr.length < 4 || pinStr.length > 8) {
    return { ok: false, error: 'PIN: 4–8 numeroa' };
  }
  u.pinHash = await bcrypt.hash(pinStr, 10);
  u.pinUpdatedAt = Date.now();
  save(store);
  return { ok: true };
}

async function clearPin(username, password) {
  const key = norm(username);
  const u = store[key];
  if (!u) return { ok: false, error: 'Käyttäjää ei löydy' };
  const ok = await bcrypt.compare(password || '', u.passwordHash || '');
  if (!ok) return { ok: false, error: 'Virheellinen salasana' };
  u.pinHash = null;
  save(store);
  return { ok: true };
}

function purgeExpiredUnverified() {
  let removed = 0;
  const now = Date.now();
  for (const [k, u] of Object.entries(store)) {
    if (u.emailVerified === true) continue;
    if (isLegacyVerified(u) && !u.email) continue;
    if (u.emailVerified === false && u.verifyExpiresAt && now > u.verifyExpiresAt) {
      delete store[k];
      removed++;
    }
  }
  if (removed) save(store);
  return removed;
}

function getPublicProfile(username) {
  const u = store[norm(username)];
  if (!u) return null;
  return {
    username: norm(username),
    emailVerified: isLegacyVerified(u) || u.emailVerified === true,
    hasPin: !!u.pinHash,
    hasEmail: !!u.email
  };
}

function getWalletAddress(username) {
  const u = store[norm(username)];
  return u ? u.walletAddress : null;
}

function setWalletAddress(username, address) {
  const key = norm(username);
  if (!store[key]) return;
  store[key].walletAddress = address;
  save(store);
}

function linkWallet(username, address) {
  const key = norm(username);
  const addr = String(address || '').toLowerCase();
  if (!store[key]) return { error: 'Käyttäjää ei löydy' };
  if (!/^0x[a-f0-9]{40}$/.test(addr)) return { error: 'Virheellinen osoite' };
  for (const [k, u] of Object.entries(store)) {
    if ((u.linkedWallets || []).includes(addr) && k !== key) {
      return { error: 'Lompakko on jo linkitetty toiseen tiliin' };
    }
  }
  if (!store[key].linkedWallets) store[key].linkedWallets = [];
  if (!store[key].linkedWallets.includes(addr)) {
    store[key].linkedWallets.push(addr);
    save(store);
  }
  return { ok: true, wallets: store[key].linkedWallets };
}

function getLinkedWallets(username) {
  const u = store[norm(username)];
  return u ? (u.linkedWallets || []) : [];
}

function getUsernameByLinkedWallet(address) {
  const addr = String(address || '').toLowerCase();
  for (const [k, u] of Object.entries(store)) {
    if ((u.linkedWallets || []).includes(addr)) return k;
    if (u.walletAddress && String(u.walletAddress).toLowerCase() === addr) return k;
  }
  return null;
}

function isInternalAddress(address) {
  const addr = String(address || '').toLowerCase();
  for (const u of Object.values(store)) {
    if (u.walletAddress && String(u.walletAddress).toLowerCase() === addr) return true;
  }
  return false;
}

function resolveUsernameByAddress(address) {
  const addr = String(address || '').toLowerCase();
  for (const [k, u] of Object.entries(store)) {
    if (u.walletAddress && String(u.walletAddress).toLowerCase() === addr) return k;
  }
  return null;
}

module.exports = {
  reload,
  usernameExists,
  emailTaken,
  isValidEmail,
  register,
  verifyLogin,
  verifyLoginPin,
  verifyEmailToken,
  resendVerification,
  setPin,
  clearPin,
  purgeExpiredUnverified,
  getPublicProfile,
  getWalletAddress,
  setWalletAddress,
  linkWallet,
  getLinkedWallets,
  getUsernameByLinkedWallet,
  isInternalAddress,
  resolveUsernameByAddress,
  VERIFY_TTL_MS
};
