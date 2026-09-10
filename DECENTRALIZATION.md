# PHB Decentralization Statement

**Date:** 2026-09-10
**Maintainer:** Single solo builder
**Chain:** Base (Coinbase L2)
**Project:** PHB ecosystem — 4 tokens + dashboard

---

## What I Control

- The dashboard frontend at `jvoidial.github.io/spirit-guide-token`
  (display only — reads public APIs, no user input, no custody)
- My own self-custody wallet: `0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C`
- Read-only bot scripts that fetch public data and write public JSON
- Documentation and repository content

## What I Do NOT Control

- **Base network** — no admin, no pause, no upgrade key, no validator role
- **Uniswap V2 pools** — permissionless immutable contracts
- **Token contracts** — no mint, no owner, no pause, no blacklist, no tax
- **User wallets** — never custodied, never accessed, never requested keys from
- **Third-party indexers** — GeckoTerminal, DexScreener, CoinGecko operate independently

## Token Contracts

| Token    | Contract                                     | Functions present      |
|----------|----------------------------------------------|------------------------|
| PIDX     | 0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c  | transfer, approve only |
| SGUIDE   | 0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a  | transfer, approve only |
| VDOO     | 0x38e4f08D08b4D772A7B75669C356b4749dd2d30b  | transfer, approve only |
| PENNIES  | 0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7  | transfer, approve only |

No admin functions. No upgradeability. No privileged roles.
All verified on Sourcify and Basescan.

## What I Do NOT Offer

- No trading service
- No custody of user funds
- No yield product
- No investment contract
- No promises of return
- No token sale
- No frontend that routes or holds user funds

## Compliance Posture

- **Securities:** Tokens are digital commodities, not securities. No investment of money in a common enterprise with expectation of profit from the efforts of others.
- **Money transmission:** No custody, no transmission on behalf of others. BRCA-style safe harbor intent — non-controlling developers publishing code.
- **CFTC registration:** Non-custodial, non-controlling, no ability to alter protocol behavior. Not a "non-decentralized finance trading protocol" under Clarity Act definitions.
- **AML/BSA:** No custodial services. No customer relationships. No fiat on/off ramps.
- **Self-custody:** Fully preserved. No frontend mechanism to take custody or make assets appear abandoned.

## Scale

- 4 tokens deployed on Base
- 5 liquidity pools (Uniswap V2)
- Total liquidity: ~$4.35
- External capital raised: $0
- Team size: 1
- Treasury: none
- Treasury wallets: none

## Token Supply Concentration

- Current holdings: ~100% of each token's supply held by deployer
- Intent: progressive public distribution over time
- Distribution methods under consideration: airdrops, community pools, open auctions
- No locked allocations, no vesting contracts, no hidden reserves

## Regulatory Intent

This project is a solo builder effort. Nothing on this dashboard, in this repository, or on-chain constitutes:
- a financial product
- an investment offering
- a solicitation to purchase securities
- advice of any kind

All code and documentation are published openly for informational and educational purposes.

## Good Faith Statement

If any part of this project is ever determined to fall under a regulatory framework, I will cooperate with the appropriate authority. This document exists to establish clear intent and to reduce ambiguity for anyone reviewing the project.

---

*This statement is publicly verifiable. All addresses and links can be checked against on-chain data.*
*Nothing in this document constitutes legal advice.*
