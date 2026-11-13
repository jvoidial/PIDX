#!/usr/bin/env node
// Snapshot current ERC-20 holders of a token by replaying Transfer events.
//
// HONEST LIMITATION (read this before trusting the output):
//   A public Base RPC will refuse or truncate eth_getLogs over a wide block
//   range. This script therefore walks the chain in bounded windows and will
//   print how far it actually got. If it cannot cover the whole history it
//   TELLS you so, rather than silently returning a partial holder set.
//   For a definitive snapshot use an indexer (Basescan API, Dune, or an
//   archive node) and cross-check the total against totalSupply().
//
// Usage:
//   node scripts/snapshot-holders.js <tokenAddress> [--from <block>] [--to <block>] [--window <n>]
// Env:
//   BASE_RPC_URL   (default https://mainnet.base.org)
// Output:
//   snapshot-<token>.json  (git-ignored)  { token, fromBlock, toBlock, complete, holders }

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

const TRANSFER = ethers.id("Transfer(address,address,uint256)");
const ZERO = ethers.ZeroAddress;

async function main() {
    const token = process.argv[2];
    if (!token || !ethers.isAddress(token)) {
        console.error("Usage: node scripts/snapshot-holders.js <tokenAddress> [--from N] [--to N] [--window N]");
        process.exit(1);
    }
    const arg = (name, def) => {
        const i = process.argv.indexOf(name);
        return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
    };

    const rpc = process.env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpc);
    const window = parseInt(arg("--window", "10000"), 10);
    const latest = await provider.getBlockNumber();
    const fromBlock = parseInt(arg("--from", "0"), 10);
    const toBlock = parseInt(arg("--to", String(latest)), 10);

    console.log(`Token   : ${token}`);
    console.log(`RPC     : ${rpc}`);
    console.log(`Blocks  : ${fromBlock} .. ${toBlock}  (window ${window})`);

    const balances = new Map();
    let scannedTo = fromBlock;
    let ok = true;

    for (let start = fromBlock; start <= toBlock; start += window) {
        const end = Math.min(start + window - 1, toBlock);
        try {
            const logs = await provider.getLogs({ address: token, topics: [TRANSFER], fromBlock: start, toBlock: end });
            for (const l of logs) {
                const from = ethers.getAddress("0x" + l.topics[1].slice(26));
                const to = ethers.getAddress("0x" + l.topics[2].slice(26));
                const value = BigInt(l.data);
                if (from !== ZERO) balances.set(from, (balances.get(from) || 0n) - value);
                if (to !== ZERO) balances.set(to, (balances.get(to) || 0n) + value);
            }
            scannedTo = end;
        } catch (e) {
            ok = false;
            console.error(`⚠️  getLogs failed at ${start}..${end}: ${e.shortMessage || e.message}`);
            console.error(`    Stopping. Scanned only up to block ${scannedTo}.`);
            break;
        }
        if (start % (window * 10) === 0) process.stdout.write(`  … scanned to ${end}\r`);
    }

    const complete = ok && scannedTo === toBlock;
    const holders = [...balances.entries()]
        .filter(([, b]) => b > 0n)
        .sort((a, b) => (b[1] > a[1] ? 1 : -1))
        .map(([address, raw]) => ({ address, raw: raw.toString(), tokens: ethers.formatUnits(raw, 18) }));

    const sum = holders.reduce((a, h) => a + BigInt(h.raw), 0n);
    console.log(`\nHolders : ${holders.length}`);
    console.log(`Sum     : ${ethers.formatUnits(sum, 18)}`);

    try {
        const tc = new ethers.Contract(token, ["function totalSupply() view returns (uint256)"], provider);
        const ts = await tc.totalSupply();
        console.log(`On-chain totalSupply: ${ethers.formatUnits(ts, 18)}`);
        if (sum !== ts) console.log(`⚠️  Sum != totalSupply — snapshot is INCOMPLETE or a burn/mint was missed.`);
    } catch (_) {}

    if (!complete) console.log(`\n🚨 INCOMPLETE: scanned only ${fromBlock}..${scannedTo}. Use an indexer for the full set.`);

    const out = { token, fromBlock, toBlock, scannedTo, complete, holderCount: holders.length, holders };
    const outPath = `snapshot-${token}.json`;
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`Wrote ${outPath}`);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
