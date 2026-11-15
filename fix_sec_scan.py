import subprocess, os, re

with open("app.js", "r", encoding="utf-8") as f:
    js = f.read()

new_sec_js = '''
// --- ROBUST TOKEN SECURITY SCANNER (GoPlus API for Base) ---
async function scanTokenSecurity(token) {
    const badge = document.getElementById(`sec-${token.id}`);
    if (!badge) return;

    badge.textContent = "🛡️ Security: scanning...";
    badge.style.color = "var(--dim)";

    try {
        const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${token.address}`;
        const res = await fetchWithTimeout(url, {}, 5000);
        const json = await res.json();

        if (json.code !== 1 || !json.result) {
            badge.textContent = "🛡️ Security: No data";
            return;
        }

        const result = json.result[token.address.toLowerCase()];
        if (!result) {
            badge.textContent = "🛡️ Security: No data";
            return;
        }

        const isHoneypot = result.is_honeypot === "1";
        const cannotSell = result.cannot_sell_all === "1";
        const isOpenSource = result.is_open_source === "1";
        const buyTax = parseFloat(result.buy_tax || "0") * 100;
        const sellTax = parseFloat(result.sell_tax || "0") * 100;

        if (isHoneypot || cannotSell) {
            badge.textContent = "🚨 HONEYPOT / CANNOT SELL";
            badge.style.color = "#ff4444";
        } else if (sellTax > 10 || buyTax > 10) {
            badge.textContent = `⚠️ High Tax (Buy ${buyTax.toFixed(1)}% / Sell ${sellTax.toFixed(1)}%)`;
            badge.style.color = "#ffaa00";
        } else if (!isOpenSource) {
            badge.textContent = "⚠️ Unverified Source";
            badge.style.color = "#ffaa00";
        } else {
            badge.textContent = "✅ Safe";
            badge.style.color = "#00ffcc";
        }
    } catch (e) {
        console.warn(`Security scan failed for ${token.symbol}:`, e);
        badge.textContent = "🛡️ Security: Error";
        badge.style.color = "var(--dim)";
    }
}
'''

pattern = re.compile(r'async function scanTokenSecurity\(token\) \{.*?\n\}', re.DOTALL)
if pattern.search(js):
    js = pattern.sub(new_sec_js, js)
    print("✅ Replaced scanTokenSecurity with corrected GoPlus integration.")
else:
    js += "\n" + new_sec_js
    print("✅ Appended corrected scanTokenSecurity function.")

with open("app.js", "w", encoding="utf-8") as f:
    f.write(js)

print("🚀 Pushing to GitHub...")
subprocess.run("git add app.js", shell=True, check=True)
subprocess.run('git commit -m "Fix: Correctly parse GoPlus API response for Base token security scan"', shell=True, check=True)

try:
    subprocess.run("git push origin main", shell=True, check=True)
    print("✅ DONE. Wait 2 minutes, then open in Incognito mode.")
except subprocess.CalledProcessError:
    print("\n⚠️ Push failed. Run: git push origin main")
    print("When asked for password, paste your 'ghp_...' Personal Access Token.")
