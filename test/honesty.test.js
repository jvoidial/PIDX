"use strict";

// Honesty + privacy regressions. These lock in the fixes that stop the
// dashboard from claiming things that are not true, and stop it asking for
// and persisting real personal identifiers.
const fs = require("fs");
const path = require("path");
const { boot, wait, suite, ROOT } = require("./harness");

module.exports = async function run() {
  const s = suite("honesty + privacy");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
  const htmlNoComments = html.replace(/<!--[\s\S]*?-->/g, "");

  // ---- the locker must not be described as immutable / verified-secure ----
  s.ok("locker is not called 'Immutable'", !/Immutable UNCX/i.test(htmlNoComments));
  s.ok("locker status line present for runtime owner() read", /id="locker-status"/.test(htmlNoComments));
  s.ok("locker page states 0 liquidity", /0 liquidity/.test(htmlNoComments));

  // ---- no request for real-world identifiers ----
  s.ok("no NHS barcode prompt", !/NHS Barcode/i.test(htmlNoComments));
  s.ok("identity input relabelled as pseudonym", /PSEUDONYM INPUT/.test(htmlNoComments));
  s.ok("warns against real identifiers", /Do not enter an NHS number/i.test(htmlNoComments));
  s.ok("app.js no longer persists raw humanId", !/humanId:\s*humanId/.test(app));
  s.ok("app.js purges a legacy stored humanId", /delete data\.humanId/.test(app));

  // ---- no false 'immortal' / 'safe' claims ----
  s.ok("no 'STABLE / IMMORTAL' relic claim", !/STABLE \/ IMMORTAL/.test(app));
  s.ok("relic reports LOCAL ONLY", /LOCAL ONLY/.test(app));
  s.ok("token card no longer says 'Safe'", !/✅ Safe \(no flags\)/.test(app));
  s.ok("token card says 'No GoPlus flags'", /No GoPlus flags/.test(app));

  // ---- simulated sections are labelled ----
  s.ok("ebank labelled Not implemented", /Digital eBank · Not implemented/.test(htmlNoComments));
  s.ok("growth engine states Not measured", /Not measured\. No telemetry source/.test(htmlNoComments));
  s.ok("vitruvian states Not measured", /Vitruvian System States<\/h2><p[^>]*>Not measured/.test(htmlNoComments));
  s.ok("resonance labelled simulation", /\(simulation\)/.test(htmlNoComments));
  s.ok("mikoshi labelled off-chain novelty", /off-chain novelty/.test(htmlNoComments));

  // ---- the real block number must not be faked by the animation loop ----
  s.ok("the animation engines are gone", !/startSimulations|startEbankEngine/.test(app));
  s.ok("only setLiveBlock writes the block height", (app.match(/liveBlock\.textContent/g) || []).length === 1);

  // ---- the decorative veil must not flood the memory log ----
  s.ok("veil is not logged to memory", !/Veil shifted to/.test(app));

  // ---- bots log that their PnL is simulated ----
  s.ok("no fabricated bot PnL remains", !/Math\.random\(\) \* 2\.5/.test(app));

  // ---- behaviour: block element keeps the RPC value, not a counter ----
  {
    const { w } = boot({ noBoot: true });
    const A = w.PIDX_APP;
    A.setLiveBlock(12345678);
    await wait(50);
    s.ok("setLiveBlock writes the real height", /12,345,678/.test(w.document.getElementById("live-block").textContent));
  }

  // ===================== Task 6 additions =====================

  // (1) Every rendered numeric metric has a declared real source or an
  //     explicit not-measured / not-implemented state. Walks the registry.
  {
    const { w } = boot({ noBoot: true });
    const reg = w.PIDX_APP.METRIC_REGISTRY;
    s.ok("metric registry is exported", Array.isArray(reg) && reg.length > 0);
    const bad = reg.filter(m => {
      if (m.source === "live" || m.source === "derived") {
        // A declared live/derived metric must have a real basis and an element.
        return m.source === "derived" && !m.basis;
      }
      return m.state !== "not-measured" && m.state !== "not-implemented";
    });
    s.ok("every metric declares live/derived/not-measured/not-implemented", bad.length === 0);

    // no unregistered numeric element is rendered
    const doc = new (require("jsdom").JSDOM)(htmlNoComments).window.document;
    const ids = new Set(reg.map(m => m.id));
    // Candidate = an element in a metric namespace that actually shows a digit.
    const candidates = [...doc.querySelectorAll("[id]")].filter(e =>
      e.children.length === 0 &&                                   // leaf only
      /^(val-|v-|dca-|grid-|ebank-|immunity|immortality|burn-|live-|locker-|resonance-)/.test(e.id) &&
      /[0-9]/.test(e.textContent || ""));
    const unregistered = candidates.map(e => e.id).filter(id => !ids.has(id));
    s.ok("no numeric element escapes the registry", unregistered.length === 0);

    // every not-measured metric must NOT be present in the DOM
    const notMeasured = reg.filter(m => m.state === "not-measured").map(m => m.id);
    const leaked = notMeasured.filter(id => doc.getElementById(id));
    s.ok("not-measured metrics are absent from the DOM", leaked.length === 0);
  }

  // (2) Locker panel absent while position liquidity is 0
  s.ok("locker panel markup removed", !/id="pidx-locker-section"/.test(htmlNoComments));
  s.ok("lock/withdraw buttons removed from DOM", !/scan-lock-btn|withdraw-lock-btn/.test(htmlNoComments));
  s.ok("lock/withdraw logic still present in app.js", /function scanAndLockPositions/.test(app) && /function withdrawPosition/.test(app));
  {
    // Drive the status reader with a stubbed RPC: owner() set, 0 positions.
    const OWNER = "0x6f5c5b2117c22c1cb07244be032bd4cde966432c";
    const { w } = boot({
      noBoot: true,
      fetch: (url, init) => {
        let data = "";
        try { data = JSON.parse(init.body).params[0].data; } catch (_) {}
        // owner() -> the treasury address; balanceOf(locker) -> 0 positions.
        const result = data.startsWith("0x8da5cb5b")
          ? "0x" + "0".repeat(24) + OWNER.slice(2)
          : "0x" + "0".repeat(64);
        return { ok: true, status: 200, json: async () => ({ jsonrpc: "2.0", id: 1, result: result }) };
      }
    });
    await w.PIDX_APP.refreshLockerStatus();
    const txt = w.document.getElementById("locker-status").textContent;
    s.ok("locker status reports Ownable + liquidity 0", /Ownable/.test(txt) && /liquidity 0\b/.test(txt));
  }
  {
    // Regression: liquidity is word 7 of positions() (64 hex chars per word).
    // An earlier bug sliced at byte offsets, so it read the middle of word 3.
    // Here word 3 is large and word 7 is zero: a wrong offset returns non-zero.
    const OWNER = "0x6f5c5b2117c22c1cb07244be032bd4cde966432c";
    const word = (hex) => hex.padStart(64, "0");
    const positionsPayload = "0x" + [
      word("0"), word("0"), word("0"),
      word("115792089237316195423570985008687907853269984665640564039457584007913128752716"),
      word("bb8"), word("0"), word("0"),
      word("0"),                       // <-- word 7 = liquidity = 0
      word("0"), word("0"), word("0"), word("0")
    ].join("");
    const { w } = boot({
      noBoot: true,
      fetch: (url, init) => {
        let data = ""; try { data = JSON.parse(init.body).params[0].data; } catch (_) {}
        let result;
        if (data.startsWith("0x8da5cb5b")) result = "0x" + word(OWNER.slice(2));
        else if (data.startsWith("0x70a08231")) result = "0x" + word("1");  // one NFT
        else if (data.startsWith("0x2f745c59")) result = "0x" + word("623de8");
        else result = positionsPayload;                                     // positions()
        return { ok: true, status: 200, json: async () => ({ jsonrpc: "2.0", id: 1, result }) };
      }
    });
    await w.PIDX_APP.refreshLockerStatus();
    const txt = w.document.getElementById("locker-status").textContent;
    s.ok("liquidity is read from word 7, not an adjacent word", /liquidity 0\b/.test(txt));
  }

  // (3) The resonance tag is salted: identical input differs across sessions
  {
    const a = boot({ noBoot: true }).w.PIDX_APP.resonanceTag("6358202324");
    const b = boot({ noBoot: true }).w.PIDX_APP.resonanceTag("6358202324");
    s.ok("resonance tag is salted per session", a !== b);
    s.ok("resonance tag is not the raw input", a !== "6358202324");
  }

  // (4) Malformed ebank_resonance_data is purged on boot without throwing
  {
    const { w } = boot({ noBoot: true });
    w.localStorage.setItem("ebank_resonance_data", "{not valid json");
    let threw = false;
    try { w.PIDX_APP.restoreResonance(); }
    catch (e) { threw = true; }
    s.ok("malformed resonance data does not throw", !threw);
    s.ok("malformed resonance data is purged", w.localStorage.getItem("ebank_resonance_data") === null);
  }
  {
    // valid JSON that still carries an identifier must be stripped
    const { w } = boot({ noBoot: true });
    w.localStorage.setItem("ebank_resonance_data", JSON.stringify({ humanId: "635 820 2324", freq: "1", band: "b" }));
    w.PIDX_APP.restoreResonance();
    const after = w.localStorage.getItem("ebank_resonance_data");
    s.ok("stored humanId is stripped on boot", after && !/635 820 2324/.test(after));
  }

  // (5) Banner present and above the disclosure banner
  {
    const { w } = boot({ noBoot: true });
    const doc = w.document;
    const banner = doc.getElementById("simulation-banner");
    const disc = doc.getElementById("disclosure-section");
    const eip = doc.getElementById("eip-defense-section");
    s.ok("simulation banner exists", !!banner);
    s.ok("banner states the real-data scope", /Only the disclosure banner, token cards, and burn counter show real data/.test(banner ? banner.textContent : ""));
    s.ok("banner is first in <main>", doc.querySelector("main").firstElementChild.id === "simulation-banner");
    if (banner && disc && eip) {
      const pos = banner.compareDocumentPosition(disc);
      s.ok("banner precedes disclosure banner", !!(pos & w.Node.DOCUMENT_POSITION_FOLLOWING));
      const pos2 = disc.compareDocumentPosition(eip);
      s.ok("disclosure still precedes EIP-7702 section", !!(pos2 & w.Node.DOCUMENT_POSITION_FOLLOWING));
    }
  }

  // (7) No duplicate top-level definitions: a second `function foo` silently
  //     shadows the first, which previously regressed the wallet display.
  {
    const fns = (app.match(/^function ([A-Za-z0-9_]+)/gm) || []).map(x => x.replace("function ", "").trim());
    const dupeFn = fns.filter((n, i) => fns.indexOf(n) !== i);
    s.ok("no duplicate top-level function definitions", dupeFn.length === 0);
    const decls = (app.match(/^(?:const|let|var) ([A-Za-z0-9_]+)/gm) || []).map(x => x.split(" ")[1]);
    const dupeDecl = decls.filter((n, i) => decls.indexOf(n) !== i);
    s.ok("no duplicate top-level declarations", dupeDecl.length === 0);
    s.ok("shortAddr is defined exactly once", fns.filter(n => n === "shortAddr").length === 1);
    s.ok("pad32 is defined exactly once", fns.filter(n => n === "pad32").length === 1);
  }

  // (7b) The header block height must not ship a plausible fake default: it
  //      renders a placeholder until the RPC supplies a real height.
  {
    const m = htmlNoComments.match(/id="live-block"[^>]*>([^<]*)</);
    s.ok("#live-block default is not a fake block number", !!m && !/[0-9]{3}/.test(m[1]));
  }

  // (6) Memory terminal is seeded from real events, not decorative fillers
  {
    const { w } = boot({ noBoot: true });
    w.PIDX_APP.setLiveBlock(56789012);
    await wait(20);
    const mem = w.localStorage.getItem("vitruvian_memory") || "";
    s.ok("memory terminal logs a real block event", /Chain height/.test(mem));
    s.ok("memory terminal has no veil filler", !/Veil shifted/.test(mem));
  }

  return s.done();
};
