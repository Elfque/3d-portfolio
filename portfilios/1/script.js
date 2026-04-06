import * as THREE from "three";
// ── Custom cursor ──────────────────────────────────────
const cursor = document.getElementById("cursor");
const ring = document.getElementById("cursor-ring");
let mx = 0,
  my = 0,
  rx = 0,
  ry = 0;
document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
});

function animateCursor() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  cursor.style.left = mx + "px";
  cursor.style.top = my + "px";
  ring.style.left = rx + "px";
  ring.style.top = ry + "px";
  requestAnimationFrame(animateCursor);
}
animateCursor();

document
  .querySelectorAll("a, button, .project-card, .skill-item")
  .forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.style.transform = "translate(-50%,-50%) scale(2)";
      ring.style.width = "50px";
      ring.style.height = "50px";
    });
    el.addEventListener("mouseleave", () => {
      cursor.style.transform = "translate(-50%,-50%) scale(1)";
      ring.style.width = "36px";
      ring.style.height = "36px";
    });
  });

// ── Three.js Hero Background ────────────────────────────
const canvas = document.getElementById("bg-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0, 6);

// Icosahedron wireframe
const icoGeo = new THREE.IcosahedronGeometry(1.8, 1);
const icoMat = new THREE.MeshStandardMaterial({
  color: 0x2b7fff,
  wireframe: true,
  transparent: true,
  opacity: 0.18,
});
const ico = new THREE.Mesh(icoGeo, icoMat);
ico.position.set(3.5, 0, 0);
scene.add(ico);

// Torus knot
const knotGeo = new THREE.TorusKnotGeometry(0.9, 0.28, 128, 16);
const knotMat = new THREE.MeshStandardMaterial({
  color: 0x5aa3ff,
  wireframe: true,
  transparent: true,
  opacity: 0.14,
});
const knot = new THREE.Mesh(knotGeo, knotMat);
knot.position.set(-3.8, 1.2, -1);
scene.add(knot);

// Octahedron
const octGeo = new THREE.OctahedronGeometry(1.1);
const octMat = new THREE.MeshStandardMaterial({
  color: 0x2b7fff,
  wireframe: true,
  transparent: true,
  opacity: 0.12,
});
const oct = new THREE.Mesh(octGeo, octMat);
oct.position.set(-1, -2.5, -1);
scene.add(oct);

// Particle field
const partCount = 1800;
const partPos = new Float32Array(partCount * 3);
for (let i = 0; i < partCount * 3; i++) partPos[i] = (Math.random() - 0.5) * 22;
const partGeo = new THREE.BufferGeometry();
partGeo.setAttribute("position", new THREE.BufferAttribute(partPos, 3));
const partMat = new THREE.PointsMaterial({
  size: 0.025,
  color: 0x4488cc,
  transparent: true,
  opacity: 0.5,
});
const particles = new THREE.Points(partGeo, partMat);
scene.add(particles);

// Lights
scene.add(new THREE.AmbientLight("#ffffff", 0.6));
const dLight = new THREE.DirectionalLight("#2b7fff", 1.5);
dLight.position.set(5, 5, 5);
scene.add(dLight);
const pLight = new THREE.PointLight("#5aa3ff", 1, 20);
pLight.position.set(-5, 3, 2);
scene.add(pLight);

// Mouse parallax
let mouseX = 0;
let mouseY = 0;
document.addEventListener("mousemove", (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

// Scroll fade
let scrollY = 0;
window.addEventListener("scroll", () => {
  scrollY = window.scrollY;
});

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Reduced motion
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Animation loop
let t = 0;
function animate() {
  requestAnimationFrame(animate);
  if (prefersReducedMotion) {
    renderer.render(scene, camera);
    return;
  }
  t += 0.005;

  ico.rotation.x = t * 0.4;
  ico.rotation.y = t * 0.6;
  knot.rotation.x = t * 0.3;
  knot.rotation.y = t * 0.5;
  oct.rotation.x = t * 0.5;
  oct.rotation.z = t * 0.4;
  particles.rotation.y = t * 0.04;

  // Parallax
  camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.03;
  camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.03;

  // Fade on scroll
  const fade = Math.max(0, 1 - scrollY / (window.innerHeight * 0.9));
  renderer.domElement.style.opacity = fade;

  renderer.render(scene, camera);
}
animate();

// ── Scroll reveal ──────────────────────────────────────
const revealEls = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("visible"), i * 80);
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 },
);
revealEls.forEach((el) => observer.observe(el));

// ── Page visibility pause ──────────────────────────────
document.addEventListener("visibilitychange", () => {
  if (document.hidden) renderer.setAnimationLoop(null);
});
