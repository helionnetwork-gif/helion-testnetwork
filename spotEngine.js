/**
 * Helion Spot — HEL/BNB order book on top of the AMM pool.
 * Quote asset = BNB. Base = HEL. Price = BNB per HEL.
 * C2C matches the book; leftover market (and aggressive limits) fill vs pool.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const blob = require('./blobStore');
const QUOTE = String(process.env.SPOT_QUOTE || 'USDC').toUpperCase() === 'BNB' ? 'BNB' : 'USDC';
const SYMBOL = QUOTE === 'BNB' ? 'HELBNB' : 'HELUSDC';
const MAKER_FEE = Number(process.env.SPOT_MAKER_FEE || 0.0008);
const TAKER_FEE = Number(process.env.SPOT_TAKER_FEE || 0.001);
const FEE_USER = normEnvUser(process.env.SPOT_FEE_USER || 'spotfees');
const INITIAL = {
  BNB: Number(process.env.SPOT_START_BNB || 0),
  HEL: Number(process.env.SPOT_START_HEL || 0)
};
const EPS = 1e-8;
const DEFAULT_MID = Number(process.env.SPOT_USDC_MID || process.env.SPOT_MID || 0.01);

function qGet(acc) {
  return QUOTE === 'USDC' ? (Number(acc.USDC) || 0) : (Number(acc.BNB) || 0);
}
function qGetLocked(acc) {
  return QUOTE === 'USDC' ? (Number(acc.USDC_LOCKED) || 0) : (Number(acc.BNB_LOCKED) || 0);
}
function qAdd(acc, n) {
  n = Number(n) || 0;
  if (QUOTE === 'USDC') acc.USDC = (Number(acc.USDC) || 0) + n;
  else acc.BNB = (Number(acc.BNB) || 0) + n;
}
function qAddLocked(acc, n) {
  n = Number(n) || 0;
  if (QUOTE === 'USDC') acc.USDC_LOCKED = (Number(acc.USDC_LOCKED) || 0) + n;
  else acc.BNB_LOCKED = (Number(acc.BNB_LOCKED) || 0) + n;
}


function normEnvUser(u) {
  return String(u || 'spotfees').trim().toLowerCase();
}

function emptyStore() {
  return {
    accounts: {},
    bids: [],
    asks: [],
    trades: [],
    stops: [],
    feeStats: { bnbCollected: 0, tradeCount: 0, updatedAt: 0 }
  };
}

function load() {
  return blob.get('spotEngine.json', emptyStore());
}

function save() {
  blob.set('spotEngine.json', store);
}

function reload() {
  const n = blob.get('spotEngine.json', store);
  store.accounts = n.accounts || {};
  store.bids = n.bids || [];
  store.asks = n.asks || [];
  store.trades = n.trades || [];
  store.stops = n.stops || [];
  store.feeStats = n.feeStats || { bnbCollected: 0, tradeCount: 0, updatedAt: 0 };
}

let store = load();
if (!store.accounts) store.accounts = {};
if (!store.bids) store.bids = [];
if (!store.asks) store.asks = [];
if (!store.trades) store.trades = [];
if (!store.stops) store.stops = [];
if (!store.feeStats) store.feeStats = { bnbCollected: 0, tradeCount: 0, updatedAt: 0 };

const id = () => crypto.randomBytes(8).toString('hex');
const norm = (u) => String(u || '').trim().toLowerCase();

function migrateAccount(a) {
  if (a.HEL == null && a.BTC != null) {
    a.HEL = 0;
    a.BNB = 0;
    a.HEL_LOCKED = 0;
    a.BNB_LOCKED = 0;
  }
  a.HEL = a.HEL || 0;
  a.BNB = a.BNB || 0;
  a.HEL_LOCKED = a.HEL_LOCKED || 0;
  a.BNB_LOCKED = a.BNB_LOCKED || 0;
  a.USDC = a.USDC || 0;
  a.USDC_LOCKED = a.USDC_LOCKED || 0;
  return a;
}

function ensureAccount(username) {
  const k = norm(username);
  if (!store.accounts[k]) {
    store.accounts[k] = {
      HEL: INITIAL.HEL,
      BNB: INITIAL.BNB,
      HEL_LOCKED: 0,
      BNB_LOCKED: 0,
      USDC: 0,
      USDC_LOCKED: 0,
      createdAt: Date.now()
    };
    save();
  }
  return migrateAccount(store.accounts[k]);
}

function balances(username) {
  const a = ensureAccount(username);
  return {
    HEL: a.HEL,
    BNB: a.BNB,
    HEL_LOCKED: a.HEL_LOCKED,
    BNB_LOCKED: a.BNB_LOCKED,
    USDC: a.USDC || 0,
    USDC_LOCKED: a.USDC_LOCKED || 0
  };
}

function equity(bal, px) {
  const p = Number(px) || 0;
  const q = QUOTE === 'USDC'
    ? (bal.USDC || 0) + (bal.USDC_LOCKED || 0)
    : (bal.BNB || 0) + (bal.BNB_LOCKED || 0);
  return q + ((bal.HEL || 0) + (bal.HEL_LOCKED || 0)) * p;
}

function sortBooks() {
  store.bids.sort((a, b) => b.price - a.price || a.ts - b.ts);
  store.asks.sort((a, b) => a.price - b.price || a.ts - b.ts);
}

function getOrderBook(depth = 20) {
  return {
    symbol: SYMBOL,
    bids: store.bids.slice(0, depth).map(o => ({ price: o.price, quantity: o.qty, id: o.id })),
    asks: store.asks.slice(0, depth).map(o => ({ price: o.price, quantity: o.qty, id: o.id }))
  };
}

function userTrades(username, limit = 50) {
  const k = norm(username);
  return store.trades.filter(t => t.buyer === k || t.seller === k).slice(-limit).reverse();
}

function recentTrades(limit = 40) {
  return store.trades.slice(-limit).reverse();
}

function clampAcc(a) {
  if (!a) return a;
  a.HEL = Math.max(0, Number(a.HEL) || 0);
  a.BNB = Math.max(0, Number(a.BNB) || 0);
  a.HEL_LOCKED = Math.max(0, Number(a.HEL_LOCKED) || 0);
  a.BNB_LOCKED = Math.max(0, Number(a.BNB_LOCKED) || 0);
  a.USDC = Math.max(0, Number(a.USDC) || 0);
  a.USDC_LOCKED = Math.max(0, Number(a.USDC_LOCKED) || 0);
  return a;
}

/**
 * Book fill. Returns trade or null if balances cannot support the fill
 * (caller must not mutate order qty in that case).
 */
function settleFill(buyerKey, sellerKey, qty, price, takerSide) {
  const buyer = store.accounts[buyerKey];
  const seller = store.accounts[sellerKey];
  if (!buyer || !seller) return null;

  const quote = qty * price;
  const buyFee = quote * (takerSide === 'BUY' ? TAKER_FEE : MAKER_FEE);
  const sellFee = quote * (takerSide === 'SELL' ? TAKER_FEE : MAKER_FEE);
  const pay = quote + buyFee;

  const buyerAvail = qGetLocked(buyer) + qGet(buyer);
  if (buyerAvail + 1e-15 < pay) return null;
  if ((seller.HEL_LOCKED || 0) + 1e-15 < qty) return null;

  if (qGetLocked(buyer) >= pay) {
    qAddLocked(buyer, -pay);
  } else {
    const extra = pay - qGetLocked(buyer);
    if (QUOTE === 'USDC') buyer.USDC_LOCKED = 0;
    else buyer.BNB_LOCKED = 0;
    qAdd(buyer, -extra);
  }
  buyer.HEL += qty;

  seller.HEL_LOCKED -= qty;
  qAdd(seller, quote - sellFee);

  clampAcc(buyer);
  clampAcc(seller);

  const fees = buyFee + sellFee;
  if (fees > 0) creditFees(fees);

  const trade = {
    id: id(),
    time: Date.now(),
    symbol: SYMBOL,
    price,
    quantity: qty,
    quote,
    buyer: buyerKey,
    seller: sellerKey,
    takerSide,
    buyFee,
    sellFee,
    venue: sellerKey === 'pool' || buyerKey === 'pool' ? 'pool' : 'book'
  };
  store.trades.push(trade);
  if (store.trades.length > 500) store.trades = store.trades.slice(-500);
  return trade;
}

/** Credit spot trading fees (BNB) to the fee-collector account. */
function creditFees(amount) {
  const amt = Number(amount) || 0;
  if (amt <= 0) return;
  const feeAcc = ensureAccount(FEE_USER);
  qAdd(feeAcc, amt);
  clampAcc(feeAcc);
  store.feeStats.bnbCollected = (store.feeStats.bnbCollected || 0) + (QUOTE === 'BNB' ? amt : 0);
  store.feeStats.usdcCollected = (store.feeStats.usdcCollected || 0) + (QUOTE === 'USDC' ? amt : 0);
  store.feeStats.tradeCount = (store.feeStats.tradeCount || 0) + 1;
  store.feeStats.updatedAt = Date.now();
}

function getFeeStats() {
  const bal = balances(FEE_USER);
  return {
    feeUser: FEE_USER,
    bnbCollected: store.feeStats.bnbCollected || 0,
    tradeCount: store.feeStats.tradeCount || 0,
    updatedAt: store.feeStats.updatedAt || 0,
    balances: bal
  };
}

/** Refund excess BNB lock when fill price < original lock price (BUY taker). */
function refundBuyLockExcess(acc, fillQty, lockPrice, fillPrice) {
  const lockedPer = lockPrice * (1 + TAKER_FEE);
  const spentPer = fillPrice * (1 + TAKER_FEE);
  const refund = fillQty * Math.max(0, lockedPer - spentPer);
  if (refund <= 0) return;
  const u = Math.min(refund, acc.BNB_LOCKED || 0);
  acc.BNB_LOCKED -= u;
  acc.BNB += u;
  clampAcc(acc);
}

/**
 * Apply an AMM pool fill after on-chain (or simulated) swap.
 * BUY: user spent spentBnb, received recvHel
 * SELL: user spent spentHel, received recvBnb
 * lockPrice: original spot lock price — unused slippage buffer is refunded.
 * intendedQty: HEL amount that was reserved for the pool leg (poolRemaining).
 */
function applyPoolFill(username, { side, spentBnb = 0, recvHel = 0, spentHel = 0, recvBnb = 0, price, lockPrice = 0, intendedQty = 0 }) {
  const user = norm(username);
  const acc = ensureAccount(user);
  side = String(side).toUpperCase();
  const qty = side === 'BUY' ? Number(recvHel) : Number(spentHel);
  const px = Number(price) || (qty > 0 ? (side === 'BUY' ? spentBnb / qty : recvBnb / qty) : 0);
  const lockPx = Number(lockPrice) || 0;
  const intended = Number(intendedQty) > 0 ? Number(intendedQty) : qty;

  if (side === 'BUY') {
    const pay = Number(spentBnb) || 0;
    if (acc.BNB_LOCKED >= pay) acc.BNB_LOCKED -= pay;
    else {
      const extra = pay - acc.BNB_LOCKED;
      acc.BNB_LOCKED = 0;
      acc.BNB = Math.max(0, acc.BNB - extra);
    }
    acc.HEL += Number(recvHel) || 0;
    // Unlock full reservation for this pool leg minus what was actually spent
    // (covers slippage buffer + unfilled HEL if pool returned less)
    if (lockPx > 0 && intended > 0) {
      const reserved = intended * lockPx * (1 + TAKER_FEE);
      const excess = Math.max(0, reserved - pay);
      if (excess > 0) {
        const u = Math.min(excess, acc.BNB_LOCKED || 0);
        acc.BNB_LOCKED -= u;
        acc.BNB += u;
      }
    }
  } else {
    const hel = Number(spentHel) || 0;
    if (acc.HEL_LOCKED >= hel) acc.HEL_LOCKED -= hel;
    else {
      const extra = hel - acc.HEL_LOCKED;
      acc.HEL_LOCKED = 0;
      acc.HEL = Math.max(0, acc.HEL - extra);
    }
    acc.BNB += Number(recvBnb) || 0;
    // Unlock HEL reserved for pool leg but not consumed by swap
    if (intended > 0 && hel + 1e-12 < intended) {
      const dust = intended - hel;
      const u = Math.min(dust, acc.HEL_LOCKED || 0);
      acc.HEL_LOCKED -= u;
      acc.HEL += u;
    }
  }
  clampAcc(acc);

  const trade = {
    id: id(),
    time: Date.now(),
    symbol: SYMBOL,
    price: px,
    quantity: qty,
    quote: qty * px,
    buyer: side === 'BUY' ? user : 'pool',
    seller: side === 'SELL' ? user : 'pool',
    takerSide: side,
    buyFee: 0,
    sellFee: 0,
    venue: 'pool'
  };
  store.trades.push(trade);
  if (store.trades.length > 500) store.trades = store.trades.slice(-500);
  save();
  return trade;
}

function unlockRemainder(acc, side, qty, lockPrice) {
  if (side === 'BUY') {
    const unlock = qty * lockPrice * (1 + TAKER_FEE);
    const u = Math.min(unlock, acc.BNB_LOCKED || 0);
    acc.BNB_LOCKED -= u;
    acc.BNB += u;
  } else {
    const u = Math.min(qty, acc.HEL_LOCKED || 0);
    acc.HEL_LOCKED -= u;
    acc.HEL += u;
  }
  clampAcc(acc);
}

function placeOrder(username, { side, type, quantity, price, poolMid }) {
  const user = norm(username);
  const acc = ensureAccount(user);
  side = String(side || '').toUpperCase();
  type = String(type || 'LIMIT').toUpperCase();
  let qty = Number(quantity);
  if (!['BUY', 'SELL'].includes(side)) throw new Error('side: BUY | SELL');
  if (!['LIMIT', 'MARKET'].includes(type)) throw new Error('type: LIMIT | MARKET');
  if (!(qty > 0) || !Number.isFinite(qty)) throw new Error('quantity > 0');

  let orderPrice = Number(price);
  const mid = Number(poolMid) || 0;

  if (type === 'MARKET') {
    const oppBook = side === 'BUY' ? store.asks : store.bids;
    const bestOther = oppBook.find((o) => o.user !== user);
    if (bestOther) {
      orderPrice = side === 'BUY' ? bestOther.price * 1.08 : bestOther.price * 0.92;
    } else if (mid > 0) {
      orderPrice = side === 'BUY' ? mid * 1.08 : mid * 0.92;
    } else if (DEFAULT_MID > 0) {
      orderPrice = side === 'BUY' ? DEFAULT_MID * 1.08 : DEFAULT_MID * 0.92;
    } else {
      throw new Error('Ei pool-hintaa eikä order-kirjaa — odota likviditeettiä');
    }
  } else if (!(orderPrice > 0) || !Number.isFinite(orderPrice)) {
    throw new Error('LIMIT vaatii hinnan');
  }

  if (side === 'BUY') {
    const need = qty * orderPrice * (1 + TAKER_FEE);
    if (qGet(acc) < need) throw new Error(QUOTE === 'USDC' ? 'Ei tarpeeksi USDC' : 'Ei tarpeeksi BNB');
    qAdd(acc, -need);
    qAddLocked(acc, need);
  } else {
    if (acc.HEL < qty) throw new Error('Ei tarpeeksi HEL');
    acc.HEL -= qty;
    acc.HEL_LOCKED += qty;
  }

  const order = {
    id: id(),
    user,
    side,
    price: orderPrice,
    qty,
    ts: Date.now(),
    type
  };

  const fills = [];
  const opp = side === 'BUY' ? store.asks : store.bids;
  const selfBuffer = [];

  while (qty > 1e-12 && opp.length > 0) {
    // Self-trade prevention: park own resting orders, keep matching others
    while (opp.length > 0 && opp[0].user === user) {
      selfBuffer.push(opp.shift());
    }
    if (!opp.length) break;

    const top = opp[0];
    const priceOk = side === 'BUY'
      ? (type === 'MARKET' || order.price + 1e-18 >= top.price)
      : (type === 'MARKET' || order.price - 1e-18 <= top.price);
    if (!priceOk) break;

    const fillQty = Math.min(qty, top.qty);
    const buyer = side === 'BUY' ? user : top.user;
    const seller = side === 'SELL' ? user : top.user;
    const trade = settleFill(buyer, seller, fillQty, top.price, side);
    if (!trade) break;

    if (side === 'BUY') {
      refundBuyLockExcess(acc, fillQty, orderPrice, top.price);
    }

    fills.push(trade);
    qty -= fillQty;
    top.qty -= fillQty;
    if (top.qty <= 1e-12) opp.shift();
  }

  // Restore skipped own orders to the book
  while (selfBuffer.length) opp.push(selfBuffer.pop());
  sortBooks();

  let poolRemaining = 0;
  // USDC mock market: book only (no AMM pool fill)
  const crossesPool = QUOTE === 'BNB' && mid > 0 && (
    (side === 'BUY' && (type === 'MARKET' || orderPrice >= mid)) ||
    (side === 'SELL' && (type === 'MARKET' || orderPrice <= mid))
  );

  if (qty > 1e-12 && crossesPool) {
    poolRemaining = qty;
    order.qty = qty;
  } else if (qty > 1e-12) {
    if (type === 'LIMIT') {
      order.qty = qty;
      if (side === 'BUY') store.bids.push(order);
      else store.asks.push(order);
      sortBooks();
    } else {
      unlockRemainder(acc, side, qty, orderPrice);
      qty = 0;
    }
  }

  clampAcc(acc);
  save();
  return {
    orderId: order.id,
    user,
    status: poolRemaining > 0
      ? (fills.length ? 'PARTIAL_POOL' : 'POOL')
      : (qty <= 1e-12 && fills.length ? 'FILLED' : (fills.length ? 'PARTIALLY_FILLED' : (type === 'LIMIT' ? 'NEW' : 'CANCELLED'))),
    fills,
    remaining: type === 'LIMIT' && !poolRemaining ? qty : 0,
    poolRemaining,
    lockPrice: orderPrice,
    side,
    type,
    balances: balances(user)
  };
}

function cancelOrder(username, orderId) {
  const user = norm(username);
  const si = (store.stops || []).findIndex(o => o.id === orderId && o.user === user);
  if (si >= 0) return cancelStopOrder(username, orderId);

  const acc = ensureAccount(user);
  for (const list of [store.bids, store.asks]) {
    const i = list.findIndex(o => o.id === orderId && o.user === user);
    if (i < 0) continue;
    const o = list[i];
    if (o.side === 'BUY') {
      const unlock = o.qty * o.price * (1 + TAKER_FEE);
      const u = Math.min(unlock, qGetLocked(acc));
      qAddLocked(acc, -u);
      qAdd(acc, u);
    } else {
      const u = Math.min(o.qty, acc.HEL_LOCKED || 0);
      acc.HEL_LOCKED -= u;
      acc.HEL += u;
    }
    clampAcc(acc);
    list.splice(i, 1);
    save();
    return { ok: true, balances: balances(user) };
  }
  throw new Error('Orderia ei löydy');
}

function credit(username, { HEL = 0, BNB = 0, USDC = 0 } = {}) {
  const a = ensureAccount(username);
  const h = Number(HEL) || 0;
  const b = Number(BNB) || 0;
  const u = Number(USDC) || 0;
  if (h < 0 || b < 0 || u < 0) throw new Error('credit: negative');
  if (h) a.HEL += h;
  if (b) a.BNB += b;
  if (u) a.USDC = (a.USDC || 0) + u;
  save();
  return balances(username);
}

function debit(username, { HEL = 0, BNB = 0, USDC = 0 } = {}) {
  const a = ensureAccount(username);
  const h = Number(HEL) || 0;
  const b = Number(BNB) || 0;
  const u = Number(USDC) || 0;
  if (h < 0 || b < 0 || u < 0) throw new Error('debit: negative');
  if (a.HEL < h) throw new Error('Insufficient HEL');
  if (a.BNB < b) throw new Error('Insufficient BNB');
  if ((a.USDC || 0) < u) throw new Error('Insufficient USDC');
  a.HEL -= h;
  a.BNB -= b;
  a.USDC = (a.USDC || 0) - u;
  save();
  return balances(username);
}

/** Available (unlocked) spot USDC */
function availableUsdc(username) {
  const a = ensureAccount(username);
  return Math.max(0, (a.USDC || 0) - (a.USDC_LOCKED || 0));
}

function forceBalances(username, { HEL, BNB, USDC } = {}) {
  const a = ensureAccount(username);
  const k = norm(username);
  if (HEL != null) { a.HEL = Number(HEL); a.HEL_LOCKED = 0; }
  if (BNB != null) { a.BNB = Number(BNB); a.BNB_LOCKED = 0; }
  if (USDC != null) { a.USDC = Number(USDC); a.USDC_LOCKED = 0; }
  store.bids = store.bids.filter(o => o.user !== k);
  store.asks = store.asks.filter(o => o.user !== k);
  save();
  return balances(username);
}

function resetAccount(username) {
  const k = norm(username);
  store.bids = store.bids.filter(o => o.user !== k);
  store.asks = store.asks.filter(o => o.user !== k);
  store.accounts[k] = {
    HEL: INITIAL.HEL,
    BNB: INITIAL.BNB,
    HEL_LOCKED: 0,
    BNB_LOCKED: 0,
    createdAt: Date.now()
  };
  save();
  return balances(k);
}

function clearOrderBook() {
  store.bids = [];
  store.asks = [];
  save();
  return { ok: true, symbol: SYMBOL, quote: QUOTE };
}

function clearStaleQuoteBooks() {
  // Drop resting orders priced like BNB/HEL dust when running USDC mode
  if (QUOTE !== 'USDC') return { cleared: 0 };
  const ref = DEFAULT_MID || 0.01;
  const keep = (o) => o && o.price > ref * 0.05 && o.price < ref * 20;
  const before = store.bids.length + store.asks.length;
  store.bids = (store.bids || []).filter(keep);
  store.asks = (store.asks || []).filter(keep);
  const after = store.bids.length + store.asks.length;
  if (before !== after) save();
  return { cleared: before - after, remaining: after };
}

function seedAroundPrice(adminUser, mid) {
  const u = norm(adminUser);
  ensureAccount(u);
  mid = Number(mid);
  if (!(mid > 0)) return getOrderBook();
  if (store.bids.length || store.asks.length) return getOrderBook();
  try {
    placeOrder(u, { side: 'BUY', type: 'LIMIT', quantity: 50, price: +(mid * 0.99).toPrecision(8), poolMid: mid });
    placeOrder(u, { side: 'SELL', type: 'LIMIT', quantity: 50, price: +(mid * 1.01).toPrecision(8), poolMid: mid });
  } catch (_) {}
  return getOrderBook();
}

function placeStopOrder(username, { side, type, quantity, price, stopPrice }) {
  const user = norm(username);
  const acc = ensureAccount(user);
  side = String(side || '').toUpperCase();
  type = String(type || 'STOP_LIMIT').toUpperCase();
  const qty = Number(quantity);
  const stop = Number(stopPrice);
  const limitPx = price != null ? Number(price) : null;

  if (!['BUY', 'SELL'].includes(side)) throw new Error('side: BUY | SELL');
  if (!['STOP_LIMIT', 'STOP_MARKET'].includes(type)) throw new Error('type: STOP_LIMIT | STOP_MARKET');
  if (!(qty > 0)) throw new Error('quantity > 0');
  if (!(stop > 0)) throw new Error('stopPrice vaaditaan');
  if (type === 'STOP_LIMIT' && !(limitPx > 0)) throw new Error('STOP_LIMIT vaatii limit-hinnan');

  if (side === 'BUY') {
    const reservePx = type === 'STOP_LIMIT' ? limitPx : stop * 1.05;
    const need = qty * reservePx * (1 + TAKER_FEE);
    if (acc.BNB < need) throw new Error('Ei tarpeeksi BNB (stop-varaus)');
    acc.BNB -= need;
    acc.BNB_LOCKED += need;
  } else {
    if (acc.HEL < qty) throw new Error('Ei tarpeeksi HEL');
    acc.HEL -= qty;
    acc.HEL_LOCKED += qty;
  }

  const order = {
    id: id(),
    user,
    side,
    type,
    stopPrice: stop,
    price: limitPx,
    qty,
    reservePrice: side === 'BUY' ? (type === 'STOP_LIMIT' ? limitPx : stop * 1.05) : null,
    ts: Date.now(),
    status: 'PENDING_STOP'
  };
  store.stops.push(order);
  save();
  return { orderId: order.id, status: 'PENDING_STOP', order, balances: balances(user) };
}

function getStopOrders(username) {
  const k = norm(username);
  return store.stops.filter(o => o.user === k).map(o => ({
    id: o.id,
    side: o.side,
    type: o.type,
    stopPrice: o.stopPrice,
    price: o.price,
    quantity: o.qty,
    time: o.ts,
    status: o.status
  }));
}

function cancelStopOrder(username, orderId) {
  const user = norm(username);
  const acc = ensureAccount(user);
  const i = store.stops.findIndex(o => o.id === orderId && o.user === user);
  if (i < 0) throw new Error('Stop-orderia ei löydy');
  const o = store.stops[i];
  if (o.side === 'BUY') {
    const unlock = o.qty * (o.reservePrice || o.price || o.stopPrice) * (1 + TAKER_FEE);
    const u = Math.min(unlock, acc.BNB_LOCKED);
    acc.BNB_LOCKED -= u;
    acc.BNB += u;
  } else {
    const u = Math.min(o.qty, acc.HEL_LOCKED);
    acc.HEL_LOCKED -= u;
    acc.HEL += u;
  }
  store.stops.splice(i, 1);
  save();
  return { ok: true, balances: balances(user) };
}

function stopReserveNeed(o) {
  if (o.side === 'BUY') {
    const px = o.reservePrice || o.price || o.stopPrice;
    return { asset: 'BNB', amount: o.qty * px * (1 + TAKER_FEE) };
  }
  return { asset: 'HEL', amount: o.qty };
}

function unlockStopReserve(acc, o) {
  if (!acc) return;
  if (o.side === 'BUY') {
    const unlock = o.qty * (o.reservePrice || o.price || o.stopPrice) * (1 + TAKER_FEE);
    const u = Math.min(unlock, acc.BNB_LOCKED || 0);
    acc.BNB_LOCKED -= u;
    acc.BNB += u;
  } else {
    const u = Math.min(o.qty, acc.HEL_LOCKED || 0);
    acc.HEL_LOCKED -= u;
    acc.HEL += u;
  }
  clampAcc(acc);
}

/** Re-lock stop reserve after a failed trigger. Returns false if user cannot fund it. */
function relockStopReserve(acc, o) {
  if (!acc) return false;
  const need = stopReserveNeed(o);
  if (need.asset === 'BNB') {
    if ((acc.BNB || 0) < need.amount) return false;
    acc.BNB -= need.amount;
    acc.BNB_LOCKED += need.amount;
  } else {
    if ((acc.HEL || 0) < need.amount) return false;
    acc.HEL -= need.amount;
    acc.HEL_LOCKED += need.amount;
  }
  clampAcc(acc);
  return true;
}

function processStopOrders(lastPrice) {
  const px = Number(lastPrice);
  if (!(px > 0)) return [];
  const triggered = [];
  const remaining = [];

  for (const o of store.stops) {
    const hit = o.side === 'BUY' ? px >= o.stopPrice : px <= o.stopPrice;
    if (!hit) {
      remaining.push(o);
      continue;
    }
    const acc = store.accounts[o.user] || ensureAccount(o.user);
    // Release stop reserve, then place as normal order (which locks again)
    unlockStopReserve(acc, o);
    try {
      const type = o.type === 'STOP_MARKET' ? 'MARKET' : 'LIMIT';
      const result = placeOrder(o.user, {
        side: o.side,
        type,
        quantity: o.qty,
        price: o.price,
        poolMid: px
      });
      if (result && !result.user) result.user = o.user;
      triggered.push({ stopId: o.id, user: o.user, result });
    } catch (_) {
      // placeOrder failed after unlock — re-lock and keep stop, or drop if insolvent
      if (relockStopReserve(acc, o)) {
        remaining.push(o);
      }
      // else: stop cancelled implicitly; funds stay free (user could not re-reserve)
    }
  }
  store.stops = remaining;
  save();
  return triggered;
}

function openOrders(username) {
  const k = norm(username);
  const limits = [...store.bids, ...store.asks]
    .filter(o => o.user === k)
    .map(o => ({
      id: o.id, side: o.side, type: 'LIMIT', price: o.price,
      quantity: o.qty, time: o.ts, status: 'NEW'
    }));
  return [...limits, ...getStopOrders(username)];
}

function unlockAfterPoolFail(username, side, qty, lockPrice) {
  const acc = ensureAccount(username);
  unlockRemainder(acc, String(side).toUpperCase(), Number(qty), Number(lockPrice));
  save();
  return balances(username);
}

/**
 * Admin debug: verify balances vs open orders/stops.
 * Returns { ok, problems[], summary }.
 */
function checkInvariants() {
  const problems = [];
  const expectedBnbLock = Object.create(null);
  const expectedHelLock = Object.create(null);

  function add(map, user, amt) {
    const k = norm(user);
    map[k] = (map[k] || 0) + amt;
  }

  for (const o of store.bids) {
    if (!o || !o.user) {
      problems.push({ code: 'BID_NO_USER', detail: o && o.id });
      continue;
    }
    if (!store.accounts[norm(o.user)]) {
      problems.push({ code: 'BID_UNKNOWN_USER', user: o.user, id: o.id });
    }
    if (!(o.qty > 0) || !(o.price > 0)) {
      problems.push({ code: 'BID_BAD_QTY_PRICE', id: o.id, qty: o.qty, price: o.price });
    }
    add(expectedBnbLock, o.user, o.qty * o.price * (1 + TAKER_FEE));
  }

  for (const o of store.asks) {
    if (!o || !o.user) {
      problems.push({ code: 'ASK_NO_USER', detail: o && o.id });
      continue;
    }
    if (!store.accounts[norm(o.user)]) {
      problems.push({ code: 'ASK_UNKNOWN_USER', user: o.user, id: o.id });
    }
    if (!(o.qty > 0) || !(o.price > 0)) {
      problems.push({ code: 'ASK_BAD_QTY_PRICE', id: o.id, qty: o.qty, price: o.price });
    }
    add(expectedHelLock, o.user, o.qty);
  }

  for (const o of store.stops || []) {
    if (!o || !o.user) {
      problems.push({ code: 'STOP_NO_USER', detail: o && o.id });
      continue;
    }
    if (!store.accounts[norm(o.user)]) {
      problems.push({ code: 'STOP_UNKNOWN_USER', user: o.user, id: o.id });
    }
    const need = stopReserveNeed(o);
    if (need.asset === 'BNB') add(expectedBnbLock, o.user, need.amount);
    else add(expectedHelLock, o.user, need.amount);
  }

  let usersChecked = 0;
  for (const [user, acc] of Object.entries(store.accounts)) {
    usersChecked++;
    clampAcc(acc);
    if (acc.HEL < -EPS || acc.BNB < -EPS || acc.HEL_LOCKED < -EPS || acc.BNB_LOCKED < -EPS) {
      problems.push({
        code: 'NEGATIVE_BALANCE',
        user,
        HEL: acc.HEL,
        BNB: acc.BNB,
        HEL_LOCKED: acc.HEL_LOCKED,
        BNB_LOCKED: acc.BNB_LOCKED
      });
    }

    // Fee collector may hold BNB without open orders — skip lock match for FEE_USER
    if (user === FEE_USER) continue;

    const expB = expectedBnbLock[user] || 0;
    const expH = expectedHelLock[user] || 0;
    if (Math.abs((acc.BNB_LOCKED || 0) - expB) > Math.max(EPS, expB * 1e-9 + 1e-6)) {
      problems.push({
        code: 'BNB_LOCK_MISMATCH',
        user,
        locked: acc.BNB_LOCKED,
        expectedFromOrders: expB,
        delta: (acc.BNB_LOCKED || 0) - expB
      });
    }
    if (Math.abs((acc.HEL_LOCKED || 0) - expH) > Math.max(EPS, expH * 1e-9 + 1e-6)) {
      problems.push({
        code: 'HEL_LOCK_MISMATCH',
        user,
        locked: acc.HEL_LOCKED,
        expectedFromOrders: expH,
        delta: (acc.HEL_LOCKED || 0) - expH
      });
    }
  }

  // Orders referencing locks for users with zero account entry already flagged
  for (const user of Object.keys(expectedBnbLock)) {
    if (!store.accounts[user]) {
      problems.push({ code: 'LOCK_USER_MISSING', user, asset: 'BNB' });
    }
  }
  for (const user of Object.keys(expectedHelLock)) {
    if (!store.accounts[user]) {
      problems.push({ code: 'LOCK_USER_MISSING', user, asset: 'HEL' });
    }
  }

  const bookDepth = { bids: store.bids.length, asks: store.asks.length, stops: (store.stops || []).length };
  return {
    ok: problems.length === 0,
    problems,
    summary: {
      usersChecked,
      bookDepth,
      tradesStored: store.trades.length,
      feeUser: FEE_USER,
      feeBnbCollected: store.feeStats.bnbCollected || 0
    },
    checkedAt: Date.now()
  };
}

module.exports = {
  reload,
  SYMBOL,
  QUOTE,
  DEFAULT_MID,
  MAKER_FEE,
  TAKER_FEE,
  FEE_USER,
  INITIAL,
  ensureAccount,
  balances,
  equity,
  getOrderBook,
  openOrders,
  userTrades,
  recentTrades,
  placeOrder,
  placeStopOrder,
  cancelOrder,
  cancelStopOrder,
  getStopOrders,
  processStopOrders,
  resetAccount,
  seedAroundPrice,
  clearOrderBook,
  clearStaleQuoteBooks,
  forceBalances,
  credit,
  debit,
  availableUsdc,
  applyPoolFill,
  unlockAfterPoolFail,
  getFeeStats,
  checkInvariants,
  creditFees
};
