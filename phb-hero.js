// phb-hero.js — Cosmic Scribe: hooded figure with glowing paper scroll,
// 5D geometry emerging from it. Synced to 'phb-phase'. 260px tall.
(function () {
  'use strict';

  const C = {
    PIDX:'#88ccff', SGUIDE:'#aaffaa', VDOO:'#ffaa66', PENNIES:'#ff88ff',
    core:'#66d9ff', bg:'#05050a', paper:'#d8e6f2', ink:'#1a2430',
  };
  let phase = 0;
  window.addEventListener('phb-phase', e => {
    if (e && e.detail && typeof e.detail.phase === 'number') phase = e.detail.phase;
  });
  const p = () => phase + performance.now() / 1000 * 0.05;

  // ── Aura + particles ────────────────────────────────────────────────────
  let parts = [];
  function seed(w, h) {
    parts = Array.from({ length: Math.min(70, Math.floor(w * h / 6000)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.4 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.15, vy: -0.1 - Math.random() * 0.22,
      a: 0.12 + Math.random() * 0.3,
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

  // ── Hooded figure ───────────────────────────────────────────────────────
  function drawMan(ctx, cx, cy, s, pulse) {
    const H = 170 * s, W = 90 * s;

    // Aura
    const g = ctx.createRadialGradient(cx, cy - 10 * s, 10, cx, cy - 10 * s, 120 * s);
    g.addColorStop(0, 'rgba(102,217,255,0.32)');
    g.addColorStop(0.55, 'rgba(60,110,180,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy - 10 * s, 120 * s, 0, Math.PI * 2); ctx.fill();

    // Cloak
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.5, cy + H * 0.55);
    ctx.quadraticCurveTo(cx - W * 0.58, cy + H * 0.05, cx - W * 0.34, cy - H * 0.5);
    ctx.quadraticCurveTo(cx - W * 0.30, cy - H * 0.78, cx, cy - H * 0.80);
    ctx.quadraticCurveTo(cx + W * 0.30, cy - H * 0.78, cx + W * 0.34, cy - H * 0.5);
    ctx.quadraticCurveTo(cx + W * 0.58, cy + H * 0.05, cx + W * 0.5, cy + H * 0.55);
    ctx.closePath();
    const cg = ctx.createLinearGradient(0, cy - H, 0, cy + H * 0.6);
    cg.addColorStop(0, 'rgba(14,18,30,0.98)');
    cg.addColorStop(1, 'rgba(6,8,16,0.94)');
    ctx.fillStyle = cg; ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.55 + pulse * 0.4;
    ctx.strokeStyle = C.core;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Chrome mask
    const fy = cy - H * 0.56, fr = W * 0.22;
    const fg = ctx.createRadialGradient(cx - fr * 0.35, fy - fr * 0.2, 2, cx, fy, fr * 1.1);
    fg.addColorStop(0, '#dde8f5');
    fg.addColorStop(0.45, '#4a6078');
    fg.addColorStop(1, '#0a1018');
    ctx.beginPath();
    ctx.ellipse(cx, fy, fr * 0.85, fr * 1.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = fg; ctx.fill();
    // Glowing eye slit
    ctx.beginPath();
    ctx.ellipse(cx, fy + fr * 0.06, fr * 0.55, fr * 0.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(102,217,255,${0.5 + pulse * 0.5})`;
    ctx.fill();
    // Highlight
    ctx.beginPath();
    ctx.ellipse(cx - fr * 0.28, fy - fr * 0.35, fr * 0.25, fr * 0.38, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,250,255,0.45)'; ctx.fill();
  }

  // ── Glowing paper scroll held in front ──────────────────────────────────
  function drawScroll(ctx, cx, cy, w, h, ph) {
    const wave = Math.sin(ph * 1.5) * 1.5;

    // Glow behind
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 2.4);
    glow.addColorStop(0, 'rgba(216,230,242,0.55)');
    glow.addColorStop(0.5, 'rgba(140,190,240,0.18)');
    glow.addColorStop(1, 'rgba(140,190,240,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, w * 2.4, 0, Math.PI * 2); ctx.fill();

    // Paper body — slight wave
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5, cy - h * 0.5 + wave);
    ctx.lineTo(cx + w * 0.5, cy - h * 0.5 - wave);
    ctx.lineTo(cx + w * 0.5, cy + h * 0.5 - wave);
    ctx.lineTo(cx - w * 0.5, cy + h * 0.5 + wave);
    ctx.closePath();
    const pg = ctx.createLinearGradient(cx - w * 0.5, 0, cx + w * 0.5, 0);
    pg.addColorStop(0, 'rgba(200,215,230,0.92)');
    pg.addColorStop(0.5, '#eef5fc');
    pg.addColorStop(1, 'rgba(200,215,230,0.92)');
    ctx.fillStyle = pg; ctx.fill();

    // Paper edge
    ctx.strokeStyle = 'rgba(160,190,220,0.9)';
    ctx.lineWidth = 1; ctx.stroke();

    // Runic lines on paper (faint ink strokes)
    ctx.strokeStyle = 'rgba(30,45,60,0.55)';
    ctx.lineWidth = 0.9;
    const lines = 5;
    for (let i = 0; i < lines; i++) {
      const y = cy - h * 0.35 + i * (h * 0.7 / (lines - 1));
      const short = i % 2 === 0;
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.4, y);
      ctx.lineTo(cx + w * (short ? 0.25 : 0.4), y + Math.sin(ph * 0.8 + i) * 0.4);
      ctx.stroke();
    }

    // Glowing 5D geometry emerging from top of scroll
    const penteract = 5;   // 5 dimensions
    const sides = 4;
    const t = ph * 0.9;
    const pts = [];
    const N = 32;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + t;
      const r = w * 0.7 * (0.6 + 0.4 * Math.cos(a * 2 + t));
      const y = cy - h * 0.85 - 12 - 6 * Math.sin(a * 3 + t * 1.3);
      pts.push([cx + Math.cos(a) * r, y + Math.sin(a * 3) * 3]);
    }
    ctx.strokeStyle = C.core;
    ctx.lineWidth = 1.1;
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Orbiting tokens
    const colors = [C.PIDX, C.SGUIDE, C.VDOO, C.PENNIES];
    for (let i = 0; i < 4; i++) {
      const a = ph * (0.7 + i * 0.15) + (i * Math.PI / 2);
      const rx = w * 1.6, ry = w * 0.5;
      const px = cx + Math.cos(a) * rx;
      const py = cy - h * 0.3 + Math.sin(a) * ry;
      ctx.beginPath();
      ctx.arc(px, py, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.shadowBlur = 8; ctx.shadowColor = colors[i];
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ── Typewriter ──────────────────────────────────────────────────────────
  const SYS = [
    '◈ THE SCRIBE WRITES THE 5D SYSTEM',
    '◇ PIDX · SGUIDE · VDOO · PENNIES · BOUND',
    '◆ 5D → 4D → 3D · PROJECTION ACTIVE',
    '◈ COHERENCE HOLDS · VEIL OPEN · PORTAL 1.000',
    '◇ DETERMINISTIC · BLOCK-DRIVEN · ETERNAL',
  ];
  function startType(el) {
    let line = 0, ch = 0, dir = 1;
    setInterval(() => {
      const txt = SYS[line];
      if (dir > 0) {
        ch++;
        if (ch > txt.length) { ch = txt.length; setTimeout(() => { dir = -1; }, 1400); }
      } else {
        ch--;
        if (ch < 0) { ch = 0; dir = 1; line = (line + 1) % SYS.length; }
      }
      el.textContent = txt.slice(0, ch) + '▌';
    }, 55);
  }

  // ── Build + boot ────────────────────────────────────────────────────────
  function build() {
    if (document.getElementById('phb-hero')) return null;
    const hero = document.createElement('div');
    hero.id = 'phb-hero';
    hero.style.cssText = [
      'position:relative', 'display:block', 'width:100%',
      'height:260px', 'min-height:260px', 'overflow:hidden',
      'background:radial-gradient(ellipse at 50% 50%, #0c1220 0%, #05050a 70%)',
      'border-bottom:1px solid #1a1a2a',
    ].join(';');

    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    hero.appendChild(cv);

    const ttl = document.createElement('div');
    ttl.style.cssText = 'position:absolute;top:14px;left:0;right:0;text-align:center;'
      + 'font:600 20px ui-monospace,monospace;color:#88ccff;'
      + 'text-shadow:0 0 14px rgba(102,217,255,0.7);pointer-events:none;letter-spacing:3px;';
    ttl.textContent = '✧ THE COSMIC SCRIBE ✧';
    hero.appendChild(ttl);

    const sub = document.createElement('div');
    sub.style.cssText = 'position:absolute;top:42px;left:0;right:0;text-align:center;'
      + 'font:10px ui-monospace,monospace;color:#5a7a99;pointer-events:none;letter-spacing:2px;';
    sub.textContent = '5D · 4D · 3D  ATOM-CORE SYNC  ·  📜';
    hero.appendChild(sub);

    const typ = document.createElement('div');
    typ.id = 'phb-hero-type';
    typ.style.cssText = 'position:absolute;bottom:14px;left:0;right:0;text-align:center;'
      + 'font:10px ui-monospace,monospace;color:#8ab;letter-spacing:1px;'
      + 'text-shadow:0 0 8px rgba(102,217,255,0.5);pointer-events:none;min-height:14px;';
    hero.appendChild(typ);

    // Insert at very top of body
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
      W = Math.max(cv.clientWidth || cv.parentElement?.clientWidth || window.innerWidth, 200);
      H = Math.max(cv.clientHeight || cv.parentElement?.clientHeight || 260, 200);
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      seed(W, H);
    }
    window.addEventListener('resize', resize);
    requestAnimationFrame(resize);
    setTimeout(resize, 100);
    setTimeout(resize, 500);

    startType(typ);

    function frame() {
      requestAnimationFrame(frame);
      if (!W || !H) return;
      const ph = p();

      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      drawParts(ctx, W, H);

      const cx = W / 2, cy = H * 0.55;
      const scale = Math.min(0.72, H / 380);

      const pulse = 0.5 + 0.5 * Math.sin(ph * 2);
      drawMan(ctx, cx, cy, scale, pulse);
      drawScroll(ctx, cx, cy + 30 * scale, 42 * scale, 34 * scale, ph);
    }
    requestAnimationFrame(frame);
    console.log('[hero] cosmic scribe online');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
