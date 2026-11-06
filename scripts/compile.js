const fs = require('fs');
const path = require('path');
const solc = require('solc');
const source = fs.readFileSync(path.resolve(__dirname, '../contracts/PIDXLocker.sol'), 'utf8');

function findImports(p) {
    try { return { contents: fs.readFileSync(path.resolve(__dirname, '../node_modules', p), 'utf8') }; }
    catch (e) { return { error: 'File not found: ' + p }; }
}
const input = {
    language: 'Solidity',
    sources: { 'PIDXLocker.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
};
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
if (output.errors) {
    output.errors.forEach(e => console.error(e.formattedMessage));
    if (output.errors.some(e => e.severity === 'error')) process.exit(1);
}
const c = output.contracts['PIDXLocker.sol']['PIDXLocker'];
fs.writeFileSync(path.resolve(__dirname, '../contracts/PIDXLocker.json'), JSON.stringify({ abi: c.abi, bytecode: c.evm.bytecode.object }, null, 2));
console.log('✅ Compiled to contracts/PIDXLocker.json');
