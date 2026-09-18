// phb-tokens.js — token card grid with live pool TVL from on-chain reads.
(function () {
  'use strict';

  const DISPLAY = {
    PIDX:    { name: 'Pennies Index',   freq: '0.618 Hz', color: '#88ccff' },
    SGUIDE:  { name: 'SPIRIT GUIDE',    freq: '1.618 Hz', color: '#aaffaa' },
    VDOO:    { name: 'VOUDOO Infinity', freq: '2.618 Hz', color: '#ffaa66' },
    PENNIES: { name: 'PENNIES CHEQ',    freq: '3.618 Hz', color: '#ff88ff' },
  };

  const LINKS = addr => [
    ['Uniswap',    `https://app.uniswap.org/#/swap?chain=base&outputCurrency=${addr}`, '#ff66c4'],
    ['BaseScan',   `https://basescan.org/token/${addr}`,                                '#88ccff'],
    ['Sourcify',   `https://repo.sourcify.dev/8453/${addr}`,                            '#aaffaa'],
    ['CoinGecko',  `https://www.coingecko.com/en/search?query=${addr}`,                 '#ffcc66'],
    ['GeckoTerm',  `https://www.geckoterminal.com/base/tokens/${addr}`,                 '#66ffcc'],
    ['DexScreener',`https://dexscreener.com/base/${addr}`,                              '#cc88ff'],
  ];

  const cache = {};   // sym → poolData

  function buildCard(sym, meta) {
    const addr = meta.address;
    const d = DISPLAY[sym] || { name: sym, freq: '—', color: '#88ccff' };
    const p = cache[sym] || { status: 'pending', tvl_usd: null, pool: null };

    let tvlStr = '—', tag = 'LOADING', tagColor = '#888', tagBg = '#2a2a2a';
    if (p.status === 'no_pool') {
      tvlStr = 'no pool'; tag = 'NO POOL'; tagColor = '#888'; tagBg = '#2a2a2a';
    } else if (p.status === 'pending') {
      tvlStr = '…'; tag = 'LOADING'; tagColor = '#888'; tagBg = '#2a2a2a';
    } else {
      const t = p.tvl_usd;
      tvlStr = t < 0.01 ? '< $0.01' : t < 1 ? '$' + t.toFixed(4) : '$' + t.toLocaleString('en-US', { maximumFractionDigits: 2 });
      if (p.status === 'empty') { tag = 'EMPTY'; tagColor = '#fa6'; tagBg = '#3a2a1a'; }
      else if (p.status === 'tiny') { tag = 'TINY'; tagColor = '#fc6'; tagBg = '#3a301a'; }
      else { tag = 'LIVE'; tagColor = '#6f6'; tagBg = '#1a4a1a'; }
    }

    const poolLine = p.pool
      ? `<div style="font:9px ui-monospace,monospace;color:#3a4a5a;word-break:break-all;margin-bottom:6px;">pool ${p.pool} <span style="color:#5a7a99;">· ${p.factory || ''}</span></div>`
      : '';

    const linkTags = LINKS(addr).map(([label, url, color]) =>
      `<a href="${url}" target="_blank" rel="noopener"
          style="display:inline-block;margin:3px 4px 0 0;padding:3px 9px;
                 font:600 10px ui-monospace,monospace;color:${color};
                 background:#12121c;border:1px solid ${color}33;border-radius:12px;
                 text-decoration:none;letter-spacing:0.3px;">${label}</a>`
    ).join('');

    return `
      <div class="phb-token-card" data-sym="${sym}"
           style="background:linear-gradient(135deg,#0b0d15 0%,#080810 100%);
                  border:1px solid #1a1a2a;border-radius:12px;padding:14px 16px;
                  margin:10px 0;font-family:ui-monospace,monospace;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
          <span style="font:600 15px ui-monospace,monospace;color:${d.color};letter-spacing:1px;">${sym}</span>
          <span style="font:10px ui-monospace,monospace;color:#5a7a99;letter-spacing:1px;">${d.freq}</span>
        </div>
        <div style="font:11px ui-monospace,monospace;color:#8899aa;margin-bottom:2px;">${d.name}</div>
        <div style="font:10px ui-monospace,monospace;color:#4a5a6a;word-break:break-all;margin-bottom:8px;">${addr}</div>
        <div style="font:11px ui-monospace,monospace;color:#889;margin-bottom:6px;">
          Pool TVL:
          <span style="color:${tagColor};font-weight:600;">${tvlStr}</span>
          <span style="margin-left:6px;padding:1px 6px;font-size:9px;border-radius:8px;
                       background:${tagBg};color:${tagColor};">${tag}</span>
        </div>
        ${poolLine}
        <div>${linkTags}</div>
      </div>
    `;
  }

  function findTokensSection() {
    const all = document.querySelectorAll('div,h1,h2,h3,h4,span,p,strong');
    for (const el of all) {
      if (el.children.length > 0) continue;
      const t = (el.textContent || '').trim();
      if (t === '💰 Tokens') return el;
    }
    return null;
  }

  function ensureContainer() {
    let c = document.getElementById('phb-token-grid');
    if (c) return c;
    c = document.createElement('div');
    c.id = 'phb-token-grid';
    c.style.cssText = 'margin:12px 0 20px 0;';
    const heading = findTokensSection();
    if (heading && heading.parentNode) {
      let anchor = heading;
      for (let i = 0; i < 3; i++) {
        if (anchor.parentElement && anchor.parentElement.tagName !== 'BODY') anchor = anchor.parentElement;
        else break;
      }
      anchor.parentNode.insertBefore(c, anchor.nextSibling);
    } else {
      const first = document.body.querySelector('div,section,main') || document.body;
      first.parentNode.insertBefore(c, first.nextSibling || first);
    }
    return c;
  }

  function render() {
    const cfg = PHB.config;
    if (!cfg || !cfg.tokens) return false;
    const c = ensureContainer();
    c.innerHTML = Object.entries(cfg.tokens)
      .map(([sym, meta]) => buildCard(sym, meta))
      .join('');
    return true;
  }

  async function refreshPools() {
    const cfg = PHB.config;
    if (!cfg || !cfg.tokens) return;
    for (const [sym, meta] of Object.entries(cfg.tokens)) {
      // First use PHB source if available
      const fromPHB = PHB.get('pool.' + sym);
      if (fromPHB && fromPHB.value) {
        cache[sym] = fromPHB.value;
      } else if (window.PHBFindPool) {
        try { cache[sym] = await window.PHBFindPool(sym, meta.address); }
        catch (e) { cache[sym] = { status: 'no_pool', pool: null, tvl_usd: 0, price_usd: null }; }
      }
      render();
    }
  }

  function boot() {
    if (typeof PHB === 'undefined') { setTimeout(boot, 200); return; }
    PHB.init().then(() => {
      render();
      refreshPools();
      // Refresh every 30s
      setInterval(refreshPools, 30000);
      // Re-render on PHB pool updates
      PHB.subscribe(key => {
        if (key.startsWith('pool.')) {
          const sym = key.split('.')[1];
          const v = PHB.get(key).value;
          if (v) { cache[sym] = v; render(); }
        }
      });
      console.log('[tokens] grid rendered');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
