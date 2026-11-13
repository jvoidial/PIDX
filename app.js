"use strict";

/* =========================================================================
 * PIDX / SPIRIT GUIDE — frontend runtime
 *
 * Hardening goals:
 *   1. No secrets of any kind live here. Every value below is a PUBLIC
 *      on-chain address, a public API URL, or a public constant.
 *   2. All data that comes back from DexScreener / GoPlus / local JSON is
 *      sanitised with DOMPurify before it touches the DOM, and all URLs are
 *      rebuilt from validated primitives (never injected as raw strings).
 *   3. Every network call has an AbortController deadline (5s API / 8s local)
 *      so a rate-limited or hanging endpoint degrades to a visible
 *      "API ERROR" / "LOW DATA" state instead of an eternal "SYNCING...".
 *   4. A single DOMContentLoaded boot path (the old file registered two and
 *      the second one could race / double-bind listeners).
 *   5. An EIP-7702 "signature guard" that is ALWAYS installed on window.ethereum
 *      and hard-blocks eth_sign, any authorizationList payload, and any
 *      eth_signTransaction / personal_sign request.
 *   6. PIDX Locker flows: approve -> lockPosition, and withdrawPosition, with
 *      strict ABI types and receipt-status checks.
 * ========================================================================= */

// ------------------------------------------------------------------ config
const DEX_API       = "https://api.dexscreener.com/token-pairs/v1/base/";
const GOPLUS_API    = "https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=";
const BASE_CHAIN_ID = "0x2105"; // Base mainnet (8453)
const API_TIMEOUT   = 5000;     // DexScreener / GoPlus deadline (ms)
const LOCAL_TIMEOUT = 8000;     // same-origin JSON deadline (ms)
const MAX_UINT256   = (1n << 256n) - 1n;

// Base Uniswap V3 NonfungiblePositionManager + the verified PIDX Locker.
const NPM_ADDR    = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
const LOCKER_ADDR = "0x06A958fF5d896Ba28411215d0CD56a2a5A1b35aD";

// Upgrade constants.
const PIDX_ADDR    = "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c";
const BURN_ADDR    = "0x000000000000000000000000000000000000dEaD";
const BASE_RPC     = "https://mainnet.base.org";
const BASE_WS      = "wss://mainnet.base.org"; // WS-capable endpoint (falls back to polling)
const RPC_FALLBACKS = ["https://mainnet.base.org", "https://base-rpc.publicnode.com"];
const GECKO_API    = "https://api.geckoterminal.com/api/v2/networks/base/pools/";
const GECKO_TOKEN_POOLS = "https://api.geckoterminal.com/api/v2/networks/base/tokens/";
const BOT_MIN_PIDX = 1000n * 10n ** 18n; // token gate: 1,000 PIDX (18 decimals)
const LOG_WINDOW   = 2000;               // bounded eth_getLogs window (public RPCs reject big ranges)

// Minimal, exact-type ABIs. `lockPosition(address,uint256,uint256)` and
// `withdrawPosition(address,uint256)` match the deployed bytecode selectors
// 0x0cc65dfb / 0x741b5939.
const NPM_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function approve(address to, uint256 tokenId)",
  "function ownerOf(uint256 tokenId) view returns (address)"
];
// Selectors used by the read-only locker status line (no ABI objects needed).
const SEL_OWNER = "0x8da5cb5b";       // owner()
const SEL_BALANCE_OF = "0x70a08231";  // balanceOf(address)
const SEL_TOKEN_OF_OWNER = "0x2f745c59"; // tokenOfOwnerByIndex(address,uint256)
const SEL_POSITIONS = "0x99fbab88";   // positions(uint256)
const LOCKER_ABI = [
  "function lockPosition(address nftContract, uint256 tokenId, uint256 lockDuration)",
  "function withdrawPosition(address nftContract, uint256 tokenId)",
  "function locks(address nftContract, uint256 tokenId) view returns (address owner, uint256 unlockTime, bool isLocked)"
];

// Fallback token list. Used ONLY if tokens.json cannot be read. Each field is
// still passed through the sanitising renderer below.
const FALLBACK_TOKENS = [
  { id:"pidx",    symbol:"PIDX",    name:"Pennies Index",  freq:"0.618 Hz", address:"0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c", pool:"0xc4f9124ffe11279ea2cac53e8d95c30c1b26724369e265860eec9495bc7cb6a6" },
  { id:"sguide",  symbol:"SGUIDE",  name:"Spirit Guide",   freq:"1.618 Hz", address:"0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a", pool:"0x55a4a9360aa7bd9a4babf7a163c56f530ac1b5318fef77edfe9834ac9ab696a2" },
  { id:"vdoo",    symbol:"VDOO",    name:"VOUDOO Infinity",freq:"2.618 Hz", address:"0x38e4f08D08b4D772A7B75669C356b4749dd2d30b", pool:"0xc5b15edcee5ce1702256f30edced421688545fdc1a0170cb2c48da259802ec59" },
  { id:"pennies", symbol:"PENNIES", name:"Pennies CHEQ",   freq:"3.618 Hz", address:"0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7", pool:"0x29a0ae1f10629f8855c87c911531ffb2c98d68c6" }
];

const VAULTS_DATA = [
  { name:"Morpho USDC Vault", type:"Vault", asset:"USDC", apy:"7.89%", tvl:"$366K", desc:"High utilization lending pool.", link:"https://app.morpho.org/base" },
  { name:"Euler V2 USDC", type:"Vault", asset:"USDC", apy:"6.85%", tvl:"$584K", desc:"ERC-4626 compliant vault.", link:"https://app.euler.finance/" },
  { name:"YO Protocol USDC", type:"Vault", asset:"USDC", apy:"Variable", tvl:"On-chain", desc:"ERC-4626 yield-optimizer.", link:"https://yo.xyz" },
  { name:"Moonwell Morpho", type:"Vault", asset:"USDC", apy:"Variable", tvl:"On-chain", desc:"Allocates across Morpho markets.", link:"https://docs.moonwell.fi" },
  { name:"Beefy Auto-Compounder", type:"Vault", asset:"Multiple", apy:"Variable", tvl:"High", desc:"Auto-compounds LP rewards.", link:"https://app.beefy.com/" },
  { name:"Beefy tBTC-WETH CLM", type:"LP Pool", asset:"tBTC/WETH", apy:"7.74%", tvl:"$103K", desc:"Aerodrome CLM vault.", link:"https://app.beefy.com/" },
  { name:"Alien Base USDC-CBBTC", type:"LP Pool", asset:"USDC/CBBTC", apy:"21.50%", tvl:"$1.47M", desc:"Concentrated V3 pool.", link:"https://app.alienbase.xyz/" },
  { name:"Uniswap V3 WETH-USDC", type:"LP Pool", asset:"WETH/USDC", apy:"65%", tvl:"$125M", desc:"Highest organic yield.", link:"https://app.uniswap.org/pools" }
];

const MINING_DATA = [
  { name:"Irium Public Pool", fee:"0%", coin:"IRM", stratum:"stratum+tcp://pool.iriumlabs.org:3333", status:"online", notes:"Direct-payout solo mining." },
  { name:"Linkrra Pool", fee:"0% extra", coin:"PRL", stratum:"stratum.linkrra.com:5567", status:"online", notes:"PPLNS payout, 80% USDC on Base." },
  { name:"SoloFury", fee:"1%", coin:"SHA-256", stratum:"stratum+tcp://btc.solofury.com:7070", status:"online", notes:"Multi-coin solo mining." },
  { name:"Ocean", fee:"2% (1% DATUM)", coin:"BTC", stratum:"stratum+tcp://ocean.xyz:3334", status:"online", notes:"Non-custodial, no KYC." },
  { name:"Braiins Pool", fee:"0% (Braiins OS)", coin:"BTC", stratum:"stratum+tcp://stratum.braiins.com:3333", status:"online", notes:"Stratum V2 native." },
  { name:"BASED Mining", fee:"0%", coin:"BTC (Solo)", stratum:"stratum+tcp://pool.basedmining.xyz:3333", status:"online", notes:"On-chain solo mining via Base." },
  { name:"MineBean", fee:"Dynamic", coin:"ETH / BEAN", stratum:"N/A - Grid Mining", status:"online", notes:"Gamified mining on Base." }
];

// --------------------------------------------------------------- primitives
function $(id) { return document.getElementById(id); }

// ---------------------------------------------------------- metric registry
// Declares EVERY numeric metric this dashboard can render, and where its value
// comes from. A metric must be one of:
//   source: "live"    - read from the chain/API at runtime (element exists)
//   source: "derived" - a deterministic function of a declared input (basis)
//   state:  "not-measured"    - no source exists; the element is NOT rendered
//   state:  "not-implemented" - not built; the element renders an explicit dash
// test/honesty.test.js walks this registry, so a new hard-coded number cannot
// be added without declaring its provenance here.
const METRIC_REGISTRY = [
  { id: "live-block",          source: "live",    note: "Base RPC eth_blockNumber" },
  { id: "burn-counter",        source: "live",    note: "PIDX balanceOf(0x…dEaD)" },
  { id: "locker-status",       source: "live",    note: "locker owner() + NPM positions()" },
  { id: "resonance-longevity", source: "live",    note: "elapsed time since resonance start" },
  { id: "resonance-freq",      source: "derived", basis: "salted hash of the user's pseudonym", note: "cosmetic novelty readout" },
  { id: "resonance-band",      source: "derived", basis: "navigator.connection / user agent",   note: "coarse network class" },
  { id: "immortality-prob",    state: "not-measured" },
  { id: "immunity-score",      state: "not-implemented" },
  { id: "ebank-principal",     state: "not-implemented" },
  { id: "ebank-yield",         state: "not-implemented" },
  { id: "ebank-apy",           state: "not-implemented" },
  { id: "val-continuity",      state: "not-measured" },
  { id: "val-coherence",       state: "not-measured" },
  { id: "val-persistence",     state: "not-measured" },
  { id: "val-voxels",          state: "not-measured" },
  { id: "val-energy",          state: "not-measured" },
  { id: "val-engine",          state: "not-measured" },
  { id: "v-state",             state: "not-measured" },
  { id: "v-stability",         state: "not-measured" },
  { id: "v-resonance",         state: "not-measured" },
  { id: "dca-pnl",             state: "not-implemented" },
  { id: "dca-win",             state: "not-implemented" },
  { id: "dca-trades",          state: "not-implemented" },
  { id: "grid-pnl",            state: "not-implemented" },
  { id: "grid-win",            state: "not-implemented" },
  { id: "grid-trades",         state: "not-implemented" }
];

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function isAddress(v) { return typeof v === "string" && ADDRESS_RE.test(v); }
function shortAddr(v) { return isAddress(v) ? v.slice(0, 6) + "..." + v.slice(-4) : "—"; }

// Allow only http(s) URLs whose host is on the list. Everything else (data:,
// javascript:, blob:, protocol-relative //evil, unknown hosts) becomes "#".
function safeUrl(raw, allowedHosts) {
  try {
    const u = new URL(String(raw), window.location.href);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "#";
    const host = u.hostname.toLowerCase();
    if (!allowedHosts.some(h => host === h || host.endsWith("." + h))) return "#";
    return u.href;
  } catch (_) { return "#"; }
}

// Run a value through DOMPurify, then confirm nothing dangerous survived.
function sanitizeHtml(dirty) {
  if (typeof DOMPurify === "undefined") return "";
  const clean = DOMPurify.sanitize(String(dirty == null ? "" : dirty), {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "span", "br", "small"],
    ALLOWED_ATTR: []
  });
  return /<\s*(script|iframe|object|embed|img|svg|form|link|meta)\b|on\w+\s*=|javascript:/i.test(clean) ? "" : clean;
}
function setSafeText(el, value) { if (el) el.textContent = sanitizeHtml(value); }

// fetch() with a hard deadline. Rejects with AbortError on timeout so callers
// can render a timeout state instead of hanging forever.
async function fetchWithTimeout(url, timeout, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, Object.assign({}, options || {}, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}

// JSON-RPC POST with a hard deadline, trying each endpoint in turn. Base's
// public endpoints rate-limit (HTTP 429), so we fall back rather than freeze.
async function jsonRpc(method, params, timeout) {
  let lastErr;
  for (const url of RPC_FALLBACKS) {
    try {
      const r = await fetchWithTimeout(url, timeout || API_TIMEOUT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: method, params: params })
      });
      if (!r.ok) { lastErr = new Error("HTTP " + r.status); continue; }
      const j = await r.json();
      if (j && j.error) { lastErr = new Error(j.error.message || "rpc error"); continue; }
      return j.result;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("All RPC endpoints failed");
}

// Encode a JSON-RPC "eth_call" for an ERC-20 style view function and decode the
// first 32-byte word as a BigInt. No ABI dependency, so it also works when
// ethers fails to load.
function pad32(hexNo0x) { return hexNo0x.padStart(64, "0"); }
function addressArg(addr) { return pad32(addr.toLowerCase().replace(/^0x/, "")); }

async function erc20BalanceOf(token, holder) {
  const data = "0x70a08231" + addressArg(holder); // balanceOf(address)
  const res = await jsonRpc("eth_call", [{ to: token, data: data }, "latest"]);
  return BigInt(res || "0x0");
}

// GeckoTerminal reserve (USD) by pool id. Accepts BOTH a 20-byte pool address
// (0x + 40 hex) and a 32-byte pool id (0x + 64 hex): the token list mixes the
// two, and the previous 40-hex-only gate silently rejected every 64-hex id, so
// the fallback returned null for 3 of 4 tokens whenever DexScreener was down.
const POOL_ID_RE = /^0x[a-fA-F0-9]{40}$|^0x[a-fA-F0-9]{64}$/;
async function geckoPoolReserve(poolId) {
  if (typeof poolId !== "string" || !POOL_ID_RE.test(poolId)) return null;
  try {
    const r = await fetchWithTimeout(GECKO_API + poolId, API_TIMEOUT);
    if (!r.ok) return null;
    const j = await r.json();
    const usd = Number(j?.data?.attributes?.reserve_in_usd);
    return Number.isFinite(usd) ? usd : null;
  } catch (_) { return null; }
}

// GeckoTerminal reserve (USD) for a token, discovered from its own pool list and
// reduced to the deepest pool. Self-correcting: never trusts a hardcoded pool id
// that goes stale when liquidity migrates to a new pool.
async function geckoTokenReserve(tokenAddress) {
  if (!isAddress(tokenAddress)) return null;
  try {
    const r = await fetchWithTimeout(GECKO_TOKEN_POOLS + tokenAddress + "/pools", API_TIMEOUT);
    if (!r.ok) return null;
    const j = await r.json();
    const pools = j && j.data;
    if (!Array.isArray(pools) || !pools.length) return null;
    let best = null;
    for (const p of pools) {
      const usd = Number(p?.attributes?.reserve_in_usd);
      if (Number.isFinite(usd) && (best === null || usd > best)) best = usd;
    }
    return best;
  } catch (_) { return null; }
}

// ------------------------------------------------------- EIP-7702 guard
/* The 2024/2025 "7702 drainer" class works by getting a wallet to sign either
 * (a) a raw eth_sign hash, (b) a transaction carrying an `authorizationList`
 * (the EIP-7702 delegation tuple), or (c) an arbitrary eth_signTransaction.
 * Once delegated, the attacker's contract owns the account. This guard sits in
 * front of window.ethereum and refuses all three, before any wallet popup. */
// NOTE: stored lowercase because inspect() lowercases the incoming method
// before matching. Mixed-case entries here would silently fail to match.
const BLOCKED_METHODS = new Set([
  "eth_sign",
  "eth_signtransaction",
  "personal_sign",
  "eth_sendtransactionwithauthorizationlist"
]);
const DANGEROUS_KEYS = new Set([
  "authorizationlist", "authorization_list", "authorizations", "eip7702authorization"
]);

const EIP7702Guard = (function () {
  let installed = false;
  let violations = 0;
  let target = null;

  function deepHasAuthorization(obj, depth) {
    if (!obj || typeof obj !== "object" || (depth || 0) > 4) return false;
    for (const key of Object.keys(obj)) {
      if (DANGEROUS_KEYS.has(String(key).toLowerCase())) return true;
      if (typeof obj[key] === "object" && deepHasAuthorization(obj[key], (depth || 0) + 1)) return true;
    }
    return false;
  }

  function blockedMessage(reason) {
    return "Blocked by the EIP-7702 Signature Guard: " + reason +
      ". This dApp never requests eth_sign, eth_signTransaction or 7702 delegations.";
  }

  function inspect(method, params) {
    const m = String(method || "").toLowerCase();
    if (BLOCKED_METHODS.has(m)) return blockedMessage("method '" + method + "' is never allowed");
    if (deepHasAuthorization(params)) return blockedMessage("payload contains an authorizationList");
    return null;
  }

  function noteViolation(reason) {
    violations++;
    try {
      const el = $("eip7702-guard-status");
      if (el) { el.textContent = "🚨 EIP-7702 Guard: blocked " + violations + " drainer attempt(s)"; el.style.color = "#ff4444"; }
    } catch (_) {}
    try { if (typeof logMemory === "function") logMemory("EIP-7702 Guard blocked: " + reason, "#ff4444"); } catch (_) {}
    console.warn("[EIP7702Guard]", reason);
  }

  function request(payload) {
    const reason = inspect(payload && payload.method, payload && payload.params);
    if (reason) { noteViolation(reason); return Promise.reject(new Error(reason)); }
    return target.request(payload);
  }

  function patch(provider) {
    target = provider;
    const origRequest = provider.request.bind(provider);
    const origSend = typeof provider.send === "function" ? provider.send.bind(provider) : null;
    const origSendAsync = typeof provider.sendAsync === "function" ? provider.sendAsync.bind(provider) : null;

    provider.request = function (payload) {
      if (payload && typeof payload.method === "string") {
        const reason = inspect(payload.method, payload.params);
        if (reason) { noteViolation(reason); return Promise.reject(new Error(reason)); }
      }
      return origRequest(payload);
    };
    if (origSend) {
      provider.send = function (method, params) {
        const reason = inspect(method, params);
        if (reason) { noteViolation(reason); throw new Error(reason); }
        return origSend(method, params);
      };
    }
    if (origSendAsync) {
      provider.sendAsync = function (payload, cb) {
        const reason = inspect(payload && payload.method, payload && payload.params);
        if (reason) { noteViolation(reason); if (typeof cb === "function") cb(new Error(reason)); return; }
        return origSendAsync(payload, cb);
      };
    }
    return true;
  }

  function updateStatus(label, ok) {
    const el = $("eip7702-guard-status");
    if (!el) return;
    el.textContent = ok ? "🛡️ EIP-7702 Signature Guard: active" : "🛡️ EIP-7702 Signature Guard: " + label;
    el.style.color = ok ? "#00ffcc" : "#ffaa00";
  }

  function install() {
    const eth = window.ethereum;
    if (!eth || typeof eth.request !== "function") { updateStatus("no injected wallet", false); return false; }
    if (installed) return true;
    try {
      const ok = patch(eth);
      installed = ok;
      updateStatus("active", true);
      return ok;
    } catch (e) { console.error("EIP7702Guard install failed", e); updateStatus("install failed", false); return false; }
  }

  return {
    install: install,
    inspect: inspect,
    request: request,
    isInstalled: function () { return installed; },
    violations: function () { return violations; }
  };
})();
window.EIP7702Guard = EIP7702Guard;

// --------------------------------------------------------------- wallet
let connectedWallet = null;
let walletListenersBound = false;

async function connectWallet() {
  if (typeof window.ethereum === "undefined") { alert("Please install MetaMask, Coinbase Wallet, Rabby or Trust."); return; }
  EIP7702Guard.install();
  try {
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts.length) return;
    connectedWallet = accounts[0];

    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== BASE_CHAIN_ID) {
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_CHAIN_ID }] });
      } catch (switchErr) {
        alert("Please switch your wallet to the Base network (chainId 8453).");
        return;
      }
    }

    const btn = $("connect-wallet-btn");
    if (btn) { btn.textContent = "Connected"; btn.style.background = "var(--dim)"; }
    const addrEl = $("wallet-address");
    if (addrEl) { addrEl.textContent = shortAddr(connectedWallet); addrEl.title = connectedWallet; }
    logMemory("Wallet connected: " + shortAddr(connectedWallet), "#00ffcc");

    // Token gate: unlock the bots only if the wallet holds >= 1,000 PIDX.
    updateBotGate().catch(() => {});

    if (!walletListenersBound && typeof window.ethereum.on === "function") {
      walletListenersBound = true;
      window.ethereum.on("accountsChanged", (accs) => {
        if (!accs || !accs.length) { connectedWallet = null; if (btn) { btn.textContent = "Connect Wallet"; btn.style.background = "var(--white)"; } if (addrEl) addrEl.textContent = ""; return; }
        connectedWallet = accs[0];
        if (addrEl) { addrEl.textContent = shortAddr(connectedWallet); addrEl.title = connectedWallet; }
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  } catch (e) {
    console.error(e);
    logMemory("Wallet connection rejected or failed.", "#ff4444");
  }
}

// ------------------------------------------------------------ memory log
function loadMemory() {
  const log = $("memory-log"); if (!log) return;
  let mem = [];
  try { mem = JSON.parse(localStorage.getItem("vitruvian_memory")) || []; } catch (_) { mem = []; }
  log.innerHTML = "";
  if (!mem.length) { log.innerHTML = '<div style="color:var(--dim);">[SYSTEM INIT] Memory bank loaded...</div>'; return; }
  mem.forEach(e => {
    const d = document.createElement("div");
    d.style.color = e.color || "var(--text)";
    d.textContent = String(e.msg == null ? "" : e.msg);
    log.appendChild(d);
  });
  log.scrollTop = log.scrollHeight;
}
function logMemory(msg, color) {
  let mem = [];
  try { mem = JSON.parse(localStorage.getItem("vitruvian_memory")) || []; } catch (_) { mem = []; }
  mem.push({ msg: "[" + new Date().toLocaleTimeString() + "] " + msg, color: color || "var(--text)" });
  if (mem.length > 10) mem.shift();
  try { localStorage.setItem("vitruvian_memory", JSON.stringify(mem)); } catch (_) {}
  loadMemory();
}

// ------------------------------------------------------------ locker status
// Read-only. The full locker panel was pulled until the on-chain V3 position
// has non-zero liquidity; this reports the facts in one line instead. It does
// not touch the lock/withdraw code paths. pad32() and shortAddr() already
// exist above; do not redefine them here (a second definition would silently
// shadow the first, which is how the wallet display regressed once).
async function refreshLockerStatus() {
  const el = $("locker-status");
  if (!el) return;
  let owner = null, liquidity = null, isOwnable = false;
  try {
    const ownerHex = await jsonRpc("eth_call", [{ to: LOCKER_ADDR, data: SEL_OWNER }, "latest"], API_TIMEOUT);
    if (typeof ownerHex === "string" && ownerHex.length >= 42) {
      owner = "0x" + ownerHex.slice(-40);
      isOwnable = true;
    }
  } catch (_) { /* not Ownable, or RPC refused */ }
  try {
    const bal = await jsonRpc("eth_call", [{ to: NPM_ADDR, data: SEL_BALANCE_OF + pad32(LOCKER_ADDR.slice(2).toLowerCase()) }, "latest"], API_TIMEOUT);
    const count = bal && bal !== "0x" ? BigInt(bal) : 0n;
    if (count === 0n) {
      liquidity = "0";
    } else {
      const tid = await jsonRpc("eth_call", [{ to: NPM_ADDR, data: SEL_TOKEN_OF_OWNER + pad32(LOCKER_ADDR.slice(2).toLowerCase()) + pad32("0") }, "latest"], API_TIMEOUT);
      const tokenId = BigInt(tid);
      const pos = await jsonRpc("eth_call", [{ to: NPM_ADDR, data: SEL_POSITIONS + pad32(tokenId.toString(16)) }, "latest"], API_TIMEOUT);
      // positions() returns 12 static 32-byte words; each word is 64 HEX chars.
      // liquidity is word index 7, i.e. hex chars [2+7*64, 2+8*64).
      if (typeof pos === "string" && pos.length >= 2 + 64 * 8) {
        liquidity = BigInt("0x" + pos.slice(2 + 64 * 7, 2 + 64 * 8)).toString();
      }
    }
  } catch (_) { liquidity = null; }

  const ownPart = isOwnable ? "Ownable, owner " + shortAddr(owner) : "ownership not exposed";
  const liqPart = liquidity === null ? "position liquidity unknown" : "position liquidity " + liquidity;
  el.textContent = "Locker: " + ownPart + ", " + liqPart;
  el.style.color = (liquidity === "0") ? "#ffaa00" : "#8899a6";
}

// ------------------------------------------------------------ simulated data
// Every animated metric has been removed rather than captioned. There is no
// real telemetry source for these values, so rendering numbers for them at all
// would be a claim we cannot support. The section headers in index.html say
// "Not measured" / "Not implemented" instead.
//
// The loops that remain are backed by real chain data only: the RPC block
// feed, the lock scan, and the burn counter.

// ------------------------------------------------------------ Mikoshi
function generateAutoEngram() {
  const saved = localStorage.getItem("ebank_immortality_engram");
  if (saved) {
    try { const data = JSON.parse(saved); renderEngramUI(data.id, data.seq, data.prob); return; }
    catch (_) { localStorage.removeItem("ebank_immortality_engram"); }
  }
  if (typeof ethers === "undefined") return;
  const seed = Date.now().toString() + Math.random().toString() + navigator.userAgent;
  const hash = ethers.keccak256(ethers.toUtf8Bytes(seed));
  const engramId = "0x" + hash.substring(2, 8) + "..." + hash.substring(58, 64);
  const baseMap = { "0":"A","1":"C","2":"G","3":"T","4":"A","5":"C","6":"G","7":"T","8":"A","9":"C","a":"G","b":"T","c":"A","d":"C","e":"G","f":"T" };
  let seq = ""; const raw = hash.substring(2, 34);
  for (let i = 0; i < raw.length; i++) { seq += baseMap[raw[i].toLowerCase()] || "X"; if (i < raw.length - 1) seq += "-"; }
  const prob = (99.00 + (parseInt(hash.substring(2, 6), 16) / 65535) * 0.99).toFixed(2);
  try { localStorage.setItem("ebank_immortality_engram", JSON.stringify({ id: engramId, seq: seq, prob: prob })); } catch (_) {}
  renderEngramUI(engramId, seq, prob);
}
function renderEngramUI(id, seq, prob) {
  setSafeText($("engram-id"), id);
  setSafeText($("longevity-seq"), seq);
  // No probability is rendered: the number was a hash fragment, not a
  // measurement. The element no longer exists in index.html.
  const status = $("mikoshi-status");
  if (status) { status.textContent = "ENGRAM ACTIVE"; status.style.color = "#00ffcc"; }
  const relic = $("relic-integrity");
  // This is a locally generated novelty. It must not claim to be verified or
  // "immortal" — nothing here touches the chain.
  if (relic) { relic.textContent = "LOCAL ONLY"; relic.style.color = "#8899a6"; }
  const btn = $("upload-engram-btn"); if (btn) btn.style.display = "none";
}

// ------------------------------------------------------------ Resonance
let resonanceTimerInterval = null;
// Per-session random salt, regenerated on every page load and never persisted.
// An unsalted hash of a short code is reversible by lookup; the salt prevents
// that and makes identical input produce a different tag each session.
const RESONANCE_SALT = (typeof crypto !== "undefined" && crypto.getRandomValues)
  ? Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, "0")).join("")
  : Math.random().toString(36).slice(2) + Date.now().toString(36);
function resonanceTag(input) {
  const material = RESONANCE_SALT + "|" + input;
  try {
    if (typeof ethers !== "undefined" && ethers.keccak256) {
      return ethers.keccak256(ethers.toUtf8Bytes(material)).substring(2, 10);
    }
  } catch (_) {}
  // Pure-JS FNV-1a fallback so the tag is still salted without ethers.
  let h = 0x811c9dc5;
  for (let i = 0; i < material.length; i++) {
    h ^= material.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
function playResonanceSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(528, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1056, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 1.5);
  } catch (_) {}
}
function detectNetworkBand() {
  if (navigator.connection) {
    const type = navigator.connection.type, eff = navigator.connection.effectiveType || "";
    if (type === "wifi" || type === "ethernet") return "WIFI 6E / 5G";
    if (type === "cellular") {
      if (eff === "5g" || eff === "4g") return "5G ULTRA";
      if (eff === "3g") return "3G LEGACY";
      if (eff === "2g") return "2G DECAY";
    }
  }
  return "WIFI/5G (EST)";
}
function startResonanceTimer(startTime) {
  if (resonanceTimerInterval) clearInterval(resonanceTimerInterval);
  const el = $("resonance-longevity");
  resonanceTimerInterval = setInterval(() => {
    const diff = Math.floor((Date.now() - startTime) / 1000);
    if (el) el.textContent = String(Math.floor(diff / 3600)).padStart(2, "0") + ":" + String(Math.floor((diff % 3600) / 60)).padStart(2, "0") + ":" + String(diff % 60).padStart(2, "0");
  }, 1000);
}
function initiateResonance() {
  const humanId = $("resonance-human-id")?.value.trim();
  if (!humanId) { alert("Please enter a Human Identity Code."); return; }
  if (typeof ethers === "undefined") { alert("Crypto library not loaded yet. Please retry."); return; }

  let walletSeed = connectedWallet, isGuest = false;
  if (!walletSeed) {
    isGuest = true;
    walletSeed = localStorage.getItem("guest_soul_seed") || ("GUEST_" + Math.random().toString(36).substring(2) + Date.now());
    try { localStorage.setItem("guest_soul_seed", walletSeed); } catch (_) {}
  }

  const btn = $("resonance-initiate-btn");
  if (btn) { btn.textContent = "CALIBRATING..."; btn.style.background = "#ffaa00"; }

  setTimeout(() => {
    try {
      const hash = ethers.keccak256(ethers.toUtf8Bytes(walletSeed + "|" + humanId + "|RESONANCE"));
      const freq = (2400 + ((parseInt(hash.substring(6, 10), 16) % 5000) / 5000) * 1500).toFixed(3);
      const band = detectNetworkBand();
      if ($("resonance-freq")) $("resonance-freq").textContent = freq + " MHz";
      if ($("resonance-band")) { $("resonance-band").textContent = band; $("resonance-band").style.color = "#00ffcc"; }
      if ($("resonance-soul-status")) { $("resonance-soul-status").textContent = isGuest ? "BOUND (GUEST)" : "BOUND"; $("resonance-soul-status").style.color = "#00ffcc"; }
      if ($("resonance-status")) { $("resonance-status").textContent = "PROTOCOL ACTIVE"; $("resonance-status").style.color = "#00ffcc"; }
      playResonanceSound();
      const startTime = Date.now(); startResonanceTimer(startTime);
      if (btn) { btn.textContent = "IMMORTALITY ACTIVE"; btn.style.background = "#333"; btn.style.color = "#00ffcc"; btn.disabled = true; }
      const input = $("resonance-human-id"); if (input) input.disabled = true;
      logMemory("Resonance Bound (" + (isGuest ? "Guest" : "Wallet") + "). Band: " + band + ". Freq: " + freq + " MHz.", "#00ffcc");
      // Persist only a short salted tag, never the raw input.
      const tag = resonanceTag(humanId);
      try { localStorage.setItem("ebank_resonance_data", JSON.stringify({ tag: tag, freq: freq, band: band, startTime: startTime, isGuest: isGuest })); } catch (_) {}
    } catch (_) {
      if (btn) { btn.textContent = "ERROR"; btn.style.background = "#ff4444"; }
    }
  }, 1500);
}

// ------------------------------------------------- tokens + security scan
function setBadge(el, text, cls, color) {
  if (!el) return;
  el.textContent = text;
  el.className = cls;
  if (color) el.style.color = color;
}

// Per-token health recorded as each card resolves, so the global safety panel
// can report real aggregates instead of hardcoded strings.
const tokenHealth = new Map(); // id -> { liq:number|null, sec:{level:string,flags:string[]}|null }
function recordHealth(id, patch) {
  const cur = tokenHealth.get(id) || { liq: null, sec: null };
  tokenHealth.set(id, Object.assign(cur, patch));
}

async function loadTokens() {
  let tokens = FALLBACK_TOKENS;
  try {
    const r = await fetchWithTimeout("tokens.json", LOCAL_TIMEOUT);
    if (r.ok) {
      const j = await r.json();
      if (Array.isArray(j) && j.length) tokens = j;
    }
  } catch (_) { /* keep fallback list */ }

  const grid = $("token-grid");
  if (!grid) return;
  grid.innerHTML = "";
  // Real event: cards were (re)rendered from tokens.json / fallback list.
  logMemory("Token cards refreshed (" + tokens.length + " tokens)", "#8899a6");

  // --- render each card from validated primitives (no raw interpolation) ---
  tokens.forEach(t => {
    const addr = isAddress(t.address) ? t.address : "";
    const id   = String(t.id || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!id) return;

    const card = document.createElement("div");
    card.className = "card";

    const h3 = document.createElement("h3");
    h3.appendChild(document.createTextNode(String(t.symbol || "?")));
    const freq = document.createElement("span");
    freq.className = "freq"; freq.textContent = String(t.freq || "");
    h3.appendChild(freq);

    const name = document.createElement("p");
    name.className = "name"; name.textContent = String(t.name || "");

    const addrP = document.createElement("p");
    addrP.className = "addr"; addrP.textContent = addr || "unknown address";

    const tvl = document.createElement("p");
    tvl.className = "tvl";
    tvl.appendChild(document.createTextNode("Pool TVL: "));
    const badge = document.createElement("span");
    badge.id = "tvl-" + id; badge.className = "badge loading"; badge.textContent = "SYNCING...";
    tvl.appendChild(badge);

    const sec = document.createElement("p");
    sec.id = "sec-" + id;
    sec.className = "security-status";
    sec.style.cssText = "font-size:0.75rem;color:var(--dim);";
    sec.textContent = "🛡️ Security: scanning...";

    const links = document.createElement("div");
    links.className = "links";

    const uniswapHref = addr ? "https://app.uniswap.org/swap?chain=base&outputCurrency=" + addr : "#";
    const aSwap = document.createElement("a");
    aSwap.href = safeUrl(uniswapHref, ["uniswap.org"]) === "#" ? "#" : uniswapHref;
    aSwap.target = "_blank"; aSwap.rel = "noopener noreferrer"; aSwap.className = "swap-btn"; aSwap.textContent = "🔄 Swap";

    const aScan = document.createElement("a");
    aScan.href = addr ? "https://basescan.org/token/" + addr : "#";
    aScan.target = "_blank"; aScan.rel = "noopener noreferrer"; aScan.textContent = "BaseScan";

    links.appendChild(aSwap); links.appendChild(aScan);
    card.appendChild(h3); card.appendChild(name); card.appendChild(addrP); card.appendChild(tvl); card.appendChild(sec); card.appendChild(links);
    grid.appendChild(card);
  });

  // --- resolve each card's live data with deadlines + graceful failure ---
  await Promise.all(tokens.map(t => hydrateToken(t)));

  // Now that every card has a real result (or a real failure), aggregate them.
  runSafety();
}

async function hydrateToken(t) {
  const id = String(t.id || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!id) return;
  const tvlEl = $("tvl-" + id);
  const secEl = $("sec-" + id);
  const addr  = isAddress(t.address) ? t.address : "";

  // --- DexScreener liquidity (with GeckoTerminal fallback) ---
  if (!addr) { setBadge(tvlEl, "NO ADDRESS", "badge empty"); recordHealth(id, { liq: null }); }
  else {
    try {
      const r = await fetchWithTimeout(DEX_API + addr, API_TIMEOUT);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const pairs = await r.json();
      if (Array.isArray(pairs) && pairs.length) {
        const best = pairs.reduce((a, b) => {
          const au = Number(a?.liquidity?.usd) || 0, bu = Number(b?.liquidity?.usd) || 0;
          return bu > au ? b : a;
        }, pairs[0]);
        const usd = Number(best?.liquidity?.usd) || 0;
        setBadge(tvlEl, "$" + usd.toFixed(2), "badge tiny");
        recordHealth(id, { liq: usd });
      } else {
        // DexScreener returned nothing: discover the deepest pool from
        // GeckoTerminal directly (no stale hardcoded pool id), then fall back to
        // the pool id in the token list as a last resort.
        let gecko = await geckoTokenReserve(addr);
        if (gecko == null) {
          const pool = typeof t.pool === "string" ? t.pool : "";
          if (pool) gecko = await geckoPoolReserve(pool);
        }
        if (gecko != null) { setBadge(tvlEl, "$" + gecko.toFixed(2), "badge tiny"); recordHealth(id, { liq: gecko }); }
        else { setBadge(tvlEl, "LOW DATA", "badge empty"); recordHealth(id, { liq: null }); }
      }
    } catch (e) {
      setBadge(tvlEl, (e && e.name === "AbortError") ? "TIMEOUT" : "API ERROR", "badge empty");
      recordHealth(id, { liq: null });
    }
  }

  // --- GoPlus security ---
  if (!addr) { setSafeText(secEl, "🛡️ Security: unknown token"); recordHealth(id, { sec: null }); }
  else {
    try {
      const r = await fetchWithTimeout(GOPLUS_API + addr, API_TIMEOUT);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      const res = j && j.result && j.result[addr.toLowerCase()];
      if (!res) {
        setSafeText(secEl, "🛡️ Security: LOW DATA (not indexed)");
        if (secEl) secEl.style.color = "var(--dim)";
        recordHealth(id, { sec: null });
      } else {
        const flags = [];
        if (res.is_honeypot === "1" || res.cannot_sell_all === "1") flags.push("honeypot");
        if ((parseFloat(res.buy_tax) || 0) > 0.1 || (parseFloat(res.sell_tax) || 0) > 0.1) flags.push("high-tax");
        if (res.hidden_owner === "1") flags.push("hidden-owner");
        if (res.can_take_back_ownership === "1") flags.push("reclaim-ownership");
        if (res.owner_change_balance === "1") flags.push("owner-can-burn-balances");
        if (res.is_open_source === "0") flags.push("unverified-source");
        if (res.is_mintable === "1") flags.push("mintable");
        if (res.is_proxy === "1") flags.push("upgradeable-proxy");
        if (res.transfer_pausable === "1") flags.push("transfer-pausable");
        if (res.slippage_modifiable === "1") flags.push("modifiable-tax");
        const critical = flags.some(f => ["honeypot", "hidden-owner", "reclaim-ownership", "mintable", "upgradeable-proxy", "transfer-pausable"].includes(f));
        const warn = flags.some(f => ["high-tax", "owner-can-burn-balances", "unverified-source", "modifiable-tax"].includes(f));
        const label = critical ? "🚨 RISK: " + flags.slice(0, 2).join(", ")
                    : warn ? "⚠️ CAUTION: " + flags.slice(0, 2).join(", ")
                    : "🛡️ No GoPlus flags";
        setSafeText(secEl, label);
        if (secEl) secEl.style.color = critical ? "#ff4444" : (warn ? "#ffaa00" : "#00ffcc");
        recordHealth(id, { sec: { level: critical ? "critical" : (warn ? "warn" : "safe"), flags: flags } });
      }
    } catch (e) {
      setSafeText(secEl, (e && e.name === "AbortError") ? "🛡️ Security: TIMEOUT" : "🛡️ Security: API ERROR");
      if (secEl) secEl.style.color = "#ffaa00";
      recordHealth(id, { sec: null });
    }
  }
}

// Aggregate the per-token health recorded above into the two global badges.
// Called AFTER hydration so the numbers reflect real API results, not guesses.
function runSafety() {
  const entries = [...tokenHealth.values()];
  const scanned = entries.length;

  // Contract security: count tokens whose GoPlus scan came back clean.
  const sec = $("global-contract-status");
  if (sec) {
    const indexed = entries.filter(e => e.sec).length;
    const critical = entries.filter(e => e.sec && e.sec.level === "critical").length;
    const warn = entries.filter(e => e.sec && e.sec.level === "warn").length;
    const clean = entries.filter(e => e.sec && e.sec.level === "safe").length;
    if (!scanned) { sec.textContent = "AWAITING SCAN"; sec.className = "status-badge pending"; }
    else if (critical) { sec.textContent = critical + " RISK / " + scanned; sec.className = "status-badge danger"; }
    else if (warn) { sec.textContent = clean + " CLEAN · " + warn + " CAUTION"; sec.className = "status-badge pending"; }
    else if (indexed) { sec.textContent = clean + "/" + scanned + " CLEAN"; sec.className = "status-badge verified"; }
    else { sec.textContent = "LOW DATA (unindexed)"; sec.className = "status-badge pending"; }
  }

  // Liquidity health: bucket the deepest real pool across all tokens.
  const liq = $("global-liquidity-status");
  if (liq) {
    const vals = entries.map(e => e.liq).filter(v => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) { liq.textContent = "NO DATA"; liq.className = "status-badge pending"; }
    else {
      const max = Math.max(...vals);
      if (max < 1000) { liq.textContent = "CRITICAL (< $1K)"; liq.className = "status-badge danger"; }
      else if (max < 50000) { liq.textContent = "THIN (< $50K)"; liq.className = "status-badge pending"; }
      else { liq.textContent = "HEALTHY ($" + Math.round(max).toLocaleString() + ")"; liq.className = "status-badge verified"; }
    }
  }
}

// ---------------------------------------------------------------- grids
function loadGrids() {
  const vg = $("vault-grid");
  if (vg) {
    vg.innerHTML = "";
    VAULTS_DATA.forEach(v => {
      const el = document.createElement("div");
      el.className = "card small vault-card";

      const h4 = document.createElement("h4");
      h4.appendChild(document.createTextNode(String(v.name) + " "));
      const badge = document.createElement("span");
      badge.className = "badge tiny"; badge.style.color = "#00ffcc"; badge.textContent = String(v.type);
      h4.appendChild(badge);

      const asset = document.createElement("p"); asset.style.cssText = "color:var(--dim);font-size:0.8rem;"; asset.textContent = String(v.asset);
      const apy   = document.createElement("p"); apy.style.cssText = "font-size:1.2rem;color:#00ffcc;"; apy.textContent = String(v.apy) + " APY";
      const tvl   = document.createElement("p"); tvl.style.cssText = "color:var(--dim);font-size:0.75rem;"; tvl.textContent = String(v.tvl);

      const link = document.createElement("a");
      link.href = safeUrl(v.link, ["morpho.org", "euler.finance", "yo.xyz", "moonwell.fi", "beefy.com", "alienbase.xyz", "uniswap.org"]);
      link.target = "_blank"; link.rel = "noopener noreferrer"; link.className = "swap-btn"; link.style.cssText = "margin-top:5px;font-size:0.7rem;"; link.textContent = "View →";

      el.appendChild(h4); el.appendChild(asset); el.appendChild(apy); el.appendChild(tvl); el.appendChild(link);
      vg.appendChild(el);
    });
  }

  const mg = $("mining-grid");
  if (mg) {
    mg.innerHTML = "";
    MINING_DATA.forEach(p => {
      const el = document.createElement("div");
      el.className = "card small mining-card";

      const h4 = document.createElement("h4");
      h4.appendChild(document.createTextNode(String(p.name) + " "));
      // "ONLINE" would be an unverified uptime claim: the browser cannot open a
      // stratum TCP socket, so nothing here checks reachability. Say LISTED.
      const badge = document.createElement("span"); badge.className = "badge tiny"; badge.textContent = "LISTED";
      h4.appendChild(badge);

      const fee = document.createElement("p"); fee.style.cssText = "font-size:0.8rem;color:var(--dim);"; fee.textContent = String(p.fee) + " | " + String(p.coin);
      const stratum = document.createElement("p"); stratum.className = "mono"; stratum.style.marginTop = "5px"; stratum.textContent = String(p.stratum);

      el.appendChild(h4); el.appendChild(fee); el.appendChild(stratum);
      mg.appendChild(el);
    });
  }
}

// ----------------------------------------------------------------- bots
let dcaActive = false, gridActive = false, dcaPnl = 0, gridPnl = 0, dcaTrades = 0, gridTrades = 0, dcaWin = 0, gridWin = 0;
let botsListenersBound = false;

function updateBotsUI() {
  if (!botGateUnlocked) return; // gate owns the locked styling
  const ds = $("dca-status");
  if (ds) { ds.textContent = dcaActive ? "ACTIVE" : "PAUSED"; ds.style.color = dcaActive ? "#00ffcc" : "#ffaa00"; ds.style.borderColor = dcaActive ? "#00ffcc" : "#ffaa00"; }
  const db = $("dca-btn");
  if (db) { db.textContent = dcaActive ? "Stop Bot" : "Start Bot"; db.style.background = dcaActive ? "#ff4444" : "#00ffcc"; db.style.color = dcaActive ? "#fff" : "#000"; }
  // No live PnL feed exists, so these stay an explicit non-value.
  if ($("dca-pnl")) $("dca-pnl").textContent = "—";
  if ($("dca-trades")) $("dca-trades").textContent = "—";
  if ($("dca-win")) $("dca-win").textContent = "—";

  const gs = $("grid-status");
  if (gs) { gs.textContent = gridActive ? "ACTIVE" : "PAUSED"; gs.style.color = gridActive ? "#00ffcc" : "#ffaa00"; gs.style.borderColor = gridActive ? "#00ffcc" : "#ffaa00"; }
  const gb = $("grid-btn");
  if (gb) { gb.textContent = gridActive ? "Stop Bot" : "Start Bot"; gb.style.background = gridActive ? "#ff4444" : "#00ffcc"; gb.style.color = gridActive ? "#fff" : "#000"; }
  if ($("grid-pnl")) $("grid-pnl").textContent = "—";
  if ($("grid-trades")) $("grid-trades").textContent = "—";
  if ($("grid-win")) $("grid-win").textContent = "—";
}

function startBotsEngine() {
  updateBotsUI();
  // No simulated PnL ticks: with no real fill source the honest value is a
  // dash, so there is nothing for a timer to update.

  if (!botsListenersBound) {
    botsListenersBound = true;
    $("dca-btn")?.addEventListener("click", () => { if (!connectedWallet) { alert("Connect wallet first."); return; } if (!botGateUnlocked) { alert("Hold at least 1,000 PIDX to unlock the bots."); return; } dcaActive = !dcaActive; updateBotsUI(); logMemory("DCA Bot " + (dcaActive ? "Started" : "Stopped") + ".", dcaActive ? "#00ffcc" : "#ff4444"); });
    $("grid-btn")?.addEventListener("click", () => { if (!connectedWallet) { alert("Connect wallet first."); return; } if (!botGateUnlocked) { alert("Hold at least 1,000 PIDX to unlock the bots."); return; } gridActive = !gridActive; updateBotsUI(); logMemory("Grid Bot " + (gridActive ? "Started" : "Stopped") + ".", gridActive ? "#00ffcc" : "#ff4444"); });
  }
}

// ------------------------------------------------------------ AGI brain
function startAGIBrain() {
  const canvas = $("agi-canvas");
  if (!canvas || typeof THREE === "undefined") return;
  if (canvas.dataset.brainStarted === "1") return; // never double-init WebGL
  canvas.dataset.brainStarted = "1";

  const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 300;
  const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 200;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(w, h); renderer.setPixelRatio(window.devicePixelRatio); camera.position.z = 20;

  const nodes = [];
  const nodeGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 70; i++) {
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
    scene.add(node); nodes.push({ mesh: node });
  }
  const linePos = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].mesh.position.distanceTo(nodes[j].mesh.position) < 9) {
        linePos.push(nodes[i].mesh.position.x, nodes[i].mesh.position.y, nodes[i].mesh.position.z,
                     nodes[j].mesh.position.x, nodes[j].mesh.position.y, nodes[j].mesh.position.z);
      }
    }
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.3 }));
  scene.add(lines);

  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.01;
    scene.rotation.y += 0.001; scene.rotation.x += 0.0005;
    nodes.forEach((n, i) => { const s = 1 + Math.sin(t * 2 + i) * 0.3; n.mesh.scale.set(s, s, s); });
    renderer.render(scene, camera);
  })();

  window.addEventListener("resize", () => {
    const nw = canvas.clientWidth || 300, nh = canvas.clientHeight || 200;
    camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
  });
}

// ------------------------------------------------- PIDX Locker (Web3)
let lockerBusy = false;

async function getLockerContext() {
  if (typeof ethers === "undefined") throw new Error("Ethers library not loaded");
  if (!connectedWallet) throw new Error("NO_WALLET");
  const lockerAddrEl = $("locker-addr");
  const lockerAddr = (lockerAddrEl?.dataset.address || lockerAddrEl?.textContent || LOCKER_ADDR).trim();
  if (!isAddress(lockerAddr)) throw new Error("Locker contract address is invalid");

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId !== BASE_CHAIN_ID) throw new Error("WRONG_NETWORK");

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const npm = new ethers.Contract(NPM_ADDR, NPM_ABI, signer);
  const locker = new ethers.Contract(lockerAddr, LOCKER_ABI, signer);
  return { lockerAddr: lockerAddr, signer: signer, npm: npm, locker: locker };
}

function setLockerBtn(btn, text, bg, color) {
  if (!btn) return;
  btn.textContent = text;
  if (bg) btn.style.background = bg;
  if (color) btn.style.color = color;
  btn.disabled = false;
}

async function scanAndLockPositions() {
  const btn = $("scan-lock-btn");
  const logEl = $("locker-log");
  const say = (m) => { if (logEl) logEl.textContent = m; };

  if (lockerBusy) return;
  if (!connectedWallet) { alert("Please connect your wallet in the header first."); return; }
  lockerBusy = true;
  setLockerBtn(btn, "Connecting...", "#333");
  say("");

  try {
    const ctx = await getLockerContext();

    // balanceOf(tokenOwner) uses the owner address as the argument, not an index.
    const bal = await ctx.npm.balanceOf(connectedWallet);
    if (bal === 0n) { say("No Uniswap V3 positions found for this wallet."); setLockerBtn(btn, "Scan Wallet & Lock Positions", "#8247e5"); return; }

    const total = Number(bal);
    say("Found " + total + " position(s). Preparing...");
    const ONE_YEAR = 365 * 24 * 60 * 60;
    let lockedCount = 0, skipped = 0, failed = 0;

    for (let i = 0; i < total; i++) {
      let tokenId;
      try { tokenId = await ctx.npm.tokenOfOwnerByIndex(connectedWallet, i); }
      catch (e) { console.warn("tokenOfOwnerByIndex failed at index", i, e); skipped++; continue; }

      try {
        // Ownership check BEFORE spending gas on approve.
        const currentOwner = await ctx.npm.ownerOf(tokenId);
        if (String(currentOwner).toLowerCase() !== connectedWallet.toLowerCase()) { skipped++; continue; }

        // STEP 1 — approve the LOCKER (not the NPM) to pull this specific token.
        say("Step 1/2 · Approving Locker for NFT #" + tokenId + "...");
        const approveTx = await ctx.npm.approve(ctx.lockerAddr, tokenId);
        const approveRcpt = await approveTx.wait();
        if (!approveRcpt || approveRcpt.status !== 1) { failed++; say("Approve failed for NFT #" + tokenId + ". Skipping."); continue; }

        // STEP 2 — only runs once approval is mined.
        say("Step 2/2 · Locking NFT #" + tokenId + " for 1 year...");
        const lockTx = await ctx.locker.lockPosition(NPM_ADDR, tokenId, ONE_YEAR);
        const lockRcpt = await lockTx.wait();
        if (!lockRcpt || lockRcpt.status !== 1) { failed++; continue; }

        lockedCount++;
        logMemory("PIDX Locker: locked NFT #" + tokenId + ".", "#8247e5");
      } catch (e) {
        failed++;
        console.warn("Could not lock token", tokenId, e);
      }
    }

    say("✅ Locked " + lockedCount + "/" + total + " position(s)" + (skipped ? " · " + skipped + " skipped" : "") + (failed ? " · " + failed + " failed" : "") + ".");
    setLockerBtn(btn, lockedCount ? "Locked!" : "Scan Wallet & Lock Positions", lockedCount ? "#00ffcc" : "#8247e5", lockedCount ? "#000" : "#fff");
    logMemory("PIDX Locker: locked " + lockedCount + " position(s).", "#8247e5");
  } catch (e) {
    console.error(e);
    if (e.message === "NO_WALLET") say("❌ Connect a wallet first.");
    else if (e.message === "WRONG_NETWORK") say("❌ Please switch to the Base network.");
    else say("❌ Error scanning or locking positions. " + (e.shortMessage || e.message || ""));
    setLockerBtn(btn, "Scan Wallet & Lock Positions", "#8247e5");
  } finally {
    lockerBusy = false;
  }
}

async function withdrawPosition() {
  const btn = $("withdraw-lock-btn");
  const logEl = $("withdraw-log");
  const input = $("withdraw-token-id");
  const say = (m) => { if (logEl) logEl.textContent = m; };

  if (lockerBusy) return;
  if (!connectedWallet) { alert("Please connect your wallet in the header first."); return; }

  const raw = (input?.value || "").trim();
  if (!/^\d+$/.test(raw)) { say("❌ Enter a numeric Uniswap V3 token ID."); return; }
  let tokenId;
  try { tokenId = BigInt(raw); } catch (_) { say("❌ Invalid token ID."); return; }
  if (tokenId <= 0n || tokenId > MAX_UINT256) { say("❌ Token ID out of range."); return; }

  lockerBusy = true;
  setLockerBtn(btn, "Checking lock...", "#333");
  say("");

  try {
    const ctx = await getLockerContext();
    const rec = await ctx.locker.locks(NPM_ADDR, tokenId);
    const isLocked = rec && (rec.isLocked ?? rec[2]);
    const owner = rec && (rec.owner ?? rec[0]);
    const unlockTime = rec && (rec.unlockTime ?? rec[1]);

    if (!isLocked) { say("❌ Token #" + tokenId + " is not locked by this contract."); setLockerBtn(btn, "Withdraw Unlocked Position", "#333", "#00ffcc"); return; }
    if (String(owner).toLowerCase() !== connectedWallet.toLowerCase()) { say("❌ Token #" + tokenId + " was locked by a different wallet."); setLockerBtn(btn, "Withdraw Unlocked Position", "#333", "#00ffcc"); return; }

    const now = Math.floor(Date.now() / 1000);
    if (now < Number(unlockTime)) {
      const when = new Date(Number(unlockTime) * 1000).toLocaleString();
      say("⏳ Still locked until " + when + ".");
      setLockerBtn(btn, "Withdraw Unlocked Position", "#333", "#00ffcc");
      return;
    }

    say("Withdrawing NFT #" + tokenId + "...");
    const tx = await ctx.locker.withdrawPosition(NPM_ADDR, tokenId);
    const rcpt = await tx.wait();
    if (rcpt && rcpt.status === 1) { say("✅ Withdrawn NFT #" + tokenId + "."); logMemory("PIDX Locker: withdrew NFT #" + tokenId + ".", "#00ffcc"); }
    else { say("❌ Withdraw transaction failed."); }
    setLockerBtn(btn, "Withdraw Unlocked Position", "#333", "#00ffcc");
  } catch (e) {
    console.error(e);
    if (e.message === "NO_WALLET") say("❌ Connect a wallet first.");
    else if (e.message === "WRONG_NETWORK") say("❌ Please switch to the Base network.");
    else say("❌ " + (e.shortMessage || e.message || "Withdraw failed."));
    setLockerBtn(btn, "Withdraw Unlocked Position", "#333", "#00ffcc");
  } finally {
    lockerBusy = false;
  }
}

// ------------------------------------------------------------------ boot
function restoreResonance() {
  const savedRes = localStorage.getItem("ebank_resonance_data");
  if (!savedRes) return;
  let data;
  try {
    data = JSON.parse(savedRes);
  } catch (_) {
    // Malformed JSON: drop the key entirely rather than keep unknown bytes.
    try { localStorage.removeItem("ebank_resonance_data"); } catch (_) {}
    return;
  }
  try {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      try { localStorage.removeItem("ebank_resonance_data"); } catch (_) {}
      return;
    }
    // Older builds stored the raw input verbatim under one of several keys.
    // If any identifying field is present, strip it and rewrite the record.
    if ("humanId" in data || "human_id" in data || "identity" in data || "id" in data) {
      delete data.humanId; delete data.human_id; delete data.identity; delete data.id;
      data.tag = data.tag || "purged";
      try { localStorage.setItem("ebank_resonance_data", JSON.stringify(data)); } catch (_) {}
    }
    if ($("resonance-freq")) $("resonance-freq").textContent = data.freq + " MHz";
    if ($("resonance-band")) { $("resonance-band").textContent = data.band; $("resonance-band").style.color = "#00ffcc"; }
    if ($("resonance-soul-status")) { $("resonance-soul-status").textContent = data.isGuest ? "BOUND (GUEST)" : "BOUND"; $("resonance-soul-status").style.color = "#00ffcc"; }
    if ($("resonance-status")) { $("resonance-status").textContent = "PROTOCOL ACTIVE"; $("resonance-status").style.color = "#00ffcc"; }
    const btn = $("resonance-initiate-btn"); if (btn) { btn.textContent = "IMMORTALITY ACTIVE"; btn.style.background = "#333"; btn.style.color = "#00ffcc"; btn.disabled = true; }
    const input = $("resonance-human-id");
    if (input) { input.value = ""; input.placeholder = data.tag ? "saved (tag " + data.tag + ")" : "saved locally"; input.disabled = true; }
    if (data.startTime) startResonanceTimer(data.startTime);
  } catch (_) {}
}

// ================================================== ECOSYSTEM UPGRADES

// --- Upgrade: block health. Try a live WebSocket first (eth_subscribe
// newHeads) and fall back to a 5s HTTP polling loop via fetchWithTimeout if the
// socket cannot open or drops. NOTE: Base's public endpoint currently rejects
// WebSocket upgrades (HTTP 405), so on the default endpoint the polling
// fallback is what actually runs. Point BASE_WS at a WS-capable provider to get
// the live path. Either way the site stays up.
const RPC_POLL_MS = 5000;
const LOCK_SCAN_EVERY = 6;        // heavy eth_getLogs scan every ~30s
const WS_MAX_RETRIES = 2;

let blockPollTimer = null;        // HTTP polling loop (fallback)
let lockScanTimer = null;         // always-on slow loop for logs + burn read
let ws = null;                    // active WebSocket, if any
let wsLive = false;               // true once the socket is open/authoritative
let wsRetries = 0;

function setRpcStatus(text, color) {
  const el = $("rpc-status");
  if (el) { el.textContent = text; el.style.color = color; }
}
let lastLoggedBlock = 0, lastBlockLogAt = 0;
function setLiveBlock(n) {
  const liveBlock = $("live-block");
  if (liveBlock && Number.isFinite(n)) liveBlock.textContent = n.toLocaleString();
  // Real event: the chain height moved. Throttled to once a minute so the
  // terminal stays readable (Base produces a block roughly every 2s).
  if (Number.isFinite(n) && n !== lastLoggedBlock) {
    lastLoggedBlock = n;
    if (Date.now() - lastBlockLogAt > 60000) {
      lastBlockLogAt = Date.now();
      logMemory("Chain height " + n.toLocaleString() + " (live RPC)", "#00ffcc");
    }
  }
}

async function refreshRpcHealth() {
  try {
    const hex = await jsonRpc("eth_blockNumber", []);
    const block = parseInt(hex, 16);
    setLiveBlock(block);
    if (!wsLive) setRpcStatus("● RPC: LIVE (" + block.toLocaleString() + ")", "#00ffcc");
  } catch (_) {
    if (!wsLive) setRpcStatus("● RPC: OFFLINE (using fallback)", "#ffaa00");
  }
}

function startHttpBlockPolling() {
  if (blockPollTimer) return;     // already polling
  refreshRpcHealth();
  blockPollTimer = setInterval(refreshRpcHealth, RPC_POLL_MS);
}
function stopHttpBlockPolling() {
  if (blockPollTimer) { clearInterval(blockPollTimer); blockPollTimer = null; }
}

// Slow loop that runs regardless of transport: lock scan + burn read.
function startLockScanLoop() {
  // fetchLockedPositions() is intentionally NOT called: its output element
  // (the locker panel) is pulled until the position has non-zero liquidity.
  // The function is retained for when the panel returns.
  refreshBurnCounter();
  refreshLockerStatus();
  if (lockScanTimer) clearInterval(lockScanTimer);
  lockScanTimer = setInterval(() => {
    refreshBurnCounter();
    refreshLockerStatus();
  }, RPC_POLL_MS * LOCK_SCAN_EVERY);
}

function startBlockFeed() {
  // Baseline: start HTTP polling immediately so the dashboard is never blank.
  startHttpBlockPolling();
  if (typeof WebSocket === "undefined") return;
  let socket;
  try { socket = new WebSocket(BASE_WS); }
  catch (_) { return; } // polling already running
  ws = socket;

  const fallback = () => {
    if (ws !== socket) return;    // already superseded
    ws = null;
    wsLive = false;
    try { socket.close(); } catch (_) {}
    startHttpBlockPolling();      // ensure polling is running again
    if (++wsRetries <= WS_MAX_RETRIES) setTimeout(startBlockFeed, 5000);
  };

  socket.onopen = () => {
    wsRetries = 0;
    wsLive = true;
    stopHttpBlockPolling();       // WebSocket is authoritative now
    setRpcStatus("● RPC: LIVE (WebSocket)", "#00ffcc");
    try { socket.send(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_subscribe", params: ["newHeads"] })); } catch (_) {}
  };
  socket.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const num = msg && msg.params && msg.params.result && msg.params.result.number;
      if (num) { setLiveBlock(parseInt(num, 16)); setRpcStatus("● RPC: LIVE (WebSocket)", "#00ffcc"); }
    } catch (_) {}
  };
  socket.onerror = fallback;
  socket.onclose = fallback;
}

function startRpcHealth() {
  startLockScanLoop();
  startBlockFeed();
}

// --- Upgrade: token gate for the bots (requires >= 1,000 PIDX).
let botGateUnlocked = false;
async function updateBotGate() {
  const dcaBtn = $("dca-btn"), gridBtn = $("grid-btn");
  const dcaStatus = $("dca-status"), gridStatus = $("grid-status");
  if (!connectedWallet) {
    botGateUnlocked = false;
    [dcaBtn, gridBtn].forEach(b => { if (b) { b.disabled = true; b.textContent = "Locked"; b.style.background = "#333"; b.style.color = "#888"; b.style.cursor = "not-allowed"; } });
    [dcaStatus, gridStatus].forEach(s => { if (s) { s.textContent = "LOCKED"; s.style.color = "#ffaa00"; s.style.borderColor = "#ffaa00"; } });
    return;
  }
  let bal = 0n;
  try { bal = await erc20BalanceOf(PIDX_ADDR, connectedWallet); }
  catch (e) { logMemory("Token gate: could not read PIDX balance.", "#ffaa00"); return; }

  botGateUnlocked = bal >= BOT_MIN_PIDX;
  if (botGateUnlocked) {
    [dcaBtn, gridBtn].forEach(b => { if (b) { b.disabled = false; b.style.background = "#00ffcc"; b.style.color = "#000"; b.style.cursor = "pointer"; } });
    updateBotsUI(); // now owns the label: PAUSED (ready) / ACTIVE (running)
    logMemory("Bots unlocked: wallet holds ≥ 1,000 PIDX.", "#00ffcc");
  } else {
    [dcaBtn, gridBtn].forEach(b => { if (b) { b.disabled = true; b.textContent = "Locked"; b.style.background = "#333"; b.style.color = "#888"; b.style.cursor = "not-allowed"; } });
    [dcaStatus, gridStatus].forEach(s => { if (s) { s.textContent = "LOCKED"; s.style.color = "#ffaa00"; s.style.borderColor = "#ffaa00"; } });
    logMemory("Bots locked: need ≥ 1,000 PIDX.", "#ffaa00");
  }
}

// --- Upgrade: on-chain proof of lock (bounded, RPC-fallback aware).
// Reads the locker's PositionLocked logs over a small recent window. Public
// RPCs reject large ranges and rate-limit, so we cap the span and fall back.
const LOCKED_EVENT_TOPIC = "0x6e0460fc7ebeeb5da97c6c08ef8c5f5eafbde2370852b66517c8efbcff9f99d6";
async function fetchLockedPositions() {
  const listEl = $("locked-positions-list");
  if (listEl) listEl.textContent = "Scanning recent blocks for locks...";
  try {
    const headHex = await jsonRpc("eth_blockNumber", []);
    const head = parseInt(headHex, 16);
    const logs = await jsonRpc("eth_getLogs", [{
      fromBlock: "0x" + (head - LOG_WINDOW).toString(16),
      toBlock: "latest",
      address: LOCKER_ADDR,
      topics: [LOCKED_EVENT_TOPIC]
    }], 8000);

    if (!Array.isArray(logs) || logs.length === 0) {
      if (listEl) listEl.textContent = "No locks in the last " + LOG_WINDOW.toLocaleString() + " blocks.";
      return;
    }
    // Each PositionLocked log: topics[1]=nftContract, topics[2]=tokenId, topics[3]=owner; data=unlockTime.
    const seen = new Map();
    logs.forEach(l => {
      const tokenId = BigInt(l.topics[2]).toString();
      const owner = "0x" + l.topics[3].slice(26);
      seen.set(tokenId, owner);
    });
    if (listEl) {
      listEl.textContent = "";
      [...seen.entries()].slice(0, 20).forEach(([tokenId, owner]) => {
        const row = document.createElement("div");
        row.textContent = "🔒 Token #" + tokenId + " · owner " + shortAddr(owner);
        listEl.appendChild(row);
      });
    }
  } catch (e) {
    if (listEl) listEl.textContent = "Lock data unavailable (RPC rate-limited). Try again shortly.";
  }
}

// --- Upgrade: burn-address balance (honest, live). Reads the actual PIDX
// balance held by the dead address via ethers.js (read-only provider), so if
// anyone ever sends PIDX there the dashboard updates on its own. Falls back to
// a raw eth_call if ethers has not loaded. No simulated numbers.
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];
let burnDecimals = null; // resolved from the token once (PIDX = 18)

// Wrap any promise so a stalled provider can never hang the UI.
function withDeadline(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
  ]);
}

async function refreshBurnCounter() {
  const el = $("burn-counter");
  if (!el) return;
  try {
    let raw;
    if (typeof ethers !== "undefined") {
      const provider = new ethers.JsonRpcProvider(BASE_RPC);
      const token = new ethers.Contract(PIDX_ADDR, ERC20_ABI, provider);
      if (burnDecimals === null) {
        try { burnDecimals = Number(await withDeadline(token.decimals(), API_TIMEOUT)); } catch (_) { burnDecimals = 18; }
      }
      raw = await withDeadline(token.balanceOf(BURN_ADDR), API_TIMEOUT);
    } else {
      raw = await erc20BalanceOf(PIDX_ADDR, BURN_ADDR);
    }
    const whole = raw / (10n ** BigInt(burnDecimals === null ? 18 : burnDecimals));
    el.textContent = whole.toLocaleString() + " PIDX";
    // Real event: log the live burn balance only when it actually changes.
    const stamp = whole.toString();
    if (stamp !== lastBurnLogged) {
      lastBurnLogged = stamp;
      logMemory("Burn balance " + stamp + " PIDX (live)", "#ff0055");
    }
  } catch (_) { el.textContent = "unavailable"; }
}

let lastBurnLogged = null;
let booted = false;
window.addEventListener("DOMContentLoaded", () => {
  if (booted) return;
  booted = true;
  // Wallet provider may inject after DOMContentLoaded; keep trying briefly.
  EIP7702Guard.install();
  if (!EIP7702Guard.isInstalled()) {
    let tries = 0;
    const iv = setInterval(() => { if (EIP7702Guard.install() || ++tries > 20) clearInterval(iv); }, 300);
    window.addEventListener("ethereum#initialized", () => EIP7702Guard.install(), { once: true });
  }

  $("connect-wallet-btn")?.addEventListener("click", connectWallet);
  $("resonance-initiate-btn")?.addEventListener("click", initiateResonance);
  $("scan-lock-btn")?.addEventListener("click", scanAndLockPositions);
  $("withdraw-lock-btn")?.addEventListener("click", withdrawPosition);

  generateAutoEngram();
  loadGrids();
  loadTokens();
  runSafety();
  startBotsEngine();
  startAGIBrain();
  restoreResonance();

  // Ecosystem upgrades.
  startRpcHealth();   // also kicks off the first lock scan + burn read
  updateBotGate();
});

// Expose for the standalone guard test harness.
window.PIDX_APP = {
  EIP7702Guard: EIP7702Guard,
  sanitizeHtml: sanitizeHtml,
  safeUrl: safeUrl,
  isAddress: isAddress,
  jsonRpc: jsonRpc,
  erc20BalanceOf: erc20BalanceOf,
  updateBotGate: updateBotGate,
  fetchLockedPositions: fetchLockedPositions,
  refreshBurnCounter: refreshBurnCounter,
  refreshRpcHealth: refreshRpcHealth,
  setLiveBlock: setLiveBlock,
  refreshLockerStatus: refreshLockerStatus,
  resonanceTag: resonanceTag,
  scanAndLockPositions: scanAndLockPositions,
  withdrawPosition: withdrawPosition,
  hydrateToken: hydrateToken,
  restoreResonance: restoreResonance,
  METRIC_REGISTRY: METRIC_REGISTRY
};
