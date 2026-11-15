// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

/**
 * @title PIDXv2Mainnet — the source that is ACTUALLY DEPLOYED on Base mainnet
 * @notice Address: 0x172B97517c42f9491f6100333b9ea2e42a6D3181
 *
 * This file is the exact source published by BaseScan for that address
 * ("Contract Source Code Verified", Exact Match, solc 0.8.38, optimizer OFF).
 * Recompiling it reproduces the on-chain code section byte-for-byte.
 *
 * It differs from contracts/PIDXv2.sol, which is a SEPARATE, UNDEPLOYED design
 * that allocates the supply to several recipients in the constructor. The two
 * contracts share the same security properties (no mint, no burn, no owner,
 * fixed 1e9 supply) but are NOT the same bytecode:
 *
 *   deployed (this file) : constructor()                        -> mints 100% to msg.sender
 *   undeployed (PIDXv2)  : constructor(address[], uint256[])    -> distributes at construction
 *
 * The only edit from the verified source is the contract identifier
 * (`PIDXv2` -> `PIDXv2Mainnet`), so it can live alongside PIDXv2.sol without a
 * compilation-name collision. The identifier does not change the executable
 * code section; it only changes the trailing CBOR metadata hash.
 */
contract PIDXv2Mainnet {
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
