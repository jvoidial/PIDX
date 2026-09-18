// mining-dashboard.js — shows live mining stats on the page from chain
(function(){
'use strict';

const REWARD_ADDR_KEY = 'phb.reward.address';
let rewardAddr = null;

// Try localStorage first (dashboard can remember it)
try { rewardAddr = localStorage.getItem(REWARD_ADDR_KEY); } catch(_) {}

// Or read from a config file fetched at runtime
async function loadConfig(){
  if (rewardAddr) return rewardAddr;
  try {
    const r = await fetch('mining/.reward-address');
    if (r.ok) {
      const txt = await r.text();
      const m = txt.match(/ADDR=(0x[0-9a-fA-F]{40})/);
      if (m) { rewardAddr = m[1]; return rewardAddr; }
    }
  } catch(_) {}
  return null;
}

const ABI = [
  'function difficulty() view returns (uint256)',
  'function epoch() view returns (uint256)',
  'function rewardPerShare() view returns (uint256)',
  'function totalShares() view returns (uint256)',
  'function shares(address) view returns (uint256)',
  'function rewardToken() view returns (address)'
];

async function rpcCall(to, data){
  const body = JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_call', params:[{to, data}, 'latest'] });
  const urls = ['https://base-rpc.publicnode.com', 'https://base.gateway.tenderly.co', 'https://mainnet.base.org'];
  for (const u of urls){
    try {
      const r = await fetch(u, { method:'POST', headers:{'Content-Type':'application/json'}, body });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.result) return j.result;
    } catch(_) {}
  }
  return null;
}

function decodeBig(hex){ return hex && hex !== '0x' ? BigInt(hex) : 0n; }

async function refresh(){
  const addr = await loadConfig();
  const el = document.getElementById('mining-live');
  if (!el) return;

  if (!addr){
    el.innerHTML = '<div style="color:#fa6;font:10px ui-monospace,monospace;padding:8px">No reward contract deployed yet — run <code>mining/deploy-mining.sh</code></div>';
    return;
  }

  const [diffHex, epHex, rewHex, totHex] = await Promise.all([
    rpcCall(addr, '0x' + 'f5a1f5a1'),  // difficulty() — replace with correct selector below
    rpcCall(addr, '0x900cf0cf'),        // epoch()
    rpcCall(addr, '0x4a1e2e1f'),        // rewardPerShare()
    rpcCall(addr, '0x8b0e9f3f')         // totalShares()
  ]);

  const diff = decodeBig(diffHex);
  const ep   = decodeBig(epHex);
  const rew  = decodeBig(rewHex);
  const tot  = decodeBig(totHex);

  el.innerHTML = `
    <div class="grid" style="margin:10px 0">
      <div class="m"><div class="l">Reward Contract</div><div class="v" style="font-size:11px;word-break:break-all">${addr}</div><div class="s">Base</div></div>
      <div class="m"><div class="l">Epoch</div><div class="v">${ep.toString()}</div><div class="s">1 day cycles</div></div>
      <div class="m"><div class="l">Reward / nonce</div><div class="v">${(Number(rew)/1e18).toFixed(0)}</div><div class="s">PIDX</div></div>
      <div class="m"><div class="l">Total shares</div><div class="v">${tot.toString()}</div><div class="s">all miners</div></div>
      <div class="m"><div class="l">Difficulty</div><div class="v" style="font-size:11px">${diff ? (diff.toString(16).slice(0,10)) : '—'}…</div><div class="s">lower = harder</div></div>
    </div>
  `;
}

setInterval(refresh, 20000);
setTimeout(refresh, 4000);
})();
