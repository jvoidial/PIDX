// p2p-mesh.js — real peer-to-peer presence via public Nostr relays.
// Any browser running this page becomes a mesh node. No backend, no server.
// Relays are public WebSocket endpoints.
(function(){
'use strict';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band'
];
const CHANNEL = 'phb-vortex-v1';
const HB_INTERVAL = 15000;   // broadcast presence every 15s
const PEER_TTL    = 45000;   // forget peers silent for 45s

const peers = new Map();     // pubkey -> {lastSeen, relay, nick}
let socket = null;
let myKey = null;

// ─── Generate ephemeral identity (or restore from storage) ──────────────
function randomHex(n){
  const arr = new Uint8Array(n);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadIdentity(){
  try {
    const saved = localStorage.getItem('phb.p2p.key');
    if (saved && /^[0-9a-f]{64}$/.test(saved)) return saved;
  } catch(_){}
  const k = randomHex(32);
  try { localStorage.setItem('phb.p2p.key', k); } catch(_){}
  return k;
}

myKey = loadIdentity();

// ─── Update UI ──────────────────────────────────────────────────────────
function updateCounts(){
  const now = Date.now();
  for (const [k, v] of peers.entries()){
    if (now - v.lastSeen > PEER_TTL) peers.delete(k);
  }
  const el = document.querySelector('[data-net="p2p"]');
  if (!el) return;
  const statusEl = el.querySelector('.st2');
  if (statusEl){
    statusEl.className = 'st2 active';
    statusEl.textContent = 'ACTIVE · ' + (peers.size + 1) + ' NODES';
  }
  let detail = el.querySelector('.net-detail');
  if (!detail){
    detail = document.createElement('div');
    detail.className = 'net-detail';
    detail.style.cssText = 'font:9px ui-monospace,monospace;color:#4a5a6a;margin-top:4px;width:100%;';
    el.appendChild(detail);
  }
  const relayHosts = RELAYS.map(r => r.replace(/^wss:\/\//, '')).join(' · ');
  detail.textContent = 'relays: ' + relayHosts + ' | my node: ' + myKey.slice(0, 8) + '…';
}

// ─── Connect to a relay ─────────────────────────────────────────────────
function connectRelay(url){
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      const timer = setTimeout(() => { try { ws.close(); } catch(_){} resolve(null); }, 6000);
      ws.onopen = () => { clearTimeout(timer); resolve(ws); };
      ws.onerror = () => { clearTimeout(timer); resolve(null); };
      ws.onclose = () => { clearTimeout(timer); resolve(null); };
    } catch(_) { resolve(null); }
  });
}

// ─── Broadcast heartbeat ────────────────────────────────────────────────
function broadcast(){
  if (!socket || socket.readyState !== 1) return;
  const event = {
    kind: 20001,
    pubkey: myKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['t', CHANNEL]],
    content: JSON.stringify({ nick: 'phb-node', t: Date.now() })
  };
  try {
    socket.send(JSON.stringify(['EVENT', event]));
  } catch(_){}
}

// ─── Receive ────────────────────────────────────────────────────────────
function handleMessage(ev){
  let payload;
  try { payload = JSON.parse(ev.data); } catch(_) { return; }
  if (!Array.isArray(payload)) return;
  const [type, sub, data] = payload;
  if (type !== 'EVENT' || !data || data.pubkey === myKey) return;
  if (!data.tags || !data.tags.some(t => t[0] === 't' && t[1] === CHANNEL)) return;
  peers.set(data.pubkey, {
    lastSeen: Date.now(),
    relay: socket?.url || '?',
    nick: 'node'
  });
  updateCounts();
}

// ─── Boot ───────────────────────────────────────────────────────────────
async function boot(){
  const el = document.querySelector('[data-net="p2p"]');
  if (el){
    const s = el.querySelector('.st2');
    if (s){ s.className = 'st2 checking'; s.textContent = 'CONNECTING…'; }
  }

  // Try relays in order
  for (const url of RELAYS){
    const ws = await connectRelay(url);
    if (ws){
      socket = ws;
      socket.onmessage = handleMessage;
      socket.onclose = () => { socket = null; setTimeout(boot, 5000); };
      // Subscribe to channel
      try {
        socket.send(JSON.stringify(['REQ', 'phb-mesh', { kinds: [20001], '#t': [CHANNEL], limit: 100 }]));
      } catch(_){}
      broadcast();
      setInterval(broadcast, HB_INTERVAL);
      setInterval(updateCounts, 5000);
      updateCounts();
      console.log('[p2p-mesh] connected to', url);
      return;
    }
  }
  console.log('[p2p-mesh] all relays unreachable — retrying in 30s');
  setTimeout(boot, 30000);
}

setTimeout(boot, 4000);
})();
