// ===== TIME-SERIES HISTORY =====
(function() {
  const HISTORY_KEY = 'phb_history';
  const MAX_POINTS = 100;
  function getHistory() {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : { coherence: [], nodes: [], timestamps: [] };
    } catch { return { coherence: [], nodes: [], timestamps: [] }; }
  }
  function saveHistory(coherence, nodes) {
    const history = getHistory();
    const now = Date.now();
    history.timestamps.push(now);
    history.coherence.push(coherence);
    history.nodes.push(nodes);
    if (history.timestamps.length > MAX_POINTS) {
      history.timestamps.shift();
      history.coherence.shift();
      history.nodes.shift();
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    return history;
  }
  function formatTime(ts) {
    const d = new Date(ts);
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }
  document.addEventListener('DOMContentLoaded', function() {
    const history = getHistory();
    const labels = history.timestamps.map(formatTime);
    const ctx1 = document.getElementById('coherenceChart')?.getContext('2d');
    const ctx2 = document.getElementById('nodesChart')?.getContext('2d');
    if (ctx1) {
      new Chart(ctx1, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Coherence',
            data: history.coherence,
            borderColor: '#88aaff',
            backgroundColor: 'rgba(136,170,255,0.1)',
            tension: 0.2,
            fill: true,
            pointRadius: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#aaa' } } },
          scales: {
            x: { ticks: { color: '#666', maxTicksLimit: 10 } },
            y: { ticks: { color: '#666' } }
          }
        }
      });
    }
    if (ctx2) {
      new Chart(ctx2, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Nodes',
            data: history.nodes,
            borderColor: '#ffd700',
            backgroundColor: 'rgba(255,215,0,0.1)',
            tension: 0.2,
            fill: true,
            pointRadius: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#aaa' } } },
          scales: {
            x: { ticks: { color: '#666', maxTicksLimit: 10 } },
            y: { ticks: { color: '#666' } }
          }
        }
      });
    }
  });
  window._recordHistory = function(coherence, nodes) {
    if (coherence > 0 && nodes > 0) {
      saveHistory(coherence, nodes);
    }
  };
  // Override updateUI to record history
  const origUpdate = window.updateUI;
  window.updateUI = function(d) {
    if (origUpdate) origUpdate(d);
    let co = 0, nodes = 0;
    if (d && d.pages && d.pages.length > 0) {
      co = parseFloat(d.pages[0].coherence) || 0;
    }
    const nodeEl = document.getElementById('nodeCount');
    if (nodeEl) nodes = parseInt(nodeEl.textContent) || 0;
    if (co > 0 && nodes > 0) {
      window._recordHistory(co, nodes);
    }
  };
  const origFetch = window.fetchAllFeeds || function() {};
  window.fetchAllFeeds = function() {
    origFetch();
    setTimeout(() => {
      const coherenceEl = document.getElementById('coherenceLevel');
      const nodeEl = document.getElementById('nodeCount');
      const co = parseFloat(coherenceEl?.textContent) || 0;
      const nodes = parseInt(nodeEl?.textContent) || 0;
      if (co > 0 && nodes > 0) window._recordHistory(co, nodes);
    }, 500);
  };
})();