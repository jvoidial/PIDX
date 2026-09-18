// phb-pools.js — direct Uniswap V2 pool reads. No dependencies on PHB internals.
(function () {
  'use strict';

  const RPCS = [
    'https://base-rpc.publicnode.com',
    'https://base.gateway.tenderly.co',
    'https://base.meowrpc.com',
    'https://base.drpc.org',
    'https://mainnet.base.org',
  ];
  const WETH = '0x4200000000000000000000000000000000000006';
  const FACTORIES = {
    uniswap_v2: '0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6',
    sushi_v2:   '0x71524B4f93c58fcbF659783284E38825f0622859',
    aerodrome:  '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
    baseswap:   '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
  };
  const pad = a => a.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  let activeRpc = null;

  async function rpc(method, params) {
    const eps = activeRpc ? [activeRpc, ...RPCS.filter(r => r !== activeRpc)] : RPCS;
    for (const url of eps) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        if (!res.ok) continue;
        const j = await res.json();
        if (j.error) continue;
        activeRpc = url;
        return j.result;
      } catch (_) { /* try next */ }
    }
    throw new Error('all RPCs failed');
  }

  async function getPair(factory, token, quote) {
    const data = '0xe6a43905' + pad(token) + pad(quote);
    const r = await rpc('eth_call', [{ to: factory, data }, 'latest']);
    if (!r || r === '0x' || r.length < 42) return null;
    const pool = '0x' + r.slice(-40);
    return pool === '0x' + '0'.repeat(40) ? null : pool;
  }

  async function getReserves(pool) {
    const r = await rpc('eth_call', [{ to: pool, data: '0x0902f1ac' }, 'latest']);
    if (!r || r.length < 194) return null;
    const b = r.slice(2);
    return { r0: BigInt('0x' + b.slice(0, 64)), r1: BigInt('0x' + b.slice(64, 128)) };
  }

  async function findPool(sym, token) {
    for (const [factory, addr] of Object.entries(FACTORIES)) {
      try {
        const pool = await getPair(addr, token, WETH);
        if (!pool) continue;
        const res = await getReserves(pool);
        if (!res) continue;
        const wethFirst = WETH.toLowerCase() < token.toLowerCase();
        const wethRaw = wethFirst ? res.r0 : res.r1;
        const tokRaw  = wethFirst ? res.r1 : res.r0;
        const wethFloat  = Number(wethRaw) / 1e18;
        const tokenFloat = Number(tokRaw) / 1e18;
        const ethPrice = (window.PHB?.get('eth_price')?.value) || 2500;
        const tvlUsd = 2 * wethFloat * ethPrice;
        const priceUsd = tokenFloat > 0 ? (wethFloat * ethPrice) / tokenFloat : null;
        return {
          factory, pool,
          weth_reserve: wethFloat,
          token_reserve: tokenFloat,
          tvl_usd: tvlUsd,
          price_usd: priceUsd,
          status: tvlUsd < 1 ? 'empty' : tvlUsd < 500 ? 'tiny' : 'ok',
        };
      } catch (_) { /* next factory */ }
    }
    return { status: 'no_pool', pool: null, tvl_usd: 0, price_usd: null };
  }

  // Register a source per token that any renderer can read
  function register() {
    if (typeof PHB === 'undefined' || !PHB.register) {
      setTimeout(register, 200);
      return;
    }
    const tokens = (PHB.config && PHB.config.tokens) || {};
    for (const [sym, meta] of Object.entries(tokens)) {
      PHB.register('pool.' + sym, {
        ttl: 30000,
        fetch: () => findPool(sym, meta.address),
      });
    }
    console.log('[pools] registered', Object.keys(tokens).length, 'pool sources');
  }

  register();
  window.PHBFindPool = findPool;   // expose for direct calls
})();
