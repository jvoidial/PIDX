
const DEX_API = "https://api.dexscreener.com/token-pairs/v1/base/";
const GECKO_API = "https://api.geckoterminal.com/api/v2/networks/base/pools/";
const CACHE_TTL = 30000;
const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000";
const ASSET_ADDRESS = "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c";

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

function renderCard(t) {
    const safeSymbol = DOMPurify.sanitize(t.symbol);
    const safeName = DOMPurify.sanitize(t.name);
    const safeFreq = DOMPurify.sanitize(t.freq);
    const safeAddr = DOMPurify.sanitize(t.address);
    const safePool = DOMPurify.sanitize(t.pool);
    const swapUrl = `https://app.uniswap.org/swap?chain=base&inputCurrency=NATIVE&outputCurrency=${safeAddr}`;
    const geckoUrl = `https://www.geckoterminal.com/base/pools/${safePool}`;
    const dexUrl = `https://dexscreener.com/base/${safePool}`;

    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
        <h3>${safeSymbol} <span class="freq">${safeFreq}</span></h3>
        <p class="name">${safeName}</p>
        <p class="addr">${safeAddr}</p>
        <p class="tvl">Pool TVL: <span id="tvl-${t.id}" class="badge loading">SYNCING...</span></p>
        <p class="security-status" id="sec-${t.id}" style="font-size:0.75rem; color:var(--dim);">🛡️ Security: scanning...</p>
        
        <div class="superchain-tracker" style="margin-top:10px; padding:10px; background:rgba(0,255,204,0.05); border:1px solid rgba(0,255,204,0.2); border-radius:8px;">
            <p style="font-size:0.8rem; color:#00ffcc; font-weight:bold;">🔗 Base Chain TVL</p>
            <p style="font-size:0.7rem; color:var(--dim);" id="base-tvl-${t.id}">Loading...</p>
        </div>
        
        <div class="links" style="margin-top:10px; display:flex; gap:5px; flex-wrap:wrap;">
            <a href="${swapUrl}" target="_blank" class="swap-btn" style="font-size:0.7rem; padding:4px 8px;">🔄 Swap</a>
            <a href="${dexUrl}" target="_blank" style="font-size:0.7rem; padding:4px 8px;">📊 DexChart</a>
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

// --- GO PLUS SECURITY SCAN ---
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
        } else if (sellTax > 10 || buyTax > 10) {
            badge.textContent = `⚠️ High Tax (${buyTax}% / ${sellTax}%)`; badge.style.color = "#ffaa00";
        } else {
            badge.textContent = `✅ Safe (Buy ${buyTax}% / Sell ${sellTax}%)`; badge.style.color = "#00ffcc";
        }
    } catch (e) {}
}
async function scanAllSecurity(tokens) { for (const t of tokens) await scanTokenSecurity(t); }

// --- FETCH BASE CHAIN TVL (Robust) ---
async function fetchBaseTVL() {
    const endpoints = [
        "https://api.llama.fi/v2/chains",
        "https://api.llama.fi/chains"
    ];
    let success = false;
    for (const url of endpoints) {
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const data = await res.json();
            let base = Array.isArray(data) ? data.find(c => c.name === "Base") : data["Base"];
            if (base && base.tvl) {
                const tvlBillions = (base.tvl / 1e9).toFixed(2);
                document.querySelectorAll('[id^="base-tvl-"]').forEach(el => { el.textContent = `$${tvlBillions}B TVL`; });
                success = true; break;
            }
        } catch (e) {}
    }
    if (!success) {
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

// --- GROWTH ENGINE & SIMULATION ---
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
        const earnedThisSecond = ebankPrincipal * perSecondRate;
        ebankYield += earnedThisSecond;
        ebankPrincipal += earnedThisSecond;

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
    
    // Shift Vitruvian states every 15 seconds
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
        
        logMemory(`Veil shifted to ${newPhase}. Stability updated to ${newStability}.`, newPhase === "VEILED" ? "#ff4444" : "#00ffcc");
    }, 15000);

    // Fast tick (1 second)
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
        
        if (Math.floor(time) % 10 === 0) {
            const statusEl = document.getElementById("val-engine");
            if (statusEl) {
                statusEl.textContent = "CALIBRATING..."; statusEl.style.color = "#ffaa00";
                setTimeout(() => { statusEl.textContent = "OPTIMAL"; statusEl.style.color = "var(--white)"; }, 1500);
            }
        }
    }, 1000);
}

// --- RENDER VAULTS & POOLS ---
async function loadVaultsAndPools() {
    try {
        const res = await fetch("vaults_pools.json");
        if (!res.ok) throw new Error("File not found");
        const data = await res.json();
        const grid = document.getElementById("vault-grid");
        if(!grid) return;
        grid.innerHTML = "";
        data.forEach(item => {
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
                <a href="${item.link}" target="_blank" class="swap-btn" style="display:inline-block; margin-top:8px; font-size:0.7rem; padding:4px 8px;">View & Deposit →</a>
            `;
            grid.appendChild(el);
        });
    } catch(e) { 
        const grid = document.getElementById("vault-grid");
        if (grid) grid.innerHTML = '<p style="color:#ff4444;">Failed to load vaults data.</p>';
    }
}

// --- RENDER MINING POOLS ---
async function loadMiningPools() {
    try {
        const res = await fetch("mining_pools.json");
        if (!res.ok) throw new Error("File not found");
        const pools = await res.json();
        const grid = document.getElementById("mining-grid");
        if(!grid) return;
        grid.innerHTML = "";
        pools.forEach(p => {
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
    } catch (e) { 
        const grid = document.getElementById("mining-grid");
        if (grid) grid.innerHTML = '<p style="color:#ff4444;">Failed to load mining data.</p>';
    }
}

// --- BOOT SEQUENCE ---
async function boot() {
    try {
        const res = await fetch("tokens.json");
        const tokens = await res.json();
        const grid = document.getElementById("token-grid");
        if(grid) {
            grid.innerHTML = "";
            tokens.forEach(t => grid.appendChild(renderCard(t)));
            await syncAll(tokens);
            await scanAllSecurity(tokens);
            await fetchBaseTVL();
            setInterval(() => syncAll(tokens), 10000);
        }
    } catch (e) { console.error("Boot error:", e); }
    
    await loadVaultsAndPools();
    await loadMiningPools();
    
    startGrowthEngine();
    startEbankEngine();
    updateWalletSim();
}

document.addEventListener("DOMContentLoaded", boot);

// --- 3D BACKGROUND ---
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
    if (memory.length > 10) memory.shift(); // Keep last 10
    localStorage.setItem("vitruvian_memory", JSON.stringify(memory));
    loadMemory();
}

// --- GROWTH ENGINE ---
function startGrowthEngine() {
    let block = 53318083, time = 0;
    loadMemory(); // Load existing logs on start

    // 1. Shift Vitruvian states every 15 seconds
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
        
        // Write to memory log!
        logMemory(`Veil shifted to ${newPhase}. Stability updated to ${newStability}.`, newPhase === "VEILED" ? "#ff4444" : "#00ffcc");
    }, 15000);

    // 2. Update fast metrics every 1 second
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
        
        if (Math.floor(time) % 10 === 0) {
            const statusEl = document.getElementById("val-engine");
            if (statusEl) {
                statusEl.textContent = "CALIBRATING..."; statusEl.style.color = "#ffaa00";
                setTimeout(() => { statusEl.textContent = "OPTIMAL"; statusEl.style.color = "var(--white)"; }, 1500);
            }
        }
    }, 1000);
}

// --- VISIBILITY FIX (For Mobile) ---
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
        console.log("Page visible again. Resuming timers.");
        // The setIntervals will automatically resume, but we force a memory refresh
        loadMemory(); 
    }
});
