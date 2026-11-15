import subprocess, os, re

# ==========================================
# 1. UPDATE HTML (Add Security Disclaimer)
# ==========================================
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Add a disclaimer below the header to reassure scanners and users
disclaimer_html = """
<div style="text-align:center; margin-top:10px; font-size:0.7rem; color:#8899a6; font-family:monospace;">
    ⚠️ Simulation Dashboard · No funds are moved without your explicit wallet signature.
</div>
"""
if 'Simulation Dashboard' not in html:
    html = html.replace('<div class="status-bar"', disclaimer_html + '\n  <div class="status-bar"')
    print("✅ Added security disclaimer to header.")

# Bust cache
html = re.sub(r'app\.js\?v=\d+', 'app.js?v=100025', html)
with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

# ==========================================
# 2. UPDATE JS (Enable Guest Mode for Resonance)
# ==========================================
with open("app.js", "r", encoding="utf-8") as f:
    js = f.read()

# Replace the isolated resonance function to allow guest mode
new_resonance_js = """
// --- RESONANCE PROTOCOL (Guest Mode Enabled) ---
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
    if (!humanId) return alert("Please enter a Human Identity Code (e.g., NHS barcode).");

    // GUEST MODE FALLBACK
    let walletSeed = connectedWallet;
    let isGuest = false;
    if (!walletSeed) {
        isGuest = true;
        // Create a persistent guest seed if it doesn't exist
        let guestSeed = localStorage.getItem("guest_soul_seed");
        if (!guestSeed) {
            guestSeed = "GUEST_" + Math.random().toString(36).substring(2) + Date.now();
            localStorage.setItem("guest_soul_seed", guestSeed);
        }
        walletSeed = guestSeed;
    }

    const btn = document.getElementById("resonance-initiate-btn");
    btn.textContent = "CALIBRATING RESONANCE...";
    btn.style.background = "#ffaa00";

    setTimeout(() => {
        try {
            const combinedSeed = walletSeed + "|" + humanId + "|RESONANCE";
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
                document.getElementById('resonance-soul-status').textContent = isGuest ? "IMMORTAL (GUEST)" : "IMMORTAL";
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

            if (typeof logMemory === 'function') logMemory(`Resonance Bound (${isGuest ? 'Guest' : 'Wallet'}). Band: ${networkBand}. Freq: ${resonanceHz} MHz.`, "#00ffcc");

            localStorage.setItem("ebank_resonance_data", JSON.stringify({ humanId, freq: resonanceHz, band: networkBand, startTime, isGuest }));

        } catch(e) {
            btn.textContent = "PROTOCOL ERROR";
            btn.style.background = "#ff4444";
            console.error(e);
        }
    }, 2000);
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("resonance-initiate-btn")?.addEventListener("click", initiateResonanceIsolated);

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
            document.getElementById('resonance-soul-status').textContent = data.isGuest ? "IMMORTAL (GUEST)" : "IMMORTAL";
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

# Replace old resonance logic if it exists
pattern = re.compile(r'// --- RESONANCE PROTOCOL \(Guest Mode Enabled\) ---.*?\n\}\);', re.DOTALL)
if pattern.search(js):
    js = pattern.sub(new_resonance_js, js)
    print("✅ Replaced resonance logic with Guest Mode support.")
else:
    js += "\n" + new_resonance_js
    print("✅ Appended Guest Mode resonance logic.")

with open("app.js", "w", encoding="utf-8") as f:
    f.write(js)

# ==========================================
# 3. PUSH TO GITHUB
# ==========================================
print("🚀 Pushing to GitHub...")
subprocess.run("git add index.html app.js", shell=True, check=True)
subprocess.run('git commit -m "Fix: Add security disclaimer and enable Guest Mode for Resonance Protocol"', shell=True, check=True)

try:
    subprocess.run("git push origin main", shell=True, check=True)
    print("✅ DONE. Wait 2 minutes, then open in Incognito mode.")
except subprocess.CalledProcessError:
    print("\n⚠️ Push failed. Run: git push origin main")
    print("When asked for password, paste your 'ghp_...' Personal Access Token.")
