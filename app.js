
const GECKO_API = "https://api.geckoterminal.com/api/v2";
const CHAIN = "base";

// SECURITY: Validate tokens.json schema before rendering
function validateTokenSchema(tokens) {
  if (!Array.isArray(tokens)) throw new Error("tokens.json must be an array");
  const required = ["id", "symbol", "name", "freq", "address", "pool"];
  for (const t of tokens) {
    for (const field of required) {
      if (!t[field] || typeof t[field] !== "string") {
        throw new Error(`tokens.json: missing or invalid field "${field}" in token ${t.id || "unknown"}`);
      }
    }
    // SECURITY: Enforce hexadecimal address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(t.address)) {
      throw new Error(`Invalid token address: ${t.address}`);
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(t.pool)) {
      throw new Error(`Invalid pool address: ${t.pool}`);
    }
  }
  return tokens;
}

async function fetchPoolData(token) {
  try {
    const url = `${GECKO_API}/networks/${CHAIN}/pools/${token.pool}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const attrs = json.data?.attributes || {};
    return { tvl: Number(attrs.reserve_in_usd || 0), source: "geckoterminal" };
  } catch (e) {
    console.warn(`GeckoTerminal failed for ${token.symbol}:`, e);
    return { tvl: 0, source: "error" };
  }
}

function renderCard(t) {
  // DOMPurify is still applied as a second layer of defense
  const safeSymbol = DOMPurify.sanitize(t.symbol);
  const safeName = DOMPurify.sanitize(t.name);
  const safeFreq = DOMPurify.sanitize(t.freq);
  const safeAddr = DOMPurify.sanitize(t.address);
  const safePool = DOMPurify.sanitize(t.pool);

  const uniswapUrl = `https://app.uniswap.org/explore/pools/base?query=${safePool}`;
  const geckoUrl = `https://www.geckoterminal.com/base/pools/${safePool}`;

  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <h3>${safeSymbol} <span class="freq">${safeFreq}</span></h3>
    <p class="name">${safeName}</p>
    <p class="addr">${safeAddr}</p>
    <p class="tvl">Pool TVL: <span id="tvl-${t.id}" class="badge loading">SYNCING...</span></p>
    <div class="links">
      <a href="${uniswapUrl}" target="_blank" rel="noopener noreferrer">Uniswap</a>
      <a href="https://basescan.org/token/${safeAddr}" target="_blank" rel="noopener noreferrer">BaseScan</a>
      <a href="${geckoUrl}" target="_blank" rel="noopener noreferrer">GeckoTerm</a>
    </div>`;
  return el;
}

async function syncAll(tokens) {
  for (const t of tokens) {
    const data = await fetchPoolData(t);
    const span = document.getElementById(`tvl-${t.id}`);
    if (!span) continue;
    if (data.source === "error") {
      span.className = "badge empty"; span.textContent = "API ERROR";
    } else if (data.tvl >= 1) {
      span.className = "badge tiny";
      span.textContent = `$${data.tvl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } else {
      span.className = "badge empty"; span.textContent = "LOW LIQUIDITY";
    }
  }
}

async function boot() {
  try {
    const res = await fetch("tokens.json");
    const raw = await res.json();
    const tokens = validateTokenSchema(raw); // SECURITY: validate before use
    const grid = document.getElementById("token-grid");
    grid.innerHTML = "";
    tokens.forEach(t => grid.appendChild(renderCard(t)));
    await syncAll(tokens);
    setInterval(() => syncAll(tokens), 30000);
  } catch (e) {
    document.getElementById("token-grid").innerHTML =
      '<p class="loading">SECURITY: tokens.json FAILED VALIDATION</p>';
    console.error(e);
  }
}

// 3D background remains unchanged (code omitted for brevity)
function startBackground() { /* ... same as before ... */ }
document.addEventListener("DOMContentLoaded", () => { startBackground(); boot(); });
