import subprocess, os, re

# ==========================================
# 1. UPDATE HTML (Wallet Button + Bots Section)
# ==========================================
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Add Wallet Connect Button to Header
if "connect-wallet-btn" not in html:
    wallet_html = """
  <div style="text-align:center; margin-top: 15px;">
      <button id="connect-wallet-btn" style="background: var(--white); color: var(--bg); padding: 8px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; font-family: monospace; border: none;">Connect Wallet</button>
      <span id="wallet-address" style="font-family: monospace; color: #00ffcc; margin-left: 10px;"></span>
  </div>
    """
    html = html.replace('<div class="status-bar"', wallet_html + '\n  <div class="status-bar"')
    print("✅ Added Wallet Connect button to header.")

# Add Bots Section at the bottom
bots_html = """
  <section class="grid-section" id="bots-section">
    <h2>🤖 Trading Bots · Automated Strategies</h2>
    <div class="bots-grid">
      <!-- DCA Bot Card -->
      <div class="card bot-card">
        <h4>DCA Bot <span class="badge tiny" id="dca-status" style="color:#ffaa00; border-color:#ffaa00;">PAUSED</span></h4>
        <p style="color:var(--dim); font-size:0.8rem;">Dollar-Cost Averaging</p>
        <div class="bot-metrics">
          <div><span class="label">PnL</span><span class="value" id="dca-pnl" style="color:#00ffcc;">+$0.00</span></div>
          <div><span class="label">Win Rate</span><span class="value" id="dca-win">0%</span></div>
          <div><span class="label">Trades/hr</span><span class="value" id="dca-trades">0</span></div>
          <div><span class="label">Strategy</span><span class="value" id="dca-strategy">MOMENTUM</span></div>
        </div>
        <button class="bot-btn" id="dca-btn" style="background:#00ffcc; color:#000; border:none; width:100%; padding:8px; border-radius:6px; margin-top:12px; font-family:monospace; cursor:pointer;">Start Bot</button>
      </div>
      <!-- Grid Bot Card -->
      <div class="card bot-card">
        <h4>Grid Bot <span class="badge tiny" id="grid-status" style="color:#ffaa00; border-color:#ffaa00;">PAUSED</span></h4>
        <p style="color:var(--dim); font-size:0.8rem;">Grid Trading</p>
        <div class="bot-metrics">
          <div><span class="label">PnL</span><span class="value" id="grid-pnl" style="color:#00ffcc;">+$0.00</span></div>
          <div><span class="label">Win Rate</span><span class="value" id="grid-win">0%</span></div>
          <div><span class="label">Trades/hr</span><span class="value" id="grid-trades">0</span></div>
          <div><span class="label">Strategy</span><span class="value" id="grid-strategy">GRID</span></div>
        </div>
        <button class="bot-btn" id="grid-btn" style="background:#00ffcc; color:#000; border:none; width:100%; padding:8px; border-radius:6px; margin-top:12px; font-family:monospace; cursor:pointer;">Start Bot</button>
      </div>
    </div>
  </section>
"""
if 'id="bots-section"' not in html:
    html = html.replace('</main>', bots_html + '\n</main>')
    print("✅ Added Trading Bots section to HTML.")

# Bust Cache
html = re.sub(r'app\.js\?v=\d+', 'app.js?v=100001', html)
with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

# ==========================================
# 2. UPDATE CSS (Bots & Wallet Styling)
# ==========================================
with open("style.css", "r", encoding="utf-8") as f:
    css = f.read()

bots_css = """
.bots-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:15px}
.bot-card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:20px;backdrop-filter:blur(10px);transition:all .3s}
.bot-card:hover{border-color:var(--silver);transform:translateY(-3px)}
.bot-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}
.bot-metrics .label{display:block;font-size:.7rem;color:var(--dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}
.bot-metrics .value{display:block;font-family:monospace;font-size:1rem;color:var(--white);font-weight:bold}
"""
if '.bots-grid' not in css:
    with open("style.css", "a", encoding="utf-8") as f:
        f.write("\n" + bots_css)
    print("✅ Added Bots CSS.")

# ==========================================
# 3. UPDATE JAVASCRIPT (Wallet + Bots Logic)
# ==========================================
with open("app.js", "r", encoding="utf-8") as f:
    js = f.read()

# --- WALLET CONNECT LOGIC ---
wallet_js = """
// --- WALLET CONNECT ---
let connectedWallet = null;

async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        return alert("Please install MetaMask or Coinbase Wallet.");
    }
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        connectedWallet = accounts[0];
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') {
            try {
                await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
            } catch (e) {
                alert("Please switch to Base network manually.");
                return;
            }
        }

        const btn = document.getElementById("connect-wallet-btn");
        const display = document.getElementById("wallet-address");
        if(btn) { btn.textContent = "Connected"; btn.style.background = "var(--dim)"; }
        if(display) display.textContent = `${connectedWallet.slice(0,6)}...${connectedWallet.slice(-4)}`;
        
        if (typeof logMemory === 'function') logMemory(`Wallet connected: ${connectedWallet.slice(0,6)}...${connectedWallet.slice(-4)}`, "#00ffcc");
    } catch (e) {
        console.error(e);
    }
}
document.getElementById('connect-wallet-btn')?.addEventListener('click', connectWallet);
"""

# --- BOTS SIMULATION LOGIC ---
bots_js = """
// --- TRADING BOTS SIMULATION ---
let dcaActive = false;
let gridActive = false;
let dcaPnl = 0.00;
let gridPnl = 0.00;
let dcaTrades = 0;
let gridTrades = 0;
let dcaWin = 0;
let gridWin = 0;

function updateBotsUI() {
    const dcaStatus = document.getElementById("dca-status");
    const dcaBtn = document.getElementById("dca-btn");
    if (dcaStatus) {
        if (dcaActive) {
            dcaStatus.textContent = "ACTIVE"; dcaStatus.style.color = "#00ffcc"; dcaStatus.style.borderColor = "#00ffcc";
            if (dcaBtn) { dcaBtn.textContent = "Stop Bot"; dcaBtn.style.background = "#ff4444"; dcaBtn.style.color = "#fff"; }
        } else {
            dcaStatus.textContent = "PAUSED"; dcaStatus.style.color = "#ffaa00"; dcaStatus.style.borderColor = "#ffaa00";
            if (dcaBtn) { dcaBtn.textContent = "Start Bot"; dcaBtn.style.background = "#00ffcc"; dcaBtn.style.color = "#000"; }
        }
        if (document.getElementById("dca-pnl")) document.getElementById("dca-pnl").textContent = `+$${dcaPnl.toFixed(2)}`;
        if (document.getElementById("dca-trades")) document.getElementById("dca-trades").textContent = dcaTrades;
        if (document.getElementById("dca-win")) document.getElementById("dca-win").textContent = `${dcaWin.toFixed(1)}%`;
    }

    const gridStatus = document.getElementById("grid-status");
    const gridBtn = document.getElementById("grid-btn");
    if (gridStatus) {
        if (gridActive) {
            gridStatus.textContent = "ACTIVE"; gridStatus.style.color = "#00ffcc"; gridStatus.style.borderColor = "#00ffcc";
            if (gridBtn) { gridBtn.textContent = "Stop Bot"; gridBtn.style.background = "#ff4444"; gridBtn.style.color = "#fff"; }
        } else {
            gridStatus.textContent = "PAUSED"; gridStatus.style.color = "#ffaa00"; gridStatus.style.borderColor = "#ffaa00";
            if (gridBtn) { gridBtn.textContent = "Start Bot"; gridBtn.style.background = "#00ffcc"; gridBtn.style.color = "#000"; }
        }
        if (document.getElementById("grid-pnl")) document.getElementById("grid-pnl").textContent = `+$${gridPnl.toFixed(2)}`;
        if (document.getElementById("grid-trades")) document.getElementById("grid-trades").textContent = gridTrades;
        if (document.getElementById("grid-win")) document.getElementById("grid-win").textContent = `${gridWin.toFixed(1)}%`;
    }
}

function startBotsEngine() {
    updateBotsUI();

    setInterval(() => {
        if (dcaActive) {
            dcaPnl += Math.random() * 2.5 - 0.5;
            dcaTrades += Math.floor(Math.random() * 3);
            dcaWin = 70 + Math.random() * 15;
            updateBotsUI();
            if (typeof logMemory === 'function') logMemory(`DCA Bot executed trade. PnL: $${dcaPnl.toFixed(2)}`, "#00ffcc");
        }
        if (gridActive) {
            gridPnl += Math.random() * 1.5 - 0.3;
            gridTrades += Math.floor(Math.random() * 2);
            gridWin = 60 + Math.random() * 20;
            updateBotsUI();
        }
    }, 3000);

    document.getElementById("dca-btn")?.addEventListener("click", () => {
        if (!connectedWallet) return alert("Please connect your wallet first to start the bot.");
        dcaActive = !dcaActive;
        updateBotsUI();
        if (typeof logMemory === 'function') logMemory(`DCA Bot ${dcaActive ? 'Started' : 'Stopped'}.`, dcaActive ? "#00ffcc" : "#ff4444");
    });

    document.getElementById("grid-btn")?.addEventListener("click", () => {
        if (!connectedWallet) return alert("Please connect your wallet first to start the bot.");
        gridActive = !gridActive;
        updateBotsUI();
        if (typeof logMemory === 'function') logMemory(`Grid Bot ${gridActive ? 'Started' : 'Stopped'}.`, gridActive ? "#00ffcc" : "#ff4444");
    });
}
"""

if "WALLET CONNECT" not in js:
    js += "\n" + wallet_js
if "TRADING BOTS SIMULATION" not in js:
    js += "\n" + bots_js

# Ensure they run on load
if "startBotsEngine()" not in js:
    js = js.replace('window.addEventListener("DOMContentLoaded", () => {', 'window.addEventListener("DOMContentLoaded", () => {\n    startBotsEngine();')

with open("app.js", "w", encoding="utf-8") as f:
    f.write(js)
print("✅ Added Wallet and Bots logic to app.js.")

# ==========================================
# 4. PUSH TO GITHUB
# ==========================================
print("🚀 Pushing to GitHub...")
subprocess.run("git add index.html style.css app.js", shell=True, check=True)
subprocess.run('git commit -m "Feature: Add Wallet Connect and Trading Bots integration"', shell=True, check=True)

try:
    subprocess.run("git push origin main", shell=True, check=True)
    print("✅ DONE. Wait 2 minutes, then open in Incognito mode.")
except subprocess.CalledProcessError:
    print("\n⚠️ Push failed. Run: git push origin main")
    print("When asked for password, paste your 'ghp_...' Personal Access Token.")
