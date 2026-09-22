# Helion Frontend (public repo)

Staattiset sivut GitHub Pagesiin. API on erillisessä **private** server-reposta (Render).

## Tiedostot

| Tiedosto | |
|----------|--|
| `config.js` | **API-osoite** (muuta vain tästä) |
| `index.html` | Login / register |
| `wallet.html` | Custodial wallet |
| `miner.html` | Mining |
| `staking.html` | Staking |
| `helion-trading.html` | Swap |
| `spot.html` | HEL/BNB spot |
| `leaderboard.html` | Board |
| `guide.html` | Ohjeet |
| `i18n.js` | FI / EN |
| `logo.jpg` | Logo |

## API-osoite

`config.js`:

```js
BACKEND_URL: local ? 'http://localhost:3001' : 'https://testnetworkserver.onrender.com'
```

Jos Render-URL vaihtuu, muuta **vain** `config.js` ja pushaa.

## GitHub Pages

1. Pushaa tämän kansion sisältö public-repon **juureen**
2. Settings → Pages → branch `main` → folder `/ (root)`
3. Avaa `https://USER.github.io/REPO/` (kauttaviiva lopussa)

## Paikallinen testi

1. Käynnistä server-repo: `node server.js` (portti 3001)
2. Avaa `index.html` selaimessa tai live-serverillä

## Ei kuulu tähän repoon

- `server.js`, private keys, `.env`, `users.json`, `wallets.json`
