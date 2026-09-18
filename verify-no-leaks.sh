#!/usr/bin/env bash
# verify-no-leaks.sh — scan git history + current tree for private keys
set -uo pipefail
cd "$(dirname "$0")"
G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; N='\033[0m'
ok(){ printf "${G}[OK]${N}   %s\n" "$*"; }
bad(){ printf "${R}[FAIL]${N} %s\n" "$*"; }
warn(){ printf "${Y}[WARN]${N} %s\n" "$*"; }

echo "── 1. Is .env tracked by git? ─────────────────────────────────"
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  bad ".env IS tracked — run: git rm --cached .env && git commit"
else
  ok ".env is not tracked"
fi

echo ""
echo "── 2. Current files with private-key patterns ──────────────────"
FOUND=0
while IFS= read -r f; do
  [[ -f "$f" ]] || continue
  if grep -lE '0x[0-9a-fA-F]{64}' "$f" 2>/dev/null | grep -v '\.example$' | grep -v 'node_modules' >/dev/null; then
    if ! echo "$f" | grep -qE '\.(example|md|html)$' && [[ "$f" != *".gitignore"* ]]; then
      warn "found 0x+64hex in: $f"
      FOUND=1
    fi
  fi
done < <(git ls-files 2>/dev/null)
[[ "$FOUND" == "0" ]] && ok "no tracked file contains a 64-hex private key pattern"

echo ""
echo "── 3. Scan last 50 commits for key-shaped strings ──────────────"
if git log -n 50 -p 2>/dev/null | grep -E '^\+(DEPLOYER_PK|MINER_PK)=0x[0-9a-fA-F]{64}' >/dev/null; then
  bad "private key found in recent git history!"
  git log -n 50 -p 2>/dev/null | grep -B2 -E '^\+.*0x[0-9a-fA-F]{64}' | head -20
else
  ok "no private keys in recent commit diffs"
fi

echo ""
echo "── 4. Are .env and *.key in .gitignore? ───────────────────────"
for pat in '.env' '*.key' 'secrets/'; do
  if grep -qF "$pat" .gitignore; then
    ok "$pat is ignored"
  else
    warn "$pat NOT in .gitignore"
  fi
done

echo ""
echo "── 5. .env permissions ────────────────────────────────────────"
if [[ -f .env ]]; then
  PERM=$(stat -c '%a' .env)
  [[ "$PERM" == "600" ]] && ok ".env is chmod 600" || warn ".env is chmod $PERM (should be 600)"
else
  ok "no .env on disk (nothing to leak)"
fi

echo ""
echo "── 6. Files that WOULD be pushed ──────────────────────────────"
git status --short | head -20
