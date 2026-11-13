"use strict";

// Security + async regression tests for the PIDX frontend.
// Covers: XSS neutralisation, safeUrl, EIP-7702 guard, fetch deadlines,
// graceful API failure states, and the single-boot invariant.
const fs = require("fs");
const path = require("path");
const { boot, wait, suite, ROOT } = require("./harness");

module.exports = async function run() {
  const s = suite("security + async");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");

  // ---- static hardening invariants ----
  s.ok("CSP present with default-src 'none'", /default-src 'none'/.test(html));
  s.ok("CSP sets object-src 'none'", /object-src 'none'/.test(html));
  s.ok("CSP connect-src limited to trusted hosts", /connect-src 'self' https:\/\/api\.dexscreener\.com/.test(html));
  s.ok("CSP has no wildcard host", !/connect-src[^;]*\*/.test(html));
  s.ok("all 3 CDN scripts carry SRI integrity", (html.match(/integrity="sha256-/g) || []).length === 3);
  const htmlNoComments = html.replace(/<!--[\s\S]*?-->/g, "");
  s.ok("no inline <script> body", !/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(htmlNoComments));
  s.ok("exactly one DOMContentLoaded listener", (app.match(/addEventListener\("DOMContentLoaded"/g) || []).length === 1);
  s.ok("no hardcoded private key literal", !/PRIVATE_KEY\s*[:=]\s*["']0x[0-9a-fA-F]{60,}/.test(app));

  // ---- XSS: sanitizeHtml neutralises script/iframe/handlers ----
  {
    const { w } = boot({ noBoot: true });
    const A = w.PIDX_APP;
    s.ok("sanitizeHtml strips <script>", !/script/i.test(A.sanitizeHtml('<script>alert(1)</script>hi')));
    s.ok("sanitizeHtml strips <img onerror>", !/onerror/i.test(A.sanitizeHtml('<img src=x onerror=alert(1)>')));
    s.ok("sanitizeHtml strips javascript: href", !/javascript:/i.test(A.sanitizeHtml('<a href="javascript:alert(1)">x</a>')));
    s.ok("sanitizeHtml keeps benign text", A.sanitizeHtml('Safe <b>bold</b>') === 'Safe <b>bold</b>');

    s.eq("safeUrl blocks javascript:", A.safeUrl('javascript:alert(1)', ["uniswap.org"]), "#");
    s.eq("safeUrl blocks unknown host", A.safeUrl('https://evil.example/x', ["uniswap.org"]), "#");
    s.eq("safeUrl blocks protocol-relative", A.safeUrl('//evil.example/x', ["uniswap.org"]), "#");
    s.ok("safeUrl allows listed host", A.safeUrl('https://app.uniswap.org/swap', ["uniswap.org"]) === 'https://app.uniswap.org/swap');

    s.ok("isAddress accepts 20-byte", A.isAddress('0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c'));
    s.ok("isAddress rejects 32-byte", !A.isAddress('0x55a4a9360aa7bd9a4babf7a163c56f530ac1b5318fef77edfe9834ac9ab696a2'));
  }

  // ---- EIP-7702 guard ----
  {
    const eth = { request: async () => "0x1", send: () => "0x1", on() {} };
    const { w } = boot({ ethereum: eth, noBoot: true });
    const G = w.PIDX_APP.EIP7702Guard;
    G.install();
    s.ok("guard installs on injected provider", G.isInstalled());

    for (const m of ["eth_sign", "eth_signTransaction", "personal_sign", "eth_sendTransactionWithAuthorizationList"]) {
      s.ok("guard blocks " + m, !!G.inspect(m, []));
    }
    s.ok("guard blocks authorizationList payload", !!G.inspect("eth_sendTransaction", [{ authorizationList: [{}] }]));
    s.ok("guard blocks nested authorization_list", !!G.inspect("eth_sendTransaction", [{ tx: { authorization_list: [] } }]));
    s.ok("guard allows eth_sendTransaction", G.inspect("eth_sendTransaction", [{ to: "0x1" }]) === null);
    s.ok("guard allows eth_requestAccounts", G.inspect("eth_requestAccounts", []) === null);
    s.ok("guard blocks ETH_SIGN (uppercase)", !!G.inspect("ETH_SIGN", []));
  }

  // ---- fetch deadline + graceful failure ----
  {
    const { w } = boot({
      fetch: (url) => {
        if (url.includes("dexscreener")) return new Promise(() => {}); // never resolves
        return { ok: true, status: 200, json: async () => ({ result: {} }) };
      }
    });
    await wait(50);
    const badge = w.document.getElementById("tvl-pidx");
    s.ok("card rendered", !!badge);
    await wait(5600);
    s.ok("hanging DexScreener resolves to TIMEOUT", badge && /TIMEOUT|API ERROR/.test(badge.textContent));
  }

  // ---- API error -> visible state ----
  {
    const { w } = boot({
      fetch: (url) => {
        if (url.includes("dexscreener")) return { ok: false, status: 429, json: async () => ({}) };
        if (url.includes("goplus")) return { ok: false, status: 500, json: async () => ({}) };
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });
    await wait(120);
    const badge = w.document.getElementById("tvl-pidx");
    const sec = w.document.getElementById("sec-pidx");
    s.ok("rate-limited TVL shows API ERROR", badge && /API ERROR/.test(badge.textContent));
    s.ok("failed security shows API ERROR", sec && /API ERROR/.test(sec.textContent));
  }

  // ---- every fetch carries an AbortController signal ----
  {
    const { w, calls } = boot({ fetch: () => ({ ok: true, status: 200, json: async () => ([]) }) });
    await wait(120);
    const withSignal = calls.filter(c => c.init && c.init.signal);
    s.ok("all fetch calls pass a signal", calls.length > 0 && withSignal.length === calls.length);
  }

  return s.done();
};
