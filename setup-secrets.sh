#!/usr/bin/env bash
# setup-secrets.sh — create .env safely without leaving the key in history
set -euo pipefail
cd "$(dirname "$0")"

if [[ -f .env ]]; then
  echo "[INFO] .env already exists. Overwrite? [y/N]"
  read -r a
  [[ "$a" =~ ^[Yy]$ ]] || { echo "aborted"; exit 0; }
fi

cp .env.example .env
chmod 600 .env

echo ""
echo "Paste your deployer private key (hidden):"
printf '  DEPLOYER_PK: '
IFS= read -rs DPKEY
echo ""

echo "Paste your miner private key (hidden, can be same as deployer):"
printf '  MINER_PK: '
IFS= read -rs MKEY
echo ""

# Validate: 0x + 64 hex
if ! [[ "$DPKEY" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
  echo "[FAIL] DEPLOYER_PK is not 0x + 64 hex characters"; exit 1
fi
if ! [[ "$MKEY" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
  echo "[FAIL] MINER_PK is not 0x + 64 hex characters"; exit 1
fi

# Write to .env using python (avoids sed special char issues)
python3 - "$DPKEY" "$MKEY" <<'PY'
import sys
d, m = sys.argv[1], sys.argv[2]
env = open('.env').read()
env = env.replace('DEPLOYER_PK=', f'DEPLOYER_PK={d}')
env = env.replace('MINER_PK=',   f'MINER_PK={m}')
open('.env','w').write(env)
PY

unset DPKEY MKEY

echo "[OK] .env written and chmod 600"
echo ""
echo "Verify (shows only public fields):"
grep -E '^(BASE_RPC|PIDX_TOKEN|STAKE_TOKEN|REWARD_RATE_PER_DAY)=' .env
echo ""
echo "Your private keys are on disk in .env — NOT in shell history, NOT in git."
