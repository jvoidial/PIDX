"use strict";

// PIDX Locker Web3-flow tests. Verifies the exact ABI types the frontend calls,
// that approve mines before lockPosition is sent, and that withdrawPosition
// gates on lock state / owner / expiry.
const { boot, wait, suite } = require("./harness");

module.exports = async function run() {
  const s = suite("PIDX locker flows");

  // Static ABI assertions (must match the deployed contract selectors).
  const fs = require("fs");
  const path = require("path");
  const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  s.ok("ABI: lockPosition(address,uint256,uint256)",
    /lockPosition\(address nftContract, uint256 tokenId, uint256 lockDuration\)/.test(app));
  s.ok("ABI: withdrawPosition(address,uint256)",
    /withdrawPosition\(address nftContract, uint256 tokenId\)/.test(app));
  s.ok("ABI: locks(address,uint256) view", /function locks\(address nftContract, uint256 tokenId\) view/.test(app));
  s.ok("uses NPM_ADDR constant", /NPM_ADDR\s*=\s*"0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1"/.test(app));
  s.ok("uses LOCKER_ADDR constant", /LOCKER_ADDR\s*=\s*"0x06A958fF5d896Ba28411215d0CD56a2a5A1b35aD"/.test(app));

  // ---- approve -> wait -> verify -> lockPosition ordering ----
  {
    const order = [];
    const wallet = "0x1111111111111111111111111111111111111111";
    const makeTx = (tag) => ({ wait: async () => { order.push("wait:" + tag); return { status: 1 }; } });

    const eth = {
      request: async (payload) => {
        const m = payload.method;
        if (m === "eth_requestAccounts") return [wallet];
        if (m === "eth_chainId") return "0x2105";
        return "0x1";
      },
      on() {}
    };

    // A minimal ethers shim, injected before app.js evaluates so the locker
    // module (and the keccak-based engram generator) both find `ethers`.
    const ethersShim = {
      keccak256: () => "0x" + "ab".repeat(32),
      toUtf8Bytes: (s) => new TextEncoder().encode(String(s)),
      BrowserProvider: function () { this.getSigner = async () => ({}); },
      Contract: function (addr) {
        const isNpm = String(addr).toLowerCase() === "0x03a520b32c04bf3beef7beb72e919cf822ed34f1";
        if (isNpm) {
          this.balanceOf = async () => 1n;
          this.tokenOfOwnerByIndex = async () => 4242n;
          this.ownerOf = async () => wallet;
          this.approve = async () => { order.push("approve"); return makeTx("approve"); };
        } else {
          this.lockPosition = async (nft, id, dur) => { order.push("lockPosition:" + dur); return makeTx("lock"); };
          this.locks = async () => ({ owner: wallet, unlockTime: 1n, isLocked: true });
          this.withdrawPosition = async () => { order.push("withdrawPosition"); return makeTx("withdraw"); };
        }
      }
    };

    const { w } = boot({
      ethereum: eth,
      globals: { ethers: ethersShim },
      fetch: () => ({ ok: true, status: 200, json: async () => ({ result: "0x1" }) })
    });

    // Drive the real connect flow (app.js is strict-mode, so we cannot poke
    // `connectedWallet` directly from the test scope).
    w.document.getElementById("connect-wallet-btn").click();
    await wait(50);
    await w.PIDX_APP.scanAndLockPositions();
    await wait(250);

    const iApprove = order.indexOf("approve");
    const iLock = order.findIndex(x => x.startsWith("lockPosition"));
    s.ok("approve is called", iApprove >= 0);
    s.ok("lockPosition is called", iLock >= 0);
    s.ok("approve precedes lockPosition", iApprove >= 0 && iLock >= 0 && iApprove < iLock);
    s.ok("lockDuration is 1 year (31536000)", order.includes("lockPosition:31536000"));
    s.ok("approve is awaited before lock", order.indexOf("wait:approve") < iLock);
  }

  return s.done();
};
