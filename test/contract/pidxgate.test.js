// Real-EVM tests for PIDXHoldingsGate using Hardhat's in-process network.
// The gate is view-only, so every test here also asserts that it never gains
// the ability to move funds.
const assert = require("assert");
const { ethers } = require("hardhat");

const PIDX_UNIT = 10n ** 18n;          // PIDX has 18 decimals (confirmed on-chain)
const THRESHOLD = 1000n * PIDX_UNIT;   // 1,000 PIDX

describe("PIDXHoldingsGate", function () {
  let token, gate, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // PIDXv2 requires the whole fixed supply (1e9 * 1e18) allocated at construction.
    const Token = await ethers.getContractFactory("PIDXv2");
    token = await Token.deploy([owner.address], [1_000_000_000n * PIDX_UNIT]);
    await token.waitForDeployment();

    const Gate = await ethers.getContractFactory("PIDXHoldingsGate");
    gate = await Gate.deploy(await token.getAddress(), THRESHOLD);
    await gate.waitForDeployment();
  });

  it("exposes the token address and threshold", async function () {
    assert.equal(await gate.pidx(), await token.getAddress());
    assert.equal(await gate.threshold(), THRESHOLD);
  });

  it("holdingsOf matches the token's balanceOf exactly", async function () {
    await token.transfer(alice.address, 12345n);
    assert.equal(await gate.holdingsOf(alice.address), await token.balanceOf(alice.address));
    assert.equal(await gate.holdingsOf(alice.address), 12345n);
    assert.equal(await gate.holdingsOf(bob.address), 0n);
  });

  it("returns false at 999 PIDX (just below the boundary)", async function () {
    await token.transfer(alice.address, 999n * PIDX_UNIT);
    assert.equal(await gate.meetsThreshold(alice.address), false);
  });

  it("returns true at exactly 1,000 PIDX (boundary is inclusive)", async function () {
    await token.transfer(alice.address, 1000n * PIDX_UNIT);
    assert.equal(await gate.meetsThreshold(alice.address), true);
  });

  it("returns true at 1,001 PIDX (just above the boundary)", async function () {
    await token.transfer(alice.address, 1001n * PIDX_UNIT);
    assert.equal(await gate.meetsThreshold(alice.address), true);
  });

  it("reads the balance live, not a cached snapshot", async function () {
    await token.transfer(alice.address, 1000n * PIDX_UNIT);
    assert.equal(await gate.meetsThreshold(alice.address), true);
    // Alice moves 1 wei below the threshold; the next read must reflect it.
    await token.connect(alice).transfer(bob.address, 1n);
    assert.equal(await gate.meetsThreshold(alice.address), false);
  });

  it("owner can change the threshold and the change is observable", async function () {
    await token.transfer(alice.address, 500n * PIDX_UNIT);
    assert.equal(await gate.meetsThreshold(alice.address), false);
    await gate.connect(owner).setThreshold(500n * PIDX_UNIT);
    assert.equal(await gate.threshold(), 500n * PIDX_UNIT);
    assert.equal(await gate.meetsThreshold(alice.address), true);
  });

  it("changing the threshold emits ThresholdChanged(old, new)", async function () {
    await assert.doesNotReject(async () => {
      const tx = await gate.connect(owner).setThreshold(250n * PIDX_UNIT);
      const rc = await tx.wait();
      const ev = rc.logs.map((l) => { try { return gate.interface.parseLog(l); } catch (_) { return null; } }).find((e) => e && e.name === "ThresholdChanged");
      assert.ok(ev, "ThresholdChanged was not emitted");
      assert.equal(ev.args.oldThreshold, THRESHOLD);
      assert.equal(ev.args.newThreshold, 250n * PIDX_UNIT);
    });
  });

  it("a non-owner cannot change the threshold", async function () {
    await assert.rejects(gate.connect(alice).setThreshold(1n));
    assert.equal(await gate.threshold(), THRESHOLD);
  });

  it("a non-owner cannot change the threshold even if they hold tokens", async function () {
    await token.transfer(bob.address, 5000n * PIDX_UNIT);
    await assert.rejects(gate.connect(bob).setThreshold(1n));
    assert.equal(await gate.threshold(), THRESHOLD);
  });

  it("the constructor rejects the zero address and non-contracts", async function () {
    const Gate = await ethers.getContractFactory("PIDXHoldingsGate");
    await assert.rejects(Gate.deploy(ethers.ZeroAddress, THRESHOLD));
    await assert.rejects(Gate.deploy(alice.address, THRESHOLD)); // EOA, no code
  });

  it("has no fund-moving surface: no transfer, approve, or receive hooks", async function () {
    for (const sig of ["transfer(address,uint256)", "transferFrom(address,address,uint256)", "approve(address,uint256)", "withdraw(uint256)", "deposit(uint256)"]) {
      assert.equal(gate.interface.getFunction(sig), null, `unexpected ${sig}`);
    }
    // No receive()/fallback(): a plain value transfer must revert.
    await assert.rejects(owner.sendTransaction({ to: await gate.getAddress(), value: 1n }));
  });
});
