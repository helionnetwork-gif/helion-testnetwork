# Helion Network — Roadmap

Tämä dokumentti kuvaa projektin suunnan vaiheittain: mitä on valmista, mitä tehdään seuraavaksi ja milloin siirrytään testnetistä kohti mainnetiä.

**Verkko nyt:** BNB Smart Chain **Testnet**  
**Backend:** Node.js (Render)  
**Frontend:** staattiset HTML-sivut  

---

## 1. Visio

Helion on testnettivetoinen DeFi-sovellus, jossa käyttäjä:

1. Luo tilin ja saa **custodial-lompakon** (HEL / tBNB)
2. **Swappaa**, stakeaa ja louhii HEL:iä
3. Treidaa **Spot-terminaalissa** (sisäinen order book + market maker)

Pitkällä aikavälillä sama malli voidaan viedä mainnetiin config-vaihdolla, kun custody, deposit/withdraw ja riskit on hoidettu.

---

## 2. Nykytila (valmis testnetissä)

| Moduuli | Tila | Huomio |
|--------|------|--------|
| Rekisteröityminen / login (JWT) | ✅ | |
| Custodial wallet (salatut avaimet) | ✅ | `wallet.js` |
| HEL ↔ tBNB Swap (PancakeSwap) | ✅ | 1 % platform-fee |
| Staking | ✅ | |
| Miner | ✅ | |
| Token-hinnat (BNB + pool HEL) | ✅ | |
| Spot matching engine | ✅ | Käyttäjät + MM |
| Spot UI (limit / market / stop) | ✅ | Order book pystysuunnassa |
| Spot Market Maker | ✅ | Seuraa markkinahintaa (fallback jos Binance esto) |
| HEL/tBNB grid-botti (admin) | ✅ | |
| Admin-paneeli | ✅ | Reward pool, grid, MM |
| Deploy (Render + staattinen frontend) | ✅ | |

**Ei vielä:** mainnet, ketju-deposit spotiin, Binance sub-account -integraatio, mobiili-APK tuotantona.

---

## 3. Periaatteet

1. **Testnet ensin** — ei oikeaa rahaa ennen Phase 4:ää.
2. **Yksi fokusussi kerrallaan** — ei mainnet + uutta chainia samaan aikaan.
3. **Spot ≠ Swap** — Swap on on-chain; Spot on sisäinen matching (malli B).
4. **Ei käyttäjän Binance-API-pakkoa** — likviditeetti MM-botilla + käyttäjillä.
5. **Salaisuudet pois Gitistä** — `.env`, `wallets.json`, runtime-ledgerit `.gitignore`en.

---

## 4. Vaiheet

### Phase 0 — Stabilointi  
**Tavoite:** Luotettava testnet-demo, jonka uusi käyttäjä osaa ajaa ohjeilla.  
**Arvio:** 1–2 viikkoa  

- [ ] Yhtenäinen `BACKEND_URL` (localhost / Render) kaikilla sivuilla  
- [ ] README: asennus, env-muuttujat, käynnistys, deploy  
- [ ] `.gitignore` kunnossa (`.env`, `wallets.json`, `spotEngine.json`, `node_modules`)  
- [ ] Smoke-testit: register → login → wallet → swap → spot limit → cancel  
- [ ] Admin: Spot MM + grid start/stop toimii tuotanto-API:ssa  
- [ ] Geo-rajoitus dokumentoitu (Binance → Kraken/CoinGecko fallback)  
- [ ] `guide.html` ajan tasalla (Swap vs Spot selitetty)  

**Done when:** Ulkopuolinen testers käyttäjä läpäisee polun ilman kehittäjän apua.

---

### Phase 1 — Spot-laatu  
**Tavoite:** Professionaalinen testnet-spot, vakaa book ja orderit.  
**Arvio:** 2–4 viikkoa  

- [ ] Market maker: spread / levels / size / interval selkeästi adminissa  
- [ ] Fill-ilmoitukset (partial / filled / stop triggered)  
- [ ] Min notional + max order size -rajoitukset  
- [ ] Order- ja trade-historian suodatus  
- [ ] CSV-export tradehistoriasta (valinnainen)  
- [ ] Kuormitustesti: useampi käyttäjä + MM yhtä aikaa  
- [ ] Saldo- ja lock-logiikan reunatapaukset (cancel, partial, stop)  

**Done when:** Book näyttää elävältä, stopit toimivat luotettavasti, ei saldoepäjohdonmukaisuuksia.

---

### Phase 2 — Yhtenäinen tuote  
**Tavoite:** Yksi sovellus, ei erillisten sivujen kokoelma.  
**Arvio:** 2–3 viikkoa  

- [ ] Dashboard: HEL, tBNB, spot equity, avoimet orderit  
- [ ] Yhtenäinen navigaatio ja typografia kaikilla sivuilla  
- [ ] Responsive / mobiiliasettelu (erityisesti Spot)  
- [ ] Kevyt ilmoitusloki (viimeisimmät tapahtumat)  
- [ ] Virheviestien selkeytys käyttäjälle (suomi, toimintakehote)  

**Done when:** Desktop + mobiili tuntuvat samalta tuotteelta.

---

### Phase 3 — Mainnet-valmius (suunnittelu + tech)  
**Tavoite:** Sama koodipohja tukee testnet/mainnet configia; riskit kirjattu.  
**Arvio:** 3–6 viikkoa  

- [ ] `NETWORK=testnet|mainnet` (RPC, router, token-osoitteet)  
- [ ] Spot deposit / withdraw -suunnittelu (custodial → ledger → takaisin)  
- [ ] Rate limit, admin-reitit, audit-checklist  
- [ ] Varmuuskopiointi ja avainten palautusprosessi  
- [ ] Päätös dokumentoituna:  
  - mainnet-spot = sisäinen matching, **tai**  
  - vain on-chain Swap/staking, **tai**  
  - myöhemmin Binance sub-account (jos oikeudet + ToS ok)  

**Done when:** Kirjallinen mainnet-päätös + tekninen deposit-suunnitelma olemassa.

---

### Phase 4 — Rajoitettu mainnet  
**Tavoite:** Pieni käyttäjäjoukko, rajatut summat, seuranta kunnossa.  
**Arvio:** 4+ viikkoa Phase 3:n jälkeen  

- [ ] Mainnet-osoitteet ja deploy  
- [ ] Deposit-katot / allowlist (valinnainen)  
- [ ] Monitoring (uptime, virheet, MM offline, poikkeavat saldot)  
- [ ] Käyttöehdot ja riskivaroitus käyttäjälle  
- [ ] Compliance-tarkistus jos säilytetään käyttäjien varoja  

**Done when:** 5–20 käyttäjää käyttää vakaasti ilman kriittistä häiriötä.

---

### Phase 5 — Kasvu (myöhemmin)  

- [ ] Lisäparit spotissa  
- [ ] Chart (esim. TradingView-widget)  
- [ ] Julkinen bot-API / dokumentaatio  
- [ ] Binance sub-account (jos master-oikeudet mahdollistavat)  
- [ ] Capacitor-APK kun web on vakaa  

---

## 5. Mitä ei priorisoida nyt

| Asia | Syy |
|------|-----|
| Täysi mainnet-julkaisu heti | Custody- ja sääntelyriski |
| Käyttäjän omat Binance-API-avaimet | Huono UX |
| Multi-chain | Hajauttaa fokuksen |
| Sub-account ilman sapi-oikeuksia | Ei toimi luotettavasti testnetissä |

---

## 6. Tekniset komponentit (viite)

```
Frontend          Backend (Render)              Ketju / ulkoinen
─────────         ────────────────              ────────────────
index.html        server.js                     BSC Testnet
wallet.html       wallet.js / users.js          PancakeSwap Router
helion-trading    spotEngine.js                 Oracle: Binance → fallback
spot.html         spotMarketMaker.js            (Kraken / CoinGecko / Coinbase)
admin.html        gridBot.js
staking/miner     binanceTestnet.js (market data)
```

---

## 7. Miten tätä ylläpidetään

1. Pidä tämä tiedosto ajan tasalla (`ROADMAP.md` repo-juuressa).  
2. Luo GitHub Issue jokaisesta isommasta checkboxista (esim. `Phase 1: min notional`).  
3. Valitse viikolle 2–4 tehtävää, mieluiten samasta phasesta.  
4. Kun phase valmistuu, merkitse checkboxit ja kirjoita lyhyt release-muistiinpano.

---

## 8. Seuraava konkreettinen askel

**Aloita Phase 0:sta.**  
Ensimmäinen deliverable: README + smoke-testilista + varmistus että Render-deploy sisältää `spotEngine.js`, `spotMarketMaker.js` ja `binanceTestnet.js`.

---

*Viimeksi päivitetty: 2026-08-22 — testnet, spot terminal + MM käytössä.*
