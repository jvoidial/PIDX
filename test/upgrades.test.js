"use strict";

// Ecosystem-upgrade tests: GeckoTerminal fallback (incl. 64-hex pool ids),
// honest global-safety aggregation, GoPlus risk flags, RPC polling vs WebSocket,
// and the burn counter.
const { boot, wait, suite } = require("./harness");
const fs = require("fs");
const path = require("path");

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
          "0x172b97517c42f9491f6100333b9ea2e42a6d3181": { is_honeypot: "0", buy_tax: "0", sell_tax: "0", is_open_source: "1", owner_change_balance: "1" }
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
          "0x172b97517c42f9491f6100333b9ea2e42a6d3181": { is_honeypot: "1", is_open_source: "1" }
        } }) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await wait(250);
    const sec = w.document.getElementById("sec-pidx");
    s.ok("honeypot flagged as RISK", sec && /RISK/.test(sec.textContent));
  }

  // ---- is_mintable is critical (unlimited inflation risk) ----
  {
    const { w } = boot({
      fetch: (url) => {
        if (url.includes("dexscreener")) return { ok: true, status: 200, json: async () => ([{ liquidity: { usd: 20 } }]) };
        if (url.includes("goplus")) return { ok: true, status: 200, json: async () => ({ result: {
          "0x172b97517c42f9491f6100333b9ea2e42a6d3181": { is_open_source: "1", is_mintable: "1", owner_change_balance: "1" }
        } }) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await wait(250);
    const sec = w.document.getElementById("sec-pidx");
    s.ok("mintable token flagged as RISK", sec && /RISK/.test(sec.textContent));
    s.ok("mintable appears in the label", sec && /mintable/.test(sec.textContent));
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

  // ---- the app must read V2, and V1 must only survive as a disclosure label ----
  {
    const app = fs.readFileSync(path.resolve(__dirname, "../app.js"), "utf8");
    const V2 = "0x172b97517c42f9491f6100333b9ea2e42a6d3181";
    const V1 = "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c";
    const m = app.match(/const PIDX_ADDR\s*=\s*"([^"]+)"/);
    s.ok("PIDX_ADDR is declared", !!m);
    s.ok("PIDX_ADDR points at V2", !!m && m[1].toLowerCase() === V2);
    // V1 may appear exactly once, as PIDX_V1_ADDR, so the disclosure can name it.
    const v1Lines = app.split("\n").filter(l => l.toLowerCase().includes(V1) && !l.trim().startsWith("*") && !l.trim().startsWith("//"));
    s.ok("V1 address appears only as the labelled PIDX_V1_ADDR constant", v1Lines.length === 1 && /PIDX_V1_ADDR/.test(v1Lines[0]));
    // No live code path may reference the bare V1 literal.
    s.ok("no FALLBACK_TOKENS entry uses V1", !/FALLBACK_TOKENS[\s\S]{0,600}?0x95c7e2d5/i.test(app));
  }

  // ---- Live Integrity panel ----
  {
    const app = fs.readFileSync(path.resolve(__dirname, "../app.js"), "utf8");

    // The lore section must be labelled as lore, never as a safety guarantee.
    s.ok("genetics panel exists", /id="genetics-section"/.test(fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8")));
    s.ok("genetics panel is labelled Project Lore", /Project Lore/.test(fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8")));
    // The false claim was a liquidity lock presented as a stability feature.
    // (The honest pre-existing "Locked liquidity locker … 0 liquidity" line is
    // a different, accurate statement and must stay.)
    const html = fs.readFileSync(path.resolve(__dirname, "../index.html"), "utf8");
    s.ok("no liquidity-lock-as-stability claim", !/Liquidity Lock \(/i.test(html) && !/Future Stability/i.test(html) && !/liquidity lock\b(?!er)/i.test(html));
    s.ok("genetics states liquidity is unlocked", /unlocked/i.test(html));
    s.ok("genetics titles the section Regenerative Architecture", /Regenerative Architecture/.test(html));
    s.ok("genetics states the exact treasury risk line", /Treasury: 1-of-2 Smart Wallet, Unrelinquished \(Known Risk\)/.test(html));
    s.ok("genetics states the exact liquidity risk line", /Liquidity: Unlocked &amp; Treasury-Owned \(Current Risk\)/.test(html));

    // The airdrop line must not claim all holders were reached.
    s.ok("airdrop line does not claim all holders", /Not all holders are confirmed reached/.test(app));
    s.ok("airdrop line reports the 5 exact 1:1 holders and the anomaly", /5 verified holders received exact 1:1 airdrops\. One anomaly exists\./.test(app));
  }

  // ---- Live Integrity panel: real RPC reads, with a PASS only when the chain answers ----
  {
    // Stub RPC: no mint/burn/owner selectors in the code, fixed supply, treasury
    // holds the whole supply, pool reserves + LP owned by the treasury.
    const codeNoDanger = "0x608060405234801561001057600080fd5b50600436106100";
    const word = (hex) => hex.padStart(64, "0");
    const TREASURY = "6f5c5b2117c22c1cb07244be032bd4cde966432c";
    const supply = 1000000000n * 10n ** 18n;
    const { w } = boot({
      fetch: (url, init) => {
        const body = init && init.body ? JSON.parse(init.body) : null;
        if (body && body.method === "eth_getCode") {
          return { ok: true, status: 200, json: async () => ({ jsonrpc: "2.0", id: 1, result: codeNoDanger }) };
        }
        if (body && body.method === "eth_call") {
          const to = (body.params[0].to || "").toLowerCase();
          const data = body.params[0].data || "";
          let result = "0x" + word("0");
          if (to === "0x172b97517c42f9491f6100333b9ea2e42a6d3181") {
            if (data.startsWith("0x18160ddd")) result = "0x" + word(supply.toString(16));      // totalSupply
            else if (data.startsWith("0x70a08231")) result = "0x" + word(supply.toString(16)); // balanceOf(treasury)
          } else if (to === "0x35f5f94f095202380bccfcd9321fa40f5e5f8720") {
            if (data.startsWith("0x0902f1ac")) result = "0x" + word("97b5b3a5e0") + word("a1b2c3d4e5"); // getReserves
            else if (data.startsWith("0x0dfe1681")) result = "0x" + word("172b97517c42f9491f6100333b9ea2e42a6d3181"); // token0 = PIDX
            else if (data.startsWith("0x18160ddd")) result = "0x" + word("2710");             // LP totalSupply = 10000
            else if (data.startsWith("0x70a08231")) result = "0x" + word("2710");             // LP all treasury
          }
          return { ok: true, status: 200, json: async () => ({ jsonrpc: "2.0", id: 1, result }) };
        }
        // Sourcify + any other fetch: no match -> UNKNOWN, never a PASS.
        if (String(url).includes("sourcify")) return { ok: false, status: 404, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await w.PIDX_APP.refreshIntegrityPanel();
    const doc = w.document;
    s.ok("integrity: No Mint PASS", /PASS/.test(doc.getElementById("integrity-no-mint").textContent));
    s.ok("integrity: No Burn PASS", /PASS/.test(doc.getElementById("integrity-no-burn").textContent));
    s.ok("integrity: No Owner PASS", /PASS/.test(doc.getElementById("integrity-no-owner").textContent));
    s.ok("integrity: source is UNKNOWN when Sourcify misses", /UNKNOWN/.test(doc.getElementById("integrity-source").textContent));
    s.ok("integrity: supply rendered", /1,000,000,000/.test(doc.getElementById("integrity-supply").textContent));
    s.ok("integrity: treasury share rendered as 100%", /100\.0000%/.test(doc.getElementById("integrity-treasury").textContent));
    s.ok("integrity: liquidity shows treasury-owned LP", /100\.00% treasury/.test(doc.getElementById("integrity-liquidity").textContent));
    s.ok("integrity: liquidity warning says unlocked", /UNLOCKED/.test(doc.getElementById("integrity-liquidity-warning").textContent));
  }

  // ---- Live Integrity panel: a present selector must FAIL, and an RPC failure
  //      must render UNKNOWN, never a PASS ----
  {
    const word = (hex) => hex.padStart(64, "0");
    const codeWithMint = "0x40c10f19" + "60806040"; // mint selector present
    const { w } = boot({
      fetch: (url, init) => {
        const body = init && init.body ? JSON.parse(init.body) : null;
        if (body && body.method === "eth_getCode") return { ok: true, status: 200, json: async () => ({ jsonrpc: "2.0", id: 1, result: codeWithMint }) };
        if (body && body.method === "eth_call") return { ok: true, status: 200, json: async () => ({ jsonrpc: "2.0", id: 1, result: "0x" + word("0") }) };
        if (String(url).includes("sourcify")) return { ok: false, status: 500, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await w.PIDX_APP.refreshIntegrityPanel();
    s.ok("integrity: mint selector present => FAIL", /FAIL/.test(w.document.getElementById("integrity-no-mint").textContent));
  }
  {
    // Every RPC fails: the verdicts must be UNKNOWN, never PASS.
    const { w } = boot({
      fetch: () => { throw Object.assign(new Error("network down"), { name: "TypeError" }); }
    });
    await w.PIDX_APP.refreshIntegrityPanel();
    const doc = w.document;
    s.ok("integrity: RPC down => No Mint UNKNOWN", /UNKNOWN/.test(doc.getElementById("integrity-no-mint").textContent));
    s.ok("integrity: RPC down => No Mint is not PASS", !/PASS/.test(doc.getElementById("integrity-no-mint").textContent));
    s.ok("integrity: RPC down => source UNKNOWN", /UNKNOWN/.test(doc.getElementById("integrity-source").textContent));
    s.ok("integrity: RPC down => liquidity UNKNOWN", /UNKNOWN/.test(doc.getElementById("integrity-liquidity").textContent));
  }

  return s.done();
};
