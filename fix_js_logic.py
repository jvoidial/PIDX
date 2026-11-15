import subprocess, os, re

# 1. Update app.js with the correct logic
with open("app.js", "r", encoding="utf-8") as f:
    js = f.read()

# --- FIX 1: SECURITY SCANNER ---
new_sec = """
async function scanTokenSecurity(token) {
    const badge = document.getElementById(`sec-${token.id}`);
    if (!badge) return;
    try {
        const res = await fetch(`https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${token.address}`);
        const json = await res.json();
        const result = json.result?.[token.address.toLowerCase()];
        if (!result) { badge.textContent = "🛡️ No data"; return; }
        
        const isHoneypot = result.is_honeypot === "1" || result.cannot_sell_all === "1";
        const buyTax = parseFloat(result.buy_tax || "0") * 100;
        const sellTax = parseFloat(result.sell_tax || "0") * 100;
        
        if (isHoneypot) {
            badge.textContent = "🚨 HONEYPOT"; badge.style.color = "#ff4444";
        } else if (sellTax > 10 || buyTax > 10) {
            badge.textContent = `⚠️ Tax ${sellTax.toFixed(1)}%`; badge.style.color = "#ffaa00";
        } else {
            badge.textContent = "✅ Safe"; badge.style.color = "#00ffcc";
        }
    } catch (e) { badge.textContent = "🛡️ Error"; }
}
"""
# Replace old function
pattern = re.compile(r'async function scanTokenSecurity\(token\) \{.*?\n\}', re.DOTALL)
if pattern.search(js): js = pattern.sub(new_sec, js)
else: js += "\n" + new_sec

# --- FIX 2: EBANK YIELD ---
new_ebank = """
let ebankPrincipal = 1000.00;
let ebankYield = 0.00000000;
function startEbankEngine() {
    setInterval(() => {
        const coh = parseFloat(document.getElementById("val-coherence")?.textContent) || 0.9356;
        const apy = 0.15 + (coh * 0.05);
        if(document.getElementById("ebank-apy")) document.getElementById("ebank-apy").textContent = `${(apy * 100).toFixed(2)}%`;
        
        const perSec = Math.pow(1 + apy, 1 / 31536000) - 1;
        const earned = ebankPrincipal * perSec;
        ebankYield += earned;
        ebankPrincipal += earned;
        
        if(document.getElementById("ebank-principal")) document.getElementById("ebank-principal").textContent = `${ebankPrincipal.toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})} PIDX`;
        if(document.getElementById("ebank-yield")) document.getElementById("ebank-yield").textContent = `+ ${ebankYield.toLocaleString(undefined, {minimumFractionDigits: 8, maximumFractionDigits: 8})} PIDX`;
    }, 1000);
}
"""
# Remove old engine and add new
js = re.sub(r'let ebankPrincipal = .*?function startEbankEngine\(\) \{.*?\n\}', new_ebank, js, flags=re.DOTALL)
if "startEbankEngine" not in js: js += "\n" + new_ebank

# --- FIX 3: AGI BRAIN ---
agi_js = """
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
document.addEventListener("DOMContentLoaded", () => { startAGIBrain(); });
"""
if "startAGIBrain" not in js: js += "\n" + agi_js

# Ensure boot sequence calls the fixed engines
if 'startEbankEngine()' not in js:
    js = js.replace('window.addEventListener("DOMContentLoaded", () => {', 'window.addEventListener("DOMContentLoaded", () => {\n    startEbankEngine();')

with open("app.js", "w", encoding="utf-8") as f:
    f.write(js)
print("✅ Patched app.js logic (Security, eBank, AGI Brain).")

# 2. Update index.html to add the AGI canvas and bust the cache
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Add AGI Canvas to bottom of main
if "agi-canvas" not in html:
    agi_html = """
  <section class="grid-section" id="agi-brain-section">
    <h2>🧠 AGI Neural Topology · 5G 4D 3D</h2>
    <div class="panel" style="padding: 15px; border-radius: 12px; background: #000; border: 1px solid var(--border);">
        <canvas id="agi-canvas" style="width: 100%; height: 350px; display: block;"></canvas>
    </div>
  </section>
    """
    html = html.replace('</main>', agi_html + '\n</main>')
    print("✅ Added AGI Canvas to HTML.")

# Bust cache to v=9999
html = re.sub(r'app\.js\?v=\d+', 'app.js?v=9999', html)
if 'app.js?v=' not in html:
    html = html.replace('app.js', 'app.js?v=9999')

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)

# 3. Push to GitHub
print("🚀 Pushing to GitHub...")
subprocess.run("git add app.js index.html", shell=True, check=True)
subprocess.run('git commit -m "Fix: Javascript logic for security, eBank yield, and AGI brain"', shell=True, check=True)

try:
    subprocess.run("git push origin main", shell=True, check=True)
    print("✅ DONE. Wait 2 minutes, then open in Incognito mode.")
except subprocess.CalledProcessError:
    print("\n⚠️ Push failed. Run: git push origin main")
    print("When asked for password, paste your 'ghp_...' Personal Access Token.")
