// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InfinityStake — no-lock, auto-compound, dynamic-APY staking
/// @notice Stake PIDX or PIDX/ETH LP. Rewards accrue per block from a
///         pre-funded pool. No lockup, no minimum, no exit fee.
///         Auto-compound option folds rewards back into the stake.
contract InfinityStake {
    IERC20  public immutable stakeToken;   // PIDX or LP token
    IERC20  public immutable rewardToken;  // typically PIDX
    address public owner;

    uint256 public rewardRate;             // reward wei emitted per second
    uint256 public lastUpdate;             // last accrual timestamp
    uint256 public rewardPerTokenStored;   // accumulator
    uint256 public totalStaked;            // sum of all stakes

    // Reward divisor used to avoid overflow — 1e18 scale
    uint256 private constant PRECISION = 1e18;

    mapping(address => uint256) public stakedOf;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => bool)    public autoCompound;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateChanged(uint256 rate);
    event AutoCompoundSet(address indexed user, bool enabled);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdate = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address _stakeToken, address _rewardToken) {
        stakeToken  = IERC20(_stakeToken);
        rewardToken = IERC20(_rewardToken);
        owner = msg.sender;
        lastUpdate = block.timestamp;
    }

    // ─── Views ──────────────────────────────────────────────────────────
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored
            + ((block.timestamp - lastUpdate) * rewardRate * PRECISION) / totalStaked;
    }

    function earned(address account) public view returns (uint256) {
        return rewards[account]
            + (stakedOf[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / PRECISION;
    }

    /// @notice Approximate APY as a fraction scaled by 1e18 (e.g. 0.05e18 = 5%).
    ///         Only meaningful if rewardToken and stakeToken share a price.
    ///         If they don't, this is a ratio of token units, not USD.
    function apy() external view returns (uint256) {
        if (totalStaked == 0 || rewardRate == 0) return 0;
        uint256 yearlyRewards = rewardRate * 365 days;
        return (yearlyRewards * PRECISION) / totalStaked;
    }

    /// @notice Dynamic APY adjusted for the caller's own stake share.
    ///         Smaller stakes see the same rate — but this endpoint lets a
    ///         frontend show "your slice" of the total rewards per year.
    function myApy(address account) external view returns (uint256) {
        if (totalStaked == 0 || stakedOf[account] == 0) return 0;
        uint256 share = (stakedOf[account] * PRECISION) / totalStaked;
        uint256 yearlyRewards = rewardRate * 365 days;
        uint256 myYearly = (yearlyRewards * share) / PRECISION;
        return (myYearly * PRECISION) / stakedOf[account];
    }

    // ─── Mutations ──────────────────────────────────────────────────────
    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "amount 0");
        totalStaked += amount;
        stakedOf[msg.sender] += amount;
        require(stakeToken.transferFrom(msg.sender, address(this), amount), "transfer in failed");

        // Auto-compound pending rewards back into stake
        if (autoCompound[msg.sender] && rewards[msg.sender] > 0) {
            uint256 r = rewards[msg.sender];
            rewards[msg.sender] = 0;
            totalStaked += r;
            stakedOf[msg.sender] += r;
            emit RewardPaid(msg.sender, r);
        }
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0 && amount <= stakedOf[msg.sender], "bad amount");
        totalStaked -= amount;
        stakedOf[msg.sender] -= amount;
        require(stakeToken.transfer(msg.sender, amount), "transfer out failed");
        emit Withdrawn(msg.sender, amount);
    }

    function claim() public updateReward(msg.sender) {
        uint256 r = rewards[msg.sender];
        if (r == 0) return;
        rewards[msg.sender] = 0;
        if (autoCompound[msg.sender]) {
            totalStaked += r;
            stakedOf[msg.sender] += r;
        } else {
            require(rewardToken.transfer(msg.sender, r), "reward transfer failed");
        }
        emit RewardPaid(msg.sender, r);
    }

    function exit() external {
        withdraw(stakedOf[msg.sender]);
        claim();
    }

    function setAutoCompound(bool enabled) external {
        autoCompound[msg.sender] = enabled;
        emit AutoCompoundSet(msg.sender, enabled);
    }

    // ─── Owner ──────────────────────────────────────────────────────────
    function setRewardRate(uint256 rate) external onlyOwner updateReward(address(0)) {
        rewardRate = rate;
        emit RewardRateChanged(rate);
    }

    function fundRewards(uint256 amount) external {
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "fund failed");
    }

    function withdrawUnused(address to, uint256 amount) external onlyOwner {
        // Only withdraw the reward token, and only what's not obligated.
        // Very rough guard: don't pull below 7 days of emissions.
        uint256 obligated = rewardRate * 7 days;
        require(rewardToken.balanceOf(address(this)) >= obligated + amount, "would breach emissions");
        rewardToken.transfer(to, amount);
    }
}

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
}
