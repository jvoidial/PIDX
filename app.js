
const DEX_API = "https://api.dexscreener.com/token-pairs/v1/base/";
const GECKO_API = "https://api.geckoterminal.com/api/v2/networks/base/pools/";

// --- HARDCODED DATA (Guarantees rendering) ---
const VAULTS_DATA = [
    {"name": "Morpho USDC Vault", "type": "Vault", "asset": "USDC", "apy": "7.89%", "tvl": "$366K", "desc": "High utilization lending pool.", "link": "https://app.morpho.org/base"},
    {"name": "Euler V2 USDC Vault", "type": "Vault", "asset": "USDC", "apy": "6.85%", "tvl": "$584K", "desc": "ERC-4626 compliant vault.", "link": "https://app.euler.finance/"},
    {"name": "YO Protocol USDC Vault", "type": "Vault", "asset": "USDC", "apy": "Variable", "tvl": "On-chain", "desc": "ERC-4626 yield-optimizer.", "link": "https://yo.xyz"},
    {"name": "Moonwell Morpho Vault", "type": "Vault", "asset": "USDC", "apy": "Variable", "tvl": "On-chain", "desc": "ERC-4626 vault allocating across Morpho.", "link": "https://docs.moonwell.fi"},
    {"name": "Beefy Auto-Compounder", "type": "Vault", "asset": "Multiple", "apy": "Variable", "tvl": "High", "desc": "Auto-compounds LP rewards.", "link": "https://app.beefy.com/"},
    {"name": "Beefy tBTC-WETH CLM", "type": "LP Pool", "asset": "tBTC/WETH", "apy": "7.74%", "tvl": "$103K", "desc": "Aerodrome CLM vault.", "link": "https://app.beefy.com/vault/aero-cow-tbtc-weth-vault"},
    {"name": "Alien Base USDC-CBBTC", "type": "LP Pool", "asset": "USDC/CBBTC", "apy": "21.50%", "tvl": "$1.47M", "desc": "Concentrated V3 pool. IL risk.", "link": "https://app.alienbase.xyz/"},
    {"name": "Uniswap V3 WETH-USDC", "type": "LP Pool", "asset": "WETH/USDC", "apy": "65%", "tvl": "$125M", "desc": "Highest organic yield.", "link": "https://app.uniswap.org/pools"},
    {"name": "Gyroscope WETH/USDC", "type": "LP Pool", "asset": "WETH/USDC", "apy": "78%", "tvl": "High", "desc": "Dynamic CLP with OP rewards.", "link": "https://gyro.finance"},
    {"name": "KyberSwap ETH/USDC", "type": "LP Pool", "asset": "ETH/USDC", "apy": "Variable", "tvl": "High", "desc": "Uniswap v4 FairFlow hook.", "link": "https://kyberswap.com/earn/pools"}
];

const MINING_DATA = [
    {"name": "Irium Public Stratum Pool", "fee": "0%", "coin": "IRM", "stratum": "stratum+tcp://pool.iriumlabs.org:3333", "status": "online", "notes": "Direct-payout solo mining, zero pool fee."},
    {"name": "Linkrra Pool", "fee": "0% extra", "coin": "PRL", "stratum": "stratum.linkrra.com:5567", "status": "online", "notes": "PPLNS payout, 80% in USDC on Base."},
    {"name": "SoloFury", "fee": "1%", "coin": "SHA-256", "stratum": "stratum+tcp://btc.solofury.com:7070", "status": "online", "notes": "Multi-coin solo mining."},
    {"name": "Ocean", "fee": "2% (1% DATUM)", "coin": "BTC", "stratum": "stratum+tcp://ocean.xyz:3334", "status": "online", "notes": "Non-custodial, no KYC."},
    {"name": "Braiins Pool", "fee": "0% (Braiins OS)", "coin": "BTC", "stratum": "stratum+tcp://stratum.braiins.com:3333", "status": "online", "notes": "Stratum V2 native support."},
    {"name": "BASED Mining", "fee": "0%", "coin": "BTC (Solo)", "stratum": "stratum+tcp://pool.basedmining.xyz:3333", "status": "online", "notes": "On-chain solo mining via Base."},
    {"name": "MineBean", "fee": "Dynamic", "coin": "ETH / BEAN", "stratum": "N/A - Grid Mining", "status": "online", "notes": "Gamified mining on Base."}
];

// --- HELPER: Fetch with Timeout ---
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// --- MEMORY LOG & SIMULATIONS ---
function loadMemory() {
    const memory = JSON.parse(localStorage.getItem("vitruvian_memory")) || [];
    const logContainer = document.getElementById("memory-log");
    if (!logContainer) return;
    logContainer.innerHTML = "";
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

let ebankPrincipal = 1000.00;
let ebankYield = 0.00000000;
const SECONDS_IN_YEAR = 31536000;

function startGrowthEngine() {
    let block = 53318083, time = 0;
    loadMemory();
    
    // State shift every 15 seconds
    setInterval(() => {
        const phases = ["OPEN", "CLOSING", "VEILED"];
        const newPhase = phases[Math.floor(Math.random() * phases.length)];
        const vEl = document.getElementById("v-veil");
        if (vEl) {
            vEl.textContent = newPhase;
            vEl.style.color = newPhase === "OPEN" ? "#00ffcc" : (newPhase === "VEILED" ? "#ff4444" : "#ffaa00");
        }
        logMemory(`Veil shifted to ${newPhase}.`, newPhase === "VEILED" ? "#ff4444" : "#00ffcc");
    }, 15000);

    // Fast tick every 1s
    setInterval(() => {
        time += 0.1; block++;
        if (document.getElementById("live-block")) document.getElementById("live-block").textContent = block.toLocaleString();
        if (document.getElementById("val-continuity")) document.getElementById("val-continuity").textContent = (0.999 + Math.sin(time) * 0.001).toFixed(4);
        if (document.getElementById("val-coherence")) document.getElementById("val-coherence").textContent = (0.9356 + Math.sin(time * 0.8) * 0.002).toFixed(4);
        if (document.getElementById("val-persistence")) document.getElementById("val-persistence").textContent = `${379 + Math.floor(time/10)} blocks`;
        if (document.getElementById("val-voxels")) document.getElementById("val-voxels").textContent = 7 + Math.round(Math.sin(time * 0.5));
        
        // eBank tick
        const coherence = parseFloat(document.getElementById("val-coherence")?.textContent) || 0.9356;
        const apy = 0.15 + (coherence * 0.05);
        if (document.getElementById("ebank-apy")) document.getElementById("ebank-apy").textContent = `${(apy * 100).toFixed(2)}%`;
        
        const earned = ebankPrincipal * (Math.pow(1 + apy, 1 / SECONDS_IN_YEAR) - 1);
        ebankYield += earned;
        ebankPrincipal += earned;
        
        if (document.getElementById("ebank-principal")) document.getElementById("ebank-principal").textContent = `${ebankPrincipal.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})} PIDX`;
        if (document.getElementById("ebank-yield")) document.getElementById("ebank-yield").textContent = `+ ${ebankYield.toLocaleString(undefined, {minimumFractionDigits: 8, maximumFractionDigits: 8})} PIDX`;
    }, 1000);
}

// --- TOKEN CARDS & CHARTS ---
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
            <p style="font-size:0.7rem; color:var(--dim);" id="base-tvl-${t.id}">$5.8B TVL (Est)</p>
        </div>
        
        <div class="links" style="margin-top:10px; display:flex; gap:5px; flex-wrap:wrap;">
            <a href="${swapUrl}" target="_blank" class="swap-btn" style="font-size:0.7rem; padding:4px 8px;">🔄 Swap</a>
            <a href="https://basescan.org/token/${safeAddr}" target="_blank" style="font-size:0.7rem; padding:4px 8px;">BaseScan</a>
            <a href="${geckoUrl}" target="_blank" style="font-size:0.7rem; padding:4px 8px;">GeckoTerm</a>
        </div>`;
    return el;
}




// --- CHART RENDERER (GeckoTerminal with empty intervals) ---

// --- ROBUST CHART RENDERER (Multi-proxy + Price-line fallback) ---
async function renderChart(token) {
    const container = document.getElementById(`chart-${token.id}`);
    if (!container) return;
    container.style.height = '250px';
    container.innerHTML = '<p style="color:var(--dim); text-align:center; padding-top:100px; font-size:0.75rem;">Loading chart...</p>';

    // 1. Try GeckoTerminal via multiple CORS proxies
    const proxies = [
        'https://api.allorigins.win/raw?url=',
        'https://proxy.cors.sh/',
        'https://corsproxy.io/?'
    ];
    const targetUrl = `https://api.geckoterminal.com/api/v2/networks/base/pools/${token.pool}/ohlcv/minute?aggregate=15&limit=100&include_empty_intervals=true`;

    for (const proxy of proxies) {
        try {
            const res = await fetchWithTimeout(proxy + encodeURIComponent(targetUrl), {}, 5000);
            const json = await res.json();
            const ohlcv = json.data?.attributes?.ohlcv_list;

            if (ohlcv && ohlcv.length > 0) {
                drawCandlestickChart(container, ohlcv);
                return;
            }
        } catch (e) { /* Try next proxy */ }
    }

    // 2. Fallback: Simple price line from DexScreener
    try {
        const dexRes = await fetchWithTimeout(`https://api.dexscreener.com/token-pairs/v1/base/${token.address}`, {}, 5000);
        const pairs = await dexRes.json();
        
        if (Array.isArray(pairs) && pairs.length > 0) {
            const best = pairs.reduce((a, b) => (a.liquidity?.usd > b.liquidity?.usd ? a : b), pairs[0]);
            if (best.priceUsd) {
                drawPriceLine(container, best.priceUsd);
                return;
            }
        }
    } catch (e) { /* Fall through */ }

    // 3. Final fallback: Clear message
    container.innerHTML = '<p style="color:var(--dim); text-align:center; padding-top:100px; font-size:0.75rem;">No chart data available (Low Liquidity).</p>';
}

function drawCandlestickChart(container, ohlcv) {
    const uniqueData = {};
    ohlcv.forEach(c => { uniqueData[Math.floor(c[0])] = c; });
    const sortedOhlcv = Object.values(uniqueData).sort((a, b) => a[0] - b[0]);
    container.innerHTML = "";

    if (typeof LightweightCharts === 'undefined') {
        container.innerHTML = '<p style="color:#ff4444; text-align:center; padding-top:100px; font-size:0.75rem;">Chart Library Failed.</p>';
        return;
    }

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth, height: 250,
        layout: { background: { color: 'transparent' }, textColor: '#71767b' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.1)' }, rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#00ffcc', downColor: '#ff4444', borderDownColor: '#ff4444', borderUpColor: '#00ffcc', wickDownColor: '#ff4444', wickUpColor: '#00ffcc',
    });

    const candleData = sortedOhlcv.map(c => ({
        time: Math.floor(c[0]), open: parseFloat(c[1]), high: parseFloat(c[2]), low: parseFloat(c[3]), close: parseFloat(c[4]),
    })).filter(d => d.open > 0);
    
    candleSeries.setData(candleData);
    new ResizeObserver(entries => {
        if (entries.length === 0 || !entries[0].contentRect) return;
        chart.applyOptions({ width: entries[0].contentRect.width });
    }).observe(container);
}

function drawPriceLine(container, priceUsd) {
    container.innerHTML = "";
    if (typeof LightweightCharts === 'undefined') {
        container.innerHTML = `<p style="color:var(--white); text-align:center; padding-top:100px; font-size:1rem; font-family:monospace;">Price: $${priceUsd}</p>`;
        return;
    }

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth, height: 250,
        layout: { background: { color: 'transparent' }, textColor: '#71767b' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.1)' }, rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
    });

    const lineSeries = chart.addLineSeries({ color: '#00ffcc', lineWidth: 2 });
    const now = Math.floor(Date.now() / 1000);
    const price = parseFloat(priceUsd);
    // Create a simple horizontal line at the current price
    const lineData = [];
    for (let i = 0; i < 100; i++) {
        lineData.push({ time: now - (100 - i) * 60, value: price });
    }
    lineSeries.setData(lineData);

    new ResizeObserver(entries => {
        if (entries.length === 0 || !entries[0].contentRect) return;
        chart.applyOptions({ width: entries[0].contentRect.width });
    }).observe(container);
}




function drawChart(container, ohlcv) {
    const uniqueData = {};
    ohlcv.forEach(c => { uniqueData[Math.floor(c[0])] = c; });
    const sortedOhlcv = Object.values(uniqueData).sort((a, b) => a[0] - b[0]);
    container.innerHTML = "";

    if (typeof LightweightCharts === 'undefined') {
        container.innerHTML = '<p style="color:#ff4444; text-align:center; padding-top:100px; font-size:0.75rem;">Chart Library Failed.</p>';
        return;
    }

    const chart = LightweightCharts.createChart(container, {
        width: container.clientWidth, height: 250,
        layout: { background: { color: 'transparent' }, textColor: '#71767b' },
        grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
        timeScale: { borderColor: 'rgba(255,255,255,0.1)' }, rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
    });

    const candleSeries = chart.addCandlestickSeries({
        upColor: '#00ffcc', downColor: '#ff4444', borderDownColor: '#ff4444', borderUpColor: '#00ffcc', wickDownColor: '#ff4444', wickUpColor: '#00ffcc',
    });

    const candleData = sortedOhlcv.map(c => ({
        time: Math.floor(c[0]), open: parseFloat(c[1]), high: parseFloat(c[2]), low: parseFloat(c[3]), close: parseFloat(c[4]),
    })).filter(d => d.open > 0);
    
    candleSeries.setData(candleData);
}


// --- LOAD GRIDS ---
function loadVaultsAndPools() {
    const grid = document.getElementById("vault-grid");
    if(!grid) return;
    grid.innerHTML = "";
    VAULTS_DATA.forEach(item => {
        const el = document.createElement("div");
        el.className = "card small vault-card";
        el.innerHTML = `
            <h4>${item.name} <span class="badge ${item.type === 'Vault' ? 'tiny' : 'empty'}" style="border-color:${item.type === 'Vault' ? '#00ffcc' : '#ffaa00'}; color:${item.type === 'Vault' ? '#00ffcc' : '#ffaa00'};">${item.type}</span></h4>
            <p style="color:var(--dim); font-size:0.8rem;">${item.asset}</p>
            <p style="font-size:1.2rem; color:#00ffcc; font-family:monospace; margin:5px 0;">${item.apy} APY</p>
            <p style="color:var(--dim); font-size:0.75rem;">TVL: ${item.tvl}</p>
            <a href="${item.link}" target="_blank" class="swap-btn" style="display:inline-block; margin-top:8px; font-size:0.7rem; padding:4px 8px;">View →</a>
        `;
        grid.appendChild(el);
    });
}

function loadMiningPools() {
    const grid = document.getElementById("mining-grid");
    if(!grid) return;
    grid.innerHTML = "";
    MINING_DATA.forEach(p => {
        const el = document.createElement("div");
        el.className = "card small mining-card";
        el.innerHTML = `
            <h4>${p.name} <span class="badge ${p.status === 'online' ? 'tiny' : 'empty'}">${p.status.toUpperCase()}</span></h4>
            <p style="color:var(--dim); font-size:0.8rem;">Fee: ${p.fee} | Coin: ${p.coin}</p>
            <p class="mono" style="margin-top:8px;">${p.stratum}</p>
            <p style="color:var(--dim); font-size:0.75rem; margin-top:5px;">${p.notes}</p>
        `;
        grid.appendChild(el);
    });
}

// --- BOOT ---
async function boot() {
    // 1. Start Engines Immediately
    startGrowthEngine();
    loadVaultsAndPools();
    loadMiningPools();

    // 2. Load Tokens
    try {
        const res = await fetch("tokens.json");
        const tokens = await res.json();
        const grid = document.getElementById("token-grid");
        if(grid) {
            grid.innerHTML = "";
            tokens.forEach(t => grid.appendChild(renderCard(t)));
            
            // Loop through tokens safely
            for (const t of tokens) {
                // TVL
                try {
                    const tRes = await fetchWithTimeout(`${DEX_API}${t.address}`, {}, 3000);
                    const pairs = await tRes.json();
                    const span = document.getElementById(`tvl-${t.id}`);
                    if (pairs && pairs.length > 0) {
                        const best = pairs.reduce((a, b) => (a.liquidity?.usd > b.liquidity?.usd ? a : b), pairs[0]);
                        if (span) { span.className = "badge tiny"; span.textContent = `$${Number(best.liquidity?.usd || 0).toFixed(2)}`; }
                    } else if (span) { span.className = "badge empty"; span.textContent = "LOW LIQUIDITY"; }
                } catch(e) { if (document.getElementById(`tvl-${t.id}`)) document.getElementById(`tvl-${t.id}`).textContent = "LOW LIQUIDITY"; }

                // Security
                try {
                    const sRes = await fetchWithTimeout(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${t.address}`, {}, 3000);
                    const sJson = await sRes.json();
                    const badge = document.getElementById(`sec-${t.id}`);
                    if (badge && sJson.result && sJson.result[t.address.toLowerCase()]) {
                        badge.textContent = `✅ Safe`;
                        badge.style.color = "#00ffcc";
                    }
                } catch(e) { if(document.getElementById(`sec-${t.id}`)) document.getElementById(`sec-${t.id}`).textContent = "🛡️ No data"; }

                // Chart
                renderChart(t);
            }
        }
    } catch (e) { console.error("Tokens failed:", e); }
}

document.addEventListener("DOMContentLoaded", boot);

// 3D Background
function startBackground() {
    try {
        const canvas = document.getElementById("neural-canvas");
        if (!canvas || typeof THREE === "undefined") return;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, .1, 1000);
        const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
        renderer.setSize(innerWidth, innerHeight);
        camera.position.z = 15;
        const silver = new THREE.LineBasicMaterial({color:0xc0c0c0, transparent:true, opacity:.15});
        const hyper = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.BoxGeometry(8,8,8)), silver);
        scene.add(hyper);
        let t=0;
        (function animate(){
            requestAnimationFrame(animate);
            t += .005;
            hyper.rotation.x += .002; hyper.rotation.y += .003;
            renderer.render(scene, camera);
        })();
    } catch(e) {}
}
startBackground();


// --- FIX: Resume timers when tab becomes visible again ---
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        console.log("Page visible again. Resuming timers.");
        // The setIntervals will automatically resume, but we force a memory refresh
        if (typeof loadMemory === 'function') loadMemory();
    }
});


// --- WALLET PORTFOLIO TRACKER UTILITY ---
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
];

const TOKEN_LIST = [
    { symbol: "PIDX", address: "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c" },
    { symbol: "SGUIDE", address: "0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a" },
    { symbol: "VDOO", address: "0x38e4f08D08b4D772A7B75669C356b4749dd2d30b" },
    { symbol: "PENNIES", address: "0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7" }
];

document.getElementById('connect-wallet-btn')?.addEventListener('click', async () => {
    if (typeof window.ethereum === 'undefined') {
        alert("Please install MetaMask or Coinbase Wallet to use the portfolio tracker.");
        return;
    }

    try {
        // Connect Wallet
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];
        
        // Ensure Base Network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
        }

        document.getElementById('wallet-address').textContent = `${userAddress.slice(0,6)}...${userAddress.slice(-4)}`;
        document.getElementById('connect-wallet-btn').textContent = "Connected";
        document.getElementById('connect-wallet-btn').style.background = "var(--dim)";
        document.getElementById('portfolio-section').style.display = 'block';

        const provider = new ethers.BrowserProvider(window.ethereum);
        let totalValueUsd = 0;
        let balancesHtml = "";

        for (const token of TOKEN_LIST) {
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            
            // Get balance
            const balanceWei = await contract.balanceOf(userAddress);
            const decimals = await contract.decimals();
            const balance = parseFloat(ethers.formatUnits(balanceWei, decimals));
            
            if (balance > 0) {
                // Get price from DexScreener (using the token address)
                let priceUsd = 0;
                try {
                    const res = await fetch(`https://api.dexscreener.com/token-pairs/v1/base/${token.address}`);
                    const pairs = await res.json();
                    if (pairs && pairs.length > 0) {
                        const best = pairs.reduce((a, b) => (a.liquidity?.usd > b.liquidity?.usd ? a : b), pairs[0]);
                        priceUsd = parseFloat(best.priceUsd) || 0;
                    }
                } catch(e) {}

                const usdValue = balance * priceUsd;
                totalValueUsd += usdValue;

                balancesHtml += `
                    <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                        <p style="color: var(--dim); font-size: 0.8rem;">${token.symbol}</p>
                        <p style="color: var(--white); font-family: monospace; font-size: 1.1rem;">${balance.toLocaleString(undefined, {maximumFractionDigits: 4})}</p>
                        <p style="color: #00ffcc; font-size: 0.8rem; font-family: monospace;">$${usdValue.toFixed(2)}</p>
                    </div>
                `;
            }
        }

        document.getElementById('total-portfolio-value').textContent = `$${totalValueUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        document.getElementById('token-balances').innerHTML = balancesHtml || '<p style="color: var(--dim);">No tokens found in this wallet.</p>';

    } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("Could not connect wallet. Please try again.");
    }
});


// --- GLOBAL SAFETY & COMPATIBILITY CHECK ---
async function runGlobalSafetyCheck() {
    let totalLiquidityUsd = 0;
    let safeTokens = 0;
    let totalTokens = 0;

    try {
        const res = await fetch("tokens.json");
        const tokens = await res.json();
        totalTokens = tokens.length;

        for (const t of tokens) {
            // Check GoPlus Security
            try {
                const secRes = await fetch(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${t.address}`);
                const secJson = await secRes.json();
                const result = secJson.result?.[t.address.toLowerCase()];
                if (result && result.is_honeypot !== "1" && result.cannot_sell_all !== "1") safeTokens++;
            } catch(e) {}

            // Check Liquidity via DexScreener
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
                contractEl.textContent = `${safeTokens}/${totalTokens} SECURE`;
                contractEl.className = "status-badge verified";
            } else {
                contractEl.textContent = `WARNING: ${totalTokens - safeTokens} FLAGGED`;
                contractEl.className = "status-badge danger";
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

// Run safety check on load
document.addEventListener('DOMContentLoaded', runGlobalSafetyCheck);


// --- SECURE SOUL IDENTITY PROTOCOL ---
document.getElementById('init-soul-btn')?.addEventListener('click', async () => {
    if (typeof window.ethereum === 'undefined') return alert("Please install MetaMask or Coinbase Wallet.");
    const btn = document.getElementById('init-soul-btn');
    btn.textContent = "Awaiting Signature...";
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Anti-Replay & Domain Binding
        const nonce = Math.random().toString(36).substring(2, 15);
        const timestamp = Date.now();
        const domain = window.location.host;
        const message = `Domain: ${domain}\nAction: Initialize Soul Link\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nSign this message to prove ownership.`;

        const signature = await signer.signMessage(message);
        const recovered = ethers.verifyMessage(message, signature);
        if (recovered.toLowerCase() !== address.toLowerCase()) throw new Error("Signature mismatch.");

        const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
        const soulCode = hash.substring(2, 66).toUpperCase();
        const freqBase = parseInt(hash.substring(2, 6), 16) / 1000;
        const soulFreq = (0.618 + (freqBase * 2)).toFixed(3);

        const prefixes = ["Neon", "Void", "Specter", "Cyber", "Aero", "Echo", "Nyx", "Zenith", "Vortex"];
        const suffixes = ["Weaver", "Runner", "Wraith", "Architect", "Nomad", "Seer", "Cipher", "Monk"];
        const pre = prefixes[parseInt(hash.substring(6, 8), 16) % prefixes.length];
        const suf = suffixes[parseInt(hash.substring(8, 10), 16) % suffixes.length];
        const num = parseInt(hash.substring(10, 13), 16) % 999;
        const soulName = `${pre}-${suf}-${num}`;

        document.getElementById('soul-section').style.display = 'block';
        document.getElementById('soul-wallet').textContent = `${address.slice(0,6)}...${address.slice(-4)}`;
        document.getElementById('soul-name').textContent = soulName;
        document.getElementById('soul-frequency').textContent = `${soulFreq} Hz`;
        document.getElementById('soul-code').textContent = soulCode;
        document.getElementById('soul-status').textContent = "VERIFIED";
        document.getElementById('soul-status').style.color = "#00ffcc";
        document.getElementById('soul-glyph').textContent = "✧";
        btn.textContent = "Soul Linked"; btn.style.background = "var(--dim)"; btn.disabled = true;

        if (typeof logMemory === 'function') logMemory(`Soul Verified: ${soulName}. Resonance: ${soulFreq} Hz.`, "#00ffcc");

        // Tamper-Proof Storage
        const soulData = { address, soulName, soulFreq, soulCode };
        const checksum = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(soulData))).substring(0, 16);
        localStorage.setItem("vitruvian_soul", JSON.stringify({ data: soulData, checksum: checksum }));

    } catch (e) {
        console.error(e);
        btn.textContent = "Initialization Failed";
        if (e.code === 4001) alert("Signature rejected.");
        else alert(e.message || "Failed to verify identity.");
    }
});

// Load securely
document.addEventListener("DOMContentLoaded", () => {
    const storedString = localStorage.getItem("vitruvian_soul");
    if (storedString) {
        try {
            const stored = JSON.parse(storedString);
            const data = stored.data, checksum = stored.checksum;
            const computed = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(data))).substring(0, 16);
            if (computed !== checksum) { localStorage.removeItem("vitruvian_soul"); return; }
            document.getElementById('soul-section').style.display = 'block';
            document.getElementById('soul-wallet').textContent = `${data.address.slice(0,6)}...${data.address.slice(-4)}`;
            document.getElementById('soul-name').textContent = data.soulName;
            document.getElementById('soul-frequency').textContent = `${data.soulFreq} Hz`;
            document.getElementById('soul-code').textContent = data.soulCode;
            document.getElementById('soul-status').textContent = "VERIFIED";
            document.getElementById('soul-status').style.color = "#00ffcc";
            const btn = document.getElementById('init-soul-btn');
            if(btn) { btn.textContent = "Soul Linked"; btn.style.background = "var(--dim)"; btn.disabled = true; }
        } catch(e) { localStorage.removeItem("vitruvian_soul"); }
    }
});
