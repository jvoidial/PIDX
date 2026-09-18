// hero3d.js — two chrome figures in 3D void space. Real WebGL, real lighting.
(function(){
'use strict';

let renderer, scene, camera, clock, group;

// Body profiles — [radius, height] from head-top to base.
// LatheGeometry revolves these into 3D solids.
const FEMALE_PROFILE = [
  [0.000,1.80],[0.055,1.79],[0.095,1.76],[0.115,1.70],[0.115,1.63],
  [0.080,1.56],[0.060,1.50],[0.180,1.44],[0.210,1.36],[0.205,1.28],
  [0.170,1.18],[0.140,1.08],[0.135,0.98],[0.160,0.88],[0.195,0.78],
  [0.210,0.68],[0.195,0.58],[0.170,0.48],[0.145,0.36],[0.125,0.24],
  [0.120,0.12],[0.140,0.00],[0.000,-0.05]
];
const MALE_PROFILE = [
  [0.000,1.85],[0.060,1.84],[0.100,1.80],[0.118,1.74],[0.118,1.68],
  [0.085,1.60],[0.075,1.54],[0.240,1.48],[0.260,1.40],[0.245,1.32],
  [0.215,1.22],[0.195,1.12],[0.185,1.02],[0.180,0.92],[0.175,0.82],
  [0.170,0.72],[0.160,0.60],[0.150,0.48],[0.140,0.36],[0.130,0.24],
  [0.125,0.12],[0.145,0.00],[0.000,-0.05]
];

function makeFigure(profile, wireColor, coreColor){
  const g = new THREE.Group();

  // Body — LatheGeometry solid
  const pts = profile.map(([x,y]) => new THREE.Vector2(Math.max(x, 0.001), y));
  const bodyGeom = new THREE.LatheGeometry(pts, 24);

  const bodyMat = new THREE.MeshPhongMaterial({
    color: 0x12121c,
    specular: 0xffffff,
    shininess: 260,
    emissive: 0x080a14,
    emissiveIntensity: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.94
  });
  g.add(new THREE.Mesh(bodyGeom, bodyMat));

  // Wireframe overlay — silver structural lines
  const wfGeom = new THREE.WireframeGeometry(bodyGeom);
  const wfMat = new THREE.LineBasicMaterial({
    color: wireColor,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  });
  g.add(new THREE.LineSegments(wfGeom, wfMat));

  // Arms — tapered cylinders
  const armGeom = new THREE.CylinderGeometry(0.045, 0.035, 0.58, 8);
  const armMat = new THREE.MeshPhongMaterial({
    color: 0x0e0e16,
    specular: 0xffffff,
    shininess: 200,
    transparent: true,
    opacity: 0.9
  });
  const lArm = new THREE.Mesh(armGeom, armMat);
  lArm.position.set(-0.225, 1.19, 0);
  lArm.rotation.z = 0.16;
  g.add(lArm);
  const rArm = new THREE.Mesh(armGeom, armMat);
  rArm.position.set(0.225, 1.19, 0);
  rArm.rotation.z = -0.16;
  g.add(rArm);

  // Chrome head
  const headGeom = new THREE.SphereGeometry(0.115, 24, 18);
  const headMat = new THREE.MeshPhongMaterial({
    color: 0xdde8f5,
    specular: 0xffffff,
    shininess: 400,
    emissive: 0x1a2230,
    emissiveIntensity: 0.5
  });
  const head = new THREE.Mesh(headGeom, headMat);
  head.position.y = 1.72;
  g.add(head);

  // Chest core — glowing orb
  const coreGeom = new THREE.SphereGeometry(0.055, 12, 12);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95
  });
  const core = new THREE.Mesh(coreGeom, coreMat);
  core.position.y = 1.28;
  g.add(core);

  const glowGeom = new THREE.SphereGeometry(0.16, 12, 12);
  const glowMat = new THREE.MeshBasicMaterial({
    color: coreColor,
    transparent: true,
    opacity: 0.18
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  glow.position.y = 1.28;
  g.add(glow);

  const light = new THREE.PointLight(coreColor, 0.8, 1.6);
  light.position.y = 1.28;
  g.add(light);

  return g;
}

function init(){
  const container = document.getElementById('hero-3d');
  if(!container) return;
  if(container.dataset.ready) return;
  container.dataset.ready = '1';

  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || 460;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 1.05, 3.4);
  camera.lookAt(0, 1.05, 0);

  // Star sphere
  const starGeom = new THREE.BufferGeometry();
  const N = 500;
  const pos = new Float32Array(N * 3);
  for(let i = 0; i < N; i++){
    const r = 8 + Math.random() * 14;
    const th = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(th);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(th);
    pos[i*3+2] = r * Math.cos(phi);
  }
  starGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(starGeom, new THREE.PointsMaterial({
    color: 0xaaccff, size: 0.045, transparent: true, opacity: 0.75
  })));

  // Chrome lighting — key, fill, rim, rim2, hemi
  scene.add(new THREE.HemisphereLight(0xaaccff, 0x04060c, 0.45));

  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(3, 4, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x6688cc, 0.55);
  fill.position.set(-3, 2, 2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xcc88ff, 0.9);
  rim.position.set(-2, 1, -4);
  scene.add(rim);

  const rim2 = new THREE.DirectionalLight(0x88ccff, 0.7);
  rim2.position.set(2, 1, -4);
  scene.add(rim2);

  // Two figures side by side
  group = new THREE.Group();

  const adam = makeFigure(MALE_PROFILE, 0x88ccff, 0x66d9ff);
  adam.position.x = -0.78;
  adam.scale.setScalar(0.95);
  adam.rotation.y = 0.15;
  group.add(adam);

  const eve = makeFigure(FEMALE_PROFILE, 0xdde8ff, 0xffaacc);
  eve.position.x = 0.78;
  eve.scale.setScalar(0.95);
  eve.rotation.y = -0.15;
  group.add(eve);

  scene.add(group);

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
  animate();

  console.log('[hero3d] two chrome figures online');
}

function onResize(){
  const container = document.getElementById('hero-3d');
  if(!container || !renderer || !camera) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  if(w && h){
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
}

function animate(){
  requestAnimationFrame(animate);
  if(!renderer || !group) return;
  const t = clock.getElapsedTime();

  // Full group rotates — you see the backs as they turn
  group.rotation.y = t * 0.4;

  // Camera breathes gently
  camera.position.z = 3.4 + Math.sin(t * 0.8) * 0.08;
  camera.lookAt(0, 1.05, 0);

  renderer.render(scene, camera);
}

window.Hero3D = { init };
})();
