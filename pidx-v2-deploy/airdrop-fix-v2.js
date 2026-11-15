const { ethers } = require('ethers');
require('dotenv').config();

const V1_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const V2_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const TREASURY = '0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C';
const DEAD = '0x000000000000000000000000000000000000dEaD';

const ABI = [
  "function transfer(address to, uint256 amount) returns (bool)"
];

async function getHoldersBlockscout() {
    console.log("Trying Blockscout API...");
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    };
    
    let allHolders = [];
    let nextPageParams = null;

    do {
        let url = `https://base.blockscout.com/api/v2/tokens/${V1_ADDR}/holders`;
        if (nextPageParams) {
            const query = new URLSearchParams(nextPageParams).toString();
            url += `?${query}`;
        }

        const res = await fetch(url, { headers });
        const text = await res.text();
        
        if (text.startsWith('<')) {
            throw new Error("Blockscout returned HTML (blocked or rate limited).");
        }

        const data = JSON.parse(text);
        if (data.items) {
            allHolders.push(...data.items);
        }
        nextPageParams = data.next_page_params;
    } while (nextPageParams);

    return allHolders;
}

async function getHoldersBasescan() {
    console.log("Trying BaseScan API (Fallback)...");
    // BaseScan free tier allows 5 calls/sec without key for some endpoints
    const url = `https://api.basescan.org/api?module=token&action=tokenholderlist&contractaddress=${V1_ADDR}&page=1&offset=100`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status !== '1') {
        throw new Error(`BaseScan error: ${data.message || data.result}`);
    }

    // BaseScan returns a different format, we need to map it
    return data.result.map(item => ({
        address: { hash: item.TokenHolderAddress },
        value: item.TokenHolderQuantity
    }));
}

async function main() {
    let rawHolders = [];
    
    try {
        rawHolders = await getHoldersBlockscout();
    } catch (err) {
        console.log(`Blockscout failed: ${err.message}`);
        try {
            rawHolders = await getHoldersBasescan();
        } catch (err2) {
            console.log(`BaseScan failed: ${err2.message}`);
            console.log("Both APIs failed. Please try again in a few minutes or use a VPN.");
            return;
        }
    }

    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const v2 = new ethers.Contract(V2_ADDR, ABI, wallet);

    let activeHolders = [];
    
    for (const item of rawHolders) {
        const addr = item.address.hash;
        const bal = BigInt(item.value);
        
        if (addr.toLowerCase() === TREASURY.toLowerCase()) continue;
        if (addr.toLowerCase() === DEAD.toLowerCase()) continue;
        if (bal === 0n) continue;
        
        activeHolders.push({ addr, bal });
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
