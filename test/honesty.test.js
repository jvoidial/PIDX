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
  s.ok("locker is described as Ownable", /Ownable/.test(htmlNoComments));
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
  s.ok("ebank labelled SIMULATION ONLY", /SIMULATION ONLY/.test(htmlNoComments));
  s.ok("growth engine labelled animated", /animated · not measured/.test(htmlNoComments));
  s.ok("resonance labelled simulation", /\(simulation\)/.test(htmlNoComments));
  s.ok("mikoshi labelled off-chain novelty", /off-chain novelty/.test(htmlNoComments));

  // ---- the real block number must not be faked by the animation loop ----
  s.ok("simulation loop does not write #live-block", !/live-block/.test(app.slice(app.indexOf("function startSimulations"), app.indexOf("function startEbankEngine"))));
  s.ok("only setLiveBlock writes the block height", (app.match(/liveBlock\.textContent/g) || []).length === 1);

  // ---- the decorative veil must not flood the memory log ----
  s.ok("veil is not logged to memory", !/Veil shifted to/.test(app));

  // ---- bots log that their PnL is simulated ----
  s.ok("bot trade log marks itself simulated", /simulated\) tick\. Fake PnL/.test(app));

  // ---- behaviour: block element keeps the RPC value, not a counter ----
  {
    const { w } = boot({ noBoot: true });
    const A = w.PIDX_APP;
    A.setLiveBlock(12345678);
    await wait(50);
    s.ok("setLiveBlock writes the real height", /12,345,678/.test(w.document.getElementById("live-block").textContent));
  }

  return s.done();
};
