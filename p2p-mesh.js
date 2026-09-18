// p2p-mesh.js — real peer-to-peer presence via Nostr relays.
// Connects to ALL relays simultaneously for resilience. Broadcasts
// heartbeats; counts unique peers heard within the last 45 seconds.
(function(){
'use strict';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://nostr-pub.wellorder.net',
  'wss://relay.snort.social'
];
const CHANNEL = 'phb-vortex-v1';
const HB_INTERVAL = 12000;
const PEER_TTL    = 45000;

const sockets = new Map();          // url → WebSocket
const peers   = new Map();          // pubkey → { lastSeen, relay }
let myKey = null;

function randomHex(n){
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadIdentity(){
  try {
    const k = localStorage.getItem('phb.p2p.key');
    if (k && /^[0-9a-f]{64}$/.test(k)) return k;
  } catch(_){}
  const k = randomHex(32);
  try { localStorage.setItem('phb.p2p.key', k); } catch(_){}
  return k;
}
myKey = loadIdentity();

function statusEl(){
  const el = document.querySelector('[data-net="p2p"]');
  return el ? el.querySelector('.st2') : null;
}
function detailEl(){
  const el = document.querySelector('[data-net="p2p"]');
  if (!el) return null;
  let d = el.querySelector('.net-detail');
  if (!d){
    d = document.createElement('div');
    d.className = 'net-detail';
    d.style.cssText = 'font:9px ui-monospace,monospace;color:#4a5a6a;margin-top:4px;width:100%;';
    el.appendChild(d);
  }
  return d;
}

function updateUI(){
  const now = Date.now();
  for (const [k, v] of peers.entries()){
    if (now - v.lastSeen > PEER_TTL) peers.delete(k);
  }
  const s = statusEl();
  const d = detailEl();
  if (s){
    s.className = 'st2 active';
    s.textContent = 'ACTIVE · ' + (peers.size + 1) + ' NODE' + (peers.size ? 'S' : '');
  }
  if (d){
    const connected = [...sockets.values()].filter(ws => ws.readyState === 1).length;
    const hosts = [...sockets.keys()].map(u => u.replace(/^wss:\/\//, '').split('/')[0]);
    d.textContent = 'relays: ' + connected + '/' + RELAYS.length + ' connected · my node: ' + myKey.slice(0, 8) + '…';
  }
}

function broadcast(){
  const event = {
    kind: 20001,
    pubkey: myKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['t', CHANNEL]],
    content: JSON.stringify({ nick: 'phb-node', t: Date.now() })
  };
  for (const ws of sockets.values()){
    if (ws.readyState === 1){
      try { ws.send(JSON.stringify(['EVENT', event])); } catch(_){}
    }
  }
}

function handleMessage(ev, relayUrl){
  let msg;
  try { msg = JSON.parse(ev.data); } catch(_) { return; }
  if (!Array.isArray(msg)) return;
  const type = msg[0];
  if (type === 'EOSE' || type === 'NOTICE' || type === 'OK'){
    return;
  }
  if (type === 'EVENT'){
    const data = msg[2];
    if (!data || data.pubkey === myKey) return;
    if (!data.tags || !data.tags.some(t => t[0] === 't' && t[1] === CHANNEL)) return;
    peers.set(data.pubkey, { lastSeen: Date.now(), relay: relayUrl });
    updateUI();
  }
}

function connect(url){
  return new Promise((resolve) => {
    let done = false;
    let ws;
    try {
      ws = new WebSocket(url);
    } catch(_) { return resolve(null); }
    const timer = setTimeout(() => {
      if (!done){ done = true; try { ws.close(); } catch(_){}; resolve(null); }
    }, 7000);
    ws.onopen = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ws);
    };
    ws.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(null);
    };
    ws.onclose = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(null);
    };
  });
}

async function connectAll(){
  const s = statusEl();
  if (s && sockets.size === 0){
    s.className = 'st2 checking';
    s.textContent = 'CONNECTING…';
  }
  const results = await Promise.all(RELAYS.map(async url => {
    if (sockets.has(url)) return;
    const ws = await connect(url);
    if (!ws) return;
    sockets.set(url, ws);
    ws.onmessage = (ev) => handleMessage(ev, url);
    ws.onclose = () => {
      sockets.delete(url);
      updateUI();
      setTimeout(connectAll, 5000);
    };
    ws.onerror = () => {};
    // Subscribe to the channel
    try {
      ws.send(JSON.stringify(['REQ', 'phb-' + Date.now(), {
        kinds: [20001], '#t': [CHANNEL], limit: 200
      }]));
    } catch(_){}
    // Immediate heartbeat
    const evt = {
      kind: 20001, pubkey: myKey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['t', CHANNEL]],
      content: JSON.stringify({ nick: 'phb-node', t: Date.now() })
    };
    try { ws.send(JSON.stringify(['EVENT', evt])); } catch(_){}
    console.log('[p2p-mesh] connected', url);
  }));
  updateUI();
}

function boot(){
  connectAll();
  setInterval(broadcast, HB_INTERVAL);
  setInterval(updateUI, 5000);
  // Re-attempt any relay that isn't connected
  setInterval(() => {
    if (sockets.size < RELAYS.length) connectAll();
  }, 30000);
}

setTimeout(boot, 3000);
})();
