
const DEX_API = "https://api.dexscreener.com/token-pairs/v1/base/";
const GECKO_API = "https://api.geckoterminal.com/api/v2/networks/base/pools/";
const CACHE_TTL = 30000;

// *** REPLACE WITH AN EXISTING VAULT ADDRESS FOR REAL DEPOSITS ***
const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"; 
const ASSET_ADDRESS = "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c"; // PIDX

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

    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
        <h3>${safeSymbol} <span class="freq">${safeFreq}</span></h3>
        <p class="name">${safeName}</p>
        <p class="addr">${safeAddr}</p>
        <p class="tvl">Pool TVL: <span id="tvl-${t.id}" class="badge loading">SYNCING...</span></p>
        <div class="links">
            <a href="${swapUrl}" target="_blank" rel="noopener noreferrer" class="swap-btn">🔄 Swap</a>
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
        if (data.source === "error") { span.className = "badge empty"; span.textContent = "API ERROR"; }
        else if (data.tvl >= 1) { span.className = "badge tiny"; span.textContent = `$${data.tvl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`; }
        else { span.className = "badge empty"; span.textContent = "LOW LIQUIDITY"; }
    }
}

// --- VITRUVIAN MEMORY SYSTEM ---
function loadMemory() {
    const memory = JSON.parse(localStorage.getItem("vitruvian_memory")) || [];
    const logContainer = document.getElementById("memory-log");
    logContainer.innerHTML = ""; // Clear
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

// --- SIMULATION & DYNAMIC STATES ---
let ebankPrincipal = 1000.00;
let ebankYield = 0.00000000;
let currentAPY = 0.1842;
const SECONDS_IN_YEAR = 31536000;

function updateWalletSim() {
    const addr = document.getElementById("wallet-sim").value;
    if (addr.length >= 10) {
        let hash = 0;
        for (let i = 0; i < addr.length; i++) hash = addr.charCodeAt(i) + ((hash << 5) - hash);
        ebankPrincipal = Math.abs(hash % 5000) + 500;
        ebankYield = 0;
        logMemory(`Simulation linked to ${addr.slice(0,6)}...${addr.slice(-4)}`, "#00ffcc");
    }
}

function startEbankEngine() {
    setInterval(() => {
        const coherence = parseFloat(document.getElementById("val-coherence").textContent) || 0.9356;
        currentAPY = 0.15 + (coherence * 0.05);
        document.getElementById("ebank-apy").textContent = `${(currentAPY * 100).toFixed(2)}%`;

        const perSecondRate = Math.pow(1 + currentAPY, 1 / SECONDS_IN_YEAR) - 1;
        const earnedThisSecond = ebankPrincipal * perSecondRate;
        ebankYield += earnedThisSecond;
        ebankPrincipal += earnedThisSecond;

        document.getElementById("ebank-principal").textContent = `${ebankPrincipal.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})} PIDX`;
        document.getElementById("ebank-yield").textContent = `+ ${ebankYield.toLocaleString(undefined, {minimumFractionDigits: 8, maximumFractionDigits: 8})} PIDX`;

        const immunity = (99.8 - (1 - coherence) * 10).toFixed(2);
        document.getElementById("immunity-score").textContent = `${immunity}%`;
    }, 1000); 
}

function startGrowthEngine() {
    let block = 53318083, time = 0;
    
    // Load initial memory
    loadMemory();
    
    // Automatically shift Vitruvian states every 15 seconds
    setInterval(() => {
        const phases = ["OPEN", "CLOSING", "VEILED"];
        const bands = ["LOW", "MID", "HIGH"];
        const newPhase = phases[Math.floor(Math.random() * phases.length)];
        const newBand = bands[Math.floor(Math.random() * bands.length)];
        const newStability = (1.1 + Math.random() * 0.1).toFixed(3);
        
        document.getElementById("v-veil").textContent = newPhase;
        document.getElementById("v-veil").style.color = newPhase === "OPEN" ? "#00ffcc" : (newPhase === "VEILED" ? "#ff4444" : "#ffaa00");
        document.getElementById("v-stability").textContent = newStability;
        
        const eBandEl = document.getElementById("val-energy");
        eBandEl.textContent = `${newBand} (${(40 + Math.random() * 10).toFixed(1)} GW)`;
        
        logMemory(`Veil shifted to ${newPhase}. Stability updated to ${newStability}.`, newPhase === "VEILED" ? "#ff4444" : "#00ffcc");
    }, 15000);

    setInterval(() => {
        time += 0.1; block++;
        document.getElementById("live-block").textContent = block.toLocaleString();
        document.getElementById("val-continuity").textContent = (0.999 + Math.sin(time) * 0.001).toFixed(4);
        document.getElementById("val-coherence").textContent = (0.9356 + Math.sin(time * 0.8) * 0.002).toFixed(4);
        document.getElementById("val-persistence").textContent = `${379 + Math.floor(time/10)} blocks`;
        document.getElementById("val-voxels").textContent = 7 + Math.round(Math.sin(time * 0.5));
        
        if (Math.floor(time) % 10 === 0) {
            const statusEl = document.getElementById("val-engine");
            statusEl.textContent = "CALIBRATING..."; statusEl.style.color = "#ffaa00";
            setTimeout(() => { statusEl.textContent = "OPTIMAL"; statusEl.style.color = "var(--white)"; }, 1500);
        }
    }, 1000);
}

// --- REAL WEB3 CONNECTION ---
async function connectAndDeposit() {
    if (typeof window.ethereum === 'undefined') return alert("Please install a Web3 wallet.");
    if (VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") return alert("Vault not configured yet.");

    const amount = parseFloat(document.getElementById("real-deposit-amount").value);
    if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount.");

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        document.getElementById("network-status").innerHTML = `● CONNECTED: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}`;
        document.getElementById("network-status").style.color = "#00ffcc";

        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const btn = document.getElementById("real-deposit-btn");
        
        btn.textContent = "Approving...";
        const tokenContract = new ethers.Contract(ASSET_ADDRESS, ["function approve(address spender, uint256 amount) public returns (bool)"], signer);
        const approveTx = await tokenContract.approve(VAULT_ADDRESS, ethers.parseUnits(amount.toString(), 18));
        await approveTx.wait();

        btn.textContent = "Depositing...";
        const vaultContract = new ethers.Contract(VAULT_ADDRESS, ["function deposit(uint256 assets, address receiver) public returns (uint256)"], signer);
        const depositTx = await vaultContract.deposit(ethers.parseUnits(amount.toString(), 18), accounts[0]);
        await depositTx.wait();

        btn.textContent = "Success!";
        logMemory(`Real deposit of ${amount} PIDX successful!`, "#00ffcc");
        setTimeout(() => { btn.textContent = "Connect Wallet to Deposit"; }, 3000);
    } catch (error) {
        console.error(error);
        logMemory(`Deposit failed: ${error.reason || "User rejected"}`, "#ff4444");
        alert("Transaction failed. Check memory log.");
    }
}

async function boot() {
    try {
        const res = await fetch("tokens.json");
        const tokens = await res.json();
        const grid = document.getElementById("token-grid");
        grid.innerHTML = "";
        tokens.forEach(t => grid.appendChild(renderCard(t)));
        await syncAll(tokens);
        setInterval(() => syncAll(tokens), 10000); 
    } catch (e) {}
    startGrowthEngine();
    startEbankEngine();
    updateWalletSim();
    document.getElementById("real-deposit-btn").addEventListener("click", connectAndDeposit);
}

document.addEventListener("DOMContentLoaded", () => {
    startBackground();
    boot();
});

// 3D Background (Unchanged)
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


// --- MINING POOLS ---
async function loadMiningPools() {
    try {
        const res = await fetch("mining_pools.json");
        const pools = await res.json();
        const grid = document.getElementById("mining-grid");
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
        console.error("Failed to load mining pools:", e);
    }
}

async function testStratumConnection() {
    const url = document.getElementById("stratum-test-url").value.trim();
    const resultEl = document.getElementById("stratum-test-result");
    if (!url.startsWith("stratum+tcp://")) {
        resultEl.textContent = "❌ Please enter a valid stratum+tcp:// URL.";
        resultEl.style.color = "#ff4444";
        return;
    }
    resultEl.textContent = "🔄 Testing connection...";
    resultEl.style.color = "var(--dim)";
    // Note: Browser TCP connection testing is limited. We can only show a timeout/error.
    // For a real test, a backend proxy or WebSocket bridge would be needed.
    setTimeout(() => {
        resultEl.textContent = "⚠️ Browser-based TCP testing is limited. Use a desktop miner to test the connection.";
        resultEl.style.color = "#ffaa00";
    }, 2000);
}
