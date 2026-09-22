// server.js — Helion Wallet API
//
// Tarjoaa rekisteröinnin/kirjautumisen ja custodial-lompakot web-sivulle,
// samalla periaatteella kuin Telegram-botti. Siirto on ilmainen jos
// vastaanottaja on toinen järjestelmän oma käyttäjä, muuten 1% fee joka
// jaetaan 50/50 staking-fee-osoitteen ja emergency vaultin kesken.
// Sisältää myös lompakkopohjaisen kirjautumisen (allekirjoitus, ei salasanaa)
// sekä Staking- ja Miner-toiminnot custodial-lompakon kautta.
//
// TURVALLISUUS: säilyttää käyttäjien yksityisavaimia salattuna palvelimella.
// Sopii testnet-käyttöön. Vaatii oikean Node-hostingin (ei GitHub Pages,
// koska tämä on palvelin, ei staattinen sivu) — esim. Render tai Railway.
//
// KÄYTTÖÖNOTTO:
// 1. npm install
// 2. Kopioi .env.example -> .env, täytä kaikki kentät
// 3. node server.js

require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { getOrCreateWallet, getSigner } = require('./wallet');
const users = require('./users');
const emailService = require('./email');
const contributions = require('./contributions');
const minerEmission = require('./minerEmission');
const { createGridBot } = require('./gridBot');
const spotEngine = require('./spotEngine');
try {
  if (typeof spotEngine.clearStaleQuoteBooks === 'function') {
    const c = spotEngine.clearStaleQuoteBooks();
    if (c.cleared) console.log('[spot] cleared stale quote orders', c);
  }
} catch (e) { console.warn('[spot] clearStale', e.message); }

const bookBalances = require('./balances');
const swapRoutes = require('./swapRoutes');
const { DIR: DATA_DIR } = require('./dataDir');
const blobStore = require('./blobStore');

const { createSpotMarketMaker } = require('./spotMarketMaker');
const priceHistory = require('./priceHistory');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;
const RPC_URL = process.env.RPC_URL || 'https://data-seed-prebsc-1-s1.bnbchain.org:8545';
const TREASURY_PRIVATE_KEY = process.env.TREASURY_PRIVATE_KEY;
const HEL_ADDRESS = process.env.HEL_ADDRESS || '0xE4BCF45d177Cea1DFB6Fb8fCD2F32Bc9Dc79814B';
const STAKING_ADDRESS = process.env.STAKING_ADDRESS || '0x44eD13BD90dCAf748F80e8faC8bbcd4dc498f5dd';
const MINER_ADDRESS = process.env.MINER_ADDRESS;
if (!MINER_ADDRESS) console.warn('Huom: MINER_ADDRESS puuttuu .env:stä — /api/miner/* -reitit eivät toimi ennen kuin se on asetettu.');

const TRANSFER_FEE_BPS = BigInt(process.env.TRANSFER_FEE_BPS || '100'); // 100 = 1%
const STAKING_FEE_ADDRESS = process.env.STAKING_FEE_ADDRESS;
const EMERGENCY_VAULT_ADDRESS = process.env.EMERGENCY_VAULT_ADDRESS;

if (!JWT_SECRET || JWT_SECRET.length < 16) { console.error('JWT_SECRET puuttuu/liian lyhyt .env:ssä.'); process.exit(1); }
if (!TREASURY_PRIVATE_KEY) { console.error('TREASURY_PRIVATE_KEY puuttuu .env:stä.'); process.exit(1); }
if (!STAKING_FEE_ADDRESS || !EMERGENCY_VAULT_ADDRESS) { console.error('STAKING_FEE_ADDRESS/EMERGENCY_VAULT_ADDRESS puuttuu .env:stä.'); process.exit(1); }

const provider = new ethers.JsonRpcProvider(RPC_URL);
const treasury = new ethers.Wallet(TREASURY_PRIVATE_KEY, provider);

/** System pays gas for internal ops (mine, stake, HEL transfer). Not for swap / external tBNB withdraw. */
const GAS_SPONSOR_ENABLED = String(process.env.GAS_SPONSOR_ENABLED || 'true').toLowerCase() !== 'false';
const GAS_SPONSOR_MIN = ethers.parseEther(String(process.env.GAS_SPONSOR_MIN || '0.0015'));
const GAS_SPONSOR_TARGET = ethers.parseEther(String(process.env.GAS_SPONSOR_TARGET || '0.005'));

async function ensureSponsoredGas(userAddress, reason = 'internal') {
  if (!GAS_SPONSOR_ENABLED) return { sponsored: false, reason: 'disabled' };
  if (!userAddress || !ethers.isAddress(userAddress)) return { sponsored: false, reason: 'bad address' };
  const bal = await provider.getBalance(userAddress);
  if (bal >= GAS_SPONSOR_MIN) return { sponsored: false, balance: ethers.formatEther(bal) };

  const need = GAS_SPONSOR_TARGET - bal;
  if (need <= 0n) return { sponsored: false, balance: ethers.formatEther(bal) };

  const tBal = await provider.getBalance(treasury.address);
  if (tBal < need) {
    const err = new Error(
      'Järjestelmän gas-treasury tyhjä. Yritä hetken päästä tai ota yhteys tukeen. / System gas treasury empty.'
    );
    err.code = 'GAS_TREASURY_EMPTY';
    throw err;
  }

  const tx = await treasury.sendTransaction({
    to: userAddress,
    value: need,
    gasLimit: 21000n
  });
  await tx.wait();
  console.log('[gas-sponsor]', reason, userAddress, ethers.formatEther(need), 'tBNB', tx.hash);
  return {
    sponsored: true,
    amount: ethers.formatEther(need),
    txHash: tx.hash,
    balanceAfter: ethers.formatEther(await provider.getBalance(userAddress))
  };
}




const TOKEN_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)'
];
const STAKING_ABI = [
  'function tiersCount() view returns (uint256)',
  'function tiers(uint256) view returns (uint256 lockDuration, uint256 minStake, uint256 rewardBps, bool active)',
  'function stake(uint256 tierId, uint256 amount)',
  'function withdraw(uint256 stakeIndex)',
  'function earlyWithdraw(uint256 stakeIndex)',
  'function getUserStakes(address user) view returns (tuple(uint256 amount, uint256 startTime, uint256 lockDuration, uint256 rewardBps, bool withdrawn)[])'
];
const MINER_ABI = [
  'function activateMining()',
  'function claim()',
  'function pendingReward(address user) view returns (uint256)',
  'function miningEndTime(address) view returns (uint256)',
  'function totalMined(address) view returns (uint256)',
  'function rewardPerCycle() view returns (uint256)'
];
const TIER_NAMES = ['Pika', 'Perus', 'Pitkä', 'Extra'];

// ---------- Trading (PancakeSwap testnet router) ----------
const ROUTER_ADDRESS = process.env.ROUTER_ADDRESS || '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0x6725F303b657a9451d8BA641348b6761A6CC7a17';
const WBNB_ADDRESS = process.env.WBNB_ADDRESS || '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd';
const TRADING_FEE_BPS = BigInt(process.env.TRADING_FEE_BPS || '100'); // 100 = 1%
const SWAP_PREFER = String(process.env.SWAP_PREFER || 'helion').toLowerCase(); // helion | pancake | best
const HELION_PAIR_ADDRESS = (process.env.HELION_PAIR_ADDRESS || '').trim();
const POOL_SWAP_FEE_BPS = BigInt(process.env.POOL_SWAP_FEE_BPS || '30'); // 0.3% AMM fee inside pool

const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)',
  'function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) returns (uint amountToken, uint amountETH)'
];

const FACTORY_ABI = ['function getPair(address tokenA, address tokenB) view returns (address pair)'];
const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function balanceOf(address) view returns (uint256)'
];
function deadline() { return Math.floor(Date.now() / 1000) + 60 * 10; }

const app = express();
app.use(cors());
app.use(express.json());


async function ensureApproval(signer, tokenAddress, spender, amount) {
  const token = new ethers.Contract(tokenAddress, TOKEN_ABI, signer);
  const owner = await signer.getAddress();
  const allowance = await token.allowance(owner, spender);
  if (allowance < amount) {
    const tx = await token.approve(spender, amount);
    await tx.wait();
  }
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Ei kirjautunut.' });
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.username = payload.username;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Virheellinen tai vanhentunut sessio.' });
  }
}

// ---------- Lompakkokirjautuminen (ilman salasanaa) ----------
const nonceStore = new Map(); // osoite(lower) -> { nonce, expiresAt }

app.get('/api/auth/nonce', (req, res) => {
  const address = String(req.query.address || '').toLowerCase();
  if (!ethers.isAddress(address)) return res.status(400).json({ error: 'Virheellinen osoite.' });
  const nonce = crypto.randomBytes(16).toString('hex');
  nonceStore.set(address, { nonce, expiresAt: Date.now() + 5 * 60 * 1000 });
  res.json({ message: `Kirjaudu Helioniin allekirjoittamalla tämä viesti.\n\nNonce: ${nonce}` });
});

function verifySignedNonce(address, message, signature) {
  const addr = address.toLowerCase();
  const entry = nonceStore.get(addr);
  if (!entry || entry.expiresAt < Date.now()) return false;
  if (!message.includes(entry.nonce)) return false;
  let recovered;
  try { recovered = ethers.verifyMessage(message, signature).toLowerCase(); }
  catch (e) { return false; }
  if (recovered !== addr) return false;
  nonceStore.delete(addr);
  return true;
}

app.post('/api/auth/wallet-login', (req, res) => {
  const { address, message, signature } = req.body || {};
  if (!address || !message || !signature) return res.status(400).json({ error: 'address, message ja signature vaaditaan.' });
  if (!verifySignedNonce(address, message, signature)) return res.status(400).json({ error: 'Allekirjoitus ei kelpaa tai nonce vanhentunut.' });

  const username = users.getUsernameByLinkedWallet(address);
  if (!username) return res.status(400).json({ error: 'Tätä lompakkoa ei ole linkitetty mihinkään tiliin. Kirjaudu ensin tunnuksella ja linkitä lompakko Wallet-osiossa.' });

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });
  spotEngine.ensureAccount(username);
  res.json({ token, username, walletAddress: users.getWalletAddress(username) });
});

app.post('/api/link-wallet', authMiddleware, (req, res) => {
  const { address, message, signature } = req.body || {};
  if (!address || !message || !signature) return res.status(400).json({ error: 'address, message ja signature vaaditaan.' });
  if (!verifySignedNonce(address, message, signature)) return res.status(400).json({ error: 'Allekirjoitus ei kelpaa tai nonce vanhentunut.' });

  const result = users.linkWallet(req.username, address);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true, address });
});

app.get('/api/linked-wallets', authMiddleware, (req, res) => {
  res.json({ wallets: users.getLinkedWallets(req.username) });
});

// ---------- Rekisteröinti / kirjautuminen ----------
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username ja password vaaditaan.', errorEn: 'Username and password required.' });
    if (!email) return res.status(400).json({ error: 'Sähköposti vaaditaan.', errorEn: 'Email is required.' });
    if (!users.isValidEmail(email)) return res.status(400).json({ error: 'Kelvollinen sähköposti vaaditaan.', errorEn: 'Valid email required.' });
    if (users.usernameExists(username)) return res.status(400).json({ error: 'Käyttäjänimi on jo varattu.', errorEn: 'Username taken.' });
    if (users.emailTaken(email)) return res.status(400).json({ error: 'Sähköposti on jo käytössä.', errorEn: 'Email already in use.' });

    const { address } = getOrCreateWallet(username);
    const result = await users.register(username, password, address, email);
    if (!result.ok) return res.status(400).json({ error: result.error || 'Rekisteröinti epäonnistui.' });

    spotEngine.ensureAccount(result.username);

    let mail = { ok: false };
    try {
      mail = await emailService.sendVerificationEmail({
        to: result.email,
        username: result.username,
        token: result.verifyToken,
        expiresAt: result.verifyExpiresAt
      });
    } catch (e) {
      console.warn('register email', e.message);
    }

    // No JWT until email verified
    res.json({
      ok: true,
      needsVerification: true,
      username: result.username,
      email: result.email,
      verifyExpiresAt: result.verifyExpiresAt,
      message: 'Tarkista sähköpostisi. Vahvista tili 24h sisällä.',
      messageEn: 'Check your email. Verify within 24 hours.',
      // dev helper when EMAIL_MODE=log
      devToken: (process.env.EMAIL_MODE || '').toLowerCase() === 'log' ? result.verifyToken : undefined
    });
  } catch (e) {
    console.error('register', e);
    res.status(500).json({ error: e.message || 'Rekisteröinti epäonnistui.' });
  }
});

app.post('/api/verify-email', async (req, res) => {
  try {
    const token = (req.body && req.body.token) || req.query.token;
    const result = users.verifyEmailToken(token);
    if (!result.ok) {
      return res.status(400).json({
        error: result.error,
        errorEn: result.code === 'VERIFY_EXPIRED'
          ? 'Verification expired. Please register again.'
          : 'Invalid or used verification code.',
        code: result.code
      });
    }
    spotEngine.ensureAccount(result.username);
    const jwtToken = jwt.sign({ username: result.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({
      ok: true,
      token: jwtToken,
      username: result.username,
      email: result.email,
      message: 'Sähköposti vahvistettu.',
      messageEn: 'Email verified.'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/verify-email', async (req, res) => {
  try {
    const result = users.verifyEmailToken(req.query.token);
    if (!result.ok) {
      res.status(400).type('html').send(
        `<!doctype html><meta charset="utf-8"><title>Helion</title>` +
        `<body style="font-family:sans-serif;background:#0A0C10;color:#F5F3EE;padding:40px">` +
        `<h1>Verification failed</h1><p>${result.error || 'Invalid token'}</p></body>`
      );
      return;
    }
    const jwtToken = jwt.sign({ username: result.username }, JWT_SECRET, { expiresIn: '30d' });
    const front = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    if (front) {
      res.redirect(front + '/verify.html?verified=1&token=' + encodeURIComponent(jwtToken) + '&username=' + encodeURIComponent(result.username));
      return;
    }
    res.type('html').send(
      `<!doctype html><meta charset="utf-8"><title>Helion</title>` +
      `<body style="font-family:sans-serif;background:#0A0C10;color:#F5F3EE;padding:40px">` +
      `<h1>Email verified</h1><p>You can close this tab and log in as <b>${result.username}</b>.</p></body>`
    );
  } catch (e) {
    res.status(500).send(String(e.message));
  }
});

app.post('/api/resend-verification', async (req, res) => {
  try {
    const { username } = req.body || {};
    const result = users.resendVerification(username);
    if (!result.ok) return res.status(400).json({ error: result.error });
    await emailService.sendVerificationEmail({
      to: result.email,
      username: result.username,
      token: result.verifyToken,
      expiresAt: result.verifyExpiresAt
    });
    res.json({ ok: true, message: 'Vahvistusviesti lähetetty.', messageEn: 'Verification email sent.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password, pin } = req.body || {};
    if (!username) return res.status(400).json({ error: 'username vaaditaan.', errorEn: 'Username required.' });

    let result;
    if (pin && !password) {
      result = await users.verifyLoginPin(username, pin);
    } else {
      if (!password) return res.status(400).json({ error: 'password tai PIN vaaditaan.', errorEn: 'Password or PIN required.' });
      result = await users.verifyLogin(username, password);
    }
    if (!result.ok) {
      return res.status(400).json({
        error: result.error || 'Kirjautuminen epäonnistui.',
        errorEn: result.code === 'EMAIL_NOT_VERIFIED'
          ? 'Verify your email before logging in.'
          : (result.error || 'Login failed.'),
        code: result.code,
        email: result.email
      });
    }

    const token = jwt.sign({ username: result.username }, JWT_SECRET, { expiresIn: '30d' });
    spotEngine.ensureAccount(result.username);
    res.json({
      token,
      username: result.username,
      walletAddress: result.walletAddress || users.getWalletAddress(result.username),
      hasPin: !!result.hasPin
    });
  } catch (e) {
    console.error('login', e);
    res.status(500).json({ error: e.message || 'Kirjautuminen epäonnistui.' });
  }
});

app.post('/api/pin/set', authMiddleware, async (req, res) => {
  try {
    const pin = (req.body || {}).pin;
    const result = await users.setPin(req.username, pin);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true, message: 'PIN tallennettu.', messageEn: 'PIN saved.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/pin/clear', authMiddleware, async (req, res) => {
  try {
    const password = (req.body || {}).password;
    const result = await users.clearPin(req.username, password);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/me', authMiddleware, (req, res) => {
  const p = users.getPublicProfile(req.username);
  res.json(p || { username: req.username });
});


/** Custodial address must match the private key used to sign. */
function resolveCustodialAddress(username) {
  let signerAddr = null;
  try {
    const signer = getSigner(username, provider);
    signerAddr = signer.address;
  } catch (e) {
    // no wallet key yet
  }
  const stored = users.getWalletAddress(username);
  if (signerAddr) {
    if (!stored || String(stored).toLowerCase() !== String(signerAddr).toLowerCase()) {
      console.warn('[wallet-sync]', username, 'users.address', stored, '→ signer', signerAddr);
      if (typeof users.setWalletAddress === 'function') {
        users.setWalletAddress(username, signerAddr);
      }
    }
    return signerAddr;
  }
  return stored;
}

// ---------- Lompakko ----------
app.get('/api/wallet', authMiddleware, async (req, res) => {
  try {
    const address = resolveCustodialAddress(req.username);
    if (!address) return res.status(400).json({ error: 'Lompakkoa ei löydy.' });
    const helToken = new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, provider);
    const [helBal, bnbBal] = await Promise.all([
      helToken.balanceOf(address),
      provider.getBalance(address)
    ]);
    res.json({
      username: req.username,
      address,
      helBalance: ethers.formatUnits(helBal, 18),
      bnbBalance: ethers.formatEther(bnbBal),
      usdcBalance: String(bookBalances.getUsdc(req.username)),
      usdcMock: true
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


app.get('/api/wallet/txs', authMiddleware, async (req, res) => {
  try {
    const address = resolveCustodialAddress(req.username);
    if (!address) return res.status(400).json({ error: 'Lompakkoa ei löydy.' });
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 3));
    const key = process.env.BSCSCAN_API_KEY || '';
    const base = 'https://api-testnet.bscscan.com/api';
    const q = (action) =>
      `${base}?module=account&action=${action}&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc` +
      (key ? `&apikey=${key}` : '');

    async function fetchList(action) {
      try {
        const r = await fetch(q(action));
        const j = await r.json();
        if (j.status !== '1' || !Array.isArray(j.result)) return [];
        return j.result;
      } catch (e) {
        console.warn('bscscan', action, e.message);
        return [];
      }
    }

    const [native, tokens] = await Promise.all([
      fetchList('txlist'),
      fetchList('tokentx')
    ]);

    const explorer = 'https://testnet.bscscan.com/tx/';
    const rows = [];

    for (const tx of native) {
      if (!tx || tx.value === undefined) continue;
      const val = Number(tx.value) / 1e18;
      const from = (tx.from || '').toLowerCase();
      const to = (tx.to || '').toLowerCase();
      const me = address.toLowerCase();
      let direction = 'out';
      if (to === me && from !== me) direction = 'in';
      else if (from === me && to === me) direction = 'self';
      rows.push({
        hash: tx.hash,
        ts: Number(tx.timeStamp) * 1000,
        type: 'bnb',
        direction,
        value: val,
        symbol: 'tBNB',
        from: tx.from,
        to: tx.to,
        isError: tx.isError === '1',
        explorer: explorer + tx.hash
      });
    }

    for (const tx of tokens) {
      if (!tx) continue;
      const decimals = Number(tx.tokenDecimal) || 18;
      const val = Number(tx.value) / Math.pow(10, decimals);
      const from = (tx.from || '').toLowerCase();
      const to = (tx.to || '').toLowerCase();
      const me = address.toLowerCase();
      let direction = 'out';
      if (to === me && from !== me) direction = 'in';
      const sym = (tx.tokenSymbol || 'TOKEN').toUpperCase();
      rows.push({
        hash: tx.hash,
        ts: Number(tx.timeStamp) * 1000,
        type: 'token',
        direction,
        value: val,
        symbol: sym === 'HEL' || (HEL_ADDRESS && String(tx.contractAddress).toLowerCase() === String(HEL_ADDRESS).toLowerCase()) ? 'HEL' : sym,
        from: tx.from,
        to: tx.to,
        isError: false,
        explorer: explorer + tx.hash
      });
    }

    rows.sort((a, b) => b.ts - a.ts);
    // unique by hash+symbol+direction
    const seen = new Set();
    const unique = [];
    for (const r of rows) {
      const k = r.hash + r.symbol + r.direction;
      if (seen.has(k)) continue;
      seen.add(k);
      unique.push(r);
    }

    res.json({
      address,
      txs: unique.slice(0, limit),
      explorerBase: explorer
    });
  } catch (e) {
    console.error('wallet txs', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/wallet/debug', authMiddleware, async (req, res) => {
  try {
    const stored = users.getWalletAddress(req.username);
    let signerAddr = null;
    let err = null;
    try {
      signerAddr = getSigner(req.username, provider).address;
    } catch (e) {
      err = e.message;
    }
    const match = stored && signerAddr && stored.toLowerCase() === signerAddr.toLowerCase();
    const helToken = new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, provider);
    async function bal(addr) {
      if (!addr) return null;
      const [hel, bnb] = await Promise.all([helToken.balanceOf(addr), provider.getBalance(addr)]);
      return { hel: ethers.formatUnits(hel, 18), bnb: ethers.formatEther(bnb) };
    }
    res.json({
      username: req.username,
      usersAddress: stored,
      signerAddress: signerAddr,
      match,
      usersBalances: await bal(stored),
      signerBalances: await bal(signerAddr),
      error: err
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});




// ---------- Siirto ----------
app.post('/api/transfer', authMiddleware, async (req, res) => {
  const { recipient, amount } = req.body || {};
  if (!recipient || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'recipient ja kelvollinen amount vaaditaan.' });
  }

  try {
    const myAddress = users.getWalletAddress(req.username);

    let targetAddress, isInternal, targetLabel;
    if (ethers.isAddress(recipient)) {
      targetAddress = recipient;
      isInternal = users.isInternalAddress(recipient);
      targetLabel = isInternal ? '@' + users.resolveUsernameByAddress(recipient) : recipient;
    } else {
      const resolvedAddress = users.getWalletAddress(recipient);
      if (!resolvedAddress) return res.status(400).json({ error: 'Käyttäjänimeä ei löydy.' });
      targetAddress = resolvedAddress;
      isInternal = true;
      targetLabel = '@' + recipient.trim().toLowerCase();
    }

    if (targetAddress.toLowerCase() === myAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Et voi lähettää itsellesi.' });
    }

    const amountRaw = ethers.parseUnits(amount, 18);
    const helToken = new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, provider);
    const balance = await helToken.balanceOf(myAddress);
    if (balance < amountRaw) return res.status(400).json({ error: 'Ei tarpeeksi HEL:iä.' });

    let fee = 0n, stakingShare = 0n, vaultShare = 0n;
    if (!isInternal) {
      fee = (amountRaw * TRANSFER_FEE_BPS) / 10000n;
      stakingShare = fee / 2n;
      vaultShare = fee - stakingShare;
    }
    const recipientAmount = amountRaw - fee;

    const signer = getSigner(req.username, provider);
    const gasInfo = await ensureSponsoredGas(signer.address, isInternal ? 'transfer-hel-internal' : 'transfer-hel-external');
    const helWithSigner = helToken.connect(signer);

    const tx1 = await helWithSigner.transfer(targetAddress, recipientAmount);
    await tx1.wait();

    if (fee > 0n) {
      const tx2 = await helWithSigner.transfer(STAKING_FEE_ADDRESS, stakingShare);
      await tx2.wait();
      const tx3 = await helWithSigner.transfer(EMERGENCY_VAULT_ADDRESS, vaultShare);
      await tx3.wait();
    }

    contributions.incrementSendCount(req.username);

    res.json({
      ok: true,
      internal: isInternal,
      recipient: targetLabel,
      sentAmount: ethers.formatUnits(recipientAmount, 18),
      fee: ethers.formatUnits(fee, 18),
      gasSponsored: !!(gasInfo && gasInfo.sponsored)
    });
  } catch (e) {
    if (e && e.code === 'GAS_TREASURY_EMPTY') return res.status(503).json({ error: e.message, code: e.code });
    const f = typeof friendlyChainError === 'function' ? friendlyChainError(e) : null;
    if (f) return res.status(400).json(f);
    res.status(500).json({ error: e.reason || e.message });
  }
});


// ---------- tBNB / native BNB transfer (out of custodial wallet) ----------
app.post('/api/transfer-bnb', authMiddleware, async (req, res) => {
  const { recipient, amount } = req.body || {};
  if (!recipient || amount === undefined || amount === null || amount === '') {
    return res.status(400).json({
      error: 'recipient ja amount vaaditaan.',
      errorEn: 'recipient and amount are required.'
    });
  }
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      error: 'Kelvollinen amount vaaditaan.',
      errorEn: 'A valid amount is required.'
    });
  }

  try {
    const myAddress = users.getWalletAddress(req.username);

    let targetAddress, targetLabel;
    if (ethers.isAddress(recipient)) {
      targetAddress = recipient;
      const isInternal = users.isInternalAddress(recipient);
      targetLabel = isInternal ? '@' + users.resolveUsernameByAddress(recipient) : recipient;
    } else {
      const resolvedAddress = users.getWalletAddress(recipient);
      if (!resolvedAddress) {
        return res.status(400).json({
          error: 'Käyttäjänimeä ei löydy.',
          errorEn: 'Username not found.'
        });
      }
      targetAddress = resolvedAddress;
      targetLabel = '@' + recipient.trim().toLowerCase();
    }

    if (targetAddress.toLowerCase() === myAddress.toLowerCase()) {
      return res.status(400).json({
        error: 'Et voi lähettää samaan Helion-osoitteeseen. Käytä omaa MetaMask-osoitettasi tai toista vastaanottajaa.',
        errorEn: 'Cannot send to the same Helion address. Use your MetaMask address or another recipient.'
      });
    }

    const signer = getSigner(req.username, provider);
    const balance = await provider.getBalance(myAddress);
    const amountWei = ethers.parseEther(String(amount));

    // Reserve gas so the wallet is not emptied of all BNB mid-tx
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || ethers.parseUnits('3', 'gwei');
    const gasLimit = 21000n;
    const gasCost = gasPrice * gasLimit * 12n / 10n; // +20% buffer
    const totalNeeded = amountWei + gasCost;

    if (balance < totalNeeded) {
      const maxSend = balance > gasCost ? balance - gasCost : 0n;
      return res.status(400).json({
        error:
          'Ei tarpeeksi tBNB:tä (tarvitaan määrä + gas). Max noin ' +
          ethers.formatEther(maxSend) +
          ' tBNB.',
        errorEn:
          'Not enough tBNB (amount + gas required). Max about ' +
          ethers.formatEther(maxSend) +
          ' tBNB.',
        maxSendable: ethers.formatEther(maxSend)
      });
    }

    const tx = await signer.sendTransaction({
      to: targetAddress,
      value: amountWei,
      gasLimit
    });
    await tx.wait();

    contributions.incrementSendCount(req.username);

    res.json({
      ok: true,
      recipient: targetLabel,
      sentAmount: ethers.formatEther(amountWei),
      txHash: tx.hash,
      asset: 'tBNB'
    });
  } catch (e) {
    const f = typeof friendlyChainError === 'function' ? friendlyChainError(e) : null;
    if (f && f.code === 'INSUFFICIENT_GAS') {
      return res.status(400).json(f);
    }
    res.status(500).json({ error: (e && (e.reason || e.message)) || String(e) });
  }
});

// ---------- STAKING ----------
app.get('/api/staking/tiers', async (req, res) => {
  try {
    const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
    const count = await staking.tiersCount();
    const tiers = [];
    for (let i = 0; i < count; i++) {
      const t = await staking.tiers(i);
      tiers.push({
        id: i,
        name: TIER_NAMES[i] || `Taso ${i}`,
        lockDurationDays: Number(t.lockDuration) / 86400,
        minStake: ethers.formatUnits(t.minStake, 18),
        rewardPct: Number(t.rewardBps) / 100,
        active: t.active
      });
    }
    res.json({ tiers });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/staking/positions', authMiddleware, async (req, res) => {
  try {
    const address = users.getWalletAddress(req.username);
    const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
    const positions = await staking.getUserStakes(address);
    const now = Math.floor(Date.now() / 1000);
    const result = positions.map((p, idx) => ({
      index: idx,
      amount: ethers.formatUnits(p.amount, 18),
      withdrawn: p.withdrawn,
      unlocksAt: Number(p.startTime) + Number(p.lockDuration),
      ready: !p.withdrawn && now >= (Number(p.startTime) + Number(p.lockDuration)),
      rewardPct: Number(p.rewardBps) / 100
    }));
    res.json({ positions: result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/staking/stake', authMiddleware, async (req, res) => {
  const { tierId, amount } = req.body || {};
  if (tierId === undefined || !amount) return res.status(400).json({ error: 'tierId ja amount vaaditaan.' });
  try {
    const signer = getSigner(req.username, provider);
    const address = signer.address;
    if (typeof users.setWalletAddress === 'function') {
      const stored = users.getWalletAddress(req.username);
      if (!stored || String(stored).toLowerCase() !== address.toLowerCase()) {
        users.setWalletAddress(req.username, address);
      }
    }
    const amountRaw = ethers.parseUnits(String(amount), 18);
    const helToken = new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, provider);
    const balance = await helToken.balanceOf(address);
    if (balance < amountRaw) return res.status(400).json({ error: 'Ei tarpeeksi HEL:iä tällä lompakolla (signer).' });
    await ensureSponsoredGas(signer.address, 'stake');
    await ensureApproval(signer, HEL_ADDRESS, STAKING_ADDRESS, amountRaw);

    const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
    const tx = await staking.stake(tierId, amountRaw);
    await tx.wait();

    contributions.addStakeVolume(req.username, parseFloat(amount));

    res.json({ ok: true });
  } catch (e) {
    const f = friendlyChainError(e);
    res.status(400).json(f);
  }
});

app.post('/api/staking/withdraw', authMiddleware, async (req, res) => {
  const { stakeIndex } = req.body || {};
  try {
    const address = users.getWalletAddress(req.username);
    const signer = getSigner(req.username, provider);
    await ensureSponsoredGas(signer.address, 'stake-withdraw');
    const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
    const tx = await staking.withdraw(stakeIndex);
    await tx.wait();
    res.json({ ok: true });
  } catch (e) {
    const f = friendlyChainError(e);
    res.status(400).json(f);
  }
});

app.post('/api/staking/early-withdraw', authMiddleware, async (req, res) => {
  const { stakeIndex } = req.body || {};
  try {
    const address = users.getWalletAddress(req.username);
    const signer = getSigner(req.username, provider);
    await ensureSponsoredGas(signer.address, 'stake-early-withdraw');
    const staking = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
    const tx = await staking.earlyWithdraw(stakeIndex);
    await tx.wait();
    res.json({ ok: true });
  } catch (e) {
    const f = friendlyChainError(e);
    res.status(400).json(f);
  }
});

// ---------- Chain error → user-facing message ----------
function friendlyChainError(e) {
  const raw = String(
    (e && (e.shortMessage || e.reason || (e.info && e.info.error && e.info.error.message) || e.message)) || e
  );
  const low = raw.toLowerCase();
  const code = e && e.code;
  if (
    code === 'INSUFFICIENT_FUNDS' ||
    low.includes('insufficient funds') ||
    low.includes('insufficient fund') ||
    low.includes('overshot') ||
    (low.includes('gas') && low.includes('balance 0'))
  ) {
    return {
      error:
        'tBNB-varat vähissä. Helion-lompakossa ei ole tarpeeksi BNB:tä gas-maksuun. Hae faucetista tBNB ja siirrä se custodial-lompakkoosi (osoite Wallet-sivulla).',
      errorEn:
        'Low tBNB. Your Helion wallet does not have enough BNB for gas. Get tBNB from a faucet and send it to your custodial address (shown on the Wallet page).',
      code: 'INSUFFICIENT_GAS',
      guidePath: 'guide.html#tbnb'
    };
  }
  return { error: raw };
}

// ---------- MINER ----------
app.get('/api/miner/emission', (req, res) => {
  res.json(minerEmission.getEmission());
});

app.get('/api/miner/status', authMiddleware, async (req, res) => {
  if (!MINER_ADDRESS) return res.status(500).json({ error: 'MINER_ADDRESS ei ole asetettu palvelimella.' });
  try {
    const address = users.getWalletAddress(req.username);
    const miner = new ethers.Contract(MINER_ADDRESS, MINER_ABI, provider);
    const miningEndTime = Number(await miner.miningEndTime(address));
    const rewardPerCycle = await miner.rewardPerCycle();
    const totalMined = await miner.totalMined(address);
    const emission = minerEmission.getEmission();
    res.json({
      miningEndTime,
      rewardPerCycle: ethers.formatUnits(rewardPerCycle, 18),
      totalMined: ethers.formatUnits(totalMined, 18),
      emission
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/miner/activate', authMiddleware, async (req, res) => {
  if (!MINER_ADDRESS) return res.status(500).json({ error: 'MINER_ADDRESS ei ole asetettu palvelimella.' });
  try {
    const address = users.getWalletAddress(req.username) || resolveCustodialAddress(req.username);
    const signer = getSigner(req.username, provider);
    const gasInfo = await ensureSponsoredGas(signer.address, 'miner-activate');
    const miner = new ethers.Contract(MINER_ADDRESS, MINER_ABI, signer);
    const tx = await miner.activateMining();
    await tx.wait();

    contributions.incrementMineCount(req.username);
    contributions.addMineEvent(req.username, { type: 'activate', txHash: tx.hash });

    res.json({ ok: true, txHash: tx.hash, gasSponsored: !!(gasInfo && gasInfo.sponsored) });
  } catch (e) {
    if (e && e.code === 'GAS_TREASURY_EMPTY') return res.status(503).json({ error: e.message, code: e.code });
    const f = friendlyChainError(e);
    res.status(400).json(f);
  }
});

app.post('/api/miner/claim', authMiddleware, async (req, res) => {
  if (!MINER_ADDRESS) return res.status(500).json({ error: 'MINER_ADDRESS ei ole asetettu palvelimella.' });
  try {
    const address = users.getWalletAddress(req.username) || resolveCustodialAddress(req.username);
    const signer = getSigner(req.username, provider);
    const gasInfo = await ensureSponsoredGas(signer.address, 'miner-claim');
    const miner = new ethers.Contract(MINER_ADDRESS, MINER_ABI, signer);
    const tx = await miner.claim();
    await tx.wait();
    contributions.addMineEvent(req.username, { type: 'claim', txHash: tx.hash });
    res.json({ ok: true, txHash: tx.hash, gasSponsored: !!(gasInfo && gasInfo.sponsored) });
  } catch (e) {
    if (e && e.code === 'GAS_TREASURY_EMPTY') return res.status(503).json({ error: e.message, code: e.code });
    const f = friendlyChainError(e);
    res.status(400).json(f);
  }
});

app.get('/api/miner/history', authMiddleware, (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const history = contributions.getMineHistory(req.username, limit);
    res.json({ history, explorer: 'https://testnet.bscscan.com/tx/' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- TRADING ----------
async function getPairAddress() {
  const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
  return await factory.getPair(HEL_ADDRESS, WBNB_ADDRESS);
}

async function getHelionPair() {
  const p = HELION_PAIR_ADDRESS || await getPairAddress();
  if (!p || p === ethers.ZeroAddress) return null;
  return p;
}

async function getPoolPrice() {
  const pairAddr = await getHelionPair();
  if (!pairAddr) return null;
  const { reserveHel, reserveBnb } = await swapRoutes.readReserves(provider, pairAddr, HEL_ADDRESS);
  const hel = Number(ethers.formatUnits(reserveHel, 18));
  const bnb = Number(ethers.formatUnits(reserveBnb, 18));
  if (!(hel > 0) || !(bnb > 0)) return null;
  const mid = bnb / hel;
  return {
    pair: pairAddr,
    reserveHel: hel,
    reserveBnb: bnb,
    mid,
    bid: mid,
    ask: mid,
    source: 'helion_pool'
  };
}

function bnbInForHelOut(reserveBnb, reserveHel, helOut, feeBps = 30n) {
  const fee = 10000n - feeBps;
  if (helOut <= 0n || helOut >= reserveHel) return null;
  const num = reserveBnb * helOut * 10000n;
  const den = (reserveHel - helOut) * fee;
  return num / den + 1n;
}

async function executePoolSwap({ side, qtyHel }) {
  const pairAddr = await getHelionPair();
  if (!pairAddr) throw new Error('Helion-poolia ei löydy');
  const { reserveHel, reserveBnb } = await swapRoutes.readReserves(provider, pairAddr, HEL_ADDRESS);
  const helWei = ethers.parseUnits(Number(qtyHel).toFixed(18), 18);
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, treasury);
  const to = treasury.address;

  if (side === 'BUY') {
    const bnbIn = bnbInForHelOut(reserveBnb, reserveHel, helWei, POOL_SWAP_FEE_BPS);
    if (!bnbIn) throw new Error('Pool ei riitä tähän HEL-määrään');
    const minOut = helWei * 97n / 100n;
    const bal = await provider.getBalance(to);
    if (bal < bnbIn) throw new Error('Treasury BNB ei riitä pool-täyttöön');
    const tx = await router.swapExactETHForTokens(
      minOut, [WBNB_ADDRESS, HEL_ADDRESS], to, deadline(), { value: bnbIn }
    );
    const rec = await tx.wait();
    return {
      txHash: tx.hash,
      spentBnb: Number(ethers.formatUnits(bnbIn, 18)),
      recvHel: Number(qtyHel),
      spentHel: 0,
      recvBnb: 0,
      price: Number(ethers.formatUnits(bnbIn, 18)) / Number(qtyHel),
      gas: rec?.gasUsed?.toString()
    };
  }

  const helBal = await new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, provider).balanceOf(to);
  if (helBal < helWei) throw new Error('Treasury HEL ei riitä pool-täyttöön');
  await ensureApproval(treasury, HEL_ADDRESS, ROUTER_ADDRESS, helWei);
  const minBnb = 0n;
  const tx = await router.swapExactTokensForETH(
    helWei, minBnb, [HEL_ADDRESS, WBNB_ADDRESS], to, deadline()
  );
  await tx.wait();
  const q = swapRoutes.quoteReserves('hel_to_bnb', helWei, reserveHel, reserveBnb, POOL_SWAP_FEE_BPS);
  const recvBnb = Number(ethers.formatUnits(q.amountOut, 18));
  return {
    txHash: tx.hash,
    spentHel: Number(qtyHel),
    recvBnb,
    spentBnb: 0,
    recvHel: 0,
    price: recvBnb / Number(qtyHel)
  };
}

async function simulatePoolSwap({ side, qtyHel }) {
  const pairAddr = await getHelionPair();
  if (!pairAddr) throw new Error('Helion-poolia ei löydy');
  const { reserveHel, reserveBnb } = await swapRoutes.readReserves(provider, pairAddr, HEL_ADDRESS);
  const helWei = ethers.parseUnits(Number(qtyHel).toFixed(18), 18);
  if (side === 'BUY') {
    const bnbIn = bnbInForHelOut(reserveBnb, reserveHel, helWei, POOL_SWAP_FEE_BPS);
    if (!bnbIn) throw new Error('Pool ei riitä tähän HEL-määrään');
    const spentBnb = Number(ethers.formatUnits(bnbIn, 18));
    return { spentBnb, recvHel: Number(qtyHel), spentHel: 0, recvBnb: 0, price: spentBnb / Number(qtyHel), simulated: true };
  }
  const q = swapRoutes.quoteReserves('hel_to_bnb', helWei, reserveHel, reserveBnb, POOL_SWAP_FEE_BPS);
  const recvBnb = Number(ethers.formatUnits(q.amountOut, 18));
  if (!(recvBnb > 0)) throw new Error('Pool-quote epäonnistui');
  return { spentHel: Number(qtyHel), recvBnb, spentBnb: 0, recvHel: 0, price: recvBnb / Number(qtyHel), simulated: true };
}

app.get('/api/trading/pool', async (req, res) => {
  try {
    const pairAddr = HELION_PAIR_ADDRESS || await getPairAddress();
    if (!pairAddr || pairAddr === '0x0000000000000000000000000000000000000000') {
      return res.json({ exists: false, venue: 'helion', pancakeRouter: ROUTER_ADDRESS });
    }
    const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
    const [r0, r1] = await pair.getReserves();
    const token0 = await pair.token0();
    const [helReserve, bnbReserve] = token0.toLowerCase() === HEL_ADDRESS.toLowerCase() ? [r0, r1] : [r1, r0];
    res.json({
      exists: true,
      venue: 'helion',
      pair: pairAddr,
      helReserve: ethers.formatUnits(helReserve, 18),
      bnbReserve: ethers.formatUnits(bnbReserve, 18),
      pancakeRouter: ROUTER_ADDRESS,
      swapPrefer: SWAP_PREFER,
      platformFeeBps: Number(TRADING_FEE_BPS)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// direction: 'buy' = TBNB -> HEL, 'sell' = HEL -> TBNB
// Routes: Helion own pool (preferred) + Pancake backup
app.get('/api/trading/quote', async (req, res) => {
  const { direction, amount } = req.query;
  if (!direction || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'direction ja kelvollinen amount vaaditaan.' });
  }
  if (direction !== 'buy' && direction !== 'sell') {
    return res.status(400).json({ error: 'direction täytyy olla "buy" tai "sell".' });
  }
  try {
    const amountIn = ethers.parseUnits(amount, 18);
    const fee = (amountIn * TRADING_FEE_BPS) / 10000n;
    const amountInAfterFee = amountIn - fee;
    const dirPool = direction === 'buy' ? 'bnb_to_hel' : 'hel_to_bnb';
    const routes = [];

    // --- Helion pool (own pair reserves) ---
    let helionPair = HELION_PAIR_ADDRESS;
    if (!helionPair) {
      try { helionPair = await getPairAddress(); } catch (_) { helionPair = null; }
    }
    if (helionPair && helionPair !== '0x0000000000000000000000000000000000000000') {
      try {
        const { reserveHel, reserveBnb } = await swapRoutes.readReserves(provider, helionPair, HEL_ADDRESS);
        const q = swapRoutes.quoteReserves(dirPool, amountInAfterFee, reserveHel, reserveBnb, POOL_SWAP_FEE_BPS);
        routes.push({
          venue: 'helion',
          ok: q.amountOut > 0n,
          amountOut: q.amountOut,
          amountOutFmt: ethers.formatUnits(q.amountOut, 18),
          pair: helionPair,
          note: 'Own pool'
        });
      } catch (e) {
        routes.push({ venue: 'helion', ok: false, amountOut: 0n, amountOutFmt: '0', error: e.message });
      }
    }

    // --- Pancake router (backup) ---
    try {
      const path = direction === 'buy' ? [WBNB_ADDRESS, HEL_ADDRESS] : [HEL_ADDRESS, WBNB_ADDRESS];
      const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
      const amounts = await router.getAmountsOut(amountInAfterFee, path);
      const amountOut = amounts[amounts.length - 1];
      routes.push({
        venue: 'pancake',
        ok: amountOut > 0n,
        amountOut,
        amountOutFmt: ethers.formatUnits(amountOut, 18),
        router: ROUTER_ADDRESS,
        note: 'PancakeSwap backup'
      });
    } catch (e) {
      routes.push({ venue: 'pancake', ok: false, amountOut: 0n, amountOutFmt: '0', error: e.message });
    }

    const prefer = String(req.query.prefer || SWAP_PREFER).toLowerCase();
    const best = swapRoutes.pickRoute(routes, prefer);
    if (!best) {
      return res.status(400).json({ error: 'Ei likviditeettiä (helion eikä pancake).', routes: routes.map(r => ({ venue: r.venue, ok: r.ok, error: r.error })) });
    }

    res.json({
      fee: ethers.formatUnits(fee, 18),
      amountInAfterFee: ethers.formatUnits(amountInAfterFee, 18),
      amountOut: best.amountOutFmt,
      venue: best.venue,
      prefer,
      routes: routes.map(r => ({
        venue: r.venue,
        ok: r.ok,
        amountOut: r.amountOutFmt,
        note: r.note,
        error: r.error || null
      })),
      independent: true
    });
  } catch (e) {
    res.status(500).json({ error: 'Quote-virhe: ' + e.message });
  }
});

app.post('/api/trading/swap', authMiddleware, async (req, res) => {
  const { direction, amount, minAmountOut } = req.body || {};
  if (!direction || !amount) return res.status(400).json({ error: 'direction ja amount vaaditaan.' });
  if (direction !== 'buy' && direction !== 'sell') {
    return res.status(400).json({ error: 'direction täytyy olla "buy" tai "sell".' });
  }

  try {
    const address = users.getWalletAddress(req.username);
    const signer = getSigner(req.username, provider);
    const amountIn = ethers.parseUnits(String(amount), 18);
    const fee = (amountIn * TRADING_FEE_BPS) / 10000n;
    const stakingShare = fee / 2n;
    const vaultShare = fee - stakingShare;
    const amountInAfterFee = amountIn - fee;
    const minOut = minAmountOut ? ethers.parseUnits(String(minAmountOut), 18) : 0n;
    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);

    if (direction === 'buy') {
      const bnbBal = await provider.getBalance(address);
      if (bnbBal < amountIn) return res.status(400).json({ error: 'Ei tarpeeksi tBNB:tä.' });

      const feeTx1 = await signer.sendTransaction({ to: STAKING_FEE_ADDRESS, value: stakingShare });
      await feeTx1.wait();
      const feeTx2 = await signer.sendTransaction({ to: EMERGENCY_VAULT_ADDRESS, value: vaultShare });
      await feeTx2.wait();

      const tx = await router.swapExactETHForTokens(
        minOut, [WBNB_ADDRESS, HEL_ADDRESS], address, deadline(), { value: amountInAfterFee }
      );
      await tx.wait();
    } else {
      const helToken = new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, provider);
      const helBal = await helToken.balanceOf(address);
      if (helBal < amountIn) return res.status(400).json({ error: 'Ei tarpeeksi HEL:iä.' });

      await ensureApproval(signer, HEL_ADDRESS, ROUTER_ADDRESS, amountInAfterFee);
      const helWithSigner = helToken.connect(signer);
      const feeTx1 = await helWithSigner.transfer(STAKING_FEE_ADDRESS, stakingShare);
      await feeTx1.wait();
      const feeTx2 = await helWithSigner.transfer(EMERGENCY_VAULT_ADDRESS, vaultShare);
      await feeTx2.wait();

      const tx = await router.swapExactTokensForETH(
        amountInAfterFee, minOut, [HEL_ADDRESS, WBNB_ADDRESS], address, deadline()
      );
      await tx.wait();
    }

    contributions.incrementTradeCount(req.username);
    res.json({ ok: true, fee: ethers.formatUnits(fee, 18) });
  } catch (e) { res.status(500).json({ error: e.reason || e.message }); }
});



app.post('/api/trading/add-liquidity', authMiddleware, async (req, res) => {
  const { helAmount, bnbAmount } = req.body || {};
  if (!helAmount || !bnbAmount) return res.status(400).json({ error: 'helAmount ja bnbAmount vaaditaan.' });
  try {
    const address = users.getWalletAddress(req.username);
    const signer = getSigner(req.username, provider);
    const helAmountRaw = ethers.parseUnits(String(helAmount), 18);
    const bnbAmountRaw = ethers.parseUnits(String(bnbAmount), 18);

    await ensureApproval(signer, HEL_ADDRESS, ROUTER_ADDRESS, helAmountRaw);

    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
    const tx = await router.addLiquidityETH(HEL_ADDRESS, helAmountRaw, 0, 0, address, deadline(), { value: bnbAmountRaw });
    await tx.wait();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.reason || e.message }); }
});

app.post('/api/trading/remove-liquidity', authMiddleware, async (req, res) => {
  const { lpAmount } = req.body || {};
  if (!lpAmount) return res.status(400).json({ error: 'lpAmount vaaditaan.' });
  try {
    const address = users.getWalletAddress(req.username);
    const signer = getSigner(req.username, provider);
    const pairAddr = await getPairAddress();
    if (pairAddr === '0x0000000000000000000000000000000000000000') return res.status(400).json({ error: 'Paria ei löydy.' });

    const lpAmountRaw = ethers.parseUnits(String(lpAmount), 18);
    await ensureApproval(signer, pairAddr, ROUTER_ADDRESS, lpAmountRaw);

    const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
    const tx = await router.removeLiquidityETH(HEL_ADDRESS, lpAmountRaw, 0, 0, address, deadline());
    await tx.wait();
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.reason || e.message }); }
});

app.get('/api/trading/lp-balance', authMiddleware, async (req, res) => {
  try {
    const address = users.getWalletAddress(req.username);
    const pairAddr = await getPairAddress();
    if (pairAddr === '0x0000000000000000000000000000000000000000') return res.json({ balance: '0' });
    const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
    const bal = await pair.balanceOf(address);
    res.json({ balance: ethers.formatUnits(bal, 18) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- PRICES ----------
// tBNB ≈ oikea BNB-hinta, HEL poolista
let cachedBnbPrice = null;
let cachedBnbPriceAt = 0;
const BNB_PRICE_TTL_MS = 60 * 1000; // 1 min cache

async function fetchBnbUsd() {
  if (cachedBnbPrice !== null && Date.now() - cachedBnbPriceAt < BNB_PRICE_TTL_MS) {
    return cachedBnbPrice;
  }

  // 1) Public BNB/USD price feed
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT');
    const data = await res.json();
    const price = parseFloat(data?.price);
    if (price > 0) {
      cachedBnbPrice = price;
      cachedBnbPriceAt = Date.now();
      return price;
    }
  } catch (e) {
    console.warn('BNB price feed failed:', e.message);
  }

  // 2) CoinGecko fallback
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
    const data = await res.json();
    const price = data?.binancecoin?.usd;
    if (typeof price === 'number' && price > 0) {
      cachedBnbPrice = price;
      cachedBnbPriceAt = Date.now();
      return price;
    }
  } catch (e) {
    console.warn('CoinGecko BNB-hinta epäonnistui:', e.message);
  }

  return cachedBnbPrice || 0;
}

app.get('/api/prices', async (req, res) => {
  try {
    const bnbUsd = await fetchBnbUsd();
    let helUsd = 0;
    let helPerBnb = 0;
    let poolExists = false;
    let helReserve = 0;
    let bnbReserve = 0;

    try {
      const pairAddr = await getPairAddress();
      if (pairAddr && pairAddr !== '0x0000000000000000000000000000000000000000') {
        const pair = new ethers.Contract(pairAddr, PAIR_ABI, provider);
        const [r0, r1] = await pair.getReserves();
        const token0 = await pair.token0();
        const [helR, bnbR] = token0.toLowerCase() === HEL_ADDRESS.toLowerCase()
          ? [r0, r1]
          : [r1, r0];
        helReserve = Number(ethers.formatUnits(helR, 18));
        bnbReserve = Number(ethers.formatUnits(bnbR, 18));
        if (helReserve > 0 && bnbReserve > 0) {
          // 1 HEL = (bnbReserve / helReserve) BNB
          helPerBnb = bnbReserve / helReserve;
          helUsd = helPerBnb * bnbUsd;
          poolExists = true;
        }
      }
    } catch (e) {
      console.warn('Pool-hinnan lasku epäonnistui:', e.message);
    }

    try {
      priceHistory.pushSample({ helUsd, bnbUsd, helPerBnb });
    } catch (e) {
      console.warn('[priceHistory]', e.message);
    }

    let change24h = null;
    try {
      const series = priceHistory.getPoints('24h');
      if (series.length >= 2) {
        const first = series[0];
        const last = series[series.length - 1];
        if (first.helUsd > 0) {
          change24h = {
            helUsdPct: ((last.helUsd - first.helUsd) / first.helUsd) * 100,
            bnbUsdPct: first.bnbUsd > 0 ? ((last.bnbUsd - first.bnbUsd) / first.bnbUsd) * 100 : null,
            helUsdFrom: first.helUsd,
            helUsdTo: last.helUsd
          };
        }
      }
    } catch (_) {}

    res.json({
      bnbUsd,
      helUsd,
      helPerBnb,
      poolExists,
      helReserve,
      bnbReserve,
      change24h,
      updatedAt: Date.now()
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});





// ---------- PRICE / PORTFOLIO ANALYTICS ----------
app.get('/api/prices/history', async (req, res) => {
  try {
    const range = String(req.query.range || '1d');
    const max = Math.min(500, Math.max(50, Number(req.query.max) || 300));
    // ensure a fresh sample so charts aren't empty on first visit
    try {
      const bnbUsd = await fetchBnbUsd();
      let helUsd = 0, helPerBnb = 0;
      try {
        const pool = await getPoolPrice().catch(() => null);
        if (pool && pool.mid > 0) {
          helPerBnb = pool.mid;
          helUsd = pool.mid * bnbUsd;
        }
      } catch (_) {}
      priceHistory.pushSample({ helUsd, bnbUsd, helPerBnb });
    } catch (_) {}
    res.json(priceHistory.chartSeries(range, max));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/prices/stats', (req, res) => {
  try {
    res.json(priceHistory.stats());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/wallet/performance', authMiddleware, async (req, res) => {
  try {
    const range = String(req.query.range || '24h');
    const address = users.getWalletAddress(req.username);
    let hel = 0, bnb = 0, usdc = 0;
    if (address) {
      const helToken = new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, provider);
      hel = Number(ethers.formatUnits(await helToken.balanceOf(address), 18));
      bnb = Number(ethers.formatEther(await provider.getBalance(address)));
    }
    try {
      if (typeof balances !== 'undefined' && balances.getUsdc) {
        usdc = Number(balances.getUsdc(req.username)) || 0;
      } else {
        const balMod = require('./balances');
        usdc = Number(balMod.getUsdc(req.username)) || 0;
      }
    } catch (_) {
      try {
        const balMod = require('./balances');
        usdc = Number(balMod.getUsdc && balMod.getUsdc(req.username)) || 0;
      } catch (_) {}
    }
    // also include spot balances if available
    try {
      const spot = spotEngine.balances(req.username);
      if (spot) {
        hel += Number(spot.HEL || 0) + Number(spot.HEL_LOCKED || 0);
        bnb += Number(spot.BNB || 0) + Number(spot.BNB_LOCKED || 0);
        usdc += Number(spot.USDC || 0) + Number(spot.USDC_LOCKED || 0);
      }
    } catch (_) {}

    // refresh sample
    try {
      const bnbUsd = await fetchBnbUsd();
      let helUsd = 0, helPerBnb = 0;
      const pool = await getPoolPrice().catch(() => null);
      if (pool && pool.mid > 0) {
        helPerBnb = pool.mid;
        helUsd = pool.mid * bnbUsd;
      }
      priceHistory.pushSample({ helUsd, bnbUsd, helPerBnb });
    } catch (_) {}

    const perf = priceHistory.portfolioPerformance({ HEL: hel, BNB: bnb, USDC: usdc }, range);
    res.json(perf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- SPOT: HEL/BNB book on top of Helion AMM pool ----------

app.get('/api/spot/ticker', async (req, res) => {
  try {
    const pool = await getPoolPrice().catch(() => null);
    const book = spotEngine.getOrderBook(5);
    const bestBid = book.bids[0]?.price;
    const bestAsk = book.asks[0]?.price;
    const refMid = resolveSpotMid(pool?.mid);
    // Prefer book mid only if prices are in the same order of magnitude as USDC mid (avoid leftover BNB-priced orders)
    let mid = refMid;
    if (bestBid && bestAsk) {
      const bookMid = (bestBid + bestAsk) / 2;
      if (spotEngine.QUOTE !== 'USDC' || (bookMid > refMid * 0.1 && bookMid < refMid * 10)) {
        mid = bookMid;
      }
    }
    res.json({
      symbol: spotEngine.SYMBOL,
      quote: spotEngine.QUOTE,
      price: mid,
      bid: bestBid || null,
      ask: bestAsk || null,
      refMid,
      pool: pool
        ? { mid: pool.mid, reserveHel: pool.reserveHel, reserveBnb: pool.reserveBnb, pair: pool.pair, source: pool.source }
        : null,
      oracle: {
        price: refMid,
        source: spotEngine.QUOTE === 'USDC' ? 'SPOT_USDC_MID' : 'helion_pool'
      },
      engine: spotEngine.QUOTE === 'USDC' ? 'hel_usdc_book' : 'helion_pool_hybrid'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/spot/depth', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 15, 50);
    const book = spotEngine.getOrderBook(limit);
    const pool = await getPoolPrice().catch(() => null);
    res.json({
      ...book,
      poolMid: resolveSpotMid(pool?.mid) || null,
      quote: spotEngine.QUOTE,
      source: spotEngine.QUOTE === 'USDC' ? 'hel_usdc_book' : 'helion_book+pool'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/spot/account', authMiddleware, async (req, res) => {
  try {
    spotEngine.ensureAccount(req.username);
    const bal = spotEngine.balances(req.username);
    const pool = await getPoolPrice().catch(() => null);
    const ref = pool?.mid || 0;
    res.json({
      balances: bal,
      equity: spotEngine.equity(bal, ref),
      helBnbPrice: ref,
      openOrders: spotEngine.openOrders(req.username),
      makerFee: spotEngine.MAKER_FEE,
      takerFee: spotEngine.TAKER_FEE,
      mode: 'helion_pool_hybrid',
      symbol: spotEngine.SYMBOL,
      quote: spotEngine.QUOTE,
      initial: spotEngine.INITIAL,
      pool: pool ? { mid: pool.mid, reserveHel: pool.reserveHel, reserveBnb: pool.reserveBnb } : null,
      bridge: {
        depositAssets: ['tBNB', 'HEL'],
        withdrawTo: ['tBNB', 'HEL'],
        note: 'Spot ledger is HEL + BNB. Market leftover fills against the Helion AMM pool.'
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ---------- Mock USDC (book only, not on-chain) ----------
app.post('/api/faucet/usdc', authMiddleware, (req, res) => {
  try {
    const result = bookBalances.faucetUsdc(req.username);
    if (!result.ok) return res.status(429).json({ error: result.error });
    res.json({
      ok: true,
      amount: result.amount,
      usdcBalance: result.usdc,
      note: 'Mock USDC (testnet book only)'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** Move mock USDC wallet book → spot account (no chain) */
app.post('/api/spot/deposit-usdc', authMiddleware, (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!(amount > 0)) return res.status(400).json({ error: 'amount > 0 required' });
    bookBalances.debitUsdc(req.username, amount);
    try {
      spotEngine.credit(req.username, { USDC: amount });
    } catch (e) {
      bookBalances.creditUsdc(req.username, amount);
      throw e;
    }
    res.json({
      ok: true,
      deposited: { asset: 'USDC', amount },
      usdcBalance: bookBalances.getUsdc(req.username),
      spot: spotEngine.balances(req.username)
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** Move mock USDC spot → wallet book (unlocked only) */
app.post('/api/spot/withdraw-usdc', authMiddleware, (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!(amount > 0)) return res.status(400).json({ error: 'amount > 0 required' });
    const avail = spotEngine.availableUsdc(req.username);
    if (avail + 1e-12 < amount) {
      return res.status(400).json({ error: 'Insufficient unlocked spot USDC', available: avail });
    }
    spotEngine.debit(req.username, { USDC: amount });
    try {
      bookBalances.creditUsdc(req.username, amount);
    } catch (e) {
      spotEngine.credit(req.username, { USDC: amount });
      throw e;
    }
    res.json({
      ok: true,
      withdrawn: { asset: 'USDC', amount },
      usdcBalance: bookBalances.getUsdc(req.username),
      spot: spotEngine.balances(req.username)
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/spot/deposit', authMiddleware, async (req, res) => {
  try {
    const asset = String(req.body?.asset || '').toUpperCase();
    const amount = Number(req.body?.amount);
    if (!['TBNB', 'BNB', 'HEL', 'USDC'].includes(asset)) {
      return res.status(400).json({ error: 'asset must be tBNB, HEL or USDC' });
    }
    if (!(amount > 0)) return res.status(400).json({ error: 'amount > 0 required' });

    // Mock USDC: book → spot (no chain)
    if (asset === 'USDC') {
      bookBalances.debitUsdc(req.username, amount);
      try {
        spotEngine.credit(req.username, { USDC: amount });
      } catch (e) {
        bookBalances.creditUsdc(req.username, amount);
        throw e;
      }
      return res.json({
        ok: true,
        deposited: { asset: 'USDC', amount },
        txHash: null,
        usdcBalance: bookBalances.getUsdc(req.username),
        balances: spotEngine.balances(req.username)
      });
    }

    const signer = getSigner(req.username, provider);
    const address = signer.address;
    let txHash = null;

    if (asset === 'TBNB' || asset === 'BNB') {
      const value = ethers.parseEther(String(amount));
      const bal = await provider.getBalance(address);
      if (bal < value) return res.status(400).json({ error: 'Insufficient tBNB in custodial wallet' });
      const tx = await signer.sendTransaction({ to: treasury.address, value });
      await tx.wait();
      txHash = tx.hash;
      spotEngine.credit(req.username, { BNB: amount });
    } else {
      const helToken = new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, signer);
      const raw = ethers.parseUnits(String(amount), 18);
      const bal = await helToken.balanceOf(address);
      if (bal < raw) return res.status(400).json({ error: 'Insufficient HEL in custodial wallet' });
      const tx = await helToken.transfer(treasury.address, raw);
      await tx.wait();
      txHash = tx.hash;
      spotEngine.credit(req.username, { HEL: amount });
    }

    res.json({
      ok: true,
      deposited: { asset: asset === 'BNB' ? 'tBNB' : asset, amount },
      txHash,
      balances: spotEngine.balances(req.username)
    });
  } catch (e) {
    console.error('spot deposit', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/spot/withdraw', authMiddleware, async (req, res) => {
  try {
    const asset = String(req.body?.asset || req.body?.toAsset || 'tBNB').toUpperCase();
    const amount = Number(req.body?.amount);
    if (!(amount > 0)) return res.status(400).json({ error: 'amount > 0 required' });
    if (!['TBNB', 'BNB', 'HEL', 'USDC'].includes(asset)) {
      return res.status(400).json({ error: 'asset must be tBNB, HEL or USDC' });
    }

    if (asset === 'USDC') {
      const avail = spotEngine.availableUsdc(req.username);
      if (avail + 1e-12 < amount) {
        return res.status(400).json({ error: 'Insufficient unlocked spot USDC', available: avail });
      }
      spotEngine.debit(req.username, { USDC: amount });
      try {
        bookBalances.creditUsdc(req.username, amount);
      } catch (e) {
        spotEngine.credit(req.username, { USDC: amount });
        throw e;
      }
      return res.json({
        ok: true,
        withdrawn: { asset: 'USDC', amount },
        txHash: null,
        usdcBalance: bookBalances.getUsdc(req.username),
        balances: spotEngine.balances(req.username)
      });
    }

    const signer = getSigner(req.username, provider);
    const address = signer.address;
    let txHash = null;

    if (asset === 'TBNB' || asset === 'BNB') {
      spotEngine.debit(req.username, { BNB: amount });
      try {
        const value = ethers.parseEther(String(amount));
        const tBal = await provider.getBalance(treasury.address);
        if (tBal < value) throw new Error('Treasury tBNB insufficient');
        const tx = await treasury.sendTransaction({ to: address, value });
        await tx.wait();
        txHash = tx.hash;
      } catch (e) {
        spotEngine.credit(req.username, { BNB: amount });
        throw e;
      }
    } else {
      spotEngine.debit(req.username, { HEL: amount });
      try {
        const raw = ethers.parseUnits(String(amount), 18);
        const helTreasury = new ethers.Contract(HEL_ADDRESS, TOKEN_ABI, treasury);
        const tBal = await helTreasury.balanceOf(treasury.address);
        if (tBal < raw) throw new Error('Treasury HEL insufficient');
        const tx = await helTreasury.transfer(address, raw);
        await tx.wait();
        txHash = tx.hash;
      } catch (e) {
        spotEngine.credit(req.username, { HEL: amount });
        throw e;
      }
    }

    res.json({
      ok: true,
      withdrawn: { asset: asset === 'BNB' ? 'tBNB' : asset, amount },
      txHash,
      balances: spotEngine.balances(req.username)
    });
  } catch (e) {
    console.error('spot withdraw', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/spot/subaccount', authMiddleware, (req, res) => {
  try {
    res.json({ balances: spotEngine.balances(req.username), symbol: spotEngine.SYMBOL });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/spot/orders', authMiddleware, (req, res) => {
  res.json({ orders: spotEngine.openOrders(req.username) });
});

app.get('/api/spot/trades', authMiddleware, (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  res.json({ trades: spotEngine.userTrades(req.username, limit) });
});

app.get('/api/spot/recent-trades', (req, res) => {
  res.json({ trades: spotEngine.recentTrades(40) });
});

app.post('/api/spot/order', authMiddleware, async (req, res) => {
  try {
    const { side, type, quantity, price, stopPrice } = req.body || {};
    const tpe = String(type || 'LIMIT').toUpperCase();
    const pool = await getPoolPrice().catch(() => null);
    let poolMid = pool?.mid;
    if (spotEngine.QUOTE === 'USDC') {
      poolMid = Number(spotEngine.DEFAULT_MID) || Number(process.env.SPOT_USDC_MID || 0.01);
    }

    if (tpe === 'STOP_LIMIT' || tpe === 'STOP_MARKET') {
      const result = spotEngine.placeStopOrder(req.username, { side, type: tpe, quantity, price, stopPrice });
      if (poolMid) {
        await processTriggeredStops(poolMid);
      }
      return res.json({
        ...result,
        balances: spotEngine.balances(req.username)
      });
    }

    const result = spotEngine.placeOrder(req.username, {
      side, type: tpe, quantity, price, poolMid
    });

    if (result.poolRemaining > 0) {
      await fillSpotVsPool(req.username, result);
    }

    try {
      if (poolMid) await processTriggeredStops(poolMid);
    } catch (_) {}

    res.json({
      ...result,
      balances: spotEngine.balances(req.username),
      poolMid
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** Run stop triggers and complete any pool remainder for the stop owner (not the HTTP caller). */
async function processTriggeredStops(mid) {
  const trig = spotEngine.processStopOrders(mid);
  for (const t of trig) {
    if (t.result?.poolRemaining > 0) {
      const owner = t.result.user || t.user;
      if (owner) {
        await fillSpotVsPool(owner, t.result);
      } else {
        console.warn('[spot] stop pool fill skipped: missing owner', t.stopId);
      }
    }
  }
  return trig;
}

async function fillSpotVsPool(username, result) {
  const qty = result.poolRemaining;
  const side = result.side;
  try {
    let fill;
    try {
      fill = await executePoolSwap({ side, qtyHel: qty });
    } catch (chainErr) {
      console.warn('[spot] on-chain pool fill failed, simulate quote:', chainErr.message);
      fill = await simulatePoolSwap({ side, qtyHel: qty });
    }
    const trade = spotEngine.applyPoolFill(username, {
      side,
      spentBnb: fill.spentBnb,
      recvHel: fill.recvHel,
      spentHel: fill.spentHel,
      recvBnb: fill.recvBnb,
      price: fill.price,
      lockPrice: result.lockPrice || 0,
      intendedQty: qty
    });
    result.fills = [...(result.fills || []), trade];
    result.poolFill = fill;
    result.poolRemaining = 0;
    result.status = result.fills.length ? 'FILLED' : result.status;
  } catch (e) {
    spotEngine.unlockAfterPoolFail(username, side, qty, result.lockPrice);
    result.poolError = e.message;
    result.status = (result.fills && result.fills.length) ? 'PARTIALLY_FILLED' : 'REJECTED_POOL';
    result.poolRemaining = 0;
  }
}

app.delete('/api/spot/order/:id', authMiddleware, async (req, res) => {
  try {
    res.json(spotEngine.cancelOrder(req.username, req.params.id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/spot/reset', authMiddleware, (req, res) => {
  try {
    res.json({ ok: true, balances: spotEngine.resetAccount(req.username) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/spot/clear-book', authMiddleware, requireAdmin, (req, res) => {
  try {
    res.json(spotEngine.clearOrderBook());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/spot/seed', authMiddleware, async (req, res) => {
  if (req.username !== 'admin') return res.status(403).json({ error: 'Vain admin' });
  try {
    let mid = Number(req.body?.price);
    if (!mid) {
      const pool = await getPoolPrice().catch(() => null);
      mid = resolveSpotMid(pool?.mid);
    }
    res.json(spotEngine.seedAroundPrice(req.username, mid));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Process stop orders periodically; complete pool fills so locks are not left hanging
// Sample prices for charts (default every 60s)
setInterval(async () => {
  try {
    const bnbUsd = await fetchBnbUsd();
    let helUsd = 0, helPerBnb = 0;
    try {
      const pool = await getPoolPrice().catch(() => null);
      if (pool && pool.mid > 0) {
        helPerBnb = pool.mid;
        helUsd = pool.mid * bnbUsd;
      }
    } catch (_) {}
    priceHistory.pushSample({ helUsd, bnbUsd, helPerBnb });
  } catch (e) {
    console.warn('[priceHistory] sample', e.message);
  }
}, (priceHistory.SAMPLE_MS || 60000));

setInterval(async () => {
  try {
    let mid = null;
    try {
      const pool = await getPoolPrice().catch(() => null);
      mid = resolveSpotMid(pool?.mid);
    } catch (_) {}
    if (!mid) {
      const book = spotEngine.getOrderBook(1);
      if (book.bids[0] && book.asks[0]) mid = (book.bids[0].price + book.asks[0].price) / 2;
      else mid = book.bids[0]?.price || book.asks[0]?.price;
    }
    if (mid) await processTriggeredStops(mid);
  } catch (e) {
    console.warn('[spot] stop interval', e.message);
  }
}, 5000);

// ---------- SPOT MARKET MAKER ----------
function resolveSpotMid(poolMid) {
  if (spotEngine.QUOTE === 'USDC') {
    return Number(spotEngine.DEFAULT_MID) || Number(process.env.SPOT_USDC_MID || 0.01);
  }
  return Number(poolMid) || 0;
}

const spotMM = createSpotMarketMaker(spotEngine, {
  mmUser: process.env.SPOT_MM_USER || 'marketmaker',
  getMid: async () => {
    if (spotEngine.QUOTE === 'USDC') {
      const mid = resolveSpotMid(null);
      return { mid, bid: mid, ask: mid, source: 'SPOT_USDC_MID' };
    }
    const pool = await getPoolPrice();
    if (!pool) throw new Error('Helion pool mid unavailable');
    return { mid: pool.mid, bid: pool.mid, ask: pool.mid, source: 'helion_pool' };
  }
});

app.get('/api/spot/fees', authMiddleware, requireAdmin, (req, res) => {
  try {
    res.json(spotEngine.getFeeStats());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/spot/invariants', authMiddleware, requireAdmin, (req, res) => {
  try {
    res.json(spotEngine.checkInvariants());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/spot/mm/status', authMiddleware, requireAdmin, (req, res) => {
  try {
    res.json(spotMM.getStatus());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/spot/mm/start', authMiddleware, requireAdmin, async (req, res) => {
  try {
    res.json(await spotMM.start());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/spot/mm/stop', authMiddleware, requireAdmin, (req, res) => {
  try {
    res.json(spotMM.stop());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/spot/mm/config', authMiddleware, requireAdmin, async (req, res) => {
  try {
    spotMM.updateConfig(req.body || {});
    if (req.body && req.body.rebuild) {
      await spotMM.tick(true);
    }
    res.json(spotMM.getStatus());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ---------- GRID BOT (erillinen, ei sekoitu käyttäjiin) ----------
const gridBot = createGridBot({
  provider,
  helAddress: HEL_ADDRESS,
  wbnbAddress: WBNB_ADDRESS,
  routerAddress: ROUTER_ADDRESS,
  factoryAddress: FACTORY_ADDRESS,
  botPrivateKey: process.env.BOT_PRIVATE_KEY || TREASURY_PRIVATE_KEY,
  spacingPct: Number(process.env.GRID_SPACING_PCT || 8),
  gridsUp: Number(process.env.GRID_UP || 5),
  gridsDown: Number(process.env.GRID_DOWN || 5),
  orderBnb: Number(process.env.GRID_ORDER_BNB || 0.02),
  orderHel: Number(process.env.GRID_ORDER_HEL || 50),
  intervalSec: Number(process.env.GRID_INTERVAL_SEC || 30),
  maxSlippagePct: Number(process.env.GRID_MAX_SLIPPAGE_PCT || 4)
});

function requireAdmin(req, res, next) {
  if (req.username !== 'admin') {
    return res.status(403).json({ error: 'Vain admin.' });
  }
  next();
}

app.get('/api/grid/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    res.json(await gridBot.getStatus());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/grid/start', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const status = await gridBot.start();
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/grid/stop', authMiddleware, requireAdmin, async (req, res) => {
  try {
    res.json(gridBot.stop());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/grid/config', authMiddleware, requireAdmin, async (req, res) => {
  try {
    gridBot.updateConfig(req.body || {});
    if (req.body && req.body.rebuild) {
      res.json(await gridBot.rebuild());
    } else {
      res.json(await gridBot.getStatus());
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/grid/rebuild', authMiddleware, requireAdmin, async (req, res) => {
  try {
    res.json(await gridBot.rebuild());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------- CONTRIBUTION / LEADERBOARD ----------
app.get('/api/contribution', authMiddleware, (req, res) => {
  res.json(contributions.getStats(req.username));
});

app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  res.json({ leaderboard: contributions.getLeaderboard(limit) });
});

async function boot() {
  try {
    const st = await blobStore.init();
    if (typeof users.reload === 'function') users.reload();
    if (typeof contributions.reload === 'function') contributions.reload();
    if (typeof spotEngine.reload === 'function') spotEngine.reload();
    if (typeof getOrCreateWallet.reload === 'function') {}
    try { require('./wallet').reload(); } catch (_) {}
    console.log('[Helion] persist=' + (st.backend || blobStore.backend()));
  } catch (e) {
    console.error('[blobStore] init epäonnistui:', e.message);
    console.error('Käyttäjät eivät säily Renderissä ilman Upstash Redis -envä (UPSTASH_REDIS_REST_URL + TOKEN) tai levyä.');
  }
  setInterval(() => {
    try {
      const n = users.purgeExpiredUnverified();
      if (n) console.log('[users] purged unverified:', n);
    } catch (e) { console.warn('[users] purge', e.message); }
  }, 60 * 60 * 1000);
  try { users.purgeExpiredUnverified(); } catch (_) {}

  app.listen(PORT, async () => {
  console.log(`Helion Wallet API käynnissä portissa ${PORT}`);
  console.log('[Helion] DATA_DIR=' + DATA_DIR);
  console.log('[Helion] Swap: own pool preferred, Pancake backup · prefer=' + SWAP_PREFER);
  console.log('[Helion] Spot: HEL/BNB internal matching engine + MM');
  if (String(process.env.SPOT_MM_ENABLED || '').toLowerCase() === 'true') {
    try {
      await spotMM.start();
      console.log('Spot MM auto-start (SPOT_MM_ENABLED=true)');
    } catch (e) {
      console.warn('Spot MM auto-start epäonnistui:', e.message);
    }
  }
  if (String(process.env.GRID_ENABLED || '').toLowerCase() === 'true') {
    try {
      await gridBot.start();
      console.log('Grid-botti auto-start (GRID_ENABLED=true)');
    } catch (e) {
      console.warn('Grid-botin auto-start epäonnistui:', e.message);
    }
  } else {
    console.log('Grid-botti valmiina — käynnistä administa tai GRID_ENABLED=true');
  }
});
}

boot();
