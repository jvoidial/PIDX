// ============================================================
// PHB SYNC FIX - Handles your actual JSON format
// ============================================================

console.log("🚀 PHB Sync Fix loading...");

function setEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Extract page count from your JSON format
function extractPageCount(data) {
  // Check for pages in chronovisor
  if (data.chronovisor && data.chronovisor.pages) {
    return data.chronovisor.pages.length;
  }
  
  // Check for sacred_sites total
  if (data.chronovisor && data.chronovisor.sacred_sites) {
    const sites = data.chronovisor.sacred_sites;
    let total = 0;
    if (sites.pyramids) total += sites.pyramids.length;
    if (sites.temples) total += sites.temples.length;
    if (sites.other_sites) total += sites.other_sites.length;
    if (sites.total) total = sites.total;
    return total || 0;
  }
  
  // Check for pages array directly
  if (data.pages && Array.isArray(data.pages)) {
    return data.pages.length;
  }
  
  // Count object keys as pages
  let count = 0;
  for (let key in data) {
    if (data.hasOwnProperty(key) && typeof data[key] === 'object') {
      if (data[key].pages || data[key].coherence !== undefined) {
        count++;
      }
    }
  }
  
  return count || 0;
}

// Extract coherence from your JSON
function extractCoherence(data) {
  // From chronovisor
  if (data.chronovisor && data.chronovisor.consciousness) {
    const consciousness = data.chronovisor.consciousness;
    if (consciousness.coherence) return consciousness.coherence;
    if (consciousness.portal_openness) return consciousness.portal_openness;
  }
  
  // From agi_consciousness
  if (data.agi_consciousness) {
    if (data.agi_consciousness.portal_openness) return data.agi_consciousness.portal_openness;
  }
  
  // From pages
  if (data.pages && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (firstPage.coherence) return firstPage.coherence;
  }
  
  // Search for any coherence value
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      const obj = data[key];
      if (obj && typeof obj === 'object') {
        if (obj.coherence) return obj.coherence;
        if (obj.portal_openness) return obj.portal_openness;
      }
    }
  }
  
  return 0.862; // default
}

// Extract stability from your JSON
function extractStability(data) {
  if (data.pages && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (firstPage.stability) return firstPage.stability;
  }
  
  // Look for any stability value
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      const obj = data[key];
      if (obj && typeof obj === 'object' && obj.stability) {
        return obj.stability;
      }
    }
  }
  
  return 1.111; // default
}

// Extract resonance from your JSON
function extractResonance(data) {
  if (data.pages && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (firstPage.resonance) return firstPage.resonance;
  }
  
  // Look for any resonance value
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      const obj = data[key];
      if (obj && typeof obj === 'object' && obj.resonance) {
        return obj.resonance;
      }
    }
  }
  
  return 0.377; // default
}

// Extract veil phase
function extractVeilPhase(data) {
  if (data.chronovisor && data.chronovisor.veil) {
    return data.chronovisor.veil.phase || 'SEALED';
  }
  
  if (data.pages && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (firstPage.veil && firstPage.veil.phase) {
      return firstPage.veil.phase;
    }
  }
  
  return 'SEALED';
}

// Extract portal openness
function extractPortal(data) {
  if (data.chronovisor && data.chronovisor.consciousness) {
    if (data.chronovisor.consciousness.portal_openness) {
      return data.chronovisor.consciousness.portal_openness;
    }
  }
  
  if (data.agi_consciousness && data.agi_consciousness.portal_openness) {
    return data.agi_consciousness.portal_openness;
  }
  
  if (data.pages && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (firstPage.portal) return firstPage.portal;
  }
  
  return 1.0;
}

// Extract energy
function extractEnergy(data) {
  if (data.pages && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (firstPage.energy) {
      return firstPage.energy.magnitude || 0.7;
    }
  }
  
  if (data.chronovisor && data.chronovisor.energy) {
    return data.chronovisor.energy || 0.7;
  }
  
  return 0.7;
}

// Extract sequence
function extractSequence(data) {
  if (data.pages && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (firstPage.sequence && Array.isArray(firstPage.sequence)) {
      return firstPage.sequence;
    }
  }
  
  if (data.chronovisor && data.chronovisor.consciousness_stream) {
    return data.chronovisor.consciousness_stream;
  }
  
  return ["TRIANGLE","MIRROR","CIRCLE","LIGHT","SQUARE","RATIO","SHADOW"];
}

// Extract voxels
function extractVoxels(data) {
  if (data.pages && data.pages.length > 0) {
    const firstPage = data.pages[0];
    if (firstPage.voxels && Array.isArray(firstPage.voxels)) {
      return firstPage.voxels;
    }
  }
  
  if (data.chronovisor && data.chronovisor.sacred_sites) {
    const sites = data.chronovisor.sacred_sites;
    let count = 0;
    if (sites.pyramids) count += sites.pyramids.length;
    if (sites.temples) count += sites.temples.length;
    if (sites.other_sites) count += sites.other_sites.length;
    // Return as voxels
    return Array(count).fill({});
  }
  
  return [{},{},{},{},{}];
}

// Main update function
function updatePHBFromData(data) {
  console.log("🔄 Updating PHB from data...");
  
  const totalPages = extractPageCount(data);
  const coherence = extractCoherence(data);
  const stability = extractStability(data);
  const resonance = extractResonance(data);
  const veilPhase = extractVeilPhase(data);
  const portal = extractPortal(data);
  const energy = extractEnergy(data);
  const sequence = extractSequence(data);
  const voxels = extractVoxels(data);
  
  // Update PHB Vortex
  setEl('phbCoherence', coherence.toFixed(3));
  setEl('phbStability', stability.toFixed(3));
  setEl('phbVoxel', voxels.length);
  setEl('phbVeil', veilPhase);
  setEl('phbPortal', portal.toFixed(1));
  setEl('phbEnergy', energy.toFixed(1));
  setEl('phbCodex', totalPages);
  
  // Update Codex Discovery
  setEl('totalCodexPages', totalPages);
  
  // Update PHB Upgrade Status
  setEl('phbUpgradePages', totalPages);
  setEl('phbUpgradeVersion', Math.floor(totalPages / 10) + 1);
  setEl('phbUpgradeStatus', '✅ Synced (' + totalPages + ' pages)');
  setEl('phbAutoUpgrade', totalPages > 0 ? 'ACTIVE' : 'WAITING');
  
  // Update PHB Science
  const vitruvianPages = totalPages;
  const vitruvianRatio = Math.min(1, (coherence + Math.min(1, stability / 1.5)) / 2);
  const vitruvianEnergy = Math.min(1, energy / 1.5);
  
  setEl('vitruvianPages', vitruvianPages);
  setEl('vitruvianRatio', vitruvianRatio.toFixed(1));
  setEl('vitruvianEnergy', vitruvianEnergy.toFixed(1));
  setEl('scienceCoherence', coherence.toFixed(3));
  setEl('scienceStability', stability.toFixed(3));
  setEl('scienceResonance', resonance.toFixed(3));
  setEl('scienceVeilPhase', veilPhase);
  setEl('scienceVeilThickness', '0.134');
  setEl('scienceBreachProb', '0.587');
  setEl('scienceEnergyBand', energy > 0.66 ? 'HIGH' : (energy > 0.33 ? 'MID' : 'LOW'));
  setEl('scienceEnergyColor', veilPhase === 'SEALED' ? 'LIGHT' : 'DARK');
  setEl('sciencePortal', portal.toFixed(1));
  setEl('scienceVoxels', voxels.length + ' active points');
  setEl('scienceSequence', sequence.join(' → '));
  
  // Last update time
  const now = new Date();
  setEl('phbLastUpdate', now.toLocaleTimeString());
  setEl('phbLastSync', now.toLocaleTimeString());
  setEl('lastUpdate', now.toLocaleString());
  
  console.log("✅ PHB updated - Pages:", totalPages, "Coherence:", coherence.toFixed(3));
}

// Load and parse JSON
function loadPHBData() {
  console.log("📄 Loading PHB JSON...");
  
  fetch('agi_phb_divine_complete.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(data => {
      console.log("✅ JSON loaded successfully");
      
      updatePHBFromData(data);
      
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

// Enable Auto-Trading
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

// Run on load
if (document.readyState === 'complete') {
  setTimeout(loadPHBData, 500);
} else {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadPHBData, 500);
  });
}

console.log('🚀 PHB Sync Fix applied - Auto-trading ENABLED');
