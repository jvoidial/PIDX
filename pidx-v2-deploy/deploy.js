const solc = require('solc');
const { ethers } = require('ethers');
require('dotenv').config();

// A fully standalone, standard ERC-20 token. No imports, no external libraries.
const source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PIDXv2 {
    string public name = "PIDX V2";
    string public symbol = "PIDX";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        totalSupply = 1000000000 * 10**18;
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(value <= balanceOf[from], "Insufficient balance");
        require(value <= allowance[from][msg.sender], "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
`;

async function main() {
    console.log("Compiling contract in memory...");
    const input = {
        language: 'Solidity',
        sources: { 'PIDXv2.sol': { content: source } },
        settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
    };
    
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors && output.errors.some(e => e.severity === 'error')) {
        console.error("Compilation failed:", output.errors);
        process.exit(1);
    }
    
    const contract = output.contracts['PIDXv2.sol']['PIDXv2'];
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    console.log("Connecting to Base network...");
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Deploying from Treasury wallet:", wallet.address);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    
    console.log("Sending transaction (waiting 5-10 seconds)...");
    const contractDeployed = await factory.deploy();
    await contractDeployed.waitForDeployment();
    
    console.log(`\n✅ SUCCESS! Your new PIDX V2 is live at:\n`);
    console.log(await contractDeployed.getAddress());
    console.log("\nCopy the address above and paste it into your website configuration!");
}

main().catch((error) => { 
    console.error("Deployment failed:", error.message || error); 
    process.exitCode = 1; 
});
