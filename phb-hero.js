// phb-hero.js — animated spirit guide hero. Canvas 2D, no WebGL, mobile-safe.
// Syncs to window 'phb-phase' event emitted by phb-autonomy.js.
(function () {
  'use strict';

  const COLORS = {
    PIDX:    '#88ccff',
    SGUIDE:  '#aaffaa',
    VDOO:    '#ffaa66',
    PENNIES: '#ff88ff',
    core:    '#66d9ff',
    aura:    '#3a6b9a',
    bg:      '#05050a',
  };

  // ── Shared phase (updated by phb-autonomy.js every 5s) ──────────────────
  let sharedPhase = 0.0;
  window.addEventListener('phb-phase', (ev) => {
    if (ev && ev.detail && typeof ev.detail.phase === 'number') {
      sharedPhase = ev.detail.phase;
    }
  });

  // Local time-based phase so it never stalls if autonomy hasn't emitted yet
  function localPhase() {
    return sharedPhase + (performance.now() / 1000) * 0.05;
  }

  // ── Draw the hooded spirit-guide silhouette ─────────────────────────────
  function drawFigure(ctx, cx, cy, scale, corePulse) {
    const H = 180 * scale;
    const W = 100 * scale;

    // Body / cloak
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.5, cy + H * 0.55);
    ctx.quadraticCurveTo(cx - W * 0.55, cy - H * 0.2, cx - W * 0.32, cy - H * 0.55);
    // Hood top
    ctx.quadraticCurveTo(cx - W * 0.28, cy - H * 0.75, cx, cy - H * 0.78);
    ctx.quadraticCurveTo(cx + W * 0.28, cy - H * 0.75, cx + W * 0.32, cy - H * 0.55);
    ctx.quadraticCurveTo(cx + W * 0.55, cy - H * 0.2, cx + W * 0.5, cy + H * 0.55);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, cy - H, 0, cy + H * 0.6);
    grad.addColorStop(0, 'rgba(10,12,22,0.98)');
    grad.addColorStop(1, 'rgba(6,8,16,0.92)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim light
    ctx.lineWidth = 1.2;
    const rim = ctx.createLinearGradient(cx - W, cy, cx + W, cy);
    rim.addColorStop(0, COLORS.core);
    rim.addColorStop(0.5, 'rgba(80,140,200,0.25)');
    rim.addColorStop(1, COLORS.core);
    ctx.strokeStyle = rim;
    ctx.globalAlpha = 0.55 + corePulse * 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Face mask — polished chrome
    const faceY = cy - H * 0.52;
    const faceR = W * 0.24;
    const faceGrad = ctx.createRadialGradient(cx - faceR * 0.3, faceY, 2, cx, faceY, faceR);
    faceGrad.addColorStop(0, '#c8d8ea');
    faceGrad.addColorStop(0.5, '#4a6078');
    faceGrad.addColorStop(1, '#101820');
    ctx.beginPath();
    ctx.ellipse(cx, faceY, faceR * 0.9, faceR * 1.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = faceGrad;
    ctx.fill();

    // Face highlight
    ctx.beginPath();
    ctx.ellipse(cx - faceR * 0.25, faceY - faceR * 0.35, faceR * 0.28, faceR * 0.4, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(240,250,255,0.5)';
    ctx.fill();

    ctx.restore();
  }

  // ── Draw the glowing core cube held in front ────────────────────────────
  function drawCore(ctx, cx, cy, size, phase) {
    const s = size;
    const rotY = phase * 0.6;
    const rotX = Math.sin(phase * 0.4) * 0.3;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

    // 8 cube vertices in local space
    const v = [
      [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
      [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1],
    ].map(p => {
      // rotate Y
      let x = p[0] * cosY - p[2] * sinY;
      let z = p[0] * sinY + p[2] * cosY;
      // rotate X
      let y = p[1] * cosX - z * sinX;
      z = p[1] * sinX + z * cosX;
      // perspective
      const f = 3.5 / (3.5 + z);
      return [cx + x * s * f, cy + y * s * f, z];
    });

    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];

    // Glow behind cube
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 3);
    glow.addColorStop(0, 'rgba(102,217,255,0.5)');
    glow.addColorStop(0.4, 'rgba(102,217,255,0.15)');
    glow.addColorStop(1, 'rgba(102,217,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, s * 3, 0, Math.PI * 2);
    ctx.fill();

    // Faces (semi-transparent)
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = COLORS.core;
    ctx.globalAlpha = 0.85;
    edges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(v[a][0], v[a][1]);
      ctx.lineTo(v[b][0], v[b][1]);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    // Vertices
    v.forEach(([x, y, z]) => {
      const r = 2.5 + (1 - z * 0.3) * 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.core;
      ctx.fill();
    });

    // Inner bright dot
    const pulse = 0.6 + 0.4 * Math.sin(phase * 3);
    ctx.beginPath();
    ctx.arc(cx, cy, 3 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // ── Draw orbiting atom shells (electron rings) ──────────────────────────
  function drawAtomShells(ctx, cx, cy, radius, phase) {
    const shells = [
      { r: radius * 1.0, tilt: 0.0, color: COLORS.core,    n: 3, speed:  0.8 },
      { r: radius * 1.3, tilt: 0.9, color: COLORS.PIDX,    n: 5, speed: -0.6 },
      { r: radius * 1.6, tilt: 1.8, color: COLORS.SGUIDE,  n: 4, speed:  0.4 },
      { r: radius * 1.9, tilt: 2.6, color: COLORS.VDOO,    n: 6, speed: -0.3 },
      { r: radius * 2.2, tilt: 3.4, color: COLORS.PENNIES, n: 3, speed:  0.2 },
    ];

    shells.forEach((shell, idx) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(shell.tilt);

      // Ellipse ring
      ctx.beginPath();
      ctx.ellipse(0, 0, shell.r, shell.r * 0.22, 0, 0, Math.PI * 2);
      ctx.strokeStyle = shell.color;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Electrons on the ring
      for (let e = 0; e < shell.n; e++) {
        const t = phase * shell.speed + (e / shell.n) * Math.PI * 2 + idx;
        const ex = Math.cos(t) * shell.r;
        const ey = Math.sin(t) * shell.r * 0.22;
        ctx.beginPath();
        ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = shell.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = shell.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    });
  }

  // ── Particle mist ───────────────────────────────────────────────────────
  const PARTICLES = [];
  function spawnParticles(n, w, h) {
    PARTICLES.length = 0;
    for (let i = 0; i < n; i++) {
      PARTICLES.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: -0.1 - Math.random() * 0.25,
        a: 0.15 + Math.random() * 0.35,
      });
    }
  }
  function drawParticles(ctx, w, h) {
    for (const p of PARTICLES) {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(102,217,255,${p.a})`;
      ctx.fill();
    }
  }

  // ── Main loop ───────────────────────────────────────────────────────────
  function createHero() {
    const hero = document.createElement('div');
    hero.id = 'phb-hero';
    hero.style.cssText = [
      'position:relative',
      'width:100%',
      'height:340px',
      'overflow:hidden',
      'background:radial-gradient(ellipse at 50% 60%, #0c1220 0%, #05050a 70%)',
      'border-bottom:1px solid #1a1a2a',
    ].join(';');

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    hero.appendChild(canvas);

    // Title overlay
    const title = document.createElement('div');
    title.style.cssText = [
      'position:absolute', 'bottom:14px', 'left:0', 'right:0', 'text-align:center',
      'font:600 20px ui-monospace,monospace', 'color:#88ccff',
      'text-shadow:0 0 12px rgba(102,217,255,0.6)', 'pointer-events:none',
    ].join(';');
    title.textContent = '✧ SPIRIT GUIDE ✧';
    hero.appendChild(title);

    const sub = document.createElement('div');
    sub.style.cssText = [
      'position:absolute', 'bottom:2px', 'left:0', 'right:0', 'text-align:center',
      'font:11px ui-monospace,monospace', 'color:#556', 'pointer-events:none',
    ].join(';');
    sub.textContent = 'PIDX · SGUIDE · VDOO · PENNIES  |  5D→4D→3D core sync';
    hero.appendChild(sub);

    return { hero, canvas };
  }

  function boot() {
    // Insert hero after status bar (or at top of body if none)
    if (document.getElementById('phb-hero')) return;
    const bar = document.getElementById('phb-status-bar');
    const { hero, canvas } = createHero();
    if (bar && bar.parentNode) bar.parentNode.insertBefore(hero, bar.nextSibling);
    else document.body.insertBefore(hero, document.body.firstChild);

    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      spawnParticles(Math.min(80, Math.floor(W * H / 6000)), W, H);
    }
    window.addEventListener('resize', resize);
    resize();

    let t0 = performance.now();
    function frame(now) {
      requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      const phase = localPhase();

      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, W, H);

      drawParticles(ctx, W, H);

      const cx = W / 2;
      const cy = H * 0.55;
      const scale = Math.min(1.1, H / 340);

      // Orbiting shells behind
      drawAtomShells(ctx, cx, cy, 55 * scale, phase);

      // Silhouette
      const corePulse = 0.5 + 0.5 * Math.sin(phase * 2);
      drawFigure(ctx, cx, cy, scale, corePulse);

      // Core cube in front (hands area)
      drawCore(ctx, cx, cy + 15 * scale, 22 * scale, phase);
    }
    requestAnimationFrame(frame);

    console.log('[hero] spirit guide online — syncing with phb-phase');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
