import subprocess, os

html_path = "index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Add the wallet button to the header
if "connect-wallet-btn" not in html:
    wallet_btn_html = """
    <div style="text-align:center; margin-top: 15px;">
        <button id="connect-wallet-btn" style="background: var(--white); color: var(--bg); padding: 8px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; font-family: monospace; border: none;">Connect Wallet</button>
        <span id="wallet-display" style="font-family: monospace; color: #00ffcc; margin-left: 10px;"></span>
    </div>
    """
    html = html.replace('<div class="status-bar"', wallet_btn_html + '\n  <div class="status-bar"')
    print("✅ Added Connect Wallet button to HTML.")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

# Now update app.js to handle the connection
js_path = "app.js"
with open(js_path, "r", encoding="utf-8") as f:
    js = f.read()

wallet_js = """
// --- MANUAL WALLET CONNECT ---
document.getElementById('connect-wallet-btn')?.addEventListener('click', async () => {
    if (typeof window.ethereum === 'undefined') {
        return alert("Please install MetaMask or Coinbase Wallet.");
    }
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] });
        }

        document.getElementById('wallet-display').textContent = `${address.slice(0,6)}...${address.slice(-4)}`;
        document.getElementById('connect-wallet-btn').textContent = "Connected";
        document.getElementById('connect-wallet-btn').style.background = "var(--dim)";
        
        // Override the auto-engram with the real wallet address
        const hash = ethers.keccak256(ethers.toUtf8Bytes(address));
        const engramId = `${address.slice(0,6)}...${address.slice(-4)}`;
        const baseMap = { '0':'A','1':'C','2':'G','3':'T','4':'A','5':'C','6':'G','7':'T','8':'A','9':'C','a':'G','b':'T','c':'A','d':'C','e':'G','f':'T' };
        let seq = ""; const raw = hash.substring(2, 34);
        for (let i = 0; i < raw.length; i++) { seq += baseMap[raw[i].toLowerCase()] || "X"; if (i < raw.length - 1) seq += "-"; }
        const prob = (99.00 + (parseInt(hash.substring(2,6),16) / 65535) * 0.99).toFixed(2);

        if(document.getElementById('engram-id')) document.getElementById('engram-id').textContent = engramId;
        if(document.getElementById('longevity-seq')) document.getElementById('longevity-seq').textContent = seq;
        if(document.getElementById('immortality-prob')) document.getElementById('immortality-prob').textContent = `${prob}%`;
        
        if (typeof logMemory === 'function') logMemory(`Wallet Linked: ${engramId}`, "#00ffcc");

    } catch (e) {
        console.error(e);
        alert("Connection failed.");
    }
});
"""

if 'MANUAL WALLET CONNECT' not in js:
    js += "\n" + wallet_js
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(js)
    print("✅ Added Wallet Connect logic to app.js.")

print("🚀 Pushing to GitHub...")
subprocess.run("git add index.html app.js", shell=True, check=True)
subprocess.run('git commit -m "Feature: Added manual wallet connect back for real user identity"', shell=True, check=True)
subprocess.run("git push origin main", shell=True)
print("✅ DONE. Open in Incognito mode to test.")
