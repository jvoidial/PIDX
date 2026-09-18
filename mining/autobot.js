#!/usr/bin/env node
// autobot.js — proof-of-work miner for MineableReward on Base.
// Computes keccak256(nonce, miner, epoch) in a loop. Submits when below target.
//
// Config via .env:
//   MINER_PK=0x...        private key of the mining wallet (needs gas only)
//   REWARD_ADDR=0x...     deployed MineableReward address
//   BASE_RPC=...          RPC url (defaults to publicnode)
//   BATCH_SIZE=1000000    nonces to try per log line
'use strict';

const fs   = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Load .env from parent dir
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const RPC    = process.env.BASE_RPC  || 'https://base-rpc.publicnode.com';
const PK     = process.env.MINER_PK;
const REWARD = process.env.REWARD_ADDR || (fs.existsSync(path.join(__dirname, '.reward-address'))
  ? fs.readFileSync(path.join(__dirname, '.reward-address'), 'utf8').match(/ADDR=(0x[0-9a-fA-F]+)/)?.[1]
  : null);
const BATCH  = parseInt(process.env.BATCH_SIZE || '500000', 10);

if (!PK)     { console.error('[FAIL] MINER_PK not set');      process.exit(1); }
if (!REWARD) { console.error('[FAIL] REWARD_ADDR not set');   process.exit(1); }

const provider = new ethers.JsonRpcProvider(RPC);
const wallet   = new ethers.Wallet(PK, provider);

// MineableReward ABI (only what we need)
const ABI = [
  'function submitWork(uint256 nonce) external',
  'function checkWork(address miner, uint256 nonce) external view returns (bool)',
  'function difficulty() view returns (uint256)',
  'function epoch() view returns (uint256)',
  'function rewardPerShare() view returns (uint256)',
  'function shares(address) view returns (uint256)',
  'event Mined(address indexed miner, uint256 epoch, uint256 nonce, uint256 hashPrefix, uint256 reward)',
];
const contract = new ethers.Contract(REWARD, ABI, wallet);

// ─── Mining loop ────────────────────────────────────────────────────────
let nonce = BigInt(Date.now()) * 1000000n;
let found = 0;
let tried = 0;
let lastLog = Date.now();

console.log('[autobot] starting');
console.log('  wallet  :', wallet.address);
console.log('  contract:', REWARD);
console.log('  rpc     :', RPC);

async function fetchDifficulty(){
  try { return await contract.difficulty(); }
  catch { return null; }
}

async function fetchEpoch(){
  try { return await contract.epoch(); }
  catch { return 0n; }
}

async function submit(n){
  try {
    const tx = await contract.submitWork(n, { gasLimit: 300000n });
    console.log(`[autobot] submitted nonce ${n} — tx ${tx.hash}`);
    const rcpt = await tx.wait();
    if (rcpt.status === 1) {
      found++;
      console.log(`[autobot] ✔ accepted — total found: ${found}`);
    }
  } catch (e) {
    // Usually "hash above target" or "nonce used" — silent, keep mining
    if (!String(e).includes('hash above target') && !String(e).includes('nonce used')) {
      console.log('[autobot] submit failed:', String(e).slice(0, 120));
    }
  }
}

async function loop(){
  const diff = await fetchDifficulty();
  const ep   = await fetchEpoch();
  if (diff == null) {
    console.log('[autobot] difficulty read failed — retry in 10s');
    return setTimeout(loop, 10000);
  }

  // Target: keccak256(abi.encodePacked(nonce, miner, epoch)) < diff
  const minerHex = wallet.address.toLowerCase().slice(2);
  const epochHex = ep.toString(16).padStart(64, '0');

  for (let i = 0; i < BATCH; i++) {
    nonce++;
    tried++;
    const nonceHex = nonce.toString(16).padStart(64, '0');
    // abi.encodePacked(uint256 nonce, address miner, uint256 epoch)
    const packed = '0x' + nonceHex + minerHex + epochHex;
    const hash = ethers.keccak256(packed);
    const hBig = BigInt(hash);

    if (hBig < diff) {
      await submit(nonce);
    }
  }

  if (Date.now() - lastLog > 15000) {
    const rate = Math.round(tried / ((Date.now() - lastLog) / 1000));
    console.log(`[autobot] tried=${tried} found=${found} rate=${rate}/s diff=${diff.toString(16).slice(0,8)}…`);
    tried = 0;
    lastLog = Date.now();
  }

  setImmediate(loop);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(`\n[autobot] stopped. found=${found}`);
  process.exit(0);
});

loop().catch(e => { console.error('[autobot] fatal:', e); process.exit(1); });
