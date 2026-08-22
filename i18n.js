/**
 * Helion i18n — full FI / EN
 */
(function (global) {
  const STRINGS = {
    fi: {
      'lang.name': 'FI',
      'nav.miner': '⛏ Miner',
      'nav.staking': '🔒 Staking',
      'nav.swap': '🔄 Swap',
      'nav.spot': '📈 Spot',
      'nav.wallet': '💼 Wallet',
      'nav.board': '🏆 Leaderboard',
      'nav.guide': '📖 Ohjeet',
      'nav.admin': 'Admin',
      'nav.logout': 'Kirjaudu ulos',
      'common.loading': 'Ladataan…',
      'common.error': 'Virhe',
      'common.success': 'Onnistui',
      'common.cancel': 'Peruuta',
      'common.save': 'Tallenna',
      'common.refresh': 'Päivitä',
      'common.amount': 'Määrä',
      'common.price': 'Hinta',
      'common.total': 'Yhteensä',
      'common.available': 'Saatavilla',
      'common.locked': 'Lukittu',
      'common.buy': 'Osta',
      'common.sell': 'Myy',
      'common.max': 'MAX',
      'common.send': 'Lähetä',
      'common.confirm': 'Vahvista',
      'index.title': 'Helion',
      'index.authLogin': 'Kirjaudu sisään',
      'index.authRegister': 'Luo tili',
      'index.username': 'Käyttäjänimi',
      'index.password': 'Salasana',
      'index.loginBtn': 'Kirjaudu',
      'index.registerBtn': 'Rekisteröidy',
      'index.toggleToRegister': 'Ei tiliä? Rekisteröidy',
      'index.toggleToLogin': 'Onko jo tili? Kirjaudu',
      'index.walletLogin': 'Kirjaudu lompakolla',
      'index.toastLogin': 'Kirjauduttu sisään!',
      'index.toastRegister': 'Tili luotu!',
      'index.toastWallet': 'Kirjauduttu lompakolla!',
      'wallet.title': 'Wallet',
      'wallet.tag': 'Sisäänrakennettu lompakko',
      'wallet.heading': 'Lompakkosi',
      'wallet.hel': 'HEL',
      'wallet.tbnb': 'tBNB (gas)',
      'wallet.prices': 'Token-hinnat',
      'wallet.refresh': 'Päivitä',
      'wallet.sendTitle': 'Lähetä HEL',
      'wallet.recipient': 'Vastaanottajan osoite tai käyttäjänimi',
      'wallet.amount': 'Määrä',
      'wallet.send': 'Lähetä',
      'wallet.linkTitle': 'Linkitä oma lompakko',
      'wallet.linkBtn': 'Linkitä MetaMask',
      'wallet.logout': 'Kirjaudu ulos',
      'swap.title': 'Helion Swap',
      'swap.tag': 'BSC Testnet · HEL / tBNB',
      'swap.notice': 'Huom: jokaisesta swapista peritään 1% platform-fee (+ PancakeSwap 0.3%).',
      'swap.poolHel': 'Pool HEL',
      'swap.poolBnb': 'Pool tBNB',
      'swap.priceHel': 'HEL hinta',
      'swap.priceBnb': 'tBNB hinta',
      'swap.tabSwap': 'Swap',
      'swap.tabLiq': 'Likviditeetti',
      'swap.pay': 'Maksat',
      'swap.receive': 'Saat (arvio)',
      'swap.fee': 'Platform-fee (1%)',
      'swap.feeUsd': 'Fee USD',
      'swap.outUsd': 'Saat arviolta (USD)',
      'swap.route': 'Reitti',
      'swap.button': 'Swap',
      'swap.addLiq': 'Lisää likviditeettiä (HEL/tBNB)',
      'swap.removeLiq': 'Poista likviditeetti',
      'swap.lpTokens': 'LP-tokenisi',
      'swap.powered': 'Kaupankäynti PancakeSwap-routerin kautta · vain HEL ↔ tBNB',
      'staking.title': 'Staking',
      'staking.tag': 'Lukitse HEL ja ansaitse tuottoa',
      'staking.stake': 'Stake',
      'staking.withdraw': 'Nosta',
      'staking.early': 'Nosta ennenaikaisesti',
      'staking.positions': 'Positiot',
      'staking.amount': 'HEL määrä',
      'staking.chooseTier': 'Valitse taso',
      'miner.title': 'Miner',
      'miner.tag': 'Louhinta',
      'miner.activate': 'Aktivoi',
      'miner.claim': 'Claimaa',
      'miner.status': 'Tila',
      'spot.title': 'Helion Spot',
      'spot.subtitle': 'BTC/USDT · Matching Engine',
      'spot.orderBook': 'Order Book',
      'spot.orderTicket': 'Order Ticket',
      'spot.marketTrades': 'Market Trades',
      'spot.openOrders': 'Avoimet orderit',
      'spot.stopOrders': 'Stop-orderit',
      'spot.tradeHistory': 'Kauppa historia',
      'spot.balances': 'Saldot',
      'spot.limit': 'Limit',
      'spot.market': 'Market',
      'spot.stopLimit': 'Stop Limit',
      'spot.stopMarket': 'Stop Market',
      'spot.stopPrice': 'Stop-hinta',
      'spot.amount': 'Määrä',
      'spot.totalEst': 'Yhteensä (arvio)',
      'spot.buyBtc': 'Osta BTC',
      'spot.sellBtc': 'Myy BTC',
      'spot.banner': 'Testnet-terminaali · sisäinen matching · market maker · maker 0.08% / taker 0.1%',
      'spot.usdtAvail': 'USDT saatavilla',
      'spot.btcAvail': 'BTC saatavilla',
      'spot.locked': 'Lukittu',
      'spot.equity': 'Equity',
      'spot.priceUsdt': 'Hinta (USDT)',
      'spot.sizeBtc': 'Koko (BTC)',
      'spot.total': 'Yhteensä',
      'spot.time': 'Aika',
      'spot.side': 'Suunta',
      'spot.type': 'Tyyppi',
      'spot.status': 'Tila',
      'spot.asset': 'Asset',
      'spot.available': 'Saatavilla',
      'spot.noOpen': 'Ei avoimia ordereita',
      'spot.noStops': 'Ei stop-ordereita',
      'spot.noTrades': 'Ei kauppoja',
      'spot.logout': 'Kirjaudu ulos',
      'leaderboard.title': 'Leaderboard',
      'leaderboard.tag': 'Parhaat kontribuoijat',
      'guide.title': 'Ohjeet',
      'admin.title': 'Admin',
      
      'wallet.linkDesc': 'Linkitä oma MetaMask-lompakkosi tähän tiliin allekirjoittamalla viesti — sen jälkeen voit kirjautua Helioniin ilman salasanaa suoraan lompakolla.',
      'wallet.linkMeta': 'Linkitä MetaMask',
      'wallet.feeNote': 'Kirjoita vastaanottaja nähdäksesi sovelletaanko fee:tä.',
      'miner.walletBal': 'Lompakkosaldo',
      'miner.totalMined': 'Yhteensä louhittu',
      'miner.timeLeft': 'Kaivos-aika jäljellä',
      'miner.activateBtn': 'Aktivoi Kaivos (12h)',
      'miner.claiming': 'Lunastetaan…',
      'miner.activating': 'Aktivoidaan…',
      'staking.walletBal': 'Lompakkosaldo',
      'staking.chooseTier': 'Valitse taso',
      'staking.chooseFirst': 'Valitse taso yllä ennen staketusta.',
      'staking.chooseBtn': 'Valitse taso ensin',
      'staking.stake': 'Stake',
      'staking.days': 'vrk',
      'staking.reward': 'tuotto',
      'staking.min': 'Min.',
      'staking.withdraw': 'Nosta',
      'staking.earlyWithdraw': 'Nosta aikaisin (menetä tuotto)',
      'staking.lockEnded': 'Lukitusaika päättynyt',
      'staking.left': 'jäljellä',
      'staking.noPositions': 'Ei avoimia positioita.',
      'staking.positionsFail': 'Positioiden haku epäonnistui.',
      'staking.earlyOk': 'Pääoma nostettu (ilman tuottoa).',
      'guide.pageTitle': 'Ohjeet',
      'guide.s1': 'Asenna MetaMask',
      'guide.s1p1': 'MetaMask on selainlaajennus (tai mobiilisovellus), joka toimii kryptolompakkona. Sitä tarvitaan vain jos haluat käyttää omaa lompakkoa — Helionin sisäänrakennettu lompakko hoitaa kaupankäynnin ja stakingin ilman MetaMaskia.',
      'guide.s1p2': 'Lataa se osoitteesta metamask.io — valitse oma selaimesi tai mobiilisovellus. Asennuksen jälkeen luo uusi lompakko ja tallenna siemenlause turvallisesti.',
      'guide.s2': 'Lisää BSC Testnet -verkko',
      'guide.s2p1': 'Helion toimii BSC Testnetissä, ei Ethereumin pääverkossa tai BSC:n mainnetissä. MetaMask ei näytä sitä oletuksena, joten se täytyy lisätä erikseen.',
      'guide.s3': 'Hae testi-BNB (tBNB)',
      'guide.s3p1': 'Tarvitset pienen määrän tBNB:tä maksaaksesi gas-kulut (transaktiomaksut) — ilman sitä ketjutapahtumat eivät onnistu.',
      'guide.s4': 'Miten sivut toimivat',
      'guide.s4miner': 'Miner — 12h louhintasykli: aktivoi, odota, claimaa palkkio.',
      'guide.s4stake': 'Staking — valitse taso (7/30/90 vrk), stakettaa HEL, saa kiinteän tuoton lukitusajan jälkeen.',
      'guide.s4swap': 'Swap — vaihda HEL ↔ tBNB PancakeSwap-testnetin kautta. Jokaisesta swapista 1% platform-fee.',
      'guide.s4spot': 'Spot — sisäinen BTC/USDT order book, limit/market/stop, market maker.',
      'guide.s5': 'Kontraktiosoitteet (läpinäkyvyyden vuoksi)',

      'toast.loginRequired': 'Kirjaudu ensin sisään',
      'toast.saved': 'Tallennettu',
      'toast.cancelled': 'Peruttu',
      'toast.orderOk': 'Order hyväksytty',
      'toast.orderFail': 'Order hylätty',
      'toast.network': 'Verkkovirhe'
    },
    en: {
      'lang.name': 'EN',
      'nav.miner': '⛏ Miner',
      'nav.staking': '🔒 Staking',
      'nav.swap': '🔄 Swap',
      'nav.spot': '📈 Spot',
      'nav.wallet': '💼 Wallet',
      'nav.board': '🏆 Leaderboard',
      'nav.guide': '📖 Guide',
      'nav.admin': 'Admin',
      'nav.logout': 'Log out',
      'common.loading': 'Loading…',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.refresh': 'Refresh',
      'common.amount': 'Amount',
      'common.price': 'Price',
      'common.total': 'Total',
      'common.available': 'Available',
      'common.locked': 'Locked',
      'common.buy': 'Buy',
      'common.sell': 'Sell',
      'common.max': 'MAX',
      'common.send': 'Send',
      'common.confirm': 'Confirm',
      'index.title': 'Helion',
      'index.authLogin': 'Log in',
      'index.authRegister': 'Create account',
      'index.username': 'Username',
      'index.password': 'Password',
      'index.loginBtn': 'Log in',
      'index.registerBtn': 'Register',
      'index.toggleToRegister': 'No account? Register',
      'index.toggleToLogin': 'Already have an account? Log in',
      'index.walletLogin': 'Log in with wallet',
      'index.toastLogin': 'Logged in!',
      'index.toastRegister': 'Account created!',
      'index.toastWallet': 'Logged in with wallet!',
      'wallet.title': 'Wallet',
      'wallet.tag': 'Built-in custodial wallet',
      'wallet.heading': 'Your wallet',
      'wallet.hel': 'HEL',
      'wallet.tbnb': 'tBNB (gas)',
      'wallet.prices': 'Token prices',
      'wallet.refresh': 'Refresh',
      'wallet.sendTitle': 'Send HEL',
      'wallet.recipient': 'Recipient address or username',
      'wallet.amount': 'Amount',
      'wallet.send': 'Send',
      'wallet.linkTitle': 'Link your wallet',
      'wallet.linkBtn': 'Link MetaMask',
      'wallet.logout': 'Log out',
      'swap.title': 'Helion Swap',
      'swap.tag': 'BSC Testnet · HEL / tBNB',
      'swap.notice': 'Note: each swap has a 1% platform fee (+ PancakeSwap 0.3%).',
      'swap.poolHel': 'Pool HEL',
      'swap.poolBnb': 'Pool tBNB',
      'swap.priceHel': 'HEL price',
      'swap.priceBnb': 'tBNB price',
      'swap.tabSwap': 'Swap',
      'swap.tabLiq': 'Liquidity',
      'swap.pay': 'You pay',
      'swap.receive': 'You receive (est.)',
      'swap.fee': 'Platform fee (1%)',
      'swap.feeUsd': 'Fee USD',
      'swap.outUsd': 'You receive (USD est.)',
      'swap.route': 'Route',
      'swap.button': 'Swap',
      'swap.addLiq': 'Add liquidity (HEL/tBNB)',
      'swap.removeLiq': 'Remove liquidity',
      'swap.lpTokens': 'Your LP tokens',
      'swap.powered': 'Trading via PancakeSwap router · HEL ↔ tBNB only',
      'staking.title': 'Staking',
      'staking.tag': 'Lock HEL and earn yield',
      'staking.stake': 'Stake',
      'staking.withdraw': 'Withdraw',
      'staking.early': 'Early withdraw',
      'staking.positions': 'Positions',
      'staking.amount': 'HEL amount',
      'staking.chooseTier': 'Choose tier',
      'miner.title': 'Miner',
      'miner.tag': 'Mining',
      'miner.activate': 'Activate',
      'miner.claim': 'Claim',
      'miner.status': 'Status',
      'spot.title': 'Helion Spot',
      'spot.subtitle': 'BTC/USDT · Matching Engine',
      'spot.orderBook': 'Order Book',
      'spot.orderTicket': 'Order Ticket',
      'spot.marketTrades': 'Market Trades',
      'spot.openOrders': 'Open Orders',
      'spot.stopOrders': 'Stop Orders',
      'spot.tradeHistory': 'Trade History',
      'spot.balances': 'Balances',
      'spot.limit': 'Limit',
      'spot.market': 'Market',
      'spot.stopLimit': 'Stop Limit',
      'spot.stopMarket': 'Stop Market',
      'spot.stopPrice': 'Stop Price',
      'spot.amount': 'Amount',
      'spot.totalEst': 'Total (est.)',
      'spot.buyBtc': 'Buy BTC',
      'spot.sellBtc': 'Sell BTC',
      'spot.banner': 'Testnet terminal · internal matching · market maker · maker 0.08% / taker 0.1%',
      'spot.usdtAvail': 'USDT available',
      'spot.btcAvail': 'BTC available',
      'spot.locked': 'Locked',
      'spot.equity': 'Equity',
      'spot.priceUsdt': 'Price (USDT)',
      'spot.sizeBtc': 'Size (BTC)',
      'spot.total': 'Total',
      'spot.time': 'Time',
      'spot.side': 'Side',
      'spot.type': 'Type',
      'spot.status': 'Status',
      'spot.asset': 'Asset',
      'spot.available': 'Available',
      'spot.noOpen': 'No open orders',
      'spot.noStops': 'No stop orders',
      'spot.noTrades': 'No trades',
      'spot.logout': 'Log out',
      'leaderboard.title': 'Leaderboard',
      'leaderboard.tag': 'Top contributors',
      'guide.title': 'Guide',
      'admin.title': 'Admin',
      
      'wallet.linkDesc': 'Link your MetaMask wallet to this account by signing a message — then you can log in to Helion with the wallet, no password.',
      'wallet.linkMeta': 'Link MetaMask',
      'wallet.feeNote': 'Enter a recipient to see if a fee applies.',
      'miner.walletBal': 'Wallet balance',
      'miner.totalMined': 'Total mined',
      'miner.timeLeft': 'Mining time left',
      'miner.activateBtn': 'Activate Mine (12h)',
      'miner.claiming': 'Claiming…',
      'miner.activating': 'Activating…',
      'staking.walletBal': 'Wallet balance',
      'staking.chooseTier': 'Choose tier',
      'staking.chooseFirst': 'Select a tier above before staking.',
      'staking.chooseBtn': 'Select a tier first',
      'staking.stake': 'Stake',
      'staking.days': 'days',
      'staking.reward': 'reward',
      'staking.min': 'Min.',
      'staking.withdraw': 'Withdraw',
      'staking.earlyWithdraw': 'Early withdraw (forfeit reward)',
      'staking.lockEnded': 'Lock period ended',
      'staking.left': 'left',
      'staking.noPositions': 'No open positions.',
      'staking.positionsFail': 'Failed to load positions.',
      'staking.earlyOk': 'Principal withdrawn (no reward).',
      'guide.pageTitle': 'Guide',
      'guide.s1': 'Install MetaMask',
      'guide.s1p1': 'MetaMask is a browser extension (or mobile app) wallet. You only need it if you want your own wallet — Helion’s built-in custodial wallet handles trading and staking without MetaMask.',
      'guide.s1p2': 'Download from metamask.io — pick your browser or mobile app. Create a wallet and store the seed phrase safely.',
      'guide.s2': 'Add BSC Testnet',
      'guide.s2p1': 'Helion runs on BSC Testnet, not Ethereum mainnet or BSC mainnet. MetaMask does not show it by default — add the network manually.',
      'guide.s3': 'Get test BNB (tBNB)',
      'guide.s3p1': 'You need a small amount of tBNB for gas. Without it, on-chain actions will fail.',
      'guide.s4': 'How the pages work',
      'guide.s4miner': 'Miner — 12h mining cycle: activate, wait, claim reward.',
      'guide.s4stake': 'Staking — pick a tier (7/30/90 days), stake HEL, earn fixed yield after lock ends.',
      'guide.s4swap': 'Swap — trade HEL ↔ tBNB via PancakeSwap testnet. 1% platform fee per swap.',
      'guide.s4spot': 'Spot — internal BTC/USDT order book, limit/market/stop, market maker.',
      'guide.s5': 'Contract addresses (for transparency)',

      'toast.loginRequired': 'Please log in first',
      'toast.saved': 'Saved',
      'toast.cancelled': 'Cancelled',
      'toast.orderOk': 'Order accepted',
      'toast.orderFail': 'Order rejected',
      'toast.network': 'Network error'
    }
  };

  function getLang() {
    const saved = localStorage.getItem('helion_lang');
    if (saved === 'en' || saved === 'fi') return saved;
    return (navigator.language || 'fi').toLowerCase().startsWith('en') ? 'en' : 'fi';
  }

  function setLang(lang) {
    if (lang !== 'en' && lang !== 'fi') lang = 'fi';
    localStorage.setItem('helion_lang', lang);
    applyLang(lang);
    global.dispatchEvent(new CustomEvent('helion:lang', { detail: { lang } }));
  }

  function t(key, lang) {
    const L = lang || getLang();
    return (STRINGS[L] && STRINGS[L][key]) || (STRINGS.en && STRINGS.en[key]) || key;
  }

  function applyLang(lang) {
    lang = lang || getLang();
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      const val = t(key, lang);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
      el.textContent = val;
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'), lang));
    });

    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      const active = btn.getAttribute('data-lang-btn') === lang;
      btn.classList.toggle('active', active);
      btn.style.background = active ? 'rgba(242,169,59,0.15)' : 'transparent';
      btn.style.color = active ? '#F2A93B' : '#8B8F98';
    });
  }

  function mountLangSwitch() {
    if (document.querySelector('.helion-lang-switch')) return;
    const wrap = document.createElement('div');
    wrap.className = 'helion-lang-switch';
    wrap.style.cssText =
      'position:fixed;top:12px;right:12px;z-index:99999;display:inline-flex;gap:2px;' +
      'border:1px solid #262B35;border-radius:999px;padding:3px;background:#14171D;' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.45);';
    wrap.innerHTML =
      '<button type="button" data-lang-btn="fi">FI</button>' +
      '<button type="button" data-lang-btn="en">EN</button>';
    wrap.querySelectorAll('button').forEach((btn) => {
      btn.style.cssText =
        'border:none;background:transparent;color:#8B8F98;font-size:12px;font-weight:700;' +
        'padding:6px 12px;border-radius:999px;cursor:pointer;font-family:inherit;';
      btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-btn')));
    });
    document.body.appendChild(wrap);
    applyLang(getLang());
  }

  function boot() {
    applyLang(getLang());
    mountLangSwitch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  global.HelionI18n = { t, getLang, setLang, applyLang, mountLangSwitch, STRINGS };
  global.t = t;
})(typeof window !== 'undefined' ? window : global);
