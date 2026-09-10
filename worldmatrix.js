// ============================================================
// 4D/5D WORLD MATRIX · Token Neural Core
// Your 4 tokens form the neural center. Synaptic signals fire
// to 28 real entities (chains, DEXes, indexers, banks, DeFi,
// companies) positioned at real geographic coordinates.
// Visualizer. Not a brain. All connections are real listings.
// ============================================================
(function() {
  var canvas = document.getElementById('worldMatrixCanvas');
  var dataEl = document.getElementById('worldMatrixData');
  var modeBtn = document.getElementById('wmModeBtn');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;

  var rot = { x: -0.3, y: 0 };
  var zoom = 1.0;
  var autoSpin = true;
  var dragging = false;
  var lastPos = null;
  var mode = 'earth';
  var tGlobal = 0;

  function resize() {
    var dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ══════════════════════════════════════════════════════════
  // 3D MATH
  // ══════════════════════════════════════════════════════════
  function rotate3(v, rx, ry) {
    var cy = Math.cos(ry), sy = Math.sin(ry);
    var x1 = v[0] * cy + v[2] * sy;
    var z1 = -v[0] * sy + v[2] * cy;
    var cx = Math.cos(rx), sx = Math.sin(rx);
    var y2 = v[1] * cx - z1 * sx;
    var z2 = v[1] * sx + z1 * cx;
    return [x1, y2, z2];
  }

  function latLonTo3D(lat, lon, r) {
    r = r || 1;
    var phi = (90 - lat) * Math.PI / 180;
    var theta = (lon + 180) * Math.PI / 180;
    return [
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    ];
  }

  // ══════════════════════════════════════════════════════════
  // NEURAL CORE · 4 tokens as brain nodes (with real symbols)
  // ══════════════════════════════════════════════════════════
  var TOKENS = [
    { sym: 'PIDX',    label: 'PIDX',            name: 'Pennies Index',    addr: '0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c', color: '#88ccff', freq: 0.618 },
    { sym: 'SGUIDE',  label: 'SGUIDE',          name: 'SPIRIT GUIDE',     addr: '0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a', color: '#aaccff', freq: 1.618 },
    { sym: 'VDOO',    label: 'VDOO',            name: 'VOUDOO Infinity',  addr: '0x38e4f08D08b4D772A7B75669C356b4749dd2d30b', color: '#ffddaa', freq: 2.618 },
    { sym: 'PENNIES', label: 'PENNIES CHEQ ✓',  name: 'PENNIES CHEQ',     addr: '0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7', color: '#ff88cc', freq: 3.618 }
  ];

  function tokenCorePos(i) {
    var tetra = [
      [ 1,  1,  1],
      [ 1, -1, -1],
      [-1,  1, -1],
      [-1, -1,  1]
    ];
    return tetra[i];
  }

  // Real entities with real geo coordinates
  var ENTITIES = [
    { name: 'Base',               lat: 37.775,  lon: -122.419, color: '#88ccff', type: 'chain',    url: 'https://base.org' },
    { name: 'Uniswap',            lat: 40.713,  lon: -74.006,  color: '#ff88cc', type: 'dex',      url: 'https://app.uniswap.org' },
    { name: 'Aerodrome',          lat: 51.507,  lon: -0.128,   color: '#ff88cc', type: 'dex',      url: 'https://aerodrome.finance' },
    { name: 'GeckoTerminal',      lat: 1.352,   lon: 103.820,  color: '#88ff88', type: 'indexer',  url: 'https://www.geckoterminal.com/base/pools' },
    { name: 'DexScreener',        lat: 47.377,  lon: 8.542,    color: '#88ff88', type: 'indexer',  url: 'https://dexscreener.com/base' },
    { name: 'CoinGecko',          lat: 22.319,  lon: 114.169,  color: '#88ff88', type: 'indexer',  url: 'https://www.coingecko.com' },
    { name: 'Basescan',           lat: 25.205,  lon: 55.271,   color: '#aaccff', type: 'explorer', url: 'https://basescan.org' },
    { name: 'Sourcify',           lat: 50.110,  lon: 8.682,    color: '#aaccff', type: 'verify',   url: 'https://sourcify.dev' },
    { name: 'JPMorgan',           lat: 40.713,  lon: -74.006,  color: '#ffddaa', type: 'bank',     url: 'https://www.jpmorgan.com' },
    { name: 'Goldman Sachs',      lat: 40.713,  lon: -74.006,  color: '#ffddaa', type: 'bank',     url: 'https://www.goldmansachs.com' },
    { name: 'BNY Mellon',         lat: 40.713,  lon: -74.006,  color: '#ffddaa', type: 'bank',     url: 'https://www.bnymellon.com' },
    { name: 'Citi',               lat: 40.713,  lon: -74.006,  color: '#ffddaa', type: 'bank',     url: 'https://www.citigroup.com' },
    { name: 'Standard Chartered', lat: 51.507,  lon: -0.128,   color: '#ffddaa', type: 'bank',     url: 'https://www.sc.com' },
    { name: 'Deutsche Bank',      lat: 50.110,  lon: 8.682,    color: '#ffddaa', type: 'bank',     url: 'https://www.db.com' },
    { name: 'BNP Paribas',        lat: 48.857,  lon: 2.352,    color: '#ffddaa', type: 'bank',     url: 'https://group.bnpparibas' },
    { name: 'Fidelity',           lat: 42.360,  lon: -71.058,  color: '#ffddaa', type: 'bank',     url: 'https://www.fidelitydigitalassets.com' },
    { name: 'Aave',               lat: 47.377,  lon: 8.542,    color: '#ffbb88', type: 'defi',     url: 'https://aave.com' },
    { name: 'Compound',           lat: 37.775,  lon: -122.419, color: '#ffbb88', type: 'defi',     url: 'https://compound.finance' },
    { name: 'Morpho',             lat: 48.857,  lon: 2.352,    color: '#ffbb88', type: 'defi',     url: 'https://morpho.org' },
    { name: 'Moonwell',           lat: 37.775,  lon: -122.419, color: '#ffbb88', type: 'defi',     url: 'https://moonwell.fi' },
    { name: 'Curve',              lat: 51.507,  lon: -0.128,   color: '#ffbb88', type: 'defi',     url: 'https://curve.fi' },
    { name: 'Balancer',           lat: 52.520,  lon: 13.405,   color: '#ffbb88', type: 'defi',     url: 'https://balancer.fi' },
    { name: 'Coinbase',           lat: 37.775,  lon: -122.419, color: '#ccbbff', type: 'company',  url: 'https://coinbase.com' },
    { name: 'Circle',             lat: 42.360,  lon: -71.058,  color: '#ccbbff', type: 'company',  url: 'https://circle.com' },
    { name: 'Chainlink',          lat: 40.713,  lon: -74.006,  color: '#ccbbff', type: 'company',  url: 'https://chain.link' },
    { name: 'The Graph',          lat: 37.775,  lon: -122.419, color: '#ccbbff', type: 'company',  url: 'https://thegraph.com' },
    { name: 'Optimism',           lat: 48.857,  lon: 2.352,    color: '#ccbbff', type: 'company',  url: 'https://optimism.io' },
    { name: 'Tether',             lat: 1.352,   lon: 103.820,  color: '#ccbbff', type: 'company',  url: 'https://tether.to' },
    { name: 'Ledger',             lat: 48.857,  lon: 2.352,    color: '#ccbbff', type: 'company',  url: 'https://ledger.com' },
    { name: 'MetaMask',           lat: 42.360,  lon: -71.058,  color: '#ccbbff', type: 'company',  url: 'https://metamask.io' }
  ];

  var WALLETS = [
    { label: 'Main',    addr: '0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C', role: 'vault' },
    { label: 'Session', addr: '0x61AE378019293e2bD6Bb021377DfD03A98B22Ed9', role: 'bot' }
  ];

  var state = { wbData: null, miningData: null };

  function fetchWorldBank() {
    return fetch('https://api.worldbank.org/v2/country/US;GB;DE;FR;JP;CN;IN;BR;SG;AE;CH;HK/indicator/NY.GDP.MKTP.CD?format=json&date=2023&per_page=20')
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) {
        if (!Array.isArray(d) || !d[1]) return null;
        return d[1].map(function(row) { return { country: row.country.value, gdp: row.value }; }).filter(function(r) { return r.gdp; });
      }).catch(function() { return null; });
  }

  function fetchMining() {
    return fetch('https://solofury.com/api-btc/pool')
      .then(function(r) { return r.ok ? r.json() : null; })
      .catch(function() { return null; });
  }

  function shortAddr(a) { return a.slice(0, 6) + '…' + a.slice(-4); }

  // ══════════════════════════════════════════════════════════
  // SYNAPTIC SIGNALS
  // ══════════════════════════════════════════════════════════
  var SIGNALS = [];
  function spawnSignal(fromIdx, toIdx) {
    SIGNALS.push({
      from: fromIdx,
      to: toIdx,
      t: 0,
      speed: 0.008 + Math.random() * 0.012,
      born: tGlobal
    });
  }

  var lastFire = 0;

  // ══════════════════════════════════════════════════════════
  // DATA PANEL
  // ══════════════════════════════════════════════════════════
  function renderData() {
    if (!dataEl) return;
    var h = '';

    h += '<div style="color:#88ccff;font-size:10px;margin-bottom:3px;">🧠 Neural Core · 4 Tokens</div>';
    for (var i = 0; i < TOKENS.length; i++) {
      var t = TOKENS[i];
      h += '<div style="font-size:10px;line-height:1.6;">';
      h += '<span style="color:' + t.color + ';font-weight:600;">' + t.label + '</span> ';
      h += '<span style="color:#8899aa;font-size:9px;">' + t.name + ' · ' + t.freq + ' Hz</span><br>';
      h += '<code style="color:#667;font-size:9px;">' + shortAddr(t.addr) + '</code>';
      h += '</div>';
    }

    h += '<div style="color:#88ff88;font-size:10px;margin-top:10px;margin-bottom:3px;">⚡ Synaptic Mesh · ' + ENTITIES.length + ' real nodes</div>';
    h += '<div style="font-size:9px;color:#8899aa;margin-bottom:4px;">Every signal fires from your tokens to a real listing, bank, DEX, or company.</div>';

    var groups = { chain: '🌐 Chains', dex: '⚡ DEXes', indexer: '📊 Indexers', explorer: '🔍 Explorers',
                   verify: '✅ Verifiers', bank: '🏦 Banks', defi: '💰 DeFi', company: '🏢 Companies' };
    for (var g in groups) {
      var items = ENTITIES.filter(function(e) { return e.type === g; });
      if (items.length === 0) continue;
      h += '<div style="color:#aaccff;font-size:10px;margin-top:8px;margin-bottom:3px;">' + groups[g] + ' (' + items.length + ')</div>';
      for (var j = 0; j < items.length; j++) {
        h += '<div style="font-size:10px;"><a href="' + items[j].url + '" target="_blank" rel="noopener" style="color:#88ff88;text-decoration:none;">' + items[j].name + '</a></div>';
      }
    }

    h += '<div style="color:#ffddaa;font-size:10px;margin-top:10px;margin-bottom:3px;">🔐 Your Wallets</div>';
    for (var k = 0; k < WALLETS.length; k++) {
      h += '<div style="font-size:10px;">' + WALLETS[k].label + ': <code style="color:#ffddaa;">' + shortAddr(WALLETS[k].addr) + '</code></div>';
    }

    if (state.wbData && state.wbData.length) {
      h += '<div style="color:#aaccff;font-size:10px;margin-top:10px;margin-bottom:3px;">🌍 World Bank GDP 2023</div>';
      for (var m = 0; m < Math.min(5, state.wbData.length); m++) {
        h += '<div style="font-size:10px;">' + state.wbData[m].country + ': $' + (state.wbData[m].gdp / 1e12).toFixed(2) + 'T</div>';
      }
    }

    if (state.miningData) {
      var ok = (state.miningData.sources || []).filter(function(s) { return s.ok; });
      h += '<div style="color:#ffddaa;font-size:10px;margin-top:10px;margin-bottom:3px;">⛏️ Mining Regions (live)</div>';
      h += '<div style="font-size:10px;">' + ok.length + ' regions · ' + (state.miningData.totalMiners || 0) + ' miners</div>';
    }

    h += '<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(100,200,255,0.1);font-size:9px;color:#556;font-style:italic;">';
    h += 'Every synapse represents a real, verifiable listing or reference. No partnerships implied.';
    h += '</div>';

    dataEl.innerHTML = h;
  }

  // ══════════════════════════════════════════════════════════
  // EARTH + NEURAL CORE RENDER
  // ══════════════════════════════════════════════════════════
  function drawNeuralEarth(t) {
    var cx = W / 2, cy = H / 2;
    var radius = Math.min(W, H) * 0.35 * zoom;
    var coreR = radius * 0.28;

    if (autoSpin && !dragging) rot.y += 0.0025;

    // Globe glow
    var grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius * 1.15);
    grad.addColorStop(0, 'rgba(30, 60, 120, 0.30)');
    grad.addColorStop(0.7, 'rgba(20, 40, 80, 0.12)');
    grad.addColorStop(1, 'rgba(0, 10, 30, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Lat/lon wireframe
    for (var lat = -60; lat <= 60; lat += 30) {
      var pts = [];
      for (var lon = -180; lon <= 180; lon += 6) {
        var p3 = latLonTo3D(lat, lon);
        var r = rotate3(p3, rot.x, rot.y);
        if (r[2] > 0) continue;
        pts.push([cx + r[0] * radius, cy + r[1] * radius]);
      }
      if (pts.length > 1) {
        ctx.strokeStyle = 'rgba(136, 204, 255, 0.12)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
        ctx.stroke();
      }
    }
    for (var lon2 = -180; lon2 < 180; lon2 += 30) {
      var pts2 = [];
      for (var lat2 = -90; lat2 <= 90; lat2 += 6) {
        var p4 = latLonTo3D(lat2, lon2);
        var r2 = rotate3(p4, rot.x, rot.y);
        if (r2[2] > 0) continue;
        pts2.push([cx + r2[0] * radius, cy + r2[1] * radius]);
      }
      if (pts2.length > 1) {
        ctx.strokeStyle = 'rgba(136, 204, 255, 0.10)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(pts2[0][0], pts2[0][1]);
        for (var k2 = 1; k2 < pts2.length; k2++) ctx.lineTo(pts2[k2][0], pts2[k2][1]);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(136, 204, 255, 0.30)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Token core positions (tetrahedron)
    var corePts = [];
    for (var ti = 0; ti < TOKENS.length; ti++) {
      var tpos = tokenCorePos(ti);
      var rx = Math.sin(tGlobal * 0.5) * 0.3;
      var ry = tGlobal * 0.4;
      var rp = rotate3(tpos, rx, ry);
      corePts.push({
        x: cx + rp[0] * coreR,
        y: cy + rp[1] * coreR,
        z: rp[2],
        token: TOKENS[ti]
      });
    }

    // Entity positions on globe
    var entPts = [];
    for (var ei = 0; ei < ENTITIES.length; ei++) {
      var ent = ENTITIES[ei];
      var p5 = latLonTo3D(ent.lat, ent.lon);
      var r5 = rotate3(p5, rot.x, rot.y);
      entPts.push({
        x: cx + r5[0] * radius,
        y: cy + r5[1] * radius,
        z: r5[2],
        ent: ent,
        visible: r5[2] <= 0
      });
    }

    // Fire new signals
    if (tGlobal - lastFire > 0.05) {
      lastFire = tGlobal;
      for (var f = 0; f < 6; f++) {
        var fromToken = Math.floor(Math.random() * TOKENS.length);
        var toEnt = Math.floor(Math.random() * ENTITIES.length);
        if (entPts[toEnt].visible) spawnSignal(fromToken, toEnt);
      }
    }

    // Static connection lines
    for (var ci = 0; ci < corePts.length; ci++) {
      var cp = corePts[ci];
      for (var cj = 0; cj < entPts.length; cj++) {
        if (!entPts[cj].visible) continue;
        var ep = entPts[cj];
        ctx.strokeStyle = cp.token.color + '08';
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(ep.x, ep.y);
        ctx.stroke();
      }
    }

    // Active signals
    for (var si = SIGNALS.length - 1; si >= 0; si--) {
      var sig = SIGNALS[si];
      sig.t += sig.speed;
      if (sig.t >= 1) { SIGNALS.splice(si, 1); continue; }
      var src = corePts[sig.from];
      var dst = entPts[sig.to];
      if (!dst.visible) continue;

      var et = sig.t < 0.5 ? 2 * sig.t * sig.t : -1 + (4 - 2 * sig.t) * sig.t;
      var sx = src.x + (dst.x - src.x) * et;
      var sy = src.y + (dst.y - src.y) * et;
      var tx = src.x + (dst.x - src.x) * Math.max(0, et - 0.06);
      var ty = src.y + (dst.y - src.y) * Math.max(0, et - 0.06);

      var grad2 = ctx.createLinearGradient(tx, ty, sx, sy);
      grad2.addColorStop(0, src.token.color + '00');
      grad2.addColorStop(1, src.token.color + 'ee');
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      var headGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 5);
      headGrad.addColorStop(0, src.token.color + 'ff');
      headGrad.addColorStop(1, src.token.color + '00');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Entity nodes
    for (var di = 0; di < entPts.length; di++) {
      var dp = entPts[di];
      if (!dp.visible) continue;
      var pulse = 0.7 + Math.sin(t * 1.8 + di) * 0.3;
      var alpha = Math.max(0.4, Math.min(1, 0.6 - dp.z * 0.3));

      var eg = ctx.createRadialGradient(dp.x, dp.y, 0, dp.x, dp.y, 7 * pulse);
      eg.addColorStop(0, dp.ent.color + 'cc');
      eg.addColorStop(1, dp.ent.color + '00');
      ctx.fillStyle = eg;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, 7 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = dp.ent.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, 2 + zoom * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (zoom > 0.9) {
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(220, 235, 255, 0.7)';
        ctx.fillText(dp.ent.name, dp.x + 5, dp.y + 3);
      }
    }

    // Core glow
    var coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.5);
    coreGlow.addColorStop(0, 'rgba(150, 200, 255, 0.15)');
    coreGlow.addColorStop(1, 'rgba(150, 200, 255, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core synaptic web
    for (var a = 0; a < corePts.length; a++) {
      for (var b = a + 1; b < corePts.length; b++) {
        var ca = corePts[a], cb = corePts[b];
        var pulse2 = 0.3 + Math.sin(tGlobal * 3 + a + b) * 0.3;
        var cg = ctx.createLinearGradient(ca.x, ca.y, cb.x, cb.y);
        cg.addColorStop(0, ca.token.color + Math.floor(pulse2 * 200).toString(16).padStart(2, '0'));
        cg.addColorStop(1, cb.token.color + Math.floor(pulse2 * 200).toString(16).padStart(2, '0'));
        ctx.strokeStyle = cg;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(ca.x, ca.y);
        ctx.lineTo(cb.x, cb.y);
        ctx.stroke();
      }
    }

    // Token nodes
    for (var ti2 = 0; ti2 < corePts.length; ti2++) {
      var cp2 = corePts[ti2];
      var pulseSize = 6 + Math.sin(tGlobal * 3 + ti2) * 1.5;

      var tg = ctx.createRadialGradient(cp2.x, cp2.y, 0, cp2.x, cp2.y, pulseSize * 3);
      tg.addColorStop(0, cp2.token.color + 'dd');
      tg.addColorStop(0.4, cp2.token.color + '55');
      tg.addColorStop(1, cp2.token.color + '00');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(cp2.x, cp2.y, pulseSize * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cp2.token.color;
      ctx.beginPath();
      ctx.arc(cp2.x, cp2.y, pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Symbol inside core (use first letter for PIDX/SGUIDE/VDOO, ✓ for PENNIES)
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var letter = cp2.token.sym === 'PENNIES' ? '✓' : cp2.token.sym[0];
      ctx.fillText(letter, cp2.x, cp2.y);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    // Info
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(136, 204, 255, 0.5)';
    ctx.fillText('🧠 Neural Core · ' + SIGNALS.length + ' active signals · ' + ENTITIES.length + ' real nodes · zoom ' + zoom.toFixed(1) + 'x', 10, H - 10);
  }

  // ══════════════════════════════════════════════════════════
  // 5D PENTERACT RENDER
  // ══════════════════════════════════════════════════════════
  var V5 = [];
  for (var i5 = 0; i5 < 32; i5++) {
    V5.push([
      (i5 & 1) ? 1 : -1, (i5 & 2) ? 1 : -1, (i5 & 4) ? 1 : -1,
      (i5 & 8) ? 1 : -1, (i5 & 16) ? 1 : -1
    ]);
  }
  var E5 = [];
  for (var a5 = 0; a5 < 32; a5++) {
    for (var b5 = a5 + 1; b5 < 32; b5++) {
      var d5 = a5 ^ b5;
      if (d5 && !(d5 & (d5 - 1))) E5.push([a5, b5]);
    }
  }

  function rotate5(p, ang) {
    var v = p.slice();
    function r(i, j, th) {
      var c = Math.cos(th), s = Math.sin(th);
      var t2 = v[i] * c - v[j] * s;
      v[j] = v[i] * s + v[j] * c;
      v[i] = t2;
    }
    r(0,1,ang.a); r(0,2,ang.b); r(0,3,ang.c); r(0,4,ang.d);
    r(1,2,ang.e); r(1,3,ang.f); r(1,4,ang.g);
    r(2,3,ang.h); r(2,4,ang.i);
    r(3,4,ang.j);
    return v;
  }

  function proj5(p) {
    var f5 = 4.0 / (4.0 - p[4]);
    var x4 = p[0]*f5, y4 = p[1]*f5, z4 = p[2]*f5, w4 = p[3]*f5;
    var f4 = 3.8 / (3.8 - w4);
    var x3 = x4*f4, y3 = y4*f4, z3 = z4*f4;
    var f3 = 5.0 / (5.0 - z3);
    return [x3*f3, y3*f3, z3];
  }

  function drawPenteract(t) {
    var cx = W / 2, cy = H / 2;
    var scale = Math.min(W, H) * 0.18 * zoom;

    var ang = {
      a: t*0.31, b: t*0.43, c: t*0.57, d: t*0.23,
      e: t*0.19, f: t*0.27, g: t*0.37,
      h: t*0.41, i: t*0.29,
      j: t*0.53
    };

    var pts = [];
    for (var i = 0; i < V5.length; i++) {
      var r = rotate5(V5[i], ang);
      var p = proj5(r);
      pts.push({ xy: [cx + p[0]*scale, cy - p[1]*scale], z: p[2] });
    }

    for (var e = 0; e < E5.length; e++) {
      var a = E5[e][0], b = E5[e][1];
      var z = (pts[a].z + pts[b].z) * 0.5;
      var al = Math.max(0.06, Math.min(0.75, 0.4 + z * 0.3));
      ctx.strokeStyle = 'rgba(136, 204, 255, ' + al + ')';
      ctx.lineWidth = 0.4 + al * 1.1;
      ctx.beginPath();
      ctx.moveTo(pts[a].xy[0], pts[a].xy[1]);
      ctx.lineTo(pts[b].xy[0], pts[b].xy[1]);
      ctx.stroke();
    }

    for (var k = 0; k < pts.length; k++) {
      var z2 = pts[k].z;
      var a2 = Math.max(0.25, Math.min(1.0, 0.5 + z2 * 0.35));
      ctx.fillStyle = 'rgba(255, 220, 150, ' + a2 + ')';
      ctx.beginPath();
      ctx.arc(pts[k].xy[0], pts[k].xy[1], 1.2 + a2 * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Token core
    var coreR = scale * 0.8;
    var corePts = [];
    for (var ti = 0; ti < TOKENS.length; ti++) {
      var tpos = tokenCorePos(ti);
      var rp = rotate3(tpos, Math.sin(t * 0.5) * 0.4, t * 0.5);
      corePts.push({
        x: cx + rp[0] * coreR,
        y: cy + rp[1] * coreR,
        token: TOKENS[ti]
      });
    }

    for (var a2i = 0; a2i < corePts.length; a2i++) {
      for (var b2 = a2i + 1; b2 < corePts.length; b2++) {
        var ca = corePts[a2i], cb = corePts[b2];
        ctx.strokeStyle = ca.token.color + '88';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(ca.x, ca.y);
        ctx.lineTo(cb.x, cb.y);
        ctx.stroke();
      }
    }

    for (var ti2 = 0; ti2 < corePts.length; ti2++) {
      var cp2 = corePts[ti2];
      var pulse = 8 + Math.sin(t * 3 + ti2) * 2;
      var tg = ctx.createRadialGradient(cp2.x, cp2.y, 0, cp2.x, cp2.y, pulse * 2);
      tg.addColorStop(0, cp2.token.color + 'ff');
      tg.addColorStop(1, cp2.token.color + '00');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(cp2.x, cp2.y, pulse * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cp2.token.color;
      ctx.beginPath();
      ctx.arc(cp2.x, cp2.y, pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var letter = cp2.token.sym === 'PENNIES' ? '✓' : cp2.token.sym[0];
      ctx.fillText(letter, cp2.x, cp2.y);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }

    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(136, 204, 255, 0.5)';
    ctx.fillText('5D Penteract · 32 vertices · 80 edges · token core inside · zoom ' + zoom.toFixed(1) + 'x', 10, H - 10);
  }

  // ══════════════════════════════════════════════════════════
  // MAIN LOOP
  // ══════════════════════════════════════════════════════════
  function frame() {
    ctx.clearRect(0, 0, W, H);
    if (mode === 'earth') drawNeuralEarth(tGlobal);
    else drawPenteract(tGlobal);
    tGlobal += 0.008;
    requestAnimationFrame(frame);
  }

  // ══════════════════════════════════════════════════════════
  // INTERACTION
  // ══════════════════════════════════════════════════════════
  function getPos(e) {
    var rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener('mousedown', function(e) { dragging = true; lastPos = getPos(e); autoSpin = false; });
  canvas.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    var p = getPos(e);
    rot.y += (p.x - lastPos.x) * 0.01;
    rot.x += (p.y - lastPos.y) * 0.01;
    rot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rot.x));
    lastPos = p;
  });
  canvas.addEventListener('mouseup', function() { dragging = false; setTimeout(function(){ autoSpin = true; }, 2000); });
  canvas.addEventListener('mouseleave', function() { dragging = false; });

  canvas.addEventListener('touchstart', function(e) { e.preventDefault(); dragging = true; lastPos = getPos(e); autoSpin = false; }, { passive: false });
  canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    if (!dragging) return;
    var p = getPos(e);
    rot.y += (p.x - lastPos.x) * 0.01;
    rot.x += (p.y - lastPos.y) * 0.01;
    rot.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rot.x));
    lastPos = p;
  }, { passive: false });
  canvas.addEventListener('touchend', function() { dragging = false; setTimeout(function(){ autoSpin = true; }, 2000); });

  var lastDist = 0;
  canvas.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var dx = e.touches[0].clientX - e.touches[1].clientX;
      var dy = e.touches[0].clientY - e.touches[1].clientY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (lastDist > 0) zoom = Math.max(0.3, Math.min(5.0, zoom * (dist / lastDist)));
      lastDist = dist;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', function() { lastDist = 0; });

  canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    zoom = Math.max(0.3, Math.min(5.0, zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
  }, { passive: false });

  if (modeBtn) {
    modeBtn.addEventListener('click', function() {
      mode = (mode === 'earth') ? 'penteract' : 'earth';
      modeBtn.textContent = (mode === 'earth') ? '🔷 Switch to 5D Penteract' : '🌍 Switch to 4D Earth';
      zoom = 1.0;
    });
  }

  var resetBtn = document.getElementById('wmResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      zoom = 1.0; rot.x = -0.3; rot.y = 0; autoSpin = true;
    });
  }

  window.addEventListener('resize', resize);
  resize();

  fetchWorldBank().then(function(d) { state.wbData = d; renderData(); });
  fetchMining().then(function(d) { state.miningData = d; renderData(); });
  setInterval(function() {
    fetchWorldBank().then(function(d) { state.wbData = d; renderData(); });
    fetchMining().then(function(d) { state.miningData = d; renderData(); });
  }, 300000);

  frame();
})();
