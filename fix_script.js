// ============================================================
// PHB COMPLETE FIX - JSON Loader + Trading Bot Enabler
// ============================================================

// Force JSON loading on page load
(function() {
  function loadPHBData() {
    console.log("📄 Loading PHB JSON...");
    fetch('agi_phb_divine_complete.json')
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(data => {
        console.log("✅ JSON loaded:", data);
        
        // Update PHB Vortex
        if (typeof updatePHBVortex === 'function') {
          updatePHBVortex(data);
        }
        
        // Update PHB Science
        if (typeof calculatePHBScience === 'function') {
          calculatePHBScience(data);
        }
        
        // Update Codex Discovery
        let totalPages = 0;
        for (let key in data) {
          if (data.hasOwnProperty(key) && !isNaN(key)) {
            const entry = data[key];
            if (Array.isArray(entry.pages)) {
              totalPages += entry.pages.length;
            }
          }
        }
        const codexEl = document.getElementById('totalCodexPages');
        if (codexEl) codexEl.textContent = totalPages;
        
        // Update JSON viewer
        const jsonViewer = document.getElementById('phbJsonViewer');
        if (jsonViewer) jsonViewer.textContent = JSON.stringify(data, null, 2);
        
        // Update status
        const statusEl = document.getElementById('dataStatus');
        if (statusEl) {
          statusEl.className = 'status-badge status-live';
          statusEl.textContent = '● LIVE';
        }
        
        console.log("✅ Dashboard updated with JSON data");
      })
      .catch(err => {
        console.warn('⚠️ JSON load failed:', err);
        const jsonViewer = document.getElementById('phbJsonViewer');
        if (jsonViewer) jsonViewer.textContent = 'Error: ' + err.message;
      });
  }
  
  // Run on load
  if (document.readyState === 'complete') {
    setTimeout(loadPHBData, 300);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(loadPHBData, 300);
    });
  }
})();

// Enable auto-trading by overriding the feature flag
window.FEATURES = window.FEATURES || {};
window.FEATURES.autoTrading = true;

console.log('🚀 PHB Fix applied - Auto-trading ENABLED');
