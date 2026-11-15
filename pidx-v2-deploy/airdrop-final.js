const { ethers } = require('ethers');
require('dotenv').config();

const V1_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const V2_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';

const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// The 6 addresses found by the scanner
const HOLDERS = [
  '0xcD6b980029E6E6e0733ac8eC3E02be9410D09799',
  '0x498581fF718922c3f8e6A244956aF099B2652b2b',
  '0xC10eE9031F2a0B84766A86B55a8D90F357910fb4',
  '0x7a034d928D0D2C016C496cFc70599b9dFbab8A1C',
  '0xF216a2369FfD371B0167d29db50c3452568EF0dE',
  '0x8F10B468b06c6FD214B65F87778827F7D113f996'
];

async function main() {
    // Switch back to the most reliable official Base RPC
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const v1 = new ethers.Contract(V1_ADDR, ABI, provider);
    const v2 = new ethers.Contract(V2_ADDR, ABI, wallet);

    console.log("Checking balances to prevent double-sending...\n");

    for (let i = 0; i < HOLDERS.length; i++) {
        const addr = HOLDERS[i];
        try {
            const v1Bal = await v1.balanceOf(addr);
            const v2Bal = await v2.balanceOf(addr);

            if (v1Bal === 0n) {
                console.log(`[${i+1}/6] ${addr} has 0 V1. Skipping.`);
                continue;
            }

            if (v2Bal > 0n) {
                console.log(`[${i+1}/6] ${addr} already received V2. Skipping.`);
                continue;
            }

            console.log(`[${i+1}/6] Sending V2 to ${addr}...`);
            // Send the transaction
            const tx = await v2.transfer(addr, v1Bal);
            console.log(`      Broadcasted! Hash: ${tx.hash}`);
            
            // Add a 3-second delay to let the network process it
            await new Promise(r => setTimeout(r, 3000));
        } catch (e) {
            console.log(`[${i+1}/6] Failed to send to ${addr}: ${e.message}`);
        }
    }

    console.log("\n✅ ALL DONE! The holders have received their V2 tokens.");
}

main().catch((error) => { console.error("Error:", error.message || error); process.exitCode = 1; });
