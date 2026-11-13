#!/usr/bin/env node
// Deploys PIDXv2 with an EXPLICIT allocation, then prints the addresses.
//
// The whole supply is allocated in the constructor. There is no mint after this.
// You must decide the split BEFORE running. Defaults below are deliberately
// conservative and are meant to be edited by you, not trusted blindly.
//
// Usage:
//   node scripts/deploy-v2.js --liquidity 0xLIQ --community 0xCOMM --ops 0xOPS
//        [--liquidity-pct 60] [--community-pct 30] [--ops-pct 10]
//
// Safety rails:
//   - refuses to run unless the three percentages sum to 100
//   - refuses the zero address and duplicate recipients
//   - DRY RUN by default; pass --execute to actually broadcast
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

function arg(name, def) {
    const i = process.argv.indexOf(name);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

async function main() {
    const liq = arg("--liquidity");
    const com = arg("--community");
    const ops = arg("--ops");
    const pLiq = Number(arg("--liquidity-pct", "60"));
    const pCom = Number(arg("--community-pct", "30"));
    const pOps = Number(arg("--ops-pct", "10"));
    const execute = process.argv.includes("--execute");

    if (!liq || !com || !ops) {
        console.error("Usage: node scripts/deploy-v2.js --liquidity 0x.. --community 0x.. --ops 0x.. [--execute]");
        process.exit(1);
    }
    for (const [n, a] of [["liquidity", liq], ["community", com], ["ops", ops]]) {
        if (!ethers.isAddress(a)) { console.error(`${n} is not a valid address: ${a}`); process.exit(1); }
    }
    if (new Set([liq.toLowerCase(), com.toLowerCase(), ops.toLowerCase()]).size !== 3) {
        console.error("Recipients must be three distinct addresses.");
        process.exit(1);
    }
    if (pLiq + pCom + pOps !== 100) {
        console.error(`Percentages must sum to 100 (got ${pLiq + pCom + pOps}).`);
        process.exit(1);
    }

    const TOTAL = 1_000_000_000n * 10n ** 18n;
    const amounts = [
        (TOTAL * BigInt(pLiq)) / 100n,
        (TOTAL * BigInt(pCom)) / 100n,
        (TOTAL * BigInt(pOps)) / 100n,
    ];
    // Assign any rounding remainder to the liquidity bucket so the sum is exact.
    const allocated = amounts.reduce((a, b) => a + b, 0n);
    amounts[0] += TOTAL - allocated;

    const recipients = [liq, com, ops];
    console.log("Allocation plan (fixed, no mint afterwards):");
    recipients.forEach((r, i) => console.log(`  ${r}  ${ethers.formatUnits(amounts[i], 18)} PIDX`));
    const sum = amounts.reduce((a, b) => a + b, 0n);
    console.log(`  TOTAL ${ethers.formatUnits(sum, 18)} (must equal 1000000000.0)`);
    if (sum !== TOTAL) { console.error("Internal error: allocation does not equal TOTAL_SUPPLY"); process.exit(1); }

    const artPath = path.resolve(__dirname, "../contracts/PIDXv2.json");
    const art = JSON.parse(fs.readFileSync(artPath, "utf8"));
    if (!art.abi || !art.bytecode) throw new Error("Run `npm run compile` first (contracts/PIDXv2.json missing).");

    if (!execute) {
        console.log("\nDRY RUN — nothing broadcast. Re-run with --execute to deploy.");
        return;
    }

    const pk = process.env.PRIVATE_KEY;
    if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) throw new Error("PRIVATE_KEY missing/invalid (see .env.example)");
    const rpc = process.env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);

    const net = await provider.getNetwork();
    if (net.chainId !== 8453n) throw new Error(`Refusing to deploy: chainId is ${net.chainId}, expected 8453 (Base).`);

    console.log(`\nDeploying from ${wallet.address} on chainId ${net.chainId} …`);
    const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
    const contract = await factory.deploy(recipients, amounts);
    await contract.waitForDeployment();
    const addr = await contract.getAddress();

    fs.writeFileSync(path.resolve(__dirname, "../pidxv2-address.txt"), addr);
    console.log(`✅ PIDXv2 DEPLOYED: ${addr}`);
    console.log("   Address written to pidxv2-address.txt (git-ignored).");
    console.log("   NEXT: verify on BaseScan, then add liquidity. See V2-MIGRATION.md.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
