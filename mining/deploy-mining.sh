#!/usr/bin/env bash
# deploy-mining.sh — deploy MineableReward + pre-fund with PIDX reward pool
set -euo pipefail
[[ -f .env ]] || { echo "need .env with DEPLOYER_PK and BASE_RPC"; exit 1; }
# shellcheck disable=SC1091
source .env

PIDX_TOKEN="${PIDX_TOKEN:-0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c}"
RPC="${BASE_RPC:-https://base-rpc.publicnode.com}"
PK="${DEPLOYER_PK:?set DEPLOYER_PK in .env}"

echo "── Deploying MineableReward ──────────────────────────────────"
echo "  Token : $PIDX_TOKEN"
echo "  RPC   : $RPC"

# Build
forge build --contracts mining/MineableReward.sol

# Deploy
ADDR=$(forge create mining/MineableReward.sol:MineableReward \
  --rpc-url "$RPC" \
  --private-key "$PK" \
  --constructor-args "$PIDX_TOKEN" \
  --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["deployedTo"])')

echo "[OK] deployed to $ADDR"
echo "ADDR=$ADDR" > mining/.reward-address

# Fund the pool — transfer 1M PIDX (adjust as needed)
echo ""
echo "── Funding reward pool ───────────────────────────────────────"
echo "  Run this once from a wallet that holds PIDX:"
echo "    cast send $PIDX_TOKEN 'transfer(address,uint256)' $ADDR 1000000000000000000000000 --rpc-url $RPC --private-key \$PK"
echo ""
echo "  (1,000,000 PIDX at 18 decimals = 1000000000000000000000000 wei)"
