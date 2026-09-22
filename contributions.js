/**
 * Helion contributions / leaderboard points
 */
const fs = require('fs');
const path = require('path');

const blob = require('./blobStore');

function load() {
  return blob.get('contributions.json', {});
}

function save(data) {
  blob.set('contributions.json', data);
}

function reload() {
  store = blob.get('contributions.json', store);
}

let store = load();

function ensure(username) {
  const k = String(username || '').toLowerCase();
  if (!store[k]) {
    store[k] = {
      username: k,
      stakeVolume: 0,
      tradeCount: 0,
      sendCount: 0,
      mineCount: 0,
      mineHistory: []
    };
  }
  return store[k];
}

function scoreOf(e) {
  return Math.floor((e.stakeVolume || 0) / 100) +
    (e.tradeCount || 0) +
    (e.sendCount || 0) * 0.1 +
    (e.mineCount || 0) * 5;
}

function addStakeVolume(username, amount) {
  const e = ensure(username);
  e.stakeVolume = (e.stakeVolume || 0) + (Number(amount) || 0);
  save(store);
}

function incrementTradeCount(username) {
  const e = ensure(username);
  e.tradeCount = (e.tradeCount || 0) + 1;
  save(store);
}

function incrementSendCount(username) {
  const e = ensure(username);
  e.sendCount = (e.sendCount || 0) + 1;
  save(store);
}

function incrementMineCount(username) {
  const e = ensure(username);
  e.mineCount = (e.mineCount || 0) + 1;
  save(store);
}

function addMineEvent(username, { type, txHash, note } = {}) {
  const e = ensure(username);
  if (!Array.isArray(e.mineHistory)) e.mineHistory = [];
  e.mineHistory.unshift({
    type: type || 'mine',
    txHash: txHash || null,
    note: note || null,
    ts: Date.now()
  });
  // keep last 50
  if (e.mineHistory.length > 50) e.mineHistory = e.mineHistory.slice(0, 50);
  e.mineCount = (e.mineCount || 0) + (type === 'activate' || type === 'claim' ? 0 : 0);
  // mineCount still updated by incrementMineCount for activate
  save(store);
  return e.mineHistory;
}

function getMineHistory(username, limit = 20) {
  const e = ensure(username);
  const list = Array.isArray(e.mineHistory) ? e.mineHistory : [];
  return list.slice(0, Math.min(50, Math.max(1, Number(limit) || 20)));
}

function getStats(username) {
  const e = ensure(username);
  return { ...e, score: scoreOf(e) };
}

function getLeaderboard(limit = 50) {
  return Object.values(store)
    .map(e => ({ ...e, score: scoreOf(e) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = {
  reload,
  addStakeVolume,
  incrementTradeCount,
  incrementSendCount,
  incrementMineCount,
  addMineEvent,
  getMineHistory,
  getStats,
  getLeaderboard
};
