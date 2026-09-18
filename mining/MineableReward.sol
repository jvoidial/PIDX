// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MineableReward — proof-of-work token rewards
/// @notice Holds a pre-funded reward pool. Miners submit nonces; if keccak256
///         hash meets difficulty, they receive a fixed reward in the target token.
contract MineableReward {
    IERC20  public immutable rewardToken;   // PIDX (or any ERC-20)
    address public immutable owner;

    uint256 public rewardPerShare = 100e18; // 100 PIDX per valid nonce
    uint256 public difficulty      = 1 << 240; // tune up to make harder
    uint256 public miningStart;             // when the current epoch began
    uint256 public epochLength     = 1 days;

    mapping(address => uint256) public shares;
    mapping(uint256 => bool)    public usedNonces; // per-epoch nonce replay guard
    uint256 public epoch;
    uint256 public totalShares;

    event Mined(address indexed miner, uint256 epoch, uint256 nonce, uint256 hashPrefix, uint256 reward);
    event DifficultyChanged(uint256 newDifficulty);
    event RewardChanged(uint256 newReward);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor(address _token) {
        rewardToken = IERC20(_token);
        owner = msg.sender;
        miningStart = block.timestamp;
    }

    /// @notice Submit a hash found by the autobot.
    /// @dev The nonce must be unique per epoch and its keccak256 must be < difficulty.
    function submitWork(uint256 nonce) external {
        require(block.timestamp < miningStart + epochLength, "epoch closed");
        // Auto-roll epoch when expired
        if (block.timestamp >= miningStart + epochLength) {
            epoch++;
            miningStart = block.timestamp;
        }
        require(!usedNonces[nonce], "nonce used");

        // Work check: keccak256(abi.encodePacked(nonce, miner)) must be < difficulty
        bytes32 h = keccak256(abi.encodePacked(nonce, msg.sender, epoch));
        require(uint256(h) < difficulty, "hash above target");

        usedNonces[nonce] = true;
        shares[msg.sender] += 1;
        totalShares += 1;

        uint256 reward = rewardPerShare;
        require(rewardToken.balanceOf(address(this)) >= reward, "pool empty");
        require(rewardToken.transfer(msg.sender, reward), "transfer failed");

        emit Mined(msg.sender, epoch, nonce, uint256(h) >> 240, reward);
    }

    // ── Owner controls ─────────────────────────────────────────────────
    function setDifficulty(uint256 d) external onlyOwner {
        require(d > 0, "difficulty 0");
        difficulty = d;
        emit DifficultyChanged(d);
    }
    function setReward(uint256 r) external onlyOwner {
        rewardPerShare = r;
        emit RewardChanged(r);
    }
    function rollEpoch() external onlyOwner {
        epoch++;
        miningStart = block.timestamp;
    }
    function withdraw(address to, uint256 amount) external onlyOwner {
        rewardToken.transfer(to, amount);
    }
    /// @notice Preview: does this nonce solve for this miner right now?
    function checkWork(address miner, uint256 nonce) external view returns (bool) {
        if (usedNonces[nonce]) return false;
        if (block.timestamp >= miningStart + epochLength) return true; // any nonce would do on rollover
        bytes32 h = keccak256(abi.encodePacked(nonce, miner, epoch));
        return uint256(h) < difficulty;
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}
