// Deploys PIDXLocker using ONLY environment variables. Never hardcode keys.
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

function requireEnv(name) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
    return v;
}

async function main() {
    const pk = requireEnv("PRIVATE_KEY");
    if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) throw new Error("PRIVATE_KEY must be a 0x-prefixed 32-byte hex string");
    const rpc = process.env.BASE_RPC_URL || "https://mainnet.base.org";

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);

    const artPath = path.resolve(__dirname, "../contracts/PIDXLocker.json");
    const art = JSON.parse(fs.readFileSync(artPath, "utf8"));
    if (!art.abi || !art.bytecode) throw new Error("contracts/PIDXLocker.json must contain abi + bytecode (run `npm run compile`)");

    const net = await provider.getNetwork();
    console.log("Deploying to chainId", net.chainId.toString(), "from", wallet.address);

    const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const addr = await contract.getAddress();
    const outPath = path.resolve(__dirname, "../locker-address.txt");
    fs.writeFileSync(outPath, addr);
    console.log("✅ LOCKER DEPLOYED:", addr);
    console.log("   Address written to locker-address.txt (git-ignored).");
    console.log("   Update the data-address on #locker-addr in index.html if this is a new deployment.");
}

main().catch((e) => { console.error("❌", e.message); process.exit(1); });
