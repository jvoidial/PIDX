// Deploys PIDXHoldingsGate to Base using ONLY environment variables.
// Usage:  node scripts/deploy-gate.js
//
// The gate address is NOT invented here and NOT written into index.html
// automatically. After deploying, paste the printed address into the
// data-address attribute of #gate-addr in index.html (same pattern as the
// other deployed addresses). Until that is done, the frontend shows
// "Eligibility check unavailable" — it never guesses.
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

function requireEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
    return v;
}

// Accepts only a valid EIP-55 address (or all-lowercase, which we then checksum).
// Placeholder text and the zero address are rejected outright.
function requireAddress(label, raw) {
    if (!raw) throw new Error(`Missing ${label}.`);
    if (/\[|\]|PASTE|<|>/i.test(raw)) throw new Error(`${label} still looks like a placeholder ("${raw}").`);
    let addr;
    try { addr = ethers.getAddress(raw); }
    catch (_) { throw new Error(`${label} is not a valid EIP-55 address: ${raw}`); }
    if (addr === ethers.ZeroAddress) throw new Error(`${label} is the zero address.`);
    return addr;
}

async function main() {
    const pk = requireEnv("PRIVATE_KEY");
    if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) throw new Error("PRIVATE_KEY must be a 0x-prefixed 32-byte hex string");
    const rpc = process.env.BASE_RPC_URL || "https://mainnet.base.org";

    // The PIDX token is a known deployed contract; allow an env override but
    // default to the verified address in app.js.
    // The gate measures holdings of the live token. Default to PIDX V2 (no
    // mint/burn/owner). Override with PIDX_TOKEN when the token changes.
    const tokenAddr = requireAddress("PIDX_TOKEN", process.env.PIDX_TOKEN || "0x172B97517c42f9491f6100333b9ea2e42a6D3181");

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);

    // Read decimals() from the token instead of hardcoding 18, so the threshold
    // is scaled correctly even if the token ever changes.
    const erc20 = new ethers.Contract(tokenAddr, ["function decimals() view returns (uint8)"], provider);
    const decimals = Number(await erc20.decimals());
    const threshold = 1000n * (10n ** BigInt(decimals));

    const artPath = path.resolve(__dirname, "../contracts/PIDXHoldingsGate.json");
    const art = JSON.parse(fs.readFileSync(artPath, "utf8"));
    if (!art.abi || !art.bytecode) throw new Error("contracts/PIDXHoldingsGate.json must contain abi + bytecode (run `npm run compile`)");

    const net = await provider.getNetwork();
    console.log("Deploying PIDXHoldingsGate to chainId", net.chainId.toString(), "from", wallet.address);
    console.log("  token:", tokenAddr, "decimals:", decimals, "threshold:", threshold.toString());

    const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
    const contract = await factory.deploy(tokenAddr, threshold);
    await contract.waitForDeployment();

    const addr = await contract.getAddress();
    const outPath = path.resolve(__dirname, "../gate-address.txt");
    fs.writeFileSync(outPath, addr);
    console.log("✅ GATE DEPLOYED:", addr);
    console.log("   Address written to gate-address.txt (git-ignored).");
    console.log("   Now paste it into index.html: <span id=\"gate-addr\" data-address=\"" + addr + "\">");
    console.log("   Until you do, the frontend shows 'Eligibility check unavailable'.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
