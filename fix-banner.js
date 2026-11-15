const fs = require('fs');

if (!fs.existsSync('index.html')) {
    console.log("❌ index.html not found in this directory.");
    process.exit(1);
}

let html = fs.readFileSync('index.html', 'utf8');

// The new HTML block for the banner
const newBanner = `
<div id="disclosure-section" style="background-color: #ff0033; color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; font-family: monospace; border: 2px solid #fff; box-shadow: 0 0 10px #ff0033;">
    <h2 style="margin-top: 0; text-transform: uppercase;">🚨 HONEST DISCLOSURE: PIDX V2 IS LIVE 🚨</h2>
    <p style="font-size: 16px; line-height: 1.5; margin-bottom: 10px;">
        The old <strong>v1 contract</strong> is permanently deprecated and its treasury supply has been burned. 
        <strong>v2 is a safe, fixed-supply token (No mint, no burn, no owner).</strong>
    </p>
    <p style="font-size: 18px; font-weight: bold; background: #000; padding: 10px; display: inline-block; border-radius: 5px;">
        V2 Contract: 0x172B97517c42f9491f6100333b9ea2e42a6D3181
    </p>
</div>
`;

// This regex looks for the div with id="disclosure-section" and replaces everything inside it
const regex = /<div[^>]*id="disclosure-section"[^>]*>[\s\S]*?<\/div>/i;

if (regex.test(html)) {
    html = html.replace(regex, newBanner);
    fs.writeFileSync('index.html', html, 'utf8');
    console.log("✅ SUCCESS: Found the disclosure section and replaced it with the V2 banner!");
} else {
    console.log("❌ Could not find the <div id=\"disclosure-section\"> in index.html.");
    console.log("Let's find exactly where the old text is hiding...");
}
