import * as THREE from "three";
// ── Custom cursor ────────────────────────────────────────────────
const cursor = document.getElementById("cursor");
const cursorRing = document.getElementById("cursor-ring");
let mx = -200,
  my = -200,
  rx = -200,
  ry = -200;

document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + "px";
  cursor.style.top = my + "px";
});
(function lerp() {
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  cursorRing.style.left = rx + "px";
  cursorRing.style.top = ry + "px";
  requestAnimationFrame(lerp);
})();
document.querySelectorAll("a, button").forEach((el) => {
  el.addEventListener("mouseenter", () => {
    cursor.style.width = "18px";
    cursor.style.height = "18px";
    cursorRing.style.width = "52px";
    cursorRing.style.height = "52px";
  });
  el.addEventListener("mouseleave", () => {
    cursor.style.width = "10px";
    cursor.style.height = "10px";
    cursorRing.style.width = "36px";
    cursorRing.style.height = "36px";
  });
});

// ── Three.js ─────────────────────────────────────────────────────
const canvas = document.getElementById("bg-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.z = 6;

// Core icosahedron
const icoGeo = new THREE.IcosahedronGeometry(1.8, 1);
const ico = new THREE.Mesh(
  icoGeo,
  new THREE.MeshStandardMaterial({
    color: 0x1a3a8a,
    emissive: 0x061530,
    transparent: true,
    opacity: 0.18,
  }),
);
scene.add(ico);

// Wireframe shell
const wire = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.83, 1),
  new THREE.MeshBasicMaterial({
    color: 0x2563eb,
    wireframe: true,
    transparent: true,
    opacity: 0.55,
  }),
);
scene.add(wire);

// Orbital rings
function makeRing(r, thickness, color, opacity, rx_, ry_, rz_) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, thickness, 2, 90),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity }),
  );
  m.rotation.set(rx_, ry_, rz_);
  scene.add(m);
  return m;
}
const ring1 = makeRing(2.6, 0.007, 0x38bdf8, 0.3, Math.PI / 3, 0, 0);
const ring2 = makeRing(3.1, 0.005, 0x2563eb, 0.2, -Math.PI / 4, 0, Math.PI / 6);
const ring3 = makeRing(2.0, 0.004, 0x38bdf8, 0.15, Math.PI / 6, Math.PI / 3, 0);

// Particles
const pCount = 1400;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  const r = 4.5 + Math.random() * 9;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  pPos[i * 3 + 2] = r * Math.cos(phi);
}
const ptGeo = new THREE.BufferGeometry();
ptGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
const particles = new THREE.Points(
  ptGeo,
  new THREE.PointsMaterial({
    size: 0.022,
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
  }),
);
scene.add(particles);

// Lights
scene.add(new THREE.AmbientLight(0x0a1540, 2));
const dl = new THREE.DirectionalLight(0x2563eb, 3);
dl.position.set(3, 5, 3);
scene.add(dl);
const rl = new THREE.DirectionalLight(0x38bdf8, 1.5);
rl.position.set(-4, -2, 2);
scene.add(rl);

// Mouse parallax
let tx = 0,
  ty = 0;
document.addEventListener("mousemove", (e) => {
  tx = (e.clientX / window.innerWidth - 0.5) * 0.55;
  ty = (e.clientY / window.innerHeight - 0.5) * 0.38;
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

let scrollY = 0;
window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
});

const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

(function tick() {
  requestAnimationFrame(tick);
  if (!prefersReduced) {
    ico.rotation.x += 0.003;
    ico.rotation.y += 0.005;
    wire.rotation.x = ico.rotation.x;
    wire.rotation.y = ico.rotation.y;
    ring1.rotation.z += 0.004;
    ring2.rotation.y += 0.003;
    ring2.rotation.x += 0.0015;
    ring3.rotation.z -= 0.005;
    particles.rotation.y += 0.0003;
    scene.rotation.y += (tx - scene.rotation.y) * 0.04;
    scene.rotation.x += (ty - scene.rotation.x) * 0.04;

    // Scroll fade
    const fade = Math.max(0, 1 - scrollY / (window.innerHeight * 0.85));
    [ico, wire, ring1, ring2, ring3, particles].forEach((obj) => {
      if (obj.material)
        obj.material.opacity = (obj._op || obj.material.opacity) * fade;
    });
  }
  renderer.render(scene, camera);
})();

// Store original opacities
[ico, wire, ring1, ring2, ring3, particles].forEach((obj) => {
  if (obj.material) obj._op = obj.material.opacity;
});

// ── Scroll fade-up ───────────────────────────────────────────────
const obs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        obs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1 },
);
document.querySelectorAll(".fade-up").forEach((el) => obs.observe(el));
