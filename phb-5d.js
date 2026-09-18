// phb-5d.js — real 5D penteract rendered in 3D via 5D→4D→3D projection.
// The four tokens occupy four vertex clusters of the 5-cube.
// Badge: SIM. This is geometry, not physics.
(function () {
  'use strict';

  const TOKENS = ['PIDX', 'SGUIDE', 'VDOO', 'PENNIES'];
  const COLORS = { PIDX: 0x88ccff, SGUIDE: 0xaaffaa, VDOO: 0xffaa66, PENNIES: 0xff88ff };

  // ── 5D penteract: 32 vertices, 80 edges ─────────────────────────────────
  function buildPenteract() {
    const verts = [];
    for (let i = 0; i < 32; i++) {
      verts.push([
        (i & 1)  ? 1 : -1,
        (i & 2)  ? 1 : -1,
        (i & 4)  ? 1 : -1,
        (i & 8)  ? 1 : -1,
        (i & 16) ? 1 : -1,
      ]);
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

  // ── Rotation in 5D ──────────────────────────────────────────────────────
  // Rotates vertex v by angle a in the plane spanned by axes (i, j).
  function rotatePlane(v, i, j, a) {
    const out = v.slice();
    const c = Math.cos(a), s = Math.sin(a);
    out[i] = v[i] * c - v[j] * s;
    out[j] = v[i] * s + v[j] * c;
    return out;
  }

  // ── Perspective projection from nD to (n-1)D ────────────────────────────
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

  // ── Full pipeline: 5D → 4D → 3D ─────────────────────────────────────────
  function project5to3(v5, t) {
    // Double rotation in 5D
    let v = rotatePlane(v5, 0, 4, t * 0.31);   // XW
    v = rotatePlane(v, 1, 3, t * 0.47);        // YZ
    v = rotatePlane(v, 0, 2, t * 0.19);        // XZ
    v = rotatePlane(v, 1, 4, t * 0.23);        // YV

    // 5D → 4D: drop axis 4
    const v4 = project(v, 4, 3.0);
    // 4D → 3D: drop axis 3
    const v3 = project(v4, 3, 2.2);
    return v3;
  }

  // ── Sim state ───────────────────────────────────────────────────────────
  const SIM = {
    started: null,
    n_frames: 0,
    n_vertices: 0,
    n_edges: 0,
    fps: 0,
    last_t: 0,
  };

  // ── Register a PHB source that reports sim state ────────────────────────
  if (typeof PHB !== 'undefined') {
    PHB.register('sim.5d_topology', {
      kind: 'demo',
      ttl: 5_000,
      fetch: () => ({
        status: 'simulation',
        label: '5D penteract topology — tokens as boson-mirror vertices',
        n_vertices: SIM.n_vertices,
        n_edges: SIM.n_edges,
        frames: SIM.n_frames,
        fps: SIM.fps,
        tokens: TOKENS.map((t, i) => ({
          token: t,
          cluster_axis: ['x', 'y', 'z', 'w'][i],
          vertices: 8,
        })),
      }),
    });
  }

  // ── Three.js scene ──────────────────────────────────────────────────────
  function boot() {
    if (typeof THREE === 'undefined') {
      console.warn('[5D] three.js not loaded yet — deferring');
      return;
    }
    const container = document.getElementById('phb-5d') ||
      (function () {
        const el = document.createElement('div');
        el.id = 'phb-5d';
        el.style.cssText = 'position:fixed;bottom:12px;right:12px;width:280px;height:280px;background:#0a0a12;border:1px solid #222;border-radius:12px;overflow:hidden;z-index:9998;';
        // SIM badge in corner
        const badge = document.createElement('div');
        badge.textContent = 'SIM';
        badge.style.cssText = 'position:absolute;top:6px;right:8px;font:600 10px ui-monospace,monospace;background:#3a1a4a;color:#c9f;padding:1px 6px;border-radius:8px;z-index:9999;';
        el.appendChild(badge);
        document.body.appendChild(el);
        return el;
      })();

    const w = container.clientWidth, h = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
    camera.position.set(0, 0, 6);

    // Vertices as instanced spheres
    const vertGeom = new THREE.SphereGeometry(0.045, 8, 8);
    const vertMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    const vertMesh = new THREE.InstancedMesh(vertGeom, vertMat, 32);
    scene.add(vertMesh);

    // Edges as line segments
    const edgeGeom = new THREE.BufferGeometry();
    const edgePositions = new Float32Array(80 * 2 * 3);
    edgeGeom.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.35 });
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

      // Update 5D rotations and project every vertex
      for (let i = 0; i < 32; i++) {
        const p3 = project5to3(verts[i], t);
        projected5[i] = p3;
        dummy.position.set(p3[0], p3[1], p3[2]);
        dummy.updateMatrix();
        vertMesh.setMatrixAt(i, dummy.matrix);
        // Colour: token cluster by w-coordinate sign + v-coordinate sign
        const wSign = verts[i][3] > 0 ? 1 : 0;
        const vSign = verts[i][4] > 0 ? 1 : 0;
        const cluster = wSign + 2 * vSign;      // 0..3 → four tokens
        color.setHex(COLORS[TOKENS[cluster % 4]]);
        vertMesh.setColorAt(i, color);
      }
      vertMesh.instanceMatrix.needsUpdate = true;
      if (vertMesh.instanceColor) vertMesh.instanceColor.needsUpdate = true;

      // Update edges
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
      if (dt > 0.5) {
        SIM.fps = Math.round(1 / dt);
        SIM.last_t = now;
      }
    }
    requestAnimationFrame(frame);

    window.PHB_5D = {
      container, scene, camera, renderer,
      SIM,
      project5to3,
      buildPenteract,
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
