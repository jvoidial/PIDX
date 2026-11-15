import subprocess, os, re

# 1. Read the current app.js
with open("app.js", "r", encoding="utf-8") as f:
    js = f.read()

# 2. Define a completely new, robust security scanning function
new_security_js = '''
// --- ROBUST TOKEN SECURITY SCANNER (GoPlus API for Base) ---
async function scanTokenSecurity(token) {
    const badge = document.getElementById(`sec-${token.id}`);
    if (!badge) return;

    try {
        // Base chain ID is 8453
        const url = `https://api.gopluslabs.io/api/v1/token_security/8453?contract_addresses=${token.address}`;
        const res = await fetchWithTimeout(url, {}, 5000);
        const json = await res.json();
        
        // The API returns an object keyed by the lowercased contract address
        const result = json.result?.[token.address.toLowerCase()];

        if (!result) {
            badge.textContent = "🛡️ Security: No data";
            badge.style.color = "var(--dim)";
            return;
        }

        // Evaluate risk flags from the GoPlus response
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

# 3. Replace the old scanTokenSecurity function with the new one
# We match from the function declaration to the end of the function block.
pattern = re.compile(r'async function scanTokenSecurity\(token\) \{.*?\n\}', re.DOTALL)
if pattern.search(js):
    js = pattern.sub(new_security_js, js)
    print("✅ Replaced scanTokenSecurity with robust GoPlus integration.")
else:
    # If we can't find it, append it to the end so it overrides any old definition
    js += "\n" + new_security_js
    print("✅ Appended robust scanTokenSecurity function.")

# 4. Ensure the function is called in the boot sequence
# The old code might have called scanAllSecurity(tokens), we'll ensure our new function is used.
if "scanAllSecurity" in js:
    # Replace the old batch scanner with a loop that calls the new function
    batch_replacement = '''
async function scanAllSecurity(tokens) {
    for (const t of tokens) {
        await scanTokenSecurity(t);
    }
}
'''
    pattern_batch = re.compile(r'async function scanAllSecurity\(tokens\) \{.*?\n\}', re.DOTALL)
    if pattern_batch.search(js):
        js = pattern_batch.sub(batch_replacement, js)
        print("✅ Updated batch scanner to use new logic.")

with open("app.js", "w", encoding="utf-8") as f:
    f.write(js)

# 5. Push to GitHub
print("🚀 Pushing to GitHub...")
subprocess.run("git add app.js", shell=True, check=True)
subprocess.run('git commit -m "Fix: Robust GoPlus token security scanning for Base (8453) cards"', shell=True, check=True)

try:
    subprocess.run("git push origin main", shell=True, check=True)
    print("✅ DONE. Wait 2 minutes, then open in Incognito mode.")
except subprocess.CalledProcessError:
    print("\n⚠️ Push failed. You need to enter your GitHub token.")
    print("Run: git push origin main")
    print("When asked for password, paste your 'ghp_...' Personal Access Token.")
