/**
 * Hybrid mining emission schedule (Helion v0.2)
 * - Base reward with time-based halvings
 * - Hard floor (min reward)
 * - Community bucket cap (18% of 100B) as informational limit for mainnet
 *
 * On-chain rewardPerCycle may still be fixed on testnet until contract upgrade.
 * API exposes both: chainReward + scheduled emission.
 */

const BASE_REWARD = Number(process.env.MINER_BASE_REWARD || 50);
const HALVING_DAYS = Number(process.env.MINER_HALVING_DAYS || 90);
const MIN_REWARD = Number(process.env.MINER_MIN_REWARD || 0.5);
const MAX_SUPPLY = 100_000_000_000;
const COMMUNITY_PCT = 0.18;
const COMMUNITY_BUCKET = MAX_SUPPLY * COMMUNITY_PCT;

function genesisMs() {
  const raw = (process.env.MINER_GENESIS_TS || '').trim();
  if (raw && !isNaN(Number(raw))) {
    const n = Number(raw);
    // allow seconds or ms
    return n < 1e12 ? n * 1000 : n;
  }
  // default: 2026-09-01 UTC (testnet schedule start)
  return Date.UTC(2026, 8, 1, 0, 0, 0);
}

function getEmission(now = Date.now()) {
  const genesis = genesisMs();
  const elapsedMs = Math.max(0, now - genesis);
  const elapsedDays = elapsedMs / 86400000;
  const epoch = Math.floor(elapsedDays / HALVING_DAYS);
  const scheduledReward = Math.max(MIN_REWARD, BASE_REWARD / Math.pow(2, epoch));
  const nextHalvingAt = genesis + (epoch + 1) * HALVING_DAYS * 86400000;
  const daysToHalving = Math.max(0, (nextHalvingAt - now) / 86400000);

  return {
    model: 'hybrid',
    baseReward: BASE_REWARD,
    epoch,
    scheduledReward: Number(scheduledReward.toFixed(6)),
    minReward: MIN_REWARD,
    halvingIntervalDays: HALVING_DAYS,
    genesisAt: new Date(genesis).toISOString(),
    nextHalvingAt: new Date(nextHalvingAt).toISOString(),
    daysToHalving: Number(daysToHalving.toFixed(2)),
    communityBucketHel: COMMUNITY_BUCKET,
    communityBucketPct: COMMUNITY_PCT * 100,
    note:
      'Hybrid: base reward halves every HALVING_DAYS; floor MIN_REWARD; mainnet capped by community bucket (18% of supply).'
  };
}

module.exports = { getEmission, BASE_REWARD, HALVING_DAYS, MIN_REWARD, COMMUNITY_BUCKET };
