#!/usr/bin/env bash
# deploy-staking.sh — deploy InfinityStake on Base + pre-fund rewards
set -euo pipefail
cd "$(dirname "$0")/.."
[[ -f .env ]] || { echo "[FAIL] create .env with DEPLOYER_PK, BASE_RPC"; exit 1; }
# shellcheck disable=SC1091
source .env

PIDX="${PIDX_TOKEN:-0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c}"
RPC="${BASE_RPC:-https://base-rpc.publicnode.com}"
PK="${DEPLOYER_PK:?set DEPLOYER_PK in .env}"

# Optionally stake LP tokens instead of PIDX
STAKE="${STAKE_TOKEN:-$PIDX}"
REWARD="${REWARD_TOKEN:-$PIDX}"

echo "── Deploying InfinityStake ────────────────────────────────────"
echo "  stakeToken : $STAKE"
echo "  rewardToken: $REWARD"
echo "  rpc        : $RPC"

forge build --contracts staking/InfinityStake.sol

ADDR=$(forge create staking/InfinityStake.sol:InfinityStake \
  --rpc-url "$RPC" \
  --private-key "$PK" \
  --constructor-args "$STAKE" "$REWARD" \
  --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["deployedTo"])')

echo "[OK] deployed to $ADDR"
echo "STAKE_ADDR=$ADDR" > staking/.stake-address

# Suggested reward rate: emit 10,000 PIDX/day
# 10000e18 per 86400 seconds = 115740740740740740 wei/sec
RATE=115740740740740740
echo ""
echo "── Next steps ─────────────────────────────────────────────────"
echo "  Fund the reward pool (transfer PIDX to $ADDR):"
echo "    cast send $REWARD 'transfer(address,uint256)' $ADDR 10000000000000000000000000 --rpc-url $RPC --private-key \$PK"
echo ""
echo "  Set reward rate (10,000 PIDX/day):"
echo "    cast send $ADDR 'setRewardRate(uint256)' $RATE --rpc-url $RPC --private-key \$PK"
echo ""
echo "  Approve staking contract to pull PIDX:"
echo "    cast send $REWARD 'approve(address,uint256)' $ADDR 115792089237316195423570985008687907853269984665640564039457584007913129639935 --rpc-url $RPC --private-key \$PK"
