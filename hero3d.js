// hero3d.js — loads real rigged human GLB models. Falls back to chrome if
// models are missing. Uses Three.js GLTFLoader.
(function(){
'use strict';

let renderer, scene, camera, clock, mixer1, mixer2, group;

function init(){
  const container = document.getElementById('hero-3d');
  if(!container || container.dataset.ready) return;
  container.dataset.ready = '1';

  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || 460;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 1.05, 3.2);
  camera.lookAt(0, 1.0, 0);

  // Stars
  const starGeom = new THREE.BufferGeometry();
  const N = 600;
  const pos = new Float32Array(N * 3);
  for(let i = 0; i < N; i++){
    const r = 8 + Math.random() * 16;
    const th = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i*3]   = r * Math.sin(phi) * Math.cos(th);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(th);
    pos[i*3+2] = r * Math.cos(phi);
  }
  starGeom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(starGeom, new THREE.PointsMaterial({
    color: 0xaaccff, size: 0.05, transparent: true, opacity: 0.7
  })));

  // Lighting
  scene.add(new THREE.HemisphereLight(0xaaccff, 0x04060c, 0.55));

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x6688cc, 0.6);
  fill.position.set(-3, 2, 2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xcc88ff, 1.1);
  rim.position.set(-2, 1.5, -4);
  scene.add(rim);

  const rim2 = new THREE.DirectionalLight(0x88ccff, 0.9);
  rim2.position.set(2, 1.5, -4);
  scene.add(rim2);

  // Ground — subtle reflection disc
  const groundGeom = new THREE.CircleGeometry(3, 48);
  const groundMat = new THREE.MeshPhongMaterial({
    color: 0x05060a, emissive: 0x0a0f1c, shininess: 200,
    transparent: true, opacity: 0.7
  });
  const ground = new THREE.Mesh(groundGeom, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  group = new THREE.Group();
  scene.add(group);

  // Load both GLBs
  const loader = new THREE.GLTFLoader ? new THREE.GLTFLoader() : new THREE.GLTF2Loader ? new THREE.GLTF2Loader() : null;

  if(!loader){
    console.warn('[hero3d] no GLTFLoader — using chrome fallback');
    addChromeFallback(group);
  } else {
    // Eve — right side
    loader.load('models/eve.glb',
      (gltf) => placeModel(gltf, 0.85, 'eve'),
      undefined,
      (err) => { console.warn('[hero3d] eve.glb failed:', err); }
    );

    // Adam — left side
    loader.load('models/adam.glb',
      (gltf) => placeModel(gltf, -0.85, 'adam'),
      undefined,
      (err) => { console.warn('[hero3d] adam.glb failed:', err); }
    );
  }

  function placeModel(gltf, xOffset, name){
    const model = gltf.scene;

    // Compute bounding box to normalize height to ~1.85m
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    box.getSize(size);
    const targetHeight = 1.85;
    const scale = targetHeight / Math.max(size.y, 0.001);
    model.scale.setScalar(scale);

    // Recompute after scale to sit on ground
    const box2 = new THREE.Box3().setFromObject(model);
    model.position.y -= box2.min.y;
    model.position.x = xOffset;

    model.traverse((node) => {
      if(node.isMesh){
        node.castShadow = true;
        node.receiveShadow = true;
        // Slight chrome tint on materials
        if(node.material){
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          for(const m of mats){
            if(m.isMeshStandardMaterial || m.isMeshPhongMaterial){
              m.emissive = new THREE.Color(name === 'eve' ? 0x1a1220 : 0x0a1a2a);
              m.emissiveIntensity = 0.25;
            }
          }
        }
      }
    });

    // Face each other
    model.rotation.y = xOffset < 0 ? 0.25 : -0.25;

    group.add(model);

    // Animations
    if(gltf.animations && gltf.animations.length > 0){
      const mixer = new THREE.AnimationMixer(model);
      for(const clip of gltf.animations){
        mixer.clipAction(clip).play();
      }
      if(xOffset < 0) mixer1 = mixer; else mixer2 = mixer;
    }

    console.log('[hero3d]', name, 'loaded —', gltf.animations.length, 'animations');
  }

  function addChromeFallback(g){
    // Chrome mannequin fallback if GLBs fail
    for(let s = 0; s < 2; s++){
      const fig = new THREE.Group();
      const profile = [
        [0.001,1.85],[0.06,1.80],[0.115,1.72],[0.115,1.62],[0.08,1.54],
        [0.06,1.48],[0.18,1.42],[0.21,1.32],[0.195,1.20],[0.14,1.08],
        [0.135,0.96],[0.16,0.86],[0.195,0.76],[0.20,0.66],[0.17,0.54],
        [0.14,0.42],[0.125,0.28],[0.125,0.14],[0.15,0.00],[0.001,-0.05]
      ].map(([x,y]) => new THREE.Vector2(Math.max(x, 0.001), y));
      const body = new THREE.Mesh(
        new THREE.LatheGeometry(profile, 24),
        new THREE.MeshPhongMaterial({ color: 0x12121c, specular: 0xffffff,
          shininess: 260, transparent: true, opacity: 0.94 })
      );
      fig.add(body);
      fig.add(new THREE.LineSegments(
        new THREE.WireframeGeometry(new THREE.LatheGeometry(profile, 24)),
        new THREE.LineBasicMaterial({ color: s === 0 ? 0x88ccff : 0xffaacc,
          transparent: true, opacity: 0.3 })
      ));
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.115, 24, 18),
        new THREE.MeshPhongMaterial({ color: 0xdde8f5, specular: 0xffffff, shininess: 400 })
      );
      head.position.y = 1.72;
      fig.add(head);
      fig.position.x = s === 0 ? -0.85 : 0.85;
      fig.scale.setScalar(0.95);
      g.add(fig);
    }
  }

  clock = new THREE.Clock();
  window.addEventListener('resize', onResize);
  animate();
  console.log('[hero3d] scene online');
}

function onResize(){
  const container = document.getElementById('hero-3d');
  if(!container || !renderer || !camera) return;
  const w = container.clientWidth, h = container.clientHeight;
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

  group.rotation.y = t * 0.35;

  if(mixer1) mixer1.update(0.016);
  if(mixer2) mixer2.update(0.016);

  camera.position.z = 3.2 + Math.sin(t * 0.7) * 0.1;
  camera.lookAt(0, 1.0, 0);

  renderer.render(scene, camera);
}

window.Hero3D = { init };
})();
