// ============================================================
// MINING POOLS · Real stratum URLs + live pool stats
// Shows where people can point their ASIC to start mining.
// ============================================================
(function() {
  var el = document.getElementById('miningPoolsCard');
  if (!el) return;

  // Real mining pools with public stratum endpoints
  var POOLS = [
    {
      name: 'SoloFury',
      url: 'https://solofury.com',
      api: 'https://solofury.com/api-btc/pool',
      fee: '1%',
      payout: 'Solo',
      type: 'Multi-coin',
      stratum: 'stratum+tcp://pool.solofury.com:3333',
      stratumSSL: 'stratum+ssl://pool.solofury.com:4333',
      login: '<btc-address>.<worker-name>',
      password: 'x',
      note: 'No signup, no KYC. Solo mining for everyone.'
    },
    {
      name: 'Ocean',
      url: 'https://ocean.xyz',
      api: 'https://api.ocean.xyz/v1/stats/pool',
      fee: '2% (1% with DATUM)',
      payout: 'TIDES (non-custodial)',
      type: 'BTC',
      stratum: 'stratum+tcp://ocean.xyz:3334',
      stratumSSL: 'stratum+ssl://ocean.xyz:3335',
      login: '<btc-address>.<worker>',
      password: 'x',
      note: 'Backed by Jack Dorsey. Non-custodial. No account.'
    },
    {
      name: 'Braiins Pool',
      url: 'https://pool.braiins.com',
      api: null,
      fee: '0% (with Braiins OS) / 2% FPPS',
      payout: 'FPPS',
      type: 'BTC',
      stratum: 'stratum+tcp://stratum.braiins.com:3333',
      stratumSSL: 'stratum+ssl://stratum.braiins.com:443',
      login: '<braiins-username>.<worker>',
      password: 'x',
      note: 'World\'s first mining pool. Free firmware for ASICs.'
    },
    {
      name: 'F2Pool',
      url: 'https://www.f2pool.com',
      api: null,
      fee: '2.5% FPPS / 2% PPLNS',
      payout: 'FPPS / PPLNS',
      type: 'BTC, LTC, ETHW, many',
      stratum: 'stratum+tcp://btc.f2pool.com:1314',
      stratumSSL: 'stratum+ssl://btc.f2pool.com:4334',
      login: '<f2pool-username>.<worker>',
      password: 'x',
      note: 'Since 2013. Global servers. Multi-coin.'
    },
    {
      name: 'ViaBTC',
      url: 'https://www.viabtc.com',
      api: 'https://www.viabtc.com/res/pool/btc/stats',
      fee: '4% PPS+ / 2% PPLNS',
      payout: 'PPS+ / PPLNS',
      type: 'BTC, LTC, ZEC, KAS',
      stratum: 'stratum+tcp://btc.viabtc.io:3333',
      stratumSSL: 'stratum+ssl://btc.viabtc.io:443',
      login: '<viabtc-account>.<worker>',
      password: 'x',
      note: 'Merged mining. Stable payouts.'
    }
  ];

  function fmtHash(h) {
    if (!h || isNaN(h)) return '—';
    h = Number(h);
    if (h >= 1e18) return (h / 1e18).toFixed(2) + ' EH/s';
    if (h >= 1e15) return (h / 1e15).toFixed(2) + ' PH/s';
    if (h >= 1e12) return (h / 1e12).toFixed(2) + ' TH/s';
    return h.toFixed(0) + ' H/s';
  }

  function fetchPool(p) {
    if (!p.api) return Promise.resolve(null);
    return fetch(p.api, { cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : null; })
      .catch(function() { return null; });
  }

  function render(stats) {
    var h = '';

    h += '<div style="font-size:10px;color:#8899aa;margin-bottom:8px;font-style:italic;">';
    h += 'Point your ASIC/miner to any of these pools. All stratum URLs are public.';
    h += '</div>';

    for (var i = 0; i < POOLS.length; i++) {
      var p = POOLS[i];
      var s = stats[i];

      h += '<div style="background:rgba(0,0,0,0.35);border-radius:6px;padding:8px;margin-bottom:8px;">';

      // Header
      h += '<div style="display:flex;justify-content:space-between;align-items:baseline;">';
      h += '<div style="color:#ffddaa;font-weight:600;font-size:12px;">' + p.name + '</div>';
      h += '<div style="font-size:9px;color:#88ff88;">Fee: ' + p.fee + '</div>';
      h += '</div>';

      // Type + payout
      h += '<div style="font-size:9px;color:#8899aa;margin-bottom:4px;">';
      h += p.type + ' · ' + p.payout;
      h += '</div>';

      // Stratum URLs — the key info
      h += '<div style="font-family:monospace;font-size:9px;color:#88ccff;background:rgba(0,20,40,0.5);padding:4px;border-radius:3px;margin:4px 0;">';
      h += '<div>📡 ' + p.stratum + '</div>';
      if (p.stratumSSL) h += '<div>🔒 ' + p.stratumSSL + '</div>';
      h += '</div>';

      // Login format
      h += '<div style="font-size:9px;color:#c8d0e0;margin-top:4px;">';
      h += '<span style="color:#667;">Login:</span> <code style="color:#88ff88;">' + p.login + '</code>';
      h += '<br><span style="color:#667;">Password:</span> <code style="color:#88ff88;">' + p.password + '</code> <span style="color:#667;">(any value)</span>';
      h += '</div>';

      // Live stats if available
      if (s) {
        h += '<div style="font-size:9px;color:#88ccff;margin-top:4px;">';
        if (s.totalHashRate) h += '<span>Pool: ' + fmtHash(s.totalHashRate) + '</span> · ';
        if (s.totalMiners) h += '<span>' + s.totalMiners + ' miners</span>';
        h += '</div>';
      }

      // Note
      if (p.note) {
        h += '<div style="font-size:9px;color:#8899aa;margin-top:4px;font-style:italic;">';
        h += p.note;
        h += '</div>';
      }

      // Website link
      h += '<div style="margin-top:6px;">';
      h += '<a href="' + p.url + '" target="_blank" rel="noopener" style="display:inline-block;padding:3px 10px;background:rgba(255,220,150,0.1);border:1px solid rgba(255,220,150,0.3);border-radius:4px;color:#ffddaa;text-decoration:none;font-size:9px;">Open pool →</a>';
      h += '</div>';

      h += '</div>';
    }

    // Instructions
    h += '<div style="margin-top:8px;font-size:9px;color:#556;border-top:1px solid rgba(255,220,150,0.15);padding-top:6px;font-style:italic;">';
    h += 'To start mining: get an ASIC or rent hashrate, then enter the stratum URL + your BTC address + worker name into the miner config.';
    h += '</div>';

    el.innerHTML = h;
  }

  function load() {
    el.innerHTML = '<div style="color:#667;">Loading mining pools…</div>';
    Promise.all(POOLS.map(fetchPool)).then(render).catch(function() { render([]); });
  }

  load();
  setInterval(load, 300000);  // refresh every 5 min
})();
