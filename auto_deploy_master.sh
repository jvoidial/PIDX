#!/bin/bash
set -e

echo "============================================================"
echo "🚀 PIDX LOCKER AUTOMATED DEPLOYMENT & UPDATE"
echo "============================================================"

# 1. Ask for Private Key securely (input hidden)
echo "🔐 Please enter your Base Network PRIVATE KEY."
echo "(Input will be hidden. Supports 64-char hex with or without '0x')"
read -s -p "Private Key: " USER_PK
echo ""

# 2. Clean the input (remove spaces, newlines) and add 0x if missing
USER_PK=$(echo "$USER_PK" | tr -d '[:space:]')
if [[ ! "$USER_PK" == 0x* ]]; then
    USER_PK="0x$USER_PK"
fi

if [ ${#USER_PK} -ne 66 ]; then
    echo "❌ Invalid private key length. Expected 66 characters (including 0x). Got: ${#USER_PK}"
    exit 1
fi

# 3. Write .env file automatically
echo "PRIVATE_KEY=$USER_PK" > .env
echo "BASE_RPC_URL=https://mainnet.base.org" >> .env

# 4. Deploy the contract
echo "🚀 Deploying PIDX Locker to Base Network..."
# We use 'node scripts/deploy.js' which will read from the newly created .env
node scripts/deploy.js

# 5. Grab the deployed address
if [ ! -f locker-address.txt ]; then
    echo "❌ Deployment failed. No address generated."
    rm -f .env
    exit 1
fi
NEW_ADDR=$(cat locker-address.txt)
echo "✅ Successfully deployed at: $NEW_ADDR"

# 6. Update the HTML with the new address
echo "🎨 Updating frontend UI with the new contract address..."
python3 - <<PY
import re
with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

html = html.replace("Pending Deploy", "$NEW_ADDR")
html = re.sub(r'app\.js\?v=\d+', 'app.js?v=100112', html)

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("✅ index.html updated.")
PY

# 7. Push to GitHub
echo "📤 Pushing to GitHub..."
git add index.html contracts/ scripts/ 2>/dev/null || true
git commit -m "Live: PIDX Locker deployed at $NEW_ADDR and UI updated" || true

# Delete .env immediately so your key is never accidentally committed
rm -f .env
echo "🧹 Local .env deleted for security."

# Push (will prompt for GitHub PAT)
echo "⚠️  GitHub will now ask for your username and password."
echo "   Username: jvoidial"
echo "   Password: Paste your 'ghp_...' Personal Access Token"
git push origin main || echo "⚠️ Push failed, check your token."

echo "============================================================"
echo "✅ ALL DONE!"
echo "Your PIDX Locker is deployed and live on your dashboard."
echo "============================================================"
