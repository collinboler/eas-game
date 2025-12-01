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
scene.background = new THREE.Color(0x2a2a2a);
scene.fog = new THREE.Fog(0x2a2a2a, 25, 100);

// Game state
let gameOver = false;
let gameStarted = false;
let demolitionHeight = -15;
const DEMOLITION_SPEED = 0.012;
let highestPlatformY = 0;
let scrollsCollected = 0;

// ============================================
// CAMERA
// ============================================
const aspect = window.innerWidth / window.innerHeight;
const viewSize = 14;
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect,
  viewSize * aspect,
  viewSize,
  -viewSize,
  0.1,
  1000
);
camera.position.set(25, 15, 30);
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
const ambientLight = new THREE.AmbientLight(0x888888, 0.7);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xfff4e6, 1.2);
mainLight.position.set(20, 30, 15);
mainLight.castShadow = true;
mainLight.shadow.camera.left = -50;
mainLight.shadow.camera.right = 50;
mainLight.shadow.camera.top = 50;
mainLight.shadow.camera.bottom = -50;
mainLight.shadow.mapSize.width = 2048;
mainLight.shadow.mapSize.height = 2048;
scene.add(mainLight);

// Accent lights
const redLight = new THREE.PointLight(0xff3300, 3, 50);
redLight.position.set(0, -5, 10);
scene.add(redLight);

const cyanLight = new THREE.PointLight(0x00ddff, 1.5, 30);
cyanLight.position.set(15, 20, 10);
scene.add(cyanLight);

// ============================================
// TEXTURES
// ============================================
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = 'anonymous';

const concreteTexture = textureLoader.load(
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=512',
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
  color: 0x3a3a3a,
  roughness: 0.7,
  metalness: 0.2
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
  color: 0x2a2a2a,
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
  color: 0xff1a66,
  emissive: 0xff1a66,
  emissiveIntensity: 1.2
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

let facingRight = true;
let walkCycle = 0;

// ============================================
// PLATFORMS
// ============================================
interface Platform {
  mesh: THREE.Mesh;
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  shaking: boolean;
  shakeTime: number;
  falling: boolean;
  fallSpeed: number;
  originalY: number;
}

const platforms: Platform[] = [];

function createPlatform(x: number, y: number, width: number, depth: number): Platform {
  const geometry = new THREE.BoxGeometry(width, 0.6, depth);
  const material = new THREE.MeshStandardMaterial({
    map: concreteTexture,
    roughness: 0.9,
    metalness: 0.1,
    color: 0xaaaaaa
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const platform: Platform = {
    mesh,
    bounds: {
      minX: x - width / 2,
      maxX: x + width / 2,
      minY: y - 0.3,
      maxY: y + 0.3,
      minZ: -depth / 2,
      maxZ: depth / 2
    },
    shaking: false,
    shakeTime: 0,
    falling: false,
    fallSpeed: 0,
    originalY: y
  };

  platforms.push(platform);
  return platform;
}

// Generate initial starting area
createPlatform(0, 0, 12, 10);

// Procedural generation
function generatePlatformCluster(startY: number): void {
  const platformsInCluster = 5 + Math.floor(Math.random() * 3);
  let clusterX = (Math.random() - 0.5) * 10;

  for (let i = 0; i < platformsInCluster; i++) {
    const yStep = 2.5 + Math.random() * 2;
    const y = startY + i * yStep;
    const xOffset = (Math.random() - 0.5) * 12;
    const x = clusterX + xOffset;
    const width = 4 + Math.random() * 4;
    const depth = 7 + Math.random() * 2;

    createPlatform(x, y, width, depth);

    if (y > highestPlatformY) {
      highestPlatformY = y;
    }

    // Add decorative walls
    if (Math.random() > 0.6) {
      const wallGeo = new THREE.BoxGeometry(width * 0.9, 8, 0.4);
      const wallMat = new THREE.MeshStandardMaterial({
        map: concreteTexture,
        color: 0x555555,
        roughness: 0.95
      });
      const wall = new THREE.Mesh(wallGeo, wallMat);
      wall.position.set(x, y + 4, -4.5);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    }

    clusterX = x;
  }
}

// Generate initial platforms
for (let i = 0; i < 20; i++) {
  generatePlatformCluster(i * 12 + 5);
}

// ============================================
// DEMOLITION WAVE
// ============================================
const demolitionGeo = new THREE.PlaneGeometry(300, 50);
const demolitionMat = new THREE.MeshStandardMaterial({
  color: 0xff3300,
  emissive: 0xff3300,
  emissiveIntensity: 1.2,
  transparent: true,
  opacity: 0.6,
  side: THREE.DoubleSide
});
const demolitionWave = new THREE.Mesh(demolitionGeo, demolitionMat);
demolitionWave.rotation.x = Math.PI / 2;
demolitionWave.position.set(0, demolitionHeight, 0);
scene.add(demolitionWave);

// Dust particles
const dustParticles: THREE.Mesh[] = [];
const dustGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
const dustMat = new THREE.MeshStandardMaterial({
  color: 0x555555,
  transparent: true,
  opacity: 0.5
});

for (let i = 0; i < 40; i++) {
  const dust = new THREE.Mesh(dustGeo, dustMat);
  dust.position.set(
    (Math.random() - 0.5) * 60,
    demolitionHeight + Math.random() * 8,
    (Math.random() - 0.5) * 15
  );
  scene.add(dust);
  dustParticles.push(dust);
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
  const geometry = new THREE.PlaneGeometry(0.7, 1);
  const material = new THREE.MeshStandardMaterial({
    map: scrollTexture,
    emissive: 0xffcc66,
    emissiveIntensity: 0.4,
    transparent: true,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, 0);
  scene.add(mesh);

  const light = new THREE.PointLight(0xffcc66, 1.5, 8);
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
for (let i = 0; i < 8; i++) {
  const x = (Math.random() - 0.5) * 15;
  const y = 8 + i * 18;
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

// ============================================
// UI
// ============================================
const instructions = document.getElementById('instructions') as HTMLDivElement;
const scrollCounter = document.getElementById('scroll-counter') as HTMLDivElement;
const popup = document.getElementById('popup') as HTMLDivElement;
const popupText = document.getElementById('popup-text') as HTMLDivElement;
const popupClose = document.getElementById('popup-close') as HTMLButtonElement;

function startGame(): void {
  if (!gameStarted && instructions) {
    instructions.classList.add('hidden');
    gameStarted = true;
  }
}

canvas.addEventListener('click', startGame);
if (instructions) instructions.addEventListener('click', startGame);

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
      <p style="margin-top: 20px;"><strong>Press F5 to climb again</strong></p>
    `;
    popup.style.display = 'flex';
  }
}

// ============================================
// PHYSICS
// ============================================
const GRAVITY = -0.8;
const MOVE_SPEED = 0.28;
const JUMP_FORCE = 14;
const MAX_FALL_SPEED = -1.5;

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
    if (facingRight) {
      facingRight = false;
      player.mesh.rotation.y = Math.PI;
    }
  } else if (keys.right) {
    player.velocity.x = MOVE_SPEED;
    if (!facingRight) {
      facingRight = true;
      player.mesh.rotation.y = 0;
    }
  } else {
    player.velocity.x *= 0.85;
  }

  // Walking animation
  const isMoving = Math.abs(player.velocity.x) > 0.01;
  if (isMoving && player.onGround) {
    walkCycle += 0.25;
    const swing = Math.sin(walkCycle) * 0.35;
    playerParts.leftLeg.rotation.x = swing;
    playerParts.rightLeg.rotation.x = -swing;
    playerParts.leftArm.rotation.x = -swing * 0.6;
    playerParts.rightArm.rotation.x = swing * 0.6;
    playerParts.body.position.y = 0.5 + Math.abs(Math.sin(walkCycle)) * 0.06;
  } else {
    playerParts.leftLeg.rotation.x = 0;
    playerParts.rightLeg.rotation.x = 0;
    playerParts.leftArm.rotation.x = 0;
    playerParts.rightArm.rotation.x = 0;
    playerParts.body.position.y = 0.5;
  }

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

        // Trigger shake when player lands on platform
        if (!platform.shaking && demolitionHeight > b.minY - 15) {
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
  if (player.mesh.position.y < demolitionHeight + 3) {
    gameOver = true;
    showGameOver();
    return;
  }

  // Scroll collection
  for (const scroll of scrolls) {
    if (!scroll.collected) {
      const dist = player.mesh.position.distanceTo(scroll.mesh.position);
      if (dist < 1.8) {
        scroll.collected = true;
        scroll.mesh.visible = false;
        scroll.light.intensity = 0;
        scrollsCollected++;
        showPopup(scroll.text);
      }
      scroll.mesh.rotation.y += 0.02;
      scroll.mesh.position.y += Math.sin(Date.now() * 0.001 + scroll.id) * 0.01;
    }
  }

  // Generate new platforms
  if (player.mesh.position.y > highestPlatformY - 50) {
    generatePlatformCluster(highestPlatformY + 10);

    // Spawn new scroll
    if (Math.random() > 0.5 && scrollIdCounter < scrollTexts.length) {
      const x = (Math.random() - 0.5) * 15;
      createScroll(x, highestPlatformY - 5, scrollIdCounter++);
    }
  }

  updateUI();
}

// ============================================
// UPDATE DEMOLITION & PLATFORMS
// ============================================
function updateDemolition(): void {
  if (gameOver || !gameStarted) return;

  demolitionHeight += DEMOLITION_SPEED;
  demolitionWave.position.y = demolitionHeight;
  redLight.position.y = demolitionHeight + 10;

  // Update dust
  for (const dust of dustParticles) {
    dust.position.y = demolitionHeight + 3 + Math.random() * 12;
    dust.position.x += (Math.random() - 0.5) * 0.3;
    dust.rotation.x += 0.03;
    dust.rotation.y += 0.05;
  }

  // Update platforms
  for (let i = platforms.length - 1; i >= 0; i--) {
    const plat = platforms[i];

    // Start shaking if demolition is near
    if (!plat.shaking && !plat.falling && demolitionHeight > plat.bounds.minY - 12) {
      plat.shaking = true;
      plat.shakeTime = 0;
    }

    // Shake animation
    if (plat.shaking && !plat.falling) {
      plat.shakeTime += 0.016;
      const shakeIntensity = Math.min(plat.shakeTime * 0.3, 0.15);
      plat.mesh.position.x = plat.bounds.minX + (plat.bounds.maxX - plat.bounds.minX) / 2 +
                             (Math.random() - 0.5) * shakeIntensity;
      plat.mesh.rotation.z = (Math.random() - 0.5) * shakeIntensity * 0.5;

      // Start falling after shaking for a while
      if (plat.shakeTime > 1.5 || demolitionHeight > plat.bounds.minY - 3) {
        plat.falling = true;
        plat.fallSpeed = 0;
      }
    }

    // Falling animation
    if (plat.falling) {
      plat.fallSpeed += 0.015;
      plat.mesh.position.y -= plat.fallSpeed;
      plat.mesh.rotation.x += 0.02;
      plat.mesh.rotation.z += 0.03;
      (plat.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 1 - plat.fallSpeed * 2);
      (plat.mesh.material as THREE.MeshStandardMaterial).transparent = true;
    }

    // Remove destroyed platforms
    if (plat.mesh.position.y < demolitionHeight - 20) {
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
  const targetY = player.mesh.position.y + 5;

  camera.position.x += (targetX + 25 - camera.position.x) * 0.08;
  camera.position.y += (targetY + 10 - camera.position.y) * 0.08;

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
  const viewSize = 14;

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
