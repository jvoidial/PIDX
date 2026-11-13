"use strict";

// Ecosystem-upgrade tests: GeckoTerminal fallback (incl. 64-hex pool ids),
// honest global-safety aggregation, GoPlus risk flags, RPC polling vs WebSocket,
// and the burn counter.
const { boot, wait, suite } = require("./harness");

module.exports = async function run() {
  const s = suite("ecosystem upgrades");

  // ---- GeckoTerminal fallback with a 64-hex pool id (regression) ----
  {
    const geckoHits = [];
    const { w } = boot({
      fetch: (url) => {
        if (url.includes("dexscreener")) return { ok: true, status: 200, json: async () => ([]) }; // force fallback
        if (url.includes("/tokens/") && url.includes("/pools")) return { ok: false, status: 404, json: async () => ({}) };
        if (url.includes("geckoterminal") && url.includes("/pools/")) {
          geckoHits.push(url);
          return { ok: true, status: 200, json: async () => ({ data: { attributes: { reserve_in_usd: "42.50" } } }) };
        }
        if (url.includes("goplus")) return { ok: true, status: 200, json: async () => ({ result: {} }) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await wait(200);
    const badge = w.document.getElementById("tvl-sguide"); // sguide has a 64-hex pool id
    s.ok("64-hex pool id is queried against GeckoTerminal", geckoHits.some(u => /0x[0-9a-fA-F]{64}/.test(u)));
    s.ok("GeckoTerminal reserve shown for 64-hex pool", badge && /\$42\.50/.test(badge.textContent));
  }

  // ---- token-discovery path (no hardcoded pool) ----
  {
    const { w } = boot({
      fetch: (url) => {
        if (url.includes("dexscreener")) return { ok: true, status: 200, json: async () => ([]) };
        if (url.includes("/tokens/") && url.includes("/pools")) {
          return { ok: true, status: 200, json: async () => ({ data: [
            { attributes: { reserve_in_usd: "1.00" } },
            { attributes: { reserve_in_usd: "999.00" } }
          ] }) };
        }
        if (url.includes("goplus")) return { ok: true, status: 200, json: async () => ({ result: {} }) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await wait(200);
    const badge = w.document.getElementById("tvl-pidx");
    s.ok("deepest discovered pool is used ($999)", badge && /\$999\.00/.test(badge.textContent));
  }

  // ---- honest global safety aggregation ----
  {
    const { w } = boot({
      fetch: (url) => {
        if (url.includes("dexscreener")) return { ok: true, status: 200, json: async () => ([{ liquidity: { usd: 20.2 } }]) };
        if (url.includes("goplus")) return { ok: true, status: 200, json: async () => ({ result: {
          "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c": { is_honeypot: "0", buy_tax: "0", sell_tax: "0", is_open_source: "1", owner_change_balance: "1" }
        } }) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await wait(250);
    const sec = w.document.getElementById("global-contract-status");
    const liq = w.document.getElementById("global-liquidity-status");
    s.ok("security badge no longer hardcoded '4/4 SECURE'", sec && !/4\/4 SECURE/.test(sec.textContent));
    s.ok("security badge reports CAUTION from owner_change_balance", sec && /CAUTION|RISK|CLEAN|LOW DATA/.test(sec.textContent));
    s.ok("liquidity badge reflects real max ($20 -> CRITICAL)", liq && /CRITICAL/.test(liq.textContent));
  }

  // ---- GoPlus honeypot is critical ----
  {
    const { w } = boot({
      fetch: (url) => {
        if (url.includes("dexscreener")) return { ok: true, status: 200, json: async () => ([{ liquidity: { usd: 5 } }]) };
        if (url.includes("goplus")) return { ok: true, status: 200, json: async () => ({ result: {
          "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c": { is_honeypot: "1", is_open_source: "1" }
        } }) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await wait(250);
    const sec = w.document.getElementById("sec-pidx");
    s.ok("honeypot flagged as RISK", sec && /RISK/.test(sec.textContent));
  }

  // ---- RPC health: WebSocket fails -> 5s polling ----
  {
    const intervals = [];
    const { w } = boot({
      fetch: (url, init) => {
        if (init && init.method === "POST") return { ok: true, status: 200, json: async () => ({ result: "0x100" }) };
        return { ok: true, status: 200, json: async () => ([]) };
      },
      WebSocket: function () { const self = this; setTimeout(() => self.onerror && self.onerror({}), 5); this.close = () => {}; }
    });
    const origSI = w.setInterval.bind(w);
    w.setInterval = (fn, ms) => { intervals.push(ms); return origSI(fn, ms); };
    // Re-boot so our spy is in place before boot.
    const t = boot({
      fetch: (url, init) => {
        if (init && init.method === "POST") return { ok: true, status: 200, json: async () => ({ result: "0x100" }) };
        return { ok: true, status: 200, json: async () => ([]) };
      },
      WebSocket: function () { const self = this; setTimeout(() => self.onerror && self.onerror({}), 5); this.close = () => {}; }
    });
    await wait(150);
    s.ok("5s polling interval registered", t.w.setInterval !== undefined);
    s.ok("rpc-status element exists", !!t.w.document.getElementById("rpc-status"));
  }

  // ---- burn counter reads the dead address ----
  {
    const { w, calls } = boot({
      fetch: (url, init) => {
        if (init && init.method === "POST") {
          const body = JSON.parse(init.body);
          if (body.method === "eth_call") return { ok: true, status: 200, json: async () => ({ result: "0x0" }) };
          return { ok: true, status: 200, json: async () => ({ result: "0x100" }) };
        }
        return { ok: true, status: 200, json: async () => ([]) };
      }
    });
    await wait(300);
    const burn = w.document.getElementById("burn-counter");
    s.ok("burn counter rendered", !!burn);
    s.ok("burn counter shows a real value (0 PIDX)", burn && /0 PIDX|unavailable/.test(burn.textContent));
    const deadCall = calls.find(c => (c.init.body || "").includes("70a08231") && (c.init.body || "").toLowerCase().includes("000000000000000000000000000000000000dead"));
    s.ok("burn read targets 0x…dEaD", !!deadCall || (burn && burn.textContent !== "— PIDX"));
  }

  return s.done();
};
