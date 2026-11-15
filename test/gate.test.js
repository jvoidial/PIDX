"use strict";

// Path B — the read-only holdings gate, exercised through the real app runtime.
// These assert the three mutually exclusive render states, the two failure
// states, and that no performance metric is ever rendered in any state.
const fs = require("fs");
const path = require("path");
const { boot, wait, suite, ROOT } = require("./harness");

const GATE = "0x2222222222222222222222222222222222222222";
const WALLET = "0x1111111111111111111111111111111111111111";
const ONE = 10n ** 18n;

// eth_call word (32-byte hex) for a boolean and a uint256.
const wordBool = (b) => "0x" + (b ? "1" : "0").padStart(64, "0");
const wordUint = (n) => "0x" + n.toString(16).padStart(64, "0");

function setGateAddress(html, addr) {
  // The gate address lives in a data-address attribute (same pattern as the
  // other deployed-address slots). Empty string means "not configured".
  return html.replace(/id="gate-addr" data-address="[^"]*"/, `id="gate-addr" data-address="${addr}"`);
}

module.exports = async function run() {
  const s = suite("path B: holdings gate");
  const htmlRaw = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");

  // ---- static shape: the performance rows are gone, not em-dashed ----
  {
    const html = htmlRaw.replace(/<!--[\s\S]*?-->/g, "");
    for (const id of ["dca-pnl", "dca-win", "dca-trades", "grid-pnl", "grid-win", "grid-trades"]) {
      s.ok("row removed: #" + id, !new RegExp(`id="${id}"`).test(html));
    }
    s.ok("no PnL label in markup", !/>\s*PnL\s*</.test(html));
    s.ok("no Win Rate label in markup", !/>\s*Win Rate\s*</.test(html));
    s.ok("no Trades/hr label in markup", !/>\s*Trades\/hr\s*</.test(html));
    s.ok("Strategy descriptor kept (DCA)", /id="dca-strategy">MOMENTUM</.test(html));
    s.ok("Strategy descriptor kept (Grid)", /id="grid-strategy">GRID</.test(html));
    s.ok("status reads NOT DEPLOYED", /id="dca-status"[^>]*>NOT DEPLOYED</.test(html) && /id="grid-status"[^>]*>NOT DEPLOYED</.test(html));
    s.ok("gate line present on both cards", /id="dca-gate"/.test(html) && /id="grid-gate"/.test(html));
    s.ok("gate address slot present", /id="gate-addr" data-address=/.test(html));
    // Path C: no start/stop controls remain.
    s.ok("no start/stop button in markup", !/id="dca-btn"|id="grid-btn"/.test(html));
    s.ok("no Start/Stop handler in app.js", !/Start Bot|Stop Bot/.test(app));
  }

  // ---- build a boot harness for a given gate address + eth_call responder ----
  function makeBoot(gateAddr, responder) {
    const html = setGateAddress(htmlRaw, gateAddr).replace(/<script\b[^>]*><\/script>/gi, "");
    const { JSDOM } = require("jsdom");
    const dom = new JSDOM(html, { runScripts: "outside-only", url: "https://pidx.example/", pretendToBeVisual: true });
    const w = dom.window;
    w.alert = () => {};
    const consoleErrors = [];
    w.console = Object.assign({}, console, { error: (...a) => consoleErrors.push(a.join(" ")) });

    const eth = {
      request: async (p) => {
        if (p.method === "eth_requestAccounts") return [WALLET];
        if (p.method === "eth_chainId") return "0x2105";
        return "0x1";
      },
      on() {}
    };
    w.ethereum = eth;

    // Intercept the RPC POSTs the app makes.
    w.fetch = (url, init) => {
      const u = String(url);
      if (init && init.method === "POST") {
        let body = {};
        try { body = JSON.parse(init.body); } catch (_) {}
        if (body.method === "eth_call") {
          const call = (body.params && body.params[0]) || {};
          const data = String(call.data || "");
          if (responder) {
            const r = responder(data, call.to);
            if (r !== undefined) return Promise.resolve({ ok: true, status: 200, json: async () => ({ result: r }) });
          }
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ result: wordBool(false) }) });
        }
        if (body.method === "eth_blockNumber") {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ result: "0x100" }) });
        }
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ result: "0x0" }) });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ([]) });
    };

    const APP = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
    const PURIFY = fs.readFileSync(path.join(ROOT, "test", "lib", "purify.min.js"), "utf8");
    w.eval(PURIFY);
    w.eval(APP);
    w.dispatchEvent(new w.Event("DOMContentLoaded"));
    return { w, consoleErrors };
  }

  async function connectAndGate(gateAddr, responder) {
    const { w, consoleErrors } = makeBoot(gateAddr, responder);
    await wait(30);
    const btn = w.document.getElementById("connect-wallet-btn");
    if (btn) btn.click();
    await wait(120);
    await w.PIDX_APP.updateBotGate();
    await wait(80);
    return { w, consoleErrors };
  }

  const gateText = (w, id) => (w.document.getElementById(id) || {}).textContent || "";

  // ---- state 1: disconnected ----
  {
    const { w } = makeBoot(GATE, null);
    await wait(60);
    await w.PIDX_APP.updateBotGate();
    await wait(30);
    s.ok("disconnected -> connect prompt", /Connect wallet to check eligibility/.test(gateText(w, "dca-gate")));
    s.ok("disconnected -> grid same", /Connect wallet to check eligibility/.test(gateText(w, "grid-gate")));
  }

  // ---- state 2: below threshold (999) ----
  {
    const { w } = await connectAndGate(GATE, (data) => {
      if (data.startsWith("0xb04f81f0")) return wordBool(false);          // meetsThreshold
      if (data.startsWith("0x70a08231")) return wordUint(999n * ONE);      // balanceOf
      return undefined;
    });
    s.ok("below threshold -> Locked", /^Locked · requires 1,000 PIDX/.test(gateText(w, "dca-gate")));
    s.ok("below threshold shows real balance", /you hold 999/.test(gateText(w, "dca-gate")));
    s.ok("below threshold -> grid same", /^Locked · requires 1,000 PIDX/.test(gateText(w, "grid-gate")));
  }

  // ---- state 3: at/above threshold (1000) ----
  {
    const { w } = await connectAndGate(GATE, (data) => {
      if (data.startsWith("0xb04f81f0")) return wordBool(true);
      if (data.startsWith("0x70a08231")) return wordUint(1000n * ONE);
      return undefined;
    });
    s.ok("at threshold -> Unlocked", /^Unlocked · trading not yet available$/.test(gateText(w, "dca-gate")));
    s.ok("at threshold -> grid same", /^Unlocked · trading not yet available$/.test(gateText(w, "grid-gate")));
  }

  // ---- state 4: RPC failure ----
  {
    const { w } = makeBoot(GATE, null);
    // Replace fetch so every eth_call rejects (simulating RPC down).
    w.fetch = (url, init) => {
      if (init && init.method === "POST") return Promise.reject(new Error("network down"));
      return Promise.resolve({ ok: true, status: 200, json: async () => ([]) });
    };
    await wait(30);
    const btn = w.document.getElementById("connect-wallet-btn");
    if (btn) btn.click();
    await wait(120);
    await w.PIDX_APP.updateBotGate();
    await wait(80);
    const t = gateText(w, "dca-gate");
    s.ok("rpc failure -> Eligibility check failed", /^Eligibility check failed$/.test(t));
    s.ok("rpc failure does not render Unlocked", !/Unlocked/.test(t));
    s.ok("rpc failure does not render Locked", !/Locked/.test(t));
  }

  // ---- state 5: gate address unset ----
  {
    const { w, consoleErrors } = await connectAndGate("", (data) => {
      if (data.startsWith("0xb04f81f0")) return wordBool(true);
      return undefined;
    });
    const t = gateText(w, "dca-gate");
    s.ok("unset address -> Eligibility check unavailable", /^Eligibility check unavailable$/.test(t));
    s.ok("unset address does not render Unlocked", !/Unlocked/.test(t));
    s.ok("unset address does not render Locked", !/Locked/.test(t));
    s.ok("unset address logs a console error", consoleErrors.some(x => /gate address is unset/i.test(x)));
  }

  // ---- absence of performance metrics in every state ----
  {
    const states = [
      makeBoot(GATE, null),
      await connectAndGate(GATE, (d) => d.startsWith("0xb04f81f0") ? wordBool(false) : wordUint(999n * ONE)),
      await connectAndGate(GATE, (d) => d.startsWith("0xb04f81f0") ? wordBool(true) : wordUint(1000n * ONE))
    ];
    let bad = 0;
    for (const st of states) {
      const w = st.w;
      await wait(40);
      const section = w.document.getElementById("bots-section");
      const txt = section ? section.textContent : "";
      if (/PnL|Win Rate|Trades\/hr/.test(txt)) bad++;
      for (const id of ["dca-pnl", "dca-win", "dca-trades", "grid-pnl", "grid-win", "grid-trades"]) {
        if (w.document.getElementById(id)) bad++;
      }
    }
    s.ok("no performance metric rendered in any state", bad === 0);
  }

  // ---- helper: formatPidx never prints a raw 18-decimal integer ----
  {
    const { w } = makeBoot(GATE, null);
    await wait(30);
    const f = w.PIDX_APP.formatPidx;
    s.ok("formatPidx whole", f(999n * ONE) === "999");
    s.ok("formatPidx at threshold", f(1000n * ONE) === "1000");
    s.ok("formatPidx fractional", f(1000n * ONE + 5n * 10n ** 17n) === "1000.5");
    s.ok("formatPidx zero", f(0n) === "0");
  }

  // ---- selector sanity: app.js uses the real computed selectors ----
  {
    s.ok("meetsThreshold selector is 0xb04f81f0", /SEL_MEETS_THRESHOLD\s*=\s*"0xb04f81f0"/.test(app));
    s.ok("holdingsOf selector is 0x03995b2d", /SEL_HOLDINGS_OF\s*=\s*"0x03995b2d"/.test(app));
  }

  return s.done();
};
