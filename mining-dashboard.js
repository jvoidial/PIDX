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
    el.innerHTML = `
      <div class="mp-warn" style="background:#2a1a08;border-color:#4a3010">
        <strong style="color:#fa6">Status: NOT DEPLOYED</strong><br>
        To enable on-chain mining rewards, deploy the MineableReward contract on Base:
        <div style="background:#060810;border:1px solid #1a2030;border-radius:6px;padding:8px 10px;margin:8px 0;font:10px ui-monospace,monospace;color:#8ab;word-break:break-all;cursor:pointer" onclick="mpCopy(this,'bash mining/deploy-mining.sh')">
          1. Install Foundry:<br>
          &nbsp;&nbsp;<span style="color:#cc9">curl -L https://foundry.paradigm.xyz | bash && ~/.foundry/bin/foundryup</span><br><br>
          2. Base-anvil (recommended):<br>
          &nbsp;&nbsp;<span style="color:#cc9">curl -L https://raw.githubusercontent.com/base/base-anvil/HEAD/foundryup/install | bash</span><br><br>
          3. Add DEPLOYER_PK to .env (needs ~$2 ETH on Base)<br>
          4. Run: <span style="color:#6f6">bash mining/deploy-mining.sh</span>
          <span class="cp" style="color:#4a5a6a;font-size:9px">TAP</span>
        </div>
        Once deployed, this panel reads difficulty, epoch, reward rate, and share count live from chain.
      </div>
    `;
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
