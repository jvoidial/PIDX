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
    // PublicNode is one of the most reliable free RPCs for Base
    const provider = new ethers.JsonRpcProvider('https://base-rpc.publicnode.com');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const v1 = new ethers.Contract(V1_ADDR, ABI, provider);
    const v2 = new ethers.Contract(V2_ADDR, ABI, wallet);

    console.log("Connecting to Base network...");
    const currentBlock = await provider.getBlockNumber();
    const startBlock = currentBlock - 4000000; // ~90 days of blocks
    
    let chunkSize = 100000; 
    let holders = new Set();
    const transferTopic = ethers.id("Transfer(address,address,uint256)");

    console.log("Scanning blockchain for holders... (Auto-adjusting for RPC limits)");
    
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
                if (log.topics && log.topics[2]) {
                    const toAddr = ethers.getAddress("0x" + log.topics[2].slice(26));
                    holders.add(toAddr);
                }
            }
            // If we successfully scanned a big chunk, speed up
            if (chunkSize < 100000) chunkSize *= 2; 
            await sleep(20); 
        } catch (err) {
            // If the RPC rejected the chunk size, make it smaller and try again
            chunkSize = Math.floor(chunkSize / 2);
            i -= chunkSize; 
        }
    }

    console.log(`\nScan complete. Found ${holders.size} unique addresses. Checking balances...`);
    
    let activeHolders = [];
    for (const addr of holders) {
        if (addr.toLowerCase() === TREASURY.toLowerCase()) continue;
        if (addr.toLowerCase() === DEAD.toLowerCase()) continue;
        if (addr === '0x0000000000000000000000000000000000000000') continue;
        
        try {
            const bal = await v1.balanceOf(addr);
            if (bal > 0n) {
                activeHolders.push({ addr, bal });
            }
        } catch (e) {}
    }

    console.log(`\nFound ${activeHolders.length} real holders to airdrop to.`);

    if (activeHolders.length === 0) {
        console.log("No holders found. Please ensure the token address is correct.");
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
