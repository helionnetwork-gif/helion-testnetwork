/**
 * gridBot.js — erillinen HEL/tBNB grid-botti
 *
 * - Ei koske käyttäjien custodial-lompakoita
 * - Käyttää BOT_PRIVATE_KEY tai TREASURY_PRIVATE_KEY
 * - Käynnistys/sammutus API:lla tai GRID_ENABLED=true
 * - Suuri grid-väli oletuksena (prosentteina)
 */

const { ethers } = require('ethers');

const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)'
];
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)'
];
const FACTORY_ABI = ['function getPair(address tokenA, address tokenB) view returns (address pair)'];
const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)'
];

function createGridBot(deps) {
  const {
    provider,
    helAddress,
    wbnbAddress,
    routerAddress,
    factoryAddress,
    botPrivateKey,
    // suuri väli oletuksena: 8 % tasojen välillä
    spacingPct: initialSpacingPct = 8,
    gridsUp: initialGridsUp = 5,
    gridsDown: initialGridsDown = 5,
    orderBnb: initialOrderBnb = 0.02,
    orderHel: initialOrderHel = 50,
    intervalSec: initialIntervalSec = 30,
    minEdgePct: initialMinEdgePct = 2,
    maxSlippagePct: initialMaxSlippagePct = 4,
    gasReserveBnb = 0.005
  } = deps;

  if (!botPrivateKey) {
    return {
      isAvailable: false,
      start: async () => { throw new Error('BOT_PRIVATE_KEY / TREASURY puuttuu'); },
      stop: () => {},
      getStatus: () => ({ available: false, running: false, error: 'Bot-lompakko ei konfiguroitu' }),
      updateConfig: () => {}
    };
  }

  const wallet = new ethers.Wallet(botPrivateKey, provider);
  const helToken = new ethers.Contract(helAddress, TOKEN_ABI, provider);
  const router = new ethers.Contract(routerAddress, ROUTER_ABI, wallet);
  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);

  let running = false;
  let timer = null;
  let busy = false;
  let lastError = null;
  let lastTickAt = null;
  let centerPrice = null; // BNB per 1 HEL
  let openOrders = [];
  let trades = [];
  let config = {
    spacingPct: Number(initialSpacingPct),
    gridsUp: Number(initialGridsUp),
    gridsDown: Number(initialGridsDown),
    orderBnb: Number(initialOrderBnb),
    orderHel: Number(initialOrderHel),
    intervalSec: Number(initialIntervalSec),
    minEdgePct: Number(initialMinEdgePct),
    maxSlippagePct: Number(initialMaxSlippagePct)
  };

  function deadline() {
    return Math.floor(Date.now() / 1000) + 60 * 10;
  }

  async function getPoolPrice() {
    const pairAddr = await factory.getPair(helAddress, wbnbAddress);
    if (!pairAddr || pairAddr === ethers.ZeroAddress) {
      throw new Error('HEL/tBNB-paria ei ole olemassa');
    }
    const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
    const [r0, r1] = await pair.getReserves();
    const token0 = await pair.token0();
    const [helR, bnbR] = token0.toLowerCase() === helAddress.toLowerCase() ? [r0, r1] : [r1, r0];
    const hel = Number(ethers.formatUnits(helR, 18));
    const bnb = Number(ethers.formatUnits(bnbR, 18));
    if (hel <= 0 || bnb <= 0) throw new Error('Pool tyhjä');
    // price = BNB per 1 HEL
    return { price: bnb / hel, helReserve: hel, bnbReserve: bnb, pairAddr };
  }

  function rebuildGrid(price) {
    centerPrice = price;
    openOrders = [];
    const step = config.spacingPct / 100;
    for (let i = 1; i <= config.gridsDown; i++) {
      const level = price * (1 - step * i);
      if (level > 0) {
        openOrders.push({
          side: 'buy',
          price: level,
          sizeBnb: config.orderBnb,
          status: 'open'
        });
      }
    }
    for (let i = 1; i <= config.gridsUp; i++) {
      const level = price * (1 + step * i);
      openOrders.push({
        side: 'sell',
        price: level,
        sizeHel: config.orderHel,
        status: 'open'
      });
    }
    openOrders.sort((a, b) => a.price - b.price);
  }

  async function ensureApproval(amount) {
    const allowance = await helToken.allowance(wallet.address, routerAddress);
    if (allowance >= amount) return;
    const tx = await helToken.connect(wallet).approve(routerAddress, ethers.MaxUint256);
    await tx.wait();
  }

  async function buyHel(bnbAmount) {
    const amountIn = ethers.parseEther(String(bnbAmount));
    const bal = await provider.getBalance(wallet.address);
    if (bal < amountIn + ethers.parseEther(String(gasReserveBnb))) {
      throw new Error('Ei tarpeeksi tBNB (gas-reservi huomioitu)');
    }
    const path = [wbnbAddress, helAddress];
    const amounts = await router.getAmountsOut(amountIn, path);
    const minOut = amounts[1] * BigInt(Math.floor((100 - config.maxSlippagePct) * 100)) / 10000n;
    const tx = await router.swapExactETHForTokens(minOut, path, wallet.address, deadline(), { value: amountIn });
    const receipt = await tx.wait();
    return { txHash: receipt.hash, amountOut: ethers.formatUnits(amounts[1], 18) };
  }

  async function sellHel(helAmount) {
    const amountIn = ethers.parseUnits(String(helAmount), 18);
    const bal = await helToken.balanceOf(wallet.address);
    if (bal < amountIn) throw new Error('Ei tarpeeksi HEL');
    await ensureApproval(amountIn);
    const path = [helAddress, wbnbAddress];
    const amounts = await router.getAmountsOut(amountIn, path);
    const minOut = amounts[1] * BigInt(Math.floor((100 - config.maxSlippagePct) * 100)) / 10000n;
    const tx = await router.swapExactTokensForETH(amountIn, minOut, path, wallet.address, deadline());
    const receipt = await tx.wait();
    return { txHash: receipt.hash, amountOut: ethers.formatEther(amounts[1]) };
  }

  async function processOrders(currentPrice) {
    const remaining = [];
    const step = config.spacingPct / 100;

    for (const order of openOrders) {
      if (order.side === 'buy' && currentPrice <= order.price) {
        // Älä osta jos ero on liian pieni feeihin nähden suhteessa centeriin
        try {
          const result = await buyHel(order.sizeBnb);
          trades.push({
            time: new Date().toISOString(),
            side: 'BUY',
            level: order.price,
            marketPrice: currentPrice,
            sizeBnb: order.sizeBnb,
            txHash: result.txHash
          });
          // Vastapuoli: sell ylemmällä tasolla
          remaining.push({
            side: 'sell',
            price: order.price * (1 + step),
            sizeHel: config.orderHel,
            status: 'open'
          });
          lastError = null;
        } catch (e) {
          lastError = e.message;
          remaining.push(order);
        }
        continue;
      }

      if (order.side === 'sell' && currentPrice >= order.price) {
        try {
          const result = await sellHel(order.sizeHel);
          trades.push({
            time: new Date().toISOString(),
            side: 'SELL',
            level: order.price,
            marketPrice: currentPrice,
            sizeHel: order.sizeHel,
            txHash: result.txHash
          });
          remaining.push({
            side: 'buy',
            price: order.price * (1 - step),
            sizeBnb: config.orderBnb,
            status: 'open'
          });
          lastError = null;
        } catch (e) {
          lastError = e.message;
          remaining.push(order);
        }
        continue;
      }

      remaining.push(order);
    }

    openOrders = remaining;
    if (trades.length > 50) trades = trades.slice(-50);
  }

  async function tick() {
    if (!running || busy) return;
    busy = true;
    lastTickAt = Date.now();
    try {
      const { price } = await getPoolPrice();
      if (!centerPrice || openOrders.length === 0) {
        rebuildGrid(price);
      }
      await processOrders(price);
    } catch (e) {
      lastError = e.message;
      console.warn('[gridBot]', e.message);
    } finally {
      busy = false;
    }
  }

  async function start() {
    if (running) return getStatus();
    const { price } = await getPoolPrice();
    rebuildGrid(price);
    running = true;
    lastError = null;
    timer = setInterval(() => { tick().catch(() => {}); }, Math.max(10, config.intervalSec) * 1000);
    await tick();
    console.log('[gridBot] käynnissä @', wallet.address, 'spacing', config.spacingPct + '%');
    return getStatus();
  }

  function stop() {
    running = false;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    console.log('[gridBot] pysäytetty');
    return getStatus();
  }

  function updateConfig(partial = {}) {
    if (partial.spacingPct != null) config.spacingPct = Math.max(1, Number(partial.spacingPct));
    if (partial.gridsUp != null) config.gridsUp = Math.max(1, Math.min(20, Number(partial.gridsUp)));
    if (partial.gridsDown != null) config.gridsDown = Math.max(1, Math.min(20, Number(partial.gridsDown)));
    if (partial.orderBnb != null) config.orderBnb = Math.max(0.001, Number(partial.orderBnb));
    if (partial.orderHel != null) config.orderHel = Math.max(0.01, Number(partial.orderHel));
    if (partial.intervalSec != null) config.intervalSec = Math.max(10, Number(partial.intervalSec));
    if (partial.maxSlippagePct != null) config.maxSlippagePct = Math.max(1, Math.min(15, Number(partial.maxSlippagePct)));
    if (running && timer) {
      clearInterval(timer);
      timer = setInterval(() => { tick().catch(() => {}); }, config.intervalSec * 1000);
    }
    return config;
  }

  async function getStatus() {
    let helBal = '0';
    let bnbBal = '0';
    let pool = null;
    try {
      const [h, b] = await Promise.all([
        helToken.balanceOf(wallet.address),
        provider.getBalance(wallet.address)
      ]);
      helBal = ethers.formatUnits(h, 18);
      bnbBal = ethers.formatEther(b);
      pool = await getPoolPrice();
    } catch (e) {
      lastError = e.message;
    }

    return {
      available: true,
      running,
      busy,
      address: wallet.address,
      helBalance: helBal,
      bnbBalance: bnbBal,
      centerPrice,
      currentPrice: pool ? pool.price : null,
      helReserve: pool ? pool.helReserve : null,
      bnbReserve: pool ? pool.bnbReserve : null,
      config: { ...config },
      openOrders: openOrders.map(o => ({
        side: o.side,
        price: o.price,
        sizeBnb: o.sizeBnb || null,
        sizeHel: o.sizeHel || null
      })),
      trades: trades.slice(-20),
      lastError,
      lastTickAt,
      // avaimet = ohjaus, EI private key
      controls: {
        start: 'POST /api/grid/start',
        stop: 'POST /api/grid/stop',
        config: 'POST /api/grid/config',
        status: 'GET /api/grid/status'
      }
    };
  }

  return {
    isAvailable: true,
    start,
    stop,
    getStatus,
    updateConfig,
    rebuild: async () => {
      const { price } = await getPoolPrice();
      rebuildGrid(price);
      return getStatus();
    }
  };
}

module.exports = { createGridBot };
