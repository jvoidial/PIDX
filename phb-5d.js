// phb-5d.js — 5D penteract rendered inline as a card. SIM badge.
(function () {
  'use strict';

  const TOKENS = ['PIDX', 'SGUIDE', 'VDOO', 'PENNIES'];
  const COLORS = { PIDX: 0x88ccff, SGUIDE: 0xaaffaa, VDOO: 0xffaa66, PENNIES: 0xff88ff };

  function buildPenteract() {
    const verts = [];
    for (let i = 0; i < 32; i++) {
      verts.push([(i&1)?1:-1,(i&2)?1:-1,(i&4)?1:-1,(i&8)?1:-1,(i&16)?1:-1]);
    }
    const edges = [];
    for (let i = 0; i < 32; i++) {
      for (let j = i + 1; j < 32; j++) {
        let d = 0;
        for (let k = 0; k < 5; k++) if (verts[i][k] !== verts[j][k]) d++;
        if (d === 1) edges.push([i, j]);
      }
    }
    return { verts, edges };
  }

  function rotatePlane(v, i, j, a) {
    const out = v.slice();
    const c = Math.cos(a), s = Math.sin(a);
    out[i] = v[i] * c - v[j] * s;
    out[j] = v[i] * s + v[j] * c;
    return out;
  }

  function project(v, dropAxis, distance) {
    const w = v[dropAxis];
    const k = distance / (distance - w);
    const out = [];
    for (let i = 0; i < v.length; i++) {
      if (i === dropAxis) continue;
      out.push(v[i] * k);
    }
    return out;
  }

  function project5to3(v5, t) {
    let v = rotatePlane(v5, 0, 4, t * 0.31);
    v = rotatePlane(v, 1, 3, t * 0.47);
    v = rotatePlane(v, 0, 2, t * 0.19);
    v = rotatePlane(v, 1, 4, t * 0.23);
    const v4 = project(v, 4, 3.0);
    return project(v4, 3, 2.2);
  }

  const SIM = { started: null, n_frames: 0, n_vertices: 0, n_edges: 0, fps: 0, last_t: 0 };

  if (typeof PHB !== 'undefined') {
    PHB.register('sim.5d_topology', {
      kind: 'demo',
      ttl: 5000,
      fetch: () => ({
        status: 'simulation',
        label: '5D penteract — tokens as boson-mirror clusters',
        n_vertices: SIM.n_vertices,
        n_edges: SIM.n_edges,
        frames: SIM.n_frames,
        fps: SIM.fps,
        tokens: TOKENS.map((t, i) => ({ token: t, cluster_axis: ['x','y','z','w'][i], vertices: 8 })),
      }),
    });
  }

  // ── Find where to insert the card ───────────────────────────────────────
  function findAnchor() {
    // 1. Explicit anchor if present
    let a = document.getElementById('phb-5d-anchor');
    if (a) return a;

    // 2. Walk up from #tokensContainer to a section-like parent,
    //    then insert after it.
    const tc = document.getElementById('tokensContainer');
    if (tc) {
      let el = tc;
      for (let i = 0; i < 4; i++) {
        if (el.parentElement && el.parentElement.tagName !== 'BODY') el = el.parentElement;
        else break;
      }
      return el;
    }

    // 3. Fallback: first heading containing "Tokens"
    const heads = document.querySelectorAll('h1,h2,h3,div');
    for (const h of heads) {
      const t = (h.textContent || '').trim();
      if (/💰\s*Tokens/.test(t) && t.length < 40) return h;
    }
    return null;
  }

  function createCard() {
    const card = document.createElement('div');
    card.id = 'phb-5d-card';
    card.style.cssText = [
      'position:relative',
      'background:#0a0a12',
      'border:1px solid #1e2030',
      'border-radius:12px',
      'padding:12px',
      'margin:16px 0',
      'overflow:hidden',
      'isolation:isolate',
      'font-family:ui-monospace,monospace',
    ].join(';');

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
    header.innerHTML =
      '<div style="font:600 13px ui-monospace,monospace;color:#88ccff;">🧬 5D Topology · Penteract</div>';
    const badge = document.createElement('span');
    badge.textContent = 'SIM';
    badge.style.cssText = 'font:600 10px ui-monospace,monospace;background:#3a1a4a;color:#c9f;padding:2px 8px;border-radius:8px;';
    header.appendChild(badge);
    card.appendChild(header);

    const sub = document.createElement('div');
    sub.style.cssText = 'font:11px ui-monospace,monospace;color:#556;margin-bottom:10px;';
    sub.textContent = '32 vertices · 80 edges · 4 token clusters · 5D→4D→3D projection';
    card.appendChild(sub);

    const canvas = document.createElement('div');
    canvas.id = 'phb-5d-canvas';
    canvas.style.cssText = 'width:100%;height:280px;background:#06060a;border-radius:8px;overflow:hidden;';
    card.appendChild(canvas);

    return card;
  }

  function insertCard() {
    if (document.getElementById('phb-5d-card')) return;
    const anchor = findAnchor();
    const card = createCard();
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(card, anchor.nextSibling);
    } else {
      document.body.appendChild(card);
    }
  }

  function boot() {
    if (typeof THREE === 'undefined') {
      setTimeout(boot, 200);
      return;
    }

    insertCard();

    const container = document.getElementById('phb-5d-canvas');
    if (!container) return;

    const w = container.clientWidth || 280;
    const h = container.clientHeight || 280;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x06060a, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 6);

    const vertGeom = new THREE.SphereGeometry(0.045, 8, 8);
    const vertMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    const vertMesh = new THREE.InstancedMesh(vertGeom, vertMat, 32);
    scene.add(vertMesh);

    const edgeGeom = new THREE.BufferGeometry();
    const edgePositions = new Float32Array(80 * 2 * 3);
    edgeGeom.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.4 });
    const edgeLines = new THREE.LineSegments(edgeGeom, edgeMat);
    scene.add(edgeLines);

    const { verts, edges } = buildPenteract();
    SIM.n_vertices = verts.length;
    SIM.n_edges = edges.length;
    SIM.started = performance.now();

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const projected5 = new Array(32);

    function frame(now) {
      requestAnimationFrame(frame);
      const t = (now - SIM.started) / 1000;

      for (let i = 0; i < 32; i++) {
        const p3 = project5to3(verts[i], t);
        projected5[i] = p3;
        dummy.position.set(p3[0], p3[1], p3[2]);
        dummy.updateMatrix();
        vertMesh.setMatrixAt(i, dummy.matrix);
        const wSign = verts[i][3] > 0 ? 1 : 0;
        const vSign = verts[i][4] > 0 ? 1 : 0;
        const cluster = wSign + 2 * vSign;
        color.setHex(COLORS[TOKENS[cluster % 4]]);
        vertMesh.setColorAt(i, color);
      }
      vertMesh.instanceMatrix.needsUpdate = true;
      if (vertMesh.instanceColor) vertMesh.instanceColor.needsUpdate = true;

      let offset = 0;
      for (const [a, b] of edges) {
        const pa = projected5[a], pb = projected5[b];
        edgePositions[offset++] = pa[0]; edgePositions[offset++] = pa[1]; edgePositions[offset++] = pa[2];
        edgePositions[offset++] = pb[0]; edgePositions[offset++] = pb[1]; edgePositions[offset++] = pb[2];
      }
      edgeLines.geometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);

      SIM.n_frames++;
      const dt = (now - SIM.last_t) / 1000;
      if (dt > 0.5) { SIM.fps = Math.round(1 / dt); SIM.last_t = now; }
    }
    requestAnimationFrame(frame);

    window.addEventListener('resize', () => {
      const w2 = container.clientWidth;
      const h2 = container.clientHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
