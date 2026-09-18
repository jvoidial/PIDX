#!/usr/bin/env bash
# deploy-all.sh — deploy MineableReward + InfinityStake, write addresses
# ONLY to local files (never git). Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")"

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; N='\033[0m'
ok(){ printf "${G}[OK]${N}   %s\n" "$*"; }
bad(){ printf "${R}[FAIL]${N} %s\n" "$*"; exit 1; }
warn(){ printf "${Y}[WARN]${N} %s\n" "$*"; }

# ─── Pre-flight checks ──────────────────────────────────────────
[[ -f .env ]] || bad "run ./setup-secrets.sh first"
source .env
[[ -n "${DEPLOYER_PK:-}" ]] || bad "DEPLOYER_PK not set in .env"
command -v forge >/dev/null 2>&1 || bad "forge not installed — run: bash mining/install-foundry-termux.sh"

RPC="${BASE_RPC:-https://base-rpc.publicnode.com}"
PIDX="${PIDX_TOKEN:-0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c}"

# ─── Deployer address + balance check ───────────────────────────
echo "── Checking deployer ──────────────────────────────────────────"
DEPLOYER_ADDR=$(cast wallet address --private-key "$DEPLOYER_PK")
echo "  deployer: $DEPLOYER_ADDR"
BAL=$(cast balance "$DEPLOYER_ADDR" --rpc-url "$RPC" 2>/dev/null || echo 0)
BAL_ETH=$(python3 -c "print(f'{int($BAL)/1e18:.6f}')")
echo "  balance : $BAL_ETH ETH"
if python3 -c "exit(0 if int($BAL) < 10**15 else 1)"; then
  bad "deployer has < 0.001 ETH — fund it before deploying"
fi
ok "deployer funded"

# ─── Deploy MineableReward ──────────────────────────────────────
echo ""
echo "── Deploying MineableReward ──────────────────────────────────"
cd mining
REWARD_ADDR=$(forge create MineableReward.sol:MineableReward \
  --rpc-url "$RPC" \
  --private-key "$DEPLOYER_PK" \
  --constructor-args "$PIDX" \
  --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["deployedTo"])')
cd ..
echo "REWARD_ADDR=$REWARD_ADDR" > mining/.reward-address
chmod 600 mining/.reward-address
ok "MineableReward → $REWARD_ADDR"

# ─── Deploy InfinityStake ───────────────────────────────────────
echo ""
echo "── Deploying InfinityStake ───────────────────────────────────"
STAKE="${STAKE_TOKEN:-$PIDX}"
REWARD="${REWARD_TOKEN:-$PIDX}"
cd staking
STAKE_ADDR=$(forge create InfinityStake.sol:InfinityStake \
  --rpc-url "$RPC" \
  --private-key "$DEPLOYER_PK" \
  --constructor-args "$STAKE" "$REWARD" \
  --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["deployedTo"])')
cd ..
echo "STAKE_ADDR=$STAKE_ADDR" > staking/.stake-address
chmod 600 staking/.stake-address
ok "InfinityStake → $STAKE_ADDR"

# ─── Set reward rate (10k PIDX/day) ─────────────────────────────
echo ""
echo "── Setting stake reward rate ─────────────────────────────────"
RATE=$(python3 -c "print(int(${REWARD_RATE_PER_DAY:-10000} * 1e18 // 86400))")
cast send "$STAKE_ADDR" 'setRewardRate(uint256)' "$RATE" \
  --rpc-url "$RPC" --private-key "$DEPLOYER_PK" 2>&1 | tail -2
ok "reward rate set: ${REWARD_RATE_PER_DAY:-10000} PIDX / day"

# ─── Summary ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  DEPLOYED TO BASE MAINNET"
echo "═══════════════════════════════════════════════════════════════"
echo "  MineableReward: $REWARD_ADDR"
echo "  InfinityStake : $STAKE_ADDR"
echo ""
echo "  NEXT: Fund the reward pools (send PIDX to each contract):"
echo "    cast send $PIDX 'transfer(address,uint256)' $REWARD_ADDR 1000000000000000000000000 --rpc-url $RPC --private-key \$DEPLOYER_PK"
echo "    cast send $PIDX 'transfer(address,uint256)' $STAKE_ADDR 10000000000000000000000000 --rpc-url $RPC --private-key \$DEPLOYER_PK"
echo ""
echo "  Then start mining:"
echo "    node mining/autobot.js"
echo ""
echo "  Publish addresses to the dashboard:"
echo "    bash publish-addresses.sh"
echo "═══════════════════════════════════════════════════════════════"
