// phb-sim.js — toy spin-1 correlation simulation for the four tokens.
// NOT a measurement. Every value carries status=DEMO with source='simulation'.
// The Monte-Carlo math is real; the "tokens as spin-1 particles" framing is not.
(function () {
  'use strict';

  const PAIRS = [
    ['PIDX',    'SGUIDE'],
    ['PIDX',    'VDOO'],
    ['PIDX',    'PENNIES'],
    ['SGUIDE',  'VDOO'],
    ['SGUIDE',  'PENNIES'],
    ['VDOO',    'PENNIES'],
  ];

  // Seeded PRNG so the dashboard is deterministic across reloads.
  function mulberry32(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Sample x with p(x) ∝ 1 + x² on [-1, 1] via rejection.
  function sampleCosTheta(n, rng) {
    const out = new Float64Array(n);
    let filled = 0;
    while (filled < n) {
      const need = n - filled;
      for (let i = 0; i < need; i++) {
        let x, y;
        do {
          x = rng() * 2 - 1;
          y = rng() * 2;
        } while (y > 1 + x * x);
        out[filled++] = x;
        if (filled >= n) break;
      }
    }
    return out;
  }

  // Build a 50-bin histogram (density) of the sample.
  function histogram(sample, nbins = 50) {
    const edges = new Float64Array(nbins + 1);
    for (let i = 0; i <= nbins; i++) edges[i] = -1 + (2 * i) / nbins;
    const counts = new Float64Array(nbins);
    for (let i = 0; i < sample.length; i++) {
      let idx = Math.floor((sample[i] + 1) / 2 * nbins);
      if (idx === nbins) idx = nbins - 1;
      if (idx >= 0 && idx < nbins) counts[idx]++;
    }
    const n = sample.length;
    const density = new Float64Array(nbins);
    const binW = 2 / nbins;
    for (let i = 0; i < nbins; i++) density[i] = counts[i] / (n * binW);
    return { edges, counts, density };
  }

  // Mean of cos²(θ) — for the 1+cos²θ distribution this is 3/5.
  function meanCosSq(sample) {
    let s = 0;
    for (let i = 0; i < sample.length; i++) s += sample[i] * sample[i];
    return s / sample.length;
  }

  // Pearson correlation of the two "decay axes" — equal to <cos θ> for
  // independent samples of the same distribution, ~0 here.
  function pearson(a, b) {
    const n = Math.min(a.length, b.length);
    let sa = 0, sb = 0;
    for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
    const ma = sa / n, mb = sb / n;
    let num = 0, da = 0, db = 0;
    for (let i = 0; i < n; i++) {
      const xa = a[i] - ma, xb = b[i] - mb;
      num += xa * xb; da += xa * xa; db += xb * xb;
    }
    return num / Math.sqrt(da * db || 1);
  }

  const N_EVENTS = 20000;

  PAIRS.forEach(([a, b], i) => {
    const key = `sim.${a}_${b}`;
    PHB.register(key, {
      kind: 'demo',
      ttl: 3600_000,   // simulation results don't need refresh
      fetch: () => {
        const rng = mulberry32(0xC0FFEE + i);
        const sampleA = sampleCosTheta(N_EVENTS, rng);
        const sampleB = sampleCosTheta(N_EVENTS, rng);
        const hist = histogram(sampleA, 50);
        const meanCosSq = meanCosSq(sampleA);
        const corr = pearson(sampleA, sampleB);
        // χ² against the analytic 1+cos²θ density.
        let chi2 = 0;
        const binW = 2 / 50;
        for (let k = 0; k < 50; k++) {
          const c = 0.5 * (hist.edges[k] + hist.edges[k + 1]);
          const expected = 0.75 * (1 + c * c) * binW * N_EVENTS;
          const observed = hist.counts[k];
          if (expected > 0) chi2 += ((observed - expected) ** 2) / expected;
        }
        return {
          status: 'simulation',
          label: `Spin-1 toy correlation: ${a} ↔ ${b}`,
          n_events: N_EVENTS,
          mean_cos_sq: meanCosSq,      // expected 0.6
          pearson_axes: corr,          // ~0 for independent samplings
          chi2_dof: 49,
          chi2: chi2,
          distribution: {
            edges: Array.from(hist.edges),
            density: Array.from(hist.density),
          },
        };
      },
    });
  });

  // Aggregate health for the simulation panel.
  PHB.register('sim.summary', {
    kind: 'demo',
    ttl: 3600_000,
    fetch: () => {
      const pairs = PAIRS.map(([a, b]) => {
        const v = PHB.get(`sim.${a}_${b}`).value;
        return v ? { pair: `${a}↔${b}`, mean: v.mean_cos_sq, chi2: v.chi2 } : null;
      }).filter(Boolean);
      if (!pairs.length) return null;
      const meanAll = pairs.reduce((s, p) => s + p.mean, 0) / pairs.length;
      return {
        status: 'simulation',
        n_pairs: pairs.length,
        n_events_total: pairs.length * N_EVENTS,
        mean_cos_sq: meanAll,
        expected_mean_cos_sq: 0.6,
        pairs: pairs,
      };
    },
  });
})();
