# Helion (HEL) — Tokenomics v0.2

*Luonnos. Ei sijoitusneuvo. Testnet-mekaniikat voivat poiketa mainnet-parametreista.*

## Token

| | |
|--|--|
| Ticker | HEL |
| Network | BNB Smart Chain (Testnet nyt → Mainnet myöhemmin) |
| Max supply | **100 000 000 000** HEL (100 miljardia, kiinteä) |

## Allokaatio

| Osuus | % | Määrä (HEL) |
|-------|---|-------------|
| Staking rewards | 50 % | 50 000 000 000 |
| Community & mining | 18 % | 18 000 000 000 |
| Liquidity & market making | 10 % | 10 000 000 000 |
| Treasury / ecosystem | 10 % | 10 000 000 000 |
| Team | 7 % | 7 000 000 000 |
| Early / advisors | 3 % | 3 000 000 000 |
| **Yhteensä** | **100 %** | **100 000 000 000** |

### Vesting
- **Team:** 6 kk cliff + 18 kk lineaarinen (~24 kk)
- **Early / advisors:** 3 kk cliff + 12 kk lineaarinen

## Utility
- Mining (12 h sykli)
- Staking (tierit)
- Swap / (myöhemmin) Spot HEL–BNB
- Leaderboard-kontribuutio (pisteet ≠ token)

## Mining — hybrid emission
- **Base reward:** 50 HEL / sykli (konfiguroitavissa)
- **Halving:** 90 päivän epoch (palkkio × 0.5)
- **Floor:** 0.5 HEL / sykli
- **Mainnet-katto:** community-bucket 18 % supplysta — ei avointa minttiä yli allokaation
- Testnet: ketjusopimuksen `rewardPerCycle` voi vielä olla kiinteä kunnes kontrakti päivitetään; API palauttaa sekä ketju- että aikataulupalkkion

Kaava:
```text
epoch = floor(daysSinceGenesis / 90)
scheduledReward = max(0.5, 50 / 2^epoch)
```

## Feet (tBNB)
- Toiminnalliset feet maksetaan **tBNB:nä** (ei HEL)
- Suunnitelma: 50 % reward-treasuryyn → viikkojako contribution-rankingilla (#1 eniten, laskeva)
- 50 % operointi / muu treasury

## Staking-pool (50 %)
- Jaetaan usean vuoden aikana (ei kaikkea heti)
- Tuottoa voidaan täydentää fee-politiikalla myöhemmin

## Mitä v0.2 ei lukitse
- Lopullinen buyback/burn
- Governance-token erillisenä
- Spot-fee-jako mainnetissä
