import * as THREE from 'three';

// ============================================
// KOWLOON WALLED CITY - ENDLESS CLIMBER
// A tourist racing against demolition (1993)
// ============================================

const canvas = document.getElementById('bg') as HTMLCanvasElement;
if (!canvas) {
  console.error('Canvas not found!');
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1520);
scene.fog = new THREE.Fog(0x1a1520, 30, 120);

// Game state
let gameOver = false;
let gameStarted = false;
let demolitionHeight = -20;
const DEMOLITION_SPEED = 0.007;
let highestPlatformY = 0;
let scrollsCollected = 0;
let mouseX = 0;
let mouseY = 0;

// ============================================
// CAMERA
// ============================================
const aspect = window.innerWidth / window.innerHeight;
const viewSize = 18;
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect,
  viewSize * aspect,
  viewSize,
  -viewSize,
  0.1,
  1000
);
camera.position.set(30, 20, 35);
camera.lookAt(0, 10, 0);

// ============================================
// RENDERER
// ============================================
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// ============================================
// LIGHTING
// ============================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xfff8e0, 1.5);
mainLight.position.set(25, 40, 20);
mainLight.castShadow = true;
mainLight.shadow.camera.left = -60;
mainLight.shadow.camera.right = 60;
mainLight.shadow.camera.top = 60;
mainLight.shadow.camera.bottom = -60;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

// Neon accent lights
const neonPink = new THREE.PointLight(0xff1493, 2, 40);
neonPink.position.set(-10, 25, 5);
scene.add(neonPink);

const neonCyan = new THREE.PointLight(0x00ffff, 2, 40);
neonCyan.position.set(10, 30, 8);
scene.add(neonCyan);

const explosionLight = new THREE.PointLight(0xff4400, 4, 60);
explosionLight.position.set(0, -5, 15);
scene.add(explosionLight);

// ============================================
// TEXTURES
// ============================================
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'anonymous';

const brickTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1611252441948-9f97c18f6f0e?w=512',
  (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
  }
);

const windowTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=512',
  (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
  }
);

const metalTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=512',
  (texture) => {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
  }
);

const scrollTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1509266272358-7701da638078?w=256'
);

// ============================================
// PLAYER CHARACTER
// ============================================
const playerGroup = new THREE.Group();

// Body
const bodyGeo = new THREE.BoxGeometry(0.6, 0.9, 0.4);
const bodyMat = new THREE.MeshStandardMaterial({
  color: 0x2a4a7a,
  roughness: 0.6,
  metalness: 0.3
});
const body = new THREE.Mesh(bodyGeo, bodyMat);
body.position.set(0, 0.5, 0);
body.castShadow = true;
playerGroup.add(body);

// Head
const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.4);
const headMat = new THREE.MeshStandardMaterial({
  color: 0xffd4a3,
  roughness: 0.8
});
const head = new THREE.Mesh(headGeo, headMat);
head.position.set(0, 1.2, 0);
head.castShadow = true;
playerGroup.add(head);

// Legs
const legGeo = new THREE.BoxGeometry(0.22, 0.7, 0.22);
const legMat = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.7
});
const leftLeg = new THREE.Mesh(legGeo, legMat);
leftLeg.position.set(-0.18, -0.3, 0);
leftLeg.castShadow = true;
playerGroup.add(leftLeg);

const rightLeg = new THREE.Mesh(legGeo, legMat);
rightLeg.position.set(0.18, -0.3, 0);
rightLeg.castShadow = true;
playerGroup.add(rightLeg);

// Arms
const armGeo = new THREE.BoxGeometry(0.18, 0.7, 0.18);
const armMat = new THREE.MeshStandardMaterial({
  color: 0xffd4a3,
  roughness: 0.8
});
const leftArm = new THREE.Mesh(armGeo, armMat);
leftArm.position.set(-0.42, 0.6, 0);
leftArm.castShadow = true;
playerGroup.add(leftArm);

const rightArm = new THREE.Mesh(armGeo, armMat);
rightArm.position.set(0.42, 0.6, 0);
rightArm.castShadow = true;
playerGroup.add(rightArm);

// Eyes
const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
const eyeMat = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  emissive: 0x00ffff,
  emissiveIntensity: 1.5
});
const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
leftEye.position.set(-0.12, 1.25, 0.21);
playerGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
rightEye.position.set(0.12, 1.25, 0.21);
playerGroup.add(rightEye);

playerGroup.position.set(0, 3, 0);
scene.add(playerGroup);

const playerParts = { leftLeg, rightLeg, leftArm, rightArm, body, head };

interface Player {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  onGround: boolean;
  width: number;
  height: number;
  depth: number;
}

const player: Player = {
  mesh: playerGroup,
  velocity: new THREE.Vector3(0, 0, 0),
  onGround: false,
  width: 0.8,
  height: 1.8,
  depth: 0.6
};

let walkCycle = 0;

// ============================================
// PLATFORMS (Kowloon Buildings)
// ============================================
interface Platform {
  mesh: THREE.Group;
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  shaking: boolean;
  shakeTime: number;
  falling: boolean;
  fallSpeed: number;
  originalY: number;
  originalX: number;
}

const platforms: Platform[] = [];

function createKowloonPlatform(x: number, y: number, width: number, depth: number): Platform {
  const platformGroup = new THREE.Group();

  // Main platform (rooftop)
  const roofHeight = 0.4;
  const roofGeo = new THREE.BoxGeometry(width, roofHeight, depth);
  const roofMat = new THREE.MeshStandardMaterial({
    map: metalTexture,
    color: 0x555555,
    roughness: 0.8,
    metalness: 0.3
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 0, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  platformGroup.add(roof);

  // Building walls below (make it look like a rooftop)
  const wallHeight = 6;
  const wallGeo = new THREE.BoxGeometry(width - 0.5, wallHeight, depth - 0.5);
  const wallMat = new THREE.MeshStandardMaterial({
    map: brickTexture,
    color: 0x8b7355,
    roughness: 0.9
  });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, -wallHeight / 2 - roofHeight / 2, 0);
  wall.castShadow = true;
  wall.receiveShadow = true;
  platformGroup.add(wall);

  // Add windows to walls
  const windowRows = 2;
  const windowCols = Math.floor(width / 2);
  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < windowCols; col++) {
      const windowGeo = new THREE.PlaneGeometry(0.6, 0.8);
      const isLit = Math.random() > 0.5;
      const windowMat = new THREE.MeshStandardMaterial({
        color: isLit ? 0xffffaa : 0x222222,
        emissive: isLit ? 0xffff88 : 0x000000,
        emissiveIntensity: isLit ? 0.8 : 0
      });
      const window1 = new THREE.Mesh(windowGeo, windowMat);
      window1.position.set(
        -width / 2 + 1 + col * 1.5,
        -1 - row * 2,
        depth / 2 + 0.01
      );
      platformGroup.add(window1);

      // Back windows
      const window2 = new THREE.Mesh(windowGeo, windowMat.clone());
      window2.position.set(
        -width / 2 + 1 + col * 1.5,
        -1 - row * 2,
        -depth / 2 - 0.01
      );
      window2.rotation.y = Math.PI;
      platformGroup.add(window2);
    }
  }

  // AC units and clutter on rooftop
  if (Math.random() > 0.4) {
    const acGeo = new THREE.BoxGeometry(0.8, 0.5, 0.6);
    const acMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    const ac = new THREE.Mesh(acGeo, acMat);
    ac.position.set(
      (Math.random() - 0.5) * (width - 1),
      roofHeight / 2 + 0.25,
      (Math.random() - 0.5) * (depth - 1)
    );
    ac.castShadow = true;
    platformGroup.add(ac);
  }

  // Neon signs
  if (Math.random() > 0.6) {
    const signGeo = new THREE.PlaneGeometry(1.5, 0.5);
    const signColor = Math.random() > 0.5 ? 0xff1493 : 0x00ffff;
    const signMat = new THREE.MeshStandardMaterial({
      color: signColor,
      emissive: signColor,
      emissiveIntensity: 2,
      side: THREE.DoubleSide
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 0.8, depth / 2);
    platformGroup.add(sign);

    // Add point light for neon glow
    const signLight = new THREE.PointLight(signColor, 1.5, 8);
    signLight.position.set(0, 0.8, depth / 2 + 0.5);
    platformGroup.add(signLight);
  }

  platformGroup.position.set(x, y, 0);
  scene.add(platformGroup);

  const platform: Platform = {
    mesh: platformGroup,
    bounds: {
      minX: x - width / 2,
      maxX: x + width / 2,
      minY: y - roofHeight / 2,
      maxY: y + roofHeight / 2,
      minZ: -depth / 2,
      maxZ: depth / 2
    },
    shaking: false,
    shakeTime: 0,
    falling: false,
    fallSpeed: 0,
    originalY: y,
    originalX: x
  };

  platforms.push(platform);
  return platform;
}

// Starting platform
createKowloonPlatform(0, 0, 14, 10);

// Procedural generation - more spaced out for hopping
function generatePlatformCluster(startY: number): void {
  const platformsInCluster = 4 + Math.floor(Math.random() * 2);
  let lastX = (Math.random() - 0.5) * 12;

  for (let i = 0; i < platformsInCluster; i++) {
    const yGap = 4 + Math.random() * 3; // Much bigger vertical gaps
    const y = startY + i * yGap;
    const xOffset = (Math.random() - 0.5) * 16; // Wider horizontal spread
    const x = lastX + xOffset;
    const width = 6 + Math.random() * 3;
    const depth = 8 + Math.random() * 2;

    createKowloonPlatform(x, y, width, depth);

    if (y > highestPlatformY) {
      highestPlatformY = y;
    }

    lastX = x;
  }
}

// Generate initial platforms
for (let i = 0; i < 15; i++) {
  generatePlatformCluster(i * 18 + 8);
}

// ============================================
// DEMOLITION EXPLOSION
// ============================================
const explosionGeo = new THREE.PlaneGeometry(400, 60);
const explosionMat = new THREE.MeshStandardMaterial({
  color: 0xff5500,
  emissive: 0xff3300,
  emissiveIntensity: 2,
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide
});
const demolitionWave = new THREE.Mesh(explosionGeo, explosionMat);
demolitionWave.rotation.x = Math.PI / 2;
demolitionWave.position.set(0, demolitionHeight, 0);
scene.add(demolitionWave);

// Explosion particles
const dustParticles: THREE.Mesh[] = [];
const debrisParticles: THREE.Mesh[] = [];

const dustGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
for (let i = 0; i < 60; i++) {
  const isFlame = i % 3 === 0;
  const dustMat = new THREE.MeshStandardMaterial({
    color: isFlame ? 0xff6600 : 0x666666,
    emissive: isFlame ? 0xff4400 : 0x000000,
    emissiveIntensity: isFlame ? 1.2 : 0,
    transparent: true,
    opacity: 0.7
  });
  const dust = new THREE.Mesh(dustGeo, dustMat);
  dust.position.set(
    (Math.random() - 0.5) * 80,
    demolitionHeight + Math.random() * 15,
    (Math.random() - 0.5) * 20
  );
  scene.add(dust);
  dustParticles.push(dust);
}

const debrisGeo = new THREE.BoxGeometry(1, 0.7, 0.8);
for (let i = 0; i < 40; i++) {
  const debrisMat = new THREE.MeshStandardMaterial({
    map: brickTexture,
    color: 0x666666,
    roughness: 0.9
  });
  const debris = new THREE.Mesh(debrisGeo, debrisMat);
  debris.position.set(
    (Math.random() - 0.5) * 70,
    demolitionHeight + Math.random() * 12,
    (Math.random() - 0.5) * 15
  );
  debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  debris.castShadow = true;
  scene.add(debris);
  debrisParticles.push(debris);
}

// ============================================
// SCROLLS
// ============================================
interface Scroll {
  mesh: THREE.Mesh;
  collected: boolean;
  text: string;
  id: number;
  light: THREE.PointLight;
}

const scrolls: Scroll[] = [];

const scrollTexts = [
  "1841: Kowloon Walled City becomes a Chinese military outpost. Neither British Hong Kong nor Qing China fully claims it.",
  "1898: British lease the New Territories but exclude the Walled City. A legal void is born.",
  "1933: 436 structures house 2,000 people. Building permits? None. The city builds itself.",
  "1950s: Refugees from civil war flood in. Population explodes. Doctors, dentists, factories—all unlicensed.",
  "1973: 350+ buildings, 14 stories high. 33,000 people in 6.5 acres. Corridors narrow to 1 meter.",
  "1980s: The Triad controls crime, but residents form their own community. Schools, clinics, temples.",
  "1987: British and China agree: demolish it. The city has 6 years. You're here in its final days.",
  "1993: Demolition begins. Residents scatter. But the memory persists in photos, stories, games.",
  "Judge Bao's temple survives—the only structure saved. Justice outlasts the city.",
  "Today: A park stands where chaos thrived. But in digital space, Kowloon lives forever."
];

function createScroll(x: number, y: number, id: number): Scroll {
  const geometry = new THREE.PlaneGeometry(0.8, 1.1);
  const material = new THREE.MeshStandardMaterial({
    map: scrollTexture,
    emissive: 0xffcc66,
    emissiveIntensity: 0.6,
    transparent: true,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  scene.add(mesh);

  const light = new THREE.PointLight(0xffcc66, 2, 10);
  light.position.set(x, y, 0.5);
  scene.add(light);

  const scroll: Scroll = {
    mesh,
    collected: false,
    text: scrollTexts[id % scrollTexts.length],
    id,
    light
  };

  scrolls.push(scroll);
  return scroll;
}

// Spawn initial scrolls
let scrollIdCounter = 0;
for (let i = 0; i < 6; i++) {
  const x = (Math.random() - 0.5) * 20;
  const y = 12 + i * 25;
  createScroll(x, y, scrollIdCounter++);
}

// ============================================
// INPUT
// ============================================
const keys = { left: false, right: false, jump: false };

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if ((e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') && player.onGround) {
    keys.jump = true;
  }
  if (!gameStarted) startGame();
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
});

// Mouse tracking for character rotation
window.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

// ============================================
// UI
// ============================================
const instructions = document.getElementById('instructions') as HTMLDivElement;
const scrollCounter = document.getElementById('scroll-counter') as HTMLDivElement;
const popup = document.getElementById('popup') as HTMLDivElement;
const popupText = document.getElementById('popup-text') as HTMLDivElement;
const popupClose = document.getElementById('popup-close') as HTMLButtonElement;
const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;

function startGame(): void {
  if (!gameStarted && instructions) {
    instructions.classList.add('hidden');
    gameStarted = true;
  }
}

function restartGame(): void {
  window.location.reload();
}

canvas.addEventListener('click', startGame);
if (instructions) instructions.addEventListener('click', startGame);
if (restartBtn) restartBtn.addEventListener('click', restartGame);

if (popupClose) {
  popupClose.addEventListener('click', () => {
    if (popup) popup.style.display = 'none';
  });
}

function showPopup(text: string): void {
  if (popup && popupText) {
    popupText.textContent = text;
    popup.style.display = 'flex';
  }
}

function updateUI(): void {
  if (scrollCounter) {
    const height = Math.max(0, Math.floor(player.mesh.position.y));
    scrollCounter.textContent = `HEIGHT: ${height}m | SCROLLS: ${scrollsCollected}`;
  }
}

function showGameOver(): void {
  if (popup && popupText) {
    const height = Math.max(0, Math.floor(player.mesh.position.y));
    popupText.innerHTML = `
      <h2 style="color: #ff3300; margin-bottom: 20px; font-size: 2rem;">DEMOLISHED</h2>
      <p style="font-size: 1.2rem;">Height reached: <strong>${height} meters</strong></p>
      <p style="font-size: 1.2rem;">Historical fragments: <strong>${scrollsCollected}</strong></p>
      <p style="margin-top: 30px; font-style: italic; color: #aaaaaa;">
        "On March 23, 1993, demolition of Kowloon Walled City began.<br>
        By April 1994, it was gone—33,000 stories scattered to history."
      </p>
      <p style="margin-top: 20px;"><strong>Click RESTART to climb again</strong></p>
    `;
    popup.style.display = 'flex';
  }
}

// ============================================
// PHYSICS
// ============================================
const GRAVITY = -0.7;
const MOVE_SPEED = 0.35;
const JUMP_FORCE = 22; // Higher for bigger gaps
const MAX_FALL_SPEED = -1.3;

function updatePhysics(): void {
  if (gameOver) return;

  // Gravity
  player.velocity.y += GRAVITY * 0.016;
  if (player.velocity.y < MAX_FALL_SPEED) {
    player.velocity.y = MAX_FALL_SPEED;
  }

  // Movement
  if (keys.left) {
    player.velocity.x = -MOVE_SPEED;
  } else if (keys.right) {
    player.velocity.x = MOVE_SPEED;
  } else {
    player.velocity.x *= 0.85;
  }

  // Walking animation
  const isMoving = Math.abs(player.velocity.x) > 0.01;
  if (isMoving && player.onGround) {
    walkCycle += 0.25;
    const swing = Math.sin(walkCycle) * 0.4;
    playerParts.leftLeg.rotation.x = swing;
    playerParts.rightLeg.rotation.x = -swing;
    playerParts.leftArm.rotation.x = -swing * 0.6;
    playerParts.rightArm.rotation.x = swing * 0.6;
    playerParts.body.position.y = 0.5 + Math.abs(Math.sin(walkCycle)) * 0.08;
  } else {
    playerParts.leftLeg.rotation.x = 0;
    playerParts.rightLeg.rotation.x = 0;
    playerParts.leftArm.rotation.x = 0;
    playerParts.rightArm.rotation.x = 0;
    playerParts.body.position.y = 0.5;
  }

  // Rotate character to face cursor
  const targetRotation = Math.atan2(mouseX * 10, 1);
  player.mesh.rotation.y += (targetRotation - player.mesh.rotation.y) * 0.1;

  // Jump
  if (keys.jump && player.onGround) {
    player.velocity.y = JUMP_FORCE * 0.016;
    player.onGround = false;
    keys.jump = false;
  }

  // Collision detection
  const testX = player.mesh.position.x + player.velocity.x;
  const testY = player.mesh.position.y + player.velocity.y;
  player.onGround = false;

  for (const platform of platforms) {
    if (platform.falling) continue;

    const b = platform.bounds;
    const collideX = testX + player.width / 2 > b.minX && testX - player.width / 2 < b.maxX;
    const collideZ = player.mesh.position.z + player.depth / 2 > b.minZ &&
                     player.mesh.position.z - player.depth / 2 < b.maxZ;

    if (collideX && collideZ) {
      if (player.velocity.y <= 0 && player.mesh.position.y >= b.maxY && testY < b.maxY + player.height / 2) {
        player.mesh.position.y = b.maxY + player.height / 2;
        player.velocity.y = 0;
        player.onGround = true;

        if (!platform.shaking && demolitionHeight > b.minY - 20) {
          platform.shaking = true;
          platform.shakeTime = 0;
        }
      }
    }
  }

  player.mesh.position.x = testX;
  if (!player.onGround) {
    player.mesh.position.y = testY;
  }

  // Check if caught by demolition
  if (player.mesh.position.y < demolitionHeight + 4) {
    gameOver = true;
    showGameOver();
    return;
  }

  // Scroll collection
  for (const scroll of scrolls) {
    if (!scroll.collected) {
      const dist = player.mesh.position.distanceTo(scroll.mesh.position);
      if (dist < 2) {
        scroll.collected = true;
        scroll.mesh.visible = false;
        scroll.light.intensity = 0;
        scrollsCollected++;
        showPopup(scroll.text);
      }
      scroll.mesh.rotation.y += 0.03;
      scroll.mesh.position.y += Math.sin(Date.now() * 0.001 + scroll.id) * 0.012;
    }
  }

  // Generate new platforms
  if (player.mesh.position.y > highestPlatformY - 60) {
    generatePlatformCluster(highestPlatformY + 15);

    if (Math.random() > 0.4 && scrollIdCounter < scrollTexts.length * 2) {
      const x = (Math.random() - 0.5) * 20;
      createScroll(x, highestPlatformY - 8, scrollIdCounter++);
    }
  }

  updateUI();
}

// ============================================
// UPDATE DEMOLITION
// ============================================
function updateDemolition(): void {
  if (gameOver || !gameStarted) return;

  demolitionHeight += DEMOLITION_SPEED;
  demolitionWave.position.y = demolitionHeight;
  explosionLight.position.y = demolitionHeight + 20;

  // Pulsing explosion
  const pulse = Math.sin(Date.now() * 0.004) * 0.4 + 0.6;
  explosionMat.emissiveIntensity = 1.8 + pulse * 0.8;

  // Animate particles
  for (const dust of dustParticles) {
    dust.position.y = demolitionHeight + 8 + Math.random() * 18;
    dust.position.x += (Math.random() - 0.5) * 0.5;
    dust.position.z += (Math.random() - 0.5) * 0.4;
    dust.rotation.x += 0.05;
    dust.rotation.y += 0.07;
  }

  for (const debris of debrisParticles) {
    debris.position.y = demolitionHeight + 3 + Math.random() * 15;
    debris.position.x += (Math.random() - 0.5) * 0.6;
    debris.position.z += (Math.random() - 0.5) * 0.5;
    debris.rotation.x += 0.1;
    debris.rotation.y += 0.12;
    debris.rotation.z += 0.06;
  }

  // Update platforms
  for (let i = platforms.length - 1; i >= 0; i--) {
    const plat = platforms[i];

    if (!plat.shaking && !plat.falling && demolitionHeight > plat.bounds.minY - 20) {
      plat.shaking = true;
      plat.shakeTime = 0;
    }

    if (plat.shaking && !plat.falling) {
      plat.shakeTime += 0.016;
      const shakeIntensity = Math.min(plat.shakeTime * 0.4, 0.2);
      plat.mesh.position.x = plat.originalX + (Math.random() - 0.5) * shakeIntensity;
      plat.mesh.rotation.z = (Math.random() - 0.5) * shakeIntensity * 0.4;

      if (plat.shakeTime > 3 || demolitionHeight > plat.bounds.minY - 2) {
        plat.falling = true;
        plat.fallSpeed = 0;
      }
    }

    if (plat.falling) {
      plat.fallSpeed += 0.018;
      plat.mesh.position.y -= plat.fallSpeed;
      plat.mesh.rotation.x += 0.025;
      plat.mesh.rotation.z += 0.035;

      plat.mesh.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.opacity = Math.max(0, 1 - plat.fallSpeed * 2);
          child.material.transparent = true;
        }
      });
    }

    if (plat.mesh.position.y < demolitionHeight - 25) {
      scene.remove(plat.mesh);
      platforms.splice(i, 1);
    }
  }
}

// ============================================
// CAMERA FOLLOW
// ============================================
function updateCamera(): void {
  const targetX = player.mesh.position.x;
  const targetY = player.mesh.position.y + 8;

  camera.position.x += (targetX + 30 - camera.position.x) * 0.06;
  camera.position.y += (targetY + 12 - camera.position.y) * 0.06;

  camera.lookAt(targetX, targetY, 0);
}

// ============================================
// GAME LOOP
// ============================================
function animate(): void {
  requestAnimationFrame(animate);

  updatePhysics();
  updateDemolition();
  updateCamera();

  renderer.render(scene, camera);
}

// ============================================
// RESIZE
// ============================================
window.addEventListener('resize', () => {
  const { innerWidth, innerHeight } = window;
  const aspect = innerWidth / innerHeight;
  const viewSize = 18;

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
updateUI();
renderer.render(scene, camera);
animate();
