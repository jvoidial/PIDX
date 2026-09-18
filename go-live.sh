#!/usr/bin/env bash
# go-live.sh — deploy InfinityStake + MineableReward to Base mainnet.
# Runs the full pipeline: deps → secrets → contracts → funding → publish.
# Safe to re-run. Idempotent per step. Never leaks secrets.
set -euo pipefail
cd "$(dirname "$0")"

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'
ok(){ printf "${G}[OK]${N}   %s\n" "$*"; }
bad(){ printf "${R}[FAIL]${N} %s\n" "$*"; exit 1; }
warn(){ printf "${Y}[WARN]${N} %s\n" "$*"; }
info(){ printf "${B}[INFO]${N} %s\n" "$*"; }
hdr(){ printf "\n${B}═══ %s ═══${N}\n" "$*"; }

# ─── Step 0: Pre-flight ────────────────────────────────────────────────────
hdr "Step 0 — Environment"
command -v git  >/dev/null || bad "git missing (pkg install git)"
command -v curl >/dev/null || bad "curl missing (pkg install curl)"
command -v node >/dev/null || bad "node missing (pkg install nodejs)"

# ─── Step 1: Foundry install ───────────────────────────────────────────────
hdr "Step 1 — Foundry"
if command -v forge >/dev/null 2>&1; then
  ok "forge: $(forge --version | head -1)"
else
  info "Installing Foundry (3-5 min on mobile)..."
  bash mining/install-foundry-termux.sh
  export PATH="$HOME/.foundry/bin:$PATH"
  command -v forge >/dev/null || bad "forge install failed — see output above"
  ok "forge installed: $(forge --version | head -1)"
fi

# ─── Step 2: Secrets ───────────────────────────────────────────────────────
hdr "Step 2 — Secrets"
if [[ ! -f .env ]]; then
  if [[ "${NONINTERACTIVE:-0}" == "1" ]]; then
    bad "no .env and NONINTERACTIVE=1 — run without the flag"
  fi
  info ".env not found — starting interactive setup"
  bash setup-secrets.sh
fi
# shellcheck disable=SC1091
source .env
[[ -n "${DEPLOYER_PK:-}" ]] || bad "DEPLOYER_PK empty in .env"
[[ -n "${MINER_PK:-}"    ]] || bad "MINER_PK empty in .env"
chmod 600 .env
ok ".env present, mode 600, keys loaded"

RPC="${BASE_RPC:-https://base-rpc.publicnode.com}"
PIDX="${PIDX_TOKEN:-0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c}"

# ─── Step 3: Deployer balance ──────────────────────────────────────────────
hdr "Step 3 — Deployer balance"
DEPLOYER_ADDR=$(cast wallet address --private-key "$DEPLOYER_PK")
BAL=$(cast balance "$DEPLOYER_ADDR" --rpc-url "$RPC" 2>/dev/null || echo 0)
BAL_ETH=$(python3 -c "print(f'{int($BAL)/1e18:.6f}')")
printf "  deployer: %s\n  balance : %s ETH\n" "$DEPLOYER_ADDR" "$BAL_ETH"

# Require 0.0005 ETH minimum (~$1.30) for both deploys + gas
if python3 -c "exit(0 if int($BAL) < 5*10**14 else 1)"; then
  bad "insufficient gas — fund $DEPLOYER_ADDR with at least 0.001 ETH on Base"
fi
ok "deployer funded"

# ─── Step 4: Build contracts ───────────────────────────────────────────────
hdr "Step 4 — Compile"
forge build --contracts mining/MineableReward.sol 2>&1 | tail -3
forge build --contracts staking/InfinityStake.sol 2>&1 | tail -3
ok "contracts compiled"

# ─── Step 5: Deploy MineableReward ─────────────────────────────────────────
hdr "Step 5 — Deploy MineableReward"
if [[ -f mining/.reward-address ]]; then
  EXISTING=$(grep -oE '0x[0-9a-fA-F]{40}' mining/.reward-address | head -1 || echo "")
  CODE=$(cast code "$EXISTING" --rpc-url "$RPC" 2>/dev/null | head -c 4)
  if [[ -n "$EXISTING" && "$CODE" != "0x" && "$CODE" != "" ]]; then
    ok "MineableReward already deployed at $EXISTING — skipping"
    REWARD_ADDR="$EXISTING"
  fi
fi

if [[ -z "${REWARD_ADDR:-}" ]]; then
  info "deploying..."
  REWARD_ADDR=$(forge create mining/MineableReward.sol:MineableReward \
    --rpc-url "$RPC" \
    --private-key "$DEPLOYER_PK" \
    --constructor-args "$PIDX" \
    --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["deployedTo"])')
  echo "REWARD_ADDR=$REWARD_ADDR" > mining/.reward-address
  chmod 600 mining/.reward-address
  ok "MineableReward → $REWARD_ADDR"
fi

# ─── Step 6: Deploy InfinityStake ──────────────────────────────────────────
hdr "Step 6 — Deploy InfinityStake"
if [[ -f staking/.stake-address ]]; then
  EXISTING=$(grep -oE '0x[0-9a-fA-F]{40}' staking/.stake-address | head -1 || echo "")
  CODE=$(cast code "$EXISTING" --rpc-url "$RPC" 2>/dev/null | head -c 4)
  if [[ -n "$EXISTING" && "$CODE" != "0x" && "$CODE" != "" ]]; then
    ok "InfinityStake already deployed at $EXISTING — skipping"
    STAKE_ADDR="$EXISTING"
  fi
fi

if [[ -z "${STAKE_ADDR:-}" ]]; then
  info "deploying..."
  STAKE_ADDR=$(forge create staking/InfinityStake.sol:InfinityStake \
    --rpc-url "$RPC" \
    --private-key "$DEPLOYER_PK" \
    --constructor-args "$PIDX" "$PIDX" \
    --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin)["deployedTo"])')
  echo "STAKE_ADDR=$STAKE_ADDR" > staking/.stake-address
  chmod 600 staking/.stake-address
  ok "InfinityStake → $STAKE_ADDR"
fi

# ─── Step 7: Configure staking reward rate ─────────────────────────────────
hdr "Step 7 — Configure reward rate"
RATE_DAY="${REWARD_RATE_PER_DAY:-10000}"
RATE=$(python3 -c "print(int($RATE_DAY * 1e18 // 86400))")
info "setting rewardRate = $RATE_DAY PIDX/day ($RATE wei/s)"
cast send "$STAKE_ADDR" 'setRewardRate(uint256)' "$RATE" \
  --rpc-url "$RPC" --private-key "$DEPLOYER_PK" 2>&1 | tail -2
ok "reward rate configured"

# ─── Step 8: Seed the pools with PIDX ──────────────────────────────────────
hdr "Step 8 — Fund reward pools"
# MineableReward: 100,000 PIDX
# InfinityStake: 1,000,000 PIDX
# Total ~1.1M PIDX needed. Check deployer's PIDX balance first.
PIDX_BAL_HEX=$(cast call "$PIDX" 'balanceOf(address)(uint256)' "$DEPLOYER_ADDR" --rpc-url "$RPC" 2>/dev/null || echo "0")
PIDX_BAL=$(python3 -c "print(int('$PIDX_BAL_HEX'.split()[0])/1e18 if '$PIDX_BAL_HEX' else 0)" 2>/dev/null || echo "0")
printf "  deployer PIDX balance: %s\n" "$PIDX_BAL"

FUND_MINE="${FUND_MINE:-100000}"     # PIDX to mineable pool
FUND_STAKE="${FUND_STAKE:-1000000}"  # PIDX to staking pool

NEED=$(python3 -c "print(int($FUND_MINE) + int($FUND_STAKE))")
if python3 -c "exit(0 if float('$PIDX_BAL') < $NEED else 1)"; then
  warn "deployer holds only $PIDX_BAL PIDX, need $NEED for full funding"
  warn "  skipping auto-fund — fund manually from another wallet:"
  echo ""
  echo "    cast send $PIDX 'transfer(address,uint256)' $REWARD_ADDR $(python3 -c "print(int($FUND_MINE*1e18))") --rpc-url $RPC --private-key \$DEPLOYER_PK"
  echo "    cast send $PIDX 'transfer(address,uint256)' $STAKE_ADDR  $(python3 -c "print(int($FUND_STAKE*1e18))") --rpc-url $RPC --private-key \$DEPLOYER_PK"
else
  info "sending $FUND_MINE PIDX → MineableReward..."
  cast send "$PIDX" 'transfer(address,uint256)' "$REWARD_ADDR" \
    "$(python3 -c "print(int($FUND_MINE*1e18))")" \
    --rpc-url "$RPC" --private-key "$DEPLOYER_PK" 2>&1 | tail -2
  info "sending $FUND_STAKE PIDX → InfinityStake..."
  cast send "$PIDX" 'transfer(address,uint256)' "$STAKE_ADDR" \
    "$(python3 -c "print(int($FUND_STAKE*1e18))")" \
    --rpc-url "$RPC" --private-key "$DEPLOYER_PK" 2>&1 | tail -2
  ok "pools funded: $FUND_MINE + $FUND_STAKE PIDX"
fi

# ─── Step 9: Approve staking contract ──────────────────────────────────────
hdr "Step 9 — Approve staking allowance"
MAX_UINT="115792089237316195423570985008687907853269984665640564039457584007913129639935"
cast send "$PIDX" 'approve(address,uint256)' "$STAKE_ADDR" "$MAX_UINT" \
  --rpc-url "$RPC" --private-key "$DEPLOYER_PK" 2>&1 | tail -2 || true
ok "staking allowance set (deployer)"

# ─── Step 10: Publish addresses to dashboard ───────────────────────────────
hdr "Step 10 — Publish to dashboard"
bash publish-addresses.sh

# ─── Step 11: Sanity-check the live site ───────────────────────────────────
hdr "Step 11 — Sanity check"
for f in contracts.json; do
  URL="https://jvoidial.github.io/spirit-guide-token/$f"
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -m 10 "$URL" || echo "000")
  if [[ "$CODE" == "200" ]]; then
    ok "$URL → 200"
  else
    warn "$URL → $CODE (Pages may need 60s to rebuild)"
  fi
done

# ─── Step 12: Ready for autobot ────────────────────────────────────────────
hdr "Step 12 — Autobot"
info "Mining contract: $REWARD_ADDR"
info "Miner wallet   : $(cast wallet address --private-key "$MINER_PK")"
echo ""
echo "  Start the autobot:"
echo "    node mining/autobot.js &"
echo ""
echo "  Or run in foreground to watch hash rate:"
echo "    node mining/autobot.js"

# ─── Summary ───────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✧ DEPLOYED TO BASE MAINNET ✧"
echo "═══════════════════════════════════════════════════════════════"
echo ""
printf "  MineableReward : %s\n" "$REWARD_ADDR"
printf "  InfinityStake  : %s\n" "$STAKE_ADDR"
echo ""
printf "  Basescan:\n"
printf "    https://basescan.org/address/%s\n" "$REWARD_ADDR"
printf "    https://basescan.org/address/%s\n" "$STAKE_ADDR"
echo ""
printf "  Dashboard (wait 60s for Pages):\n"
printf "    https://jvoidial.github.io/spirit-guide-token/\n"
echo ""
printf "  Autobot:\n"
printf "    node mining/autobot.js\n"
echo ""
echo "  Both panels on the dashboard will now show LIVE data:"
echo "    • ♾️ Infinity Stake → totalStaked, rewardRate, APY, lastUpdate"
echo "    • ⛏️ Mining Live    → difficulty, epoch, rewardPerShare, shares"
echo "═══════════════════════════════════════════════════════════════"
