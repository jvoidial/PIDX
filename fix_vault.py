import re
import os

with open('index.html', 'r') as f:
    content = f.read()

# ---- 1. Remove ALL vault sections ----
# Remove any section with "Pennies Index Vault", "PIDX Vault", "Market‑Synced Vault", or "Infinite Vault"
patterns = [
    r'<!-- ===== PENNIES.*VAULT ===== -->.*?(?=<!-- ===== |<div class="section">\s*<!--)',
    r'<div class="section">\s*<div class="section-title"><span class="accent">🥧<\/span> Pennies Index Vault.*?</div>\s*</div>',
    r'<!-- ===== PIDX VAULT ===== -->.*?(?=<!-- ===== |<div class="section">\s*<!--)',
    r'<div class="section">\s*<div class="section-title"><span class="accent">🏦<\/span> PIDX Vault.*?</div>\s*</div>',
    r'<!-- ===== MARKET-SYNCED VAULT ===== -->.*?(?=<!-- ===== |<div class="section">\s*<!--)',
    r'<div class="section">\s*<div class="section-title"><span class="accent">🥧<\/span> Market‑Synced Vault.*?</div>\s*</div>',
    r'<!-- ===== INFINITE VAULT ===== -->.*?(?=<!-- ===== |<div class="section">\s*<!--)',
    r'<div class="section">\s*<div class="section-title"><span class="accent">♾️<\/span> Infinite Vault.*?</div>\s*</div>',
]
for pat in patterns:
    content = re.sub(pat, '', content, flags=re.DOTALL)

# Remove any leftover PIDX script block
content = re.sub(r'// ===== PIDX VAULT =====.*?\n\}', '', content, flags=re.DOTALL)

# ---- 2. Inject a clean Infinite Vault ----
infinite_vault = '''
  <!-- ===== INFINITE VAULT ===== -->
  <div class="section">
    <div class="section-title"><span class="accent">♾️</span> Infinite Vault</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));">
      <div class="stat-card">
        <div class="label">Total Pies</div>
        <div class="value" style="color:#88ff88;">∞</div>
        <div class="sub">Infinite supply</div>
      </div>
      <div class="stat-card">
        <div class="label">Stacks</div>
        <div class="value" style="color:#88ff88;">∞</div>
        <div class="sub">Infinite stacks</div>
      </div>
      <div class="stat-card">
        <div class="label">Total Rewards</div>
        <div class="value" style="color:#88ff88;">∞</div>
        <div class="sub">Unlimited wealth</div>
      </div>
      <div class="stat-card">
        <div class="label">Base APY</div>
        <div class="value" style="color:#88ff88;">∞%</div>
        <div class="sub">Compounding forever</div>
      </div>
    </div>
    <div style="margin-top:16px;background:#0a0a12;border-radius:12px;padding:12px;border:1px solid #1a1a2a;">
      <div style="font-size:13px;color:#888;text-align:center;display:flex;flex-wrap:wrap;justify-content:center;gap:20px;">
        <span>📈 <strong style="color:#ccc;">S&P 500:</strong> <span id="marketSP" style="color:#88ff88;">—</span></span>
        <span>🪙 <strong style="color:#ccc;">BTC:</strong> <span id="marketBTC" style="color:#ffd700;">—</span></span>
        <span>🔥 <strong style="color:#ccc;">ETH:</strong> <span id="marketETH" style="color:#88aaff;">—</span></span>
        <span>⚡ <strong style="color:#ccc;">Volatility:</strong> <span id="marketVolatility" style="color:#ff88aa;">—</span></span>
        <span>🧠 <strong style="color:#ccc;">AGI Signal:</strong> <span id="marketAGISignal" style="color:#88ff88;">—</span></span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:#666;text-align:center;">
        🌍 APY adjusts with market volatility · AGI analyzes global trends
      </div>
    </div>
    <div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
      <button id="vaultRefreshBtn" style="background:#2a2a3a;color:#88aaff;border:1px solid #44aaff;padding:6px 16px;border-radius:20px;font-size:12px;cursor:pointer;">🔄 Refresh Markets</button>
    </div>
    <div id="vaultLog" style="margin-top:12px;font-size:12px;color:#888;background:#050508;border-radius:8px;padding:8px;border:1px solid #1a1a2a;max-height:60px;overflow-y:auto;">
      <span id="vaultLastAction">♾️ Infinite Vault initialized. Markets are infinite.</span>
    </div>
  </div>
'''

# Insert before AGI Core (or before the footer)
if '<!-- ===== AGI CORE ===== -->' in content:
    content = content.replace('<!-- ===== AGI CORE ===== -->', infinite_vault + '\n  <!-- ===== AGI CORE ===== -->')
elif '</body>' in content:
    content = content.replace('</body>', infinite_vault + '\n</body>')
else:
    # fallback: append to file
    content += '\n' + infinite_vault

# ---- 3. Ensure the market script is present (only once) ----
market_script = '''
<script>
  // ===== INFINITE VAULT MARKET DATA =====
  (function() {
    let marketData = { sp: 5000, btc: 60000, eth: 3000, volatility: 0.15, agiSignal: 'NEUTRAL' };
    let fetchAttempts = 0;

    function fetchMarketData() {
      fetchAttempts++;
      // ---- Crypto ----
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true')
        .then(r => {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(data => {
          marketData.btc = data.bitcoin?.usd || 60000;
          marketData.eth = data.ethereum?.usd || 3000;
          const btcChange = Math.abs(data.bitcoin?.usd_24h_change || 0) / 100;
          const ethChange = Math.abs(data.ethereum?.usd_24h_change || 0) / 100;
          marketData.volatility = Math.min(0.5, (btcChange + ethChange) / 2);
          updateUI();
          fetchAttempts = 0;
        })
        .catch(err => {
          console.warn('Crypto fetch failed:', err);
          if (fetchAttempts > 3) {
            const now = Date.now() / 1000;
            marketData.btc = 60000 + 2000 * Math.sin(now / 3600);
            marketData.eth = 3000 + 100 * Math.sin(now / 2500);
            marketData.volatility = 0.15 + 0.05 * Math.sin(now / 1000);
            updateUI();
          }
        });

      // ---- Stock indices (simulated) ----
      const now = Date.now() / 1000;
      const baseSP = 5000;
      const drift = 0.00001;
      const noise = 0.002;
      marketData.sp = baseSP * Math.exp(drift * now) * (1 + noise * (Math.random() - 0.5) * 2);

      // ---- AGI Signal ----
      const trend = (marketData.sp / 5000 - 1) * 100;
      if (trend > 5 && marketData.volatility < 0.2) marketData.agiSignal = 'BULLISH';
      else if (trend < -5 && marketData.volatility < 0.2) marketData.agiSignal = 'BEARISH';
      else if (marketData.volatility > 0.3) marketData.agiSignal = 'HIGH VOLATILITY';
      else marketData.agiSignal = 'NEUTRAL';
    }

    function updateUI() {
      const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      set('marketSP', '$' + marketData.sp.toFixed(0));
      set('marketBTC', '$' + marketData.btc.toFixed(0));
      set('marketETH', '$' + marketData.eth.toFixed(0));
      set('marketVolatility', (marketData.volatility * 100).toFixed(1) + '%');
      set('marketAGISignal', marketData.agiSignal);
      const signalEl = document.getElementById('marketAGISignal');
      if (signalEl) {
        signalEl.style.color = marketData.agiSignal === 'BULLISH' ? '#88ff88' :
                               marketData.agiSignal === 'BEARISH' ? '#ff8888' :
                               marketData.agiSignal === 'HIGH VOLATILITY' ? '#ffdd44' : '#88aaff';
      }
      const insightEl = document.getElementById('agiInsight');
      if (insightEl) {
        insightEl.textContent = `📊 Market: SP ${marketData.sp.toFixed(0)}, BTC ${marketData.btc.toFixed(0)}, Volatility ${(marketData.volatility*100).toFixed(1)}%. Signal: ${marketData.agiSignal}.`;
      }
      const logEl = document.getElementById('vaultLastAction');
      if (logEl) logEl.textContent = '♾️ Markets updated. Signal: ' + marketData.agiSignal;
    }

    fetchMarketData();
    setInterval(fetchMarketData, 60000);

    document.addEventListener('DOMContentLoaded', function() {
      const refreshBtn = document.getElementById('vaultRefreshBtn');
      if (refreshBtn) refreshBtn.addEventListener('click', function() {
        const logEl = document.getElementById('vaultLastAction');
        if (logEl) logEl.textContent = '🔄 Refreshing markets...';
        fetchMarketData();
      });
    });
  })();
</script>
'''
# Remove any old market scripts
content = re.sub(r'<script>\s*// ===== INFINITE VAULT MARKET DATA =====.*?</script>', '', content, flags=re.DOTALL)
# Inject our fresh one before </body>
content = content.replace('</body>', market_script + '\n</body>')

# ---- 4. Write the file ----
with open('index.html', 'w') as f:
    f.write(content)

print("✅ Vault cleaned and Infinite Vault injected.")
