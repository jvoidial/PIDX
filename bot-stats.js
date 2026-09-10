// ============================================================
// BOT STATS · Public data loader
// No secrets. Reads bot_public.json and renders the card.
// ============================================================
(function() {
  var botEl = document.getElementById("botStats");
  var liqEl = document.getElementById("liqStatus");
  if (!botEl) return;

  function fmtNum(n, d) {
    if (typeof n !== "number" || isNaN(n)) return "—";
    if (n > 1e9) return n.toExponential(3);
    return n.toLocaleString(undefined, { maximumFractionDigits: d || 4 });
  }

  function shortAddr(a) {
    if (!a || typeof a !== "string" || a.length < 10) return "?";
    return a.slice(0, 6) + "…" + a.slice(-4);
  }

  function render(d) {
    var html = "";
    html += "<div>🔐 Wallet: <code>" + shortAddr(d.safe_wallet) + "</code></div>";
    html += "<div>🔑 Session: <code>" + shortAddr(d.session_key_address) + "</code></div>";
    var eth = (typeof d.eth_balance === "number") ? d.eth_balance : 0;
    html += "<div>💰 ETH: " + (eth < 0.0001 && eth > 0 ? eth.toExponential(3) : eth.toFixed(6)) + "</div>";
    var h = d.holdings || {};
    for (var sym in h) {
      html += "<div>🪙 " + sym + ": " + fmtNum(h[sym]) + "</div>";
    }
    var ts = d.timestamp ? new Date(d.timestamp * 1000).toLocaleTimeString() : "—";
    html += "<div style='color:#667;font-size:10px;margin-top:4px;'>Updated: " + ts + "</div>";
    botEl.innerHTML = html;

    if (liqEl) {
      if (eth < 0.001) {
        liqEl.innerHTML = "<span style='color:#ff8866;'>⚠️ Low ETH — top up to enable liquidity ops</span>";
      } else {
        liqEl.innerHTML = "<span style='color:#88ff88;'>✅ Ready (" + eth.toFixed(4) + " ETH)</span>";
      }
    }
  }

  function load() {
    fetch("bot_public.json?t=" + Date.now(), { cache: "no-store" })
      .then(function(r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(render)
      .catch(function(e) {
        botEl.innerHTML = "<span style='color:#ff8866;'>⚠️ " + e.message + "</span>";
        if (liqEl) liqEl.textContent = "Unavailable";
      });
  }

  load();
  setInterval(load, 60000);
})();
