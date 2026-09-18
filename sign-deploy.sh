#!/usr/bin/env bash
# sign-deploy.sh — sign deploy txs offline. DEPLOYER_PK stays on this device.
# Output: signed-txs.json (share this with the helper)
set -euo pipefail
cd "$(dirname "$0")"

G='\033[0;32m'; R='\033[0;31m'; B='\033[0;34m'; N='\033[0m'
ok(){ printf "${G}[OK]${N}   %s\n" "$*"; }
bad(){ printf "${R}[FAIL]${N} %s\n" "$*"; exit 1; }
hdr(){ printf "\n${B}═══ %s ═══${N}\n" "$*"; }

export PATH="$HOME/.foundry/bin:$PATH"
command -v forge >/dev/null || bad "forge not installed"
[[ -f .env ]] || bad "no .env — run: bash setup-secrets.sh"
# shellcheck disable=SC1091
source .env
[[ -n "${DEPLOYER_PK:-}" ]] || bad "DEPLOYER_PK empty"

RPC="${BASE_RPC:-https://base-rpc.publicnode.com}"
PIDX="${PIDX_TOKEN:-0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c}"
DEPLOYER=$(cast wallet address --private-key "$DEPLOYER_PK")

hdr "1 — Building contracts"
forge build --contracts mining/MineableReward.sol 2>&1 | tail -1
forge build --contracts staking/InfinityStake.sol 2>&1 | tail -1

hdr "2 — Reading bytecode"
REWARD_BYTECODE=$(jq -r '.bytecode.object' out/MineableReward.sol/MineableReward.json)
STAKE_BYTECODE=$(jq -r '.bytecode.object' out/InfinityStake.sol/InfinityStake.json)

# Constructor args encoded
REWARD_ARGS=$(cast abi-encode "constructor(address)" "$PIDX" | sed 's/^0x//')
STAKE_ARGS=$(cast abi-encode "constructor(address,address)" "$PIDX" "$PIDX" | sed 's/^0x//')

REWARD_DATA="0x${REWARD_BYTECODE}${REWARD_ARGS}"
STAKE_DATA="0x${STAKE_BYTECODE}${STAKE_ARGS}"

hdr "3 — Reading current nonce"
NONCE=$(cast nonce "$DEPLOYER" --rpc-url "$RPC")
info "current nonce: $NONCE"

hdr "4 — Building + signing"
# Base gas params
CHAIN_ID=8453
GAS_PRICE=$(cast gas-price --rpc-url "$RPC")
MAX_FEE=$((GAS_PRICE * 2))
MAX_PRIORITY=$GAS_PRICE

REWARD_RAW=$(cast mktx \
  --chain $CHAIN_ID \
  --private-key "$DEPLOYER_PK" \
  --nonce "$NONCE" \
  --gas-limit 3000000 \
  --gas-price "$MAX_FEE" \
  --value 0 \
  --create "$REWARD_DATA" 2>&1)

STAKE_RAW=$(cast mktx \
  --chain $CHAIN_ID \
  --private-key "$DEPLOYER_PK" \
  --nonce "$((NONCE + 1))" \
  --gas-limit 3000000 \
  --gas-price "$MAX_FEE" \
  --value 0 \
  --create "$STAKE_DATA" 2>&1)

hdr "5 — Writing signed-txs.json"
python3 - "$REWARD_RAW" "$STAKE_RAW" "$DEPLOYER" "$NONCE" <<'PY'
import sys, json, datetime, hashlib
reward_raw, stake_raw, deployer, nonce = sys.argv[1:5]
out = {
    "version": 1,
    "network": "base",
    "chainId": 8453,
    "deployer": deployer,
    "startingNonce": int(nonce),
    "signedAt": datetime.datetime.now(datetime.UTC).isoformat() + "Z",
    "expiresAt": (datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=24)).isoformat() + "Z",
    "note": "Two pre-signed CREATE transactions. Helper may only broadcast them. Signatures cannot be altered. If either nonce already landed on-chain, the helper must skip it.",
    "transactions": [
        {"purpose": "MineableReward", "raw": reward_raw.strip(), "nonce": int(nonce)},
        {"purpose": "InfinityStake",  "raw": stake_raw.strip(),  "nonce": int(nonce) + 1},
    ]
}
# Compute a checksum so the helper can verify integrity
data = json.dumps(out["transactions"], sort_keys=True).encode()
out["checksum"] = hashlib.sha256(data).hexdigest()[:16]
with open("signed-txs.json", "w") as f:
    json.dump(out, f, indent=2)
print("[OK]   signed-txs.json written")
print(f"       deployer : {deployer}")
print(f"       nonces   : {nonce}, {int(nonce)+1}")
print(f"       checksum : {out['checksum']}")
PY

# Compute predicted contract addresses so the helper knows where they'll land
echo ""
hdr "6 — Predicted contract addresses"
REWARD_ADDR=$(cast compute-address --nonce "$NONCE" "$DEPLOYER" 2>/dev/null | grep -oE '0x[0-9a-fA-F]{40}' | head -1 || echo "computing...")
STAKE_ADDR=$(cast compute-address --nonce "$((NONCE+1))" "$DEPLOYER" 2>/dev/null | grep -oE '0x[0-9a-fA-F]{40}' | head -1 || echo "computing...")
echo "  MineableReward will deploy at: $REWARD_ADDR"
echo "  InfinityStake  will deploy at: $STAKE_ADDR"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SIGNED — ready for helper"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Send signed-txs.json to your helper."
echo ""
echo "  They run: bash relay-deploy.sh signed-txs.json"
echo ""
echo "  Your DEPLOYER_PK never left this device."
echo "  Your signature is bound to nonces $NONCE and $((NONCE+1))."
echo "  If they don't broadcast within 24h, re-sign fresh."
echo ""
echo "  To cancel: simply don't send the file. Nothing on-chain yet."
echo "═══════════════════════════════════════════════════════════════"
