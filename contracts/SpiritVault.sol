
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SpiritVault is ERC4626, Ownable {
    constructor(IERC20 asset, string memory name, string memory symbol)
        ERC4626(asset)
        ERC20(name, symbol)
        Ownable(msg.sender)
    {}

    // Vault is now live. Future yield strategies can be added here by the owner.
}
