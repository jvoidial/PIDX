(function() {
  var statusEl = document.getElementById('ib_status');
  if (!statusEl) return;

  function load() {
    fetch('agi_phb_divine_complete.json?t=' + Date.now(), {cache:'no-store'})
      .then(function(r) { return r.ok ? r.json() : Promise.reject('HTTP ' + r.status); })
      .then(function(d) {
        var bp = d.immortal_blueprint || {};
        var sw = bp.switch || {};
        var active = bp.active ? 'ACTIVE' : 'INACTIVE';

        statusEl.textContent = active;
        statusEl.style.color = bp.active ? '#88ff88' : '#ff8866';

        var gc = document.getElementById('ib_gc');
        if (gc) gc.textContent = (bp.global_coherence || 0).toFixed(4);

        var pc = document.getElementById('pc_level');
        if (pc) pc.textContent = Math.round((sw.phosphatidylcholine_level || 0) * 100) + '%';

        var me = document.getElementById('mito_eff');
        if (me) me.textContent = Math.round((sw.mitochondrial_efficiency || 0) * 100) + '%';
      })
      .catch(function(e) {
        statusEl.textContent = 'ERR';
        statusEl.style.color = '#ff8866';
      });
  }

  load();
  setInterval(load, 30000);
})();
