#!/usr/bin/env bash
# pidx-audit.sh — READ-ONLY PIDX security audit
# Usage: TOKEN=0x<v1-token> ./pidx-audit.sh
# Optional: RPC=... VAULT=... LOCKER=...
# Requires: curl, jq. Recommended: python3 (for selector + supply math).
set -u

RPC="${RPC:-https://mainnet.base.org}"
TOKEN="${TOKEN:-}"
VAULT="${VAULT:-0xfAcb5905e1e592d69a2ae0aff6f82330c07e4312}"
LOCKER="${LOCKER:-0x06A958fF5d896Ba28411215d0CD56a2a5A1b35aD}"

TREASURY=0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C
VAULT_OWNER=0x3212D08f2ad637918bd90932829159874E39bE4c
COINBASE_DELEGATE=0x7702cb554e6bfb442cb743a7df23154544a7176c
SUSPECT_DELEGATE=0x3ae1f70c6da80955936f5599d103fcf62162d10
FORWARD_TO=0x43b18F8fB488E30d524757d78DA1438881d1AAAA
DEAD=0x000000000000000000000000000000000000dEaD

if [ -t 1 ]; then
  R=$'\e[31m'; G=$'\e[32m'; Y=$'\e[33m'; B=$'\e[1m'; N=$'\e[0m'
else R=; G=; Y=; B=; N=; fi

ok(){   printf '  %s[OK]%s   %s\n' "$G" "$N" "$*"; }
bad(){  printf '  %s[FAIL]%s %s\n' "$R" "$N" "$*"; }
warn(){ printf '  %s[WARN]%s %s\n' "$Y" "$N" "$*"; }
info(){ printf '         %s\n' "$*"; }
hdr(){  printf '\n%s== %s ==%s\n' "$B" "$*" "$N"; }

# ---------- prerequisites ----------
command -v curl >/dev/null 2>&1 || { echo "need curl: pkg install curl"; exit 1; }
command -v jq   >/dev/null 2>&1 || { echo "need jq:   pkg install jq";   exit 1; }
HAS_PY=0
command -v python3 >/dev/null 2>&1 && HAS_PY=1

# ---------- rpc ----------
rpc() {
  local method="$1" params="$2" out res err try=0
  while [ $try -lt 3 ]; do
    out=$(curl -s --max-time 30 -X POST "$RPC" \
      -H 'Content-Type: application/json' \
      -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"$method\",\"params\":$params}")
    res=$(printf '%s' "$out" | jq -r '.result // empty' 2>/dev/null)
    if [ -n "$res" ] && [ "$res" != "null" ]; then
      printf '%s' "$res"; return 0
    fi
    err=$(printf '%s' "$out" | jq -r '.error.message // empty' 2>/dev/null)
    case "$err" in
      *rate*|*limit*|*429*|*busy*|*too\ many*)
        try=$((try+1)); sleep 2; continue ;;
      *) printf 'ERROR:%s' "${err:-unknown}"; return 1 ;;
    esac
  done
  printf 'ERROR:rate-limited'; return 1
}
get_code(){ rpc eth_getCode "[\"$1\",\"latest\"]"; }
eth_call(){
  local to="$1" data="$2" from="${3:-$DEAD}"
  rpc eth_call "[{\"to\":\"$to\",\"data\":\"$data\",\"from\":\"$from\"},\"latest\"]"
}
# three-way probe: REVERT / EMPTY_SUCCESS / SUCCESS:<data> / ERROR:<msg>
probe_call() {
  local to="$1" data="$2" from="${3:-$DEAD}" out res err
  out=$(curl -s --max-time 30 -X POST "$RPC" \
    -H 'Content-Type: application/json' \
    -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"eth_call\",\"params\":[{\"to\":\"$to\",\"data\":\"$data\",\"from\":\"$from\"},\"latest\"]}")
  res=$(printf '%s' "$out" | jq -r '.result // empty' 2>/dev/null)
  err=$(printf '%s' "$out" | jq -r '.error.message // empty' 2>/dev/null)
  if [ -n "$err" ]; then printf 'REVERT:%s' "$err"
  elif [ -z "$res" ] || [ "$res" = "0x" ]; then printf 'EMPTY_SUCCESS'
  else printf 'SUCCESS:%s' "$res"
  fi
}

# ---------- crypto/encoding ----------
compute_selector() {
  local sig="$1"
  if command -v cast >/dev/null 2>&1; then
    cast sig "$sig" 2>/dev/null && return 0
  fi
  if [ "$HAS_PY" = 1 ]; then
    python3 -c "from Crypto.Hash import keccak;k=keccak.new(digest_bits=256);k.update(b'''$sig''');print('0x'+k.hexdigest()[:8])" 2>/dev/null && return 0
  fi
  if command -v node >/dev/null 2>&1 && node -e "require('ethers')" 2>/dev/null; then
    node -e "const{ethers}=require('ethers');console.log(ethers.id('$sig').slice(0,10))" 2>/dev/null && return 0
  fi
  return 1
}
decode_7702() {
  local code="$1"
  if [ -z "$code" ] || [ "$code" = "0x" ] || [ "${code:0:6}" = "ERROR:" ]; then
    echo "none"; return
  fi
  if [ "${code:0:8}" = "0xef0100" ] && [ ${#code} -eq 48 ]; then
    echo "delegated:0x${code:8:40}"
  else
    echo "other:${code:0:10}"
  fi
}
pad32(){
  local a="${1#0x}"
  printf '000000000000000000000000%s' "$(printf '%s' "$a" | tr 'A-F' 'a-f')"
}
fmt_tokens(){
  if [ "$HAS_PY" = 1 ]; then
    python3 -c "raw=int('${1#0x}',16) if '$1' not in('','0x') and not '$1'.startswith('ERROR') else 0;print(f'{raw/10**$2:,.4f}')" 2>/dev/null || echo "$1"
  else
    echo "$1 (raw)"
  fi
}
is_hex_result(){ [ -n "$1" ] && [ "${1:0:2}" = "0x" ] && [ "${1:0:6}" != "ERROR:" ]; }

VAULT_OWNER_DELEGATE=""
PERMISSIONLESS_DANGER=0
SUPPLY_MISMATCH=0

# ---------- checks ----------
check_delegations() {
  hdr "1. EIP-7702 delegation status"
  local t v td vd target
  t=$(get_code "$TREASURY"); v=$(get_code "$VAULT_OWNER")
  td=$(decode_7702 "$t");     vd=$(decode_7702 "$v")

  case "$td" in
    delegated:*)
      target="${td#delegated:}"
      if [ "${target,,}" = "$COINBASE_DELEGATE" ]; then ok "treasury -> $target (Coinbase proxy)"
      elif [ "${target,,}" = "$SUSPECT_DELEGATE" ]; then bad "treasury -> $target (SUSPECT delegate)"
      else warn "treasury -> $target (unknown)"; fi ;;
    none) ok "treasury -> no delegation" ;;
    *) warn "treasury -> non-delegation code";;
  esac

  case "$vd" in
    delegated:*)
      VAULT_OWNER_DELEGATE="${vd#delegated:}"
      if [ "${VAULT_OWNER_DELEGATE,,}" = "$COINBASE_DELEGATE" ]; then
        ok "vaultOwner -> $VAULT_OWNER_DELEGATE (Coinbase proxy)"
      elif [ "${VAULT_OWNER_DELEGATE,,}" = "$SUSPECT_DELEGATE" ]; then
        bad "vaultOwner -> $VAULT_OWNER_DELEGATE (SUSPECT — mint authority hostile)"
      else
        warn "vaultOwner -> $VAULT_OWNER_DELEGATE (unknown)"
      fi ;;
    none) ok "vaultOwner -> no delegation" ;;
    *) warn "vaultOwner -> non-delegation code";;
  esac
}

check_delegate_bytecode() {
  hdr "2. Delegate bytecode inspection"
  local d sig sel needle code size
  for d in "$COINBASE_DELEGATE" "$SUSPECT_DELEGATE"; do
    code=$(get_code "$d")
    if ! is_hex_result "$code" || [ "$code" = "0x" ]; then
      info "$d : no code"; continue
    fi
    size=$(( (${#code} - 2) / 2 ))
    info "$d  ($size bytes)"
    for sig in 'execute((address,uint256,bytes)[])' \
               'execute((address,uint256,bytes)[],bytes)' \
               'forwardAllEth()' \
               'forwardTokens(address)' \
               'forwardMultipleTokens(address[])' \
               'isValidSignature(bytes32,bytes)' \
               'owner()'; do
      if sel=$(compute_selector "$sig"); then
        needle="${sel#0x}"
        if printf '%s' "$code" | grep -qi "$needle"; then
          warn "  contains ${sig} (${sel})"
        fi
      fi
    done
    if printf '%s' "$code" | grep -qi "${FORWARD_TO#0x}"; then
      bad "  HARDCODED FORWARD TARGET $FORWARD_TO in bytecode"
    fi
  done
  if [ "$HAS_PY" = 0 ] && ! command -v cast >/dev/null 2>&1; then
    warn "selector math unavailable — install python3 + pip install pycryptodome (or foundry cast)"
  fi
}

check_guard() {
  hdr "3. Guard test on vault-owner delegate"
  local d="$VAULT_OWNER_DELEGATE"
  if [ -z "$d" ]; then warn "no vault-owner delegate to test"; return; fi

  local sel r esel data
  if sel=$(compute_selector 'forwardAllEth()'); then
    r=$(probe_call "$d" "$sel")
    case "$r" in
      REVERT:*)        info "forwardAllEth() reverted: ${r#REVERT:}" ;;
      EMPTY_SUCCESS)   bad "forwardAllEth() SUCCEEDED (no revert) from $DEAD — PERMISSIONLESS"; PERMISSIONLESS_DANGER=1 ;;
      SUCCESS:*)       bad "forwardAllEth() returned data without revert — PERMISSIONLESS (${r#SUCCESS:})"; PERMISSIONLESS_DANGER=1 ;;
      *)               info "forwardAllEth() probe: $r" ;;
    esac
  else
    warn "cannot compute forwardAllEth() selector"
  fi

  if esel=$(compute_selector 'execute((address,uint256,bytes)[])'); then
    data="${esel}00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000"
    r=$(probe_call "$d" "$data")
    case "$r" in
      REVERT:*)        info "execute([]) reverted: ${r#REVERT:}" ;;
      EMPTY_SUCCESS)   bad "execute([]) SUCCEEDED (no revert) from $DEAD — POSSIBLY PERMISSIONLESS"; PERMISSIONLESS_DANGER=1 ;;
      SUCCESS:*)       bad "execute([]) returned data without revert — POSSIBLY PERMISSIONLESS (${r#SUCCESS:})"; PERMISSIONLESS_DANGER=1 ;;
      *)               info "execute([]) probe: $r" ;;
    esac
  fi

  warn "revert is not proof of safety — could be 'nothing to forward' short-circuit."
}

check_token() {
  hdr "4. Token state"
  if [ -z "$TOKEN" ]; then
    warn "TOKEN not set — skipping. Re-run with TOKEN=0x<v1-token-address>"
    return
  fi

  local dec_raw supply_raw supply_fmt expected bt bv v
  dec_raw=$(eth_call "$TOKEN" "0x313ce567")
  if ! is_hex_result "$dec_raw"; then warn "decimals() failed: $dec_raw"; return; fi
  local dec=$((16#${dec_raw: -2}))
  info "decimals: $dec"

  supply_raw=$(eth_call "$TOKEN" "0x18160ddd")
  if ! is_hex_result "$supply_raw"; then warn "totalSupply() failed: $supply_raw"; return; fi
  supply_fmt=$(fmt_tokens "$supply_raw" "$dec")
  info "totalSupply: $supply_fmt"
  info "raw:         $supply_raw"

  if [ "$HAS_PY" = 1 ]; then
    expected=$(python3 -c "print('0x%064x' % (10**9 * 10**$dec))" 2>/dev/null || echo "")
    if [ -n "$expected" ] && [ "${supply_raw,,}" = "${expected,,}" ]; then
      ok "supply matches expected 1,000,000,000"
    else
      bad "SUPPLY MISMATCH — expected ~1,000,000,000, got $supply_fmt"
      SUPPLY_MISMATCH=1
    fi
  else
    info "supply comparison skipped (no python3)"
  fi

  bt=$(eth_call "$TOKEN" "0x70a08231$(pad32 "$TREASURY")")
  bv=$(eth_call "$TOKEN" "0x70a08231$(pad32 "$VAULT_OWNER")")
  info "treasury balance:   $(fmt_tokens "$bt" "$dec")"
  info "vaultOwner balance: $(fmt_tokens "$bv" "$dec")"

  v=$(eth_call "$TOKEN" "0xfc0c546a")
  if is_hex_result "$v"; then info "token.vault(): $v"; fi
}

check_vault() {
  hdr "5. Vault state"
  local o r r2 probe
  o=$(eth_call "$VAULT" "0x8da5cb5b")
  if is_hex_result "$o"; then
    info "vault.owner(): $o"
    local padded_vo="0x$(pad32 "$VAULT_OWNER")"
    if [ "${o,,}" = "${padded_vo,,}" ]; then
      bad "vault owned by $VAULT_OWNER (compromised-suspected)"
    fi
  else
    info "vault.owner(): $o"
  fi

  probe=$(probe_call "$VAULT" "0xf2fde38b$(pad32 "$TREASURY")")
  case "$probe" in
    REVERT:*caller*|REVERT:*owner*|REVERT:*Ownable*|REVERT:*Unauthorized*)
      ok "transferOwnership(address) exists (probe reverted as non-owner)" ;;
    REVERT:*)
      warn "transferOwnership probe reverted: ${probe#REVERT:}" ;;
    EMPTY_SUCCESS)
      warn "transferOwnership probe succeeded silently — inspect ABI" ;;
    SUCCESS:*)
      warn "transferOwnership probe returned data — inspect ABI" ;;
  esac

  probe=$(probe_call "$VAULT" "0x715018a6")
  case "$probe" in
    REVERT:*caller*|REVERT:*owner*|REVERT:*Ownable*|REVERT:*Unauthorized*)
      ok "renounceOwnership() exists (probe reverted as non-owner)" ;;
    *) info "renounceOwnership() probe: $probe" ;;
  esac
}

check_locker() {
  hdr "6. Locker state"
  local o padded_t
  o=$(eth_call "$LOCKER" "0x8da5cb5b")
  if is_hex_result "$o"; then
    info "locker.owner(): $o"
    padded_t="0x$(pad32 "$TREASURY")"
    if [ "${o,,}" = "${padded_t,,}" ]; then
      ok "locker owned by treasury (expected)"
    else
      warn "locker owner is not treasury"
    fi
  else
    info "locker.owner(): $o"
  fi
}

# ---------- summary ----------
final_summary() {
  hdr "SUMMARY"
  local verdict="UNKNOWN" action=""

  case "${VAULT_OWNER_DELEGATE,,}" in
    "$SUSPECT_DELEGATE")
      verdict="CRITICAL"
      bad "vaultOwner on SUSPECT delegate $SUSPECT_DELEGATE — mint/burn authority hostile"
      action="Assume v1 is unsafe. If you hold the key to $VAULT_OWNER, revoke the 7702 delegation (type-0x04 tx from a separate wallet). If you do not, v1 cannot be repaired — V2 is mandatory." ;;
    "$COINBASE_DELEGATE")
      verdict="WARN"
      warn "vaultOwner on Coinbase proxy — delegation looks recognized, but confirm key custody"
      action="Confirm you hold the key. Move vault ownership to a fresh wallet if transferOwnership() exists. Assume the key was exposed if it was ever delegated elsewhere." ;;
    "")
      verdict="OK-DELEGATION"
      ok "vaultOwner has no delegation" ;;
    *)
      verdict="WARN"
      warn "vaultOwner on unknown delegate $VAULT_OWNER_DELEGATE — investigate" ;;
  esac

  if [ "$PERMISSIONLESS_DANGER" = 1 ]; then
    verdict="CRITICAL"
    bad "Guard test: delegate responded without reverting from a random caller — mint may be permissionless"
    action="Treat as active exploit risk. Check token totalSupply at current block vs. historic. V2 immediately."
  fi

  if [ "$SUPPLY_MISMATCH" = 1 ]; then
    verdict="CRITICAL"
    bad "Supply has changed from 1,000,000,000 — mint likely already used"
    action="Do NOT continue v1 operations. Snapshot holders at the block the delegation was set. V2 mandatory."
  fi

  echo
  printf '%sVERDICT: %s%s\n' "$B" "$verdict" "$N"
  [ -n "$action" ] && printf 'NEXT:    %s\n' "$action"
}

main() {
  printf '%sPIDX AUDIT%s\n' "$B" "$N"
  info "RPC:    $RPC"
  info "token:  ${TOKEN:-<unset>}"
  info "vault:  $VAULT"
  local blk
  blk=$(rpc eth_blockNumber "[]")
  if is_hex_result "$blk"; then info "block:  $((16#${blk#0x}))"; fi

  check_delegations
  check_delegate_bytecode
  check_guard
  check_token
  check_vault
  check_locker
  final_summary
}

main "$@"
