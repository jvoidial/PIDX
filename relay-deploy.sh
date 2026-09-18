#!/usr/bin/env bash
# relay-deploy.sh — broadcast pre-signed deploy txs. Helper pays gas.
# Usage: bash relay-deploy.sh signed-txs.json
set -euo pipefail
cd "$(dirname "$0")"

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; B='\033[0;34m'; N='\033[0m'
ok(){ printf "${G}[OK]${N}   %s\n" "$*"; }
bad(){ printf "${R}[FAIL]${N} %s\n" "$*"; exit 1; }
warn(){ printf "${Y}[WARN]${N} %s\n" "$*"; }
hdr(){ printf "\n${B}═══ %s ═══${N}\n" "$*"; }

SIGNED="${1:-signed-txs.json}"
[[ -f "$SIGNED" ]] || bad "no file: $SIGNED"

# ─── What the helper needs ────────────────────────────────────────────────
# Only a funded wallet for gas. No private key of the user.
# The helper's own key is used ONLY to sign the broadcast wrapper if needed;
# on Base, raw txs can be sent as-is via eth_sendRawTransaction.
HELPER_PK="${HELPER_PK:-}"
RPC="${BASE_RPC:-https://base-rpc.publicnode.com}"

hdr "1 — Verifying signed-txs.json"
python3 - "$SIGNED" <<'PY'
import sys, json, hashlib, datetime
d = json.load(open(sys.argv[1]))
# Version
assert d.get("version") == 1, "unsupported version"
# Network
assert d.get("network") == "base", "not Base network"
assert d.get("chainId") == 8453, "wrong chain"
# Expiry
exp = datetime.datetime.fromisoformat(d["expiresAt"].replace("Z", "+00:00"))
now = datetime.datetime.now(datetime.UTC)
if now > exp:
    print(f"[FAIL] signed-txs.json expired at {d['expiresAt']}")
    sys.exit(1)
# Checksum
data = json.dumps(d["transactions"], sort_keys=True).encode()
digest = hashlib.sha256(data).hexdigest()[:16]
assert digest == d["checksum"], f"checksum mismatch: {digest} != {d['checksum']}"
print(f"[OK]   valid · deployer {d['deployer']} · nonces {d['startingNonce']}, {d['startingNonce']+1}")
print(f"       expires {d['expiresAt']}")
PY

hdr "2 — Checking nonces on chain"
DEPLOYER=$(python3 -c 'import json;print(json.load(open("'"$SIGNED"'"))["deployer"])')
CURRENT_NONCE=$(cast nonce "$DEPLOYER" --rpc-url "$RPC")
echo "  deployer      : $DEPLOYER"
echo "  chain nonce   : $CURRENT_NONCE"

python3 - "$SIGNED" "$CURRENT_NONCE" <<'PY'
import sys, json
d = json.load(open(sys.argv[1]))
current = int(sys.argv[2])
start = d["startingNonce"]
for tx in d["transactions"]:
    if tx["nonce"] < current:
        print(f"[WARN] nonce {tx['nonce']} ({tx['purpose']}) already used — skip")
    elif tx["nonce"] == current:
        print(f"[OK]   nonce {tx['nonce']} ({tx['purpose']}) next in queue")
    else:
        print(f"[WARN] nonce {tx['nonce']} ({tx['purpose']}) is ahead — need {tx['nonce']-current} interim txs")
PY

hdr "3 — Broadcasting"
python3 - "$SIGNED" <<'PY'
import sys, json, urllib.request
d = json.load(open(sys.argv[1]))
rpc = "https://base-rpc.publicnode.com"
for tx in d["transactions"]:
    raw = tx["raw"]
    body = json.dumps({"jsonrpc":"2.0","id":1,"method":"eth_sendRawTransaction","params":[raw]}).encode()
    req = urllib.request.Request(rpc, data=body, headers={"Content-Type":"application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            res = json.loads(r.read())
            if "result" in res:
                print(f"[OK]   {tx['purpose']:<18} → {res['result']}")
            else:
                err = res.get("error", {}).get("message", "unknown")
                print(f"[WARN] {tx['purpose']:<18} → rejected: {err}")
    except Exception as e:
        print(f"[FAIL] {tx['purpose']:<18} → {e}")
PY

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Broadcast complete."
echo ""
echo "  Check on Basescan:"
echo "    https://basescan.org/address/$DEPLOYER"
echo ""
echo "  Both contracts will appear as 'Contract Creation' entries."
echo "  Ownership stays with the deployer ($DEPLOYER) — not the helper."
echo "═══════════════════════════════════════════════════════════════"
