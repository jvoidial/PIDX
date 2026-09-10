// ============================================================
// DEFI YIELD SCANNER · Real APYs from real protocols on Base
// No fake numbers. Reads public APIs only.
// ============================================================
(function() {
  var el = document.getElementById('defiYield');
  if (!el) return;

  // Real DeFi protocols on Base with public yield APIs
  var PROTOCOLS = [
    {
      name: "Aave v3",
      url: "https://yields.llama.fi/pools",
      filter: function(p) { return p.chain === 'Base' && p.project === 'aave-v3'; }
    },
    {
      name: "Moonwell",
      url: "https://yields.llama.fi/pools",
      filter: function(p) { return p.chain === 'Base' && p.project === 'moonwell'; }
    },
    {
      name: "Aerodrome",
      url: "https://yields.llama.fi/pools",
      filter: function(p) { return p.chain === 'Base' && p.project === 'aerodrome-v1'; }
    }
  ];

  function fetchYields() {
    return fetch('https://yields.llama.fi/pools')
      .then(function(r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
      .then(function(d) { return d.data || []; })
      .catch(function(e) { return null; });
  }

  function render() {
    el.innerHTML = '<div style="color:#667;font-size:11px;">Loading real APYs…</div>';

    fetchYields().then(function(pools) {
      if (!pools) {
        el.innerHTML = '<div style="color:#ff8866;font-size:11px;">Could not load DeFiLlama</div>';
        return;
      }

      // Filter for Base chain
      var basePools = pools.filter(function(p) { return p.chain === 'Base'; });

      var html = '';

      // Top 5 by APY (with minimum TVL to filter garbage)
      var top = basePools
        .filter(function(p) {
          return p.tvlUsd > 100000 &&
                 p.apy > 0 &&
                 p.apy < 500 &&  // filter suspicious
                 p.symbol &&
                 p.project;
        })
        .sort(function(a, b) { return b.apy - a.apy; })
        .slice(0, 5);

      html += '<div style="font-size:10px;color:#88ccff;margin-bottom:4px;">Top real APYs on Base (TVL > $100K)</div>';
      html += '<table style="width:100%;font-size:10px;border-collapse:collapse;">';
      html += '<tr style="color:#667;"><th style="text-align:left;padding:2px 4px;">Pool</th><th style="text-align:right;padding:2px 4px;">APY</th><th style="text-align:right;padding:2px 4px;">TVL</th></tr>';

      for (var i = 0; i < top.length; i++) {
        var p = top[i];
        var apyColor = p.apy > 20 ? '#ffaa66' : p.apy > 5 ? '#88ff88' : '#aab';
        var tvl = p.tvlUsd >= 1e6 ? '$' + (p.tvlUsd / 1e6).toFixed(1) + 'M' : '$' + (p.tvlUsd / 1e3).toFixed(0) + 'K';
        html += '<tr>';
        html += '<td style="padding:2px 4px;color:#c8d0e0;">' + (p.project || '') + ' · ' + (p.symbol || '').slice(0, 15) + '</td>';
        html += '<td style="padding:2px 4px;text-align:right;color:' + apyColor + ';">' + p.apy.toFixed(2) + '%</td>';
        html += '<td style="padding:2px 4px;text-align:right;color:#8899aa;">' + tvl + '</td>';
        html += '</tr>';
      }
      html += '</table>';

      // Median APY on Base (real baseline)
      var apys = basePools.filter(function(p){ return p.tvlUsd > 1e6 && p.apy > 0 && p.apy < 100; }).map(function(p){ return p.apy; });
      apys.sort(function(a, b) { return a - b; });
      var median = apys.length ? apys[Math.floor(apys.length / 2)] : 0;

      html += '<div style="margin-top:6px;font-size:9px;color:#667;">';
      html += 'Base median stable APY: <span style="color:#88ccff;">' + median.toFixed(2) + '%</span>';
      html += '</div>';

      html += '<div style="margin-top:6px;font-size:9px;color:#556;font-style:italic;">';
      html += 'Real data from DeFiLlama. Real yield requires real capital.';
      html += '</div>';

      el.innerHTML = html;
    });
  }

  render();
  setInterval(render, 300000);  // 5 min
})();
