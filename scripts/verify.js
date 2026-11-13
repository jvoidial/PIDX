// Verifies the deployed PIDXLocker on BaseScan using env vars only.
// Usage:  BASESCAN_API_KEY=... node scripts/verify.js 0x<address> [constructorArgs...]
require("dotenv").config();
const { run } = require("hardhat");

async function main() {
    const address = process.argv[2];
    if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
        throw new Error("Usage: node scripts/verify.js 0x<contractAddress>");
    }
    if (!process.env.BASESCAN_API_KEY) {
        throw new Error("Missing BASESCAN_API_KEY (see .env.example). Rotate it if it was ever exposed.");
    }
    const constructorArgs = process.argv.slice(3);
    await run("verify:verify", { address, constructorArguments: constructorArgs });
    console.log("✅ Verification submitted for", address);
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
