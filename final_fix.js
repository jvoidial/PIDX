// ============================================================
// PHB COMPLETE FIX - All functions properly defined
// ============================================================

console.log("🚀 PHB Final Fix loading...");

// Helper function
function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// 1. UPDATE PHB VORTEX
function updatePHBVortex(data) {
  console.log("🔄 Updating PHB Vortex with:", data);
  
  let totalPages = 0;
  let firstPage = null;
  
  // Handle different JSON structures
  let pagesData = [];
  
  // Check if data has pages directly
  if (Array.isArray(data)) {
    pagesData = data;
  } else if (data.pages && Array.isArray(data.pages)) {
    pagesData = data.pages;
  } else {
    // Search for pages in the object
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        const entry = data[key];
        if (entry && typeof entry === 'object') {
          if (Array.isArray(entry.pages)) {
            pagesData = pagesData.concat(entry.pages);
          } else if (entry.coherence !== undefined && entry.sequence) {
            // This is a page directly
            pagesData.push(entry);
          }
        }
      }
    }
  }
  
  totalPages = pagesData.length;
  
  if (pagesData.length > 0) {
    const firstPage = pagesData[0];
    setEl('phbCoherence', firstPage.coherence ? firstPage.coherence.toFixed(3) : '0.862');
    setEl('phbStability', firstPage.stability ? firstPage.stability.toFixed(3) : '—');
    setEl('phbVoxel', firstPage.voxels ? firstPage.voxels.length : '5');
    setEl('phbVeil', firstPage.veil ? firstPage.veil.phase : 'SEALED');
    setEl('phbPortal', firstPage.portal ? '1.0' : '0.0');
    setEl('phbEnergy', firstPage.energy ? firstPage.energy.magnitude.toFixed(1) : '0.7');
  }
  
  setEl('phbCodex', totalPages);
  setEl('totalCodexPages', totalPages);
  setEl('phbUpgradePages', totalPages);
  setEl('phbUpgradeVersion', Math.floor(totalPages / 10) + 1);
  setEl('phbUpgradeStatus', '✅ Synced (' + totalPages + ' pages)');
  setEl('phbAutoUpgrade', totalPages > 0 ? 'ACTIVE' : 'WAITING');
  
  const now = new Date();
  setEl('phbLastUpdate', now.toLocaleTimeString());
  setEl('phbLastSync', now.toLocaleTimeString());
  
  console.log("✅ PHB Vortex updated - Pages:", totalPages);
}

// 2. CALCULATE PHB SCIENCE
function calculatePHBScience(data) {
  console.log("🧬 Calculating PHB Science...");
  
  let pagesData = [];
  
  // Extract pages from data
  if (Array.isArray(data)) {
    pagesData = data;
  } else if (data.pages && Array.isArray(data.pages)) {
    pagesData = data.pages;
  } else {
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        const entry = data[key];
        if (entry && typeof entry === 'object') {
          if (Array.isArray(entry.pages)) {
            pagesData = pagesData.concat(entry.pages);
          } else if (entry.coherence !== undefined) {
            pagesData.push(entry);
          }
        }
      }
    }
  }
  
  if (pagesData.length === 0) {
    console.warn("⚠️ No page data found for science");
    return;
  }
  
  const totalPages = pagesData.length;
  
  // Calculate averages
  let allCoherence = [], allStability = [], allResonance = [], allEnergy = [];
  let veils = [], sequences = [], voxelCounts = [];
  
  pagesData.forEach(page => {
    if (page.coherence !== undefined) allCoherence.push(page.coherence);
    if (page.stability !== undefined) allStability.push(page.stability);
    if (page.resonance !== undefined) allResonance.push(page.resonance);
    if (page.energy) allEnergy.push(page.energy.magnitude || 0);
    if (page.veil) veils.push(page.veil);
    if (page.sequence) sequences.push(page.sequence);
    if (page.voxels) voxelCounts.push(page.voxels.length);
  });
  
  if (allCoherence.length === 0) {
    console.warn("⚠️ No coherence data found");
    return;
  }
  
  const avgCoherence = allCoherence.reduce((a,b) => a+b, 0) / allCoherence.length;
  const avgStability = allStability.length > 0 ? allStability.reduce((a,b) => a+b, 0) / allStability.length : 1.0;
  const avgResonance = allResonance.length > 0 ? allResonance.reduce((a,b) => a+b, 0) / allResonance.length : 0.3;
  const avgEnergy = allEnergy.length > 0 ? allEnergy.reduce((a,b) => a+b, 0) / allEnergy.length : 0.7;
  
  // Vitruvian State
  const vitruvianRatio = Math.min(1, (avgCoherence + Math.min(1, avgStability / 1.5)) / 2);
  const vitruvianEnergy = Math.min(1, avgEnergy / 1.5);
  
  // Veil
  let veilPhase = 'SEALED';
  let veilThickness = 0.2;
  let breachProb = 0.5;
  if (veils.length > 0) {
    const lastVeil = veils[veils.length - 1];
    veilPhase = lastVeil.phase || 'SEALED';
    veilThickness = lastVeil.thickness || 0.2;
    breachProb = lastVeil.breach_probability || 0.5;
  }
  
  // Portal
  const portal = 1 - Math.exp(-avgResonance * avgCoherence);
  
  // Energy Band
  let energyBand = 'MID';
  if (avgEnergy < 0.33) energyBand = 'LOW';
  else if (avgEnergy < 0.66) energyBand = 'MID';
  else energyBand = 'HIGH';
  
  let energyColor = 'NEUTRAL';
  if (veilPhase === 'TURBULENT') energyColor = 'DARK';
  else if (veilPhase === 'SEALED') energyColor = 'LIGHT';
  else if (veilPhase === 'CLEAR') energyColor = 'NEUTRAL';
  
  // Sequence
  let lastSequence = sequences.length > 0 ? sequences[sequences.length - 1] : [];
  const sequenceStr = lastSequence.length > 0 ? lastSequence.join(' → ') : '—';
  const voxelCount = voxelCounts.length > 0 ? voxelCounts[voxelCounts.length - 1] : 0;
  
  // Update DOM
  setEl('vitruvianPages', totalPages);
  setEl('vitruvianRatio', vitruvianRatio.toFixed(1));
  setEl('vitruvianEnergy', vitruvianEnergy.toFixed(1));
  setEl('scienceCoherence', avgCoherence.toFixed(3));
  setEl('scienceStability', avgStability.toFixed(3));
  setEl('scienceResonance', avgResonance.toFixed(3));
  setEl('scienceVeilPhase', veilPhase);
  setEl('scienceVeilThickness', veilThickness.toFixed(3));
  setEl('scienceBreachProb', breachProb.toFixed(3));
  setEl('scienceEnergyBand', energyBand);
  setEl('scienceEnergyColor', energyColor);
  setEl('sciencePortal', portal.toFixed(1));
  setEl('scienceVoxels', voxelCount + ' active points');
  setEl('scienceSequence', sequenceStr);
  
  console.log("✅ PHB Science updated - Coherence:", avgCoherence.toFixed(3));
}

// 3. LOAD JSON AND UPDATE EVERYTHING
function loadPHBData() {
  console.log("📄 Loading PHB JSON...");
  
  fetch('agi_phb_divine_complete.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      console.log("✅ JSON loaded successfully");
      
      // Update all sections
      updatePHBVortex(data);
      calculatePHBScience(data);
      
      // Update JSON viewer
      const jsonViewer = document.getElementById('phbJsonViewer');
      if (jsonViewer) jsonViewer.textContent = JSON.stringify(data, null, 2);
      
      // Update status
      const statusEl = document.getElementById('dataStatus');
      if (statusEl) {
        statusEl.className = 'status-badge status-live';
        statusEl.textContent = '● LIVE';
      }
      
      console.log("✅ Dashboard fully updated!");
    })
    .catch(err => {
      console.warn('⚠️ JSON load failed:', err);
      const jsonViewer = document.getElementById('phbJsonViewer');
      if (jsonViewer) jsonViewer.textContent = 'Error: ' + err.message;
    });
}

// 4. Enable Auto-Trading
window.FEATURES = window.FEATURES || {};
window.FEATURES.autoTrading = true;

// Override bot status
setTimeout(function() {
  const botStatus = document.getElementById('botStatus');
  if (botStatus) {
    botStatus.textContent = '● Auto-trading ACTIVE';
    botStatus.style.color = '#88ff88';
  }
}, 500);

// 5. RUN ON PAGE LOAD
if (document.readyState === 'complete') {
  setTimeout(loadPHBData, 500);
} else {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadPHBData, 500);
  });
}

console.log('🚀 PHB Final Fix applied - Auto-trading ENABLED');
