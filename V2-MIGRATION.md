# PIDX v2 Migration Runbook

This document is the exact, ordered procedure to move from the **v1**
`PenniesIndex` token (`0x95c7e2d5…`) to **PIDXv2**, a fixed-supply token with no
privileged roles. Read it fully before running anything.

> Nothing here deploys anything by itself. Every deploy command is a dry run
> unless you append `--execute`, and `deploy-v2.js` refuses to broadcast on any
> chain other than Base (8453).

---

## 0. Why v1 cannot be fixed in place

`PenniesIndex.sol` (verified source, Sourcify `exact_match`) contains:

| Line | Code | Consequence |
|------|------|-------------|
| 18–21 | `setVault()` — `require(vault == address(0), "vault already set")` | The vault is set once and **locked forever**. It cannot be redirected. |
| 22–26 | `mint(to, amount) onlyVault` | The vault can inflate supply **without limit**. GoPlus `is_mintable: 1`. |
| 27–32 | `burn(from, amount) onlyVault` | The vault can **destroy any holder's balance**. GoPlus `owner_change_balance: 1`. |
| — | no `owner()`, no `renounceOwnership()` | There is **nothing to renounce**. The flaw is permanent by construction. |

Because `setVault` is one-shot and already consumed, and there is no owner, **no
transaction can remove v1's mint/burn power.** A new token is the only fix.

---

## 1. Decide the distribution FIRST (the real decision)

A snapshot-airdrop "to current holders" is **wrong here**: the treasury
`0x6f5c5B21…` holds ~99.99% of every token, so a proportional snapshot would
mint ~99.99% of v2 straight back to the treasury and recreate the same
concentration. Choose deliberately:

- **Option A — Fresh distribution (recommended).** Abandon the old supply.
  Allocate v2 to a new multisig for liquidity, a community allocation, and an
  operations budget. This is what `deploy-v2.js` implements.
- **Option B — Hybrid.** Snapshot only *real* holders (exclude treasury, locker
  and the vault), airdrop them a modest share, and put the rest into locked
  liquidity. Requires an indexer (see §3).

Write your chosen split down before deploying. It is baked into the constructor
and **cannot be changed afterwards.**

---

## 2. Prepare a clean, safe deploy environment

1. **Use a brand-new deployer wallet**, created on a device you trust. Do not
   reuse any wallet that has been used with the current setup.
2. **Do not reuse the old treasury.** Create a fresh multisig (Safe on Base) for
   the v2 treasury and liquidity.
3. Create `.env` locally (it is git-ignored) from `.env.example`:

   ```
   PRIVATE_KEY=0x...        # the NEW deployer only
   BASE_RPC_URL=https://mainnet.base.org
   BASESCAN_API_KEY=...     # for verification
   ```

   Confirm `.env` is ignored: `git check-ignore -v .env` must print a match.
4. **Never paste the private key into a website, chat, or the frontend.** The
   frontend reads no secrets.

---

## 3. Snapshot holders (only if you chose Option B)

```bash
node scripts/snapshot-holders.js 0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c
```

The script walks Transfer logs in bounded windows and **tells you whether it
covered the whole history**. A public RPC will usually refuse a full-range
`eth_getLogs`; if the output says `INCOMPLETE`, use Basescan's API, Dune, or an
archive node instead. Cross-check the summed balances against `totalSupply()`.
Do not airdrop from a snapshot you have not reconciled.

---

## 4. Compile and test

```bash
npm run compile          # writes contracts/*.json artifacts
npm test                 # frontend suite (66 tests)
npm run test:contracts   # PIDXv2 EVM invariants (9 tests)
```

All must pass before deploying.

---

## 5. Deploy v2

Dry run first — this prints the allocation and broadcasts nothing:

```bash
node scripts/deploy-v2.js \
  --liquidity 0xNEW_MULTISIG \
  --community 0xCOMMUNITY_ADDR \
  --ops       0xOPS_ADDR \
  --liquidity-pct 60 --community-pct 30 --ops-pct 10
```

Check the printed allocation sums to exactly `1000000000.0 PIDX`. Then deploy:

```bash
node scripts/deploy-v2.js --liquidity ... --community ... --ops ... --execute
```

The new address is written to `pidxv2-address.txt` (git-ignored).

---

## 6. Verify the source on BaseScan

```bash
npx hardhat verify --network base <V2_ADDRESS> \
  "[0xLIQ,0xCOMM,0xOPS]" "[600000000000000000000000000,300000000000000000000000000,100000000000000000000000000]"
```

Verification matters: an unverified token looks like a scam to every safety
scanner. Verify before you announce anything.

---

## 7. Add liquidity — the step that prevents a repeat

Concentration is solved by **liquidity**, not by the contract. On Base:

- **Uniswap V2 Router02:** `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24`
- **Uniswap V2 Factory:** `0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6`
- **WETH:** `0x4200000000000000000000000000000000000006`

1. Approve the router to spend the liquidity bucket of v2.
2. Call `addLiquidityETH` with real ETH — **not dust**. A pool with ~7 wei of
   WETH, like the v1 pool, is indistinguishable from a rug.
3. **Lock the LP tokens** in a reputable locker (UNCX or Team.Finance) and
   publish the lock link. Do not hold the LP tokens yourself.
4. Only then publish the new token address.

Do **not** reuse the v1 `PIDXLocker` (`0x06A958fF…`) for this. It is an
`Ownable` contract and its current on-chain position has **0 liquidity**, so it
proves nothing.

---

## 8. Update the frontend honestly

1. Change the token address in `app.js` to the verified v2 address.
2. Replace the disclosure banner text: keep the v1 history (do not delete it —
   it is your credibility), add the v2 address and the LP lock link.
3. Re-run `npm test` and confirm the banner assertions still pass (update them
   in `test/security.test.js` to match the new text).

---

## 9. Post-migration checklist

- [ ] v2 source verified on BaseScan
- [ ] `totalSupply()` equals exactly 1,000,000,000 and never changes
- [ ] GoPlus reports `is_mintable: 0` and `owner_change_balance: 0`
- [ ] LP tokens locked; lock link published
- [ ] Treasury is a multisig, not a single key
- [ ] Old v1 banner kept and clearly marked as historical
- [ ] No secret has ever appeared in `git log` (see §10)

---

## 10. Secret hygiene

```bash
# Confirm .env was never committed:
git log --all --full-history -- .env
# Scan the whole history for key-shaped strings:
git grep -I -n -E '0x[0-9a-fA-F]{64}' $(git rev-list --all) -- ':!*.json' | head
```

If either finds anything, rotate the key immediately, then scrub the history
with `git filter-repo` (see the repo's git-hygiene notes). Rotating is the real
fix; scrubbing only removes the copy.
