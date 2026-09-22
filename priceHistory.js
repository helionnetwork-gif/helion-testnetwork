/**
 * Price & portfolio analytics history.
 * Samples HEL/USD + BNB/USD periodically for charts and 24h change.
 */
const blobStore = require('./blobStore');

const BLOB = 'price_history.json';
const MAX_POINTS = Number(process.env.PRICE_HISTORY_MAX || 20000); // ~14d @ 1min
const SAMPLE_MS = Number(process.env.PRICE_SAMPLE_MS || 60_000);

const RANGES = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
  '24h': 24 * 60 * 60_000,
  '7d': 7 * 24 * 60 * 60_000,
  '1w': 7 * 24 * 60 * 60_000,
  '30d': 30 * 24 * 60 * 60_000,
  '1M': 30 * 24 * 60 * 60_000,
  all: Infinity
};

function load() {
  const data = blobStore.get(BLOB, { points: [] });
  if (!Array.isArray(data.points)) data.points = [];
  return data;
}

function save(data) {
  blobStore.set(BLOB, data);
}

function pushSample({ helUsd, bnbUsd, helPerBnb, ts }) {
  const data = load();
  const t = ts || Date.now();
  const last = data.points[data.points.length - 1];
  // skip near-duplicates (< 20s)
  if (last && t - last.t < 20_000) return last;

  const point = {
    t,
    helUsd: Number(helUsd) || 0,
    bnbUsd: Number(bnbUsd) || 0,
    helPerBnb: Number(helPerBnb) || 0
  };
  data.points.push(point);
  if (data.points.length > MAX_POINTS) {
    data.points = data.points.slice(data.points.length - MAX_POINTS);
  }
  save(data);
  return point;
}

function getPoints(rangeKey) {
  const data = load();
  const ms = RANGES[rangeKey] != null ? RANGES[rangeKey] : RANGES['1d'];
  if (!data.points.length) return [];
  if (ms === Infinity) return data.points.slice();
  const from = Date.now() - ms;
  return data.points.filter((p) => p.t >= from);
}

/** Downsample to maxN points for chart */
function downsample(points, maxN = 300) {
  if (points.length <= maxN) return points;
  const step = points.length / maxN;
  const out = [];
  for (let i = 0; i < maxN; i++) {
    out.push(points[Math.min(points.length - 1, Math.floor(i * step))]);
  }
  // always include last
  if (out[out.length - 1] !== points[points.length - 1]) {
    out[out.length - 1] = points[points.length - 1];
  }
  return out;
}

function findNearest(points, targetTs) {
  if (!points.length) return null;
  let best = points[0];
  let bestD = Math.abs(points[0].t - targetTs);
  for (let i = 1; i < points.length; i++) {
    const d = Math.abs(points[i].t - targetTs);
    if (d < bestD) {
      best = points[i];
      bestD = d;
    }
  }
  return best;
}

function pointAtOrBefore(points, targetTs) {
  if (!points.length) return null;
  let best = null;
  for (const p of points) {
    if (p.t <= targetTs) best = p;
    else break;
  }
  return best || points[0];
}

/**
 * Portfolio mark-to-market using current holdings + price history.
 * balances: { HEL, BNB, USDC }
 */
function portfolioPerformance(balances, rangeKey = '24h') {
  const hel = Number(balances.HEL) || 0;
  const bnb = Number(balances.BNB) || 0;
  const usdc = Number(balances.USDC) || 0;

  const points = getPoints(rangeKey === '24h' ? '7d' : rangeKey); // need enough history
  const all = load().points;
  const latest = all.length ? all[all.length - 1] : null;

  const nowHel = latest ? latest.helUsd : 0;
  const nowBnb = latest ? latest.bnbUsd : 0;
  const valueNow = hel * nowHel + bnb * nowBnb + usdc;

  const ms = RANGES[rangeKey] != null ? RANGES[rangeKey] : RANGES['24h'];
  const pastTs = Date.now() - (ms === Infinity ? 365 * 24 * 60 * 60_000 : ms);
  const past = pointAtOrBefore(all, pastTs) || findNearest(all, pastTs);

  let valuePast = null;
  let changeUsd = null;
  let changePct = null;
  if (past) {
    valuePast = hel * past.helUsd + bnb * past.bnbUsd + usdc;
    changeUsd = valueNow - valuePast;
    changePct = valuePast > 0 ? (changeUsd / valuePast) * 100 : null;
  }

  return {
    range: rangeKey,
    holdings: { HEL: hel, BNB: bnb, USDC: usdc },
    pricesNow: { helUsd: nowHel, bnbUsd: nowBnb },
    pricesPast: past
      ? { helUsd: past.helUsd, bnbUsd: past.bnbUsd, t: past.t }
      : null,
    valueNow,
    valuePast,
    changeUsd,
    changePct,
    sampleCount: all.length,
    oldest: all[0]?.t || null,
    newest: latest?.t || null
  };
}

function chartSeries(rangeKey, maxPoints = 300) {
  const raw = getPoints(rangeKey);
  const pts = downsample(raw, maxPoints);
  return {
    range: rangeKey,
    count: pts.length,
    from: pts[0]?.t || null,
    to: pts[pts.length - 1]?.t || null,
    points: pts.map((p) => ({
      t: p.t,
      helUsd: p.helUsd,
      bnbUsd: p.bnbUsd,
      helPerBnb: p.helPerBnb
    }))
  };
}

function stats() {
  const all = load().points;
  return {
    samples: all.length,
    oldest: all[0]?.t || null,
    newest: all[all.length - 1]?.t || null,
    ranges: Object.keys(RANGES)
  };
}

module.exports = {
  pushSample,
  getPoints,
  chartSeries,
  portfolioPerformance,
  stats,
  RANGES,
  SAMPLE_MS
};
