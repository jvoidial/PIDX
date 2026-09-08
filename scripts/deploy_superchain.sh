#!/bin/bash
echo "🌐 Deploying to Superchain..."
if [ -n "$BASE_RPC" ]; then
  echo "Deploying to Base..."
  forge script script/DeployBase.s.sol --rpc-url $BASE_RPC --broadcast
fi
if [ -n "$OP_RPC" ]; then
  echo "Deploying to OP Mainnet..."
  forge script script/DeployOP.s.sol --rpc-url $OP_RPC --broadcast
fi
if [ -n "$ARB_RPC" ]; then
  echo "Deploying to Arbitrum..."
  forge script script/DeployArbitrum.s.sol --rpc-url $ARB_RPC --broadcast
fi
echo "✅ Superchain deployment complete!"
