
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Simple ERC-4626 Vault (Unaudited)
/// @notice This is a skeleton. Do not use with real funds.
contract SimpleVault is ERC4626, Ownable {
    constructor(IERC20 asset, string memory name, string memory symbol)
        ERC4626(asset) ERC20(name, symbol) Ownable(msg.sender) {}

    /// @dev Placeholder for strategy logic.
    /// In a real vault, this would route assets to a yield source.
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    /// @dev Allows the owner to simulate yield by transferring extra assets.
    function simulateYield(uint256 amount) external onlyOwner {
        IERC20(asset()).transferFrom(msg.sender, address(this), amount);
    }
}
