
const DEX_API = "https://api.dexscreener.com/token-pairs/v1/base/";
const GECKO_API = "https://api.geckoterminal.com/api/v2/networks/base/pools/";
const CACHE_TTL = 30000;

// FIX: Hardcoded data to prevent CORS failures on JSON fetch
const VAULTS_DATA = [
    {"name": "Morpho USDC Vault", "type": "Vault", "asset": "USDC", "apy": "7.89%", "tvl": "$366K", "desc": "High utilization lending pool.", "link": "https://app.morpho.org/base"},
    {"name": "Euler V2 USDC", "type": "Vault", "asset": "USDC", "apy": "6.85%", "tvl": "$584K", "desc": "ERC-4626 compliant vault.", "link": "https://app.euler.finance/"},
    {"name": "Beefy Auto-Compounder", "type": "Vault", "asset": "Multiple", "apy": "Variable", "tvl": "High", "desc": "Auto-compounds LP rewards.", "link": "https://app.beefy.com/"},
    {"name": "Alien Base USDC-CBBTC", "type": "LP Pool", "asset": "USDC/CBBTC", "apy": "21.50%", "tvl": "$1.47M", "desc": "Concentrated V3 pool. IL risk.", "link": "https://app.alienbase.xyz/"},
    {"name": "Uniswap V3 WETH-USDC", "type": "LP Pool", "asset": "WETH/USDC", "apy": "65%", "tvl": "$125M", "desc": "Highest organic yield.", "link": "https://app.uniswap.org/pools"}
];

const MINING_DATA = [
    {"name": "SoloFury", "fee": "1%", "coin": "SHA-256", "stratum": "stratum+tcp://btc.solofury.com:7070", "status": "online", "notes": "Multi-coin solo mining."},
    {"name": "Ocean", "fee": "2% (1% DATUM)", "coin": "BTC", "stratum": "stratum+tcp://ocean.xyz:3334", "status": "online", "notes": "Non-custodial, no KYC."},
    {"name": "Braiins Pool", "fee": "0% (Braiins OS)", "coin": "BTC", "stratum": "stratum+tcp://stratum.braiins.com:3333", "status": "online", "notes": "Stratum V2 native support."},
    {"name": "BASED Mining", "fee": "0%", "coin": "BTC (Solo)", "stratum": "stratum+tcp://pool.basedmining.xyz:3333", "status": "online", "notes": "On-chain solo mining via Base."},
    {"name": "MineBean", "fee": "Dynamic", "coin": "ETH / BEAN", "stratum": "N/A - Grid Mining", "status": "online", "notes": "Gamified mining on Base."}
];

// --- CACHING & API ---
function getCached(key) {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const { value, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return value;
}
function setCache(key, value) { localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() })); }

async function fetchPoolData(token) {
    const cacheKey = `tvl_${token.id}`;
    const cached = getCached(cacheKey);
    if (cached !== null) return { tvl: cached, source: "cache" };
    try {
        const res = await fetch(`${GECKO_API}${token.pool}`);
        if (res.ok) {
            const json = await res.json();
            const tvl = Number(json.data?.attributes?.reserve_in_usd || 0);
            setCache(cacheKey, tvl); return { tvl, source: "gecko" };
        }
    } catch (e) {}
    try {
        const res = await fetch(`${DEX_API}${token.address}`);
        if (res.ok) {
            const pairs = await res.json();
            if (Array.isArray(pairs) && pairs.length > 0) {
                const best = pairs.reduce((a, b) => (a.liquidity?.usd > b.liquidity?.usd ? a : b), pairs[0]);
                const tvl = Number(best.liquidity?.usd || 0);
                setCache(cacheKey, tvl); return { tvl, source: "dexscreener" };
            }
        }
        setCache(cacheKey, 0); return { tvl: 0, source: "fallback" };
    } catch (e) { return { tvl: 0, source: "error" }; }
}

// --- RENDER TOKEN CARDS ---
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
        
        <!-- FIX: Added Chart Container with fixed height -->
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

async function syncAll(tokens) {
    for (const t of tokens) {
        const data = await fetchPoolData(t);
        const span = document.getElementById(`tvl-${t.id}`);
        if (!span) continue;
        if (data.source === "error") { span.className = "badge empty"; span.textContent = "API ERROR"; }
        else if (data.tvl >= 1) { span.className = "badge tiny"; span.textContent = `$${data.tvl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`; }
        else { span.className = "badge empty"; span.textContent = "LOW LIQUIDITY"; }
    }
}

// --- FIX: NATIVE CHART RENDERER (Uses CORS proxy) ---
async function renderChart(token) {
    const container = document.getElementById(`chart-${token.id}`);
    if (!container) return;

    try {
        const targetUrl = `https://api.geckoterminal.com/api/v2/networks/base/pools/${token.pool}/ohlcv/minute?aggregate=15&limit=100`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        
        const res = await fetch(proxyUrl);
        const json = await res.json();
        const ohlcv = json.data?.attributes?.ohlcv_list;

        if (!ohlcv || ohlcv.length === 0) {
            container.innerHTML = '<p style="color:var(--dim); text-align:center; padding-top:100px; font-size:0.75rem;">No chart data available.</p>';
            return;
        }

        // Clean data
        const uniqueData = {};
        ohlcv.forEach(c => { uniqueData[Math.floor(c[0])] = c; });
        const sortedOhlcv = Object.values(uniqueData).sort((a, b) => a[0] - b[0]);

        container.innerHTML = "";

        const chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: 250,
            layout: { background: { color: 'transparent' }, textColor: '#71767b' },
            grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
            timeScale: { borderColor: 'rgba(255,255,255,0.1)' },
            rightPriceScale: { borderColor: 'rgba(255,255,255,0.1)' },
        });

        const candleSeries = chart.addCandlestickSeries({
            upColor: '#00ffcc', downColor: '#ff4444',
            borderDownColor: '#ff4444', borderUpColor: '#00ffcc',
            wickDownColor: '#ff4444', wickUpColor: '#00ffcc',
        });

        const candleData = sortedOhlcv.map(c => ({
            time: Math.floor(c[0]),
            open: parseFloat(c[1]), high: parseFloat(c[2]),
            low: parseFloat(c[3]), close: parseFloat(c[4]),
        })).filter(d => d.open > 0);
        
        candleSeries.setData(candleData);

        new ResizeObserver(entries => {
            if (entries.length === 0 || !entries[0].contentRect) return;
            chart.applyOptions({ width: entries[0].contentRect.width });
        }).observe(container);

    } catch (e) {
        container.innerHTML = '<p style="color:#ff4444; text-align:center; padding-top:100px; font-size:0.75rem;">Chart failed to load.</p>';
    }
}

// --- GO PLUS SECURITY ---
async function scanTokenSecurity(token) {
    try {
        const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${token.address}`;
        const res = await fetch(url);
        const json = await res.json();
        const result = json.result?.[token.address.toLowerCase()];
        const badge = document.getElementById(`sec-${token.id}`);
        if (!badge) return;
        if (!result) { badge.textContent = "🛡️ Security: No data"; return; }
        const isHoneypot = result.is_honeypot === "1";
        const buyTax = parseFloat(result.buy_tax || "0") * 100;
        const sellTax = parseFloat(result.sell_tax || "0") * 100;
        if (isHoneypot || result.cannot_sell_all === "1") {
            badge.textContent = "🚨 HONEYPOT"; badge.style.color = "#ff4444";
        } else {
            badge.textContent = `✅ Safe (Buy ${buyTax}% / Sell ${sellTax}%)`; badge.style.color = "#00ffcc";
        }
    } catch (e) {}
}

// --- BASE TVL ---
async function fetchBaseTVL() {
    try {
        const res = await fetch("https://api.llama.fi/v2/chains");
        const data = await res.json();
        const base = data.find(c => c.name === "Base");
        if (base && base.tvl) {
            const tvlBillions = (base.tvl / 1e9).toFixed(2);
            document.querySelectorAll('[id^="base-tvl-"]').forEach(el => { el.textContent = `$${tvlBillions}B TVL`; });
        }
    } catch (e) {
        // Fail silently, leave as loading or unavailable
        document.querySelectorAll('[id^="base-tvl-"]').forEach(el => { el.textContent = "Unavailable"; });
    }
}

// --- VITRUVIAN MEMORY ---
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

// --- ENGINE SIMULATIONS ---
let ebankPrincipal = 1000.00;
let ebankYield = 0.00000000;
let currentAPY = 0.1842;
const SECONDS_IN_YEAR = 31536000;

function updateWalletSim() {
    const addr = document.getElementById("wallet-sim")?.value;
    if (addr && addr.length >= 10) {
        let hash = 0;
        for (let i = 0; i < addr.length; i++) hash = addr.charCodeAt(i) + ((hash << 5) - hash);
        ebankPrincipal = Math.abs(hash % 5000) + 500;
        ebankYield = 0;
        logMemory(`Simulation linked to ${addr.slice(0,6)}...${addr.slice(-4)}`, "#00ffcc");
    }
}

function startEbankEngine() {
    setInterval(() => {
        const coherence = parseFloat(document.getElementById("val-coherence")?.textContent) || 0.9356;
        currentAPY = 0.15 + (coherence * 0.05);
        const apyEl = document.getElementById("ebank-apy");
        if (apyEl) apyEl.textContent = `${(currentAPY * 100).toFixed(2)}%`;

        const perSecondRate = Math.pow(1 + currentAPY, 1 / SECONDS_IN_YEAR) - 1;
        const earned = ebankPrincipal * perSecondRate;
        ebankYield += earned;
        ebankPrincipal += earned;

        const pEl = document.getElementById("ebank-principal");
        const yEl = document.getElementById("ebank-yield");
        if (pEl) pEl.textContent = `${ebankPrincipal.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})} PIDX`;
        if (yEl) yEl.textContent = `+ ${ebankYield.toLocaleString(undefined, {minimumFractionDigits: 8, maximumFractionDigits: 8})} PIDX`;

        const immunity = (99.8 - (1 - coherence) * 10).toFixed(2);
        const immEl = document.getElementById("immunity-score");
        if (immEl) immEl.textContent = `${immunity}%`;
    }, 1000);
}

function startGrowthEngine() {
    let block = 53318083, time = 0;
    loadMemory();
    setInterval(() => {
        const phases = ["OPEN", "CLOSING", "VEILED"];
        const bands = ["LOW", "MID", "HIGH"];
        const newPhase = phases[Math.floor(Math.random() * phases.length)];
        const newBand = bands[Math.floor(Math.random() * bands.length)];
        const newStability = (1.1 + Math.random() * 0.1).toFixed(3);
        
        const vEl = document.getElementById("v-veil");
        if (vEl) {
            vEl.textContent = newPhase;
            vEl.style.color = newPhase === "OPEN" ? "#00ffcc" : (newPhase === "VEILED" ? "#ff4444" : "#ffaa00");
        }
        const sEl = document.getElementById("v-stability");
        if (sEl) sEl.textContent = newStability;
        
        const eBandEl = document.getElementById("val-energy");
        if (eBandEl) eBandEl.textContent = `${newBand} (${(40 + Math.random() * 10).toFixed(1)} GW)`;
        
        logMemory(`Veil shifted to ${newPhase}.`, newPhase === "VEILED" ? "#ff4444" : "#00ffcc");
    }, 15000);

    setInterval(() => {
        time += 0.1; block++;
        const bEl = document.getElementById("live-block");
        if (bEl) bEl.textContent = block.toLocaleString();
        const cEl = document.getElementById("val-continuity");
        if (cEl) cEl.textContent = (0.999 + Math.sin(time) * 0.001).toFixed(4);
        const cohEl = document.getElementById("val-coherence");
        if (cohEl) cohEl.textContent = (0.9356 + Math.sin(time * 0.8) * 0.002).toFixed(4);
        const pEl = document.getElementById("val-persistence");
        if (pEl) pEl.textContent = `${379 + Math.floor(time/10)} blocks`;
        const vxEl = document.getElementById("val-voxels");
        if (vxEl) vxEl.textContent = 7 + Math.round(Math.sin(time * 0.5));
    }, 1000);
}

// --- LOAD GRIDS ---
async function loadVaultsAndPools() {
    const grid = document.getElementById("vault-grid");
    if(!grid) return;
    grid.innerHTML = "";
    VAULTS_DATA.forEach(item => {
        const el = document.createElement("div");
        el.className = "card small vault-card";
        const badgeClass = item.type === 'Vault' ? 'tiny' : 'empty';
        const badgeColor = item.type === 'Vault' ? '#00ffcc' : '#ffaa00';
        el.innerHTML = `
            <h4>${item.name} <span class="badge ${badgeClass}" style="border-color:${badgeColor}; color:${badgeColor};">${item.type}</span></h4>
            <p style="color:var(--dim); font-size:0.8rem;">${item.asset}</p>
            <p style="font-size:1.2rem; color:#00ffcc; font-family:monospace; margin:5px 0;">${item.apy} APY</p>
            <p style="color:var(--dim); font-size:0.75rem;">TVL: ${item.tvl}</p>
            <p style="color:var(--dim); font-size:0.75rem; margin:5px 0;">${item.desc}</p>
            <a href="${item.link}" target="_blank" class="swap-btn" style="display:inline-block; margin-top:8px; font-size:0.7rem; padding:4px 8px;">View →</a>
        `;
        grid.appendChild(el);
    });
}

async function loadMiningPools() {
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

// --- BOOT SEQUENCE ---
async function boot() {
    // 1. Load Tokens (Wrapped in try/catch so it doesn't stop the rest)
    try {
        const res = await fetch("tokens.json");
        const tokens = await res.json();
        const grid = document.getElementById("token-grid");
        if(grid) {
            grid.innerHTML = "";
            tokens.forEach(t => grid.appendChild(renderCard(t)));
            await syncAll(tokens);
            for (const t of tokens) await scanTokenSecurity(t);
            for (const t of tokens) await renderChart(t);
            setInterval(() => syncAll(tokens), 10000);
        }
    } catch (e) { console.error("Tokens failed:", e); }

    // 2. Base TVL (Independent)
    try { await fetchBaseTVL(); } catch(e) { console.error("TVL failed:", e); }

    // 3. Grids (Independent)
    try { await loadVaultsAndPools(); } catch(e) { console.error("Vaults failed:", e); }
    try { await loadMiningPools(); } catch(e) { console.error("Mining failed:", e); }

    // 4. Simulations (Always run)
    startGrowthEngine();
    startEbankEngine();
    updateWalletSim();
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
        renderer.setPixelRatio(devicePixelRatio);
        camera.position.z = 15;
        const silver = new THREE.LineBasicMaterial({color:0xc0c0c0, transparent:true, opacity:.15});
        const white = new THREE.PointsMaterial({color:0xffffff, size:.15, transparent:true, opacity:.8});
        const hyper = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.BoxGeometry(8,8,8)), silver);
        scene.add(hyper);
        const core = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.BoxGeometry(4,4,4)), new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:.3}));
        scene.add(core);
        const N = 400;
        const pos = new Float32Array(N*3);
        for (let i=0;i<N*3;i+=3){ pos[i]=(Math.random()-.5)*30; pos[i+1]=(Math.random()-.5)*30; pos[i+2]=(Math.random()-.5)*30; }
        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute("position", new THREE.BufferAttribute(pos,3));
        const points = new THREE.Points(pGeo, white);
        scene.add(points);
        const lines = [];
        for (let i=0;i<N;i++) for (let j=i+1;j<N;j++){
            const dx=pos[i*3]-pos[j*3], dy=pos[i*3+1]-pos[j*3+1], dz=pos[i*3+2]-pos[j*3+2];
            if (Math.sqrt(dx*dx+dy*dy+dz*dz) < 5) lines.push(pos[i*3],pos[i*3+1],pos[i*3+2],pos[j*3],pos[j*3+1],pos[j*3+2]);
        }
        const lGeo = new THREE.BufferGeometry();
        lGeo.setAttribute("position", new THREE.Float32BufferAttribute(lines,3));
        const net = new THREE.LineSegments(lGeo, silver);
        scene.add(net);
        let t=0;
        (function animate(){
            requestAnimationFrame(animate);
            t += .005;
            hyper.rotation.x += .002; hyper.rotation.y += .003;
            core.rotation.x -= .004; core.rotation.y -= .001;
            points.rotation.y = net.rotation.y = t*.1;
            const s = 1 + Math.sin(t*2)*.05;
            hyper.scale.set(s,s,s); points.scale.set(s,s,s);
            renderer.render(scene, camera);
        })();
        addEventListener("resize", () => { camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
    } catch(e) {}
}
startBackground();
