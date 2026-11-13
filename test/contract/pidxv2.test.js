// Real-EVM tests for PIDXv2 using Hardhat's in-process network.
// These assert the security invariants that v1 violated, by executing the
// compiled bytecode — not by inspecting the ABI.
const assert = require("assert");
const { ethers } = require("hardhat");

const TOTAL = 1_000_000_000n * 10n ** 18n;

describe("PIDXv2 security invariants", function () {
  let token, deployer, liq, com, ops, attacker;

  before(async function () {
    [deployer, liq, com, ops, attacker] = await ethers.getSigners();
    const amounts = [(TOTAL * 60n) / 100n, (TOTAL * 30n) / 100n, (TOTAL * 10n) / 100n];
    amounts[0] += TOTAL - amounts.reduce((a, b) => a + b, 0n);
    const F = await ethers.getContractFactory("PIDXv2");
    token = await F.deploy([liq.address, com.address, ops.address], amounts);
    await token.waitForDeployment();
  });

  it("allocates the full fixed supply at construction", async function () {
    assert.equal(await token.totalSupply(), TOTAL);
    assert.equal(await token.balanceOf(liq.address), (TOTAL * 60n) / 100n);
  });

  it("has NO mint function (v1 could inflate without limit)", async function () {
    for (const sig of ["mint(address,uint256)", "mint(uint256)"]) {
      assert.equal(token.interface.getFunction(sig), null, `unexpected ${sig}`);
    }
    // A raw call to the mint selector must not exist on the ABI and must revert.
    const data = "0x40c10f19" + "0".repeat(64) + (10n ** 18n).toString(16).padStart(64, "0");
    await assert.rejects(deployer.sendTransaction({ to: await token.getAddress(), data }));
  });

  it("has NO burn-from function (v1 could wipe any holder)", async function () {
    for (const sig of ["burn(address,uint256)", "burn(uint256)", "burnFrom(address,uint256)"]) {
      assert.equal(token.interface.getFunction(sig), null, `unexpected ${sig}`);
    }
    const data = "0x9dc29fac" + attacker.address.slice(2).padStart(64, "0") + (10n ** 18n).toString(16).padStart(64, "0");
    await assert.rejects(deployer.sendTransaction({ to: await token.getAddress(), data }));
  });

  it("has NO owner/setVault/upgrade surface", async function () {
    for (const sig of ["owner()", "setVault(address)", "transferOwnership(address)", "renounceOwnership()", "upgradeTo(address)"]) {
      assert.equal(token.interface.getFunction(sig), null, `unexpected ${sig}`);
    }
  });

  it("rejects a constructor that does not allocate the full supply", async function () {
    const F = await ethers.getContractFactory("PIDXv2");
    await assert.rejects(F.deploy([liq.address], [1n]));
  });

  it("rejects the zero address as a recipient", async function () {
    const F = await ethers.getContractFactory("PIDXv2");
    await assert.rejects(F.deploy([ethers.ZeroAddress], [TOTAL]));
  });

  it("a stranger cannot move another holder's tokens", async function () {
    await assert.rejects(
      token.connect(attacker).transferFrom(liq.address, attacker.address, 10n ** 18n)
    );
  });

  it("an approved spender can move exactly the approved amount", async function () {
    await token.connect(liq).approve(attacker.address, 5n * 10n ** 18n);
    await token.connect(attacker).transferFrom(liq.address, attacker.address, 5n * 10n ** 18n);
    assert.equal(await token.balanceOf(attacker.address), 5n * 10n ** 18n);
  });

  it("totalSupply is unchanged after transfers", async function () {
    await token.connect(liq).transfer(com.address, 10n ** 18n);
    assert.equal(await token.totalSupply(), TOTAL);
  });
});
