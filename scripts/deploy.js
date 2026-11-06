require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
    if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === "0x...") {
        console.log("❌ Skipping deployment. Please edit .env and add your PRIVATE_KEY.");
        return;
    }
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://mainnet.base.org");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const art = JSON.parse(fs.readFileSync("contracts/PIDXLocker.json", "utf8"));
    
    console.log("Deploying from:", wallet.address);
    const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const addr = await contract.getAddress();
    fs.writeFileSync("locker-address.txt", addr);
    console.log("✅ LOCKER DEPLOYED:", addr);
}
main().catch(console.error);
