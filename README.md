# Spirit Guide Token

Static dashboard for the PIDX / SGUIDE / VDOO / PENNIES ecosystem on Base.

`index.html` is the whole app: vanilla JS, no build step, no backend. It fetches
`agi_phb_divine_complete.json` and renders everything client side, refreshing every 60s.
Third-party libraries (ethers.js, Chart.js, Three.js) are loaded from a CDN.

## Live data sources

| Data | Source | Fallback |
| --- | --- | --- |
| Token prices / 24h change | CoinGecko public API (`simple/token_price/base`, by contract address) | `real_time_data.prices` in the JSON |
| Base gas price | public Base RPC `eth_gasPrice` (`https://mainnet.base.org`) | `real_time_data.gas_price` |
| Wallet balances | injected wallet (MetaMask / Coinbase) + public Base RPC, minimal ERC-20 ABI | not shown until connected |
| Holders, volume, mining, governance, leaderboards | `agi_phb_divine_complete.json` | — |

Holders and whale flow would need a BaseScan API key. GitHub Pages serves all client code
publicly, so no key is embedded and those values are read from the JSON.

Staking and governance transactions are gated behind `STAKING_CONTRACT` /
`GOVERNANCE_CONTRACT` in `RT_CONFIG` (both `null`). The UI is wired up and shows a
"contract not configured" message until real addresses are set.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Deploy

GitHub Pages serves this repository directly — pushing to the Pages branch (`main`)
deploys automatically, no build or bundler step. The PWA files (`manifest.json`, `sw.js`)
use relative paths so they work under the `/spirit-guide-token/` Pages path.
