
const GECKO_API = "https://api.geckoterminal.com/api/v2";
const CHAIN = "base";

async function fetchPoolData(token) {
  try {
    const url = `${GECKO_API}/networks/${CHAIN}/pools/${token.pool}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const attrs = json.data?.attributes || {};
    return {
      tvl: Number(attrs.reserve_in_usd || 0),
      price: attrs.base_token_price_usd || null,
      volume: attrs.volume_usd?.h24 || null,
      source: "geckoterminal"
    };
  } catch (e) {
    console.warn(`GeckoTerminal failed for ${token.symbol}:`, e);
    return { tvl: 0, price: null, volume: null, source: "error" };
  }
}

function renderCard(t) {
  const safeSymbol = DOMPurify.sanitize(t.symbol);
  const safeName = DOMPurify.sanitize(t.name);
  const safeFreq = DOMPurify.sanitize(t.freq);
  const safeAddr = DOMPurify.sanitize(t.address);
  const safePool = DOMPurify.sanitize(t.pool);

  const uniswapUrl = `https://app.uniswap.org/explore/pools/base/${safePool}`;
  const geckoUrl = `https://www.geckoterminal.com/base/pools/${safePool}`;

  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `
    <h3>${safeSymbol} <span class="freq">${safeFreq}</span></h3>
    <p class="name">${safeName}</p>
    <p class="addr">${safeAddr}</p>
    <p class="tvl">Pool TVL: <span id="tvl-${t.id}" class="badge loading">SYNCING...</span></p>
    <div class="links">
      <a href="${uniswapUrl}" target="_blank" rel="noopener">Uniswap</a>
      <a href="https://basescan.org/token/${safeAddr}" target="_blank" rel="noopener">BaseScan</a>
      <a href="${geckoUrl}" target="_blank" rel="noopener">GeckoTerm</a>
    </div>`;
  return el;
}

async function syncAll(tokens) {
  for (const t of tokens) {
    const data = await fetchPoolData(t);
    const span = document.getElementById(`tvl-${t.id}`);
    if (!span) continue;

    if (data.tvl >= 1) {
      span.className = "badge tiny";
      span.textContent = `$${data.tvl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    } else if (data.source === "geckoterminal") {
      span.className = "badge empty";
      span.textContent = "LOW LIQUIDITY";
    } else {
      span.className = "badge empty";
      span.textContent = "EMPTY";
    }
  }
}

async function boot() {
  try {
    const res = await fetch("tokens.json");
    const tokens = await res.json();
    const grid = document.getElementById("token-grid");
    grid.innerHTML = "";
    tokens.forEach(t => grid.appendChild(renderCard(t)));
    await syncAll(tokens);
    setInterval(() => syncAll(tokens), 30000);
  } catch (e) {
    document.getElementById("token-grid").innerHTML =
      '<p class="loading">FAILED TO LOAD TOKENS.JSON</p>';
    console.error(e);
  }
}

function startBackground() {
  const canvas = document.getElementById("neural-canvas");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, .1, 1000);
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  camera.position.z = 15;

  const silver = new THREE.LineBasicMaterial({color:0xc0c0c0, transparent:true, opacity:.15});
  const white = new THREE.PointsMaterial({color:0xffffff, size:.15, transparent:true, opacity:.8});

  const hyper = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.BoxGeometry(8,8,8)), silver);
  scene.add(hyper);

  const core = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.BoxGeometry(4,4,4)),
    new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:.3}));
  scene.add(core);

  const N = 400;
  const pos = new Float32Array(N*3);
  for (let i=0;i<N*3;i+=3){
    pos[i]=(Math.random()-.5)*30;
    pos[i+1]=(Math.random()-.5)*30;
    pos[i+2]=(Math.random()-.5)*30;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos,3));
  const points = new THREE.Points(pGeo, white);
  scene.add(points);

  const lines = [];
  for (let i=0;i<N;i++) for (let j=i+1;j<N;j++){
    const dx=pos[i*3]-pos[j*3], dy=pos[i*3+1]-pos[j*3+1], dz=pos[i*3+2]-pos[j*3+2];
    if (Math.sqrt(dx*dx+dy*dy+dz*dz) < 5)
      lines.push(pos[i*3],pos[i*3+1],pos[i*3+2],pos[j*3],pos[j*3+1],pos[j*3+2]);
  }
  const lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute("position", new THREE.Float32BufferAttribute(lines,3));
  const net = new THREE.LineSegments(lGeo, silver);
  scene.add(net);

  let t=0;
  (function animate(){
    requestAnimationFrame(animate);
    t += .005;
    hyper.rotation.x += .002; hyper.rotation.y += .003;
    core.rotation.x -= .004; core.rotation.y -= .001;
    points.rotation.y = net.rotation.y = t*.1;
    const s = 1 + Math.sin(t*2)*.05;
    hyper.scale.set(s,s,s); points.scale.set(s,s,s);
    renderer.render(scene, camera);
  })();

  addEventListener("resize", () => {
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  startBackground();
  boot();
});
