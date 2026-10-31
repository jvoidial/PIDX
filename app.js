
const DEX_API = "https://api.dexscreener.com/token-pairs/v1/base/";
const GECKO_API = "https://api.geckoterminal.com/api/v2/networks/base/pools/";
const CACHE_TTL = 30000;

// *** IMPORTANT: REPLACE THIS WITH YOUR DEPLOYED VAULT ADDRESS ONCE YOU DEPLOY IT ***
const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"; 
const PIDX_ADDRESS = "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c";

// Caching, API fetching, renderCards are unchanged
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

// --- REAL WEB3 INTEGRATION ---
let provider, signer, userAddress;

async function connectAndDeposit() {
    if (typeof window.ethereum === 'undefined') {
        return alert("Please install MetaMask or Coinbase Wallet.");
    }

    const amountInput = document.getElementById("real-deposit-amount").value;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) return alert("Enter a valid amount.");

    if (VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
        return alert("Vault not deployed yet. Please deploy the SpiritVault.sol contract and update VAULT_ADDRESS in app.js.");
    }

    try {
        // 1. Connect
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];
        document.getElementById("network-status").innerHTML = `● CONNECTED: ${userAddress.slice(0,6)}...${userAddress.slice(-4)}`;
        document.getElementById("network-status").style.color = "#00ffcc";

        // 2. Switch Network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        
        const btn = document.getElementById("real-deposit-btn");
        btn.textContent = "Approving...";

        // 3. Approve PIDX
        const tokenContract = new ethers.Contract(PIDX_ADDRESS, ["function approve(address spender, uint256 amount) public returns (bool)"], signer);
        const amountInWei = ethers.parseUnits(amount.toString(), 18);
        const approveTx = await tokenContract.approve(VAULT_ADDRESS, amountInWei);
        await approveTx.wait();

        btn.textContent = "Depositing...";

        // 4. Deposit into Vault
        const vaultContract = new ethers.Contract(VAULT_ADDRESS, ["function deposit(uint256 assets, address receiver) public returns (uint256)"], signer);
        const depositTx = await vaultContract.deposit(amountInWei, userAddress);
        await depositTx.wait();

        btn.textContent = "Success!";
        btn.style.background = "#00ffcc";
        btn.style.color = "#000";
        setTimeout(() => {
            btn.textContent = "Connect Wallet to Deposit";
            btn.style.background = "";
            btn.style.color = "";
        }, 3000);

    } catch (error) {
        console.error("Transaction failed:", error);
        alert(`Transaction failed: ${error.reason || error.message}`);
    }
}

// --- SIMULATION ENGINE ---
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
    setInterval(() => {
        time += 0.1; block++;
        document.getElementById("live-block").textContent = block.toLocaleString();
        document.getElementById("val-continuity").textContent = (0.999 + Math.sin(time) * 0.001).toFixed(4);
        document.getElementById("val-coherence").textContent = (0.9356 + Math.sin(time * 0.8) * 0.002).toFixed(4);
        document.getElementById("val-persistence").textContent = `${379 + Math.floor(time/10)} blocks`;
        document.getElementById("val-voxels").textContent = 7 + Math.round(Math.sin(time * 0.5));
        document.getElementById("val-energy").textContent = `MID (${(42.8 + Math.sin(time * 1.2) * 2.5).toFixed(1)} GW)`;
    }, 1000);
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
    } catch (e) {
        document.getElementById("token-grid").innerHTML = '<p class="loading">FAILED TO LOAD tokens.json</p>';
    }
    startGrowthEngine();
    startEbankEngine();
    updateWalletSim();
    document.getElementById("real-deposit-btn").addEventListener("click", connectAndDeposit);
}

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
    } catch(e) { console.warn("3D Background failed to load:", e); }
}

document.addEventListener("DOMContentLoaded", () => {
    startBackground();
    boot();
});
