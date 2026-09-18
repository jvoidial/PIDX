// phb-pools.js — direct on-chain pool reserves. Fills the gap when no
// aggregator has indexed the token. Depends on window.PHB.
(function () {
  'use strict';
  const cfg = PHB.config;
  const TOKENS = cfg.tokens || {};
  const WETH = '0x4200000000000000000000000000000000000006';
  const FACTORIES = {
    uniswap_v2: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    sushiswap:  '0x71524B4f93c58fcbF659783284E38825f0622859',
    aerodrome:  '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
    baseswap:   '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
  };
  const pad = (a) => a.toLowerCase().replace(/^0x/, '').padStart(64, '0');

  async function readPair(factory, token, quote) {
    const data = '0xe6a43905' + pad(token) + pad(quote);
    const r = await PHB.rpc('eth_call', [{ to: factory, data }, 'latest']);
    if (!r || r === '0x' || r.length < 42) return null;
    const pool = '0x' + r.slice(-40);
    return pool === '0x' + '0'.repeat(40) ? null : pool;
  }

  async function readReserves(pool) {
    const r = await PHB.rpc('eth_call', [{ to: pool, data: '0x0902f1ac' }, 'latest']);
    if (!r || r.length < 194) return null;
    const b = r.slice(2);
    return {
      r0: BigInt('0x' + b.slice(0, 64)),
      r1: BigInt('0x' + b.slice(64, 128)),
    };
  }

  for (const [sym, meta] of Object.entries(TOKENS)) {
    PHB.register('pool.' + sym, {
      ttl: 30000,
      fetch: async () => {
        const token = meta.address;
        for (const [fname, factory] of Object.entries(FACTORIES)) {
          let pool;
          try {
            pool = await readPair(factory, token, WETH);
          } catch (_) { continue; }
          if (!pool) continue;

          let res;
          try { res = await readReserves(pool); } catch (_) { continue; }
          if (!res) continue;

          // Determine which reserve is WETH based on sort order
          const wethFirst = WETH.toLowerCase() < token.toLowerCase();
          const wethRaw = wethFirst ? res.r0 : res.r1;
          const tokRaw  = wethFirst ? res.r1 : res.r0;

          const wethFloat  = Number(wethRaw) / 1e18;
          const tokenFloat = Number(tokRaw) / 1e18;

          // ETH price from sibling source (may be pending; fall back to 0)
          const ethPrice = PHB.get('eth_price').value || 0;
          const tvlUsd   = 2 * wethFloat * ethPrice;
          const priceUsd = tokenFloat > 0
            ? (wethFloat * ethPrice) / tokenFloat
            : null;

          return {
            factory: fname,
            pool,
            weth_reserve:  wethFloat,
            token_reserve: tokenFloat,
            tvl_usd:       tvlUsd,
            price_usd:     priceUsd,
            status:        (wethFloat === 0 && tokenFloat === 0) ? 'empty'
                          : (tvlUsd < 1 ? 'empty' : 'ok'),
          };
        }
        return { status: 'no_pool', pool: null, tvl_usd: 0, price_usd: null };
      },
    });
  }
})();
