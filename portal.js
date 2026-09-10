(function() {
  var el = document.getElementById('portalCard');
  if (!el) return;

  function gateIcon(status) {
    return status === 'open' ? '🟢' : '🔴';
  }

  function render(d) {
    var h = '';
    var ethUsd = d.eth_usd ? '$' + d.eth_usd.toFixed(2) : '—';
    var baseTvl = d.base_tvl_usd ? '$' + (d.base_tvl_usd / 1e9).toFixed(2) + 'B' : '—';

    h += '<div style="color:#bb99ff;">ETH: ' + ethUsd + ' · Base TVL: ' + baseTvl + '</div>';
    h += '<div style="margin-top:6px;border-top:1px solid rgba(150,100,255,0.15);padding-top:6px;"></div>';

    var tokens = d.tokens || {};
    for (var sym in tokens) {
      var t = tokens[sym];
      var gates = t.gates || {};
      var gateLine = '';
      for (var name in gates) {
        var g = gates[name];
        gateLine += gateIcon(g.status) + ' ';
      }

      var gt = gates.geckoterminal || {};
      var price = (gt.data && gt.data.price_usd) ? '$' + parseFloat(gt.data.price_usd).toFixed(8) : '—';
      var pools = (gates.gt_pools && gates.gt_pools.data && gates.gt_pools.data.count) || 0;

      h += '<div style="margin-top:4px;">';
      h += '<b style="color:#ddc8ff;">' + sym + '</b> ';
      h += '<span style="color:#88ff88;font-size:10px;">' + gateLine + '</span> ';
      h += '<span style="color:#aab;">' + price + ' · ' + pools + ' pools</span>';
      h += '</div>';
    }

    h += '<div style="color:#776699;font-size:9px;margin-top:6px;font-style:italic;">';
    h += 'Opened ' + new Date(d.timestamp * 1000).toLocaleTimeString() + '</div>';
    el.innerHTML = h;
  }

  function load() {
    fetch('portal.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
      .then(render)
      .catch(function(e) {
        el.innerHTML = '<span style="color:#ff8866;">Portal closed — ' + e + '</span>';
      });
  }
  load();
  setInterval(load, 60000);
})();
