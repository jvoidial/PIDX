require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// All network values come from the environment. No RPC URLs or keys are
// hardcoded here beyond a public fallback endpoint, and no key is ever logged.
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    base: {
      url: BASE_RPC_URL,
      chainId: 8453,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // BaseScan is Etherscan's Base instance; the key is read from env only.
    apiKey: { base: process.env.BASESCAN_API_KEY || "" },
  },
  sourcify: { enabled: false },
};
