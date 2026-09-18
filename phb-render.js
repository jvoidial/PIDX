// phb-render.js — binds window.PHB.get() to [data-phb] DOM elements.
(function () {
  'use strict';
  const CSS = `
    [data-phb] { position: relative; }
    [data-phb] .phb-badge {
      font-size: 9px; font-weight: 600; padding: 1px 5px;
      border-radius: 8px; margin-left: 5px; vertical-align: middle;
      font-family: ui-monospace, monospace;
    }
    [data-phb].phb-live  .phb-badge { background:#1a4a1a; color:#6f6; }
    [data-phb].phb-stale .phb-badge { background:#4a4a1a; color:#cc6; }
    [data-phb].phb-err   .phb-badge { background:#4a1a1a; color:#f66; }
    [data-phb].phb-demo  { opacity:.55; }
    [data-phb].phb-demo  .phb-badge { background:#2a2a2a; color:#888; }
    [data-phb].phb-sim   { opacity:.7; }
    [data-phb].phb-sim   .phb-badge { background:#3a1a4a; color:#c9f; }
    [data-phb].phb-pool  .phb-badge { background:#1a2a4a; color:#6af; }
    [data-phb].phb-empty { opacity:.75; }
    [data-phb].phb-empty .phb-badge { background:#3a2a1a; color:#fa6; }
    [data-phb].phb-nopool .phb-badge { background:#2a2a2a; color:#888; }
  `;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const FMT = {
    eth: v => v == null ? '—' : `${Number(v).toFixed(6)} ETH`,
    usd: v => v == null ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 8 })}`,
    usd_compact: v => v == null ? '—' : `$${Number(v).toLocaleString('en-US', { notation: 'compact' })}`,
    int: v => v == null ? '—' : Number(v).toLocaleString(),
    gwei: v => v == null ? '—' : `${Number(v).toFixed(2)} gwei`,
    pct: v => v == null ? '—' : `${Number(v).toFixed(2)}%`,
    balance: v => v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 4 }),
    apy: v => v == null ? '—' : `${Number(v).toFixed(2)}%`,
  };
  const fmt = (kind, v) => (FMT[kind] || FMT.int)(v);

  function ago(ts) {
    if (!ts) return 'never';
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  }


  function pickValue(entry) {
    let v = entry.value;
    if (v && typeof v === 'object') {
      if ('price_usd' in v && v.price_usd != null) return v.price_usd;
      if ('tvl_usd' in v) return v.tvl_usd;
      if ('value' in v) return v.value;
    }
    return v;
  }

  function renderElement(el) {
    const key = el.dataset.phb;
    if (!key) return;
    const kind = el.dataset.phbFmt || 'int';
    const entry = PHB.get(key);
    const cls = 'phb-' + entry.status.toLowerCase();

    el.classList.remove('phb-live','phb-pool','phb-empty','phb-nopool','phb-stale','phb-err','phb-demo','phb-sim');
    // Map simulation status to SIM badge
    const finalCls = (entry.status === 'DEMO' && entry.value && entry.value.status === 'simulation')
      ? 'phb-sim' : cls;
    el.classList.add(finalCls);

    let valEl = el.querySelector('[data-phb-value]');
    if (valEl) {
      valEl.textContent = fmt(kind, pickValue(entry));
    } else {
      let badge = el.querySelector('.phb-badge');
      el.textContent = fmt(kind, pickValue(entry));
      if (badge) el.appendChild(badge);
    }

    let badge = el.querySelector('.phb-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'phb-badge';
      el.appendChild(badge);
    }
    badge.textContent = (entry.status === 'DEMO' && entry.value && entry.value.status === 'simulation')
      ? 'SIM' : entry.status;
    badge.title = entry.error ? `Error: ${entry.error}` : `Updated ${ago(entry.at)}`;
  }

  function renderAll() { document.querySelectorAll('[data-phb]').forEach(renderElement); }

  PHB.subscribe(key => {
    document.querySelectorAll(`[data-phb="${key}"]`).forEach(renderElement);
  });
  setInterval(renderAll, 15000);

  window.PHBRender = { renderAll, renderElement, FMT };

  function boot() { PHB.init().then(renderAll); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
