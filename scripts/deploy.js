
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // PIDX Token Address on Base
  const ASSET_ADDRESS = "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c"; 

  const Vault = await ethers.getContractFactory("SpiritVault");
  const vault = await Vault.deploy(ASSET_ADDRESS, "Spirit PIDX Vault", "sPIDX");

  await vault.waitForDeployment();
  console.log("SpiritVault deployed to:", await vault.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
