// Compiles every .sol file in contracts/ into a matching .json artifact
// (abi + bytecode) that scripts/ can deploy. No keys, no network access.
const fs = require("fs");
const path = require("path");
const solc = require("solc");

const CONTRACTS_DIR = path.resolve(__dirname, "../contracts");
const files = fs.readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".sol"));

if (files.length === 0) {
    console.error("No .sol files found in contracts/");
    process.exit(1);
}

const sources = {};
for (const f of files) sources[f] = { content: fs.readFileSync(path.join(CONTRACTS_DIR, f), "utf8") };

function findImports(p) {
    try {
        return { contents: fs.readFileSync(path.resolve(__dirname, "../node_modules", p), "utf8") };
    } catch (e) {
        return { error: "File not found: " + p };
    }
}

const input = {
    language: "Solidity",
    sources,
    settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: { "*": { "*": ["abi", "evm.bytecode.object"] } },
    },
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = output.errors || [];
errors.forEach((e) => console.error(e.formattedMessage));
if (errors.some((e) => e.severity === "error")) process.exit(1);

let written = 0;
for (const [file, contracts] of Object.entries(output.contracts || {})) {
    if (!files.includes(file)) continue; // skip imported libraries from node_modules
    for (const [name, c] of Object.entries(contracts)) {
        if (!c.evm || !c.evm.bytecode || !c.evm.bytecode.object) continue; // interface/abstract
        fs.writeFileSync(path.join(CONTRACTS_DIR, `${name}.json`),
            JSON.stringify({ abi: c.abi, bytecode: c.evm.bytecode.object }, null, 2));
        console.log(`✅ ${name} -> contracts/${name}.json`);
        written++;
    }
}
console.log(`Compiled ${written} contract artifact(s).`);
