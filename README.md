# Helion Server (private repo)

Node/Express API: custodial wallets, miner, staking, swap, spot matching, Upstash persistence.

**Älä tee tästä public-reposta.** Salaisuudet vain Render Environment -muuttujiin.

## Stack

- Express + ethers + JWT
- Upstash Redis (`blobStore.js`) — tuotannon persistenssi
- BSC Testnet (HEL/BNB, miner, staking, swap)
- Sisäinen spot order book + market maker

## Käynnistys

```bash
cp .env.example .env
# täytä JWT_SECRET, TREASURY_PRIVATE_KEY, UPSTASH_*, kontraktiosoitteet…
npm install
npm start
```

Loki OK:
```text
[blobStore] Upstash Redis ok
[Helion] persist=upstash
Helion Wallet API käynnissä portissa …
```

## Render

1. Connect **tämä private repo**
2. Build: `npm install`
3. Start: `npm start` / `node server.js`
4. Environment: kopioi `.env.example`-avaimet + oikeat arvot
5. **Älä** aseta `DATA_DIR` ilman maksullista diskiä

## Frontend

Julkinen HTML-repo kutsuu tätä API:a (`BACKEND_URL` / `config.js`).

## Tiedostot

| Tiedosto | Rooli |
|----------|--------|
| `server.js` | HTTP API |
| `blobStore.js` | Upstash / file persist |
| `users.js` / `wallet.js` | Auth + custodial keys |
| `spotEngine.js` | HEL/BNB matching |
| `spotMarketMaker.js` | MM |
| `gridBot.js` | Admin grid bot |
| `swapRoutes.js` | Pool / router helpers |
| `contributions.js` | Leaderboard pisteet |
| `dataDir.js` | Paikallinen cache-polku |

## Ei kuulu tähän repoon

- `*.html`, `i18n.js`, `logo.jpg` → frontend-repo
- `users.json`, `wallets.json`, `spotEngine.json` → runtime (gitignore)
- `.env` → vain paikallinen / Render
