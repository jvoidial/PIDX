// phb-tokens.js — renders token cards independent of the page's own tokenData.
// Reads token addresses + decimals from phb-config.json (already loaded by PHB).
(function () {
  'use strict';

  const LINKS = (addr) => [
    { label: 'Uniswap',      url: `https://app.uniswap.org/#/swap?chain=base&outputCurrency=${addr}`, color: '#ff66c4' },
    { label: 'BaseScan',     url: `https://basescan.org/token/${addr}`,     color: '#88ccff' },
    { label: 'Sourcify',     url: `https://repo.sourcify.dev/8453/${addr}`, color: '#aaffaa' },
    { label: 'CoinGecko',    url: `https://www.coingecko.com/en/search?query=${addr}`, color: '#ffcc66' },
    { label: 'GeckoTerm',    url: `https://www.geckoterminal.com/base/tokens/${addr}`, color: '#66ffcc' },
    { label: 'DexScreener',  url: `https://dexscreener.com/base/${addr}`,   color: '#cc88ff' },
  ];

  const DISPLAY = {
    PIDX:    { name: 'Pennies Index',   freq: '0.618 Hz' },
    SGUIDE:  { name: 'SPIRIT GUIDE',    freq: '1.618 Hz' },
    VDOO:    { name: 'VOUDOO Infinity', freq: '2.618 Hz' },
    PENNIES: { name: 'PENNIES CHEQ',    freq: '3.618 Hz' },
  };

  function buildCard(sym, meta) {
    const addr = meta.address;
    const disp = DISPLAY[sym] || { name: sym, freq: '—' };
    const pool = PHB.get('pool.' + sym).value;
    const tvl = pool && typeof pool.tvl_usd === 'number' ? pool.tvl_usd : null;
    const tvlStr = tvl == null ? '—' : tvl < 1 ? '< $1' : '$' + tvl.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const poolTag = tvl == null ? 'NOPOOL' : tvl < 500 ? 'EMPTY' : 'LIVE';
    const poolColor = poolTag === 'LIVE' ? '#6f6' : poolTag === 'EMPTY' ? '#fa6' : '#888';

    const links = LINKS(addr).map(L =>
      `<a href="${L.url}" target="_blank" rel="noopener"
          style="display:inline-block;margin:3px 4px 0 0;padding:3px 9px;
                 font:600 10px ui-monospace,monospace;color:${L.color};
                 background:#12121c;border:1px solid ${L.color}33;border-radius:12px;
                 text-decoration:none;letter-spacing:0.3px;">${L.label}</a>`
    ).join('');

    return `
      <div class="phb-token-card" data-sym="${sym}"
           style="background:linear-gradient(135deg,#0b0d15 0%,#080810 100%);
                  border:1px solid #1a1a2a;border-radius:12px;padding:14px 16px;
                  margin:10px 0;font-family:ui-monospace,monospace;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
          <span style="font:600 15px ui-monospace,monospace;color:#cce8ff;letter-spacing:1px;">${sym}</span>
          <span style="font:10px ui-monospace,monospace;color:#5a7a99;letter-spacing:1px;">${disp.freq}</span>
        </div>
        <div style="font:11px ui-monospace,monospace;color:#8899aa;margin-bottom:2px;">${disp.name}</div>
        <div style="font:10px ui-monospace,monospace;color:#4a5a6a;word-break:break-all;margin-bottom:8px;">${addr}</div>
        <div style="font:11px ui-monospace,monospace;color:#889;margin-bottom:6px;">
          Pool TVL:
          <span style="color:${poolColor};font-weight:600;">${tvlStr}</span>
          <span style="margin-left:6px;padding:1px 6px;font-size:9px;border-radius:8px;
                       background:${poolTag === 'LIVE' ? '#1a4a1a' : poolTag === 'EMPTY' ? '#3a2a1a' : '#2a2a2a'};
                       color:${poolColor};">${poolTag}</span>
        </div>
        <div>${links}</div>
      </div>
    `;
  }

  function findTokensSection() {
    // Walk every element, find the one whose text is exactly "💰 Tokens"
    const all = document.querySelectorAll('div,h1,h2,h3,h4,span,p,strong');
    for (const el of all) {
      if (el.children.length > 0) continue;
      const t = (el.textContent || '').trim();
      if (t === '💰 Tokens' || t === 'Tokens' && el.id === 'tokensHeading') return el;
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
      // Insert after the heading's containing section
      let anchor = heading;
      for (let i = 0; i < 3; i++) {
        if (anchor.parentElement && anchor.parentElement.tagName !== 'BODY') anchor = anchor.parentElement;
        else break;
      }
      anchor.parentNode.insertBefore(c, anchor.nextSibling);
    } else {
      // Fallback: prepend before first big black area
      const body = document.body;
      const firstChild = body.querySelector('div,section,main') || body;
      firstChild.parentNode.insertBefore(c, firstChild.nextSibling || firstChild);
    }
    return c;
  }

  function render() {
    const cfg = PHB.config;
    if (!cfg || !cfg.tokens) return false;
    const c = ensureContainer();
    // Replace contents fully on each render — idempotent
    c.innerHTML = Object.entries(cfg.tokens)
      .map(([sym, meta]) => buildCard(sym, meta))
      .join('');
    return true;
  }

  // Re-render when pool data updates (keeps TVL fresh)
  PHB.subscribe((key) => {
    if (key.startsWith('pool.') || key === 'auto.state') {
      // Debounce
      clearTimeout(render._t);
      render._t = setTimeout(render, 250);
    }
  });

  function boot() {
    if (typeof PHB === 'undefined') { setTimeout(boot, 200); return; }
    PHB.init().then(() => {
      render();
      // Re-run once more after pool data comes in
      setTimeout(render, 1500);
      setTimeout(render, 4000);
      console.log('[tokens] card grid rendered');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
