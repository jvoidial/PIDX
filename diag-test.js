// Minimal load: strip the browser-only bits, exercise diagnose()
const fs = require('fs');
let src = fs.readFileSync('phb-connector.js', 'utf8');
src = src.replace(/window\.PHB = PHB;?/, 'module.exports = PHB;');
const sandbox = { module: { exports: {} }, localStorage: {
  getItem: () => null, setItem: () => {}, removeItem: () => {}
}, console, fetch: () => Promise.reject('no fetch in node') };
const vm = require('vm');
const ctx = vm.createContext(sandbox);
vm.runInContext(src, ctx);
const PHB = sandbox.module.exports;

console.log('STATUS keys :', Object.keys(PHB.STATUS).join(', '));
console.log('has diagnose:', typeof PHB.diagnose === 'function');
console.log('has get     :', typeof PHB.get === 'function');
console.log('has health  :', typeof PHB.health === 'function');

if (typeof PHB.diagnose === 'function') {
  const d = PHB.diagnose('token.PIDX');
  console.log('diagnose(token.PIDX).conclusion =', d.conclusion);
  console.log('diagnose(token.PIDX).hint       =', d.hint);
}
