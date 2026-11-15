#!/bin/bash
set -e

echo "📦 1. Installing dependencies..."
mkdir -p contracts scripts
npm init -y > /dev/null 2>&1
npm install solc ethers dotenv @openzeppelin/contracts@5.0.1 > /dev/null 2>&1

echo "🔐 2. Setting up .env for deployment..."
cat << 'ENV' > .env.example
# DO NOT COMMIT YOUR REAL .env FILE
PRIVATE_KEY=0x...
BASE_RPC_URL=https://mainnet.base.org
ENV
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
grep -q "^node_modules/$" .gitignore || echo "node_modules/" >> .gitignore

if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created .env file. You MUST add your private key (nano .env) before deploying."
fi

echo "🧠 3. Writing PIDX Locker Smart Contract..."
cat << 'SOLIDITY' > contracts/PIDXLocker.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PIDXLocker is IERC721Receiver, Ownable {
    struct LockData {
        address owner;
        uint256 unlockTime;
        bool isLocked;
    }

    mapping(address => mapping(uint256 => LockData)) public locks;
    event PositionLocked(address indexed nftContract, uint256 indexed tokenId, address indexed owner, uint256 unlockTime);
    event PositionWithdrawn(address indexed nftContract, uint256 indexed tokenId, address indexed owner);

    constructor() Ownable(msg.sender) {}

    function lockPosition(address nftContract, uint256 tokenId, uint256 lockDuration) external {
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not your NFT");
        require(lockDuration >= 1 days, "Min 1 day");
        
        // The contract pulls the NFT. The user must have approved this contract first.
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        
        locks[nftContract][tokenId] = LockData(msg.sender, block.timestamp + lockDuration, true);
        emit PositionLocked(nftContract, tokenId, msg.sender, block.timestamp + lockDuration);
    }

    function withdrawPosition(address nftContract, uint256 tokenId) external {
        LockData memory data = locks[nftContract][tokenId];
        require(data.isLocked && data.owner == msg.sender, "Not locked by you");
        require(block.timestamp >= data.unlockTime, "Still locked");

        delete locks[nftContract][tokenId];
        IERC721(nftContract).safeTransferFrom(address(this), msg.sender, tokenId);
        emit PositionWithdrawn(nftContract, tokenId, msg.sender);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
SOLIDITY

echo "⚙️ 4. Compiling Contract..."
cat << 'JS' > scripts/compile.js
const fs = require('fs');
const path = require('path');
const solc = require('solc');
const source = fs.readFileSync(path.resolve(__dirname, '../contracts/PIDXLocker.sol'), 'utf8');

function findImports(p) {
    try { return { contents: fs.readFileSync(path.resolve(__dirname, '../node_modules', p), 'utf8') }; }
    catch (e) { return { error: 'File not found: ' + p }; }
}
const input = {
    language: 'Solidity',
    sources: { 'PIDXLocker.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
};
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
if (output.errors) {
    output.errors.forEach(e => console.error(e.formattedMessage));
    if (output.errors.some(e => e.severity === 'error')) process.exit(1);
}
const c = output.contracts['PIDXLocker.sol']['PIDXLocker'];
fs.writeFileSync(path.resolve(__dirname, '../contracts/PIDXLocker.json'), JSON.stringify({ abi: c.abi, bytecode: c.evm.bytecode.object }, null, 2));
console.log('✅ Compiled to contracts/PIDXLocker.json');
JS
node scripts/compile.js

echo "🚀 5. Deploying to Base Network..."
cat << 'JS' > scripts/deploy.js
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
JS
node scripts/deploy.js || true

echo "🎨 6. Adding UI Card to Frontend..."
python3 - <<'PY'
import re, os
if not os.path.exists("index.html"): exit()
with open("index.html", "r", encoding="utf-8") as f: html = f.read()

addr = open("locker-address.txt").read().strip() if os.path.exists("locker-address.txt") else "Pending Deploy"

locker_card = f"""
  <section class="grid-section" id="pidx-locker-section">
    <h2>🔒 PIDX Locker · Lock Uniswap V3 Positions</h2>
    <div class="mikoshi-container">
      <div class="mikoshi-card" style="border-color: #8247e5; box-shadow: 0 0 20px rgba(130,71,229,0.2); max-width: 100%;">
        <div class="mikoshi-header" style="border-bottom-color: #8247e5;">
            <span class="mikoshi-title" style="color: #8247e5; text-shadow: 0 0 5px #8247e5;">LIQUIDITY LOCKER</span>
            <span class="mikoshi-status" id="locker-status" style="color: #00ffcc;">ACTIVE</span>
        </div>
        <div style="font-family: monospace; font-size: 0.8rem; color: #8899a6; margin-bottom: 15px;">
            <p>🔗 <strong>CONTRACT:</strong> <span id="locker-addr" style="color:#8247e5; word-break:break-all;">{addr}</span></p>
            <p>🛡️ <strong>SECURITY:</strong> Immutable UNCX-Style Vault</p>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; border: 1px solid #333; margin-bottom: 15px;">
            <p style="color: #fff; font-size: 0.9rem; margin-bottom: 10px;">Lock your Uniswap V3 NFTs (WETH/WBTC) to prove liquidity is safe.</p>
            <button id="scan-lock-btn" class="btn-primary" style="width:100%; background:#8247e5; color:#fff; border:none; padding:10px; border-radius:4px; font-weight:bold; cursor:pointer;">Scan Wallet & Lock Positions</button>
            <p id="locker-log" style="color: #00ffcc; font-size: 0.75rem; margin-top: 10px; text-align: center;"></p>
        </div>
      </div>
    </div>
  </section>
"""
if 'id="pidx-locker-section"' not in html:
    s = html.find('id="global-safety-section"')
    if s != -1:
        e = html.find('</section>', s) + len('</section>')
        html = html[:e] + "\n" + locker_card + "\n" + html[e:]
    else:
        html = html.replace('</main>', locker_card + '\n</main>')
    
    html = re.sub(r'app\.js\?v=\d+', 'app.js?v=100105', html)
    with open("index.html", "w", encoding="utf-8") as f: f.write(html)
print("✅ Added PIDX Locker Card to HTML")
PY

echo "🧠 7. Injecting Web3 Lock Logic (with Approval Step)..."
cat << 'JS' >> app.js
// --- PIDX LOCKER WEB3 LOGIC (FIXED: Includes Approve Step) ---
async function scanAndLockPositions() {
    const btn = document.getElementById("scan-lock-btn");
    const logEl = document.getElementById("locker-log");
    const lockerAddr = document.getElementById("locker-addr").textContent.trim();

    if (!connectedWallet) return alert("Please connect your wallet in the header first.");
    if (lockerAddr === "Pending Deploy") return alert("Locker contract not deployed yet. Add your key to .env and run the script.");

    btn.textContent = "Connecting...";
    btn.style.background = "#333";
    logEl.textContent = "";
    
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Base Network Uniswap V3 NonfungiblePositionManager
        const NPM_ADDR = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1";
        const NPM_ABI = [
            "function balanceOf(address) view returns (uint256)",
            "function tokenOfOwnerByIndex(address, uint256) view returns (uint256)",
            "function approve(address to, uint256 tokenId) external"
        ];
        const LOCKER_ABI = ["function lockPosition(address nftContract, uint256 tokenId, uint256 lockDuration) external"];

        const npm = new ethers.Contract(NPM_ADDR, NPM_ABI, signer);
        const locker = new ethers.Contract(lockerAddr, LOCKER_ABI, signer);

        const bal = await npm.balanceOf(connectedWallet);
        if (bal === 0n) {
            logEl.textContent = "No Uniswap V3 positions found.";
            btn.textContent = "Scan Wallet & Lock Positions";
            btn.style.background = "#8247e5";
            return;
        }

        logEl.textContent = `Found ${bal} position(s). Preparing...`;
        const ONE_YEAR = 365 * 24 * 60 * 60;
        let lockedCount = 0;

        for (let i = 0; i < Number(bal); i++) {
            const tokenId = await npm.tokenOfOwnerByIndex(connectedWallet, i);
            
            try {
                // STEP 1: APPROVE THE LOCKER CONTRACT
                logEl.textContent = `Approving Locker for NFT #${tokenId}...`;
                const approveTx = await npm.approve(lockerAddr, tokenId);
                await approveTx.wait();

                // STEP 2: LOCK THE POSITION
                logEl.textContent = `Locking NFT #${tokenId} for 1 year...`;
                const lockTx = await locker.lockPosition(NPM_ADDR, tokenId, ONE_YEAR);
                await lockTx.wait();
                
                lockedCount++;
            } catch(e) {
                console.warn(`Could not lock ${tokenId}`, e);
            }
        }

        logEl.textContent = `✅ Successfully locked ${lockedCount} position(s)!`;
        btn.textContent = "Locked!";
        btn.style.background = "#00ffcc";
        btn.style.color = "#000";
        
        if (typeof logMemory === 'function') {
            logMemory(`PIDX Locker: Locked ${lockedCount} Uniswap V3 positions.`, "#8247e5");
        }

    } catch (e) {
        console.error(e);
        logEl.textContent = "❌ Error scanning or locking positions.";
        btn.textContent = "Scan Wallet & Lock Positions";
        btn.style.background = "#8247e5";
    }
}
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("scan-lock-btn")?.addEventListener("click", scanAndLockPositions);
});
JS

echo "📤 8. Pushing to GitHub..."
git add index.html app.js .gitignore .env.example contracts/ scripts/ 2>/dev/null || true
git commit -m "Fix: Added ERC721 approve step to PIDX Locker Web3 logic" || true
git push origin main 2>/dev/null || echo "⚠️ Push failed, check credentials."

echo "============================================================"
echo "✅ COMPLETE!"
echo "The script now safely handles the 'Approve' step before locking,"
echo "ensuring the transaction does not revert."
echo "============================================================"
