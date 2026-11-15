const { ethers } = require('ethers');
require('dotenv').config();

const V2_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const TREASURY = '0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C';
const DEAD = '0x000000000000000000000000000000000000dEaD';
const V1_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';

const ABI = [
  "function transfer(address to, uint256 amount) returns (bool)"
];

async function main() {
    console.log("Fetching holder list from Blockscout API...");
    
    // Fetch the holder list from Blockscout (this avoids RPC limits)
    const res = await fetch(`https://base.blockscout.com/api/v2/tokens/${V1_ADDR}/holders`);
    const data = await res.json();
    
    if (!data.items || data.items.length === 0) {
        console.log("Failed to fetch holders. The API might be down.");
        return;
    }

    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const v2 = new ethers.Contract(V2_ADDR, ABI, wallet);

    let activeHolders = [];
    
    for (const item of data.items) {
        const addr = item.address.hash;
        const bal = BigInt(item.value);
        
        // Skip treasury, dead address, and zero balances
        if (addr.toLowerCase() === TREASURY.toLowerCase()) continue;
        if (addr.toLowerCase() === DEAD.toLowerCase()) continue;
        if (bal === 0n) continue;
        
        activeHolders.push({ addr, bal });
    }

    console.log(`\nFound ${activeHolders.length} real holders to airdrop to.`);

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

    console.log("\n✅ AIRDROP COMPLETE! All holders have received V2.");
}

main().catch((error) => { console.error("Error:", error.message || error); process.exitCode = 1; });
