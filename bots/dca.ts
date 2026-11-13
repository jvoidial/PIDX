// DCA bot skeleton. Credentials come from the environment only — never commit
// a private key. Run with e.g. `DCA_PRIVATE_KEY=0x... npx ts-node bots/dca.ts`.
import { ethers } from "ethers";

const RPC_URL: string = process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
const PRIVATE_KEY: string | undefined = process.env.DCA_PRIVATE_KEY;

if (!PRIVATE_KEY || !/^0x[0-9a-fA-F]{64}$/.test(PRIVATE_KEY)) {
    throw new Error("Set DCA_PRIVATE_KEY to a 0x-prefixed 32-byte hex key (use a dedicated, low-balance bot wallet).");
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Public on-chain addresses only.
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TARGET_TOKEN = "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c"; // PIDX

/**
 * Execute a single DCA swap.
 * @param amountIn - Amount of USDC to swap (in smallest unit).
 */
async function executeDCA(amountIn: bigint): Promise<void> {
    console.log(`Executing DCA: ${amountIn} USDC -> PIDX for ${wallet.address}`);
    // 1. Get quote from Uniswap API or SDK
    // 2. Build swap transaction
    // 3. Send transaction (using wallet.sendTransaction)
    // 4. Wait for receipt
}

// Run every 24 hours (86400 seconds)
// setInterval(() => executeDCA(10n * 10n ** 6n), 86400 * 1000);
// executeDCA(10n * 10n ** 6n); // manual test
