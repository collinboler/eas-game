import * as THREE from 'three';

// ============================================
// KOWLOON WALLED CITY
// Dense Cyberpunk Aesthetic
// ============================================

const canvas = document.getElementById('bg') as HTMLCanvasElement;
if (!canvas) console.error('Canvas not found!');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1025);

const outdoorScene = new THREE.Group();
const indoorScene = new THREE.Group();
scene.add(outdoorScene);
scene.add(indoorScene);
indoorScene.visible = false;

// ============================================
// CAMERA
// ============================================
const aspect = window.innerWidth / window.innerHeight;
let viewSize = 16;
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect, viewSize * aspect,
  viewSize, -viewSize,
  0.1, 300
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
// OUTDOOR SCENE - KOWLOON ALLEY
// ============================================

// Good ambient light - can actually see stuff
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
outdoorScene.add(ambient);

// Warm fill from neon
const fillLight = new THREE.DirectionalLight(0xffccaa, 0.4);
fillLight.position.set(-5, 10, 5);
outdoorScene.add(fillLight);

// Cool fill from other side
const fillLight2 = new THREE.DirectionalLight(0xaaccff, 0.3);
fillLight2.position.set(5, 8, -5);
outdoorScene.add(fillLight2);

// Ground - dark concrete alley
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 25),
  new THREE.MeshLambertMaterial({ color: 0x222222 })
);
ground.rotation.x = -Math.PI / 2;
outdoorScene.add(ground);

// Puddles (reflective spots)
for (let i = 0; i < 8; i++) {
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(1 + Math.random() * 1.5, 16),
    new THREE.MeshLambertMaterial({ color: 0x334455 })
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(-30 + i * 9 + Math.random() * 4, 0.01, -3 + Math.random() * 6);
  outdoorScene.add(puddle);
}

// ============================================
// BUILDING DATA
// ============================================
interface BuildingData {
  x: number;
  floors: number;
}

const buildingsData: BuildingData[] = [];

// Create a dense Kowloon-style building
function createBuilding(x: number, floors: number, side: 'left' | 'right'): number {
  const width = 8 + Math.random() * 4;
  const height = floors * 2.5;
  const z = side === 'left' ? -10 : 10;
  const depth = 6;

  // Main building body - varied colors
  const colors = [0x3a3540, 0x2d2832, 0x352d38, 0x2a2530];
  const buildingColor = colors[Math.floor(Math.random() * colors.length)];
  
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshLambertMaterial({ color: buildingColor })
  );
  building.position.set(x, height / 2, z);
  outdoorScene.add(building);

  // Layers of detail - pipes, AC units, balconies
  const detailColor = 0x1a1a1a;
  
  // Vertical pipes
  for (let p = 0; p < 3; p++) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, height, 6),
      new THREE.MeshLambertMaterial({ color: detailColor })
    );
    pipe.position.set(x - width/2 + 0.5 + p * (width/2 - 0.5), height/2, z + (side === 'left' ? depth/2 + 0.1 : -depth/2 - 0.1));
    outdoorScene.add(pipe);
  }

  // Horizontal pipes/wires
  for (let h = 0; h < floors; h++) {
    if (Math.random() > 0.5) {
      const hPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, width * 0.8, 4),
        new THREE.MeshLambertMaterial({ color: 0x111111 })
      );
      hPipe.rotation.z = Math.PI / 2;
      hPipe.position.set(x, h * 2.5 + 1.5, z + (side === 'left' ? depth/2 + 0.2 : -depth/2 - 0.2));
      outdoorScene.add(hPipe);
    }
  }

  // AC units
  for (let a = 0; a < floors - 1; a++) {
    if (Math.random() > 0.4) {
      const ac = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.8, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x556666 })
      );
      ac.position.set(
        x - width/2 + 1 + Math.random() * (width - 2),
        a * 2.5 + 2,
        z + (side === 'left' ? depth/2 + 0.3 : -depth/2 - 0.3)
      );
      outdoorScene.add(ac);
    }
  }

  // Windows - lots of them, varied lighting
  const faceZ = side === 'left' ? z + depth/2 + 0.01 : z - depth/2 - 0.01;
  for (let f = 0; f < floors; f++) {
    const y = f * 2.5 + 1.5;
    const numWindows = Math.floor(width / 2);
    for (let w = 0; w < numWindows; w++) {
      const isLit = Math.random() > 0.3;
      const colors = [0xffdd77, 0xffaa55, 0x77ddff, 0xaaffaa, 0xffaaff];
      const litColor = isLit ? colors[Math.floor(Math.random() * colors.length)] : 0x1a2535;
      
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1.5),
        new THREE.MeshBasicMaterial({ color: litColor })
      );
      win.position.set(x - width/2 + 1.2 + w * 2, y, faceZ);
      if (side === 'right') win.rotation.y = Math.PI;
      outdoorScene.add(win);
      
      // Window glow
      if (isLit && Math.random() > 0.6) {
        const glow = new THREE.PointLight(litColor, 0.3, 3);
        glow.position.set(x - width/2 + 1.2 + w * 2, y, faceZ + (side === 'left' ? 0.5 : -0.5));
        outdoorScene.add(glow);
      }
    }
  }

  // Neon signs - colorful and bright
  if (Math.random() > 0.3) {
    const neonColors = [0xff0066, 0x00ffff, 0xff6600, 0x00ff66, 0xff00ff, 0xffff00];
    const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];
    const signHeight = 2 + Math.random() * 4;
    const signY = 3 + Math.random() * (height - 6);
    const isVertical = Math.random() > 0.5;
    
    const sign = new THREE.Mesh(
      isVertical 
        ? new THREE.BoxGeometry(0.5, signHeight, 0.2)
        : new THREE.BoxGeometry(3 + Math.random() * 2, 0.6, 0.2),
      new THREE.MeshBasicMaterial({ color: neonColor })
    );
    sign.position.set(x + (Math.random() - 0.5) * width * 0.5, signY, faceZ + (side === 'left' ? 0.3 : -0.3));
    outdoorScene.add(sign);
    
    // Neon glow
    const neonLight = new THREE.PointLight(neonColor, 1.5, 8);
    neonLight.position.set(sign.position.x, sign.position.y, sign.position.z + (side === 'left' ? 1 : -1));
    outdoorScene.add(neonLight);
  }

  // Door (only on left side buildings for entry)
  if (side === 'left') {
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 3.5, 0.3),
      new THREE.MeshLambertMaterial({ color: 0x442211 })
    );
    doorFrame.position.set(x, 1.75, z + depth/2 + 0.2);
    outdoorScene.add(doorFrame);
    
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 3),
      new THREE.MeshBasicMaterial({ color: 0x663322 })
    );
    door.position.set(x, 1.6, z + depth/2 + 0.35);
    outdoorScene.add(door);
    
    // Door light
    const doorLight = new THREE.PointLight(0xffaa66, 1, 5);
    doorLight.position.set(x, 3.5, z + depth/2 + 1);
    outdoorScene.add(doorLight);
    
    // ENTER sign
    const enterSign = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.4, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff44 })
    );
    enterSign.position.set(x, 3.8, z + depth/2 + 0.4);
    outdoorScene.add(enterSign);
    
    const enterGlow = new THREE.PointLight(0x00ff44, 0.8, 4);
    enterGlow.position.set(x, 3.8, z + depth/2 + 1);
    outdoorScene.add(enterGlow);
    
    buildingsData.push({ x, floors });
  }
  
  return buildingsData.length - 1;
}

// Create dense building rows
// Left side (enterable)
createBuilding(-35, 12, 'left');
createBuilding(-22, 16, 'left');
createBuilding(-8, 10, 'left');
createBuilding(6, 18, 'left');
createBuilding(20, 14, 'left');
createBuilding(34, 12, 'left');

// Right side (backdrop)
createBuilding(-30, 14, 'right');
createBuilding(-16, 18, 'right');
createBuilding(-2, 12, 'right');
createBuilding(12, 16, 'right');
createBuilding(26, 10, 'right');
createBuilding(40, 14, 'right');

// Overhead wires/cables
for (let i = 0; i < 15; i++) {
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 18, 4),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  wire.position.set(-40 + i * 6, 8 + Math.random() * 10, 0);
  wire.rotation.x = Math.PI / 2;
  wire.rotation.z = (Math.random() - 0.5) * 0.3;
  outdoorScene.add(wire);
}

// Hanging laundry/flags
for (let i = 0; i < 10; i++) {
  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 1.2),
    new THREE.MeshBasicMaterial({ 
      color: [0xff6666, 0x6666ff, 0xffff66, 0x66ff66][Math.floor(Math.random() * 4)],
      side: THREE.DoubleSide
    })
  );
  flag.position.set(-35 + i * 8, 5 + Math.random() * 6, -5 + Math.random() * 10);
  flag.rotation.y = Math.random() * 0.5;
  outdoorScene.add(flag);
}

// Street lights
for (let i = -3; i <= 3; i++) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.12, 5, 6),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  pole.position.set(i * 14, 2.5, 0);
  outdoorScene.add(pole);
  
  const light = new THREE.PointLight(0xffffcc, 0.8, 12);
  light.position.set(i * 14, 5.5, 0);
  outdoorScene.add(light);
}

// ============================================
// INDOOR SCENE
// ============================================
const indoorAmbient = new THREE.AmbientLight(0xffffff, 0.4);
indoorScene.add(indoorAmbient);

let currentFloorGroup: THREE.Group | null = null;

function createFloorView(buildingIdx: number, floor: number) {
  if (currentFloorGroup) indoorScene.remove(currentFloorGroup);

  const bd = buildingsData[buildingIdx];
  if (!bd) return { w: 30, d: 20, top: false, ground: true };
  
  const group = new THREE.Group();
  const w = 30, d = 20, wallH = 4;
  const isTop = floor === bd.floors - 1;
  const isGround = floor === 0;

  // Floor with tiles
  for (let x = -7; x <= 7; x++) {
    for (let z = -5; z <= 5; z++) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.1, 1.9),
        new THREE.MeshLambertMaterial({ 
          color: (x + z) % 2 === 0 ? 0x4a4540 : 0x555045 
        })
      );
      tile.position.set(x * 2, 0.05, z * 2);
      group.add(tile);
    }
  }

  // Walls
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
  
  // Back
  const back = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.3), wallMat);
  back.position.set(0, wallH/2, -d/2);
  group.add(back);
  
  // Sides
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, d), wallMat);
  left.position.set(-w/2, wallH/2, 0);
  group.add(left);
  
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, d), wallMat);
  right.position.set(w/2, wallH/2, 0);
  group.add(right);

  // Front
  if (isGround) {
    const fl = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 2.5, wallH, 0.3), wallMat);
    fl.position.set(-w/4 - 1.25, wallH/2, d/2);
    group.add(fl);
    
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 2.5, wallH, 0.3), wallMat);
    fr.position.set(w/4 + 1.25, wallH/2, d/2);
    group.add(fr);
    
    // EXIT
    const exit = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x00ff44 })
    );
    exit.position.set(0, wallH - 0.4, d/2 - 0.2);
    group.add(exit);
    
    const exitGlow = new THREE.PointLight(0x00ff44, 1, 5);
    exitGlow.position.set(0, wallH - 0.5, d/2 - 1);
    group.add(exitGlow);
  } else {
    const front = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.3), wallMat);
    front.position.set(0, wallH/2, d/2);
    group.add(front);
  }

  // STAIRS UP - bright green
  if (!isTop) {
    const up = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 4),
      new THREE.MeshBasicMaterial({ color: 0x00cc44 })
    );
    up.position.set(w/2 - 3, 0.2, -d/2 + 3);
    group.add(up);
    
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.5, 4),
      new THREE.MeshBasicMaterial({ color: 0x00ff55 })
    );
    arrow.position.set(w/2 - 3, 1.5, -d/2 + 3);
    group.add(arrow);
    
    const upLight = new THREE.PointLight(0x00ff44, 2, 6);
    upLight.position.set(w/2 - 3, 1, -d/2 + 3);
    group.add(upLight);
  }

  // STAIRS DOWN - bright orange
  if (!isGround) {
    const down = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 4),
      new THREE.MeshBasicMaterial({ color: 0xcc6600 })
    );
    down.position.set(-w/2 + 3, 0.2, -d/2 + 3);
    group.add(down);
    
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.5, 4),
      new THREE.MeshBasicMaterial({ color: 0xff8800 })
    );
    arrow.position.set(-w/2 + 3, 1.5, -d/2 + 3);
    arrow.rotation.z = Math.PI;
    group.add(arrow);
    
    const downLight = new THREE.PointLight(0xff8800, 2, 6);
    downLight.position.set(-w/2 + 3, 1, -d/2 + 3);
    group.add(downLight);
  }

  // ROOF - bright cyan (top floor only)
  if (isTop) {
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.3, 4),
      new THREE.MeshBasicMaterial({ color: 0x0088cc })
    );
    roof.position.set(w/2 - 3, 0.2, d/2 - 3);
    group.add(roof);
    
    const arrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.5, 4),
      new THREE.MeshBasicMaterial({ color: 0x00ccff })
    );
    arrow.position.set(w/2 - 3, 1.5, d/2 - 3);
    group.add(arrow);
    
    const roofLight = new THREE.PointLight(0x00ccff, 2, 6);
    roofLight.position.set(w/2 - 3, 1, d/2 - 3);
    group.add(roofLight);
  }

  // Ceiling light
  const ceilLight = new THREE.PointLight(0xffffee, 0.8, 25);
  ceilLight.position.set(0, 3.5, 0);
  group.add(ceilLight);

  // Some furniture
  for (let i = 0; i < 5; i++) {
    const f = new THREE.Mesh(
      new THREE.BoxGeometry(1 + Math.random(), 0.6 + Math.random() * 0.4, 1 + Math.random()),
      new THREE.MeshLambertMaterial({ color: 0x332820 })
    );
    f.position.set(-10 + Math.random() * 20, 0.4, -6 + Math.random() * 12);
    group.add(f);
  }

  indoorScene.add(group);
  currentFloorGroup = group;
  return { w, d, top: isTop, ground: isGround };
}

// ============================================
// PLAYER
// ============================================
const playerGroup = new THREE.Group();

const body = new THREE.Mesh(
  new THREE.CylinderGeometry(0.35, 0.4, 1.2, 10),
  new THREE.MeshLambertMaterial({ color: 0x222222 })
);
body.position.y = 0.6;
playerGroup.add(body);

const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 10, 10),
  new THREE.MeshLambertMaterial({ color: 0xeeddcc })
);
head.position.y = 1.3;
playerGroup.add(head);

// Direction marker
const dir = new THREE.Mesh(
  new THREE.ConeGeometry(0.15, 0.35, 4),
  new THREE.MeshBasicMaterial({ color: 0xff0066 })
);
dir.position.set(0, 1.3, 0.45);
dir.rotation.x = Math.PI / 2;
playerGroup.add(dir);

// Flashlight
const flash = new THREE.SpotLight(0xffffee, 4, 18, Math.PI / 5, 0.3, 1);
flash.position.set(0, 1, 0.3);
flash.target.position.set(0, 0, 8);
playerGroup.add(flash);
playerGroup.add(flash.target);

// Flashlight visible part
const flashBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 0.08, 0.2, 6),
  new THREE.MeshBasicMaterial({ color: 0x444444 })
);
flashBody.position.set(0.22, 0.9, 0.35);
flashBody.rotation.x = Math.PI / 2;
playerGroup.add(flashBody);

// Player light
const playerLight = new THREE.PointLight(0xffffee, 0.5, 5);
playerLight.position.set(0, 1, 0);
playerGroup.add(playerLight);

playerGroup.position.set(0, 0.1, 0);
outdoorScene.add(playerGroup);

const player = { x: 0, z: 0, facing: 0, speed: 0.25 };

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
// GAME
// ============================================
let floor = { w: 30, d: 20, top: false, ground: true };

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
  player.z = 0;
  playerGroup.position.set(player.x, 0.1, 0);
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
    dir.position.x = Math.sin(player.facing) * 0.45;
    dir.position.z = -Math.cos(player.facing) * 0.45;
    flash.target.position.x = Math.sin(player.facing) * 12;
    flash.target.position.z = -Math.cos(player.facing) * 12;
    flashBody.rotation.y = player.facing;
  }

  if (state.mode === 'outdoor') {
    player.x += mx;
    player.z += mz;
    player.x = Math.max(-42, Math.min(42, player.x));
    player.z = Math.max(-5, Math.min(5, player.z));
    playerGroup.position.set(player.x, 0.1, player.z);

    if (keys.action && cooldown === 0) {
      for (let i = 0; i < buildingsData.length; i++) {
        const bd = buildingsData[i];
        if (!bd) continue;
        if (Math.abs(player.x - bd.x) < 2.5 && player.z < -2) {
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
      if (!floor.top && player.x > hw - 5 && player.z < -hd + 5) { goUp(); cooldown = 15; return; }
      if (!floor.ground && player.x < -hw + 5 && player.z < -hd + 5) { goDown(); cooldown = 15; return; }
      if (floor.ground && Math.abs(player.x) < 3 && player.z > hd - 2) { exit(); cooldown = 15; return; }
      if (floor.top && player.x > hw - 5 && player.z > hd - 5) { jumpRoof(); cooldown = 15; return; }
    }
  }
}

function updateCamera() {
  if (state.mode === 'outdoor') {
    viewSize = 14;
    camera.position.set(player.x + 10, 14, player.z + 22);
    camera.lookAt(player.x, 4, player.z);
  } else {
    viewSize = 18;
    camera.position.set(0, 32, 14);
    camera.lookAt(0, 0, 0);
  }
  const a = window.innerWidth / window.innerHeight;
  camera.left = -viewSize * a;
  camera.right = viewSize * a;
  camera.top = viewSize;
  camera.bottom = -viewSize;
  camera.updateProjectionMatrix();
}

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
