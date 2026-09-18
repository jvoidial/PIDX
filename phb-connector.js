// phb-connector.js — real-data engine. No dependencies. Browser + GitHub Pages safe.
const PHB = (function () {
  'use strict';
  let CONFIG = {
    rpc_endpoints: ['https://mainnet.base.org'],
    tick_ms: 5000, max_concurrent: 3, max_retries: 3, timeout_ms: 12000,
    ttl: {}, tokens: {},
  };
  const STATUS = Object.freeze({ LIVE: 'LIVE', STALE: 'STALE', ERR: 'ERR', DEMO: 'DEMO' });
  const memory = new Map();
  const sources = new Map();
  const subscribers = new Set();
  const queue = [];
  let inFlight = 0;
  let activeRpc = null;
  const STORAGE_KEY = 'phb-cache-v1';

  function loadPersisted() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      const now = Date.now();
      for (const [k, v] of Object.entries(obj)) {
        if (v && v.at && now - v.at < 86_400_000) memory.set(k, v);
      }
    } catch (_) {}
  }
  function persist() {
    try {
      const obj = {};
      let n = 0;
      for (const [k, v] of memory.entries()) { if (n++ > 200) break; obj[k] = v; }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (_) {}
  }

  async function fetchJson(url, opts = {}) {
    let lastErr;
    for (let i = 0; i < CONFIG.max_retries; i++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), CONFIG.timeout_ms);
      try {
        const res = await fetch(url, { ...opts, signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        if (i < CONFIG.max_retries - 1)
          await new Promise(r => setTimeout(r, 1500 * (i + 1)));
      }
    }
    throw lastErr;
  }

  async function rpc(method, params = []) {
    const eps = activeRpc
      ? [activeRpc, ...CONFIG.rpc_endpoints.filter(e => e !== activeRpc)]
      : CONFIG.rpc_endpoints;
    let lastErr;
    for (const url of eps) {
      try {
        const data = await fetchJson(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        if (data.error) throw new Error(data.error.message);
        activeRpc = url;
        return data.result;
      } catch (err) { lastErr = err; }
    }
    throw lastErr;
  }

  function register(key, def) {
    sources.set(key, { ttl: def.ttl ?? 60000, kind: def.kind ?? 'live', fetch: def.fetch });
  }

  function statusOf(entry, ttl) {
    if (!entry) return STATUS.DEMO;
    if (entry.error) return STATUS.ERR;
    if (Date.now() - entry.at > ttl * 3) return STATUS.STALE;
    return STATUS.LIVE;
  }

  function get(key) {
    // Support dotted paths: token.PIDX.price_usd → source "token.PIDX", then .price_usd
    const parts = String(key).split('.');
    // Try longest matching source key first
    let srcKey = null;
    for (let n = Math.min(parts.length, 3); n >= 1; n--) {
      const candidate = parts.slice(0, n).join('.');
      if (sources.has(candidate)) { srcKey = candidate; break; }
    }
    if (!srcKey) return { value: null, status: STATUS.DEMO, at: null, error: null };
    const src = sources.get(srcKey);
    const e = memory.get(srcKey);
    let value = e?.value ?? null;
    const rest = parts.slice(srcKey.split('.').length);
    for (const p of rest) {
      if (value && typeof value === 'object' && p in value) value = value[p];
      else { value = null; break; }
    }
    return {
      value,
      status: statusOf(e, src.ttl),
      at: e?.at ?? null,
      error: e?.error ?? null,
    };
  }

  function schedule(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      drain();
    });
  }
  function drain() {
    while (inFlight < CONFIG.max_concurrent && queue.length) {
      const job = queue.shift();
      inFlight++;
      job.fn().then(job.resolve, job.reject).finally(() => { inFlight--; drain(); });
    }
  }

  async function refresh(key) {
    const src = sources.get(key);
    if (!src || src.kind === 'demo') return;
    try {
      const value = await schedule(() => src.fetch());
      memory.set(key, { value, at: Date.now(), error: null });
      persist(); notify(key);
    } catch (err) {
      const prev = memory.get(key);
      memory.set(key, { value: prev?.value ?? null, at: prev?.at ?? Date.now(), error: String(err) });
      notify(key);
    }
  }

  function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }
  function notify(key) { for (const fn of subscribers) try { fn(key, get(key)); } catch (_) {} }

  function tick() {
    const now = Date.now();
    for (const [key, src] of sources.entries()) {
      if (src.kind === 'demo') continue;
      const e = memory.get(key);
      if (!e || now - e.at >= src.ttl) refresh(key);
    }
  }

  function health() {
    const counts = { LIVE: 0, STALE: 0, ERR: 0, DEMO: 0 };
    for (const [key, src] of sources.entries()) counts[statusOf(memory.get(key), src.ttl)]++;
    return { ...counts, total: sources.size, activeRpc, cacheSize: memory.size };
  }

  async function init(configUrl = 'phb-config.json') {
    try {
      CONFIG = await fetchJson(configUrl);
    } catch (err) {
      console.warn('[PHB] config load failed, using defaults:', err.message);
    }
    loadPersisted();
    tick();
    setInterval(tick, CONFIG.tick_ms);
    return CONFIG;
  }

  return {
    STATUS, register, get, refresh, subscribe, health, rpc, fetchJson, init,
    get config() { return CONFIG; },
    _memory: memory,
  };
})();
window.PHB = PHB;
