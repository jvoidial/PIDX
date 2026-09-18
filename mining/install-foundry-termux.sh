#!/usr/bin/env bash
# install-foundry-termux.sh — install Foundry + base-anvil in Termux
set -euo pipefail
echo "═══════════════════════════════════════════════════════════════"
echo "  FOUNDRY INSTALLER (Termux)"
echo "═══════════════════════════════════════════════════════════════"

echo "[1/4] Installing build deps..."
pkg install -y binutils rust git curl 2>&1 | tail -3

echo "[2/4] Installing foundryup..."
curl -L https://foundry.paradigm.xyz | bash
export PATH="$HOME/.foundry/bin:$PATH"

echo "[3/4] Running foundryup (may take 3-5 min on mobile)..."
"$HOME/.foundry/bin/foundryup" || {
  echo "[WARN] foundryup failed — trying base-anvil instead"
}

echo "[4/4] Installing base-anvil (Base L2 toolchain)..."
curl -L https://raw.githubusercontent.com/base/base-anvil/HEAD/foundryup/install | bash || true

if command -v forge >/dev/null 2>&1; then
  echo "[OK]   forge: $(forge --version | head -1)"
else
  echo "[INFO] forge not on PATH — add: export PATH=\$HOME/.foundry/bin:\$PATH"
fi
if command -v base-forge >/dev/null 2>&1; then
  echo "[OK]   base-forge: $(base-forge --version | head -1)"
fi
echo ""
echo "Next: edit ~/.bashrc to add:"
echo "  export PATH=\"\$HOME/.foundry/bin:\$PATH\""
