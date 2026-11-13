// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title PIDX v2 — "Pennies Index"
 * @notice Fixed-supply ERC-20 with NO privileged roles whatsoever.
 *
 * Design goals (each is a direct answer to a flaw in the v1 PenniesIndex contract):
 *
 *  1. NO mint. The v1 contract exposed `mint()` gated to a vault, so an attacker
 *     holding that vault key could inflate supply without limit (GoPlus
 *     `is_mintable: 1`). Here the entire supply is created once, in the
 *     constructor, and `totalSupply` is immutable afterwards.
 *
 *  2. NO burn-by-third-party. v1's `burn(from, amount)` let the vault destroy
 *     ANY holder's balance (GoPlus `owner_change_balance: 1`). There is no such
 *     function here; only a holder can move their own tokens.
 *
 *  3. NO owner, NO setVault, NO renounce. v1's `setVault()` was one-shot and
 *     locked forever, which is why v1 could never be repaired. v2 has no
 *     privileged role to begin with, so there is nothing to renounce and
 *     nothing to seize. This is strictly stronger than "renounce ownership".
 *
 *  4. NO blacklist, NO pause, NO tax, NO proxy. Nothing upgradable.
 *
 * @dev `totalSupply` is stored (not just `constant`) so that generic ERC-20
 *      tooling and block explorers that read storage see the standard value.
 *      It is assigned exactly once, in the constructor, and never again.
 */
contract PIDXv2 {
    string public constant name = "Pennies Index";
    string public constant symbol = "PIDX";
    uint8 public constant decimals = 18;

    /// @notice The one and only supply. Distribution must equal this exactly.
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10 ** 18;

    /// @notice Mirrors TOTAL_SUPPLY; exists so ERC-20 consumers read storage.
    uint256 public immutable totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @param recipients Addresses to receive the initial supply. No zero address,
     *                   no duplicates required to be absent (duplicates simply sum).
     * @param amounts    Amounts matching `recipients`, in wei. Must sum EXACTLY
     *                   to TOTAL_SUPPLY, so the whole supply is allocated at
     *                   construction and no later mint is ever needed.
     */
    constructor(address[] memory recipients, uint256[] memory amounts) {
        require(recipients.length == amounts.length, "length mismatch");
        require(recipients.length > 0, "no recipients");

        uint256 sum;
        for (uint256 i = 0; i < recipients.length; i++) {
            address to = recipients[i];
            require(to != address(0), "zero recipient");
            uint256 amt = amounts[i];
            sum += amt;
            balanceOf[to] += amt;
            emit Transfer(address(0), to, amt);
        }
        require(sum == TOTAL_SUPPLY, "must allocate full supply");

        totalSupply = TOTAL_SUPPLY;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "insufficient allowance");
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0), "zero recipient");
        uint256 bal = balanceOf[from];
        require(bal >= value, "insufficient balance");
        unchecked {
            balanceOf[from] = bal - value;
        }
        balanceOf[to] += value;
        emit Transfer(from, to, value);
    }
}
