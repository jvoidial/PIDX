#!/bin/bash

echo "🌀 SPIRIT GUIDE - COMPLETE DEPLOYMENT"
echo "===================================="

# Move to the correct directory
cd ~/spirit-guide-token

# Check if the file exists
if [ -f "../spirit_guide_full_sync.json" ]; then
    echo "📁 Moving spirit_guide_full_sync.json to current directory..."
    mv ../spirit_guide_full_sync.json .
else
    echo "⚠️ spirit_guide_full_sync.json not found in parent directory"
fi

# Add all changes
echo "📤 Adding changes to git..."
git add spirit_guide_full_sync.json
git add ../stake_rewards_pies.json 2>/dev/null || true

# Commit
echo "📝 Committing changes..."
git commit -m "✨ Integrate Acoustic Protocol v7.1

- Vagus Nerve Acoustic Override
- Biological reality layer (DNA/neural pathways)
- Low-frequency resonance protocol
- Global markets (38 exchanges)
- eToro readiness tracking
- Updated Quantum Ease Flow"

# Push
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Live at: https://jvoidial.github.io/spirit-guide-token/spirit_guide_full_sync.json"
echo "🚀 SPIRIT GUIDE v7.1 DEPLOYED!"
