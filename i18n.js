/**
 * Helion i18n — FI / EN
 * Usage:
 *   <span data-i18n="nav.spot">Spot</span>
 *   <input data-i18n-placeholder="spot.amount" />
 *   document.documentElement.lang set automatically
 *   t('nav.spot') in scripts
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
      'nav.board': '🏆 Board',
      'nav.guide': '📖 Ohjeet',
      'nav.admin': 'Admin',
      'nav.logout': 'Kirjaudu ulos',
      'nav.login': 'Kirjaudu',
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
      'index.title': 'Helion',
      'index.subtitle': 'BSC Testnet · Wallet · Swap · Spot',
      'index.username': 'Käyttäjänimi',
      'index.password': 'Salasana',
      'index.login': 'Kirjaudu sisään',
      'index.register': 'Rekisteröidy',
      'index.or': 'tai',
      'index.walletLogin': 'Kirjaudu lompakolla',
      'wallet.title': 'Lompakko',
      'wallet.address': 'Osoite',
      'wallet.hel': 'HEL-saldo',
      'wallet.tbnb': 'tBNB-saldo',
      'wallet.prices': 'Hinnat',
      'wallet.transfer': 'Siirrä HEL',
      'wallet.recipient': 'Vastaanottaja',
      'wallet.send': 'Lähetä',
      'wallet.refresh': 'Päivitä saldot',
      'swap.title': 'Helion Swap',
      'swap.subtitle': 'BSC Testnet · HEL / tBNB',
      'swap.pay': 'Maksat',
      'swap.receive': 'Saat (arvio)',
      'swap.fee': 'Platform-fee (1%)',
      'swap.feeUsd': 'Fee USD',
      'swap.route': 'Reitti',
      'swap.button': 'Swap',
      'swap.liquidity': 'Likviditeetti',
      'swap.addLiq': 'Lisää likviditeettiä',
      'swap.removeLiq': 'Poista likviditeetti',
      'swap.poolHel': 'Pool HEL',
      'swap.poolBnb': 'Pool tBNB',
      'swap.priceHel': 'HEL hinta',
      'swap.priceBnb': 'tBNB hinta',
      'swap.notice': 'Huom: jokaisesta swapista peritään 1% platform-fee (+ PancakeSwap 0.3%).',
      'staking.title': 'Staking',
      'staking.subtitle': 'Lukitse HEL ja ansaitse tuottoa',
      'staking.stake': 'Stake',
      'staking.withdraw': 'Nosta',
      'staking.early': 'Nosta ennenaikaisesti',
      'staking.positions': 'Positiot',
      'miner.title': 'Miner',
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
      'spot.noAsks': 'Ei myynteitä',
      'spot.noBids': 'Ei ostoja',
      'spot.noOpen': 'Ei avoimia ordereita',
      'spot.noStops': 'Ei stop-ordereita',
      'spot.noTrades': 'Ei kauppoja',
      'spot.usdtAvail': 'USDT saatavilla',
      'spot.btcAvail': 'BTC saatavilla',
      'spot.equity': 'Equity',
      'leaderboard.title': 'Leaderboard',
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
      'nav.board': '🏆 Board',
      'nav.guide': '📖 Guide',
      'nav.admin': 'Admin',
      'nav.logout': 'Log out',
      'nav.login': 'Log in',
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
      'index.title': 'Helion',
      'index.subtitle': 'BSC Testnet · Wallet · Swap · Spot',
      'index.username': 'Username',
      'index.password': 'Password',
      'index.login': 'Log in',
      'index.register': 'Register',
      'index.or': 'or',
      'index.walletLogin': 'Log in with wallet',
      'wallet.title': 'Wallet',
      'wallet.address': 'Address',
      'wallet.hel': 'HEL balance',
      'wallet.tbnb': 'tBNB balance',
      'wallet.prices': 'Prices',
      'wallet.transfer': 'Transfer HEL',
      'wallet.recipient': 'Recipient',
      'wallet.send': 'Send',
      'wallet.refresh': 'Refresh balances',
      'swap.title': 'Helion Swap',
      'swap.subtitle': 'BSC Testnet · HEL / tBNB',
      'swap.pay': 'You pay',
      'swap.receive': 'You receive (est.)',
      'swap.fee': 'Platform fee (1%)',
      'swap.feeUsd': 'Fee USD',
      'swap.route': 'Route',
      'swap.button': 'Swap',
      'swap.liquidity': 'Liquidity',
      'swap.addLiq': 'Add liquidity',
      'swap.removeLiq': 'Remove liquidity',
      'swap.poolHel': 'Pool HEL',
      'swap.poolBnb': 'Pool tBNB',
      'swap.priceHel': 'HEL price',
      'swap.priceBnb': 'tBNB price',
      'swap.notice': 'Note: each swap has a 1% platform fee (+ PancakeSwap 0.3%).',
      'staking.title': 'Staking',
      'staking.subtitle': 'Lock HEL and earn yield',
      'staking.stake': 'Stake',
      'staking.withdraw': 'Withdraw',
      'staking.early': 'Early withdraw',
      'staking.positions': 'Positions',
      'miner.title': 'Miner',
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
      'spot.noAsks': 'No asks',
      'spot.noBids': 'No bids',
      'spot.noOpen': 'No open orders',
      'spot.noStops': 'No stop orders',
      'spot.noTrades': 'No trades',
      'spot.usdtAvail': 'USDT available',
      'spot.btcAvail': 'BTC available',
      'spot.equity': 'Equity',
      'leaderboard.title': 'Leaderboard',
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
    const nav = (navigator.language || 'fi').toLowerCase();
    return nav.startsWith('en') ? 'en' : 'fi';
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
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.getAttribute('data-i18n-placeholder') != null) return;
        // don't overwrite values
      } else {
        el.textContent = val;
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.setAttribute('placeholder', t(key, lang));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title'), lang));
    });

    // Update lang toggle buttons
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      const l = btn.getAttribute('data-lang-btn');
      btn.classList.toggle('active', l === lang);
    });

    const label = document.getElementById('langCurrent');
    if (label) label.textContent = lang.toUpperCase();
  }

  function toggleLang() {
    setLang(getLang() === 'fi' ? 'en' : 'fi');
  }

  /** Small FI | EN control — call after DOM ready */
  function mountLangSwitch(container) {
    const host = typeof container === 'string'
      ? document.querySelector(container)
      : container;
    if (!host || host.querySelector('.helion-lang-switch')) return;

    const wrap = document.createElement('div');
    wrap.className = 'helion-lang-switch';
    wrap.innerHTML =
      '<button type="button" data-lang-btn="fi" aria-label="Suomi">FI</button>' +
      '<button type="button" data-lang-btn="en" aria-label="English">EN</button>';
    wrap.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-btn')));
    });
    host.appendChild(wrap);
    applyLang(getLang());
  }

  // Auto-apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyLang(getLang()));
  } else {
    applyLang(getLang());
  }

  global.HelionI18n = { t, getLang, setLang, toggleLang, applyLang, mountLangSwitch, STRINGS };
  global.t = t;
})(typeof window !== 'undefined' ? window : global);
