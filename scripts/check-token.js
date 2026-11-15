#!/usr/bin/env node
// Read-only token inspector: who holds it, and what the contract can still do.
//
// HONEST SCOPE (read before trusting the output):
//   This reports FACTS from the chain. It does not confirm that anyone "owns"
//   a token. Ownership of a balance is not provable without a signature, and
//   this script never asks for a key.
//   The holder census replays Transfer logs in bounded windows; a public RPC
//   will usually refuse a full-range eth_getLogs. When the scan cannot cover
//   the whole history the output says PARTIAL — it never implies it saw
//   everything. Cross-check against an indexer before acting on the numbers.
//
// Usage:
//   node scripts/check-token.js <tokenAddress> [--owner <addr>] [--watch <addr>]... [--from N] [--to N] [--window N]
// Env:
//   BASE_RPC_URL   (default https://mainnet.base.org)
//
// Exit code is always 0 unless the token address is invalid: this is a report,
// not a pass/fail gate.

require("dotenv").config();
const { ethers } = require("ethers");

const TRANSFER = ethers.id("Transfer(address,address,uint256)");
const ZERO = ethers.ZeroAddress;
const DEAD = "0x000000000000000000000000000000000000dEaD";
const WETH_BASE = "0x4200000000000000000000000000000000000006";

// Function selectors we probe for in the runtime bytecode. Presence means the
// capability exists in the code; it says nothing about who can call it.
const CAPS = {
    "mint(address,uint256)": "40c10f19",
    "burn(address,uint256)": "9dc29fac",
    "burn(uint256)": "42966c68",
    "burnFrom(address,uint256)": "79cc6790",
    "blacklist(address)": "fe575a87",
    "pause()": "8456cb59",
    "owner()": "8da5cb5b",
    "transferOwnership(address)": "f2fde38b",
    "setVault(address)": "6817031b",
    "vault()": "fbfa77cf",
};

function arg(name, def) {
    const i = process.argv.indexOf(name);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
function allArgs(name) {
    const out = [];
    process.argv.forEach((a, i) => { if (a === name && process.argv[i + 1]) out.push(process.argv[i + 1]); });
    return out;
}

async function main() {
    const token = process.argv[2];
    if (!token || !ethers.isAddress(token)) {
        console.error("Usage: node scripts/check-token.js <tokenAddress> [--owner <addr>] [--watch <addr>]... [--from N] [--to N] [--window N]");
        process.exit(1);
    }

    // Public Base endpoints rate-limit aggressively (HTTP 429 / "request limit
    // reached"), and the default mainnet.base.org throttles eth_getLogs hard.
    // Order matters: user-supplied RPC first, then the endpoint that reliably
    // serves log ranges, then the default as a last resort. Every read below
    // goes through withFallback so a busy endpoint is skipped, not fatal.
    const urls = [process.env.BASE_RPC_URL, "https://base-rpc.publicnode.com", "https://mainnet.base.org"].filter(Boolean);
    const providers = [...new Set(urls)].map((u) => new ethers.JsonRpcProvider(u));

    // Run a read against each endpoint until one answers.
    async function withFallback(fn) {
        let lastErr;
        for (const p of providers) {
            try { return await fn(p); } catch (e) { lastErr = e; }
        }
        throw lastErr;
    }

    const provider = providers[0];
    const T = ethers.getAddress(token);
    const latest = await withFallback((p) => p.getBlockNumber());

    // --- metadata ---
    const erc20 = new ethers.Contract(T, [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function owner() view returns (address)",
    ], provider);

    let name = "?", symbol = "?", decimals = 18, total = 0n;
    try { name = await withFallback(() => erc20.name()); } catch (_) {}
    try { symbol = await withFallback(() => erc20.symbol()); } catch (_) {}
    try { decimals = Number(await withFallback(() => erc20.decimals())); } catch (_) {}
    try { total = await withFallback(() => erc20.totalSupply()); } catch (_) {}
    const U = 10n ** BigInt(decimals);
    const fmt = (v) => {
        const whole = v / U;
        const frac = v % U;
        if (frac === 0n) return whole.toLocaleString("en-US");
        const f = (frac / (10n ** BigInt(Math.max(decimals - 6, 0)))).toString().padStart(Math.min(decimals, 6), "0").replace(/0+$/, "");
        return whole.toLocaleString("en-US") + (f ? "." + f : "");
    };

    console.log("=".repeat(66));
    console.log("  TOKEN");
    console.log("=".repeat(66));
    console.log("  address      :", T);
    console.log("  name/symbol  :", name, "/", symbol);
    console.log("  decimals     :", decimals);
    console.log("  totalSupply  :", fmt(total), symbol);

    // --- capabilities (bytecode scan) ---
    const code = (await withFallback((p) => p.getCode(T))).toLowerCase();
    console.log("\n" + "=".repeat(66));
    console.log("  CONTRACT CAPABILITIES (presence in bytecode)");
    console.log("=".repeat(66));
    const present = [];
    for (const [label, sel] of Object.entries(CAPS)) {
        const has = code.includes(sel);
        if (has) present.push(label);
        console.log("  " + (has ? "[yes]" : "[ no]") + "  " + label);
    }
    const canMint = code.includes(CAPS["mint(address,uint256)"]);
    const canBurn = code.includes(CAPS["burn(address,uint256)"]) || code.includes(CAPS["burn(uint256)"]) || code.includes(CAPS["burnFrom(address,uint256)"]);
    console.log("\n  supply can be inflated (mint present):", canMint ? "YES" : "no");
    console.log("  balances can be destroyed (burn present):", canBurn ? "YES" : "no");
    console.log("  NOTE: 'present' means the code contains the function. It does NOT say who may call it.");

    // --- owner ---
    console.log("\n" + "=".repeat(66));
    console.log("  OWNERSHIP SLOT");
    console.log("=".repeat(66));
    let owner = null;
    try { owner = await withFallback(() => erc20.owner()); } catch (_) {}
    if (!owner) {
        console.log("  owner()      : not present / reverted");
    } else {
        const oc = await withFallback((p) => p.getCode(owner));
        let kind = "EOA (plain key)";
        if (oc !== "0x") kind = oc.startsWith("0xef0100") ? "EIP-7702 delegated EOA -> " + "0x" + oc.slice(8, 48) : "contract (" + ((oc.length - 2) / 2) + " bytes)";
        console.log("  owner()      :", owner);
        console.log("  owner type   :", kind);
    }

    // --- key balances ---
    const watch = [...allArgs("--watch"), ...(arg("--owner") ? [arg("--owner")] : [])].filter(ethers.isAddress);
    const keyAddrs = [["burn (0x…dEaD)", DEAD], ...watch.map((a) => ["watched", ethers.getAddress(a)])];
    if (owner) keyAddrs.push(["owner()", owner]);

    console.log("\n" + "=".repeat(66));
    console.log("  KEY BALANCES");
    console.log("=".repeat(66));
    for (const [label, a] of keyAddrs) {
        let bal = 0n;
        try { bal = await withFallback(() => erc20.balanceOf(a)); } catch (_) {}
        const pct = total ? Number((bal * 10000n) / total) / 100 : 0;
        console.log("  " + label.padEnd(16), ethers.getAddress(a), fmt(bal).padStart(20), "(" + pct.toFixed(4) + "%)");
    }

    // --- is a watched address a Uniswap pool? ---
    for (const a of watch) {
        const A = ethers.getAddress(a);
        const wethC = new ethers.Contract(WETH_BASE, ["function balanceOf(address) view returns (uint256)"], provider);

        // V2 pair: getReserves() exists and token0/token1 do not revert.
        let kind = null, t0 = null, t1 = null, reserves = null;
        try {
            const v2 = new ethers.Contract(A, [
                "function token0() view returns (address)",
                "function token1() view returns (address)",
                "function getReserves() view returns (uint112,uint112,uint32)",
                "function totalSupply() view returns (uint256)",
                "function balanceOf(address) view returns (uint256)",
            ], provider);
            t0 = await withFallback(() => v2.token0());
            t1 = await withFallback(() => v2.token1());
            const res = await withFallback(() => v2.getReserves());
            reserves = [res[0], res[1]];
            kind = "Uniswap V2 pair";
            const lpTotal = await withFallback(() => v2.totalSupply());
            console.log("\n  >> " + A + " is a " + kind);
            console.log("     token0 =", t0, "reserve =", ethers.formatUnits(res[0], 18));
            console.log("     token1 =", t1, "reserve =", ethers.formatUnits(res[1], 18));
            // Who holds the LP, and is any of it locked? Unlocked LP can be pulled.
            const lpTop = await withFallback(() => v2.balanceOf(owner || ZERO));
            if (owner) {
                const pct = lpTotal > 0n ? Number((lpTop * 10000n) / lpTotal) / 100 : 0;
                console.log("     LP totalSupply =", ethers.formatUnits(lpTotal, 18));
                console.log("     owner() holds  =", ethers.formatUnits(lpTop, 18), "(" + pct.toFixed(2) + "% of LP)");
                if (pct > 50) console.log("     !! owner can withdraw " + pct.toFixed(2) + "% of the liquidity at any time (LP not locked)");
            }
        } catch (_) {
            // V3 pool: fee() + liquidity() exist.
            try {
                const v3 = new ethers.Contract(A, [
                    "function token0() view returns (address)",
                    "function token1() view returns (address)",
                    "function fee() view returns (uint24)",
                    "function liquidity() view returns (uint128)",
                ], provider);
                t0 = await withFallback(() => v3.token0());
                t1 = await withFallback(() => v3.token1());
                const fee = await withFallback(() => v3.fee());
                const liq = await withFallback(() => v3.liquidity());
                kind = "Uniswap V3 pool";
                console.log("\n  >> " + A + " is a " + kind);
                console.log("     token0 =", t0, "| token1 =", t1, "| fee =", fee.toString(), "| liquidity =", liq.toString());
                if (liq === 0n) console.log("     !! active liquidity is ZERO: this pool cannot be traded");
            } catch (_) { /* not a pool */ }
        }

        if (kind) {
            const weth = t0 && t0.toLowerCase() === WETH_BASE.toLowerCase() ? t0 : (t1 && t1.toLowerCase() === WETH_BASE.toLowerCase() ? t1 : null);
            if (weth) {
                const w = await withFallback(() => wethC.balanceOf(A));
                console.log("     WETH held by pool =", ethers.formatUnits(w, 18), "WETH");
                console.log("     -> this address is LIQUIDITY, not a buyer. Its token balance is the pool's inventory.");
                if (w === 0n) console.log("     -> pool holds 0 WETH: the paired side is empty. Sells cannot be filled.");
            }
        }
    }

    // --- holder census from Transfer logs (bounded) ---
    const from = parseInt(arg("--from", "0"), 10);
    const to = parseInt(arg("--to", String(latest)), 10);
    const window = parseInt(arg("--window", "10000"), 10);
    console.log("\n" + "=".repeat(66));
    console.log("  HOLDER CENSUS (replaying Transfer logs)");
    console.log("=".repeat(66));
    console.log("  scanning blocks", from, "->", to, "in windows of", window);

    const balances = new Map();
    const bump = (addr, delta) => balances.set(addr, (balances.get(addr) || 0n) + delta);
    let covered = from;
    let complete = true;
    try {
        for (let start = from; start <= to; start += window) {
            const end = Math.min(start + window - 1, to);
            const logs = await withFallback((p) => p.getLogs({ address: T, topics: [TRANSFER], fromBlock: start, toBlock: end }));
            for (const lg of logs) {
                const frm = "0x" + lg.topics[1].slice(26);
                const toA = "0x" + lg.topics[2].slice(26);
                const amt = BigInt(lg.data);
                if (frm !== ZERO) bump(frm, -amt);
                if (toA !== ZERO) bump(toA, amt);
            }
            covered = end;
            if (logs.length > 0) process.stdout.write(".");
        }
        process.stdout.write("\n");
    } catch (e) {
        complete = false;
        console.log("\n  ! RPC refused the range at block", covered + 1, "-", e.shortMessage || e.message);
    }
    if (covered < to) complete = false;

    const rows = [...balances.entries()].filter(([, v]) => v > 0n).sort((a, b) => (a[1] < b[1] ? 1 : -1));
    const scanned = covered - from + 1;
    console.log("  coverage     :", complete ? "FULL HISTORY" : "PARTIAL (blocks " + from + ".." + covered + " only)");
    console.log("  holders seen :", rows.length);

    const label = (a) => {
        if (a.toLowerCase() === DEAD.toLowerCase() || a === ZERO) return "burned";
        if (owner && a.toLowerCase() === owner.toLowerCase()) return "owner()";
        if (watch.some((w) => w.toLowerCase() === a.toLowerCase())) return "watched/LP";
        return "";
    };
    console.log("\n  top holders (from scanned range):");
    for (const [a, v] of rows.slice(0, 15)) {
        const pct = total ? Number((v * 10000n) / total) / 100 : 0;
        console.log("    " + a + "  " + fmt(v).padStart(20) + "  (" + pct.toFixed(4) + "%)  " + label(a));
    }
    if (!complete) console.log("\n  !! PARTIAL SCAN — a holder that only moved tokens outside the scanned range is missing above.");

    // --- what this does not establish ---
    console.log("\n" + "=".repeat(66));
    console.log("  WHAT THIS DOES NOT ESTABLISH");
    console.log("=".repeat(66));
    console.log("  - That anyone *controls* a balance. A balance is not key ownership;");
    console.log("    only a signature over a fresh nonce shows a key was held, and even");
    console.log("    then not exclusively.");
    console.log("  - That the holder set is complete" + (complete ? " (this run did cover the range)" : " (this run was PARTIAL)") + ".");
    console.log("  - Who may call a 'present' capability. Read the verified source for that.");
    console.log("  - Market value. A token balance is not money; check real liquidity.");
}

main().catch((e) => { console.error("ERROR:", e.shortMessage || e.message); process.exit(1); });
