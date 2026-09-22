# Helion Network

## Institutional Whitepaper

**Exchange & DeFi Hub on BNB Smart Chain**

Version 1.0 · September 2026  
Document status: Public draft · Not an offer to sell securities

---

### Important notice

This document is provided for informational purposes only. It does not constitute investment, legal, tax, or financial advice. Nothing herein is an offer to sell, or a solicitation to buy, any token, security, or financial instrument. HEL token mechanics described below are subject to change prior to mainnet deployment. Digital assets involve substantial risk, including total loss of capital. Prospective participants should conduct independent due diligence and consult qualified advisors. Past or projected parameters are not guarantees of future performance.

---

## 1. Executive summary

Helion Network is building a unified **exchange and DeFi hub** on BNB Smart Chain: spot trading, swap, staking-oriented yield, and a single user wallet experience designed so participants do not need multiple disconnected applications for core market activity.

The network’s native unit of account for incentives and protocol alignment is **HEL**, a fixed-supply token (100 billion maximum). Economic design separates:

- **User incentive supply** (community rewards),
- **Capital formation** (investor allocations with vesting),
- **Operational reserves** (treasury and liquidity),
- **Core contributors** (team and advisors under multi-year vesting).

Product development is currently advanced on **BSC Testnet**, with mainnet deployment planned after security, liquidity, and operational readiness criteria are met.

**Design principles**

| Principle | Implementation direction |
|-----------|---------------------------|
| Fixed supply | Hard cap; no unbounded mint |
| User-first incentives | 40% of supply to community programs |
| Aligned capital | Investor tokens vest; limited TGE float |
| Sustainable fees | Operational fees in native gas asset (BNB), not forced HEL sell pressure |
| Transparent buckets | Clear allocation, unlock logic, and governance of treasury |

---

## 2. Market context and problem

Retail and semi-professional users on BNB Chain still face fragmented workflows:

1. **Separate venues** for swap, spot, and yield  
2. **Wallet friction** across bridges, approvals, and gas  
3. **Incentive systems** that dilute without clear caps or schedules  
4. **Fee models** that push constant sell pressure onto the incentive token  

Helion targets a coherent product surface—**one account, one wallet context, multiple markets**—with token economics that can withstand institutional scrutiny: capped supply, explicit investor vesting, and community emissions bounded by allocation.

---

## 3. Product overview

### 3.1 Core modules

| Module | Description |
|--------|-------------|
| **Wallet** | Custodial account wallet for streamlined onboarding on testnet; path to broader wallet options as the product matures |
| **Swap** | HEL pairs with native gas asset routes; pool-aware pricing |
| **Spot** | Internal matching with market-making support; quote design evolving (e.g. stable quote assets in test environments) |
| **Mining** | Time-cycled participation with scheduled emission decay |
| **Staking / Finance** | Lock-based rewards; roadmap includes expanded yield, lending, and pool participation |
| **Contribution ledger** | Activity ranking for fee-share style rewards (paid in gas asset per policy) |

### 3.2 Fee philosophy

Protocol and product fees are denominated primarily in the **chain gas asset (BNB / tBNB on testnet)**, not in HEL. A planned split directs a portion of fee proceeds to a reward treasury distributed by contribution ranking, with the remainder supporting operations and treasury resilience. This reduces structural sell pressure on HEL from mandatory fee conversion.

### 3.3 Security roadmap (product)

Near-term controls include email verification with time-limited activation, optional PIN, and session discipline. Biometric / WebAuthn unlock is planned as the installable client (PWA) matures. On-chain security for mainnet will require standard controls: audits, operational multi-signature policies for treasury, and staged rollout.

---

## 4. Chain and architecture

| Item | Detail |
|------|--------|
| Settlement network | BNB Smart Chain |
| Current phase | Testnet validation |
| Target phase | Mainnet exchange & DeFi hub |
| Token standard | BEP-20 compatible HEL |
| Off-chain services | API, matching support, custodial orchestration (testnet), analytics |

Architecture prioritizes **fast iteration on testnet** while keeping a clear boundary between: (a) user balances and incentives, (b) market infrastructure, and (c) treasury / investor delivery schedules for mainnet.

---

## 5. Token overview — HEL

| Parameter | Specification |
|-----------|----------------|
| Name | Helion |
| Ticker | HEL |
| Maximum supply | **100,000,000,000** HEL |
| Supply policy | **Fixed** — no inflation beyond scheduled release from predefined buckets |
| Primary network | BNB Smart Chain |
| Representation | BEP-20 (mainnet) |

HEL is designed as the **coordination and incentive asset** of the Helion economy: staking and mining rewards, ecosystem alignment, and long-term participation—not as the unit of protocol fee payment.

---

## 6. Token allocation (Tokenomics v0.3)

### 6.1 Summary table

| Bucket | Share | Amount (HEL) | Purpose |
|--------|------:|-------------:|---------|
| Community (staking + mining + rewards) | **40%** | 40,000,000,000 | User incentives over multi-year emission |
| Investors (seed / private / public) | **15%** | 15,000,000,000 | Capital formation under vesting |
| Treasury / ecosystem | **15%** | 15,000,000,000 | Development, audits, grants, operations |
| Liquidity & market making | **12%** | 12,000,000,000 | DEX/CEX liquidity and inventory |
| Team | **12%** | 12,000,000,000 | Core contributors |
| Advisors / early supporters | **6%** | 6,000,000,000 | Strategic advisors and early support |
| **Total** | **100%** | **100,000,000,000** | |

### 6.2 Community — 40%

Internal target split:

| Program | Share of total supply | Role |
|---------|----------------------:|------|
| Staking rewards | 28% | Lock-based yield across defined tenures |
| Mining & contribution rewards | 12% | Cycle-based mining and activity-aligned incentives |

Community tokens are **not** a single unlock at token generation event (TGE). They release through program rules over years. Mining follows a hybrid schedule: base reward per cycle with periodic decay (illustrative epoch length: 90 days) and a floor, subject to the community bucket as a hard ceiling.

### 6.3 Investors — 15%

Indicative subdivision of the investor bucket (finalized in transaction documents):

| Round | Approx. share of investor bucket | Approx. % of total supply |
|-------|--------------------------------:|--------------------------:|
| Seed | ~40% | ~6% |
| Private | ~40% | ~6% |
| Public / community sale | ~20% | ~3% |

**Illustrative vesting standards**

| Round | Cliff | Linear vesting | Max TGE unlock |
|-------|-------|----------------|----------------|
| Seed | 6–12 months | 18–24 months | 0–5% |
| Private | 3–6 months | 12–18 months | 5–10% |
| Public | 0–1 month | 3–6 months | 10–25% |

Investor consideration may be denominated in stablecoins or BNB; HEL is delivered per vesting contracts. Valuation and price per round are **outside** this whitepaper and set in formal offering materials.

### 6.4 Team — 12%

- Cliff: 6–12 months  
- Linear vesting: 18–24 months thereafter  
- Recommended TGE unlock: **0%**  

### 6.5 Advisors / early — 6%

- Cliff: 3 months  
- Linear vesting: 12 months  
- Allocations individualized under written agreements  

### 6.6 Treasury — 15%

Reserved for product engineering, security reviews, infrastructure, legal, and ecosystem grants. Treasury should operate under strict internal controls (multi-signature or equivalent institutional custody as scale requires). Treasury is not a substitute for disclosed investor rounds.

### 6.7 Liquidity & market making — 12%

Dedicated to deep markets: AMM pools, potential CEX inventories, and market-making programs. Liquidity deployment is operational, not speculative retail distribution.

---

## 7. Emission, float, and TGE posture

**Guiding rule:** Minimize unvested, uncontrolled float at launch.

| Bucket | At TGE (indicative) |
|--------|---------------------|
| Community | Only program-earned emissions; not 40% unlocked |
| Investors | Round-specific TGE caps only |
| Team | 0% recommended |
| Advisors | 0–10% maximum guideline |
| Treasury | As required for operations, under policy |
| Liquidity | Amount required to seed orderly markets |

Circulating supply at any date is a function of vesting cliffs, linear releases, and community program claims—not a discretionary mint.

---

## 8. Value capture and HEL demand (non-promissory)

Mechanisms intended to create organic demand or alignment—**without guaranteeing price**:

1. **Staking** — HEL locked for protocol yield parameters  
2. **Mining participation** — HEL rewards for sustained engagement  
3. **Ecosystem access** — future fee discounts or governance rights (if activated by governance)  
4. **Liquidity provision** — HEL as a leg in core pairs  

Fee revenues in BNB strengthen treasury and contribution rewards without forcing users to sell HEL to pay gas-style fees.

---

## 9. Roadmap (strategic)

| Phase | Focus |
|-------|--------|
| **Testnet foundation** | Wallet, mining, staking, swap, spot prototypes, security basics |
| **Product hardening** | Email verification, PIN, analytics, market quality, incident response |
| **Mainnet preparation** | Audits, liquidity plan, investor delivery rails, custody policy |
| **Mainnet launch** | Phased market opening, monitoring, community programs under v0.3 caps |
| **Expansion** | Finance module depth (lend/farm/pool), PWA/mobile install path, listings as appropriate |

Dates remain execution-dependent and are published separately in operational roadmaps.

---

## 10. Governance and compliance posture

- **Token buckets and vesting** should be implemented so that promises in this document map to enforceable schedules on- or off-chain.  
- **Treasury** movements above defined thresholds should require multi-party authorization.  
- **Communications** must avoid guarantees of return; public materials should remain consistent with this notice.  
- Jurisdictional restrictions may apply to any public sale; geographic blockers and transfer limits may be used where required.

Helion does not claim exemption from securities, commodities, or consumer laws in any jurisdiction by virtue of this document alone.

---

## 11. Risk factors (selected)

1. **Smart contract and infrastructure risk** — bugs, oracle failure, matching or custody failure  
2. **Market risk** — illiquidity, volatility, depeg events in related assets  
3. **Execution risk** — delays in mainnet, audits, or liquidity  
4. **Regulatory risk** — evolving treatment of tokens, staking, and trading venues  
5. **Key-person and operational risk** — early-stage organization dependency  
6. **Dilution of attention** — incentive programs that fail to retain real users  
7. **Counterparty risk** — third-party bridges, custodians, or listing venues  

This list is not exhaustive.

---

## 12. Conclusion

Helion Network combines a practical product thesis—an integrated exchange and DeFi hub on BNB Smart Chain—with **Tokenomics v0.3**: fixed supply, a **40% community** incentive envelope, a dedicated **15% investor** path with vesting, and material treasury and liquidity reserves.

The project prioritizes **testnet proof**, **controlled float**, and **fee design that does not weaponize the incentive token against itself**. Institutional review should focus on allocation integrity, vesting enforceability, treasury controls, and mainnet security readiness—not on promotional supply narratives.

---

## 13. Document control

| Field | Value |
|-------|--------|
| Title | Helion Network Institutional Whitepaper |
| Tokenomics reference | v0.3 |
| Version | 1.0 |
| Date | September 2026 |
| Classification | Public draft |

For allocation tables in isolation, see companion file **TOKENOMICS.md** (v0.3).

---

*© Helion Network. All rights reserved. Distribution permitted for informational evaluation.*
