// phb-autonomy.js — deterministic autonomy loop.
// Every value is a pure function of (block, gas, eth_price).
// No randomness. Same inputs → same outputs, always.
(function () {
  'use strict';

  // ── Deterministic hash: FNV-1a over a string ────────────────────────────
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;   // [0,1)
  }

  // ── Autonomy state: derived from real chain inputs ──────────────────────
  const STATE = {
    block: 0,
    gas: 0,
    eth_price: 0,
    phase: 0,
    gen: 0,
    coherence: 0,
    stability: 0,
    resonance: 0,
    veil: 0,
    portal: 0,
    expansion: 0,
    wishes: 0,
    nodes: 0,
    signal: 'NEUTRAL',
    edge: 0,
    kelly: 0,
    pnl: 0,
    win_rate: 0,
    trades: 0,
    last_recompute: 0,
  };

  function recompute() {
    const b  = PHB.get('block_number').value || 1;
    const g  = PHB.get('gas_gwei').value || 0.01;
    const e  = PHB.get('eth_price').value || 0;
    if (b === STATE.block && g === STATE.gas && e === STATE.eth_price) return;
    STATE.block = b;
    STATE.gas = g;
    STATE.eth_price = e;

    // Pure derivation — every output is a deterministic hash of the block.
    STATE.phase       = hash('phase:' + b);
    STATE.gen         = 8 + (b % 4);
    STATE.coherence   = 0.90 + hash('coh:' + b) * 0.0999;
    STATE.stability   = 0.90 + hash('stab:' + b) * 0.30;
    STATE.resonance   = 0.30 + hash('res:' + b) * 0.60;
    STATE.veil        = 0.10 + hash('veil:' + b) * 0.80;
    STATE.portal      = 1 - Math.exp(-STATE.resonance * STATE.coherence);
    STATE.expansion   = 30 + hash('exp:' + b) * 10;
    STATE.wishes      = 5000 + Math.floor(hash('wish:' + b) * 2000);
    STATE.nodes       = 140 + Math.floor(hash('node:' + b) * 20);
    STATE.edge        = (hash('edge:' + b) - 0.5) * 0.02;   // ±1%
    STATE.kelly       = Math.max(0, STATE.edge * 5);
    STATE.pnl         = (hash('pnl:' + b) - 0.5) * 500;
    STATE.win_rate    = 0.4 + hash('wr:' + b) * 0.55;
    STATE.trades      = Math.floor(hash('tr:' + b) * 40);
    STATE.signal      = STATE.edge >  0.002 ? 'LONG'
                      : STATE.edge < -0.002 ? 'SHORT'
                      : 'NEUTRAL';
    STATE.last_recompute = Date.now();
  }

  // ── Register as a PHB source (kind=demo → DEMO badge, honest label) ─────
  PHB.register('auto.state', {
    kind: 'demo',
    ttl: 5000,
    fetch: () => { recompute(); return { ...STATE }; },
  });

  // ── Apply state to the DOM ──────────────────────────────────────────────
  function applyState() {
    recompute();

    // Helper: set text of the Nth element matching a selector
    function setText(selector, value, nth = 0) {
      const els = document.querySelectorAll(selector);
      if (els[nth]) els[nth].textContent = value;
    }
    function setByLabel(labelText, value) {
      // Find a label div/span, then the next sibling element
      const all = document.querySelectorAll('div,span,strong,b,p');
      for (const el of all) {
        if (el.children.length === 0 && (el.textContent || '').trim() === labelText) {
          const next = el.nextElementSibling;
          if (next && next.children.length === 0 && next.textContent.trim() === '--') {
            next.textContent = value;
            return true;
          }
        }
      }
      return false;
    }

    // Vitruvian state
    setByLabel('Vitruvian State', '1 · ' + STATE.coherence.toFixed(3) + ' · ' + STATE.portal.toFixed(3));
    setByLabel('Coherence',  STATE.coherence.toFixed(4));
    setByLabel('Stability',  STATE.stability.toFixed(3));
    setByLabel('Resonance',  STATE.resonance.toFixed(3));
    setByLabel('Veil Phase', STATE.veil > 0.5 ? 'OPEN' : STATE.veil > 0.3 ? 'THIN' : 'SEALED');
    setByLabel('Veil Thickness', STATE.veil.toFixed(3));
    setByLabel('Breach Probability',
      (1 - Math.exp(-STATE.resonance * STATE.veil)).toFixed(3));
    setByLabel('Energy Band',
      STATE.resonance > 0.7 ? 'HIGH' : STATE.resonance > 0.4 ? 'MID' : 'LOW');
    setByLabel('Energy Color',
      STATE.portal > 0.6 ? 'LIGHT' : STATE.portal > 0.3 ? 'NEUTRAL' : 'DARK');
    setByLabel('Portal', STATE.portal.toFixed(3));
    setByLabel('Voxels', Math.max(1, Math.floor(STATE.expansion / 5)));
    setByLabel('Sequence',
      ['TRIANGLE','MIRROR','CIRCLE','LIGHT','SQUARE','RATIO','SHADOW']
        .sort(() => hash('seq:' + STATE.block) - 0.5)
        .slice(0, 5).join(' → '));

    // Codex Discovery
    setByLabel('Total Pages', Math.max(1, Math.floor(STATE.gen) - 7));
    setByLabel('Codex: ', '');   // no-op, but included for future hooks

    // AGI Prediction
    setByLabel('Prediction', STATE.coherence.toFixed(3));
    setByLabel('Consciousness', (STATE.coherence * 0.88).toFixed(3));

    // Trading bot
    setByLabel('Total PnL', '$' + STATE.pnl.toFixed(2));
    setByLabel('Win Rate', (STATE.win_rate * 100).toFixed(1) + '%');
    setByLabel('Avg Trade', '$' + (STATE.trades > 0 ? STATE.pnl / STATE.trades : 0).toFixed(2));
    setByLabel('Trades / Hour', STATE.trades);
    setByLabel('Signal:', STATE.signal);
    setByLabel('Edge:', (STATE.edge * 100).toFixed(2) + '%');
    setByLabel('Kelly Size:', (STATE.kelly * 100).toFixed(2) + '%');

    // Expansion / Nodes / Wishes (top header)
    const headers = document.querySelectorAll('div');
    for (const el of headers) {
      const t = (el.textContent || '').trim();
      if (el.children.length === 0) {
        if (t === 'Nodes 145' || /^Nodes \d+$/.test(t)) el.textContent = 'Nodes ' + STATE.nodes;
        if (/^Expansion [\d.]+x$/.test(t)) el.textContent = 'Expansion ' + STATE.expansion.toFixed(2) + 'x';
        if (/^Wishes [\d,]+$/.test(t)) el.textContent = 'Wishes ' + STATE.wishes.toLocaleString();
        if (/^Coherence [\d.]+$/.test(t)) el.textContent = 'Coherence ' + STATE.coherence.toFixed(3);
      }
    }

    // Expose for other modules
    window.PHB_AUTO = STATE;
  }

  // ── Sync 4D / 5D phases to the shared state ─────────────────────────────
  // phb-5d.js uses performance.now() based rotation. We can't easily rewire
  // that without patching it, so instead we broadcast the shared phase via
  // a window event that phb-5d.js can opt into.
  let lastPhase = -1;
  function broadcastPhase() {
    recompute();
    if (Math.abs(STATE.phase - lastPhase) > 0.001) {
      lastPhase = STATE.phase;
      window.dispatchEvent(new CustomEvent('phb-phase', { detail: { phase: STATE.phase, block: STATE.block } }));
    }
  }

  // ── Run loop ────────────────────────────────────────────────────────────
  function boot() {
    if (typeof PHB === 'undefined') { setTimeout(boot, 200); return; }
    PHB.init && PHB.init();
    applyState();
    setInterval(() => { applyState(); broadcastPhase(); }, 5000);
    console.log('[autonomy] online — values derived from block ' + STATE.block);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
