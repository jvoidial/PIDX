// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20Balance {
    function balanceOf(address account) external view returns (uint256);
}

/// @title PIDX Holdings Gate (view-only, unaudited)
/// @notice Answers exactly one question: does this account hold at least
///         `threshold` PIDX right now? It holds no funds, has no transfer
///         hooks, no approvals, and no custody of any kind. It is a read
///         helper for gating UI, nothing more.
/// @dev `threshold` is a plain number of PIDX base units, not whole tokens.
///      PIDX is an 18-decimal token, so 1,000 PIDX is 1000e18. This contract
///      deliberately does NOT call decimals() on the token (that would add a
///      second external call per read); the deployer passes the value already
///      scaled, and scripts/deploy-gate.js reads decimals() to scale it safely.
contract PIDXHoldingsGate is Ownable {
    IERC20Balance public immutable pidx;
    uint256 public threshold;

    event ThresholdChanged(uint256 oldThreshold, uint256 newThreshold);

    /// @param pidxToken        The PIDX token address. Must be a contract.
    /// @param initialThreshold Minimum PIDX (in base units) to pass the gate.
    constructor(address pidxToken, uint256 initialThreshold) Ownable(msg.sender) {
        require(pidxToken != address(0), "pidx token is zero address");
        require(pidxToken.code.length > 0, "pidx token has no code");
        pidx = IERC20Balance(pidxToken);
        threshold = initialThreshold;
        emit ThresholdChanged(0, initialThreshold);
    }

    /// @notice Live PIDX balance of `account`, read from the token on every call.
    function holdingsOf(address account) external view returns (uint256) {
        return pidx.balanceOf(account);
    }

    /// @notice True when `account` holds at least `threshold` PIDX right now.
    /// @dev Reads the balance live; there is no cached snapshot to go stale.
    function meetsThreshold(address account) external view returns (bool) {
        return pidx.balanceOf(account) >= threshold;
    }

    /// @notice Owner-only. Changes the gate threshold and emits an event.
    function setThreshold(uint256 newThreshold) external onlyOwner {
        uint256 old = threshold;
        threshold = newThreshold;
        emit ThresholdChanged(old, newThreshold);
    }
}
