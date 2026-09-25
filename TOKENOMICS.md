# Helion (HEL) — Tokenomics v0.3

**Institutional allocation schedule** · Companion to the Helion Network Whitepaper v1.0  

*Draft for capital formation and mainnet planning. Not investment advice. Not an offer to sell securities. Parameters may change prior to mainnet.*

---

## 1. Token parameters

| Parameter | Specification |
|-----------|----------------|
| Asset | Helion |
| Ticker | **HEL** |
| Maximum supply | **100,000,000,000** (100 billion) |
| Supply type | **Fixed** — releases only from predefined buckets |
| Network | BNB Smart Chain (testnet today → mainnet target) |
| Standard | BEP-20 (mainnet) |

---

## 2. Allocation summary

| Bucket | % | HEL amount | Purpose |
|--------|--:|----------:|---------|
| **Community** (staking + mining + rewards) | **40%** | 40,000,000,000 | Long-horizon user incentives |
| **Investors** (seed / private / public) | **15%** | 15,000,000,000 | Capital formation under vesting |
| **Treasury / ecosystem** | **15%** | 15,000,000,000 | Build, secure, operate, grants |
| **Liquidity & market making** | **12%** | 12,000,000,000 | Market depth and inventory |
| **Team** | **12%** | 12,000,000,000 | Core contributors |
| **Advisors / early** | **6%** | 6,000,000,000 | Advisors and early support |
| **Total** | **100%** | **100,000,000,000** | |

### Change from v0.2
| Item | v0.2 | v0.3 |
|------|------|------|
| Community-related incentives | ~68% (50% staking + 18% mining) | **40%** |
| Investors | — | **15%** dedicated |
| Treasury | 10% | **15%** |
| Team | 7% | **12%** |
| Advisors | 3% | **6%** |
| Liquidity | 10% | **12%** |

---

## 3. Community (40%)

| Sub-program | % of total supply | Notes |
|-------------|------------------:|-------|
| Staking rewards | 28% | Tenure-based locks; multi-year release |
| Mining / contribution | 12% | Cycle rewards; emission decay; hard cap = bucket |

Community supply is **earned over time**, not unlocked in full at TGE.

### Illustrative mining schedule
```text
baseReward     = 50 HEL per cycle (configurable)
epoch          = floor(daysSinceGenesis / 90)
scheduled      = max(0.5, baseReward / 2^epoch)
```
Mainnet emissions must remain inside the community allocation ceiling.

---

## 4. Investors (15%)

### 4.1 Round split (indicative)

| Round | % of investor bucket | % of total supply | Intent |
|-------|---------------------:|------------------:|--------|
| Seed | ~40% | ~6% | Earliest capital; longest vesting |
| Private | ~40% | ~6% | Growth and listing readiness |
| Public / community sale | ~20% | ~3% | Broader distribution if pursued |

### 4.2 Vesting standards (policy targets)

| Round | Cliff | Vesting | Max unlock at TGE |
|-------|-------|---------|-------------------|
| Seed | 6–12 months | 18–24 months linear | 0–5% |
| Private | 3–6 months | 12–18 months linear | 5–10% |
| Public | 0–1 month | 3–6 months | 10–25% |

Final terms are defined in definitive agreements. Price and FDV are set per round, not in this schedule.

---

## 5. Team (12%)

| Rule | Policy |
|------|--------|
| Cliff | 6–12 months |
| Vesting | 18–24 months linear post-cliff |
| TGE unlock | **0% recommended** |

---

## 6. Advisors / early (6%)

| Rule | Policy |
|------|--------|
| Cliff | 3 months |
| Vesting | 12 months linear |
| Form | Written allocation agreements |

---

## 7. Treasury (15%)

Eligible uses: engineering, audits, infrastructure, legal, compliance, ecosystem grants, disciplined operations.  
Controls: multi-signature or institutional custody appropriate to scale.  
Treasury is not an undisclosed investor substitute.

---

## 8. Liquidity & market making (12%)

Deployment for AMM depth, listing inventories, and market-making programs. Structured to support orderly markets rather than short-term float expansion.

---

## 9. Fee policy (non-HEL)

- Product fees are paid in **BNB** (tBNB on testnet), not HEL.  
- Planned split: **50%** to a reward treasury distributed by contribution ranking; **50%** to operations / treasury.  
- Objective: avoid mandatory HEL sell pressure from fee payment.

---

## 10. TGE float posture

| Bucket | Indicative TGE treatment |
|--------|--------------------------|
| Community | Program emissions only |
| Investors | Round cap only |
| Team | 0% |
| Advisors | 0–10% guideline |
| Treasury | Policy-governed |
| Liquidity | Market-seeding requirement |

---

## 11. Utility (summary)

- Staking and future Finance features  
- Mining participation  
- Pair liquidity (HEL as a market leg)  
- Possible future fee discount / governance (not activated solely by this document)  
- Contribution scores rank fee-share eligibility; scores are not themselves a second token

---

## 12. Open items (intentionally unset)

- Round-by-round FDV and price  
- Buyback/burn policy  
- Standalone governance token  
- Final mainnet spot fee percentages  
- Public sale venue selection  

---

## 13. Version history

| Version | Summary |
|---------|---------|
| v0.2 | Staking 50%, community/mining 18%, no dedicated investor bucket |
| **v0.3** | **Community 40%**, **Investors 15%**, rebalanced treasury, team, liquidity, advisors |

---

*Helion Network · Tokenomics v0.3 · September 2026*  
*See also: WHITEPAPER.md (Institutional Whitepaper v1.0)*
