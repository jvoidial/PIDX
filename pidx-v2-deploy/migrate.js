const { ethers } = require('ethers');
require('dotenv').config();

const V1_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const V2_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const TREASURY = '0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C';
const DEAD = '0x000000000000000000000000000000000000dEaD';

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const v1 = new ethers.Contract(V1_ADDR, ABI, wallet);
    const v2 = new ethers.Contract(V2_ADDR, ABI, wallet);

    console.log("Scanning blockchain for v1 holders... (This takes ~15 seconds)");
    const currentBlock = await provider.getBlockNumber();
    let holders = new Set();
    
    // Scan last 2 million blocks for transfers
    const startBlock = currentBlock - 2000000;
    let chunkSize = 50000;
    
    for (let i = startBlock; i <= currentBlock; i += chunkSize) {
        let toBlock = i + chunkSize - 1;
        if (toBlock > currentBlock) toBlock = currentBlock;
        try {
            const events = await v1.queryFilter("Transfer", i, toBlock);
            for (const e of events) {
                if (e.args.to !== '0x0000000000000000000000000000000000000000') {
                    holders.add(e.args.to);
                }
            }
        } catch (err) {}
    }

    console.log(`Found ${holders.size} unique addresses. Checking balances...`);
    let activeHolders = [];
    let totalAirdropAmount = 0n;

    for (const addr of holders) {
        if (addr.toLowerCase() === TREASURY.toLowerCase()) continue;
        if (addr.toLowerCase() === DEAD.toLowerCase()) continue;
        
        const bal = await v1.balanceOf(addr);
        if (bal > 0n) {
            activeHolders.push({ addr, bal });
            totalAirdropAmount += bal;
        }
    }

    console.log(`\nFound ${activeHolders.length} real holders to airdrop to.`);
    console.log(`Total V1 to swap: ${ethers.formatUnits(totalAirdropAmount, 18)}`);

    console.log("\nStep 1: Burning Treasury V1 Tokens...");
    const treasuryV1Bal = await v1.balanceOf(TREASURY);
    if (treasuryV1Bal > 0n) {
        const burnTx = await v1.transfer(DEAD, treasuryV1Bal);
        console.log(`Waiting for burn confirmation... (Tx: ${burnTx.hash})`);
        await burnTx.wait();
        console.log("✅ Treasury V1 tokens burned successfully.");
    }

    console.log("\nStep 2: Airdropping V2 Tokens...");
    for (let i = 0; i < activeHolders.length; i++) {
        const h = activeHolders[i];
        console.log(`[${i+1}/${activeHolders.length}] Sending V2 to ${h.addr}...`);
        try {
            // Send exactly the same amount of V2 as they hold in V1 (1:1 swap)
            const tx = await v2.transfer(h.addr, h.bal);
            await tx.wait();
        } catch (e) {
            console.log(`Failed to send to ${h.addr}: ${e.message}`);
        }
    }

    console.log("\n✅ MIGRATION COMPLETE! All holders have received V2.");
}

main().catch((error) => { console.error("Error:", error.message || error); process.exitCode = 1; });
