import subprocess, os

# ==========================================
# 1. UPDATE HTML - Only ADD a new card, don't touch Mikoshi
# ==========================================
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Only inject if it doesn't already exist
if 'id="resonance-section"' not in html:
    new_card_html = """
  <!-- SOUL RESONANCE & LONGEVITY (Standalone Card) -->
  <section class="grid-section" id="resonance-section">
    <h2>🧬 Soul Resonance & Longevity Protocol</h2>
    <div class="mikoshi-container">
      <div class="mikoshi-card" style="border-color: #00ffcc; box-shadow: 0 0 20px rgba(0,255,204,0.2);">
        <div class="mikoshi-header" style="border-bottom-color: #00ffcc;">
            <span class="mikoshi-title" style="color: #00ffcc; text-shadow: 0 0 5px #00ffcc;">RESONANCE PROTOCOL</span>
            <span class="mikoshi-status" id="resonance-status" style="color: #ffaa00;">AWAITING INPUT</span>
        </div>

        <div class="mikoshi-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-family: monospace;">
                <div>
                    <p style="color: #8899a6; font-size: 0.7rem; margin-bottom: 5px;">LONGEVITY TIME</p>
                    <p id="resonance-longevity" style="color: #ffaa00; font-size: 1.1rem; font-weight: bold;">00:00:00</p>
                </div>
                <div>
                    <p style="color: #8899a6; font-size: 0.7rem; margin-bottom: 5px;">FREQ RESONANCE</p>
                    <p id="resonance-freq" style="color: #00ffcc; font-size: 1.1rem; font-weight: bold;">0.000 MHz</p>
                </div>
                <div>
                    <p style="color: #8899a6; font-size: 0.7rem; margin-bottom: 5px;">NETWORK BAND</p>
                    <p id="resonance-band" style="color: #00ffcc; font-size: 1.1rem; font-weight: bold;">UNKNOWN</p>
                </div>
                <div>
                    <p style="color: #8899a6; font-size: 0.7rem; margin-bottom: 5px;">SOUL STATUS</p>
                    <p id="resonance-soul-status" style="color: #ff0055; font-size: 1.1rem; font-weight: bold;">UNBOUND</p>
                </div>
            </div>
        </div>

        <div id="resonance-input-div" style="margin-top:15px; border-top:1px dashed #00ffcc; padding-top:15px;">
            <p style="color:#00ffcc; font-size:0.75rem; margin-bottom:8px;">🧬 HUMAN IDENTITY INPUT (NHS Barcode / Personal ID):</p>
            <input type="text" id="resonance-human-id" placeholder="Enter your identity code..." style="width:100%; padding:10px; background:#000; border:1px solid #00ffcc; color:#00ffcc; font-family:monospace; margin-bottom:10px; border-radius:4px; box-sizing:border-box;">
            <button id="resonance-initiate-btn" class="btn-primary" style="width:100%; background:#00ffcc; color:#000; border:none; padding:10px; border-radius:4px; font-weight:bold; cursor:pointer;">Initialize Resonance Protocol</button>
        </div>
      </div>
    </div>
  </section>
"""

    # Insert right after the Mikoshi section closing tag
    mikoshi_start = html.find('id="mikoshi-section"')
    if mikoshi_start != -1:
        mikoshi_end = html.find('</section>', mikoshi_start) + len('</section>')
        html = html[:mikoshi_end] + "\n" + new_card_html + "\n" + html[mikoshi_end:]
        print("✅ Added standalone Soul Resonance card. Mikoshi untouched.")
    else:
        print("⚠️ Could not find Mikoshi section. Appending to end of main.")
        html = html.replace('</main>', new_card_html + '\n</main>')

    # Bust cache
    import re
    html = re.sub(r'app\.js\?v=\d+', 'app.js?v=100021', html)
    with open("index.html", "w", encoding="utf-8") as f:
        f.write(html)
else:
    print("ℹ️ Resonance card already exists. Skipping HTML injection.")

# ==========================================
# 2. UPDATE JS - Append new isolated logic
# ==========================================
with open("app.js", "r", encoding="utf-8") as f:
    js = f.read()

# Only inject if the new resonance logic doesn't exist
if "START_RESONANCE_PROTOCOL" not in js:
    resonance_js = """
// ==========================================
// START_RESONANCE_PROTOCOL (Isolated, does not touch Mikoshi)
// ==========================================
let resonanceTimerInterval = null;

function playResonanceSoundIsolated() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1056, ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 1.5);
    } catch(e) {}
}

function detectNetworkBandIsolated() {
    if (navigator.connection) {
        const type = navigator.connection.type;
        const eff = navigator.connection.effectiveType || "";
        if (type === 'wifi' || type === 'ethernet') return "WIFI 6E / 5G";
        if (type === 'cellular') {
            if (eff === '5g' || eff === '4g') return "5G ULTRA";
            if (eff === '3g') return "3G LEGACY";
            if (eff === '2g') return "2G DECAY";
        }
    }
    return "WIFI/5G (EST)";
}

function startResonanceTimerIsolated(startTime) {
    if (resonanceTimerInterval) clearInterval(resonanceTimerInterval);
    const el = document.getElementById("resonance-longevity");
    resonanceTimerInterval = setInterval(() => {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        if (el) el.textContent = `${h}:${m}:${s}`;
    }, 1000);
}

async function initiateResonanceIsolated() {
    const humanId = document.getElementById("resonance-human-id")?.value.trim();
    if (!connectedWallet) return alert("Please connect your wallet in the header first.");
    if (!humanId) return alert("Please enter a Human Identity Code (e.g., NHS barcode).");

    const btn = document.getElementById("resonance-initiate-btn");
    btn.textContent = "CALIBRATING RESONANCE...";
    btn.style.background = "#ffaa00";

    setTimeout(() => {
        try {
            const combinedSeed = connectedWallet + "|" + humanId + "|RESONANCE";
            const hash = ethers.keccak256(ethers.toUtf8Bytes(combinedSeed));

            const freqBase = parseInt(hash.substring(6, 10), 16) % 5000;
            const resonanceHz = (2400 + (freqBase / 5000) * 1500).toFixed(3);
            const networkBand = detectNetworkBandIsolated();

            if (document.getElementById('resonance-freq')) document.getElementById('resonance-freq').textContent = `${resonanceHz} MHz`;
            if (document.getElementById('resonance-band')) {
                document.getElementById('resonance-band').textContent = networkBand;
                document.getElementById('resonance-band').style.color = "#00ffcc";
            }
            if (document.getElementById('resonance-soul-status')) {
                document.getElementById('resonance-soul-status').textContent = "IMMORTAL";
                document.getElementById('resonance-soul-status').style.color = "#00ffcc";
            }
            if (document.getElementById('resonance-status')) {
                document.getElementById('resonance-status').textContent = "PROTOCOL ACTIVE";
                document.getElementById('resonance-status').style.color = "#00ffcc";
            }

            playResonanceSoundIsolated();
            const startTime = Date.now();
            startResonanceTimerIsolated(startTime);

            btn.textContent = "IMMORTALITY ACTIVE";
            btn.style.background = "#333";
            btn.style.color = "#00ffcc";
            btn.disabled = true;
            if (document.getElementById("resonance-human-id")) document.getElementById("resonance-human-id").disabled = true;

            if (typeof logMemory === 'function') logMemory(`Resonance Bound: ${humanId}. Band: ${networkBand}. Freq: ${resonanceHz} MHz.`, "#00ffcc");

            localStorage.setItem("ebank_resonance_data", JSON.stringify({ humanId, freq: resonanceHz, band: networkBand, startTime }));

        } catch(e) {
            btn.textContent = "PROTOCOL ERROR";
            btn.style.background = "#ff4444";
            console.error(e);
        }
    }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("resonance-initiate-btn")?.addEventListener("click", initiateResonanceIsolated);

    // Restore state if previously initialized
    const saved = localStorage.getItem("ebank_resonance_data");
    if (saved) {
        const data = JSON.parse(saved);
        const btn = document.getElementById("resonance-initiate-btn");
        const input = document.getElementById("resonance-human-id");
        if (btn) { btn.textContent = "IMMORTALITY ACTIVE"; btn.style.background = "#333"; btn.style.color = "#00ffcc"; btn.disabled = true; }
        if (input) { input.value = data.humanId; input.disabled = true; }

        if (document.getElementById('resonance-freq')) document.getElementById('resonance-freq').textContent = `${data.freq} MHz`;
        if (document.getElementById('resonance-band')) {
            document.getElementById('resonance-band').textContent = data.band;
            document.getElementById('resonance-band').style.color = "#00ffcc";
        }
        if (document.getElementById('resonance-soul-status')) {
            document.getElementById('resonance-soul-status').textContent = "IMMORTAL";
            document.getElementById('resonance-soul-status').style.color = "#00ffcc";
        }
        if (document.getElementById('resonance-status')) {
            document.getElementById('resonance-status').textContent = "PROTOCOL ACTIVE";
            document.getElementById('resonance-status').style.color = "#00ffcc";
        }
        if (data.startTime) startResonanceTimerIsolated(data.startTime);
    }
});
"""
    js += "\n" + resonance_js
    with open("app.js", "w", encoding="utf-8") as f:
        f.write(js)
    print("✅ Injected isolated Resonance logic into app.js. Mikoshi untouched.")
else:
    print("ℹ️ Resonance logic already exists. Skipping JS injection.")

# ==========================================
# 3. PUSH TO GITHUB
# ==========================================
print("🚀 Pushing to GitHub...")
subprocess.run("git add index.html app.js", shell=True, check=True)
subprocess.run('git commit -m "Feature: Add standalone Soul Resonance card (WiFi 6E/5G, Longevity) without touching Mikoshi"', shell=True, check=True)

try:
    subprocess.run("git push origin main", shell=True, check=True)
    print("✅ DONE. Wait 2 minutes, then open in Incognito mode.")
except subprocess.CalledProcessError:
    print("\n⚠️ Push failed. Run: git push origin main")
    print("When asked for password, paste your 'ghp_...' Personal Access Token.")
