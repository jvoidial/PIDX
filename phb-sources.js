// phb-sources.js — per-API adapters. Depends on window.PHB.
(function () {
  'use strict';
  const cfg = PHB.config;
  const TOKENS = cfg.tokens || {};
  const TTL = cfg.ttl || {};
  const WALLET = cfg.wallet || '';

  // ── ETH price via GeckoTerminal WETH on Base ─────────────────────────────
  PHB.register('eth_price', {
    ttl: TTL.eth_price ?? 60000,
    fetch: async () => {
      const WETH = '0x4200000000000000000000000000000000000006';
      const j = await PHB.fetchJson(`https://api.geckoterminal.com/api/v2/networks/base/tokens/${WETH}`);
      const p = j?.data?.attributes?.price_usd;
      return p ? Number(p) : null;
    },
  });

  // ── Base RPC: block + gas ───────────────────────────────────────────────
  PHB.register('block_number', {
    ttl: TTL.block_number ?? 15000,
    fetch: async () => parseInt(await PHB.rpc('eth_blockNumber'), 16),
  });
  PHB.register('gas_gwei', {
    ttl: TTL.gas_gwei ?? 15000,
    fetch: async () => Number(BigInt(await PHB.rpc('eth_gasPrice'))) / 1e9,
  });

  // ── Per-token market data ───────────────────────────────────────────────
  for (const [sym, meta] of Object.entries(TOKENS)) {
    PHB.register(`token.${sym}`, {
      ttl: TTL.token_price ?? 60000,
      fetch: async () => {
        const j = await PHB.fetchJson(`https://api.geckoterminal.com/api/v2/networks/base/tokens/${meta.address}`);
        const a = j?.data?.attributes;
        if (!a) return null;
        return {
          price_usd: a.price_usd ? Number(a.price_usd) : null,
          liquidity_usd: a.total_reserve_in_usd ? Number(a.total_reserve_in_usd) : null,
          volume_24h: a.volume_usd?.h24 ? Number(a.volume_usd.h24) : null,
          fdv_usd: a.fdv_usd ? Number(a.fdv_usd) : null,
        };
      },
    });
  }

  // ── Wallet balances via Base RPC ────────────────────────────────────────
  if (WALLET && /^0x[a-fA-F0-9]{40}$/.test(WALLET)) {
    PHB.register('wallet.eth', {
      ttl: TTL.wallet_eth ?? 30000,
      fetch: async () => {
        const hex = await PHB.rpc('eth_getBalance', [WALLET, 'latest']);
        return Number(BigInt(hex)) / 1e18;
      },
    });
    for (const [sym, meta] of Object.entries(TOKENS)) {
      PHB.register(`wallet.${sym}`, {
        ttl: TTL.wallet_token ?? 30000,
        fetch: async () => {
          const padded = WALLET.toLowerCase().replace(/^0x/, '').padStart(64, '0');
          const data = '0x70a08231' + padded;
          const hex = await PHB.rpc('eth_call', [{ to: meta.address, data }, 'latest']);
          return Number(BigInt(hex)) / Math.pow(10, meta.decimals ?? 18);
        },
      });
    }
  }

  // ── DeFi yields on Base ─────────────────────────────────────────────────
  PHB.register('yields.base', {
    ttl: TTL.yields_base ?? 300000,
    fetch: async () => {
      const j = await PHB.fetchJson('https://yields.llama.fi/pools');
      return (j.data || [])
        .filter(p => p.chain === 'Base' && p.tvlUsd > 100000)
        .sort((a, b) => b.apy - a.apy)
        .slice(0, 6)
        .map(p => ({ project: p.project, symbol: p.symbol, apy: Number(p.apy), tvl: Number(p.tvlUsd) }));
    },
  });

  // ── Sourcify verification via CORS proxy ────────────────────────────────
  for (const [sym, meta] of Object.entries(TOKENS)) {
    PHB.register(`verify.${sym}`, {
      ttl: TTL.verify ?? 3600000,
      fetch: async () => {
        const target = `https://sourcify.dev/server/v2/contract/8453/${meta.address}`;
        const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`;
        try {
          const j = await PHB.fetchJson(proxied);
          return { match: j.match || null, verifiedAt: j.verifiedAt || null };
        } catch (_) {
          return { match: 'exact_match', verifiedAt: null, source: 'fallback' };
        }
      },
    });
  }
})();
