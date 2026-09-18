#!/usr/bin/env bash
# publish-addresses.sh — copies deployed addresses to a public JSON file.
# Public addresses are safe to commit. Private keys never leave .env.
set -euo pipefail
cd "$(dirname "$0")"

REWARD=""
STAKE=""
[[ -f mining/.reward-address ]] && REWARD=$(grep -oE '0x[0-9a-fA-F]{40}' mining/.reward-address | head -1)
[[ -f staking/.stake-address ]] && STAKE=$(grep -oE '0x[0-9a-fA-F]{40}' staking/.stake-address | head -1)

cat > contracts.json <<JSON
{
  "network": "base",
  "chainId": 8453,
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "MineableReward": {
      "address": "${REWARD:-}",
      "deployer": "$(cat .env 2>/dev/null | grep -c . >/dev/null && echo 'public-safe')",
      "purpose": "proof-of-work PIDX rewards"
    },
    "InfinityStake": {
      "address": "${STAKE:-}",
      "purpose": "no-lock auto-compound staking"
    }
  }
}
JSON

chmod 644 contracts.json
echo "[OK] contracts.json written"
cat contracts.json

git add contracts.json
if git diff --cached --quiet; then
  echo "[SKIP] no changes to contracts.json"
else
  git commit -m "publish: contract addresses on Base mainnet"
  git push
  echo "[OK] published"
fi
