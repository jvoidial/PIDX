// ============================================================
// PHB PAPER TRADER · Real prices, real signal logic, honest PnL
// Reads ETH spot from CoinGecko, computes edge from PHB metrics.
// No keys. No real orders. Clearly labeled as a paper simulation.
// ============================================================
(function() {
  var S = {
    eth: 0, prevEth: 0,
    coherence: 0.862, stability: 1.111, resonance: 0.377,
    signal: 'NEUTRAL', edge: 0, position: null, trades: [],
    totalPnl: 0, wins: 0, losses: 0, lastTick: 0, avgWindow: [], running: true
  };
  var STORAGE_KEY = 'phb_paper_trader_v1';
  var MAX_TRADES = 50, TRADE_SIZE_USD = 100;
  var MIN_EDGE = 0.5, TAKE_PROFIT_PCT = 0.4, STOP_LOSS_PCT = 0.3;

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ trades: S.trades.slice(-MAX_TRADES), totalPnl: S.totalPnl, wins: S.wins, losses: S.losses })); } catch (e) {}
  }
  function load() {
    try { var raw = localStorage.getItem(STORAGE_KEY); if (!raw) return; var d = JSON.parse(raw); S.trades = d.trades || []; S.totalPnl = d.totalPnl || 0; S.wins = d.wins || 0; S.losses = d.losses || 0; } catch (e) {}
  }
  function fetchEth() {
    return fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then(function(r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
      .then(function(d) { return d.ethereum ? d.ethereum.usd : null; }).catch(function() { return null; });
  }
  function fetchPHB() {
    return fetch('agi_phb_divine_complete.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function(r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
      .then(function(d) {
        var bp = d.immortal_blueprint || {};
        var page = (d['1'] && d['1'].pages && d['1'].pages[0]) || {};
        if (bp.global_coherence != null) S.coherence = bp.global_coherence;
        if (page.stability) S.stability = page.stability;
        if (page.resonance) S.resonance = page.resonance;
      }).catch(function() {});
  }
  function computeEdge() {
    if (S.avgWindow.length < 3) return 0;
    var recent = S.avgWindow.slice(-6);
    var avg = recent.reduce(function(a, b) { return a + b; }, 0) / recent.length;
    var momentum = (S.eth - avg) / avg;
    var signal = momentum * S.coherence * S.resonance * 100;
    return Math.max(-10, Math.min(10, signal / Math.max(1, S.stability)));
  }
  function tick() {
    if (!S.running) return;
    if (S.eth > 0) { S.avgWindow.push(S.eth); if (S.avgWindow.length > 60) S.avgWindow.shift(); }
    S.edge = computeEdge();
    if (S.edge > MIN_EDGE) S.signal = 'BUY'; else if (S.edge < -MIN_EDGE) S.signal = 'SELL'; else S.signal = 'NEUTRAL';
    if (S.position) {
      var changePct = (S.eth - S.position.entry) / S.position.entry * 100 * (S.position.side === 'BUY' ? 1 : -1);
      if (changePct >= TAKE_PROFIT_PCT || changePct <= -STOP_LOSS_PCT) { closePosition(changePct); }
    } else {
      if (S.signal === 'BUY' || S.signal === 'SELL') { S.position = { side: S.signal, entry: S.eth, time: Date.now() }; }
    }
    updateUI();
  }
  function closePosition(changePct) {
    var pnl = changePct / 100 * TRADE_SIZE_USD;
    var trade = { side: S.position.side, entry: S.position.entry, exit: S.eth, pnl: pnl, pct: changePct, time: Date.now() };
    S.trades.push(trade); if (S.trades.length > MAX_TRADES) S.trades.shift();
    S.totalPnl += pnl; if (pnl > 0) S.wins++; else S.losses++;
    S.position = null; save();
  }
  function updateUI() {
    var set = function(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    var pnlEl = document.getElementById('simTotalPnl');
    if (pnlEl) { pnlEl.textContent = (S.totalPnl >= 0 ? '$' : '-$') + Math.abs(S.totalPnl).toFixed(2); pnlEl.style.color = S.totalPnl >= 0 ? '#88ff88' : '#ff8866'; }
    var total = S.wins + S.losses;
    set('simWinRate', (total > 0 ? (S.wins / total * 100).toFixed(1) : '0.0') + '%');
    set('simAvgTrade', (S.totalPnl / Math.max(1, total) >= 0 ? '$' : '-$') + Math.abs(S.totalPnl / Math.max(1, total)).toFixed(2));
    var recent = S.trades.filter(function(t) { return Date.now() - t.time < 3600000; });
    set('simTradesPerHour', recent.length);
    var sigEl = document.getElementById('simSignal');
    if (sigEl) { sigEl.textContent = S.signal; sigEl.style.color = S.signal === 'BUY' ? '#88ff88' : S.signal === 'SELL' ? '#ff8866' : '#88ccff'; }
    set('simEdge', S.edge.toFixed(2) + '%');
    set('simEthPrice', '$' + S.eth.toFixed(2));
    var feed = document.getElementById('simTradeFeed');
    if (feed) {
      if (S.trades.length === 0) { feed.innerHTML = '<div style="color:#667;">No trades yet — waiting for signal</div>'; }
      else {
        var html = '';
        for (var i = S.trades.slice(-3).reverse().length - 1; i >= 0; i--) {
          var t = S.trades.slice(-3).reverse()[i];
          var color = t.pnl >= 0 ? '#88ff88' : '#ff8866';
          var sign = t.pnl >= 0 ? '+' : '';
          var ts = new Date(t.time).toLocaleTimeString();
          html += '<div style="font-size:10px;color:#aab;">' + ts + ' <span style="color:' + (t.side === 'BUY' ? '#88ff88' : '#ff8866') + ';">' + t.side + '</span> @ $' + t.entry.toFixed(2) + ' → $' + t.exit.toFixed(2) + ' <span style="color:' + color + ';">' + sign + '$' + t.pnl.toFixed(2) + '</span></div>';
        }
        feed.innerHTML = html;
      }
    }
  }
  function mainLoop() {
    fetchEth().then(function(price) { if (price) { S.prevEth = S.eth; S.eth = price; tick(); } });
  }
  window.phbResetTrader = function() {
    S.trades = []; S.totalPnl = 0; S.wins = 0; S.losses = 0; S.position = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    updateUI();
  };
  window.phbPauseTrader = function() { S.running = !S.running; };
  load(); fetchPHB(); mainLoop();
  setInterval(mainLoop, 20000); setInterval(fetchPHB, 60000);
})();
