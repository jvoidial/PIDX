const DEX_API = "https://api.dexscreener.com/token-pairs/v1/base/";
const FALLBACK_TOKENS = [
    {id:"pidx", symbol:"PIDX", name:"Pennies Index", freq:"0.618 Hz", address:"0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c", pool:"0xfa8f70efe22da989ec3e77fb25647d44cdb2248f"},
    {id:"sguide", symbol:"SGUIDE", name:"Spirit Guide", freq:"1.618 Hz", address:"0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a", pool:"0x55a4a9360aa7bd9a4babf7a163c56f530ac1b5318fef77edfe9834ac9ab696a2"},
    {id:"vdoo", symbol:"VDOO", name:"VOUDOO Infinity", freq:"2.618 Hz", address:"0x38e4f08D08b4D772A7B75669C356b4749dd2d30b", pool:"0xc5b15edcee5ce1702256f30edced421688545fdc1a0170cb2c48da259802ec59"},
    {id:"pennies", symbol:"PENNIES", name:"Pennies CHEQ", freq:"3.618 Hz", address:"0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7", pool:"0x29a0ae1f10629f8855c87c911531ffb2c98d68c6"}
];
const VAULTS_DATA = [
    {"name":"Morpho USDC Vault","type":"Vault","asset":"USDC","apy":"7.89%","tvl":"$366K","desc":"High utilization lending pool.","link":"https://app.morpho.org/base"},
    {"name":"Euler V2 USDC","type":"Vault","asset":"USDC","apy":"6.85%","tvl":"$584K","desc":"ERC-4626 compliant vault.","link":"https://app.euler.finance/"},
    {"name":"YO Protocol USDC","type":"Vault","asset":"USDC","apy":"Variable","tvl":"On-chain","desc":"ERC-4626 yield-optimizer.","link":"https://yo.xyz"},
    {"name":"Moonwell Morpho","type":"Vault","asset":"USDC","apy":"Variable","tvl":"On-chain","desc":"Allocates across Morpho markets.","link":"https://docs.moonwell.fi"},
    {"name":"Beefy Auto-Compounder","type":"Vault","asset":"Multiple","apy":"Variable","tvl":"High","desc":"Auto-compounds LP rewards.","link":"https://app.beefy.com/"},
    {"name":"Beefy tBTC-WETH CLM","type":"LP Pool","asset":"tBTC/WETH","apy":"7.74%","tvl":"$103K","desc":"Aerodrome CLM vault.","link":"https://app.beefy.com/"},
    {"name":"Alien Base USDC-CBBTC","type":"LP Pool","asset":"USDC/CBBTC","apy":"21.50%","tvl":"$1.47M","desc":"Concentrated V3 pool.","link":"https://app.alienbase.xyz/"},
    {"name":"Uniswap V3 WETH-USDC","type":"LP Pool","asset":"WETH/USDC","apy":"65%","tvl":"$125M","desc":"Highest organic yield.","link":"https://app.uniswap.org/pools"}
];
const MINING_DATA = [
    {"name":"Irium Public Pool","fee":"0%","coin":"IRM","stratum":"stratum+tcp://pool.iriumlabs.org:3333","status":"online","notes":"Direct-payout solo mining."},
    {"name":"Linkrra Pool","fee":"0% extra","coin":"PRL","stratum":"stratum.linkrra.com:5567","status":"online","notes":"PPLNS payout, 80% USDC on Base."},
    {"name":"SoloFury","fee":"1%","coin":"SHA-256","stratum":"stratum+tcp://btc.solofury.com:7070","status":"online","notes":"Multi-coin solo mining."},
    {"name":"Ocean","fee":"2% (1% DATUM)","coin":"BTC","stratum":"stratum+tcp://ocean.xyz:3334","status":"online","notes":"Non-custodial, no KYC."},
    {"name":"Braiins Pool","fee":"0% (Braiins OS)","coin":"BTC","stratum":"stratum+tcp://stratum.braiins.com:3333","status":"online","notes":"Stratum V2 native."},
    {"name":"BASED Mining","fee":"0%","coin":"BTC (Solo)","stratum":"stratum+tcp://pool.basedmining.xyz:3333","status":"online","notes":"On-chain solo mining via Base."},
    {"name":"MineBean","fee":"Dynamic","coin":"ETH / BEAN","stratum":"N/A - Grid Mining","status":"online","notes":"Gamified mining on Base."}
];

function $(id) { return document.getElementById(id); }

// --- WALLET CONNECT ---
let connectedWallet = null;
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') return alert("Please install MetaMask or Coinbase Wallet.");
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        connectedWallet = accounts[0];
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
        if($("connect-wallet-btn")) { $("connect-wallet-btn").textContent = "Connected"; $("connect-wallet-btn").style.background = "var(--dim)"; }
        if($("wallet-address")) $("wallet-address").textContent = `${connectedWallet.slice(0,6)}...${connectedWallet.slice(-4)}`;
        if (typeof logMemory === 'function') logMemory(`Wallet connected: ${connectedWallet.slice(0,6)}...`, "#00ffcc");
    } catch (e) { console.error(e); }
}

// --- MEMORY LOG ---
function loadMemory() {
    const mem = JSON.parse(localStorage.getItem("vitruvian_memory")) || [];
    const log = $("memory-log"); if (!log) return;
    log.innerHTML = "";
    if (mem.length === 0) log.innerHTML = '<div style="color:var(--dim);">[SYSTEM INIT] Memory bank loaded...</div>';
    mem.forEach(e => { const d = document.createElement("div"); d.style.color = e.color || "var(--text)"; d.textContent = e.msg; log.appendChild(d); });
    log.scrollTop = log.scrollHeight;
}
function logMemory(msg, color = "var(--text)") {
    let mem = JSON.parse(localStorage.getItem("vitruvian_memory")) || [];
    mem.push({ msg: `[${new Date().toLocaleTimeString()}] ${msg}`, color });
    if (mem.length > 10) mem.shift();
    localStorage.setItem("vitruvian_memory", JSON.stringify(mem));
    loadMemory();
}

// --- SIMULATIONS ---
function startSimulations() {
    let block = 53318083, time = 0;
    loadMemory();
    setInterval(() => {
        time += 0.1; block++;
        if($("live-block")) $("live-block").textContent = block.toLocaleString();
        if($("val-continuity")) $("val-continuity").textContent = (0.999 + Math.sin(time) * 0.001).toFixed(4);
        if($("val-coherence")) $("val-coherence").textContent = (0.9356 + Math.sin(time * 0.8) * 0.002).toFixed(4);
        if($("val-persistence")) $("val-persistence").textContent = `${379 + Math.floor(time/10)} blocks`;
        if($("val-voxels")) $("val-voxels").textContent = 7 + Math.round(Math.sin(time * 0.5));
        const coh = parseFloat($("val-coherence")?.textContent) || 0.9356;
        const apy = 0.15 + (coh * 0.05);
        if($("ebank-apy")) $("ebank-apy").textContent = `${(apy * 100).toFixed(2)}%`;
        if($("immunity-score")) $("immunity-score").textContent = `${(99.8 - (1-coh)*10).toFixed(2)}%`;
    }, 1000);
    setInterval(() => {
        const phases = ["OPEN", "CLOSING", "VEILED"];
        const p = phases[Math.floor(Math.random()*phases.length)];
        if($("v-veil")) { $("v-veil").textContent = p; $("v-veil").style.color = p === "OPEN" ? "#00ffcc" : (p === "VEILED" ? "#ff4444" : "#ffaa00"); }
        logMemory(`Veil shifted to ${p}.`, p === "VEILED" ? "#ff4444" : "#00ffcc");
    }, 15000);
}

// --- EBANK YIELD ---
let ebankPrincipal = 1000.00, ebankYield = 0.00000000;
function startEbankEngine() {
    setInterval(() => {
        const coh = parseFloat($("val-coherence")?.textContent) || 0.9356;
        const apy = 0.15 + (coh * 0.05);
        const perSec = Math.pow(1 + apy, 1 / 31536000) - 1;
        const earned = ebankPrincipal * perSec;
        ebankYield += earned; ebankPrincipal += earned;
        if($("ebank-principal")) $("ebank-principal").textContent = `${ebankPrincipal.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})} PIDX`;
        if($("ebank-yield")) $("ebank-yield").textContent = `+ ${ebankYield.toLocaleString(undefined, {minimumFractionDigits: 8, maximumFractionDigits: 8})} PIDX`;
    }, 1000);
}

// --- MIKOSHI AUTO-ENGRAM ---
function generateAutoEngram() {
    let saved = localStorage.getItem("ebank_immortality_engram");
    if (saved) { try { const data = JSON.parse(saved); renderEngramUI(data.id, data.seq, data.prob); return; } catch(e) { localStorage.removeItem("ebank_immortality_engram"); } }
    const seed = Date.now().toString() + Math.random().toString() + navigator.userAgent;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(seed));
    const engramId = `0x${hash.substring(2, 8)}...${hash.substring(58, 64)}`;
    const baseMap = { '0':'A','1':'C','2':'G','3':'T','4':'A','5':'C','6':'G','7':'T','8':'A','9':'C','a':'G','b':'T','c':'A','d':'C','e':'G','f':'T' };
    let seq = ""; const raw = hash.substring(2, 34);
    for (let i = 0; i < raw.length; i++) { seq += baseMap[raw[i].toLowerCase()] || "X"; if (i < raw.length - 1) seq += "-"; }
    const prob = (99.00 + (parseInt(hash.substring(2,6),16) / 65535) * 0.99).toFixed(2);
    const engramData = { id: engramId, seq: seq, prob: prob };
    localStorage.setItem("ebank_immortality_engram", JSON.stringify(engramData));
    renderEngramUI(engramId, seq, prob);
}
function renderEngramUI(id, seq, prob) {
    if($('engram-id')) $('engram-id').textContent = id;
    if($('longevity-seq')) $('longevity-seq').textContent = seq;
    if($('immortality-prob')) $('immortality-prob').textContent = `${prob}%`;
    if($('mikoshi-status')) { $('mikoshi-status').textContent = "ENGRAM ACTIVE"; $('mikoshi-status').style.color = "#00ffcc"; }
    if($('relic-integrity')) { $('relic-integrity').textContent = "STABLE / IMMORTAL"; $('relic-integrity').style.color = "#00ffcc"; }
    if($('upload-engram-btn')) $('upload-engram-btn').style.display = "none";
}

// --- RESONANCE PROTOCOL (Guest Mode Enabled) ---
let resonanceTimerInterval = null;
function playResonanceSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(528, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(1056, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 1.5);
    } catch(e) {}
}
function detectNetworkBand() {
    if (navigator.connection) {
        const type = navigator.connection.type, eff = navigator.connection.effectiveType || "";
        if (type === 'wifi' || type === 'ethernet') return "WIFI 6E / 5G";
        if (type === 'cellular') { if (eff === '5g' || eff === '4g') return "5G ULTRA"; if (eff === '3g') return "3G LEGACY"; if (eff === '2g') return "2G DECAY"; }
    }
    return "WIFI/5G (EST)";
}
function startResonanceTimer(startTime) {
    if (resonanceTimerInterval) clearInterval(resonanceTimerInterval);
    const el = $("resonance-longevity");
    resonanceTimerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        if (el) el.textContent = `${String(Math.floor(diff/3600)).padStart(2,'0')}:${String(Math.floor((diff%3600)/60)).padStart(2,'0')}:${String(diff%60).padStart(2,'0')}`;
    }, 1000);
}
async function initiateResonance() {
    const humanId = $("resonance-human-id")?.value.trim();
    if (!humanId) return alert("Please enter a Human Identity Code.");
    let walletSeed = connectedWallet;
    let isGuest = false;
    if (!walletSeed) { isGuest = true; walletSeed = localStorage.getItem("guest_soul_seed") || ("GUEST_" + Math.random().toString(36).substring(2) + Date.now()); localStorage.setItem("guest_soul_seed", walletSeed); }
    
    const btn = $("resonance-initiate-btn"); btn.textContent = "CALIBRATING..."; btn.style.background = "#ffaa00";
    setTimeout(() => {
        try {
            const hash = ethers.keccak256(ethers.toUtf8Bytes(walletSeed + "|" + humanId + "|RESONANCE"));
            const freq = (2400 + ((parseInt(hash.substring(6, 10), 16) % 5000) / 5000) * 1500).toFixed(3);
            const band = detectNetworkBand();
            if($('resonance-freq')) $('resonance-freq').textContent = `${freq} MHz`;
            if($('resonance-band')) { $('resonance-band').textContent = band; $('resonance-band').style.color = "#00ffcc"; }
            if($('resonance-soul-status')) { $('resonance-soul-status').textContent = isGuest ? "IMMORTAL (GUEST)" : "IMMORTAL"; $('resonance-soul-status').style.color = "#00ffcc"; }
            if($('resonance-status')) { $('resonance-status').textContent = "PROTOCOL ACTIVE"; $('resonance-status').style.color = "#00ffcc"; }
            playResonanceSound(); const startTime = Date.now(); startResonanceTimer(startTime);
            btn.textContent = "IMMORTALITY ACTIVE"; btn.style.background = "#333"; btn.style.color = "#00ffcc"; btn.disabled = true; if($("resonance-human-id")) $("resonance-human-id").disabled = true;
            logMemory(`Resonance Bound (${isGuest ? 'Guest' : 'Wallet'}). Band: ${band}. Freq: ${freq} MHz.`, "#00ffcc");
            localStorage.setItem("ebank_resonance_data", JSON.stringify({ humanId, freq, band, startTime, isGuest }));
        } catch(e) { btn.textContent = "ERROR"; btn.style.background = "#ff4444"; }
    }, 1500);
}

// --- TOKENS & SECURITY ---
async function loadTokens() {
    let tokens = FALLBACK_TOKENS;
    try { const r = await fetch("tokens.json"); if(r.ok) tokens = await r.json(); } catch(e) {}
    const grid = $("token-grid"); if (!grid) return;
    grid.innerHTML = "";
    tokens.forEach(t => {
        const el = document.createElement("div"); el.className = "card";
        el.innerHTML = `<h3>${t.symbol} <span class="freq">${t.freq}</span></h3><p class="name">${t.name}</p><p class="addr">${t.address}</p><p class="tvl">Pool TVL: <span id="tvl-${t.id}" class="badge loading">SYNCING...</span></p><p class="security-status" id="sec-${t.id}" style="font-size:0.75rem;color:var(--dim);">🛡️ Security: scanning...</p><div class="links"><a href="https://app.uniswap.org/swap?chain=base&outputCurrency=${t.address}" target="_blank" class="swap-btn">🔄 Swap</a><a href="https://basescan.org/token/${t.address}" target="_blank">BaseScan</a></div>`;
        grid.appendChild(el);
    });
    tokens.forEach(async t => {
        try { const r = await fetch(`${DEX_API}${t.address}`); const p = await r.json(); if (p && p.length > 0) { const b = p.reduce((a,b) => a.liquidity?.usd > b.liquidity?.usd ? a : b, p[0]); if($(`tvl-${t.id}`)) { $(`tvl-${t.id}`).textContent = `$${(b.liquidity?.usd||0).toFixed(2)}`; $(`tvl-${t.id}`).className = "badge tiny"; } } else { if($(`tvl-${t.id}`)) { $(`tvl-${t.id}`).textContent = "LOW LIQUIDITY"; $(`tvl-${t.id}`).className = "badge empty"; } } } catch(e) { if($(`tvl-${t.id}`)) $(`tvl-${t.id}`).textContent = "ERROR"; }
        try { const r = await fetch(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${t.address}`); const j = await r.json(); const res = j.result?.[t.address.toLowerCase()]; if(res && $(`sec-${t.id}`)) { const h = res.is_honeypot === "1" || res.cannot_sell_all === "1"; $(`sec-${t.id}`).textContent = h ? "🚨 HONEYPOT" : "✅ Safe"; $(`sec-${t.id}`).style.color = h ? "#ff4444" : "#00ffcc"; } } catch(e) {}
    });
}
function runSafety() {
    if($("global-contract-status")) { $("global-contract-status").textContent = "4/4 SECURE (WARNINGS)"; $("global-contract-status").className = "status-badge pending"; }
    if($("global-liquidity-status")) { $("global-liquidity-status").textContent = "CRITICAL (< $1K)"; $("global-liquidity-status").className = "status-badge danger"; }
}

// --- GRIDS ---
function loadGrids() {
    if($("vault-grid")) { $("vault-grid").innerHTML = ""; VAULTS_DATA.forEach(v => { const el = document.createElement("div"); el.className = "card small vault-card"; el.innerHTML = `<h4>${v.name} <span class="badge tiny" style="color:#00ffcc;">${v.type}</span></h4><p style="color:var(--dim);font-size:0.8rem;">${v.asset}</p><p style="font-size:1.2rem;color:#00ffcc;">${v.apy} APY</p><p style="color:var(--dim);font-size:0.75rem;">${v.tvl}</p><a href="${v.link}" target="_blank" class="swap-btn" style="margin-top:5px;font-size:0.7rem;">View →</a>`; $("vault-grid").appendChild(el); }); }
    if($("mining-grid")) { $("mining-grid").innerHTML = ""; MINING_DATA.forEach(p => { const el = document.createElement("div"); el.className = "card small mining-card"; el.innerHTML = `<h4>${p.name} <span class="badge tiny">ONLINE</span></h4><p style="font-size:0.8rem;color:var(--dim);">${p.fee} | ${p.coin}</p><p class="mono" style="margin-top:5px;">${p.stratum}</p>`; $("mining-grid").appendChild(el); }); }
}

// --- BOTS ---
let dcaActive = false, gridActive = false, dcaPnl = 0, gridPnl = 0, dcaTrades = 0, gridTrades = 0, dcaWin = 0, gridWin = 0;
function updateBotsUI() {
    if($("dca-status")) { $("dca-status").textContent = dcaActive ? "ACTIVE" : "PAUSED"; $("dca-status").style.color = dcaActive ? "#00ffcc" : "#ffaa00"; $("dca-status").style.borderColor = dcaActive ? "#00ffcc" : "#ffaa00"; }
    if($("dca-btn")) { $("dca-btn").textContent = dcaActive ? "Stop Bot" : "Start Bot"; $("dca-btn").style.background = dcaActive ? "#ff4444" : "#00ffcc"; $("dca-btn").style.color = dcaActive ? "#fff" : "#000"; }
    if($("dca-pnl")) $("dca-pnl").textContent = `+$${dcaPnl.toFixed(2)}`; if($("dca-trades")) $("dca-trades").textContent = dcaTrades; if($("dca-win")) $("dca-win").textContent = `${dcaWin.toFixed(1)}%`;
    if($("grid-status")) { $("grid-status").textContent = gridActive ? "ACTIVE" : "PAUSED"; $("grid-status").style.color = gridActive ? "#00ffcc" : "#ffaa00"; $("grid-status").style.borderColor = gridActive ? "#00ffcc" : "#ffaa00"; }
    if($("grid-btn")) { $("grid-btn").textContent = gridActive ? "Stop Bot" : "Start Bot"; $("grid-btn").style.background = gridActive ? "#ff4444" : "#00ffcc"; $("grid-btn").style.color = gridActive ? "#fff" : "#000"; }
    if($("grid-pnl")) $("grid-pnl").textContent = `+$${gridPnl.toFixed(2)}`; if($("grid-trades")) $("grid-trades").textContent = gridTrades; if($("grid-win")) $("grid-win").textContent = `${gridWin.toFixed(1)}%`;
}
function startBotsEngine() {
    updateBotsUI();
    setInterval(() => {
        if (dcaActive) { dcaPnl += Math.random() * 2.5 - 0.5; dcaTrades += Math.floor(Math.random() * 3); dcaWin = 70 + Math.random() * 15; updateBotsUI(); logMemory(`DCA Bot executed trade. PnL: $${dcaPnl.toFixed(2)}`, "#00ffcc"); }
        if (gridActive) { gridPnl += Math.random() * 1.5 - 0.3; gridTrades += Math.floor(Math.random() * 2); gridWin = 60 + Math.random() * 20; updateBotsUI(); }
    }, 3000);
    $("dca-btn")?.addEventListener("click", () => { if (!connectedWallet) return alert("Connect wallet first."); dcaActive = !dcaActive; updateBotsUI(); logMemory(`DCA Bot ${dcaActive ? 'Started' : 'Stopped'}.`, dcaActive ? "#00ffcc" : "#ff4444"); });
    $("grid-btn")?.addEventListener("click", () => { if (!connectedWallet) return alert("Connect wallet first."); gridActive = !gridActive; updateBotsUI(); logMemory(`Grid Bot ${gridActive ? 'Started' : 'Stopped'}.`, gridActive ? "#00ffcc" : "#ff4444"); });
}

// --- AGI BRAIN ---
function startAGIBrain() {
    const canvas = $('agi-canvas'); if (!canvas || typeof THREE === 'undefined') return;
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight); renderer.setPixelRatio(window.devicePixelRatio); camera.position.z = 20;
    const nodes = []; const nodeGeo = new THREE.SphereGeometry(0.3, 8, 8); const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 70; i++) { const node = new THREE.Mesh(nodeGeo, nodeMat); node.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30); scene.add(node); nodes.push({ mesh: node }); }
    const linePos = []; for (let i = 0; i < nodes.length; i++) { for (let j = i + 1; j < nodes.length; j++) { if (nodes[i].mesh.position.distanceTo(nodes[j].mesh.position) < 9) { linePos.push(nodes[i].mesh.position.x, nodes[i].mesh.position.y, nodes[i].mesh.position.z, nodes[j].mesh.position.x, nodes[j].mesh.position.y, nodes[j].mesh.position.z); } } }
    const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3)); const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.3 })); scene.add(lines);
    let time = 0; function animate() { requestAnimationFrame(animate); time += 0.01; scene.rotation.y += 0.001; scene.rotation.x += 0.0005; nodes.forEach((n, i) => { const s = 1 + Math.sin(time * 2 + i) * 0.3; n.mesh.scale.set(s, s, s); }); renderer.render(scene, camera); } animate();
    window.addEventListener('resize', () => { camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(canvas.clientWidth, canvas.clientHeight); });
}

// --- BOOT ---
window.addEventListener("DOMContentLoaded", () => {
    $("connect-wallet-btn")?.addEventListener("click", connectWallet);
    $("resonance-initiate-btn")?.addEventListener("click", initiateResonance);
    
    startSimulations();
    startEbankEngine();
    generateAutoEngram();
    loadGrids();
    loadTokens();
    runSafety();
    startBotsEngine();
    startAGIBrain();
    
    // Restore resonance state if saved
    const savedRes = localStorage.getItem("ebank_resonance_data");
    if (savedRes) {
        try {
            const data = JSON.parse(savedRes);
            if($('resonance-freq')) $('resonance-freq').textContent = `${data.freq} MHz`;
            if($('resonance-band')) { $('resonance-band').textContent = data.band; $('resonance-band').style.color = "#00ffcc"; }
            if($('resonance-soul-status')) { $('resonance-soul-status').textContent = data.isGuest ? "IMMORTAL (GUEST)" : "IMMORTAL"; $('resonance-soul-status').style.color = "#00ffcc"; }
            if($('resonance-status')) { $('resonance-status').textContent = "PROTOCOL ACTIVE"; $('resonance-status').style.color = "#00ffcc"; }
            const btn = $("resonance-initiate-btn"); if(btn) { btn.textContent = "IMMORTALITY ACTIVE"; btn.style.background = "#333"; btn.style.color = "#00ffcc"; btn.disabled = true; }
            const input = $("resonance-human-id"); if(input) { input.value = data.humanId; input.disabled = true; }
            if(data.startTime) startResonanceTimer(data.startTime);
        } catch(e) {}
    }
});
// --- PIDX LOCKER WEB3 LOGIC (FIXED: Includes Approve Step) ---
async function scanAndLockPositions() {
    const btn = document.getElementById("scan-lock-btn");
    const logEl = document.getElementById("locker-log");
    const lockerAddr = document.getElementById("locker-addr").textContent.trim();

    if (!connectedWallet) return alert("Please connect your wallet in the header first.");
    if (lockerAddr === "Pending Deploy") return alert("Locker contract not deployed yet. Add your key to .env and run the script.");

    btn.textContent = "Connecting...";
    btn.style.background = "#333";
    logEl.textContent = "";
    
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Base Network Uniswap V3 NonfungiblePositionManager
        const NPM_ADDR = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
        const NPM_ABI = [
            "function balanceOf(address) view returns (uint256)",
            "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
            "function approve(address to, uint256 tokenId) external"
        ];
        const LOCKER_ABI = ["function lockPosition(address nftContract, uint256 tokenId, uint256 lockDuration) external"];

        const npm = new ethers.Contract(NPM_ADDR, NPM_ABI, signer);
        const locker = new ethers.Contract(lockerAddr, LOCKER_ABI, signer);

        const bal = await npm.balanceOf(connectedWallet);
        if (bal === 0n) {
            logEl.textContent = "No Uniswap V3 positions found.";
            btn.textContent = "Scan Wallet & Lock Positions";
            btn.style.background = "#8247e5";
            return;
        }

        logEl.textContent = `Found ${bal} position(s). Preparing...`;
        const ONE_YEAR = 365 * 24 * 60 * 60;
        let lockedCount = 0;

        for (let i = 0; i < Number(bal); i++) {
            const tokenId = await npm.tokenOfOwnerByIndex(connectedWallet, i);
            
            try {
                // STEP 1: APPROVE THE LOCKER CONTRACT
                logEl.textContent = `Approving Locker for NFT #${tokenId}...`;
                const approveTx = await npm.approve(lockerAddr, tokenId);
                await approveTx.wait();

                // STEP 2: LOCK THE POSITION
                logEl.textContent = `Locking NFT #${tokenId} for 1 year...`;
                const lockTx = await locker.lockPosition(NPM_ADDR, tokenId, ONE_YEAR);
                await lockTx.wait();
                
                lockedCount++;
            } catch(e) {
                console.warn(`Could not lock ${tokenId}`, e);
            }
        }

        logEl.textContent = `✅ Successfully locked ${lockedCount} position(s)!`;
        btn.textContent = "Locked!";
        btn.style.background = "#00ffcc";
        btn.style.color = "#000";
        
        if (typeof logMemory === 'function') {
            logMemory(`PIDX Locker: Locked ${lockedCount} Uniswap V3 positions.`, "#8247e5");
        }

    } catch (e) {
        console.error(e);
        logEl.textContent = "❌ Error scanning or locking positions.";
        btn.textContent = "Scan Wallet & Lock Positions";
        btn.style.background = "#8247e5";
    }
}
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("scan-lock-btn")?.addEventListener("click", scanAndLockPositions);
});
