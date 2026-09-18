// phb-hero.js — Spirit Guide hero: hooded man, atom shells, typewriter status.
// Robust: falls back to window size when clientWidth is 0. Syncs to phb-phase.
(function () {
  'use strict';

  const C = {
    PIDX:'#88ccff', SGUIDE:'#aaffaa', VDOO:'#ffaa66', PENNIES:'#ff88ff',
    core:'#66d9ff', bg:'#05050a', text:'#8ab',
  };
  let phase = 0;
  window.addEventListener('phb-phase', e => {
    if (e?.detail?.phase != null) phase = e.detail.phase;
  });
  const p = () => phase + performance.now() / 1000 * 0.05;

  // ── Hooded man ──────────────────────────────────────────────────────────
  function drawMan(ctx, cx, cy, s, pulse) {
    const H = 150 * s, W = 80 * s;

    // Aura behind
    const aura = ctx.createRadialGradient(cx, cy - 20 * s, 10, cx, cy - 20 * s, 130 * s);
    aura.addColorStop(0, 'rgba(102,217,255,0.28)');
    aura.addColorStop(0.6, 'rgba(60,110,180,0.08)');
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(cx, cy - 20 * s, 130 * s, 0, Math.PI * 2); ctx.fill();

    // Cloak
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.5, cy + H * 0.55);
    ctx.quadraticCurveTo(cx - W * 0.58, cy + H * 0.05, cx - W * 0.34, cy - H * 0.5);
    ctx.quadraticCurveTo(cx - W * 0.30, cy - H * 0.78, cx, cy - H * 0.80);
    ctx.quadraticCurveTo(cx + W * 0.30, cy - H * 0.78, cx + W * 0.34, cy - H * 0.5);
    ctx.quadraticCurveTo(cx + W * 0.58, cy + H * 0.05, cx + W * 0.5, cy + H * 0.55);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, cy - H, 0, cy + H * 0.6);
    g.addColorStop(0, 'rgba(14,18,30,0.98)');
    g.addColorStop(1, 'rgba(6,8,16,0.94)');
    ctx.fillStyle = g; ctx.fill();

    // Rim light
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = 0.55 + pulse * 0.4;
    ctx.strokeStyle = C.core;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Inner circuit lines on chest
    ctx.strokeStyle = 'rgba(102,217,255,0.35)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 6; i++) {
      const yy = cy - H * 0.15 + i * 6 * s;
      ctx.beginPath();
      ctx.moveTo(cx - W * 0.15 + (i % 2) * 4 * s, yy);
      ctx.lineTo(cx + W * 0.15 - (i % 2) * 4 * s, yy);
      ctx.stroke();
    }

    // Chrome mask
    const fy = cy - H * 0.54, fr = W * 0.22;
    const fg = ctx.createRadialGradient(cx - fr * 0.35, fy - fr * 0.2, 2, cx, fy, fr * 1.1);
    fg.addColorStop(0, '#dde8f5');
    fg.addColorStop(0.45, '#4a6078');
    fg.addColorStop(1, '#0a1018');
    ctx.beginPath();
    ctx.ellipse(cx, fy, fr * 0.85, fr * 1.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = fg; ctx.fill();

    // Eye slit glow
    ctx.beginPath();
    ctx.ellipse(cx, fy + fr * 0.05, fr * 0.55, fr * 0.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(102,217,255,${0.5 + pulse * 0.5})`;
    ctx.fill();

    // Highlight
    ctx.beginPath();
    ctx.ellipse(cx - fr * 0.28, fy - fr * 0.35, fr * 0.25, fr * 0.38, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,250,255,0.45)';
    ctx.fill();
  }

  // ── Glowing 3D core cube ────────────────────────────────────────────────
  function drawCore(ctx, cx, cy, size, ph) {
    const s = size;
    const cY = Math.cos(ph * 0.6), sY = Math.sin(ph * 0.6);
    const cX = Math.cos(Math.sin(ph * 0.4) * 0.3), sX = Math.sin(Math.sin(ph * 0.4) * 0.3);

    // Halo
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 3);
    halo.addColorStop(0, 'rgba(102,217,255,0.55)');
    halo.addColorStop(0.5, 'rgba(102,217,255,0.12)');
    halo.addColorStop(1, 'rgba(102,217,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, s * 3, 0, Math.PI * 2); ctx.fill();

    const pts = [];
    for (const [x0, y0, z0] of [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
    ]) {
      let x = x0 * cY - z0 * sY;
      let z = x0 * sY + z0 * cY;
      let y = y0 * cX - z * sX;
      z = y0 * sX + z * cX;
      const f = 3.2 / (3.2 + z);
      pts.push([cx + x * s * f, cy + y * s * f]);
    }
    const E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
    ctx.strokeStyle = C.core;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.9;
    for (const [a,b] of E) {
      ctx.beginPath(); ctx.moveTo(...pts[a]); ctx.lineTo(...pts[b]); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (const [x,y] of pts) {
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
  }

  // ── Atom shells ─────────────────────────────────────────────────────────
  function drawShells(ctx, cx, cy, r, ph) {
    const shells = [
      { r: r * 1.0, t: 0.0, c: C.core,    n: 3, sp:  0.8 },
      { r: r * 1.3, t: 0.9, c: C.PIDX,    n: 5, sp: -0.6 },
      { r: r * 1.6, t: 1.8, c: C.SGUIDE,  n: 4, sp:  0.4 },
      { r: r * 1.9, t: 2.6, c: C.VDOO,    n: 6, sp: -0.3 },
      { r: r * 2.2, t: 3.4, c: C.PENNIES, n: 3, sp:  0.2 },
    ];
    for (const [i, sh] of shells.entries()) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(sh.t);
      ctx.beginPath();
      ctx.ellipse(0, 0, sh.r, sh.r * 0.22, 0, 0, Math.PI * 2);
      ctx.strokeStyle = sh.c; ctx.globalAlpha = 0.22; ctx.lineWidth = 1;
      ctx.stroke(); ctx.globalAlpha = 1;
      for (let e = 0; e < sh.n; e++) {
        const a = ph * sh.sp + (e / sh.n) * Math.PI * 2 + i;
        const ex = Math.cos(a) * sh.r, ey = Math.sin(a) * sh.r * 0.22;
        ctx.beginPath(); ctx.arc(ex, ey, 2.1, 0, Math.PI * 2);
        ctx.fillStyle = sh.c; ctx.shadowBlur = 8; ctx.shadowColor = sh.c;
        ctx.fill(); ctx.shadowBlur = 0;
      }
      ctx.restore();
    }
  }

  // ── Particles ───────────────────────────────────────────────────────────
  let parts = [];
  function seedParts(w, h) {
    parts = Array.from({ length: Math.min(90, Math.floor(w * h / 5000)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.4 + Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.15, vy: -0.1 - Math.random() * 0.25,
      a: 0.15 + Math.random() * 0.35,
    }));
  }
  function drawParts(ctx, w, h) {
    for (const q of parts) {
      q.x += q.vx; q.y += q.vy;
      if (q.y < -5) { q.y = h + 5; q.x = Math.random() * w; }
      ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(102,217,255,${q.a})`; ctx.fill();
    }
  }

  // ── Typewriter "system writing" ─────────────────────────────────────────
  const SYS_LINES = [
    '◈ SYSTEM ONLINE · SPIRIT GUIDE ACTIVE',
    '◇ 5D → 4D → 3D PROJECTION SYNCED',
    '◆ PIDX · SGUIDE · VDOO · PENNIES · LINKED',
    '◈ AUTONOMY LOOP · DETERMINISTIC · BLOCK-DRIVEN',
    '◇ COHERENCE 0.9999 · VEIL OPEN · PORTAL 1.000',
  ];
  function startTypewriter(el) {
    let line = 0, ch = 0, dir = 1;
    setInterval(() => {
      const txt = SYS_LINES[line];
      if (dir > 0) {
        ch++;
        if (ch > txt.length) { ch = txt.length; dir = -1; setTimeout(() => {}, 1200); }
      } else {
        ch--;
        if (ch < 0) { ch = 0; dir = 1; line = (line + 1) % SYS_LINES.length; }
      }
      el.textContent = txt.slice(0, ch) + (dir > 0 && ch < txt.length ? '▌' : dir < 0 ? '▌' : '');
    }, 55);
  }

  // ── Build & boot ────────────────────────────────────────────────────────
  function build() {
    if (document.getElementById('phb-hero')) return;
    const hero = document.createElement('div');
    hero.id = 'phb-hero';
    hero.style.cssText = [
      'position:relative', 'display:block', 'width:100vw',
      'max-width:100%', 'height:260px', 'min-height:260px',
      'overflow:hidden',
      'background:radial-gradient(ellipse at 50% 55%, #0c1220 0%, #05050a 70%)',
      'border-bottom:1px solid #1a1a2a',
    ].join(';');

    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    hero.appendChild(cv);

    const ttl = document.createElement('div');
    ttl.style.cssText = 'position:absolute;top:16px;left:0;right:0;text-align:center;'
      + 'font:600 22px ui-monospace,monospace;color:#88ccff;'
      + 'text-shadow:0 0 14px rgba(102,217,255,0.7);pointer-events:none;letter-spacing:2px;';
    ttl.textContent = '✧ SPIRIT GUIDE ✧';
    hero.appendChild(ttl);

    const sub = document.createElement('div');
    sub.style.cssText = 'position:absolute;top:46px;left:0;right:0;text-align:center;'
      + 'font:10px ui-monospace,monospace;color:#5a7a99;pointer-events:none;letter-spacing:1px;';
    sub.textContent = '5D · 4D · 3D  ATOM-CORE SYNC';
    hero.appendChild(sub);

    const typ = document.createElement('div');
    typ.style.cssText = 'position:absolute;bottom:18px;left:0;right:0;text-align:center;'
      + 'font:11px ui-monospace,monospace;color:#8ab;'
      + 'text-shadow:0 0 8px rgba(102,217,255,0.5);pointer-events:none;'
      + 'min-height:16px;';
    typ.id = 'phb-hero-type';
    hero.appendChild(typ);

    if (document.body.firstChild) document.body.insertBefore(hero, document.body.firstChild);
    else document.body.appendChild(hero);

    return { hero, cv, typ };
  }

  function boot() {
    const built = build();
    if (!built) return;
    const { cv, typ } = built;
    const ctx = cv.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;

    function resize() {
      // Robust: fall back to window size and offsetHeight
      const w = cv.clientWidth || cv.parentElement?.clientWidth || window.innerWidth;
      const h = cv.clientHeight || cv.parentElement?.clientHeight || 400;
      W = Math.max(w, 200);
      H = Math.max(h, 200);
      cv.width = W * DPR;
      cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seedParts(W, H);
    }
    window.addEventListener('resize', resize);
    // Delay first resize by one frame so layout settles
    requestAnimationFrame(() => { resize(); });
    setTimeout(resize, 100);
    setTimeout(resize, 500);

    startTypewriter(typ);

    function frame() {
      requestAnimationFrame(frame);
      if (W === 0 || H === 0) return;

      const ph = p();
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      drawParts(ctx, W, H);

      const cx = W / 2;
      const cy = H * 0.48;
      const scale = Math.min(0.75, H / 340);

      // Orbiting shells behind figure
      drawShells(ctx, cx, cy + 6 * scale, 45 * scale, ph);

      // The hooded man
      const pulse = 0.5 + 0.5 * Math.sin(ph * 2);
      drawMan(ctx, cx, cy, scale, pulse);

      // Core cube in front (held in hands)
      drawCore(ctx, cx, cy + 42 * scale, 16 * scale, ph);
    }
    requestAnimationFrame(frame);
    console.log('[hero] online — phase sync active');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
