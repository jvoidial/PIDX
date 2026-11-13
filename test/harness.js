"use strict";

// Shared jsdom harness for the PIDX frontend tests.
// Loads the real index.html markup + the real app.js into a jsdom window with
// stubbed network so the runtime can be exercised without touching the internet.
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.resolve(__dirname, "..");
const PURIFY = fs.readFileSync(path.join(__dirname, "lib", "purify.min.js"), "utf8");
const APP = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const HTML = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")
  .replace(/<script\b[^>]*><\/script>/gi, ""); // scripts are eval'd manually

function makeDom() {
  return new JSDOM(HTML, { runScripts: "outside-only", url: "https://pidx.example/", pretendToBeVisual: true });
}

// Boot the app with a configurable fetch stub.
//   fetchImpl(url, init) -> { ok, status, json() }  (defaults to an empty success)
function boot(opts = {}) {
  const dom = makeDom();
  const w = dom.window;
  w.alert = () => {}; // jsdom has no alert; keep tests quiet and deterministic

  const calls = [];
  const fetchImpl = opts.fetch || (async () => ({ ok: true, status: 200, json: async () => ([]) }));
  w.fetch = (url, init) => {
    calls.push({ url: String(url), init: init || {} });
    const p = Promise.resolve(fetchImpl(String(url), init || {}));
    const signal = init && init.signal;
    if (!signal) return p;
    // Honour the AbortController the runtime attaches, exactly like a real fetch.
    return new Promise((resolve, reject) => {
      const onAbort = () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      if (signal.aborted) return onAbort();
      signal.addEventListener("abort", onAbort, { once: true });
      p.then(
        (v) => { signal.removeEventListener("abort", onAbort); resolve(v); },
        (e) => { signal.removeEventListener("abort", onAbort); reject(e); }
      );
    });
  };

  if (opts.ethereum) w.ethereum = opts.ethereum;
  if (opts.WebSocket !== undefined) w.WebSocket = opts.WebSocket;
  if (opts.globals) for (const k of Object.keys(opts.globals)) w[k] = opts.globals[k];

  w.eval(PURIFY);
  w.eval(APP);
  // Dispatch on window (where the app listens); the app's booted guard makes any
  // later native DOMContentLoaded a no-op, so the boot is deterministic.
  if (opts.noBoot !== true) w.dispatchEvent(new w.Event("DOMContentLoaded"));
  return { dom, w, calls };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Tiny assertion recorder.
function suite(name) {
  let pass = 0, fail = 0;
  const lines = [];
  console.log("\n=== " + name + " ===");
  return {
    ok(desc, cond) {
      if (cond) { pass++; console.log("  PASS " + desc); }
      else { fail++; console.log("  FAIL " + desc); lines.push(desc); }
    },
    eq(desc, a, b) { this.ok(desc + " (got " + JSON.stringify(a) + ")", a === b); },
    done() {
      console.log("  -> " + pass + " passed, " + fail + " failed");
      return { pass, fail };
    }
  };
}

module.exports = { boot, wait, suite, ROOT, makeDom, PURIFY, APP, HTML };
