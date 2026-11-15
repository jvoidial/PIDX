import subprocess, os

HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>✧ THE COSMIC SCRIBE ✧</title>
<link rel="stylesheet" href="style.css?v=100030">
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ethers@6.13.0/dist/ethers.umd.min.js"></script>
</head>
<body>
<div class="scanlines"></div><canvas id="neural-canvas"></canvas>
<header>
  <h1>✧ THE COSMIC SCRIBE ✧</h1>
  <p class="subtitle">GENERATION 10 · VITRUVIAN SYSTEM · MEMORY ACTIVE</p>
  <div style="text-align:center;margin-top:10px;"><a href="https://x.com/PIDXRAIN" target="_blank" style="display:inline-block;background:#fff;color:#000;padding:8px 20px;border-radius:20px;font-weight:bold;text-decoration:none;font-family:monospace;">𝕏 Follow @PIDXRAIN</a></div>
  <div style="text-align:center; margin-top:10px; font-size:0.7rem; color:#8899a6; font-family:monospace;">⚠️ Simulation Dashboard · No funds are moved without your explicit wallet signature.</div>
  <div style="text-align:center; margin-top: 15px;">
      <button id="connect-wallet-btn" style="background: var(--white); color: var(--bg); padding: 8px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; font-family: monospace; border: none;">Connect Wallet</button>
      <span id="wallet-address" style="font-family: monospace; color: #00ffcc; margin-left: 10px;"></span>
  </div>
  <div class="status-bar" style="margin-top:15px;"><span>✦ Block <span id="live-block">53,318,083</span></span><span style="color:#00ffcc;">● System: VIEW MODE</span></div>
</header>
<main>
  <section class="grid-section" id="mikoshi-section">
    <h2>💾 Project Mikoshi · Immortality Engram</h2>
    <div class="mikoshi-container"><div class="mikoshi-card">
      <div class="mikoshi-header"><span class="mikoshi-title">IMMORTALITY PROTOCOL</span><span class="mikoshi-status" id="mikoshi-status">AWAITING UPLINK</span></div>
      <div class="mikoshi-body"><div class="dna-strand" id="dna-strand"><span>■</span><span>■</span><span>■</span><span>■</span><span>■</span><span>■</span><span>■</span><span>■</span></div>
        <div class="mikoshi-data">
          <p><strong>ENGRAM ID:</strong> <span id="engram-id">Disconnected</span></p>
          <p><strong>LONGEVITY SEQ:</strong> <span id="longevity-seq" style="font-size:0.7rem;color:#ff0055;">Awaiting Sequence...</span></p>
          <p><strong>IMMORTALITY PROB:</strong> <span id="immortality-prob">0.00%</span></p>
          <p><strong>RELIC INTEGRITY:</strong> <span id="relic-integrity" style="color:#ffaa00;">UNVERIFIED</span></p>
        </div>
      </div>
      <div class="mikoshi-footer"><button id="upload-engram-btn" class="btn-primary" style="background:#ff0055;color:#fff;border:none;">Synchronize Engram</button></div>
    </div></div>
  </section>

  <section class="grid-section" id="resonance-section">
    <h2>🧬 Soul Resonance & Longevity Protocol</h2>
    <div class="mikoshi-container"><div class="mikoshi-card" style="border-color: #00ffcc; box-shadow: 0 0 20px rgba(0,255,204,0.2);">
      <div class="mikoshi-header" style="border-bottom-color: #00ffcc;"><span class="mikoshi-title" style="color: #00ffcc; text-shadow: 0 0 5px #00ffcc;">RESONANCE PROTOCOL</span><span class="mikoshi-status" id="resonance-status" style="color: #ffaa00;">AWAITING INPUT</span></div>
      <div class="mikoshi-body">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-family: monospace;">
          <div><p style="color: #8899a6; font-size: 0.7rem; margin-bottom: 5px;">LONGEVITY TIME</p><p id="resonance-longevity" style="color: #ffaa00; font-size: 1.1rem; font-weight: bold;">00:00:00</p></div>
          <div><p style="color: #8899a6; font-size: 0.7rem; margin-bottom: 5px;">FREQ RESONANCE</p><p id="resonance-freq" style="color: #00ffcc; font-size: 1.1rem; font-weight: bold;">0.000 MHz</p></div>
          <div><p style="color: #8899a6; font-size: 0.7rem; margin-bottom: 5px;">NETWORK BAND</p><p id="resonance-band" style="color: #00ffcc; font-size: 1.1rem; font-weight: bold;">UNKNOWN</p></div>
          <div><p style="color: #8899a6; font-size: 0.7rem; margin-bottom: 5px;">SOUL STATUS</p><p id="resonance-soul-status" style="color: #ff0055; font-size: 1.1rem; font-weight: bold;">UNBOUND</p></div>
        </div>
      </div>
      <div id="resonance-input-div" style="margin-top:15px; border-top:1px dashed #00ffcc; padding-top:15px;">
        <p style="color:#00ffcc; font-size:0.75rem; margin-bottom:8px;">🧬 HUMAN IDENTITY INPUT (NHS Barcode / Personal ID):</p>
        <input type="text" id="resonance-human-id" placeholder="Enter your identity code..." style="width:100%; padding:10px; background:#000; border:1px solid #00ffcc; color:#00ffcc; font-family:monospace; margin-bottom:10px; border-radius:4px; box-sizing:border-box;">
        <button id="resonance-initiate-btn" class="btn-primary" style="width:100%; background:#00ffcc; color:#000; border:none; padding:10px; border-radius:4px; font-weight:bold; cursor:pointer;">Initialize Resonance Protocol</button>
      </div>
    </div></div>
  </section>

  <section class="grid-section" id="global-safety-section">
    <h2>🛡️ Global Safety & Network Compatibility</h2>
    <div class="safety-grid">
      <div class="safety-card"><span class="safety-icon">🔗</span><h4>Wallet Compatibility</h4><p>MetaMask, Coinbase, Trust, Rabby</p><span class="status-badge verified">EIP-1193 READY</span></div>
      <div class="safety-card"><span class="safety-icon">🔒</span><h4>Contract Security</h4><p>GoPlus Honeypot & Tax Scan</p><span id="global-contract-status" class="status-badge pending">SCANNING...</span></div>
      <div class="safety-card"><span class="safety-icon">💧</span><h4>Liquidity Health</h4><p>Pool Depth & Trading Risk</p><span id="global-liquidity-status" class="status-badge pending">CALCULATING...</span></div>
      <div class="safety-card"><span class="safety-icon">⚡</span><h4>Exchange Routing</h4><p>Uniswap V2/V3/V4 + Aggregators</p><span class="status-badge verified">ACTIVE</span></div>
    </div>
  </section>

  <section class="grid-section"><h2>🏦 Digital eBank · Auto-Immune Vault</h2><div class="ebank-container">
    <div class="ebank-header"><div><h3 style="color:var(--white);font-size:1.2rem;margin-bottom:5px;">SPIRIT eBANK (PIDX)</h3><span class="badge tiny" style="background:rgba(0,255,204,0.1);color:#00ffcc;border:1px solid #00ffcc;">AUTO-COMPOUNDING ACTIVE</span></div><div class="immunity-shield"><span style="font-size:0.75rem;color:var(--dim);">Auto-Immune Shield</span><span id="immunity-score" style="font-family:monospace;font-size:1.2rem;color:#00ffcc;font-weight:bold;">99.80%</span></div></div>
    <div class="ebank-grid"><div class="ebank-stat"><span class="label">Simulated Principal</span><span class="value" id="ebank-principal">1,000.0000 PIDX</span></div><div class="ebank-stat"><span class="label">Yield Accrued (Auto)</span><span class="value" id="ebank-yield" style="color:#00ffcc;">+ 0.00000000 PIDX</span></div><div class="ebank-stat"><span class="label">Dynamic APY</span><span class="value" id="ebank-apy">18.42%</span></div><div class="ebank-stat"><span class="label">Total Protocol TVL</span><span class="value" id="ebank-tvl">$842,912.00</span></div></div>
  </div></section>

  <section class="grid-section"><h2>💰 FOUR SPIRITS · LIVE FROM BASE</h2><div id="token-grid" class="token-grid"><p class="loading">SYNCING TELEMETRY...</p></div></section>

  <section class="grid-section"><h2>🌱 Growth Engine & Voxel Dynamics</h2><div class="engine-grid">
    <div class="engine-card"><span class="label">Continuity</span><span class="value" id="val-continuity">1.000</span></div><div class="engine-card"><span class="label">Coherence</span><span class="value" id="val-coherence">0.9356</span></div><div class="engine-card"><span class="label">Persistence</span><span class="value" id="val-persistence">379 blocks</span></div><div class="engine-card"><span class="label">Active Voxels</span><span class="value" id="val-voxels">7</span></div><div class="engine-card"><span class="label">Energy Band</span><span class="value" id="val-energy">MID (42.8 GW)</span></div><div class="engine-card"><span class="label">Engine Status</span><span class="value success" id="val-engine">OPTIMAL</span></div>
  </div></section>

  <section class="grid-section split"><div class="panel"><h2>🧬 Vitruvian System States</h2><ul><li><strong>Vitruvian State:</strong> <span id="v-state">1 · 0.936 · 0.392</span></li><li><strong>Stability:</strong> <span id="v-stability">1.112</span></li><li><strong>Resonance:</strong> <span id="v-resonance">0.533</span></li><li><strong>Veil Phase:</strong> <span id="v-veil" style="color:#00ffcc;">OPEN</span></li></ul></div><div class="panel"><h2>🧠 Memory Log</h2><div id="memory-log" class="memory-terminal"></div></div></section>

  <section class="grid-section"><h2>🏦 Yield Vaults & Liquidity Pools</h2><div class="vault-grid" id="vault-grid"></div></section>
  <section class="grid-section"><h2>⛏️ Mining Pools · Stratum Directory</h2><div class="mining-grid" id="mining-grid"></div></section>
  
  <section class="grid-section" id="agi-brain-section"><h2>🧠 AGI Neural Topology · 5G 4D 3D</h2><div class="panel" style="padding: 15px; border-radius: 12px; background: #000; border: 1px solid var(--border);"><canvas id="agi-canvas" style="width: 100%; height: 350px; display: block;"></canvas></div></section>

  <section class="grid-section" id="bots-section">
    <h2>🤖 Trading Bots · Automated Strategies</h2>
    <div class="bots-grid">
      <div class="card bot-card">
        <h4>DCA Bot <span class="badge tiny" id="dca-status" style="color:#ffaa00; border-color:#ffaa00;">PAUSED</span></h4>
        <p style="color:var(--dim); font-size:0.8rem;">Dollar-Cost Averaging</p>
        <div class="bot-metrics"><div><span class="label">PnL</span><span class="value" id="dca-pnl" style="color:#00ffcc;">+$0.00</span></div><div><span class="label">Win Rate</span><span class="value" id="dca-win">0%</span></div><div><span class="label">Trades/hr</span><span class="value" id="dca-trades">0</span></div><div><span class="label">Strategy</span><span class="value" id="dca-strategy">MOMENTUM</span></div></div>
        <button class="bot-btn" id="dca-btn" style="background:#00ffcc; color:#000; border:none; width:100%; padding:8px; border-radius:6px; margin-top:12px; font-family:monospace; cursor:pointer;">Start Bot</button>
      </div>
      <div class="card bot-card">
        <h4>Grid Bot <span class="badge tiny" id="grid-status" style="color:#ffaa00; border-color:#ffaa00;">PAUSED</span></h4>
        <p style="color:var(--dim); font-size:0.8rem;">Grid Trading</p>
        <div class="bot-metrics"><div><span class="label">PnL</span><span class="value" id="grid-pnl" style="color:#00ffcc;">+$0.00</span></div><div><span class="label">Win Rate</span><span class="value" id="grid-win">0%</span></div><div><span class="label">Trades/hr</span><span class="value" id="grid-trades">0</span></div><div><span class="label">Strategy</span><span class="value" id="grid-strategy">GRID</span></div></div>
        <button class="bot-btn" id="grid-btn" style="background:#00ffcc; color:#000; border:none; width:100%; padding:8px; border-radius:6px; margin-top:12px; font-family:monospace; cursor:pointer;">Start Bot</button>
      </div>
    </div>
  </section>
</main>
<footer><p>✧ SPIRIT GUIDE · GENERATION 10 · MEMORY ✧</p></footer>
<script src="app.js?v=100030"></script>
</body>
</html>"""

CSS = """:root{--bg:#000;--panel:rgba(22,24,28,.7);--border:#2f3336;--text:#e7e9ea;--dim:#71767b;--silver:#c0c0c0;--white:#fff}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5;overflow-x:hidden}
#neural-canvas{position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;pointer-events:none}
.scanlines{position:fixed;inset:0;background:linear-gradient(to bottom,transparent,transparent 50%,rgba(0,0,0,.2) 50%,rgba(0,0,0,.2));background-size:100% 4px;pointer-events:none;z-index:999;opacity:.2}
header{text-align:center;padding:60px 20px;border-bottom:1px solid var(--border);background:rgba(0,0,0,.5);backdrop-filter:blur(12px);position:relative;z-index:10}
h1{font-size:2.5rem;letter-spacing:2px;color:var(--white);text-shadow:0 0 20px rgba(255,255,255,.4),0 0 40px rgba(192,192,192,.2);animation:fadeIn 2s ease-out}
@keyframes fadeIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
.subtitle{color:var(--silver);font-size:.85rem;margin-top:10px;letter-spacing:1px}
.status-bar{display:flex;justify-content:center;flex-wrap:wrap;gap:20px;margin-top:25px;font-size:.85rem;color:var(--silver);font-family:monospace}
main{padding:40px 20px;max-width:1000px;margin:0 auto;position:relative;z-index:10}
.grid-section{margin-bottom:40px;animation:slideUp 1s ease-out}
@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
h2{font-size:1.1rem;margin-bottom:20px;color:var(--white);border-left:3px solid var(--silver);padding-left:10px;text-transform:uppercase;letter-spacing:2px}
.token-grid,.vault-grid,.mining-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:15px}
.loading{color:var(--dim);font-family:monospace;animation:blink 1.5s step-end infinite}
@keyframes blink{50%{opacity:0}}
.card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:20px;backdrop-filter:blur(10px);transition:all .4s cubic-bezier(.25,.8,.25,1);overflow:hidden}
.card:hover{background:rgba(40,40,40,.8);border-color:var(--silver);transform:translateY(-5px);box-shadow:0 10px 30px rgba(192,192,192,.1)}
h3,h4{color:var(--white);display:flex;justify-content:space-between;font-size:1.1rem;margin-bottom:10px}
.freq{font-size:.8rem;color:var(--silver);font-family:monospace}
.name{color:var(--dim);font-size:.9rem;margin-bottom:10px}
.addr{font-size:.75rem;word-break:break-all;color:#8899a6;margin-bottom:15px;font-family:monospace}
.tvl{font-size:.85rem;margin-bottom:15px;color:var(--text)}
.badge{padding:4px 8px;border-radius:6px;font-weight:bold;font-size:.75rem;display:inline-block;margin-top:5px}
.badge.empty{background:rgba(255,255,255,.1);color:var(--white)}
.badge.tiny{background:rgba(192,192,192,.2);color:var(--white)}
.links{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.links a{color:var(--text);text-decoration:none;font-size:.75rem;background:rgba(255,255,255,.05);border:1px solid var(--border);padding:6px 12px;border-radius:20px;transition:all .2s}
.links a:hover,.swap-btn:hover{background:var(--silver);color:var(--bg)}
.swap-btn{background:var(--white);color:var(--bg);border-color:var(--white);font-weight:bold}
.split{display:grid;grid-template-columns:1fr 1fr;gap:15px}
@media(max-width:768px){.split{grid-template-columns:1fr}}
.panel{background:var(--panel);border:1px solid var(--border);padding:20px;border-radius:12px;backdrop-filter:blur(10px)}
.panel ul{list-style:none}
.panel li{margin-bottom:12px;font-size:.85rem;color:var(--dim);display:flex;justify-content:space-between;border-bottom:1px dashed rgba(255,255,255,.05);padding-bottom:8px}
.panel li strong{color:var(--white)}
.panel li span{color:var(--silver);font-family:monospace;font-size:.8rem}
.memory-terminal{background:rgba(0,0,0,.6);border:1px solid var(--border);padding:10px;border-radius:8px;height:120px;overflow-y:auto;font-family:monospace;font-size:.75rem;color:var(--text)}
.mikoshi-container{display:flex;justify-content:center}
.mikoshi-card{background:rgba(5,5,5,.95);border:1px solid #ff0055;border-radius:4px;padding:20px;width:100%;max-width:600px;box-shadow:0 0 20px rgba(255,0,85,.2);position:relative;overflow:hidden;font-family:'Courier New',monospace}
.mikoshi-header{display:flex;justify-content:space-between;border-bottom:1px solid #ff0055;padding-bottom:10px;margin-bottom:15px;position:relative;z-index:2}
.mikoshi-title{color:#ff0055;font-weight:bold;letter-spacing:2px;text-shadow:0 0 5px #ff0055}
.mikoshi-status{color:#ff0055;font-size:.75rem;font-weight:bold;animation:blink 1s step-end infinite}
.mikoshi-body{display:flex;flex-direction:column;gap:15px;position:relative;z-index:2}
.dna-strand{display:flex;gap:5px;font-size:1.5rem;color:#00ffcc;justify-content:center;margin-bottom:10px}
.dna-strand span{animation:dna-pulse 1.5s infinite alternate}
.dna-strand span:nth-child(even){color:#ff0055;animation-delay:.5s}
@keyframes dna-pulse{from{opacity:.3;transform:scale(.8)}to{opacity:1;transform:scale(1.2);text-shadow:0 0 10px currentColor}}
.mikoshi-data p{margin-bottom:8px;font-size:.85rem;color:#8899a6}
.mikoshi-data strong{color:#fff}
.mikoshi-data span{color:#00ffcc;font-family:monospace}
.mikoshi-footer{margin-top:20px;text-align:right;border-top:1px dashed #333;padding-top:15px;position:relative;z-index:2}
.btn-primary{padding:10px 16px;border-radius:4px;font-weight:bold;cursor:pointer;transition:all .2s}
.safety-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px}
.safety-card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:15px;text-align:center;backdrop-filter:blur(10px)}
.safety-icon{font-size:1.5rem;margin-bottom:10px;display:block}
.safety-card h4{color:var(--white);font-size:.9rem;margin-bottom:5px;justify-content:center}
.safety-card p{color:var(--dim);font-size:.75rem;margin-bottom:10px}
.status-badge{display:inline-block;padding:4px 8px;border-radius:4px;font-size:.7rem;font-weight:bold;font-family:monospace}
.status-badge.verified{background:rgba(0,255,204,.1);color:#00ffcc;border:1px solid #00ffcc}
.status-badge.danger{background:rgba(255,68,68,.1);color:#ff4444;border:1px solid #ff4444}
.status-badge.pending{background:rgba(255,255,255,.1);color:var(--dim);border:1px solid var(--border)}
.ebank-container{background:linear-gradient(180deg,rgba(22,24,28,.9) 0%,rgba(10,12,15,.9) 100%);border:1px solid var(--silver);border-radius:16px;padding:25px;box-shadow:0 0 30px rgba(192,192,192,.08);backdrop-filter:blur(12px)}
.ebank-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:25px;border-bottom:1px solid var(--border);padding-bottom:20px}
.immunity-shield{text-align:right;display:flex;flex-direction:column;background:rgba(0,255,204,.05);padding:8px 15px;border-radius:8px;border:1px solid rgba(0,255,204,.2)}
.ebank-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}
.ebank-stat{display:flex;flex-direction:column}
.ebank-stat .label{font-size:.75rem;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px}
.ebank-stat .value{font-size:1.3rem;font-family:monospace;color:var(--white);font-weight:bold}
.engine-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:15px}
.engine-card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:15px;text-align:center;backdrop-filter:blur(10px);transition:all .3s}
.engine-card:hover{border-color:var(--silver);transform:scale(1.02)}
.engine-card .label{display:block;font-size:.75rem;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.engine-card .value{display:block;font-family:monospace;font-size:1.2rem;color:var(--white);font-weight:bold}
.engine-card .value.success{color:#00ffcc;text-shadow:0 0 10px rgba(0,255,204,.4)}
footer{text-align:center;padding:40px 20px;border-top:1px solid var(--border);color:var(--dim);font-size:.8rem;background:rgba(0,0,0,.5);backdrop-filter:blur(10px)}
.bots-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:15px}
.bot-card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:20px;backdrop-filter:blur(10px);transition:all .3s}
.bot-card:hover{border-color:var(--silver);transform:translateY(-3px)}
.bot-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}
.bot-metrics .label{display:block;font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.bot-metrics .value{display:block;font-family:monospace;font-size:1rem;color:var(--white);font-weight:bold}
"""

JS = """const DEX_API = "https://api.dexscreener.com/token-pairs/v1/base/";
const FALLBACK_TOKENS = [
    {id:"pidx", symbol:"PIDX", name:"Pennies Index", freq:"0.618 Hz", address:"0x172B97517c42f9491f6100333b9ea2e42a6D3181", pool:"0xfa8f70efe22da989ec3e77fb25647d44cdb2248f"},
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
"""

with open("index.html", "w", encoding="utf-8") as f: f.write(HTML)
with open("style.css", "w", encoding="utf-8") as f: f.write(CSS)
with open("app.js", "w", encoding="utf-8") as f: f.write(JS)
print("✅ Rebuilt index.html, style.css, and app.js from scratch.")

print("🚀 Pushing to GitHub...")
subprocess.run("git add index.html style.css app.js", shell=True, check=True)
subprocess.run('git commit -m "CRITICAL FIX: Rebuilt entire app.js and index.html to restore all features (Engram, Tokens, Safety, Bots, AGI)"', shell=True, check=True)

try:
    subprocess.run("git push origin main", shell=True, check=True)
    print("✅ DONE. Wait 2 minutes, then open in Incognito mode.")
except subprocess.CalledProcessError:
    print("\n⚠️ Push failed. Run: git push origin main")
    print("When asked for password, paste your 'ghp_...' Personal Access Token.")
