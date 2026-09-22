/**
 * Spot Market Maker — quotes HEL/BNB around the Helion AMM pool mid.
 */
function createSpotMarketMaker(spotEngine, opts = {}) {
  const mmUser = String(opts.mmUser || process.env.SPOT_MM_USER || 'marketmaker').toLowerCase();
  const getMid = opts.getMid;
  let running = false;
  let timer = null;
  let busy = false;
  let lastError = null;
  let lastTickAt = null;
  let lastMid = null;
  let config = {
    symbol: spotEngine.SYMBOL || 'HELUSDC',
    spreadPct: Number(process.env.SPOT_MM_SPREAD_PCT || 0.25),
    levels: Number(process.env.SPOT_MM_LEVELS || 5),
    orderSizeHel: Number(process.env.SPOT_MM_SIZE_HEL || 20),
    intervalSec: Number(process.env.SPOT_MM_INTERVAL_SEC || 8),
    minMovePct: Number(process.env.SPOT_MM_MIN_MOVE_PCT || 0.08)
  };

  function topUpMm() {
    const minBnb = Number(process.env.SPOT_MM_MIN_BNB || 50);
    const minUsdc = Number(process.env.SPOT_MM_MIN_USDC || 100000);
    const minHel = Number(process.env.SPOT_MM_MIN_HEL || 50000);
    const b = spotEngine.balances(mmUser);
    const quote = spotEngine.QUOTE || 'USDC';
    const freeQ = quote === 'USDC'
      ? (b.USDC || 0) + (b.USDC_LOCKED || 0)
      : (b.BNB || 0) + (b.BNB_LOCKED || 0);
    const freeB = freeQ;
    const freeH = (b.HEL || 0) + (b.HEL_LOCKED || 0);
    if (freeB < (quote === 'USDC' ? minUsdc : minBnb) * 0.25 || freeH < minHel * 0.25) {
      if (typeof spotEngine.forceBalances === 'function') {
        if (quote === 'USDC') {
          spotEngine.forceBalances(mmUser, { USDC: minUsdc, HEL: minHel });
        } else {
          spotEngine.forceBalances(mmUser, { BNB: minBnb, HEL: minHel });
        }
      }
    }
  }

  function cancelAllMmOrders() {
    const open = spotEngine.openOrders(mmUser);
    for (const o of open) {
      try { spotEngine.cancelOrder(mmUser, o.id); } catch (_) {}
    }
  }

  async function fetchMid() {
    if (typeof getMid === 'function') {
      const r = await getMid();
      const mid = Number(r.mid || r.price);
      if (!(mid > 0)) throw new Error('Virheellinen pool mid');
      return { mid, bid: r.bid || mid, ask: r.ask || mid, source: r.source || 'helion_pool' };
    }
    throw new Error('Pool-hintaa ei saatavilla');
  }

  function priceDec(mid) {
    if (mid >= 1) return 4;
    if (mid >= 0.01) return 6;
    return 8;
  }

  function placeGrid(mid) {
    const levels = Math.max(1, Math.min(15, config.levels));
    const step = config.spreadPct / 100;
    const size = config.orderSizeHel;
    const d = priceDec(mid);

    for (let i = 1; i <= levels; i++) {
      const bidPx = +(mid * (1 - step * i)).toFixed(d);
      const askPx = +(mid * (1 + step * i)).toFixed(d);
      try {
        spotEngine.placeOrder(mmUser, {
          side: 'BUY', type: 'LIMIT', quantity: size, price: bidPx, poolMid: mid
        });
      } catch (e) {
        lastError = 'MM bid: ' + e.message;
      }
      try {
        spotEngine.placeOrder(mmUser, {
          side: 'SELL', type: 'LIMIT', quantity: size, price: askPx, poolMid: mid
        });
      } catch (e) {
        lastError = 'MM ask: ' + e.message;
      }
    }
  }

  async function tick(force = false) {
    if (!running || busy) return;
    busy = true;
    lastTickAt = Date.now();
    try {
      topUpMm();
      const { mid, bid, ask } = await fetchMid();
      const moved = lastMid ? Math.abs(mid - lastMid) / lastMid * 100 : 999;
      if (force || moved >= config.minMovePct || !lastMid) {
        cancelAllMmOrders();
        placeGrid(mid);
        lastMid = mid;
        lastError = null;
      }
      return { mid, bid, ask, moved };
    } catch (e) {
      lastError = e.message;
      console.warn('[spotMM]', e.message);
    } finally {
      busy = false;
    }
  }

  async function start() {
    if (running) return getStatus();
    topUpMm();
    running = true;
    lastError = null;
    await tick(true);
    timer = setInterval(() => { tick(false).catch(() => {}); }, Math.max(3, config.intervalSec) * 1000);
    console.log('[spotMM] HEL/BNB pool-peg user=', mmUser, 'spread%', config.spreadPct);
    return getStatus();
  }

  function stop() {
    running = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    cancelAllMmOrders();
    console.log('[spotMM] pysäytetty');
    return getStatus();
  }

  function updateConfig(partial = {}) {
    if (partial.spreadPct != null) config.spreadPct = Math.max(0.05, Number(partial.spreadPct));
    if (partial.levels != null) config.levels = Math.max(1, Math.min(15, Number(partial.levels)));
    if (partial.orderSizeHel != null) config.orderSizeHel = Math.max(0.0001, Number(partial.orderSizeHel));
    if (partial.orderSizeBtc != null) config.orderSizeHel = Math.max(0.0001, Number(partial.orderSizeBtc));
    if (partial.intervalSec != null) config.intervalSec = Math.max(3, Number(partial.intervalSec));
    if (partial.minMovePct != null) config.minMovePct = Math.max(0.01, Number(partial.minMovePct));
    if (running && timer) {
      clearInterval(timer);
      timer = setInterval(() => { tick(false).catch(() => {}); }, config.intervalSec * 1000);
    }
    return { ...config };
  }

  function getStatus() {
    const bal = spotEngine.balances(mmUser);
    const open = spotEngine.openOrders(mmUser);
    const book = spotEngine.getOrderBook(5);
    return {
      available: true,
      running,
      busy,
      mmUser,
      lastMid,
      lastError,
      lastTickAt,
      peg: 'helion_pool',
      config: { ...config },
      balances: bal,
      openOrderCount: open.length,
      bookTop: {
        bestBid: book.bids[0]?.price || null,
        bestAsk: book.asks[0]?.price || null
      },
      controls: {
        start: 'POST /api/spot/mm/start',
        stop: 'POST /api/spot/mm/stop',
        config: 'POST /api/spot/mm/config',
        status: 'GET /api/spot/mm/status'
      }
    };
  }

  return { start, stop, tick, updateConfig, getStatus, mmUser };
}

module.exports = { createSpotMarketMaker };
