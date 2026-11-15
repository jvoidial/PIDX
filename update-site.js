const fs = require('fs');
const path = require('path');

const OLD_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';
const NEW_ADDR = '0x172B97517c42f9491f6100333b9ea2e42a6D3181';

const NEW_BANNER = `🚨 PIDX V2 IS LIVE. The old v1 contract is permanently deprecated and its treasury supply has been burned. V2 is a safe, fixed-supply token (No mint, no burn, no owner). Contract: ${NEW_ADDR}`;

function processDirectory(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'pidx-v2-deploy') continue;
        
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (/\.(js|html|json|css|md)$/i.test(file)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;

            // 1. Swap the old address for the new address
            if (content.toLowerCase().includes(OLD_ADDR.toLowerCase())) {
                // Use a case-insensitive regex to catch all variations
                const regex = new RegExp(OLD_ADDR, 'gi');
                content = content.replace(regex, NEW_ADDR);
                changed = true;
            }

            // 2. Replace the old red warning banner with the new V2 warning
            if (file === 'index.html') {
                // Match the old banner text starting with the red alert emoji and ending with the <br> or next tag
                const bannerRegex = /🚨 The PIDX token contract retains owner mint & burn powers[\s\S]*?(?=<\/div>|<br>|<\/p>|<h2)/i;
                if (content.match(bannerRegex)) {
                    content = content.replace(bannerRegex, NEW_BANNER);
                    changed = true;
                } else {
                    // Fallback: Just look for the specific text if the formatting is different
                    const oldText = "The PIDX token contract retains owner mint & burn powers.";
                    if (content.includes(oldText)) {
                        content = content.replace(oldText, NEW_BANNER);
                        changed = true;
                    }
                }
            }

            if (changed) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`✅ Updated: ${fullPath}`);
            }
        }
    }
}

console.log("Scanning project files for old token address and banner...");
processDirectory(__dirname);
console.log("\n🎉 Website update complete!");
console.log("If you're running a local server, restart it to see the changes.");
