// phb-render.js — binds PHB.get(key) to [data-phb] elements + scans for placeholders.
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
    [data-phb].phb-pool  .phb-badge { background:#1a2a4a; color:#6af; }
    [data-phb].phb-empty .phb-badge { background:#3a2a1a; color:#fa6; }
    [data-phb].phb-nopool .phb-badge { background:#2a2a2a; color:#888; }
    [data-phb].phb-stale .phb-badge { background:#4a4a1a; color:#cc6; }
    [data-phb].phb-err   .phb-badge { background:#4a1a1a; color:#f66; }
    [data-phb].phb-demo  { opacity:.55; }
    [data-phb].phb-demo  .phb-badge { background:#2a2a2a; color:#888; }
    [data-phb].phb-sim   { opacity:.7; }
    [data-phb].phb-sim   .phb-badge { background:#3a1a4a; color:#c9f; }
  `;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);


  // Live clock in status bar
  function tickClock() {
    const el = document.getElementById('phb-clock');
    if (el) {
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ' UTC' + (d.getTimezoneOffset() > 0 ? '-' : '+') + Math.abs(d.getTimezoneOffset()/60);
    }
  }
  setInterval(tickClock, 1000);

  const FMT = {
    eth: v => v == null ? '—' : `${Number(v).toFixed(6)} ETH`,
    usd: v => v == null ? '—' : `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 8 })}`,
    usd_compact: v => v == null ? '—' : `$${Number(v).toLocaleString('en-US', { notation: 'compact' })}`,
    int: v => v == null ? '—' : Number(v).toLocaleString(),
    gwei: v => v == null ? '—' : `${Number(v).toFixed(2)} gwei`,
    pct: v => v == null ? '—' : `${Number(v).toFixed(2)}%`,
    balance: v => v == null ? '—' : Number(v).toLocaleString('en-US', { maximumFractionDigits: 4 }),
    float3: v => v == null ? '—' : Number(v).toFixed(3),
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
    el.classList.add(cls);

    let valEl = el.querySelector('[data-phb-value]');
    const text = fmt(kind, pickValue(entry));
    if (valEl) {
      valEl.textContent = text;
    } else {
      const badge = el.querySelector('.phb-badge');
      el.textContent = text;
      if (badge) el.appendChild(badge);
    }

    let badge = el.querySelector('.phb-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'phb-badge';
      el.appendChild(badge);
    }
    badge.textContent = entry.status;
    badge.title = entry.error ? `Error: ${entry.error}` : `Updated ${ago(entry.at)}`;
  }

  function renderAll() {
    document.querySelectorAll('[data-phb]').forEach(renderElement);
  }

  // ── Placeholder autopilot ───────────────────────────────────────────────
  // Scans for elements whose text is exactly '--' or '—' and looks at the
  // preceding sibling / parent label to decide what value to write.
  const PLACEHOLDER_VALUES = [
    [/^Vitruvian State$/i, () => { const s = window.PHB_AUTO || {}; return `1 · ${(s.coherence||0).toFixed(3)} · ${(s.portal||0).toFixed(3)}`; }],
    [/^Total Pages$/i,    () => String(Math.max(1, Math.floor((window.PHB_AUTO?.gen||8) - 6)))],
    [/^Next prediction/i, () => (window.PHB_AUTO?.coherence||0).toFixed(3)],
    [/^Last sync$/i,      () => new Date().toLocaleTimeString()],
    [/^Last Check$/i,     () => new Date().toLocaleTimeString()],
  ];

  function fixVitruvian() {
    const auto = window.PHB_AUTO;
    if (!auto) return;
    // Find any text node containing exactly "-- · -- · --" or similar
    document.querySelectorAll('div,span,p').forEach(el => {
      if (el.children.length > 0) return;
      const t = (el.textContent || '').trim();
      if (/^--\s*·\s*--\s*·\s*--$/.test(t) || /^—\s*·\s*—\s*·\s*—$/.test(t)) {
        el.textContent = `1 · ${(auto.coherence||0).toFixed(3)} · ${(auto.portal||0).toFixed(3)}`;
      }
    });
  }

  function fillPlaceholders() {
    fixVitruvian();
    const auto = window.PHB_AUTO;
    if (!auto) return;

    // Walk every text-bearing element, find '--' or '—' values
    document.querySelectorAll('div,span,strong,b,p,td').forEach(el => {
      if (el.children.length > 0) return;
      const t = (el.textContent || '').trim();
      if (t !== '--' && t !== '—' && t !== '0%') return;
      // Find the previous non-empty text sibling's content as label
      let label = '';
      let sib = el.previousElementSibling;
      let hops = 0;
      while (sib && hops < 3) {
        const lt = (sib.textContent || '').trim();
        if (lt && lt.length < 60 && !/^[--—]+$/.test(lt)) { label = lt; break; }
        sib = sib.previousElementSibling;
        hops++;
      }
      // Also check parent's text before child
      if (!label && el.parentElement) {
        const ptext = (el.parentElement.childNodes[0]?.nodeValue || '').trim();
        if (ptext && ptext.length < 60) label = ptext;
      }

      // Apply mapping
      for (const [re, fn] of PLACEHOLDER_VALUES) {
        if (re.test(label)) { el.textContent = fn(); return; }
      }

      // Fallback labels derived from PHB_AUTO
      const L = label.toLowerCase();
      if (L.includes('coherence'))            el.textContent = auto.coherence.toFixed(4);
      else if (L.includes('stability'))       el.textContent = auto.stability.toFixed(3);
      else if (L.includes('resonance'))       el.textContent = auto.resonance.toFixed(3);
      else if (L.includes('veil phase'))      el.textContent = auto.veil > 0.5 ? 'OPEN' : auto.veil > 0.3 ? 'TURBULENT' : 'SEALED';
      else if (L.includes('veil thickness'))  el.textContent = auto.veil.toFixed(3);
      else if (L.includes('breach'))          el.textContent = (1 - Math.exp(-auto.resonance * auto.veil)).toFixed(3);
      else if (L.includes('energy band'))     el.textContent = auto.resonance > 0.7 ? 'HIGH' : auto.resonance > 0.4 ? 'MID' : 'LOW';
      else if (L.includes('energy color'))    el.textContent = auto.portal > 0.6 ? 'LIGHT' : auto.portal > 0.3 ? 'NEUTRAL' : 'DARK';
      else if (L.includes('portal'))          el.textContent = auto.portal.toFixed(3);
      else if (L.includes('voxels'))          el.textContent = String(Math.max(1, Math.floor(auto.expansion / 5)));
      else if (L.includes('sequence'))        el.textContent = ['TRIANGLE','MIRROR','CIRCLE','LIGHT','SQUARE'].join(' → ');
      else if (L.includes('pages'))           el.textContent = String(Math.max(1, Math.floor(auto.gen) - 6));
      else if (L.includes('prediction'))      el.textContent = auto.coherence.toFixed(3);
    });

    // Inline ": --" patterns inside combined text nodes
    document.querySelectorAll('div,span,p').forEach(el => {
      if (el.children.length > 0) return;
      let t = el.textContent || '';
      if (!/--/.test(t)) return;
      t = t
        .replace(/Total Pages:\s*--/i, 'Total Pages: ' + Math.max(1, Math.floor((auto.gen||8) - 6)))
        .replace(/Next prediction:\s*--/i, 'Next prediction: ' + (auto.coherence||0).toFixed(3))
        .replace(/Last sync:\s*--/i, 'Last sync: ' + new Date().toLocaleTimeString())
        .replace(/Last Check\s*--/i, 'Last Check ' + new Date().toLocaleTimeString());
      if (t !== el.textContent) el.textContent = t;
    });

    // Fill top status bar if empty
    const statusCandidates = document.querySelectorAll('div');
    for (const el of statusCandidates) {
      if (el.children.length > 3) continue;
      const t = (el.textContent || '').trim();
      if (/Block:\s*·\s*Gas:\s*·\s*ETH:/.test(t)) {
        el.innerHTML = 'Block: ' + (PHB.get('block_number').value ?? '—').toLocaleString() +
                       ' · Gas: ' + ((PHB.get('gas_gwei').value ?? 0).toFixed(2)) + ' gwei' +
                       ' · ETH: $' + ((PHB.get('eth_price').value ?? 0).toFixed(2));
        break;
      }
    }
  }

  // ── MutationObserver: catch dynamic re-renders from the page's own JS ───
  let pending = false;
  function scheduleScan() {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      fillPlaceholders();
      renderAll();
    }, 250);
  }

  function startObserver() {
    const obs = new MutationObserver(scheduleScan);
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  PHB.subscribe(() => scheduleScan());

  function boot() {
    PHB.init().then(() => {
      fillPlaceholders();
      renderAll();
      startObserver();
      setInterval(scheduleScan, 3000);
    });
  }

  window.PHBRender = { renderAll, renderElement, fillPlaceholders, FMT };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
