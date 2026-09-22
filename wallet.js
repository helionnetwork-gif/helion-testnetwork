// wallet.js — käyttäjäkohtaisten lompakkojen hallinta web-backendille.
// Sama periaate kuin Telegram-botin wallet.js:ssä: yksityisavain salataan
// AES-256-GCM:llä ennen levylle tallentamista.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ethers } = require('ethers');

const blob = require('./blobStore');
const SECRET = process.env.WALLET_ENCRYPTION_SECRET;

if (!SECRET || SECRET.length < 16) {
  throw new Error('WALLET_ENCRYPTION_SECRET puuttuu tai on liian lyhyt (.env, väh. 16 merkkiä).');
}

const KEY = crypto.createHash('sha256').update(SECRET).digest();

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('hex');
}

function decrypt(hex) {
  const buf = Buffer.from(hex, 'hex');
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

function loadStore() {
  return blob.get('wallets.json', {});
}
function saveStore(s) { blob.set('wallets.json', s); }

let store = loadStore();

function reload() {
  store = blob.get('wallets.json', store);
}


// Sama normalisointi kuin users.js:ssä → avaimet aina pienillä kirjaimilla
function normalizeKey(userId) {
  return String(userId).trim().toLowerCase();
}

function getOrCreateWallet(userId) {
  const key = normalizeKey(userId);
  if (store[key]) return { address: store[key].address, isNew: false };
  const wallet = ethers.Wallet.createRandom();
  store[key] = { address: wallet.address, encryptedKey: encrypt(wallet.privateKey), createdAt: Date.now() };
  saveStore(store);
  return { address: wallet.address, isNew: true };
}

function getSigner(userId, provider) {
  const key = normalizeKey(userId);
  if (!store[key]) throw new Error('Lompakkoa ei löydy. Käyttäjällä ei ole custodial-lompakkoa (wallets.json).');
  return new ethers.Wallet(decrypt(store[key].encryptedKey), provider);
}

module.exports = { getOrCreateWallet, getSigner, reload };
