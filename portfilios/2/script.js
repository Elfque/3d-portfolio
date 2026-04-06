import * as THREE from "three";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// ── Custom cursor ─────────────────────────────────────────────
const cur = document.getElementById("cur");
const curRing = document.getElementById("cur-ring");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
});
(function trackCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cur.style.left = mx + "px";
  cur.style.top = my + "px";
  curRing.style.left = rx + "px";
  curRing.style.top = ry + "px";
  requestAnimationFrame(trackCursor);
})();
document
  .querySelectorAll("a,button,.project-card,.skill-item")
  .forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cur.style.transform = "translate(-50%,-50%) scale(2.4)";
      curRing.style.width = "58px";
      curRing.style.height = "58px";
    });
    el.addEventListener("mouseleave", () => {
      cur.style.transform = "translate(-50%,-50%) scale(1)";
      curRing.style.width = "34px";
      curRing.style.height = "34px";
    });
  });

// ── Scroll reveal ─────────────────────────────────────────────
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("in"), i * 90);
        revealObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1 },
);
document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));

function makeRenderer(canvas, alpha = true) {
  const r = new THREE.WebGLRenderer({ canvas, alpha, antialias: true });
  r.setPixelRatio(Math.min(devicePixelRatio, 2));
  return r;
}

// ════════════════════════════════════════════════════════════
// 1. HERO — Wireframe icosahedron + particle storm + parallax
// ════════════════════════════════════════════════════════════
(function heroScene() {
  const canvas = document.getElementById("hero-canvas");
  const renderer = makeRenderer(canvas);
  renderer.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    innerWidth / innerHeight,
    0.1,
    100,
  );
  camera.position.z = 6;

  // Large wireframe icosahedron
  const icoMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.2, 1),
    new THREE.MeshStandardMaterial({
      color: 0x2b7fff,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
    }),
  );
  icoMesh.position.set(3.5, 0.2, 0);
  scene.add(icoMesh);

  // Torus knot behind
  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.0, 0.3, 128, 16),
    new THREE.MeshStandardMaterial({
      color: 0x6ab4ff,
      wireframe: true,
      transparent: true,
      opacity: 0.11,
    }),
  );
  knot.position.set(-4.2, 1.5, -2);
  scene.add(knot);

  // Particles
  const N = 2200;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 24;
  const pg = new THREE.BufferGeometry();
  pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(
    pg,
    new THREE.PointsMaterial({
      size: 0.022,
      color: 0x4488bb,
      transparent: true,
      opacity: 0.5,
    }),
  );
  scene.add(particles);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dl = new THREE.DirectionalLight(0x2b7fff, 1.4);
  dl.position.set(5, 5, 5);
  scene.add(dl);

  let hx = 0,
    hy = 0;
  document.addEventListener("mousemove", (e) => {
    hx = (e.clientX / innerWidth - 0.5) * 2;
    hy = (e.clientY / innerHeight - 0.5) * 2;
  });
  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    if (prefersReducedMotion) {
      renderer.render(scene, camera);
      return;
    }
    t += 0.005;
    icoMesh.rotation.x = t * 0.35;
    icoMesh.rotation.y = t * 0.55;
    knot.rotation.x = t * 0.28;
    knot.rotation.y = t * 0.48;
    particles.rotation.y = t * 0.035;
    camera.position.x += (hx * 0.45 - camera.position.x) * 0.028;
    camera.position.y += (-hy * 0.3 - camera.position.y) * 0.028;
    renderer.domElement.style.opacity = Math.max(
      0,
      1 - scrollY / (innerHeight * 0.85),
    );
    renderer.render(scene, camera);
  })();
})();

// ════════════════════════════════════════════════════════════
// 2. ABOUT — Interactive 3D skill orbs
// ════════════════════════════════════════════════════════════
(function aboutScene() {
  const wrap = document.getElementById("skills-canvas-wrap");
  const canvas = document.getElementById("skills-canvas");
  const tip = document.getElementById("skill-tip");

  // { name: "PostgreSQL", color: 0x336791 },
  // { name: "GraphQL", color: 0xe10098 },
  // { name: "Docker", color: 0x2496ed },
  const skills = [
    { name: "React / Next.js", color: 0x61dafb },
    { name: "TypeScript", color: 0x3178c6 },
    { name: "Three.js", color: 0x2b7fff },
    { name: "Node.js", color: 0x68a063 },
    { name: "Tailwind CSS", color: 0x38bdf8 },
    { name: "AWS", color: 0xff9900 },
    { name: "Go", color: 0x00add8 },
    { name: "GLSL", color: 0xa78bfa },
    { name: "Redis", color: 0xdc382d },
  ];

  const W = wrap.clientWidth || 400;
  const renderer = makeRenderer(canvas);
  renderer.setSize(W, W);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 5.5;
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dl = new THREE.DirectionalLight(0xffffff, 1);
  dl.position.set(4, 4, 4);
  scene.add(dl);

  // Place orbs in a spherical arrangement
  const orbs = skills.map((s, i) => {
    const phi = Math.acos(-1 + (2 * i) / skills.length);
    const theta = Math.sqrt(skills.length * Math.PI) * phi;
    const r = 2.2;
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 24, 24),
      new THREE.MeshStandardMaterial({
        color: s.color,
        roughness: 0.25,
        metalness: 0.5,
      }),
    );
    mesh.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    );
    mesh.userData = {
      basePos: mesh.position.clone(),
      name: s.name,
      color: s.color,
      idx: i,
    };
    scene.add(mesh);
    return mesh;
  });

  // Central orb
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0x2b7fff,
      roughness: 0.2,
      metalness: 0.7,
    }),
  );
  scene.add(center);

  // Raycaster for hover
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10, -10);
  let hoveredOrb = null;

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(orbs);
    if (hits.length) {
      hoveredOrb = hits[0].object;
      tip.textContent = hoveredOrb.userData.name;
      tip.style.opacity = "1";
    } else {
      hoveredOrb = null;
      tip.style.opacity = "0";
    }
  });
  canvas.addEventListener("mouseleave", () => {
    hoveredOrb = null;
    tip.style.opacity = "0";
  });

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.006;
    // Rotate entire orb cluster
    orbs.forEach((orb, i) => {
      const { basePos } = orb.userData;
      const angle = t * 0.45 + i * 0.15;
      orb.position.x =
        basePos.x * Math.cos(angle) - basePos.z * Math.sin(angle);
      orb.position.z =
        basePos.x * Math.sin(angle) + basePos.z * Math.cos(angle);
      orb.position.y = basePos.y + Math.sin(t + i * 0.6) * 0.08;
      // Scale up hovered
      const target = orb === hoveredOrb ? 1.65 : 1;
      orb.scale.lerp(new THREE.Vector3(target, target, target), 0.1);
    });
    center.rotation.y = t * 0.6;
    center.rotation.x = t * 0.3;
    renderer.render(scene, camera);
  })();
})();

// ════════════════════════════════════════════════════════════
// 3. PROJECTS — Each card gets its own unique mini Three.js scene
// ════════════════════════════════════════════════════════════
(function projectScenes() {
  const cards = document.querySelectorAll(".card-canvas");
  cards.forEach((canvas) => {
    const shape = canvas.dataset.shape;
    const colorHex = parseInt(canvas.dataset.color.replace("#", ""), 16);
    const W = canvas.parentElement.offsetWidth || 340;
    const H = 160;
    canvas.width = W;
    canvas.height = H;

    const renderer = makeRenderer(canvas);
    renderer.setSize(W, H);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 3.2;
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dl = new THREE.DirectionalLight(colorHex, 1.5);
    dl.position.set(3, 3, 3);
    scene.add(dl);
    const pl = new THREE.PointLight(colorHex, 1.5, 10);
    pl.position.set(-2, 2, 2);
    scene.add(pl);

    let geo;
    switch (shape) {
      case "torus-knot":
        geo = new THREE.TorusKnotGeometry(0.8, 0.22, 100, 14);
        break;
      case "icosahedron":
        geo = new THREE.IcosahedronGeometry(1, 0);
        break;
      case "octahedron":
        geo = new THREE.OctahedronGeometry(1);
        break;
      case "torus":
        geo = new THREE.TorusGeometry(0.85, 0.32, 20, 60);
        break;
      case "dodecahedron":
        geo = new THREE.DodecahedronGeometry(1);
        break;
      case "cone":
        geo = new THREE.ConeGeometry(0.8, 1.6, 6);
        break;
      default:
        geo = new THREE.SphereGeometry(1, 16, 16);
    }

    // Solid mesh
    const mesh = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.6,
        transparent: true,
        opacity: 0.85,
      }),
    );
    // Wireframe overlay
    const wire = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      }),
    );
    scene.add(mesh);
    scene.add(wire);

    // Hover speed boost
    let isHovered = false;
    let speed = 1;
    canvas
      .closest(".project-card")
      .addEventListener("mouseenter", () => (isHovered = true));
    canvas
      .closest(".project-card")
      .addEventListener("mouseleave", () => (isHovered = false));

    let t = Math.random() * 100;
    (function loop() {
      requestAnimationFrame(loop);
      speed += (isHovered ? 3 : 1 - speed) * 0.05;
      t += 0.008 * speed;
      mesh.rotation.x = t * 0.5;
      mesh.rotation.y = t * 0.8;
      wire.rotation.x = mesh.rotation.x;
      wire.rotation.y = mesh.rotation.y;
      renderer.render(scene, camera);
    })();
  });
})();

// ════════════════════════════════════════════════════════════
// 4. CONTACT — Morphing blob that ripples on mouse proximity
// ════════════════════════════════════════════════════════════
(function contactScene() {
  const canvas = document.getElementById("contact-canvas");
  const renderer = makeRenderer(canvas);
  renderer.setSize(innerWidth, 600);
  canvas.style.height = "100%";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / 600, 0.1, 100);
  camera.position.z = 5;

  // High-res sphere for morphing
  const geo = new THREE.SphereGeometry(1.8, 96, 96);
  const posAttr = geo.attributes.position;
  const basePositions = new Float32Array(posAttr.array.length);
  basePositions.set(posAttr.array);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x2b7fff,
    roughness: 0.15,
    metalness: 0.5,
    transparent: true,
    opacity: 0.55,
    wireframe: false,
  });
  const blob = new THREE.Mesh(geo, mat);
  scene.add(blob);

  // Wireframe twin
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x6ab4ff,
    wireframe: true,
    transparent: true,
    opacity: 0.1,
  });
  const blobWire = new THREE.Mesh(
    new THREE.SphereGeometry(1.82, 36, 36),
    wireMat,
  );
  scene.add(blobWire);

  // Particles ring
  const rN = 1200;
  const rPos = new Float32Array(rN * 3);
  for (let i = 0; i < rN; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = 3.5 + (Math.random() - 0.5) * 2;
    rPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    rPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    rPos[i * 3 + 2] = r * Math.cos(phi);
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute("position", new THREE.BufferAttribute(rPos, 3));
  const ring = new THREE.Points(
    rg,
    new THREE.PointsMaterial({
      size: 0.028,
      color: 0x4499dd,
      transparent: true,
      opacity: 0.45,
    }),
  );
  scene.add(ring);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const dl1 = new THREE.DirectionalLight(0x2b7fff, 1.5);
  dl1.position.set(4, 4, 4);
  scene.add(dl1);
  const dl2 = new THREE.DirectionalLight(0x00e5ff, 1);
  dl2.position.set(-4, -2, 2);
  scene.add(dl2);

  // Mouse distance to blob
  const section = document.getElementById("contact");
  let mouseInfluence = 0;
  section.addEventListener("mousemove", (e) => {
    const rect = section.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const d = Math.hypot(e.clientX - cx, e.clientY - cy);
    mouseInfluence = Math.max(0, 1 - d / (rect.width * 0.4));
  });
  section.addEventListener("mouseleave", () => (mouseInfluence = 0));

  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / 600;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, 600);
  });

  let t = 0;
  (function loop() {
    requestAnimationFrame(loop);
    t += 0.012;

    // Morph vertices
    const amp = 0.18 + mouseInfluence * 0.45;
    const freq = 1.4 + mouseInfluence * 0.8;
    for (let i = 0; i < posAttr.count; i++) {
      const bx = basePositions[i * 3],
        by = basePositions[i * 3 + 1],
        bz = basePositions[i * 3 + 2];
      const n =
        Math.sin(bx * freq + t) *
        Math.sin(by * freq + t * 1.3) *
        Math.sin(bz * freq + t * 0.8);
      const scale = 1 + n * amp;
      posAttr.setXYZ(i, bx * scale, by * scale, bz * scale);
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();

    blob.rotation.y = t * 0.18;
    blob.rotation.x = t * 0.08;
    blobWire.rotation.y = t * 0.14;
    blobWire.rotation.x = t * 0.06;
    ring.rotation.y = t * 0.05;
    ring.rotation.z = t * 0.03;

    renderer.render(scene, camera);
  })();
})();
