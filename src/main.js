import * as THREE from "three";
import { PALETTE } from "./palette.js";
import "./style.css";

const canvas = document.getElementById("game");

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETTE.surfaceBase);
scene.fog = new THREE.Fog(PALETTE.surfaceBase, 14, 38);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 2.6, 7);
camera.lookAt(0, 1.4, 0);

// --- Lights ---
scene.add(new THREE.AmbientLight(PALETTE.textPrimary, 0.45));

const key = new THREE.DirectionalLight(0xffffff, 1.0);
key.position.set(4, 9, 6);
scene.add(key);

const rim = new THREE.PointLight(PALETTE.primary, 2.2, 40);
rim.position.set(-5, 3, 2);
scene.add(rim);

// --- Running track (scrolls toward the camera) ---
const TRACK_LEN = 60;
const track = new THREE.Mesh(
  new THREE.PlaneGeometry(8, TRACK_LEN),
  new THREE.MeshStandardMaterial({
    color: PALETTE.surface2,
    roughness: 0.95,
    metalness: 0.0,
  })
);
track.rotation.x = -Math.PI / 2;
track.position.z = -TRACK_LEN / 2 + 7;
scene.add(track);

// Lane stripes that recycle to fake forward motion
const stripes = [];
const stripeGeo = new THREE.PlaneGeometry(0.35, 2.2);
const stripeMat = new THREE.MeshBasicMaterial({ color: PALETTE.primary });
const STRIPE_GAP = 5;
const STRIPE_COUNT = 14;
for (let i = 0; i < STRIPE_COUNT; i++) {
  const s = new THREE.Mesh(stripeGeo, stripeMat);
  s.rotation.x = -Math.PI / 2;
  s.position.set(0, 0.01, 7 - i * STRIPE_GAP);
  scene.add(s);
  stripes.push(s);
}

// Side rails (cobalt accent edges of the lane)
for (const x of [-4, 4]) {
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, TRACK_LEN),
    new THREE.MeshStandardMaterial({
      color: PALETTE.primary,
      emissive: PALETTE.primary,
      emissiveIntensity: 0.4,
    })
  );
  rail.position.set(x, 0.06, -TRACK_LEN / 2 + 7);
  scene.add(rail);
}

// --- The Bear (brand mascot as a billboard sprite) ---
const loader = new THREE.TextureLoader();
const bearTex = loader.load("/brand/ironbear_running.png");
bearTex.colorSpace = THREE.SRGBColorSpace;

const bear = new THREE.Mesh(
  new THREE.PlaneGeometry(3.4, 3.4),
  new THREE.MeshBasicMaterial({
    map: bearTex,
    transparent: true,
    alphaTest: 0.5,
  })
);
bear.position.set(0, 1.8, 1.5);
scene.add(bear);

// Soft shadow blob under the bear
const blob = new THREE.Mesh(
  new THREE.CircleGeometry(1.1, 32),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })
);
blob.rotation.x = -Math.PI / 2;
blob.position.set(0, 0.02, 1.5);
scene.add(blob);

// --- Run state / fitness stats ---
const PACE_KMH = 8.0;
let distance = 0; // meters
const distanceEl = document.getElementById("distance");
const paceEl = document.getElementById("pace");
paceEl.textContent = `${PACE_KMH.toFixed(1)} km/h`;

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  // World speed (units/sec) — tied to pace
  const speed = PACE_KMH * 0.55;

  // Scroll stripes toward camera, recycle past the camera
  for (const s of stripes) {
    s.position.z += speed * dt;
    if (s.position.z > 8) s.position.z -= STRIPE_GAP * STRIPE_COUNT;
  }

  // Bear running bob + slight sway, keep facing camera
  bear.position.y = 1.8 + Math.abs(Math.sin(t * 9)) * 0.18;
  bear.position.x = Math.sin(t * 1.3) * 0.25;
  bear.rotation.z = Math.sin(t * 9) * 0.04;
  blob.position.x = bear.position.x;
  const squish = 1 + Math.sin(t * 18) * 0.04;
  blob.scale.set(1 / squish, squish, 1);

  // Accumulate distance (km/h -> m/s)
  distance += (PACE_KMH / 3.6) * dt;
  distanceEl.textContent = `${distance.toFixed(0)} m`;

  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
