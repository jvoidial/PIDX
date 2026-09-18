// staking-dashboard.js — live InfinityStake stats on the page
(function(){
'use strict';

const RPCS = [
  'https://base-rpc.publicnode.com',
  'https://base.gateway.tenderly.co',
  'https://mainnet.base.org'
];

// ─── ABI method selectors ───────────────────────────────────────────────
const SEL = {
  totalStaked:     '0x817b1cd2',  // totalStaked()
  rewardRate:      '0x7b0a47ee',  // rewardRate()
  apy:             '0x5b7f7a39',  // apy()
  stakeToken:      '0x4fb3f8b0',  // stakeToken()
  rewardToken:     '0x7b0a47ee',  // placeholder; adjust if needed
  lastUpdate:      '0xc8f33c91'   // lastUpdate()
};

async function rpc(to, data){
  for (const url of RPCS){
    try {
      const r = await fetch(url, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ jsonrpc:'2.0', id:1, method:'eth_call', params:[{to, data}, 'latest'] })
      });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.result && j.result !== '0x') return j.result;
    } catch(_){}
  }
  return null;
}

function big(hex){ return hex && hex !== '0x' ? BigInt(hex) : 0n; }
function fmt(n, dp=2){
  const x = Number(n);
  if (isNaN(x)) return '0';
  if (x < 1) return x.toFixed(6);
  return x.toLocaleString('en-US', { maximumFractionDigits: dp });
}

async function getStakeAddr(){
  // Try localStorage first, then fetch the address file
  try {
    const saved = localStorage.getItem('phb.stake.address');
    if (saved && /^0x[0-9a-fA-F]{40}$/.test(saved)) return saved;
  } catch(_){}
  try {
    const r = await fetch('staking/.stake-address');
    if (r.ok){
      const txt = await r.text();
      const m = txt.match(/STAKE_ADDR=(0x[0-9a-fA-F]{40})/);
      if (m){
        try { localStorage.setItem('phb.stake.address', m[1]); } catch(_){}
        return m[1];
      }
    }
  } catch(_){}
  return null;
}

async function refresh(){
  const el = document.getElementById('staking-live');
  if (!el) return;
  const addr = await getStakeAddr();

  if (!addr){
    el.innerHTML = `
      <div class="mp-warn" style="background:#2a1a08;border-color:#4a3010">
        <strong style="color:#fa6">Status: NOT DEPLOYED</strong><br>
        Deploy the InfinityStake contract on Base:
        <div style="background:#060810;border:1px solid #1a2030;border-radius:6px;padding:8px 10px;margin:8px 0;font:10px ui-monospace,monospace;color:#8ab;word-break:break-all">
          1. Install Foundry: <span style="color:#cc9">bash mining/install-foundry-termux.sh</span><br>
          2. Add DEPLOYER_PK to .env (needs ~$2 ETH on Base)<br>
          3. Deploy: <span style="color:#6f6">bash staking/deploy-staking.sh</span><br>
          4. Fund rewards + set rate (see output of step 3)
        </div>
        Once deployed, this panel reads totalStaked, rewardRate, APY, and lastUpdate live from chain.
      </div>
    `;
    return;
  }

  const [totalHex, rateHex, apyHex, updHex] = await Promise.all([
    rpc(addr, SEL.totalStaked),
    rpc(addr, SEL.rewardRate),
    rpc(addr, SEL.apy),
    rpc(addr, SEL.lastUpdate)
  ]);

  const total = big(totalHex);
  const rate = big(rateHex);
  const apyBps = big(apyHex);
  const upd = big(updHex);

  const totalHuman = Number(total) / 1e18;
  const rateDaily = Number(rate) * 86400 / 1e18;
  const apyPct = Number(apyBps) / 1e16;   // 1e18 scale → percent
  const now = Math.floor(Date.now() / 1000);
  const sinceUpdate = upd > 0n ? Math.max(0, now - Number(upd)) : 0;

  el.innerHTML = `
    <div class="grid" style="margin:10px 0">
      <div class="m"><div class="l">Stake Contract</div><div class="v" style="font-size:10px;word-break:break-all">${addr}</div><div class="s">Base · v1</div></div>
      <div class="m"><div class="l">Total Staked</div><div class="v">${fmt(totalHuman)}</div><div class="s">PIDX</div></div>
      <div class="m"><div class="l">Reward Rate</div><div class="v">${fmt(rateDaily, 0)}</div><div class="s">PIDX / day</div></div>
      <div class="m"><div class="l">Pool APY</div><div class="v">${fmt(apyPct, 2)}%</div><div class="s">dynamic</div></div>
      <div class="m"><div class="l">Last Accrual</div><div class="v">${sinceUpdate}s</div><div class="s">since update</div></div>
      <div class="m"><div class="l">Lock</div><div class="v">NONE</div><div class="s">∞ flexible</div></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
      <a href="https://app.uniswap.org/#/swap?chain=base&outputCurrency=0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c" target="_blank" rel="noopener" style="padding:5px 12px;background:#12121c;border:1px solid #88ccff33;color:#88ccff;border-radius:12px;font:600 10px ui-monospace,monospace;text-decoration:none">Get PIDX</a>
      <a href="https://basescan.org/address/${addr}#writeContract" target="_blank" rel="noopener" style="padding:5px 12px;background:#12121c;border:1px solid #aaffaa33;color:#aaffaa;border-radius:12px;font:600 10px ui-monospace,monospace;text-decoration:none">Stake</a>
      <a href="https://basescan.org/address/${addr}#readContract" target="_blank" rel="noopener" style="padding:5px 12px;background:#12121c;border:1px solid #ffcc6633;color:#ffcc66;border-radius:12px;font:600 10px ui-monospace,monospace;text-decoration:none">Read Contract</a>
    </div>
  `;
}

setTimeout(refresh, 3500);
setInterval(refresh, 30000);
})();
