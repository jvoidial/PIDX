(function() {
  var el = document.getElementById('oracleFreeCard');
  if (!el) return;

  function fmtHash(h) {
    if (!h || isNaN(h)) return '—';
    h = Number(h);
    if (h >= 1e18) return (h / 1e18).toFixed(2) + ' EH/s';
    if (h >= 1e15) return (h / 1e15).toFixed(2) + ' PH/s';
    if (h >= 1e12) return (h / 1e12).toFixed(2) + ' TH/s';
    return h.toFixed(0) + ' H/s';
  }

  function load() {
    fetch('oracle_free.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
      .then(function(d) {
        var h = '';

        // Forex
        h += '<div style="color:#88ff88;font-size:10px;">📈 Forex (USD base)</div>';
        var rates = (d.forex && d.forex.rates) || {};
        var keys = Object.keys(rates).slice(0, 4);
        for (var i = 0; i < keys.length; i++) {
          h += '<div>USD/' + keys[i] + ': ' + Number(rates[keys[i]]).toFixed(4) + '</div>';
        }

        // Mining
        h += '<div style="color:#ffddaa;font-size:10px;margin-top:6px;">⛏️ Mining</div>';
        var mp = (d.mining && d.mining.mempool) || {};
        if (mp.hashrate) h += '<div>Network: ' + fmtHash(mp.hashrate) + '</div>';
        if (mp.block_height) h += '<div>Block: ' + Number(mp.block_height).toLocaleString() + '</div>';
        var sf = (d.mining && d.mining.solofury) || {};
        if (sf.totalHashRate) h += '<div>SoloFury: ' + fmtHash(sf.totalHashRate) + '</div>';
        if (sf.totalMiners) h += '<div>Miners: ' + sf.totalMiners + '</div>';

        // Tokens
        h += '<div style="color:#88ccff;font-size:10px;margin-top:6px;">🪙 Tokens</div>';
        var tk = d.tokens || [];
        for (var j = 0; j < Math.min(5, tk.length); j++) {
          var t = tk[j];
          var p = t.price_usd ? '$' + Number(t.price_usd).toFixed(4) : '—';
          h += '<div>' + t.symbol + ': ' + p + '</div>';
        }

        var ts = d.timestamp ? new Date(d.timestamp * 1000).toLocaleTimeString() : '—';
        h += '<div style="color:#556;font-size:9px;margin-top:4px;">Updated: ' + ts + '</div>';
        el.innerHTML = h;
      })
      .catch(function(e) {
        el.innerHTML = '<span style="color:#ff8866;">Oracle offline — ' + e + '</span>';
      });
  }

  load();
  setInterval(load, 120000);
})();
