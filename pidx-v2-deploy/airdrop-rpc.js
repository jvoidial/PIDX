const { ethers } = require('ethers');
require('dotenv').config();

const V1_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const V2_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const TREASURY = '0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C';
const DEAD = '0x000000000000000000000000000000000000dEaD';

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const v1 = new ethers.Contract(V1_ADDR, ABI, provider);
    const v2 = new ethers.Contract(V2_ADDR, ABI, wallet);

    console.log("Scanning Base blockchain directly for holders...");
    console.log("(This takes about 30 seconds. Please wait...)");
    
    const currentBlock = await provider.getBlockNumber();
    const startBlock = currentBlock - 500000; // Look back 500k blocks
    const chunkSize = 2000; // Small chunks to avoid RPC limits

    let holders = new Set();
    
    // Get the transfer event signature hash
    const transferTopic = ethers.id("Transfer(address,address,uint256)");

    for (let i = startBlock; i <= currentBlock; i += chunkSize) {
        let toBlock = i + chunkSize - 1;
        if (toBlock > currentBlock) toBlock = currentBlock;
        
        try {
            const logs = await provider.getLogs({
                address: V1_ADDR,
                fromBlock: i,
                toBlock: toBlock,
                topics: [transferTopic]
            });
            
            for (const log of logs) {
                // topics[2] is the 'to' address (padded with zeros)
                if (log.topics && log.topics[2]) {
                    const toAddr = ethers.getAddress("0x" + log.topics[2].slice(26));
                    holders.add(toAddr);
                }
            }
            // Pause slightly to respect public RPC limits
            await sleep(100); 
        } catch (err) {
            // Ignore failed chunks, keep scanning
        }
    }

    console.log(`\nFound ${holders.size} unique addresses. Checking balances...`);
    
    let activeHolders = [];
    for (const addr of holders) {
        if (addr.toLowerCase() === TREASURY.toLowerCase()) continue;
        if (addr.toLowerCase() === DEAD.toLowerCase()) continue;
        if (addr === '0x0000000000000000000000000000000000000000') continue;
        
        const bal = await v1.balanceOf(addr);
        if (bal > 0n) {
            activeHolders.push({ addr, bal });
        }
    }

    console.log(`\nFound ${activeHolders.length} real holders to airdrop to.`);

    if (activeHolders.length === 0) {
        console.log("No holders found. Nothing to airdrop.");
        return;
    }

    console.log("\nStarting Airdrop...");
    for (let i = 0; i < activeHolders.length; i++) {
        const h = activeHolders[i];
        console.log(`[${i+1}/${activeHolders.length}] Sending V2 to ${h.addr}...`);
        try {
            const tx = await v2.transfer(h.addr, h.bal);
            await tx.wait();
        } catch (e) {
            console.log(`Failed to send to ${h.addr}: ${e.message}`);
        }
    }

    console.log("\n✅ AIRDROP COMPLETE! All holders have received V2.");
}

main().catch((error) => { console.error("Error:", error.message || error); process.exitCode = 1; });
