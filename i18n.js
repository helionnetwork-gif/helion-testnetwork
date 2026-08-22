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
