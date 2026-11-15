const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// First, remove any existing disclosure section so we don't have duplicates
html = html.replace(/<div[^>]*id="disclosure-section"[^>]*>[\s\S]*?<\/div>/i, '');

// The new HTML block
const newBanner = `
    <!-- PIDX V2 BANNER -->
    <div id="disclosure-section" style="background-color: #ff0033; color: white; padding: 20px; border-radius: 10px; margin: 20px auto; max-width: 900px; font-family: monospace; border: 2px solid #fff; box-shadow: 0 0 10px #ff0033; text-align: left;">
        <h2 style="margin-top: 0; text-transform: uppercase; font-weight: bold;">🚨 HONEST DISCLOSURE: PIDX V2 IS LIVE 🚨</h2>
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 10px;">
            The old <strong>v1 contract</strong> is permanently deprecated and its treasury supply has been burned. 
            <strong>V2 is a safe, fixed-supply token (No mint, no burn, no owner).</strong>
        </p>
        <p style="font-size: 18px; font-weight: bold; background: #000; padding: 10px; display: inline-block; border-radius: 5px; margin: 0;">
            V2 Contract: 0x172B97517c42f9491f6100333b9ea2e42a6D3181
        </p>
    </div>
`;

// Try to insert it right after <body> or <main>
if (html.includes('<main>')) {
    html = html.replace('<main>', `<main>\n${newBanner}`);
    console.log("✅ Injected banner right after <main>");
} else if (html.includes('<body>')) {
    html = html.replace('<body>', `<body>\n${newBanner}`);
    console.log("✅ Injected banner right after <body>");
} else {
    // If all else fails, just put it at the very top of the file
    html = newBanner + html;
    console.log("✅ Injected banner at the very top of the file");
}

fs.writeFileSync('index.html', html, 'utf8');
console.log("🎉 Website HTML updated successfully!");
