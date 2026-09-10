# DFTP Compliance Statement

**Project:** PHB Dashboard (spirit-guide-token)
**Maintainer:** VOIDBOT0
**Framework:** Digital Asset Market Clarity Act (H.R. 3633 / CLARITY Act)
**Status:** Pre-legislative self-declaration

---

## 1. Purpose

This document establishes the structural compliance posture of the PHB project against the **Decentralized Finance Technology Protocol (DFTP)** framework as defined in the Digital Asset Market Clarity Act (CLARITY Act).

It is a factual record of the project's architecture, published in advance of any legislative requirement, to demonstrate good-faith intent and structural readiness.

This is not a filing. It is not a certification. It makes no claim of legal status under any jurisdiction.

---

## 2. Structure of the Project

The PHB project has three distinct layers:

| Layer | Description | Control |
|-------|-------------|---------|
| **Smart contracts** | Four ERC-20 tokens on Base, deployed at fixed addresses | No admin functions |
| **Liquidity pools** | Uniswap V2 pools on Base | Permissionless, immutable |
| **Interface** | Static read-only dashboard on GitHub Pages | Frontend only, no custody |

---

## 3. DFTP Test — The Two Prongs

Under the CLARITY Act, a protocol qualifies as a DFTP only if it satisfies **both** of the following:

### Prong 1 — Automated Execution

> *"Transactions execute in accordance with an automated rule or algorithm that is predetermined and non-discretionary."*

**Status:** ✅ Satisfied

- Uniswap V2 pools execute swaps via the constant product formula `x × y = k`
- The pricing rule is deterministic and requires no human input
- No party can alter the execution logic once a pool is deployed

### Prong 2 — Non-Custodial Operation

> *"The protocol operates without reliance on any other person to maintain control of the digital assets of the user."*

**Status:** ✅ Satisfied

- Users interact with Uniswap V2 contracts directly from their own wallets
- No third party holds user funds at any point
- The dashboard does not request, hold, or transmit private keys
- No wallet connection is required to use the read-only interface

---

## 4. DFTP Test — The Three Exclusions

A protocol is **disqualified** from DFTP status if it fails any of the following. All three must be avoided.

### Exclusion A — No Unilateral Control

> *"No person or group has the authority to control or materially alter the protocol's functionality."*

**Status:** ✅ Avoided

- The deployed token contracts have no admin functions
- The Uniswap V2 pool contracts are immutable
- No pause, no upgrade, no proxy, no ownership transfer
- The maintainer has no technical ability to alter on-chain behavior

### Exclusion B — No Discretionary Operation

> *"The protocol operates on rules that are pre-established, transparent, and encoded directly in source code."*

**Status:** ✅ Avoided

- All logic is public on Basescan and Sourcify
- No off-chain decision-making influences execution
- No privileged roles exist in any contract
- Interfaces display public data only

### Exclusion C — No Restriction Capability

> *"No group under common control can unilaterally restrict the protocol's use."*

**Status:** ✅ Avoided

- No address can be blocked, frozen, or excluded
- No transaction can be prevented
- No sanctions list, no KYC gate, no allowlist
- Any wallet on Base can interact with the pools

---

## 5. Remaining Consideration — Supply Concentration

The CLARITY Act's "mature blockchain" test includes a threshold requiring that **no person or group under common control holds 20% or more of the token supply or voting power**.

**Current status:** ⚠️ Not yet satisfied

- The deployer wallet currently holds approximately 100% of each token supply
- Distribution has not yet occurred
- This is a distribution issue, not a control issue

**Intent:**

- Progressive public distribution over time
- Methods under consideration: airdrops, community pools, open auctions
- No timeline binding; the bill has not passed
- Documented here for transparency and good faith

**Important:** This is a future objective, not a current compliance claim. The 20% threshold applies to the bill's "mature blockchain" pathway, which requires an affirmative filing with the SEC after passage. Until such a filing is made, no status is claimed.

---

## 6. Interface Classification

The dashboard at `jvoidial.github.io/spirit-guide-token` is:

- **Read-only:** displays public API data
- **Non-custodial:** no wallet required to view
- **Non-transactional:** no order routing, no execution
- **Non-advisory:** no recommendations, no price targets
- **Non-soliciting:** no offers to buy or sell

It falls under the SEC's April 2026 guidance exempting read-only data interfaces from broker-dealer registration.

---

## 7. Developer Safe Harbor

Under BRCA-style provisions referenced in the CLARITY Act:

> *Developers who publish or maintain non-custodial software — and who do not control user funds — cannot be classified as money transmitters under the Bank Secrecy Act.*

**Status:** ✅ Satisfied

- All code is published open-source
- No user funds are ever custodied
- No custody relationship exists with any user
- No transmission of value on behalf of others occurs

---

## 8. Summary Table

| Test | Status |
|------|--------|
| Automated execution (Prong 1) | ✅ Satisfied |
| Non-custodial operation (Prong 2) | ✅ Satisfied |
| No unilateral control (Exclusion A) | ✅ Avoided |
| No discretionary operation (Exclusion B) | ✅ Avoided |
| No restriction capability (Exclusion C) | ✅ Avoided |
| Read-only interface | ✅ Confirmed |
| Developer safe harbor | ✅ Satisfied |
| Under 20% supply concentration | ⚠️ Future objective |

---

## 9. What This Document Does Not Claim

This document does **not**:

- Certify DFTP status under any law
- Constitute a filing with the SEC, CFTC, or any other agency
- Create legal status, safe harbour, or exemption
- Apply to any jurisdiction outside the United States
- Override any applicable law, including UK law, FCA rules, or HMRC obligations

No filing has been made. No status has been granted. This is a self-declaration of structure only.

---

## 10. UK Considerations (For the Maintainer)

As the maintainer is a UK citizen, the following applies independently of this document:

- FCA cryptoasset regime enters full effect **25 October 2027**
- CARF reporting is active since **1 January 2026**
- Self-custody is protected under UK Parliament's February 2026 position
- Personal tax obligations remain unaffected by this document
- DWP capital rules for Universal Credit remain unaffected

This document does not alter any UK legal obligation.

---

**Timestamp:** 2026-09-10 21:34:57 BST
**Maintainer:** VOIDBOT0
**Public repository:** github.com/jvoidial/spirit-guide-token

*Nothing in this document constitutes legal advice.*
