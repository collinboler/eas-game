import * as THREE from 'three';

// ============================================
// KOWLOON BACKROOMS: 2.5D PLATFORMER
// Inspired by actual Kowloon Walled City
// ============================================

const canvas = document.getElementById('bg') as HTMLCanvasElement;
if (!canvas) {
  console.error('Canvas not found!');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d0d);
scene.fog = new THREE.Fog(0x0d0d0d, 15, 60);

// ============================================
// 2.5D CAMERA - ANGLED SIDE VIEW
// ============================================
const aspect = window.innerWidth / window.innerHeight;
const viewSize = 12;
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect,
  viewSize * aspect,
  viewSize,
  -viewSize,
  0.1,
  1000
);

// Position camera at an angle (2.5D perspective like the reference)
camera.position.set(20, 12, 25);
camera.lookAt(0, 5, 0);

// ============================================
// RENDERER
// ============================================
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(window.devicePixelRatio ?? 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ============================================
// TEXTURE LOADER - GRITTY KOWLOON TEXTURES
// ============================================
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'anonymous';

// Dirty concrete walls
const wallTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1024',
  (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
  }
);

// Rusty metal for pipes and structures
const metalTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1024',
  (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
  }
);

// Grimy floor
const floorTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1516655855035-d5215bcb5604?w=1024',
  (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 6);
  }
);

// Old paper for scrolls
const scrollTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1509266272358-7701da638078?w=512'
);

// ============================================
// LIGHTING - DIM, OPPRESSIVE, FLUORESCENT
// ============================================
const ambientLight = new THREE.AmbientLight(0x302010, 0.3);
scene.add(ambientLight);

// Dim overhead fluorescent lights (yellowish, sickly)
const light1 = new THREE.PointLight(0xffeecc, 0.8, 30);
light1.position.set(-10, 10, 5);
light1.castShadow = true;
scene.add(light1);

const light2 = new THREE.PointLight(0xffeecc, 0.6, 25);
light2.position.set(10, 10, 5);
light2.castShadow = true;
scene.add(light2);

const light3 = new THREE.PointLight(0xffddaa, 0.7, 25);
light3.position.set(25, 12, 5);
light3.castShadow = true;
scene.add(light3);

// Accent neon (sparse - just hints)
const neonPink = new THREE.PointLight(0xff1a66, 1.5, 15);
neonPink.position.set(-15, 8, 8);
scene.add(neonPink);

const neonCyan = new THREE.PointLight(0x00ddff, 1.2, 15);
neonCyan.position.set(30, 7, 8);
scene.add(neonCyan);

// ============================================
// PLAYER
// ============================================
interface Player {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  onGround: boolean;
  width: number;
  height: number;
  depth: number;
}

const playerGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
const playerMaterial = new THREE.MeshStandardMaterial({
  color: 0xff3366,
  emissive: 0xff0033,
  emissiveIntensity: 0.3,
  roughness: 0.7
});
const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
playerMesh.position.set(-20, 1, 0);
playerMesh.castShadow = true;
scene.add(playerMesh);

const player: Player = {
  mesh: playerMesh,
  velocity: new THREE.Vector3(0, 0, 0),
  onGround: false,
  width: 0.8,
  height: 1.6,
  depth: 0.8
};

// ============================================
// KOWLOON ENVIRONMENT - DENSE & LAYERED
// ============================================
interface Platform {
  mesh: THREE.Mesh;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
}

const platforms: Platform[] = [];
const allMeshes: THREE.Mesh[] = [];

function createPlatform(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  texture?: THREE.Texture
): Platform {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    map: texture || wallTexture,
    roughness: 0.95,
    metalness: 0.05
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  scene.add(mesh);
  allMeshes.push(mesh);

  const platform: Platform = {
    mesh,
    bounds: {
      minX: x - width / 2,
      maxX: x + width / 2,
      minY: y - height / 2,
      maxY: y + height / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2
    }
  };
  platforms.push(platform);
  return platform;
}

function createBox(
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  color: number,
  texture?: THREE.Texture
): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    color: texture ? 0xffffff : color,
    roughness: 0.9,
    metalness: texture ? 0.1 : 0.3
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  allMeshes.push(mesh);
  return mesh;
}

// Main floor
createPlatform(0, -1, 0, 80, 0.5, 20, floorTexture);

// Create multi-level platforms (like narrow Kowloon corridors)
createPlatform(-20, 2, 0, 6, 0.4, 8);
createPlatform(-12, 5, 0, 8, 0.4, 8);
createPlatform(-3, 8, 0, 7, 0.4, 8);
createPlatform(6, 6, 0, 9, 0.4, 8);
createPlatform(16, 9, 0, 8, 0.4, 8);
createPlatform(26, 5, 0, 10, 0.4, 8);
createPlatform(38, 3, 0, 8, 0.4, 8);

// Back walls (creating corridor depth)
createBox(-20, 6, -4, 6, 12, 0.3, 0x3a3a3a, wallTexture);
createBox(-12, 8, -4, 8, 16, 0.3, 0x3a3a3a, wallTexture);
createBox(-3, 11, -4, 7, 22, 0.3, 0x3a3a3a, wallTexture);
createBox(6, 9, -4, 9, 18, 0.3, 0x3a3a3a, wallTexture);
createBox(16, 12, -4, 8, 24, 0.3, 0x3a3a3a, wallTexture);
createBox(26, 8, -4, 10, 16, 0.3, 0x3a3a3a, wallTexture);
createBox(38, 6, -4, 8, 12, 0.3, 0x3a3a3a, wallTexture);

// Front walls/barriers
createBox(-20, 6, 4, 6, 12, 0.3, 0x2a2a2a, wallTexture);
createBox(-12, 8, 4, 8, 16, 0.3, 0x2a2a2a, wallTexture);
createBox(-3, 11, 4, 7, 22, 0.3, 0x2a2a2a, wallTexture);
createBox(6, 9, 4, 9, 18, 0.3, 0x2a2a2a, wallTexture);
createBox(16, 12, 4, 8, 24, 0.3, 0x2a2a2a, wallTexture);
createBox(26, 8, 4, 10, 16, 0.3, 0x2a2a2a, wallTexture);

// Vertical supports and obstacles
createPlatform(-16, 4, 0, 0.5, 8, 4);
createPlatform(-7, 6, 0, 0.5, 12, 4);
createPlatform(2, 7, 0, 0.5, 14, 4);
createPlatform(11, 8, 0, 0.5, 16, 4);
createPlatform(21, 7, 0, 0.5, 14, 4);
createPlatform(32, 4, 0, 0.5, 8, 4);

// ============================================
// DENSE KOWLOON DETAILS - PIPES, WIRES, AC UNITS
// ============================================

// Horizontal pipes along corridors
for (let i = 0; i < 10; i++) {
  const pipeGeo = new THREE.CylinderGeometry(0.15, 0.15, 40, 8);
  const pipeMat = new THREE.MeshStandardMaterial({
    map: metalTexture,
    metalness: 0.6,
    roughness: 0.8,
    color: 0x555555
  });
  const pipe = new THREE.Mesh(pipeGeo, pipeMat);
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(0, 11 + i * 0.6, -3.5 + Math.random() * 0.5);
  pipe.castShadow = true;
  scene.add(pipe);
  allMeshes.push(pipe);
}

// Vertical pipes
for (let i = 0; i < 12; i++) {
  const pipeGeo = new THREE.CylinderGeometry(0.12, 0.12, 15, 6);
  const pipeMat = new THREE.MeshStandardMaterial({
    color: 0x444444,
    metalness: 0.7,
    roughness: 0.7
  });
  const pipe = new THREE.Mesh(pipeGeo, pipeMat);
  pipe.position.set(-25 + i * 5 + Math.random(), 7.5, -3 + Math.random() * 2);
  pipe.castShadow = true;
  scene.add(pipe);
  allMeshes.push(pipe);
}

// Hanging wires (lots of them - iconic Kowloon)
for (let i = 0; i < 25; i++) {
  const wireGeo = new THREE.CylinderGeometry(0.03, 0.03, 10 + Math.random() * 5, 4);
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const wire = new THREE.Mesh(wireGeo, wireMat);
  wire.position.set(-25 + i * 3, 14, -3 + Math.random() * 6);
  wire.rotation.z = (Math.random() - 0.5) * 0.3;
  scene.add(wire);
  allMeshes.push(wire);
}

// Air conditioner units (everywhere - Kowloon hallmark)
for (let i = 0; i < 15; i++) {
  const acGeo = new THREE.BoxGeometry(1.2, 0.8, 0.6);
  const acMat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    metalness: 0.4,
    roughness: 0.6
  });
  const ac = new THREE.Mesh(acGeo, acMat);
  ac.position.set(-25 + i * 4, 8 + Math.random() * 4, 4.2);
  ac.castShadow = true;
  scene.add(ac);
  allMeshes.push(ac);

  // AC exhaust vents
  const ventGeo = new THREE.BoxGeometry(0.3, 0.6, 0.1);
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const vent = new THREE.Mesh(ventGeo, ventMat);
  vent.position.copy(ac.position);
  vent.position.z += 0.35;
  scene.add(vent);
  allMeshes.push(vent);
}

// Ventilation ducts
for (let i = 0; i < 8; i++) {
  const ductGeo = new THREE.BoxGeometry(0.8, 0.6, 3);
  const ductMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    metalness: 0.5
  });
  const duct = new THREE.Mesh(ductGeo, ductMat);
  duct.position.set(-22 + i * 6, 13, 2);
  duct.castShadow = true;
  scene.add(duct);
  allMeshes.push(duct);
}

// Small neon signs
const neonSignGeo = new THREE.PlaneGeometry(2, 0.8);
const neonMat1 = new THREE.MeshStandardMaterial({
  color: 0xff1a66,
  emissive: 0xff1a66,
  emissiveIntensity: 1.2,
  side: THREE.DoubleSide
});
const neonSign1 = new THREE.Mesh(neonSignGeo, neonMat1);
neonSign1.position.set(-15, 7, 7.5);
neonSign1.rotation.y = -0.3;
scene.add(neonSign1);
allMeshes.push(neonSign1);

const neonMat2 = new THREE.MeshStandardMaterial({
  color: 0x00ddff,
  emissive: 0x00ddff,
  emissiveIntensity: 1.2,
  side: THREE.DoubleSide
});
const neonSign2 = new THREE.Mesh(neonSignGeo, neonMat2);
neonSign2.position.set(30, 6, 7.5);
neonSign2.rotation.y = -0.3;
scene.add(neonSign2);
allMeshes.push(neonSign2);

// Random debris boxes
for (let i = 0; i < 10; i++) {
  const size = 0.3 + Math.random() * 0.5;
  const debris = createBox(
    -25 + Math.random() * 60,
    -0.5 + size / 2,
    -2 + Math.random() * 4,
    size,
    size,
    size,
    0x2a2a2a
  );
}

// ============================================
// SCROLLS (COLLECTIBLES)
// ============================================
interface Scroll {
  mesh: THREE.Mesh;
  collected: boolean;
  text: string;
  id: number;
}

const scrolls: Scroll[] = [];
let scrollsCollected = 0;
const totalScrolls = 7;

function createScroll(x: number, y: number, z: number, id: number, text: string): Scroll {
  const geometry = new THREE.PlaneGeometry(0.6, 0.9);
  const material = new THREE.MeshStandardMaterial({
    map: scrollTexture,
    emissive: 0xffdd88,
    emissiveIntensity: 0.4,
    transparent: true,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = -0.5;
  scene.add(mesh);
  allMeshes.push(mesh);

  const scroll: Scroll = { mesh, collected: false, text, id };
  scrolls.push(scroll);
  return scroll;
}

// Place scrolls throughout the level
createScroll(-18, 3.5, 0, 1,
  "SCROLL 1: The Walled City existed outside law. Neither Britain nor China claimed it. In the gaps between empires, 33,000 people built their own world.");

createScroll(-10, 6.5, 0, 2,
  "SCROLL 2: Judge Bao represents justice, but in a place without jurisdiction, who has the right to judge? The law is a fiction we agree to believe.");

createScroll(-1, 9.5, 0, 3,
  "SCROLL 3: Fox spirits—huli jing—shift between forms. In Kowloon, identity itself was fluid. Human, ghost, citizen, refugee... all the same.");

createScroll(8, 7.5, 0, 4,
  "SCROLL 4: They built upward, inward, through each other's rooms. Corridors narrowed to 1 meter. The self dissolves in density.");

createScroll(18, 10.5, 0, 5,
  "SCROLL 5: The Backrooms are infinite but empty. Kowloon was finite but infinitely full. Both are labyrinths. Which is the nightmare?");

createScroll(28, 6.5, 0, 6,
  "SCROLL 6: Demolition: 1993. Residents scattered. But the ghost persists—in memory, in photographs, in games like this. A place that never fully existed.");

createScroll(40, 4.5, 0, 7,
  "SCROLL 7: You are exploring a memory of a memory. Each scroll is a fragment of something lost. This is digital archaeology. Congratulations.");

// ============================================
// INPUT
// ============================================
const keys = {
  left: false,
  right: false,
  jump: false
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
    if (player.onGround) keys.jump = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
});

// ============================================
// UI
// ============================================
const instructions = document.getElementById('instructions') as HTMLDivElement;
const scrollCounter = document.getElementById('scroll-counter') as HTMLDivElement;
const popup = document.getElementById('popup') as HTMLDivElement;
const popupText = document.getElementById('popup-text') as HTMLDivElement;
const popupClose = document.getElementById('popup-close') as HTMLButtonElement;

let hasStarted = false;

function startGame(): void {
  if (!hasStarted && instructions) {
    instructions.classList.add('hidden');
    hasStarted = true;
  }
}

canvas.addEventListener('click', startGame);

if (instructions) {
  instructions.addEventListener('click', startGame);
}

if (popupClose) {
  popupClose.addEventListener('click', () => {
    if (popup) {
      popup.style.display = 'none';
    }
  });
}

function showPopup(text: string): void {
  if (popup && popupText) {
    popupText.textContent = text;
    popup.style.display = 'flex';
  }
}

function updateScrollCounter(): void {
  if (scrollCounter) {
    scrollCounter.textContent = `SCROLLS: ${scrollsCollected}/${totalScrolls}`;
  }
}

// ============================================
// PHYSICS
// ============================================
const GRAVITY = -0.4;
const MOVE_SPEED = 0.2;
const JUMP_FORCE = 8;
const MAX_FALL_SPEED = -0.8;

function checkAABBCollision(
  aMin: THREE.Vector3,
  aMax: THREE.Vector3,
  bMin: THREE.Vector3,
  bMax: THREE.Vector3
): boolean {
  return (
    aMin.x <= bMax.x &&
    aMax.x >= bMin.x &&
    aMin.y <= bMax.y &&
    aMax.y >= bMin.y &&
    aMin.z <= bMax.z &&
    aMax.z >= bMin.z
  );
}

function updatePhysics(): void {
  player.velocity.y += GRAVITY * 0.016;
  if (player.velocity.y < MAX_FALL_SPEED) {
    player.velocity.y = MAX_FALL_SPEED;
  }

  if (keys.left) player.velocity.x = -MOVE_SPEED;
  else if (keys.right) player.velocity.x = MOVE_SPEED;
  else player.velocity.x *= 0.85;

  if (keys.jump && player.onGround) {
    player.velocity.y = JUMP_FORCE * 0.016;
    player.onGround = false;
    keys.jump = false;
  }

  const nextPos = player.mesh.position.clone().add(player.velocity);
  const playerMin = new THREE.Vector3(
    nextPos.x - player.width / 2,
    nextPos.y - player.height / 2,
    nextPos.z - player.depth / 2
  );
  const playerMax = new THREE.Vector3(
    nextPos.x + player.width / 2,
    nextPos.y + player.height / 2,
    nextPos.z + player.depth / 2
  );

  player.onGround = false;

  for (const platform of platforms) {
    const b = platform.bounds;
    const platMin = new THREE.Vector3(b.minX, b.minY, b.minZ);
    const platMax = new THREE.Vector3(b.maxX, b.maxY, b.maxZ);

    if (checkAABBCollision(playerMin, playerMax, platMin, platMax)) {
      if (player.velocity.y < 0 && player.mesh.position.y > b.maxY) {
        player.mesh.position.y = b.maxY + player.height / 2;
        player.velocity.y = 0;
        player.onGround = true;
        nextPos.y = player.mesh.position.y;
      } else if (player.velocity.y > 0 && player.mesh.position.y < b.minY) {
        player.mesh.position.y = b.minY - player.height / 2;
        player.velocity.y = 0;
        nextPos.y = player.mesh.position.y;
      } else {
        if (player.mesh.position.x < platform.mesh.position.x) {
          player.mesh.position.x = b.minX - player.width / 2;
        } else {
          player.mesh.position.x = b.maxX + player.width / 2;
        }
        player.velocity.x = 0;
        nextPos.x = player.mesh.position.x;
      }
    }
  }

  player.mesh.position.copy(nextPos);

  // Scroll collection
  for (const scroll of scrolls) {
    if (!scroll.collected) {
      const distance = player.mesh.position.distanceTo(scroll.mesh.position);
      if (distance < 1.5) {
        scroll.collected = true;
        scroll.mesh.visible = false;
        scrollsCollected++;
        updateScrollCounter();
        showPopup(scroll.text);
      }

      scroll.mesh.rotation.y += 0.015;
      scroll.mesh.position.y += Math.sin(Date.now() * 0.001 + scroll.id) * 0.008;
    }
  }
}

// ============================================
// CAMERA
// ============================================
function updateCamera(): void {
  const targetX = player.mesh.position.x;
  const targetY = player.mesh.position.y;

  camera.position.x += (targetX + 20 - camera.position.x) * 0.08;
  camera.position.y += (targetY + 7 - camera.position.y) * 0.08;

  camera.lookAt(targetX, targetY + 2, 0);
}

// ============================================
// ATMOSPHERE
// ============================================
let time = 0;
function updateAtmosphere(): void {
  time += 0.016;

  if (Math.random() > 0.96) {
    light1.intensity = 0.6 + Math.random() * 0.4;
  }
  if (Math.random() > 0.97) {
    light2.intensity = 0.4 + Math.random() * 0.4;
  }

  (neonSign1.material as THREE.MeshStandardMaterial).emissiveIntensity =
    1.0 + Math.sin(time * 2) * 0.2;
  (neonSign2.material as THREE.MeshStandardMaterial).emissiveIntensity =
    1.0 + Math.sin(time * 2.3) * 0.2;

  (player.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity =
    0.3 + Math.sin(time * 3) * 0.1;
}

// ============================================
// GAME LOOP
// ============================================
function animate(): void {
  requestAnimationFrame(animate);

  updatePhysics();
  updateCamera();
  updateAtmosphere();

  renderer.render(scene, camera);
}

// ============================================
// RESIZE
// ============================================
window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  const aspect = innerWidth / innerHeight;
  const viewSize = 12;

  camera.left = -viewSize * aspect;
  camera.right = viewSize * aspect;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();

  renderer.setSize(innerWidth, innerHeight);
});

// ============================================
// START
// ============================================
updateScrollCounter();
renderer.render(scene, camera);
animate();
