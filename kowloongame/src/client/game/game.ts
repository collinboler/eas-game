import * as THREE from 'three';

// ============================================
// KOWLOON WALLED CITY: MICRO-LABYRINTH
// ============================================

const canvas = document.getElementById('bg') as HTMLCanvasElement;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 0); // Eye level

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio ?? 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x0a0a0a, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Fog for atmosphere
scene.fog = new THREE.Fog(0x000000, 5, 40);

// ============================================
// LIGHTING
// ============================================
const ambientLight = new THREE.AmbientLight(0x222222, 0.3);
scene.add(ambientLight);

// Neon lights
const neonLight1 = new THREE.PointLight(0xff00ff, 0.8, 20);
neonLight1.position.set(-3, 2, -10);
neonLight1.castShadow = true;
scene.add(neonLight1);

const neonLight2 = new THREE.PointLight(0x00ffff, 0.6, 15);
neonLight2.position.set(3, 2, -20);
neonLight2.castShadow = true;
scene.add(neonLight2);

// ============================================
// CORRIDOR
// ============================================
const corridorGroup = new THREE.Group();

// Floor
const floorGeo = new THREE.PlaneGeometry(10, 40);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
corridorGroup.add(floor);

// Ceiling
const ceilingGeo = new THREE.PlaneGeometry(10, 40);
const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x0f0f0f });
const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = 4;
corridorGroup.add(ceiling);

// Left wall
const leftWallGeo = new THREE.PlaneGeometry(40, 4);
const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-5, 2, -20);
corridorGroup.add(leftWall);

// Right wall
const rightWall = new THREE.Mesh(leftWallGeo, wallMat);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(5, 2, -20);
corridorGroup.add(rightWall);

scene.add(corridorGroup);

// ============================================
// PROPS: PIPES, VENTS, NEON SIGN
// ============================================
// Pipes
for (let i = 0; i < 3; i++) {
  const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
  const pipe = new THREE.Mesh(pipeGeo, pipeMat);
  pipe.position.set(-4, 1.5, -8 - i * 8);
  pipe.rotation.z = Math.PI / 2;
  pipe.castShadow = true;
  scene.add(pipe);
}

// Vents
for (let i = 0; i < 2; i++) {
  const ventGeo = new THREE.BoxGeometry(1, 0.3, 1);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const vent = new THREE.Mesh(ventGeo, ventMat);
  vent.position.set(3, 3.5, -10 - i * 12);
  scene.add(vent);
}

// Neon sign (emissive)
const neonSignGeo = new THREE.PlaneGeometry(2, 0.5);
const neonSignMat = new THREE.MeshStandardMaterial({
  color: 0xff00ff,
  emissive: 0xff00ff,
  emissiveIntensity: 0.5,
});
const neonSign = new THREE.Mesh(neonSignGeo, neonSignMat);
neonSign.position.set(-3, 3, -15);
neonSign.rotation.y = Math.PI / 4;
scene.add(neonSign);

// ============================================
// SCROLL OBJECT (Interactable)
// ============================================
const scrollGeo = new THREE.PlaneGeometry(0.8, 1.2);
const scrollMat = new THREE.MeshStandardMaterial({
  color: 0xffffaa,
  emissive: 0xffff00,
  emissiveIntensity: 0.3,
});
const scroll = new THREE.Mesh(scrollGeo, scrollMat);
scroll.position.set(0, 1.2, -10);
scroll.rotation.y = Math.PI;
scroll.userData = { type: 'scroll', text: 'Judge Bao: Jurisdiction in Kowloon Walled City is unclear. Neither Hong Kong nor China claimed authority, creating a legal void where disputes were settled by community elders. The ambiguity of law mirrors the ambiguity of identity—who has the right to judge?' };
scene.add(scroll);

// ============================================
// FOX SPRITE (Easter Egg)
// ============================================
// Create a simple fox using a colored plane with emissive material
const foxGeo = new THREE.PlaneGeometry(1, 1);
const foxMat = new THREE.MeshStandardMaterial({
  color: 0xff8844,
  emissive: 0xff4400,
  emissiveIntensity: 0.4,
  side: THREE.DoubleSide,
});
const fox = new THREE.Mesh(foxGeo, foxMat);
fox.position.set(2, 1, -20);
fox.rotation.y = Math.PI / 2;
fox.userData = { type: 'fox', text: 'Alien Kind – Fox spirits shift identity, crossing boundaries between human and other. In the liminal space of KWC, identity itself becomes fluid, questioning what it means to belong.' };
scene.add(fox);

// Make fox face camera (billboard effect) - will update in animate loop

// ============================================
// FPS CONTROLS (WASD + Mouse Look)
// ============================================
const moveSpeed = 0.1;
const lookSpeed = 0.002;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let isPointerLocked = false;
let euler = new THREE.Euler(0, 0, 0, 'YXZ');
let velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// Movement keys
const keys: { [key: string]: boolean } = {};

window.addEventListener('keydown', (event) => {
  keys[event.code] = true;
  if (event.code === 'KeyW') moveForward = true;
  if (event.code === 'KeyS') moveBackward = true;
  if (event.code === 'KeyA') moveLeft = true;
  if (event.code === 'KeyD') moveRight = true;
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
  if (event.code === 'KeyW') moveForward = false;
  if (event.code === 'KeyS') moveBackward = false;
  if (event.code === 'KeyA') moveLeft = false;
  if (event.code === 'KeyD') moveRight = false;
  
  // Interaction key
  if (event.code === 'KeyE') {
    checkInteraction();
  }
});

// Pointer lock for mouse look
canvas.addEventListener('click', () => {
  if (!isPointerLocked) {
    canvas.requestPointerLock();
  }
});

const instructions = document.getElementById('instructions') as HTMLDivElement;

document.addEventListener('pointerlockchange', () => {
  isPointerLocked = document.pointerLockElement === canvas;
  if (isPointerLocked && instructions) {
    instructions.classList.add('hidden');
  }
});

// Mouse movement for camera rotation
document.addEventListener('mousemove', (event) => {
  if (!isPointerLocked) return;

  euler.setFromQuaternion(camera.quaternion);
  euler.y -= event.movementX * lookSpeed;
  euler.x -= event.movementY * lookSpeed;
  euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x));
  camera.quaternion.setFromEuler(euler);
});

// ============================================
// INTERACTION SYSTEM
// ============================================
const raycaster = new THREE.Raycaster();
const popup = document.getElementById('popup') as HTMLDivElement;
const popupText = document.getElementById('popup-text') as HTMLDivElement;
const popupClose = document.getElementById('popup-close') as HTMLButtonElement;

function checkInteraction(): void {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects([scroll, fox], false);
  
  if (intersects.length > 0) {
    const obj = intersects[0].object;
    const distance = intersects[0].distance;
    // Only interact if within 3 units
    if (distance < 3 && obj.userData.text) {
      showPopup(obj.userData.text);
    }
  }
}

function showPopup(text: string): void {
  if (popup && popupText) {
    popupText.textContent = text;
    popup.style.display = 'flex';
    document.exitPointerLock();
  }
}

if (popupClose) {
  popupClose.addEventListener('click', () => {
    if (popup) {
      popup.style.display = 'none';
      canvas.requestPointerLock();
    }
  });
}

// ============================================
// ANIMATION LOOP
// ============================================
function animate(): void {
  requestAnimationFrame(animate);

  // Movement
  velocity.x -= velocity.x * 0.1;
  velocity.z -= velocity.z * 0.1;

  direction.z = Number(moveForward) - Number(moveBackward);
  direction.x = Number(moveRight) - Number(moveLeft);
  direction.normalize();

  if (moveForward || moveBackward) velocity.z -= direction.z * moveSpeed;
  if (moveLeft || moveRight) velocity.x -= direction.x * moveSpeed;

  // Apply movement relative to camera direction
  const moveVector = new THREE.Vector3();
  moveVector.set(velocity.x, 0, velocity.z);
  moveVector.applyQuaternion(camera.quaternion);
  camera.position.add(moveVector);

  // Constrain player to corridor bounds
  camera.position.x = Math.max(-4, Math.min(4, camera.position.x));
  camera.position.z = Math.max(0, Math.min(-35, camera.position.z));

  // Make fox face camera (billboard)
  fox.lookAt(camera.position);

  // Rotate scroll slightly for atmosphere
  scroll.rotation.y += 0.01;

  renderer.render(scene, camera);
}

// Resize handler
window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

animate();
