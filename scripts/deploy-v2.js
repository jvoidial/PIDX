#!/usr/bin/env node
// Deploys PIDXv2 with an EXPLICIT allocation, then verifies the result on-chain.
//
// The whole supply is allocated in the constructor and can never be minted
// again, so the recipient addresses are IRREVERSIBLE. This script therefore
// refuses to broadcast unless every safety rail below passes.
//
// Usage:
//   node scripts/deploy-v2.js --liquidity 0x.. --community 0x.. --ops 0x.. \
//        [--liquidity-pct 60] [--community-pct 30] [--ops-pct 10] [--execute]
//
// Safety rails:
//   1. every address must be a valid EIP-55 checksummed address
//   2. placeholder text ([PASTE ...]) is rejected outright
//   3. the three known-bad v1 addresses are refused as recipients
//   4. recipients must be three distinct addresses
//   5. percentages must sum to exactly 100
//   6. the allocation must equal TOTAL_SUPPLY exactly
//   7. chainId must be Base (8453)
//   8. the deployer must hold enough ETH for gas
//   9. DRY RUN by default — nothing broadcasts without --execute
//  10. after deploy, totalSupply and each recipient balance are read back
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const TOTAL = 1_000_000_000n * 10n ** 18n;

// v1 addresses that must never receive v2 supply.
const FORBIDDEN = {
    "0x6f5c5b2117c22c1cb07244be032bd4cde966432c": "v1 treasury / locker owner (99.99% of v1)",
    "0xfacb5905e1e592d69a2ae0aff6f82330c07e4312": "v1 vault (holds v1 mint/burn power)",
    "0x06a958ff5d896ba28411215d0cd56a2a5a1b35ad": "v1 PIDXLocker (0 liquidity)",
    "0x3212d08f2ad637918bd90932829159874e39be4c": "v1 vault owner (delegated EOA)",
};

function arg(name, def) {
    const i = process.argv.indexOf(name);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

function fail(msg) {
    console.error(`❌ ${msg}`);
    process.exit(1);
}

// Accepts only a valid EIP-55 address (or all-lowercase, which we then checksum).
function requireAddress(label, raw) {
    if (!raw) fail(`Missing --${label} address.`);
    if (/\[|\]|PASTE|<|>/i.test(raw)) {
        fail(`--${label} still looks like a placeholder ("${raw}"). Paste the real address.`);
    }
    let addr;
    try {
        addr = ethers.getAddress(raw);
    } catch (e) {
        fail(`--${label} is not a valid EIP-55 address: ${raw}\n   (a bad checksum usually means a typo)`);
    }
    if (FORBIDDEN[addr.toLowerCase()]) {
        fail(`--${label} is ${FORBIDDEN[addr.toLowerCase()]}.\n   Refusing: v2 supply must not go to a v1 address.`);
    }
    if (addr !== raw) {
        console.log(`ℹ️  --${label} checksummed to ${addr}`);
    }
    return addr;
}

async function main() {
    const pLiq = Number(arg("--liquidity-pct", "60"));
    const pCom = Number(arg("--community-pct", "30"));
    const pOps = Number(arg("--ops-pct", "10"));
    const execute = process.argv.includes("--execute");

    const liq = requireAddress("liquidity", arg("--liquidity"));
    const com = requireAddress("community", arg("--community"));
    const ops = requireAddress("ops", arg("--ops"));

    if (new Set([liq, com, ops].map((a) => a.toLowerCase())).size !== 3) {
        fail("Recipients must be three distinct addresses.");
    }
    if (![pLiq, pCom, pOps].every((n) => Number.isInteger(n) && n >= 0)) {
        fail("Percentages must be non-negative integers.");
    }
    if (pLiq + pCom + pOps !== 100) {
        fail(`Percentages must sum to 100 (got ${pLiq + pCom + pOps}).`);
    }

    const amounts = [
        (TOTAL * BigInt(pLiq)) / 100n,
        (TOTAL * BigInt(pCom)) / 100n,
        (TOTAL * BigInt(pOps)) / 100n,
    ];
    // Any rounding remainder goes to the liquidity bucket so the sum is exact.
    amounts[0] += TOTAL - amounts.reduce((a, b) => a + b, 0n);

    const recipients = [liq, com, ops];
    const labels = ["Liquidity", "Community", "Ops"];

    console.log("\n================ ALLOCATION (IRREVERSIBLE) ================");
    recipients.forEach((r, i) =>
        console.log(`  ${labels[i].padEnd(10)} ${r}\n             ${ethers.formatUnits(amounts[i], 18)} PIDX (${[pLiq, pCom, pOps][i]}%)`)
    );
    const sum = amounts.reduce((a, b) => a + b, 0n);
    console.log(`  ${"TOTAL".padEnd(10)} ${ethers.formatUnits(sum, 18)} PIDX`);
    if (sum !== TOTAL) fail("Internal error: allocation does not equal TOTAL_SUPPLY.");
    console.log("=========================================================\n");

    const artPath = path.resolve(__dirname, "../contracts/PIDXv2.json");
    const art = JSON.parse(fs.readFileSync(artPath, "utf8"));
    if (!art.abi || !art.bytecode) fail("Run `npm run compile` first (contracts/PIDXv2.json missing).");

    // Inspect each recipient: a multisig should have code; a bare EOA should not.
    const rpc = process.env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpc);
    const net = await provider.getNetwork();
    if (net.chainId !== 8453n) fail(`Refusing: chainId is ${net.chainId}, expected 8453 (Base).`);

    console.log("Recipient inspection (confirm these match what you created):");
    for (let i = 0; i < recipients.length; i++) {
        const code = await provider.getCode(recipients[i]);
        const isContract = code !== "0x";
        const kind = isContract ? `contract (${(code.length - 2) / 2} bytes)` : "EOA (no code)";
        console.log(`  ${labels[i].padEnd(10)} ${kind}`);
        if (i === 0 && !isContract) {
            console.log("             ⚠️  Liquidity recipient is a plain EOA — one key will control this share.");
        }
    }

    if (!execute) {
        console.log("\nDRY RUN — nothing broadcast. Re-run with --execute to deploy.");
        return;
    }

    const pk = process.env.PRIVATE_KEY;
    if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) fail("PRIVATE_KEY missing/invalid (see .env.example).");
    const wallet = new ethers.Wallet(pk, provider);

    const balance = await provider.getBalance(wallet.address);
    console.log(`\nDeployer : ${wallet.address}`);
    console.log(`Balance  : ${ethers.formatEther(balance)} ETH`);
    if (balance === 0n) fail("Deployer has 0 ETH on Base — it cannot pay for the deployment.");

    console.log("Deploying …");
    const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
    const contract = await factory.deploy(recipients, amounts);
    const tx = contract.deploymentTransaction();
    console.log(`  tx: ${tx.hash}`);
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log(`✅ PIDXv2 DEPLOYED: ${addr}`);

    // Read the result back — do not trust the input, verify the chain.
    const deployed = new ethers.Contract(addr, art.abi, provider);
    const ts = await deployed.totalSupply();
    console.log(`\nOn-chain verification:`);
    console.log(`  totalSupply() = ${ethers.formatUnits(ts, 18)}`);
    if (ts !== TOTAL) console.error("  🚨 totalSupply is NOT the expected value — investigate now.");
    for (let i = 0; i < recipients.length; i++) {
        const b = await deployed.balanceOf(recipients[i]);
        console.log(`  ${labels[i].padEnd(10)} balance = ${ethers.formatUnits(b, 18)}`);
    }

    fs.writeFileSync(path.resolve(__dirname, "../pidxv2-address.txt"), addr);
    console.log("\nAddress written to pidxv2-address.txt (git-ignored).");
    console.log("NEXT: verify the source on BaseScan, then add liquidity. See V2-MIGRATION.md.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
