/**
 * Helion swap routing — own pool preferred, Pancake as backup.
 * Own pool = HELION_PAIR_ADDRESS (or factory pair) quoted via constant-product;
 * Pancake = router.getAmountsOut on ROUTER_ADDRESS.
 */
const { ethers } = require('ethers');

const PAIR_ABI = [
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() view returns (address)',
  'function token1() view returns (address)'
];

/** UniswapV2-style amount out (feeBps e.g. 30 = 0.3%) */
function getAmountOut(amountIn, reserveIn, reserveOut, feeBps = 30n) {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const feeFactor = 10000n - feeBps;
  const amountInWithFee = amountIn * feeFactor;
  const num = amountInWithFee * reserveOut;
  const den = reserveIn * 10000n + amountInWithFee;
  return num / den;
}

async function readReserves(provider, pairAddress, helAddress) {
  const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
  const [r0, r1] = await pair.getReserves();
  const t0 = (await pair.token0()).toLowerCase();
  const hel = helAddress.toLowerCase();
  if (t0 === hel) {
    return { reserveHel: BigInt(r0), reserveBnb: BigInt(r1) };
  }
  return { reserveHel: BigInt(r1), reserveBnb: BigInt(r0) };
}

/**
 * Quote HEL<->BNB against a pair's reserves.
 * direction: 'hel_to_bnb' | 'bnb_to_hel'
 */
function quoteReserves(direction, amountInWei, reserveHel, reserveBnb, poolFeeBps = 30n) {
  if (direction === 'hel_to_bnb') {
    const out = getAmountOut(amountInWei, reserveHel, reserveBnb, poolFeeBps);
    return { amountOut: out, reserveIn: reserveHel, reserveOut: reserveBnb };
  }
  const out = getAmountOut(amountInWei, reserveBnb, reserveHel, poolFeeBps);
  return { amountOut: out, reserveIn: reserveBnb, reserveOut: reserveHel };
}

/**
 * Build route list and pick preferred.
 * prefer: 'helion' | 'pancake' | 'best'
 */
function pickRoute(routes, prefer = 'helion') {
  const usable = routes.filter(r => r.ok && r.amountOut > 0n);
  if (!usable.length) return null;
  if (prefer === 'best') {
    return usable.reduce((a, b) => (b.amountOut > a.amountOut ? b : a));
  }
  if (prefer === 'pancake') {
    return usable.find(r => r.venue === 'pancake') || usable[0];
  }
  // helion first, else best
  return usable.find(r => r.venue === 'helion') || usable.reduce((a, b) => (b.amountOut > a.amountOut ? b : a));
}

module.exports = {
  getAmountOut,
  readReserves,
  quoteReserves,
  pickRoute
};
