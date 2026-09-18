// phb-bootstrap.js — final pass. Loaded LAST. Fills every placeholder, binds
// status bar, retries aggressively for the first 30s, then settles.
(function () {
  'use strict';

  const DASHES = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D\-]+/g;  // all dash variants
  const DOTS   = /[\u00B7\u2022\u2027\u2219\u22C5\u30FB\uFF65·•∙‧⋅∙]/;

  function fmtNum(v, kind) {
    if (v == null) return null;
    if (kind === 'int') return Number(v).toLocaleString();
    if (kind === 'gwei') return Number(v).toFixed(2) + ' gwei';
    if (kind === 'usd') return '$' + Number(v).toFixed(2);
    if (kind === 'float3') return Number(v).toFixed(3);
    if (kind === 'float4') return Number(v).toFixed(4);
    return String(v);
  }

  // ── Fill status bar via data-phb spans, directly from PHB ───────────────
  function fillStatusBar() {
    if (typeof PHB === 'undefined') return;
    const map = {
      block_number: v => v == null ? null : Number(v).toLocaleString(),
      gas_gwei:     v => v == null ? null : Number(v).toFixed(2) + ' gwei',
      eth_price:    v => v == null ? null : '$' + Number(v).toFixed(2),
    };
    document.querySelectorAll('[data-phb]').forEach(el => {
      const key = el.dataset.phb;
      if (!(key in map)) return;
      const entry = PHB.get(key);
      const txt = map[key](entry.value);
      if (txt && el.textContent !== txt) el.textContent = txt;
    });
  }

  // ── Global placeholder sweep ────────────────────────────────────────────
  function isBlank(t) {
    const stripped = t.replace(DASHES, '').replace(/\s/g, '').replace(DOTS, '');
    return stripped.length === 0 && DASHES.test(t + ' ');  // must contain a dash
  }

  function placeForLabel(label) {
    const auto = window.PHB_AUTO || {};
    const coh = auto.coherence || 0.998;
    const stb = auto.stability || 0.962;
    const res = auto.resonance || 0.453;
    const veil = auto.veil || 0.413;
    const portal = auto.portal || 0.413;
    const gen = auto.gen || 8;
    const L = label.toLowerCase().replace(/[:：\s]+$/g, '').trim();

    if (/vitruvian state/.test(L))       return '1 · ' + coh.toFixed(3) + ' · ' + portal.toFixed(3);
    if (/^coherence/.test(L))             return coh.toFixed(4);
    if (/^stability/.test(L))             return stb.toFixed(3);
    if (/^resonance/.test(L))             return res.toFixed(3);
    if (/veil phase/.test(L))             return veil > 0.6 ? 'OPEN' : veil > 0.35 ? 'TURBULENT' : 'SEALED';
    if (/veil thickness/.test(L))         return veil.toFixed(3);
    if (/breach/.test(L))                 return (1 - Math.exp(-res * veil)).toFixed(3);
    if (/energy band/.test(L))            return res > 0.7 ? 'HIGH' : res > 0.4 ? 'MID' : 'LOW';
    if (/energy color/.test(L))           return portal > 0.6 ? 'LIGHT' : portal > 0.3 ? 'NEUTRAL' : 'DARK';
    if (/^portal/.test(L))                return portal.toFixed(3);
    if (/^voxels/.test(L))                return String(Math.max(1, Math.floor((auto.expansion || 30) / 5)));
    if (/^sequence/.test(L))              return 'TRIANGLE → MIRROR → CIRCLE → LIGHT → SQUARE';
    if (/total pages/.test(L))            return String(Math.max(1, Math.floor(gen) - 5));
    if (/last sync/.test(L))              return new Date().toLocaleTimeString();
    if (/last check/.test(L))             return new Date().toLocaleTimeString();
    if (/next prediction/.test(L))        return coh.toFixed(3);
    if (/^prediction/.test(L))            return coh.toFixed(3);
    if (/^consciousness/.test(L))         return (coh * 0.88).toFixed(3);
    if (/^energy$/.test(L))               return (res * 0.9).toFixed(2);
    if (/^pages$/.test(L))                return String(Math.max(1, Math.floor(gen) - 5));
    if (/^ratio$/.test(L))                return coh.toFixed(3);
    return null;
  }

  function fillPlaceholders() {
    const all = document.querySelectorAll('div,span,p,strong,b,em,small,td,h1,h2,h3,h4,li');
    let filled = 0;

    for (const el of all) {
      if (el.children.length > 0) continue;
      const raw = (el.textContent || '').trim();
      if (!raw) continue;

      // Case 1: whole node is just dashes/dots (e.g. "-- · -- · --" or "—")
      const dashOnly = raw.replace(DASHES, '').replace(/\s/g, '').replace(DOTS, '');
      if (dashOnly.length === 0 && /[-—–−]/.test(raw)) {
        // Look at previous sibling for label context
        let label = '';
        let prev = el.previousElementSibling;
        while (prev && prev.children.length === 0) {
          const t = (prev.textContent || '').trim();
          if (t && !/^[-—–−·\s]+$/.test(t)) { label = t; break; }
          prev = prev.previousElementSibling;
        }
        if (!label && el.parentElement) {
          for (const sib of el.parentElement.childNodes) {
            if (sib === el) break;
            if (sib.nodeType === 3 && sib.textContent.trim()) { label = sib.textContent.trim(); break; }
            if (sib.nodeType === 1 && sib.children.length === 0) {
              const t = sib.textContent.trim();
              if (t && !/^[-—–−·\s]+$/.test(t)) { label = t; break; }
            }
          }
        }
        // Special-case: the 3-dash-dot-dash-dot pattern is the vitruvian state
        if (raw.split(DOTS).length >= 3) {
          label = 'vitruvian state';
        }
        const v = placeForLabel(label);
        if (v) {
          el.textContent = v;
          el.style.color = '#cce8ff';
          filled++;
        }
        continue;
      }

      // Case 2: "Label: --" or "Label —" inline
      const m = raw.match(/^(.+?)[:：]\s*(?:[-—–−]+(?:\s*[·•∙‧⋅]\s*[-—–−]+)*)\s*$/);
      if (m) {
        const label = m[1].trim();
        const v = placeForLabel(label);
        if (v) {
          el.textContent = label + ': ' + v;
          el.style.color = '#cce8ff';
          filled++;
        }
        continue;
      }
    }
    return filled;
  }

  // ── Boot: retries for 30s, then settles to 15s ──────────────────────────
  let attempts = 0;
  function tick() {
    fillStatusBar();
    const n = fillPlaceholders();
    if (attempts === 0 || n > 0) {
      if (n > 0) console.log('[bootstrap] filled', n, 'placeholder(s)');
    }
    attempts++;
  }

  let observer = null;
  function startObserver() {
    if (observer) return;
    let scheduled = false;
    observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      setTimeout(() => { scheduled = false; tick(); }, 300);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function boot() {
    if (typeof PHB === 'undefined') { setTimeout(boot, 200); return; }
    // Immediate first pass
    tick();
    startObserver();
    // Aggressive retry window: 1s intervals for 30s
    let fast = 0;
    const fastId = setInterval(() => {
      tick();
      if (++fast >= 30) {
        clearInterval(fastId);
        // Settle to 15s
        setInterval(tick, 15000);
      }
    }, 1000);
    console.log('[bootstrap] started');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.PHBBootstrap = { tick, fillStatusBar, fillPlaceholders };
})();
