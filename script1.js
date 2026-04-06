import * as three from "three";
import gsap from "gsap";

const canvas = document.querySelector(".renderer");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const scene = new three.Scene();

const cameraGroup = new three.Group();
scene.add(cameraGroup);

const camera = new three.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000,
);
camera.position.z = 5;
cameraGroup.add(camera);

// TEXTEURE
const textureLoader = new three.TextureLoader();
const texture = textureLoader.load("./textures/gradients/3.jpg");
texture.magFilter = three.NearestFilter;
// texture.minFilter = three.NearestFilter;

const objectDistance = 6;
// OBJECTS
const material = new three.MeshToonMaterial({
  color: 0x00ff00,
  gradientMap: texture,
});
const mesh1 = new three.Mesh(new three.TorusGeometry(1, 0.4, 16, 32), material);

const mesh2 = new three.Mesh(new three.ConeGeometry(1, 2, 32), material);
mesh2.position.y = -objectDistance * 1;
const mesh3 = new three.Mesh(
  new three.TorusKnotGeometry(0.8, 0.2, 100, 16),
  material,
);
mesh3.position.y = -objectDistance * 2;
scene.add(mesh1, mesh2, mesh3);
mesh1.position.x = 3;
mesh2.position.x = -3;
mesh3.position.x = 3;
const sectionMeshes = [mesh1, mesh2, mesh3];

// PARTICLES
const particleCount = 400;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < positions.length; i++) {
  const rand = (Math.random() - 0.5) * 10;
  positions[i] = rand;
}

const pointsGeometry = new three.BufferGeometry();
const pointsMaterial = new three.PointsMaterial({
  color: "#FFFFFF",
  size: 0.02,
  sizeAttenuation: true,
});
const pointsMesh = new three.Points(pointsGeometry, pointsMaterial);
pointsGeometry.setAttribute(
  "position",
  new three.BufferAttribute(positions, 3),
);
scene.add(pointsMesh);

// LIGHTS
const pointLight = new three.DirectionalLight(0xffffff, 1, 100);
pointLight.position.set(5, 5, 0);
scene.add(pointLight);

const renderer = new three.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);

let scrollY = window.scrollY;
let currentSection = null;
window.addEventListener("scroll", () => {
  scrollY = window.scrollY;

  const newSection = Math.round(scrollY / sizes.height);

  if (newSection != currentSection) {
    currentSection = newSection;
    gsap.to(sectionMeshes[newSection]?.rotation, {
      duration: 2,
      ease: "power2.inOut",
      x: "+=3",
      y: "+=6",
    });

    console.log("changed");
  }
});

const cursor = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => {
  cursor.x = e.clientX / sizes.width - 0.5;
  cursor.y = e.clientY / sizes.height - 0.5;
});

const clock = new three.Clock();
let previousTime = 0;

let time = Date.now();
const animate = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = deltaTime;

  const newTime = Date.now();
  const delta = newTime - time;
  time = newTime;

  const parallaxX = -cursor.x * 0.5;
  const parallaxY = cursor.y * 0.5;

  camera.position.y = (-scrollY / sizes.height) * objectDistance;
  pointsMesh.position.y = camera.position.y;

  cameraGroup.position.x +=
    (parallaxX - cameraGroup.position.x) * 0.05 * deltaTime;
  cameraGroup.position.y +=
    (parallaxY - cameraGroup.position.y) * 0.05 * deltaTime;
  sectionMeshes.forEach((mesh) => {
    mesh.rotation.y += delta * 0.0001;
    mesh.rotation.x += delta * 0.0002;
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};
animate();

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});
