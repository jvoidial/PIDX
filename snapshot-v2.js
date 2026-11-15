const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const TOKEN = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const TREASURY = '0x6f5c5b2117c22c1cb07244be032bd4cde966432c';
const COMPROMISED = '0x3212d08f2ad637918bd90932829159874e39be4c';

const erc20 = new ethers.Contract(TOKEN, [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address) view returns (uint256)'
], provider);

async function run() {
  console.log("Scanning Transfer events for PIDX v1... (This takes ~30 seconds)");
  const currentBlock = await provider.getBlockNumber();
  
  // Query all transfers in chunks to avoid RPC limits
  let holders = new Set();
  const chunkSize = 50000;
  for (let i = 0; i <= currentBlock; i += chunkSize) {
    let toBlock = i + chunkSize - 1;
    if (toBlock > currentBlock) toBlock = currentBlock;
    
    try {
      const events = await erc20.queryFilter(erc20.filters.Transfer(), i, toBlock);
      for (const e of events) {
        holders.add(e.args.to.toLowerCase());
      }
    } catch (err) {
      // skip errors on empty blocks
    }
  }

  console.log(`Found ${holders.size} unique addresses that ever received PIDX.`);
  console.log("Checking current balances...");

  let validHolders = [];
  let totalValidSupply = 0n;

  for (const addr of holders) {
    if (addr === '0x0000000000000000000000000000000000000000') continue;
    if (addr === TREASURY) continue;
    if (addr === COMPROMISED) continue;

    const bal = await erc20.balanceOf(addr);
    if (bal > 0n) {
      validHolders.push({ address: addr, balance: bal });
      totalValidSupply += bal;
    }
  }

  console.log(`\n=== SNAPSHOT COMPLETE ===`);
  console.log(`Valid Holders (excluding Treasury & Compromised): ${validHolders.length}`);
  console.log(`Total Supply held by real users: ${ethers.formatUnits(totalValidSupply, 18)} PIDX`);
  
  console.log("\n--- AIRDROP LIST (Paste this to your Agent) ---");
  const fs = require('fs');
  const airdropData = validHolders.map(h => ({
    address: h.address,
    amount: ethers.formatUnits(h.balance, 18)
  }));
  fs.writeFileSync('v2-airdrop.json', JSON.stringify(airdropData, null, 2));
  console.log("Saved to v2-airdrop.json");
  console.log(airdropData);
}

run().catch(console.error);
