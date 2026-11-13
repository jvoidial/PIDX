# PIDX (Spirit Guide Token) — working notes

Static frontend on GitHub Pages + Solidity on Base. No build step for the
frontend; `index.html` loads `app.js` and `style.css` directly.

## Tests

- Frontend (jsdom): `node test/run.js` — 109 assertions across security,
  locker, upgrades, honesty suites.
- Contracts (Hardhat): `npx hardhat test test/contract/*.test.js` — 9 passing.

Both must pass before committing. The honesty suite walks `METRIC_REGISTRY`
in `app.js`, so any new numeric element must declare its provenance there or
the suite fails.

## Chain facts (verify, do not invent)

- PIDX token: `0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c`
- Locker (`0x06A958fF5d896Ba28411215d0CD56a2a5A1b35aD`): `Ownable`,
  owner `0x6f5c5b2117c22c1cb07244be032bd4cde966432c`. Holds one Uniswap V3
  position (`tokenId 6438376`, full-range) with **liquidity 0**.
- NonfungiblePositionManager: `0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1`
- Burn address: `0x000000000000000000000000000000000000dEaD` (balance 0).

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
