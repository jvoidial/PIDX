// superchain-check.js — live verifies token presence on each chain.
// Reads eth_getCode + name/symbol/decimals. Shows DEPLOYED / NOT DEPLOYED / PENDING.
(function(){
'use strict';

// ─── Chain RPCs ─────────────────────────────────────────────────────────
const CHAINS = {
  base: {
    name: 'Base',
    rpcs: ['https://base-rpc.publicnode.com', 'https://base.gateway.tenderly.co', 'https://mainnet.base.org'],
    tokens: {
      PIDX:    '0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c',
      SGUIDE:  '0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a',
      VDOO:    '0x38e4f08D08b4D772A7B75669C356b4749dd2d30b',
      PENNIES: '0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7'
    }
  },
  optimism: {
    name: 'OP Mainnet',
    rpcs: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com', 'https://1rpc.io/op'],
    // Replace these with the actual wrapped-token addresses once deployed.
    // Until then, verification will report NOT DEPLOYED — which is honest.
    tokens: {
      wPIDX:   '0x0000000000000000000000000000000000000000',
      wSGUIDE: '0x0000000000000000000000000000000000000000'
    }
  },
  arbitrum: {
    name: 'Arbitrum',
    rpcs: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com', 'https://1rpc.io/arb'],
    tokens: {
      aPIDX:   '0x0000000000000000000000000000000000000000',
      aSGUIDE: '0x0000000000000000000000000000000000000000'
    }
  }
};

// ─── RPC call with failover ─────────────────────────────────────────────
async function callRpc(rpcs, method, params){
  for (const url of rpcs){
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc:'2.0', id:1, method, params })
      });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.error) continue;
      return j.result;
    } catch(_) {}
  }
  return null;
}

function decodeString(hex){
  if (!hex || hex === '0x' || hex.length < 4) return '';
  const b = hex.slice(2);
  // Bytes32 form (older tokens): whole 64-byte value is the string, NUL-padded
  if (b.length === 64){
    let s = '';
    for (let i = 0; i < 64; i += 2){
      const c = parseInt(b.slice(i, i+2), 16);
      if (c === 0) break;
      if (c >= 32 && c < 127) s += String.fromCharCode(c);
    }
    return s;
  }
  // ABI-encoded string form: offset + length + data
  if (b.length >= 128){
    try {
      const off = parseInt(b.slice(0, 64), 16);
      if (off === 32){
        const len = parseInt(b.slice(64, 128), 16);
        if (len > 0 && len < 256){
          const strHex = b.slice(128, 128 + len * 2);
          let s = '';
          for (let i = 0; i < strHex.length; i += 2){
            const c = parseInt(strHex.slice(i, i+2), 16);
            if (c >= 32 && c < 127) s += String.fromCharCode(c);
          }
          return s;
        }
      }
    } catch(_){}
    // Fallback: try reading bytes32 at offset 0 anyway
    try {
      const strHex = b.slice(128, 192);
      let s = '';
      for (let i = 0; i < strHex.length; i += 2){
        const c = parseInt(strHex.slice(i, i+2), 16);
        if (c === 0) break;
        if (c >= 32 && c < 127) s += String.fromCharCode(c);
      }
      return s;
    } catch(_){}
  }
  return '';
}

async function inspectToken(rpcs, addr){
  if (!addr || addr === '0x0000000000000000000000000000000000000000'){
    return { deployed: false, reason: 'no-address' };
  }
  const code = await callRpc(rpcs, 'eth_getCode', [addr, 'latest']);
  if (!code || code === '0x' || code.length < 4){
    return { deployed: false, reason: 'no-code' };
  }
  const [nameHex, symbolHex, decHex] = await Promise.all([
    callRpc(rpcs, 'eth_call', [{ to: addr, data: '0x06fdde03' }, 'latest']),
    callRpc(rpcs, 'eth_call', [{ to: addr, data: '0x95d89b41' }, 'latest']),
    callRpc(rpcs, 'eth_call', [{ to: addr, data: '0x313ce567' }, 'latest'])
  ]);
  return {
    deployed: true,
    name: decodeString(nameHex),
    symbol: decodeString(symbolHex),
    decimals: decHex && decHex !== '0x' ? parseInt(decHex, 16) : null,
    codeSize: (code.length - 2) / 2
  };
}

// ─── Update DOM ─────────────────────────────────────────────────────────
function setStatus(netId, state, detail){
  const row = document.querySelector('[data-net="' + netId + '"]');
  if (!row) return;
  const statusEl = row.querySelector('.st2');
  if (!statusEl) return;

  const configs = {
    live:           { cls: 'live',    text: 'LIVE' },
    partial:        { cls: 'partial', text: 'PARTIAL' },
    planned:        { cls: 'planned', text: 'PENDING' },
    missing:        { cls: 'missing', text: 'NOT DEPLOYED' },
    err:            { cls: 'err',     text: 'RPC ERR' },
    checking:       { cls: 'checking',text: 'CHECKING…' }
  };
  const c = configs[state] || configs.checking;
  statusEl.className = 'st2 ' + c.cls;
  statusEl.textContent = c.text;
  if (detail){
    let sub = row.querySelector('.net-detail');
    if (!sub){
      sub = document.createElement('div');
      sub.className = 'net-detail';
      sub.style.cssText = 'font:9px ui-monospace,monospace;color:#4a5a6a;margin-top:4px;width:100%;';
      row.appendChild(sub);
    }
    sub.textContent = detail;
  }
}

async function verifyAll(){
  // Base
  setStatus('base', 'checking');
  let baseOk = 0, baseTotal = 0, baseDetail = [];
  for (const [sym, addr] of Object.entries(CHAINS.base.tokens)){
    baseTotal++;
    const info = await inspectToken(CHAINS.base.rpcs, addr);
    if (info.deployed){
      baseOk++;
      baseDetail.push(sym + ':' + (info.symbol || '?'));
    }
  }
  if (baseOk === baseTotal) setStatus('base', 'live', 'ALL ' + baseTotal + ' TOKENS VERIFIED · ' + baseDetail.join(' · '));
  else if (baseOk > 0) setStatus('base', 'partial', baseOk + '/' + baseTotal + ' verified');
  else setStatus('base', 'err', 'RPC unreachable');

  // Optimism
  setStatus('optimism', 'checking');
  let opOk = 0, opTotal = 0;
  for (const [sym, addr] of Object.entries(CHAINS.optimism.tokens)){
    opTotal++;
    const info = await inspectToken(CHAINS.optimism.rpcs, addr);
    if (info.deployed) opOk++;
  }
  if (opOk === 0) setStatus('optimism', 'planned', opTotal + ' wrapped tokens awaiting deployment — deploy script ready');
  else if (opOk === opTotal) setStatus('optimism', 'live', 'ALL ' + opTotal + ' W-TOKENS VERIFIED');
  else setStatus('optimism', 'partial', opOk + '/' + opTotal + ' deployed');

  // Arbitrum
  setStatus('arbitrum', 'checking');
  let arbOk = 0, arbTotal = 0;
  for (const [sym, addr] of Object.entries(CHAINS.arbitrum.tokens)){
    arbTotal++;
    const info = await inspectToken(CHAINS.arbitrum.rpcs, addr);
    if (info.deployed) arbOk++;
  }
  if (arbOk === 0) setStatus('arbitrum', 'planned', arbTotal + ' wrapped tokens awaiting deployment — deploy script ready');
  else if (arbOk === arbTotal) setStatus('arbitrum', 'live', 'ALL ' + arbTotal + ' A-TOKENS VERIFIED');
  else setStatus('arbitrum', 'partial', arbOk + '/' + arbTotal + ' deployed');
}

window.SuperchainCheck = { verifyAll, inspectToken, CHAINS };
setTimeout(verifyAll, 2500);
setInterval(verifyAll, 60000);
})();
