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

// --- EBANK YIELD ENGINE ---
let ebankPrincipal = 1000.00;
let ebankYield = 0.00000000;
const SECONDS_IN_YEAR = 31536000;
function startEbankEngine() {
    setInterval(() => {
        const coh = parseFloat($("val-coherence")?.textContent) || 0.9356;
        const apy = 0.15 + (coh * 0.05);
        const perSec = Math.pow(1 + apy, 1 / SECONDS_IN_YEAR) - 1;
        const earned = ebankPrincipal * perSec;
        ebankYield += earned;
        ebankPrincipal += earned;
        if($("ebank-principal")) $("ebank-principal").textContent = `${ebankPrincipal.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})} PIDX`;
        if($("ebank-yield")) $("ebank-yield").textContent = `+ ${ebankYield.toLocaleString(undefined, {minimumFractionDigits: 8, maximumFractionDigits: 8})} PIDX`;
    }, 1000);
}

// --- GO PLUS SECURITY SCANNER (Base Chain 8453) ---
async function scanTokenSecurity(token) {
    const badge = $(`sec-${token.id}`);
    if (!badge) return;
    try {
        const res = await fetch(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${token.address}`);
        const json = await res.json();
        const result = json.result?.[token.address.toLowerCase()];
        if (!result) { badge.textContent = "🛡️ No data"; return; }
        const isHoneypot = result.is_honeypot === "1" || result.cannot_sell_all === "1";
        const buyTax = parseFloat(result.buy_tax || "0") * 100;
        const sellTax = parseFloat(result.sell_tax || "0") * 100;
        if (isHoneypot) { badge.textContent = "🚨 HONEYPOT"; badge.style.color = "#ff4444"; }
        else if (sellTax > 10 || buyTax > 10) { badge.textContent = `⚠️ Tax ${sellTax.toFixed(1)}%`; badge.style.color = "#ffaa00"; }
        else { badge.textContent = "✅ Safe"; badge.style.color = "#00ffcc"; }
    } catch (e) { badge.textContent = "🛡️ Error"; }
}

// --- LOAD TOKENS & TRIGGER SCANS ---
async function loadTokens() {
    let tokens = FALLBACK_TOKENS;
    try { const r = await fetch("tokens.json"); if(r.ok) tokens = await r.json(); } catch(e) {}
    const grid = $("token-grid"); if (!grid) return;
    grid.innerHTML = "";
    tokens.forEach(t => {
        const el = document.createElement("div"); el.className = "card";
        el.innerHTML = `<h3>${t.symbol} <span class="freq">${t.freq}</span></h3><p class="name">${t.name}</p><p class="addr">${t.address}</p><p class="tvl">Pool TVL: <span id="tvl-${t.id}" class="badge loading">SYNCING...</span></p><p class="security-status" id="sec-${t.id}" style="font-size:0.75rem;color:var(--dim);">🛡️ Security: scanning...</p><div class="chart-container" id="chart-${t.id}" style="height:180px;margin-top:10px;border:1px solid var(--border);border-radius:8px;overflow:hidden;"></div><div class="links"><a href="https://app.uniswap.org/swap?chain=base&outputCurrency=${t.address}" target="_blank" class="swap-btn">🔄 Swap</a><a href="https://basescan.org/token/${t.address}" target="_blank">BaseScan</a></div>`;
        grid.appendChild(el);
    });
    tokens.forEach(async t => {
        // TVL
        try { const r = await fetch(`${DEX_API}${t.address}`); const p = await r.json(); if (p && p.length > 0) { const b = p.reduce((a,b) => a.liquidity?.usd > b.liquidity?.usd ? a : b, p[0]); if($(`tvl-${t.id}`)) { $(`tvl-${t.id}`).textContent = `$${(b.liquidity?.usd||0).toFixed(2)}`; $(`tvl-${t.id}`).className = "badge tiny"; } } else { if($(`tvl-${t.id}`)) { $(`tvl-${t.id}`).textContent = "LOW LIQUIDITY"; $(`tvl-${t.id}`).className = "badge empty"; } } } catch(e) { if($(`tvl-${t.id}`)) $(`tvl-${t.id}`).textContent = "ERROR"; }
        // Security
        await scanTokenSecurity(t);
    });
}

// --- GLOBAL SAFETY ---
function runSafety() {
    if($("global-contract-status")) { $("global-contract-status").textContent = "4/4 SECURE (WARNINGS)"; $("global-contract-status").className = "status-badge pending"; }
    if($("global-liquidity-status")) { $("global-liquidity-status").textContent = "CRITICAL (< $1K)"; $("global-liquidity-status").className = "status-badge danger"; }
}

// --- VAULTS & MINING ---
function loadGrids() {
    if($("vault-grid")) { $("vault-grid").innerHTML = ""; VAULTS_DATA.forEach(v => { const el = document.createElement("div"); el.className = "card small vault-card"; el.innerHTML = `<h4>${v.name} <span class="badge tiny" style="color:#00ffcc;">${v.type}</span></h4><p style="color:var(--dim);font-size:0.8rem;">${v.asset}</p><p style="font-size:1.2rem;color:#00ffcc;">${v.apy} APY</p><p style="color:var(--dim);font-size:0.75rem;">${v.tvl}</p><a href="${v.link}" target="_blank" class="swap-btn" style="margin-top:5px;font-size:0.7rem;">View →</a>`; $("vault-grid").appendChild(el); }); }
    if($("mining-grid")) { $("mining-grid").innerHTML = ""; MINING_DATA.forEach(p => { const el = document.createElement("div"); el.className = "card small mining-card"; el.innerHTML = `<h4>${p.name} <span class="badge tiny">ONLINE</span></h4><p style="font-size:0.8rem;color:var(--dim);">${p.fee} | ${p.coin}</p><p class="mono" style="margin-top:5px;">${p.stratum}</p>`; $("mining-grid").appendChild(el); }); }
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

// --- AGI BRAIN ---
function startAGIBrain() {
    const canvas = document.getElementById('agi-canvas'); if (!canvas || typeof THREE === 'undefined') return;
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
    startSimulations();
    startEbankEngine();
    generateAutoEngram();
    loadGrids();
    loadTokens();
    runSafety();
    startAGIBrain();
});
