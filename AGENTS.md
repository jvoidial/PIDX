# PIDX (Spirit Guide Token) — working notes

Static frontend on GitHub Pages + Solidity on Base. No build step for the
frontend; `index.html` loads `app.js` and `style.css` directly.

## Tests

- Frontend (jsdom): `node test/run.js` — 195 assertions across security,
  locker, upgrades, honesty suites.
- Contracts (Hardhat): `npx hardhat test test/contract/*.test.js` — 21 passing.

Both must pass before committing. The honesty suite walks `METRIC_REGISTRY`
in `app.js`, so any new numeric element must declare its provenance there or
the suite fails.

## Chain facts (verify, do not invent)

- **PIDX V2 token: `0x172B97517c42f9491f6100333b9ea2e42a6D3181`** — the live token.
  Bytecode scan confirms **no** `mint`, `burn`, `burnFrom`, `owner`,
  `transferOwnership`, `setVault`, `vault`, `blacklist` or `pause`.
  `totalSupply()` == exactly `1_000_000_000 * 10**18`. Name reads `"PIDX V2"`,
  symbol `"PIDX"`, decimals 18.
  **VERIFIED on BaseScan** ("Contract Source Code Verified", Contract Name
  `PIDXv2`, **Exact Match**, solc 0.8.38, optimizer **off**). Recompiling the
  published source reproduces the on-chain code section byte-for-byte
  (3,372 bytes; full runtime 3,425 bytes). Deployed by the treasury at block
  56803046, tx `0x84e5b299…9b6c`, nonce 301.
  **IMPORTANT — the deployed contract is NOT `contracts/PIDXv2.sol`.** The
  deployed source is `contracts/PIDXv2Mainnet.sol` (constructor takes no args,
  mints 100% to `msg.sender`). `contracts/PIDXv2.sol` is a *separate, undeployed*
  design whose constructor takes `(address[], uint256[])` and distributes at
  construction. Same security properties, different bytecode. Do not deploy
  `PIDXv2.sol` expecting it to match mainnet.
- **PIDX V1 token: `0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c` — COMPROMISED.**
  Kept in code only as the `PIDX_V1_ADDR` disclosure constant. Its vault
  `0xfAcb5905…` is owned by `0x3212D08f…`, a 7702 EOA delegated to
  `0x3ae1f70c…` — a "Reconstructed" contract with permissionless
  `forwardAllEth()`/`forwardTokens()` to hardcoded `0x43b18F8f…1AAAA`.
  V1 still has `mint` (0x40c10f19) and `burn` (0x9dc29fac) in its bytecode, but
  V1 liquidity is dust (deepest V1/WETH pair `0x0b780b8a…` holds ~0.0000028 WETH),
  so a minted dump has essentially nowhere to land.
- Treasury `0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C` is a **Coinbase Smart
  Wallet** (7702 proxy `0x7702cb55…`, impl `0x000100ab…`, verified). **2 owners,
  no threshold** — any one owner can act alone. Owner #1 is Coinbase's verified
  `SpendPermissionManager` `0xf85210b2…`.

  > ⚠️ **KNOWN, ACCEPTED RISK — 1-of-2 treasury.** `ownerCount()` reads `2`, and
  > the implementation exposes **no `threshold()`** (the call reverts). A Coinbase
  > Smart Wallet authorises a user operation when *any single* owner signature is
  > valid, so this treasury is **1-of-2, not 2-of-2**: compromise of either owner
  > alone is enough to move the balance. As of this writing it custodies
  > ~999,999,175 PIDX V2 (≈ 99.9999% of supply). The owner keys are passkeys held
  > on the operator's device, so the practical single point of failure is that
  > device plus its recovery path. Accepted for now by the operator, who intends
  > to move the bulk of the supply to cold storage. **Any future developer: treat
  > this as unresolved. Do not add code that assumes a 2-of-2 or timelocked
  > treasury, and do not describe the treasury as "multisig-secured".**
- V2 pool `0x35f5f94F095202380bcCfcd9321fA40f5E5F8720` is a Uniswap **V2** pair:
  ~10.93 PIDX / ~0.000011 WETH (**≈ $0.04** of liquidity), treasury holds 99.99%
  of the LP, unlocked. Not a real market yet.
- **V1 -> V2 distribution: a partial 1:1 holder migration, not a full airdrop.**
  Verified from V2 `Transfer` logs (12 total since deploy at block 56803046). The
  treasury sent V2 to 6 addresses plus the pool, and **five of the six received
  their V1 balance to the wei** (0.75, 7.652038144631173887, 21.306049557724499708,
  and two 1-wei balances). One recipient got 784.23 V2 while holding 0.3197 V1, so
  the mapping is *not* uniform. Caveat: an exhaustive V1 holder census could not
  be run from a free RPC (archive `eth_getLogs` is gated; V1 shows 59 holders on
  GoPlus, V2 shows 10). So the accurate claim is "holders were migrated 1:1" for
  the addresses that were funded — **do not claim "every V1 holder was
  airdropped" without a full holder-list comparison.**
- V2 is **not** a fork of V1 and was not deployed from `contracts/PIDXv2.sol`:
  it is a minimal 4-function ERC-20 with no `Transfer`-hook surface. Do not
  describe V2 as "the same token with the backdoor removed".
- Locker (`0x06A958fF5d896Ba28411215d0CD56a2a5A1b35aD`): `Ownable`,
  owner `0x6f5c5b2117c22c1cb07244be032bd4cde966432c`. Holds one Uniswap V3
  position (`tokenId 6438376`, full-range) with **liquidity 0**.
- NonfungiblePositionManager: `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1`
- Burn address: `0x000000000000000000000000000000000000dEaD`. Note: the V1
  "burn" of 999,994,369 PIDX used `transfer()` to this address, so V1
  `totalSupply()` is still 1,000,000,000 — it is a dead-address send, not a
  supply-reducing burn. Label it honestly.

## Gotchas

- ABI words are **64 hex characters**, not 32. Slicing a `positions()` result
  at `2 + 32 * 7` reads the middle of word 3; the correct offset for word 7
  (liquidity) is `2 + 64 * 7`. This bug shipped once and is now covered by a
  regression test.
- `app.js` and `style.css` are cache-busted with `?v=<n>` in `index.html`.
  Bump it whenever either file changes, or browsers keep the stale copy.
- Only `setLiveBlock()` may write `#live-block`; a previous fake counter
  overwrote the real RPC reading.
- `app.js` runs in its own eval scope under the test harness, so functions
  the tests need must be exported on `window.PIDX_APP`.

## Honesty rules (do not regress)

- No fabricated numbers. Metrics with no real source render "—" or are removed
  entirely; the registry records which is which.
- Never claim the locker is "immutable" or "verified" beyond what the chain
  shows. It is `Ownable` with a 0-liquidity position.
- No buyback/burn engine is claimed: the burn counter only reads the dEaD
  balance on chain.
- No personal identifiers collected or persisted; the resonance tag is salted
  per session and never reversible to the input.

## Chain facts (verified, not assumed)

- PIDX token `0x95c7E2d53F4B615A50d4468Dfd5aFF850dc17F0C` has `decimals() == 18`.
  One PIDX is `10n ** 18n`; the bot gate threshold (1,000 PIDX) is `1000n * 10n ** 18n`.
- Contract function selectors are computed with ethers and must never be guessed.
  `PIDXHoldingsGate`: `holdingsOf(address)` = `0x03995b2d`,
  `meetsThreshold(address)` = `0xb04f81f0`.
- **V2 is live, verified on BaseScan** (contract name `PIDXv2`, **Exact Match**).
  V2 is **not** in Sourcify, so the Live Integrity panel's Source row reports
  `UNKNOWN (not in Sourcify)` — BaseScan and Sourcify are separate registries.
  Do not "fix" that row to PASS: it must never claim a verification it cannot
  re-check from the browser.
- **V2 bytecode has no mint, no burn and no owner.** Selectors confirmed absent
  from `eth_getCode(V2)`: `mint` 0x40c10f19 / 0xa0712d68, `burn` 0x42966c68 /
  0x9dc29fac, `burnFrom` 0x79cc6790, `owner` 0x8da5cb5b, `transferOwnership`
  0xf2fde38b. The Live Integrity panel re-reads this live; keep `INTEGRITY_SELECTORS`
  in `app.js` in sync with this list.
- **V2 supply is fixed at 1,000,000,000 PIDX.** `totalSupply()` has never moved.
  `balanceOf(0x…dEaD)` is **0** — nothing has been burned, and a dead-address send
  would not reduce `totalSupply()` anyway. The burn counter is labelled accordingly.
- **The V2/WETH LP is unlocked and treasury-owned.** Pair
  `0x35f5f94F095202380bcCfcd9321fA40f5E5F8720` (Uniswap V2, token0 = V2, token1 =
  WETH). `totalSupply()` ≈ 0.011 LP; the treasury holds 100% of it and can withdraw
  at any time. There is **no liquidity lock** and the UI must never imply one.
- **Treasury `0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C` holds ≈99.9999% of V2**
  (999,999,175.12 of 1,000,000,000). It is a Coinbase Smart Wallet (EIP-7702 proxy)
  with `ownerCount() == 2` and **no `threshold()`** — any single owner can move the
  balance. KNOWN/ACCEPTED RISK, not relinquished.

## Trading bots (Path A / Path B)

- The bots are **not built**. There is no fill feed, so PnL / Win Rate /
  Trades-hr rows are **deleted from the DOM**, not rendered as "—" (an em-dash
  still implies the metric exists). Do not re-add them without a real source.
- `PIDXHoldingsGate` is a **view-only** eligibility gate. No custody, no
  approvals, no transfer hooks, no `receive()`. Do not add any.
- The gate address lives in `#gate-addr[data-address]` and ships **empty**.
  An unset/placeholder address must render "Eligibility check unavailable" and
  log a console error — never fall back to "locked" or "unlocked".
- An RPC failure renders "Eligibility check failed". Failure is never
  downgraded to a locked/unlocked verdict.
- `scripts/deploy-gate.js` reads `decimals()` from the token to scale the
  threshold and rejects placeholder / zero addresses. It does not write the
  address into `index.html`; that is a manual, deliberate step.
- Path C (bots that trade real funds) is **out of scope** until a custody
  design exists. Do not stub order routing, key management, or fund movement.
