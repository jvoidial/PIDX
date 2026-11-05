
// ============ CONSTANTS ============
const DEX_API = "https://api.dexscreener.com/token-pairs/v1/base/";
const GECKO_API = "https://api.geckoterminal.com/api/v2/networks/base/pools/";
const CACHE_TTL = 30000;
const SECONDS_IN_YEAR = 31536000;

// ============ HARDCODED DATA ============
const VAULTS_DATA = [
    {"name": "Morpho USDC Vault", "type": "Vault", "asset": "USDC", "apy": "7.89%", "tvl": "$366K", "desc": "High utilization lending pool.", "link": "https://app.morpho.org/base"},
    {"name": "Euler V2 USDC Vault", "type": "Vault", "asset": "USDC", "apy": "6.85%", "tvl": "$584K", "desc": "ERC-4626 compliant vault.", "link": "https://app.euler.finance/"},
    {"name": "YO Protocol USDC", "type": "Vault", "asset": "USDC", "apy": "Variable", "tvl": "On-chain", "desc": "ERC-4626 yield-optimizer.", "link": "https://yo.xyz"},
    {"name": "Moonwell Morpho Vault", "type": "Vault", "asset": "USDC", "apy": "Variable", "tvl": "On-chain", "desc": "Allocates across Morpho markets.", "link": "https://docs.moonwell.fi"},
    {"name": "Beefy Auto-Compounder", "type": "Vault", "asset": "Multiple", "apy": "Variable", "tvl": "High", "desc": "Auto-compounds LP rewards.", "link": "https://app.beefy.com/"},
    {"name": "Beefy tBTC-WETH CLM", "type": "LP Pool", "asset": "tBTC/WETH", "apy": "7.74%", "tvl": "$103K", "desc": "Aerodrome CLM vault.", "link": "https://app.beefy.com/"},
    {"name": "Alien Base USDC-CBBTC", "type": "LP Pool", "asset": "USDC/CBBTC", "apy": "21.50%", "tvl": "$1.47M", "desc": "Concentrated V3 pool.", "link": "https://app.alienbase.xyz/"},
    {"name": "Uniswap V3 WETH-USDC", "type": "LP Pool", "asset": "WETH/USDC", "apy": "65%", "tvl": "$125M", "desc": "Highest organic yield.", "link": "https://app.uniswap.org/pools"},
    {"name": "Gyroscope WETH/USDC", "type": "LP Pool", "asset": "WETH/USDC", "apy": "78%", "tvl": "High", "desc": "Dynamic CLP with OP rewards.", "link": "https://gyro.finance"},
    {"name": "KyberSwap ETH/USDC", "type": "LP Pool", "asset": "ETH/USDC", "apy": "Variable", "tvl": "High", "desc": "Uniswap v4 FairFlow hook.", "link": "https://kyberswap.com/earn/pools"}
];

const MINING_DATA = [
    {"name": "Irium Public Pool", "fee": "0%", "coin": "IRM", "stratum": "stratum+tcp://pool.iriumlabs.org:3333", "status": "online", "notes": "Direct-payout solo mining."},
    {"name": "Linkrra Pool", "fee": "0% extra", "coin": "PRL", "stratum": "stratum.linkrra.com:5567", "status": "online", "notes": "PPLNS payout, 80% USDC on Base."},
    {"name": "SoloFury", "fee": "1%", "coin": "SHA-256", "stratum": "stratum+tcp://btc.solofury.com:7070", "status": "online", "notes": "Multi-coin solo mining."},
    {"name": "Ocean", "fee": "2% (1% DATUM)", "coin": "BTC", "stratum": "stratum+tcp://ocean.xyz:3334", "status": "online", "notes": "Non-custodial, no KYC."},
    {"name": "Braiins Pool", "fee": "0% (Braiins OS)", "coin": "BTC", "stratum": "stratum+tcp://stratum.braiins.com:3333", "status": "online", "notes": "Stratum V2 native."},
    {"name": "BASED Mining", "fee": "0%", "coin": "BTC (Solo)", "stratum": "stratum+tcp://pool.basedmining.xyz:3333", "status": "online", "notes": "On-chain solo mining via Base."},
    {"name": "MineBean", "fee": "Dynamic", "coin": "ETH / BEAN", "stratum": "N/A - Grid Mining", "status": "online", "notes": "Gamified mining on Base."}
];

// ============ HELPERS ============
function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function $(id) { return document.getElementById(id); }

// ============ MEMORY LOG ============
function loadMemory() {
    const memory = JSON.parse(localStorage.getItem("vitruvian_memory")) || [];
    const logContainer = $("memory-log");
    if (!logContainer) return;
    logContainer.innerHTML = "";
    if (memory.length === 0) {
        const div = document.createElement("div");
        div.style.color = "var(--dim)";
        div.textContent = "[SYSTEM INIT] Memory bank loaded...";
        logContainer.appendChild(div);
    }
    memory.forEach(entry => {
        const div = document.createElement("div");
        div.style.color = entry.color || "var(--text)";
        div.style.marginBottom = "4px";
        div.textContent = entry.msg;
        logContainer.appendChild(div);
    });
    logContainer.scrollTop = logContainer.scrollHeight;
}

function logMemory(msg, color = "var(--text)") {
    let memory = JSON.parse(localStorage.getItem("vitruvian_memory")) || [];
    const time = new Date().toLocaleTimeString();
    memory.push({ msg: `[${time}] ${msg}`, color });
    if (memory.length > 10) memory.shift();
    localStorage.setItem("vitruvian_memory", JSON.stringify(memory));
    loadMemory();
}

// ============ GROWTH ENGINE ============
function startGrowthEngine() {
    let block = 53318083;
    let time = 0;
    loadMemory();

    setInterval(() => {
        const phases = ["OPEN", "CLOSING", "VEILED"];
        const bands = ["LOW", "MID", "HIGH"];
        const newPhase = phases[Math.floor(Math.random() * phases.length)];
        const newBand = bands[Math.floor(Math.random() * bands.length)];
        const newStability = (1.1 + Math.random() * 0.1).toFixed(3);

        const vEl = $("v-veil");
        if (vEl) {
            vEl.textContent = newPhase;
            vEl.style.color = newPhase === "OPEN" ? "#00ffcc" : (newPhase === "VEILED" ? "#ff4444" : "#ffaa00");
        }
        const sEl = $("v-stability");
        if (sEl) sEl.textContent = newStability;
        const eBandEl = $("val-energy");
        if (eBandEl) eBandEl.textContent = `${newBand} (${(40 + Math.random() * 10).toFixed(1)} GW)`;

        logMemory(`Veil shifted to ${newPhase}. Stability: ${newStability}.`, newPhase === "VEILED" ? "#ff4444" : "#00ffcc");
    }, 15000);

    setInterval(() => {
        time += 0.1; block++;
        if ($("live-block")) $("live-block").textContent = block.toLocaleString();
        if ($("val-continuity")) $("val-continuity").textContent = (0.999 + Math.sin(time) * 0.001).toFixed(4);
        if ($("val-coherence")) $("val-coherence").textContent = (0.9356 + Math.sin(time * 0.8) * 0.002).toFixed(4);
        if ($("val-persistence")) $("val-persistence").textContent = `${379 + Math.floor(time / 10)} blocks`;
        if ($("val-voxels")) $("val-voxels").textContent = 7 + Math.round(Math.sin(time * 0.5));
        if (Math.floor(time) % 10 === 0) {
            const statusEl = $("val-engine");
            if (statusEl) {
                statusEl.textContent = "CALIBRATING..."; statusEl.style.color = "#ffaa00";
                setTimeout(() => { statusEl.textContent = "OPTIMAL"; statusEl.style.color = "var(--white)"; }, 1500);
            }
        }
    }, 1000);
}

// ============ eBANK ENGINE ============
let ebankPrincipal = 1000.00;
let ebankYield = 0.00000000;

function startEbankEngine() {
    setInterval(() => {
        const coherence = parseFloat($("val-coherence")?.textContent) || 0.9356;
        const apy = 0.15 + (coherence * 0.05);
        if ($("ebank-apy")) $("ebank-apy").textContent = `${(apy * 100).toFixed(2)}%`;

        const perSecond = Math.pow(1 + apy, 1 / SECONDS_IN_YEAR) - 1;
        const earned = ebankPrincipal * perSecond;
        ebankYield += earned;
        ebankPrincipal += earned;

        if ($("ebank-principal")) $("ebank-principal").textContent = `${ebankPrincipal.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})} PIDX`;
        if ($("ebank-yield")) $("ebank-yield").textContent = `+ ${ebankYield.toLocaleString(undefined, {minimumFractionDigits: 8, maximumFractionDigits: 8})} PIDX`;

        const immunity = (99.8 - (1 - coherence) * 10).toFixed(2);
        if ($("immunity-score")) $("immunity-score").textContent = `${immunity}%`;
    }, 1000);
}

// ============ TOKEN CARDS ============
function renderCard(t) {
    const safeSymbol = DOMPurify.sanitize(t.symbol);
    const safeName = DOMPurify.sanitize(t.name);
    const safeFreq = DOMPurify.sanitize(t.freq);
    const safeAddr = DOMPurify.sanitize(t.address);
    const safePool = DOMPurify.sanitize(t.pool);
    const swapUrl = `https://app.uniswap.org/swap?chain=base&inputCurrency=NATIVE&outputCurrency=${safeAddr}`;
    const geckoUrl = `https://www.geckoterminal.com/base/pools/${safePool}`;

    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
        <h3>${safeSymbol} <span class="freq">${safeFreq}</span></h3>
        <p class="name">${safeName}</p>
        <p class="addr">${safeAddr}</p>
        <p class="tvl">Pool TVL: <span id="tvl-${t.id}" class="badge loading">SYNCING...</span></p>
        <p class="security-status" id="sec-${t.id}" style="font-size:0.75rem; color:var(--dim);">🛡️ Security: scanning...</p>
        <div class="chart-container" id="chart-${t.id}" style="height: 250px; width: 100%; margin-top: 15px; border-radius: 8px; border: 1px solid var(--border); background: rgba(0,0,0,0.2);"></div>
        <div class="superchain-tracker" style="margin-top:10px; padding:10px; background:rgba(0,255,204,0.05); border:1px solid rgba(0,255,204,0.2); border-radius:8px;">
            <p style="font-size:0.8rem; color:#00ffcc; font-weight:bold;">🔗 Base Chain TVL</p>
            <p style="font-size:0.7rem; color:var(--dim);" id="base-tvl-${t.id}">Loading...</p>
        </div>
        <div class="links" style="margin-top:10px; display:flex; gap:5px; flex-wrap:wrap;">
            <a href="${swapUrl}" target="_blank" class="swap-btn" style="font-size:0.7rem; padding:4px 8px;">🔄 Swap</a>
            <a href="https://basescan.org/token/${safeAddr}" target="_blank" style="font-size:0.7rem; padding:4px 8px;">BaseScan</a>
            <a href="${geckoUrl}" target="_blank" style="font-size:0.7rem; padding:4px 8px;">GeckoTerm</a>
        </div>`;
    return el;
}

// ============ FETCH TVL ============
async function fetchTVL(token) {
    try {
        const res = await fetchWithTimeout(`${DEX_API}${token.address}`, {}, 4000);
        const pairs = await res.json();
        if (Array.isArray(pairs) && pairs.length > 0) {
            const best = pairs.reduce((a, b) => (a.liquidity?.usd > b.liquidity?.usd ? a : b), pairs[0]);
            return Number(best.liquidity?.usd || 0);
        }
    } catch(e) {}
    return 0;
}

// ============ FETCH SECURITY ============
async function fetchSecurity(token) {
    try {
        const res = await fetchWithTimeout(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${token.address}`, {}, 4000);
        const json = await res.json();
        const result = json.result?.[token.address.toLowerCase()];
        if (result) {
            const isHoneypot = result.is_honeypot === "1" || result.cannot_sell_all === "1";
            const sellTax = parseFloat(result.sell_tax || "0") * 100;
            if (isHoneypot) return { text: "🚨 HONEYPOT", color: "#ff4444" };
            if (sellTax > 10) return { text: `⚠️ Tax ${sellTax.toFixed(1)}%`, color: "#ffaa00" };
            return { text: `✅ Safe`, color: "#00ffcc" };
        }
    } catch(e) {}
    return { text: "🛡️ No data", color: "var(--dim)" };
}

// ============ RENDER CHART ============
async function renderChart(token) {
    const container = $(`chart-${token.id}`);
    if (!container) return;
    container.style.height = '250px';
    container.innerHTML = '<p style="color:var(--dim); text-align:center; padding-top:100px; font-size:0.75rem;">Loading chart...</p>';

    try {
        const targetUrl = `https://api.geckoterminal.com/api/v2/networks/base/pools/${token.pool}/ohlcv/minute?aggregate=15&limit=100&include_empty_intervals=true`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetchWithTimeout(proxyUrl, {}, 6000);
        const json = await res.json();
        const ohlcv = json.data?.attributes?.ohlcv_list;

        if (!ohlcv || ohlcv.length === 0) throw new Error("No OHLCV");
        const uniqueData = {};
        ohlcv.forEach(c => { uniqueData[Math.floor(c[0])] = c; });
        const sorted = Object.values(uniqueData).sort((a, b) => a[0] - b[0]);
        container.innerHTML = "";

        if (typeof LightweightCharts === 'undefined') throw new Error("Library missing");

        const chart = LightweightCharts.createChart(container, {
            width: container.clientWidth, height: 250,
            layout: { background: { color: 'transparent' }, textColor: '#71767b' },
            grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
            timeScale: { borderColor: 'rgba(255,255,255,0.1)' }, rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
        });
        const candles = chart.addCandlestickSeries({ upColor: '#00ffcc', downColor: '#ff4444', borderDownColor: '#ff4444', borderUpColor: '#00ffcc', wickDownColor: '#ff4444', wickUpColor: '#00ffcc' });
        candles.setData(sorted.map(c => ({ time: Math.floor(c[0]), open: parseFloat(c[1]), high: parseFloat(c[2]), low: parseFloat(c[3]), close: parseFloat(c[4]) })).filter(d => d.open > 0));
    } catch(e) {
        container.innerHTML = '<p style="color:var(--dim); text-align:center; padding-top:100px; font-size:0.75rem;">Chart unavailable (low data).</p>';
    }
}

// ============ LOAD TOKENS ============
async function loadTokens() {
    try {
        const res = await fetch("tokens.json");
        const tokens = await res.json();
        const grid = $("token-grid");
        if (!grid) return;
        grid.innerHTML = "";
        tokens.forEach(t => grid.appendChild(renderCard(t)));

        for (const t of tokens) {
            const tvl = await fetchTVL(t);
            const tvlEl = $(`tvl-${t.id}`);
            if (tvlEl) {
                if (tvl >= 1) { tvlEl.className = "badge tiny"; tvlEl.textContent = `$${tvl.toFixed(2)}`; }
                else { tvlEl.className = "badge empty"; tvlEl.textContent = "LOW LIQUIDITY"; }
            }
            const sec = await fetchSecurity(t);
            const secEl = $(`sec-${t.id}`);
            if (secEl) { secEl.textContent = `🛡️ ${sec.text}`; secEl.style.color = sec.color; }

            renderChart(t);
        }
    } catch(e) { console.error("Tokens failed:", e); }
}

// ============ BASE TVL ============
async function loadBaseTVL() {
    try {
        const res = await fetchWithTimeout("https://api.llama.fi/v2/chains", {}, 5000);
        const data = await res.json();
        const base = data.find(c => c.name === "Base");
        if (base && base.tvl) {
            const tvl = (base.tvl / 1e9).toFixed(2);
            document.querySelectorAll('[id^="base-tvl-"]').forEach(el => el.textContent = `$${tvl}B TVL`);
        }
    } catch(e) {
        document.querySelectorAll('[id^="base-tvl-"]').forEach(el => el.textContent = "Unavailable");
    }
}

// ============ LOAD VAULTS ============
function loadVaults() {
    const grid = $("vault-grid");
    if (!grid) return;
    grid.innerHTML = "";
    VAULTS_DATA.forEach(v => {
        const el = document.createElement("div");
        el.className = "card small vault-card";
        el.innerHTML = `
            <h4>${v.name} <span class="badge ${v.type === 'Vault' ? 'tiny' : 'empty'}" style="color:${v.type === 'Vault' ? '#00ffcc' : '#ffaa00'}; border-color:${v.type === 'Vault' ? '#00ffcc' : '#ffaa00'};">${v.type}</span></h4>
            <p style="color:var(--dim); font-size:0.8rem;">${v.asset}</p>
            <p style="font-size:1.2rem; color:#00ffcc; font-family:monospace; margin:5px 0;">${v.apy} APY</p>
            <p style="color:var(--dim); font-size:0.75rem;">TVL: ${v.tvl}</p>
            <p style="color:var(--dim); font-size:0.75rem; margin:5px 0;">${v.desc}</p>
            <a href="${v.link}" target="_blank" class="swap-btn" style="display:inline-block; margin-top:8px; font-size:0.7rem; padding:4px 8px;">View →</a>`;
        grid.appendChild(el);
    });
}

// ============ LOAD MINING ============
function loadMining() {
    const grid = $("mining-grid");
    if (!grid) return;
    grid.innerHTML = "";
    MINING_DATA.forEach(p => {
        const el = document.createElement("div");
        el.className = "card small mining-card";
        el.innerHTML = `
            <h4>${p.name} <span class="badge ${p.status === 'online' ? 'tiny' : 'empty'}">${p.status.toUpperCase()}</span></h4>
            <p style="color:var(--dim); font-size:0.8rem;">Fee: ${p.fee} | Coin: ${p.coin}</p>
            <p class="mono" style="margin-top:8px;">${p.stratum}</p>
            <p style="color:var(--dim); font-size:0.75rem; margin-top:5px;">${p.notes}</p>`;
        grid.appendChild(el);
    });
}

// ============ GLOBAL SAFETY ============
async function runGlobalSafety() {
    try {
        const res = await fetch("tokens.json");
        const tokens = await res.json();
        let safe = 0, warnings = 0, totalLiq = 0;

        for (const t of tokens) {
            try {
                const sr = await fetchWithTimeout(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${t.address}`, {}, 4000);
                const sj = await sr.json();
                const r = sj.result?.[t.address.toLowerCase()];
                if (r) {
                    const isHoneypot = r.is_honeypot === "1" || r.cannot_sell_all === "1";
                    const sellTax = parseFloat(r.sell_tax || "0") * 100;
                    if (!isHoneypot && sellTax <= 10) safe++;
                    if (r.is_open_source === "0" || r.is_mintable === "1") warnings++;
                }
            } catch(e) {}
            try {
                const dr = await fetchWithTimeout(`${DEX_API}${t.address}`, {}, 4000);
                const dp = await dr.json();
                if (Array.isArray(dp) && dp.length > 0) {
                    const best = dp.reduce((a, b) => (a.liquidity?.usd > b.liquidity?.usd ? a : b), dp[0]);
                    totalLiq += Number(best.liquidity?.usd || 0);
                }
            } catch(e) {}
        }

        const ce = $("global-contract-status");
        if (ce) {
            if (safe === tokens.length) {
                ce.textContent = warnings > 0 ? `${safe}/${tokens.length} SECURE (WARNINGS)` : `${safe}/${tokens.length} SECURE`;
                ce.className = "status-badge " + (warnings > 0 ? "pending" : "verified");
            } else {
                ce.textContent = `RISK: ${tokens.length - safe} FLAGGED`;
                ce.className = "status-badge danger";
            }
        }
        const le = $("global-liquidity-status");
        if (le) {
            if (totalLiq > 10000) { le.textContent = `HEALTHY ($${(totalLiq/1000).toFixed(1)}K)`; le.className = "status-badge verified"; }
            else if (totalLiq > 1000) { le.textContent = `LOW ($${(totalLiq/1000).toFixed(1)}K)`; le.className = "status-badge pending"; }
            else { le.textContent = `CRITICAL (< $1K)`; le.className = "status-badge danger"; }
        }
    } catch(e) { console.error("Safety failed:", e); }
}

// ============ MIKOSHI ============
async function initializeSoulkiller() {
    const btn = $("upload-engram-btn");
    if (!btn) return;
    if (typeof window.ethereum === 'undefined') return alert("Install MetaMask or Coinbase Wallet.");

    btn.textContent = "CONNECTING...";
    btn.style.background = "#ffaa00";

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];

        // Switch to Base
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') {
            btn.textContent = "SWITCHING TO BASE...";
            try {
                await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
            } catch (sw) {
                if (sw.code === 4902) {
                    await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{
                        chainId: '0x2105', chainName: 'Base',
                        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                        rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org']
                    }] });
                } else throw new Error("Please switch to Base manually.");
            }
        }

        btn.textContent = "AWAITING SIGNATURE...";
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const nonce = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const message = `MIKOSHI UPLINK\nDomain: ${window.location.host}\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nSign to extract your engram. Zero gas.`;
        const signature = await signer.signMessage(message);

        const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
        const engramId = `${address.slice(0,6)}...${address.slice(-4)}`;
        const baseMap = { '0':'A','1':'C','2':'G','3':'T','4':'A','5':'C','6':'G','7':'T','8':'A','9':'C','a':'G','b':'T','c':'A','d':'C','e':'G','f':'T' };
        let seq = "";
        const raw = hash.substring(2, 34);
        for (let i = 0; i < raw.length; i++) { seq += baseMap[raw[i].toLowerCase()] || "X"; if (i < raw.length - 1) seq += "-"; }
        const prob = (99.00 + (parseInt(hash.substring(2,6),16) / 65535) * 0.99).toFixed(2);

        $("engram-id").textContent = engramId;
        $("longevity-seq").textContent = seq;
        $("immortality-prob").textContent = `${prob}%`;
        $("relic-integrity").textContent = "STABLE / ONLINE";
        $("relic-integrity").style.color = "#00ffcc";
        $("mikoshi-status").textContent = "SOULKILLER COMPLETE";
        $("mikoshi-status").style.color = "#00ffcc";

        btn.textContent = "ENGRAM SECURED";
        btn.style.background = "#333";
        btn.style.color = "#00ffcc";
        btn.disabled = true;

        const engramData = { address, engramId, seq, prob, timestamp };
        const checksum = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(engramData))).substring(0, 16);
        localStorage.setItem("mikoshi_engram", JSON.stringify({ data: engramData, checksum }));
        logMemory(`MIKOSHI UPLINK: Engram secured. Immortality at ${prob}%.`, "#ff0055");

    } catch (e) {
        console.error(e);
        btn.textContent = "UPLINK FAILED";
        btn.style.background = "#ff0055";
        if (e.code === 4001) alert("Signature rejected.");
        else alert(e.message || "Failed. Ensure you are on Base network.");
    }
}

function loadMikoshi() {
    const stored = localStorage.getItem("mikoshi_engram");
    if (!stored) return;
    try {
        const { data, checksum } = JSON.parse(stored);
        const computed = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data))).substring(0, 16);
        if (computed !== checksum) { localStorage.removeItem("mikoshi_engram"); return; }
        $("engram-id").textContent = data.engramId;
        $("longevity-seq").textContent = data.seq;
        $("immortality-prob").textContent = `${data.prob}%`;
        $("relic-integrity").textContent = "STABLE / ONLINE";
        $("relic-integrity").style.color = "#00ffcc";
        $("mikoshi-status").textContent = "ENGRAM LOADED";
        $("mikoshi-status").style.color = "#00ffcc";
        const btn = $("upload-engram-btn");
        if (btn) { btn.textContent = "ENGRAM SECURED"; btn.style.background = "#333"; btn.style.color = "#00ffcc"; btn.disabled = true; }
    } catch(e) { localStorage.removeItem("mikoshi_engram"); }
}

// ============ 3D BACKGROUND ============
function startBackground() {
    try {
        const canvas = $("neural-canvas");
        if (!canvas || typeof THREE === "undefined") return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, .1, 1000);
        const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
        renderer.setSize(innerWidth, innerHeight);
        renderer.setPixelRatio(devicePixelRatio);
        camera.position.z = 15;
        const silver = new THREE.LineBasicMaterial({color:0xc0c0c0, transparent:true, opacity:.15});
        const white = new THREE.PointsMaterial({color:0xffffff, size:.15, transparent:true, opacity:.8});
        const hyper = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.BoxGeometry(8,8,8)), silver);
        scene.add(hyper);
        const N = 400;
        const pos = new Float32Array(N*3);
        for (let i=0;i<N*3;i+=3){ pos[i]=(Math.random()-.5)*30; pos[i+1]=(Math.random()-.5)*30; pos[i+2]=(Math.random()-.5)*30; }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute("position", new THREE.BufferAttribute(pos,3));
        const points = new THREE.Points(pGeo, white);
        scene.add(points);
        let t=0;
        (function animate(){
            requestAnimationFrame(animate);
            t += .005;
            hyper.rotation.x += .002; hyper.rotation.y += .003;
            points.rotation.y = t*.1;
            renderer.render(scene, camera);
        })();
        addEventListener("resize", () => { camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
    } catch(e) {}
}

// ============ BOOT ============
window.addEventListener("DOMContentLoaded", () => {
    console.log("=== BOOTING COSMIC SCRIBE ===");
    startBackground();
    startGrowthEngine();
    startEbankEngine();
    loadMikoshi();
    loadVaults();
    loadMining();
    loadTokens();
    loadBaseTVL();
    runGlobalSafety();

    const engramBtn = $("upload-engram-btn");
    if (engramBtn) engramBtn.addEventListener("click", initializeSoulkiller);
});



// --- PROJECT MIKOSHI: IMMORTALITY ENGRAM PROTOCOL ---
async function initializeSoulkiller() {
    const btn = document.getElementById('upload-engram-btn');
    if (!btn) return;

    // FIX: Explicitly check for window.ethereum and alert the user
    if (typeof window.ethereum === 'undefined') {
        return alert("UPLINK FAILED: No Web3 wallet detected.

You are viewing this page in a standard browser. To initialize the Soulkiller, you must open this URL inside the MetaMask app browser or Coinbase Wallet app browser.");
    }
    
    btn.textContent = "CONNECTING WALLET...";
    btn.style.background = "#ffaa00";

    try {
        // Force account connection to wake up MetaMask Mobile
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') {
            btn.textContent = "SWITCHING TO BASE...";
            try {
                await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x2105', chainName: 'Base',
                            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                            rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org']
                        }]
                    });
                } else { throw new Error("Please switch to Base network manually."); }
            }
        }

        btn.textContent = "AWAITING SIGNATURE...";

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const nonce = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const message = `MIKOSHI UPLINK REQUEST
Domain: ${window.location.host}
Address: ${address}
Nonce: ${nonce}
Timestamp: ${timestamp}

Sign this message to extract your digital engram. Zero gas required.`;
        
        const signature = await signer.signMessage(message);
        
        const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
        const engramId = `${address.slice(0,6)}...${address.slice(-4)}`;
        
        const baseMap = { '0':'A','1':'C','2':'G','3':'T','4':'A','5':'C','6':'G','7':'T','8':'A','9':'C','a':'G','b':'T','c':'A','d':'C','e':'G','f':'T' };
        let longevitySeq = "";
        const rawHash = hash.substring(2, 34);
        for (let i = 0; i < rawHash.length; i++) {
            longevitySeq += baseMap[rawHash[i].toLowerCase()] || "X";
            if (i < rawHash.length - 1) longevitySeq += "-";
        }

        const probBase = parseInt(hash.substring(2, 6), 16);
        const immortalityProb = (99.00 + (probBase / 65535) * 0.99).toFixed(2);

        document.getElementById('engram-id').textContent = engramId;
        document.getElementById('longevity-seq').textContent = longevitySeq;
        document.getElementById('immortality-prob').textContent = `${immortalityProb}%`;
        document.getElementById('relic-integrity').textContent = "STABLE / ONLINE";
        document.getElementById('relic-integrity').style.color = "#00ffcc";
        
        const statusEl = document.getElementById('mikoshi-status');
        statusEl.textContent = "SOULKILLER COMPLETE";
        statusEl.style.color = "#00ffcc";

        btn.textContent = "ENGRAM SECURED";
        btn.style.background = "#333";
        btn.style.color = "#00ffcc";
        btn.disabled = true;

        const engramData = { address, engramId, longevitySeq, immortalityProb, timestamp };
        const checksum = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(engramData))).substring(0, 16);
        localStorage.setItem("mikoshi_engram", JSON.stringify({ data: engramData, checksum: checksum }));

        if (typeof logMemory === 'function') logMemory(`MIKOSHI UPLINK: Engram secured. Immortality at ${immortalityProb}%.`, "#ff0055");

    } catch (e) {
        console.error(e);
        btn.textContent = "UPLINK FAILED";
        btn.style.background = "#ff0055";
        if (e.code === 4001) alert("UPLINK ABORTED: Signature rejected.");
        else alert(e.message || "Failed to extract engram. Ensure you are on the Base network.");
    }
}

function loadMikoshiEngram() {
    const storedString = localStorage.getItem("mikoshi_engram");
    if (!storedString) return;
    try {
        const stored = JSON.parse(storedString);
        const data = stored.data;
        const checksum = stored.checksum;
        
        const computedChecksum = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data))).substring(0, 16);
        if (computedChecksum !== checksum) {
            console.warn("SECURITY ALERT: Engram tampering detected. Wiping Mikoshi data.");
            localStorage.removeItem("mikoshi_engram");
            return;
        }

        document.getElementById('engram-id').textContent = data.engramId;
        document.getElementById('longevity-seq').textContent = data.longevitySeq;
        document.getElementById('immortality-prob').textContent = `${data.immortalityProb}%`;
        document.getElementById('relic-integrity').textContent = "STABLE / ONLINE";
        document.getElementById('relic-integrity').style.color = "#00ffcc";
        
        const statusEl = document.getElementById('mikoshi-status');
        statusEl.textContent = "ENGRAM LOADED";
        statusEl.style.color = "#00ffcc";

        const btn = document.getElementById('upload-engram-btn');
        if(btn) { btn.textContent = "ENGRAM SECURED"; btn.style.background = "#333"; btn.style.color = "#00ffcc"; btn.disabled = true; }

    } catch (e) {
        localStorage.removeItem("mikoshi_engram");
    }
}


// --- GLOBAL SAFETY MODULE (Relaxed GoPlus Risk Engine) ---
async function runGlobalSafety() {
    let totalLiquidityUsd = 0;
    let safeTokens = 0;
    let totalTokens = 0;
    let warnings = 0;

    try {
        const res = await fetch("tokens.json");
        const tokens = await res.json();
        totalTokens = tokens.length;

        for (const t of tokens) {
            let isSafe = true;
            let hasWarning = false;

            try {
                const secRes = await fetch(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${t.address}`);
                const secJson = await secRes.json();
                const result = secJson.result?.[t.address.toLowerCase()];

                if (!result) {
                    isSafe = false;
                } else {
                    // ONLY flag as CRITICAL if it's an actual honeypot or extreme tax
                    if (result.is_honeypot === "1" || result.cannot_sell_all === "1") isSafe = false;
                    if (result.owner_change_balance === "1" || result.hidden_owner === "1") isSafe = false;
                    
                    const sellTax = parseFloat(result.sell_tax || "0") * 100;
                    const buyTax = parseFloat(result.buy_tax || "0") * 100;
                    if (sellTax > 10 || buyTax > 10) isSafe = false; 
                    
                    // NON-CRITICAL WARNINGS (Does not flag the token as a risk)
                    if (result.is_open_source === "0") hasWarning = true;
                    if (result.is_mintable === "1") hasWarning = true;
                }
            } catch(e) {
                isSafe = false;
            }

            if (isSafe) safeTokens++;
            if (hasWarning) warnings++;

            // Liquidity Check
            try {
                const dexRes = await fetch(`https://api.dexscreener.com/token-pairs/v1/base/${t.address}`);
                const pairs = await dexRes.json();
                if (Array.isArray(pairs)) {
                    const best = pairs.reduce((a, b) => (a.liquidity?.usd > b.liquidity?.usd ? a : b), { liquidity: { usd: 0 } });
                    totalLiquidityUsd += Number(best.liquidity?.usd || 0);
                }
            } catch(e) {}
        }

        const contractEl = document.getElementById("global-contract-status");
        if (contractEl) {
            if (safeTokens === totalTokens) {
                if (warnings > 0) {
                    contractEl.textContent = `${safeTokens}/${totalTokens} SECURE (WARNINGS)`;
                    contractEl.className = "status-badge pending";
                    contractEl.style.color = "#ffaa00";
                    contractEl.style.borderColor = "#ffaa00";
                } else {
                    contractEl.textContent = `${safeTokens}/${totalTokens} SECURE`;
                    contractEl.className = "status-badge verified";
                    contractEl.style.color = "#00ffcc";
                    contractEl.style.borderColor = "#00ffcc";
                }
            } else {
                contractEl.textContent = `RISK: ${totalTokens - safeTokens} FLAGGED`;
                contractEl.className = "status-badge danger";
                contractEl.style.color = "#ff4444";
                contractEl.style.borderColor = "#ff4444";
            }
        }

        const liqEl = document.getElementById("global-liquidity-status");
        if (liqEl) {
            if (totalLiquidityUsd > 10000) {
                liqEl.textContent = `HEALTHY ($${(totalLiquidityUsd/1000).toFixed(1)}K)`;
                liqEl.className = "status-badge verified";
            } else if (totalLiquidityUsd > 1000) {
                liqEl.textContent = `LOW ($${(totalLiquidityUsd/1000).toFixed(1)}K)`;
                liqEl.className = "status-badge pending";
            } else {
                liqEl.textContent = `CRITICAL (< $1K)`;
                liqEl.className = "status-badge danger";
            }
        }
    } catch (e) {
        console.error("Safety Check failed:", e);
    }
}


// --- ENSURE LISTENERS ARE ATTACHED ---
document.addEventListener("DOMContentLoaded", () => {
    const engramBtn = document.getElementById('upload-engram-btn');
    if (engramBtn) {
        // Remove any existing listeners to prevent duplicates
        const newBtn = engramBtn.cloneNode(true);
        engramBtn.parentNode.replaceChild(newBtn, engramBtn);
        newBtn.addEventListener('click', initializeSoulkiller);
    }

    if (typeof loadMikoshiEngram === 'function') loadMikoshiEngram();
    if (typeof runGlobalSafety === 'function') runGlobalSafety();
});
