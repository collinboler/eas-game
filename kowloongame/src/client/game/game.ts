import * as THREE from 'three';

// ============================================
// KOWLOON WALLED CITY
// ============================================

const canvas = document.getElementById('bg') as HTMLCanvasElement;
if (!canvas) console.error('Canvas not found!');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15101a);

const outdoorScene = new THREE.Group();
const indoorScene = new THREE.Group();
scene.add(outdoorScene);
scene.add(indoorScene);
indoorScene.visible = false;

// ============================================
// CAMERA - Looking down at the street
// ============================================
const aspect = window.innerWidth / window.innerHeight;
let viewSize = 16;
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect, viewSize * aspect,
  viewSize, -viewSize,
  0.1, 200
);

// ============================================
// RENDERER
// ============================================
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ============================================
// STATE
// ============================================
const state = {
  mode: 'outdoor' as 'outdoor' | 'indoor',
  currentBuilding: -1,
  currentFloor: 0
};

// ============================================
// LIGHTING - Bright enough to see
// ============================================
const ambient = new THREE.AmbientLight(0xffffff, 0.7);
outdoorScene.add(ambient);

const sun = new THREE.DirectionalLight(0xffeedd, 0.5);
sun.position.set(10, 20, 10);
outdoorScene.add(sun);

// ============================================
// GROUND - Player walks here (Z = 0 to 8)
// ============================================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 20),
  new THREE.MeshLambertMaterial({ color: 0x1a1a1a })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, 0, 4);
outdoorScene.add(ground);

// Sidewalk where player walks
const sidewalk = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 8),
  new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
);
sidewalk.rotation.x = -Math.PI / 2;
sidewalk.position.set(0, 0.02, 4);
outdoorScene.add(sidewalk);

// ============================================
// BUILDING DATA
// ============================================
interface BuildingData {
  x: number;
  floors: number;
}

const buildingsData: BuildingData[] = [];

// Buildings are BEHIND the player (negative Z)
function createBuilding(x: number, floors: number): number {
  const width = 9;
  const height = floors * 2.5;
  const z = -8; // Far behind player
  const depth = 6;

  const colors = [0x3a3545, 0x2d2835, 0x352d3a, 0x2a2535];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshLambertMaterial({ color })
  );
  building.position.set(x, height / 2, z);
  outdoorScene.add(building);

  // Windows
  for (let f = 0; f < Math.min(floors, 12); f++) {
    const y = f * 2.5 + 1.5;
    for (let w = 0; w < 3; w++) {
      const isLit = Math.random() > 0.3;
      const litColors = [0xffdd77, 0xffaa55, 0x77ddff, 0xaaffaa];
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.6),
        new THREE.MeshBasicMaterial({ 
          color: isLit ? litColors[Math.floor(Math.random() * 4)] : 0x1a2535 
        })
      );
      win.position.set(x - 3 + w * 3, y, z + depth/2 + 0.01);
      outdoorScene.add(win);
    }
  }

  // Neon sign
  const neonColors = [0xff0066, 0x00ffff, 0xff6600, 0x00ff66, 0xff00ff];
  const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];
  const isVert = Math.random() > 0.5;
  
  const sign = new THREE.Mesh(
    isVert ? new THREE.BoxGeometry(0.5, 3 + Math.random() * 3, 0.2) : new THREE.BoxGeometry(3 + Math.random() * 2, 0.5, 0.2),
    new THREE.MeshBasicMaterial({ color: neonColor })
  );
  sign.position.set(x + (Math.random() - 0.5) * 4, 4 + Math.random() * (height - 6), z + depth/2 + 0.3);
  outdoorScene.add(sign);
  
  const glow = new THREE.PointLight(neonColor, 1.5, 10);
  glow.position.set(sign.position.x, sign.position.y, sign.position.z + 1);
  outdoorScene.add(glow);

  // Door - facing player
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 3.5, 0.3),
    new THREE.MeshLambertMaterial({ color: 0x442211 })
  );
  doorFrame.position.set(x, 1.75, z + depth/2 + 0.2);
  outdoorScene.add(doorFrame);
  
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 3),
    new THREE.MeshBasicMaterial({ color: 0x663322 })
  );
  door.position.set(x, 1.5, z + depth/2 + 0.35);
  outdoorScene.add(door);
  
  // Door light
  const doorLight = new THREE.PointLight(0xffaa66, 1.2, 6);
  doorLight.position.set(x, 3.5, z + depth/2 + 1.5);
  outdoorScene.add(doorLight);
  
  // ENTER sign - bright green
  const enter = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.5, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x00ff44 })
  );
  enter.position.set(x, 4, z + depth/2 + 0.4);
  outdoorScene.add(enter);
  
  const enterGlow = new THREE.PointLight(0x00ff44, 1, 5);
  enterGlow.position.set(x, 4, z + depth/2 + 1);
  outdoorScene.add(enterGlow);
  
  buildingsData.push({ x, floors });
  return buildingsData.length - 1;
}

// Create row of buildings (all behind player)
createBuilding(-36, 14);
createBuilding(-24, 18);
createBuilding(-12, 12);
createBuilding(0, 20);
createBuilding(12, 15);
createBuilding(24, 17);
createBuilding(36, 13);

// Some detail in the distance
for (let i = 0; i < 5; i++) {
  const bg = new THREE.Mesh(
    new THREE.BoxGeometry(8, 30 + Math.random() * 20, 4),
    new THREE.MeshLambertMaterial({ color: 0x151015 })
  );
  bg.position.set(-40 + i * 20, 20, -20);
  outdoorScene.add(bg);
}

// Hanging wires
for (let i = 0; i < 10; i++) {
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 15, 4),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  wire.position.set(-40 + i * 9, 10 + Math.random() * 8, -4);
  wire.rotation.x = Math.PI / 2;
  outdoorScene.add(wire);
}

// Street lights (in front for visibility)
for (let i = -3; i <= 3; i++) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 5, 6),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  pole.position.set(i * 14, 2.5, 8);
  outdoorScene.add(pole);
  
  const light = new THREE.PointLight(0xffffcc, 0.6, 10);
  light.position.set(i * 14, 5.5, 8);
  outdoorScene.add(light);
}

// ============================================
// INDOOR SCENE
// ============================================
const indoorAmbient = new THREE.AmbientLight(0xffffff, 0.5);
indoorScene.add(indoorAmbient);

let currentFloorGroup: THREE.Group | null = null;

function createFloorView(buildingIdx: number, floor: number) {
  if (currentFloorGroup) indoorScene.remove(currentFloorGroup);

  const bd = buildingsData[buildingIdx];
  if (!bd) return { w: 28, d: 20, top: false, ground: true };
  
  const group = new THREE.Group();
  const w = 28, d = 20, wallH = 4;
  const isTop = floor === bd.floors - 1;
  const isGround = floor === 0;

  // Floor
  const floorMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshLambertMaterial({ color: 0x4a4540 })
  );
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0.01;
  group.add(floorMesh);

  // Tile pattern
  for (let x = -6; x <= 6; x++) {
    for (let z = -4; z <= 4; z++) {
      if ((x + z) % 2 === 0) {
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(1.9, 1.9),
          new THREE.MeshLambertMaterial({ color: 0x555045 })
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x * 2, 0.02, z * 2);
        group.add(tile);
      }
    }
  }

  // Walls
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
  
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.3), wallMat);
  back.position.set(0, wallH/2, -d/2);
  group.add(back);
  
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, d), wallMat);
  left.position.set(-w/2, wallH/2, 0);
  group.add(left);
  
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, d), wallMat);
  right.position.set(w/2, wallH/2, 0);
  group.add(right);

  // Front wall with door on ground floor
  if (isGround) {
    const fl = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 2.5, wallH, 0.3), wallMat);
    fl.position.set(-w/4 - 1.25, wallH/2, d/2);
    group.add(fl);
    
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 2.5, wallH, 0.3), wallMat);
    fr.position.set(w/4 + 1.25, wallH/2, d/2);
    group.add(fr);
    
    // EXIT sign
    const exit = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff44 })
    );
    exit.position.set(0, wallH - 0.3, d/2 - 0.2);
    group.add(exit);
    
    const exitGlow = new THREE.PointLight(0x00ff44, 1.5, 6);
    exitGlow.position.set(0, wallH - 0.5, d/2 - 1);
    group.add(exitGlow);
  } else {
    const front = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.3), wallMat);
    front.position.set(0, wallH/2, d/2);
    group.add(front);
  }

  // STAIRS UP - Green
  if (!isTop) {
    const up = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.3, 4.5),
      new THREE.MeshBasicMaterial({ color: 0x00cc44 })
    );
    up.position.set(w/2 - 3.5, 0.2, -d/2 + 3.5);
    group.add(up);
    
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.8, 4),
      new THREE.MeshBasicMaterial({ color: 0x00ff55 })
    );
    arrow.position.set(w/2 - 3.5, 1.5, -d/2 + 3.5);
    group.add(arrow);
    
    const upLight = new THREE.PointLight(0x00ff44, 2.5, 8);
    upLight.position.set(w/2 - 3.5, 1, -d/2 + 3.5);
    group.add(upLight);
  }

  // STAIRS DOWN - Orange
  if (!isGround) {
    const down = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.3, 4.5),
      new THREE.MeshBasicMaterial({ color: 0xcc6600 })
    );
    down.position.set(-w/2 + 3.5, 0.2, -d/2 + 3.5);
    group.add(down);
    
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.8, 4),
      new THREE.MeshBasicMaterial({ color: 0xff8800 })
    );
    arrow.position.set(-w/2 + 3.5, 1.5, -d/2 + 3.5);
    arrow.rotation.z = Math.PI;
    group.add(arrow);
    
    const downLight = new THREE.PointLight(0xff8800, 2.5, 8);
    downLight.position.set(-w/2 + 3.5, 1, -d/2 + 3.5);
    group.add(downLight);
  }

  // ROOF - Cyan (top floor)
  if (isTop) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 0.3, 4.5),
      new THREE.MeshBasicMaterial({ color: 0x0088cc })
    );
    roof.position.set(w/2 - 3.5, 0.2, d/2 - 3.5);
    group.add(roof);
    
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.7, 1.8, 4),
      new THREE.MeshBasicMaterial({ color: 0x00ccff })
    );
    arrow.position.set(w/2 - 3.5, 1.5, d/2 - 3.5);
    group.add(arrow);
    
    const roofLight = new THREE.PointLight(0x00ccff, 2.5, 8);
    roofLight.position.set(w/2 - 3.5, 1, d/2 - 3.5);
    group.add(roofLight);
  }

  // Ceiling light
  const ceil = new THREE.PointLight(0xffffee, 1, 30);
  ceil.position.set(0, 3.5, 0);
  group.add(ceil);

  indoorScene.add(group);
  currentFloorGroup = group;
  return { w, d, top: isTop, ground: isGround };
}

// ============================================
// PLAYER - Always visible
// ============================================
const playerGroup = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.CylinderGeometry(0.4, 0.45, 1.3, 12),
  new THREE.MeshLambertMaterial({ color: 0x222222 })
);
body.position.y = 0.65;
playerGroup.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 12, 12),
  new THREE.MeshLambertMaterial({ color: 0xeeddcc })
);
head.position.y = 1.45;
playerGroup.add(head);

// Direction - pink cone
const dir = new THREE.Mesh(
  new THREE.ConeGeometry(0.18, 0.4, 4),
  new THREE.MeshBasicMaterial({ color: 0xff0066 })
);
dir.position.set(0, 1.45, 0.5);
dir.rotation.x = Math.PI / 2;
playerGroup.add(dir);

// Flashlight
const flash = new THREE.SpotLight(0xffffee, 5, 20, Math.PI / 5, 0.3, 1);
flash.position.set(0, 1.1, 0.3);
flash.target.position.set(0, 0, 10);
playerGroup.add(flash);
playerGroup.add(flash.target);

// Player glow
const playerLight = new THREE.PointLight(0xffffee, 0.8, 6);
playerLight.position.set(0, 1.2, 0);
playerGroup.add(playerLight);

// Player starts in FRONT of buildings
playerGroup.position.set(0, 0.1, 4);
outdoorScene.add(playerGroup);

const player = { x: 0, z: 4, facing: 0, speed: 0.28 };

// ============================================
// INPUT
// ============================================
const keys = { left: false, right: false, up: false, down: false, action: false };

window.addEventListener('keydown', e => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
  if (e.code === 'KeyE' || e.code === 'Space') keys.action = true;
});

window.addEventListener('keyup', e => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
  if (e.code === 'KeyE' || e.code === 'Space') keys.action = false;
});

// ============================================
// UI
// ============================================
const instructions = document.getElementById('instructions') as HTMLDivElement;
const scrollCounter = document.getElementById('scroll-counter') as HTMLDivElement;
const popup = document.getElementById('popup') as HTMLDivElement;
const popupText = document.getElementById('popup-text') as HTMLDivElement;
const popupClose = document.getElementById('popup-close') as HTMLButtonElement;

let started = false;
let cooldown = 0;

canvas.addEventListener('click', () => { if (!started && instructions) { instructions.classList.add('hidden'); started = true; }});
instructions?.addEventListener('click', () => { if (!started && instructions) { instructions.classList.add('hidden'); started = true; }});
popupClose?.addEventListener('click', () => { if (popup) popup.style.display = 'none'; });

function showPopup(t: string) { if (popup && popupText) { popupText.textContent = t; popup.style.display = 'flex'; }}

function updateUI() {
  if (!scrollCounter) return;
  if (state.mode === 'indoor') {
    const bd = buildingsData[state.currentBuilding];
    scrollCounter.textContent = `FLOOR ${state.currentFloor + 1} / ${bd?.floors ?? '?'}`;
  } else {
    scrollCounter.textContent = 'KOWLOON CITY';
  }
}

// ============================================
// GAME LOGIC
// ============================================
let floor = { w: 28, d: 20, top: false, ground: true };

function enter(i: number) {
  state.mode = 'indoor';
  state.currentBuilding = i;
  state.currentFloor = 0;
  outdoorScene.visible = false;
  indoorScene.visible = true;
  outdoorScene.remove(playerGroup);
  indoorScene.add(playerGroup);
  floor = createFloorView(i, 0);
  player.x = 0;
  player.z = floor.d / 2 - 2;
  playerGroup.position.set(0, 0.1, player.z);
  updateUI();
}

function exit() {
  state.mode = 'outdoor';
  const bd = buildingsData[state.currentBuilding];
  outdoorScene.visible = true;
  indoorScene.visible = false;
  indoorScene.remove(playerGroup);
  outdoorScene.add(playerGroup);
  player.x = bd?.x ?? 0;
  player.z = 4;
  playerGroup.position.set(player.x, 0.1, player.z);
  state.currentBuilding = -1;
  state.currentFloor = 0;
  updateUI();
}

function goUp() {
  const bd = buildingsData[state.currentBuilding];
  if (!bd || state.currentFloor >= bd.floors - 1) return;
  state.currentFloor++;
  floor = createFloorView(state.currentBuilding, state.currentFloor);
  player.x = floor.w / 2 - 4;
  player.z = -floor.d / 2 + 5;
  playerGroup.position.set(player.x, 0.1, player.z);
  updateUI();
}

function goDown() {
  if (state.currentFloor <= 0) return;
  state.currentFloor--;
  floor = createFloorView(state.currentBuilding, state.currentFloor);
  player.x = -floor.w / 2 + 4;
  player.z = -floor.d / 2 + 5;
  playerGroup.position.set(player.x, 0.1, player.z);
  updateUI();
}

function jumpRoof() {
  exit();
  showPopup("You jumped from the roof!");
}

// ============================================
// UPDATE
// ============================================
function update() {
  if (cooldown > 0) cooldown--;

  let mx = 0, mz = 0;
  if (keys.left) mx -= player.speed;
  if (keys.right) mx += player.speed;
  if (keys.up) mz -= player.speed;
  if (keys.down) mz += player.speed;

  if (mx !== 0 || mz !== 0) {
    player.facing = Math.atan2(mx, -mz);
    dir.rotation.y = player.facing;
    dir.position.x = Math.sin(player.facing) * 0.5;
    dir.position.z = -Math.cos(player.facing) * 0.5;
    flash.target.position.x = Math.sin(player.facing) * 15;
    flash.target.position.z = -Math.cos(player.facing) * 15;
  }

  if (state.mode === 'outdoor') {
    player.x += mx;
    player.z += mz;
    // Player stays in front area (Z from 0 to 8)
    player.x = Math.max(-42, Math.min(42, player.x));
    player.z = Math.max(0, Math.min(8, player.z));
    playerGroup.position.set(player.x, 0.1, player.z);

    // Enter building - walk toward it (press W to get close, then E)
    if (keys.action && cooldown === 0 && player.z < 2) {
      for (let i = 0; i < buildingsData.length; i++) {
        const bd = buildingsData[i];
        if (!bd) continue;
        if (Math.abs(player.x - bd.x) < 3) {
          enter(i);
          cooldown = 15;
      return;
    }
  }
    }
  } else {
    player.x += mx;
    player.z += mz;
    const hw = floor.w / 2 - 0.5, hd = floor.d / 2 - 0.5;
    player.x = Math.max(-hw, Math.min(hw, player.x));
    player.z = Math.max(-hd, Math.min(hd, player.z));
    playerGroup.position.set(player.x, 0.1, player.z);

    if (keys.action && cooldown === 0) {
      // Stairs UP
      if (!floor.top && player.x > hw - 5 && player.z < -hd + 5) { goUp(); cooldown = 15; return; }
      // Stairs DOWN
      if (!floor.ground && player.x < -hw + 5 && player.z < -hd + 5) { goDown(); cooldown = 15; return; }
      // Exit door
      if (floor.ground && Math.abs(player.x) < 3 && player.z > hd - 2) { exit(); cooldown = 15; return; }
      // Roof
      if (floor.top && player.x > hw - 5 && player.z > hd - 5) { jumpRoof(); cooldown = 15; return; }
    }
  }
}

// ============================================
// CAMERA
// ============================================
function updateCamera() {
  if (state.mode === 'outdoor') {
    viewSize = 15;
    // Camera above and behind player, looking at buildings
    camera.position.set(player.x, 20, player.z + 25);
    camera.lookAt(player.x, 5, -5);
  } else {
    viewSize = 17;
    // Bird's eye view of floor
    camera.position.set(0, 35, 15);
    camera.lookAt(0, 0, 0);
  }
  const a = window.innerWidth / window.innerHeight;
  camera.left = -viewSize * a;
  camera.right = viewSize * a;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}

// ============================================
// LOOP
// ============================================
function animate() {
  requestAnimationFrame(animate);
  update();
  updateCamera();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCamera();
});

updateUI();
animate();
