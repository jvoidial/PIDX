import subprocess, os

# 1. Create the AGI Brain logic file
agi_js = """// AGI Brain - Self-Growing Neural Topology
const canvas = document.getElementById('agi-canvas');
if (canvas) {
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.position.z = 20;

    const nodes = [];
    const nodeCount = 70; // More nodes for a denser brain
    const nodeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White nodes
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.3 }); // Grey synapses

    // Create initial nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.set((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30);
        scene.add(node);
        nodes.push({ mesh: node, connections: [] });
    }

    // Create synapses
    const linePositions = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dist = nodes[i].mesh.position.distanceTo(nodes[j].mesh.position);
            if (dist < 9) { // Distance threshold for connections
                linePositions.push(
                    nodes[i].mesh.position.x, nodes[i].mesh.position.y, nodes[i].mesh.position.z,
                    nodes[j].mesh.position.x, nodes[j].mesh.position.y, nodes[j].mesh.position.z
                );
                nodes[i].connections.push(nodes[j]);
            }
        }
    }
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Animation & Growth Loop
    let time = 0;
    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        // Rotate the entire brain
        scene.rotation.y += 0.001;
        scene.rotation.x += 0.0005;

        // Pulse nodes
        nodes.forEach((node, index) => {
            const scale = 1 + Math.sin(time * 2 + index) * 0.3;
            node.mesh.scale.set(scale, scale, scale);
        });

        renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        const newWidth = canvas.parentElement.clientWidth;
        const newHeight = canvas.parentElement.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    });
}"""

with open("agi_brain.js", "w", encoding="utf-8") as f:
    f.write(agi_js)
print("✅ Created agi_brain.js")

# 2. Update index.html
html_path = "index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Add the AGI Brain section at the very bottom, right before </main>
if 'id="agi-brain-section"' not in html:
    agi_section = """
  <!-- AGI NEURAL TOPOLOGY (Bottom Card) -->
  <section class="grid-section" id="agi-brain-section">
    <h2>🧠 AGI Neural Topology · 5G 4D 3D</h2>
    <div class="panel" style="padding: 15px; border-radius: 12px; background: #000; border: 1px solid var(--border);">
        <canvas id="agi-canvas" style="width: 100%; height: 350px; display: block;"></canvas>
    </div>
  </section>
    """
    # Insert right before the closing main tag
    html = html.replace('</main>', agi_section + '\n</main>')
    print("✅ Added AGI Brain card to the bottom of the page.")

# Add the script tag for agi_brain.js
if 'agi_brain.js' not in html:
    html = html.replace('</body>', '  <script src="agi_brain.js"></script>\n</body>')
    print("✅ Linked agi_brain.js in HTML.")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

# 3. Push to GitHub
print("🚀 Pushing to GitHub...")
subprocess.run("git add index.html agi_brain.js", shell=True, check=True)
subprocess.run('git commit -m "Feature: Added standalone AGI Neural Topology card at bottom"', shell=True, check=True)

try:
    subprocess.run("git push origin main", shell=True, check=True)
    print("✅ DONE. Wait 2 minutes, then open in Incognito mode.")
except subprocess.CalledProcessError:
    print("\n⚠️ Push failed. You need to enter your GitHub token.")
    print("Run: git push origin main")
    print("When asked for password, paste your 'ghp_...' Personal Access Token.")
