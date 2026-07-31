#!/usr/bin/env bash
# Quick health check for Circle Agent Wallet setup.
set -euo pipefail

export PATH="$(npm prefix -g 2>/dev/null)/bin:${PATH:-}"

if ! command -v circle >/dev/null 2>&1; then
  echo "circle CLI not found. Install: npm install -g @circle-fin/cli@latest"
  exit 1
fi

echo "=== circle --version ==="
circle --version

echo ""
echo "=== terms ==="
circle terms show --output json || true

echo ""
echo "=== wallet status (mainnet session) ==="
circle wallet status --output json 2>&1 || true

echo ""
echo "=== wallet status (testnet session) ==="
circle wallet status --testnet --output json 2>&1 || true

echo ""
echo "Next (if wallets not ready):"
echo "  1) Accept terms (explicit consent)"
echo "  2) circle wallet login EMAIL --testnet --init"
echo "  3) complete OTP, then list/fund wallets"
