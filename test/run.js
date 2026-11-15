"use strict";

// Test runner: executes every suite and exits non-zero on any failure.
const suites = [
  require("./security.test"),
  require("./locker.test"),
  require("./upgrades.test"),
  require("./honesty.test")
];

(async () => {
  let pass = 0, fail = 0;
  for (const run of suites) {
    const r = await run();
    pass += r.pass;
    fail += r.fail;
  }
  console.log("\n==================================================");
  console.log("  TOTAL: " + pass + " passed, " + fail + " failed");
  console.log("==================================================");
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("RUNNER ERROR", e); process.exit(2); });
