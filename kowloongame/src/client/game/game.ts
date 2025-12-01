import * as THREE from 'three';

// ============================================
// KOWLOON WALLED CITY
// Neon-lit Streets & Eerie Interiors
// ============================================

const canvas = document.getElementById('bg') as HTMLCanvasElement;
if (!canvas) console.error('Canvas not found!');

const scene = new THREE.Scene();

const outdoorScene = new THREE.Group();
const indoorScene = new THREE.Group();
scene.add(outdoorScene);
scene.add(indoorScene);
indoorScene.visible = false;

// ============================================
// CAMERA
// ============================================
const aspect = window.innerWidth / window.innerHeight;
let viewSize = 15;
const camera = new THREE.OrthographicCamera(
  -viewSize * aspect, viewSize * aspect,
  viewSize, -viewSize,
  0.1, 500
);

// ============================================
// RENDERER
// ============================================
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ============================================
// GAME STATE
// ============================================
interface GameState {
  mode: 'outdoor' | 'indoor';
  currentBuilding: number;
  currentFloor: number;
}

const state: GameState = {
  mode: 'outdoor',
  currentBuilding: -1,
  currentFloor: 0
};

// ============================================
// COLORS - KOWLOON NEON PALETTE
// ============================================
const COLORS = {
  sky: 0x0a0a15,
  street: 0x1a1a1a,
  sidewalk: 0x2a2a2a,
  building: 0x252530,
  window: 0x0a2040,
  windowLit: 0xffcc55,
  windowBlue: 0x3399ff,
  windowGreen: 0x33ff99,
  door: 0x553322,
  neonPink: 0xff1155,
  neonCyan: 0x00ffff,
  neonGreen: 0x00ff66,
  neonOrange: 0xff6600,
  neonPurple: 0xaa00ff,
  neonRed: 0xff0033,
  neonYellow: 0xffff00,
  floor: 0x3a3530,
  floorAlt: 0x454035,
  wall: 0x2a2520,
  stairs: 0x228822,
};

// ============================================
// OUTDOOR SCENE - KOWLOON STREET
// ============================================

// Dark ambient with colored fill
const outdoorAmbient = new THREE.AmbientLight(0x223344, 0.4);
outdoorScene.add(outdoorAmbient);

// Dim moonlight
const moonLight = new THREE.DirectionalLight(0x445566, 0.2);
moonLight.position.set(-20, 30, 10);
outdoorScene.add(moonLight);

scene.background = new THREE.Color(COLORS.sky);

// Street
const street = new THREE.Mesh(
  new THREE.PlaneGeometry(250, 12),
  new THREE.MeshStandardMaterial({ color: COLORS.street })
);
street.rotation.x = -Math.PI / 2;
street.position.set(0, 0, 0);
outdoorScene.add(street);

// Wet street reflection effect
const wetStreet = new THREE.Mesh(
  new THREE.PlaneGeometry(250, 12),
  new THREE.MeshStandardMaterial({ 
    color: 0x111122, 
    transparent: true, 
    opacity: 0.3,
    metalness: 0.8,
    roughness: 0.2
  })
);
wetStreet.rotation.x = -Math.PI / 2;
wetStreet.position.set(0, 0.01, 0);
outdoorScene.add(wetStreet);

// Sidewalks
const sidewalkFront = new THREE.Mesh(
  new THREE.PlaneGeometry(250, 4),
  new THREE.MeshStandardMaterial({ color: COLORS.sidewalk })
);
sidewalkFront.rotation.x = -Math.PI / 2;
sidewalkFront.position.set(0, 0.05, 8);
outdoorScene.add(sidewalkFront);

const sidewalkBack = new THREE.Mesh(
  new THREE.PlaneGeometry(250, 4),
  new THREE.MeshStandardMaterial({ color: COLORS.sidewalk })
);
sidewalkBack.rotation.x = -Math.PI / 2;
sidewalkBack.position.set(0, 0.05, -8);
outdoorScene.add(sidewalkBack);

// ============================================
// BUILDING DATA
// ============================================
interface BuildingData {
  x: number;
  floors: number;
  width: number;
  side: 'front' | 'back';
  doorX: number;
  doorZ: number;
}

const buildingsData: BuildingData[] = [];

function createKowloonBuilding(x: number, floors: number, width: number, side: 'front' | 'back'): number {
  const height = floors * 2.8;
  const depth = 6;
  const z = side === 'front' ? 13 : -13;
  const faceZ = side === 'front' ? z - depth / 2 : z + depth / 2;
  
  // Main building
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: COLORS.building })
  );
  building.position.set(x, height / 2, z);
  outdoorScene.add(building);

  // Add grime/texture layers
  const grime = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.1, height + 0.1, depth + 0.1),
    new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a, 
      transparent: true, 
      opacity: 0.3 
    })
  );
  grime.position.copy(building.position);
  outdoorScene.add(grime);

  // Windows with random lighting
  for (let f = 0; f < floors; f++) {
    const floorY = f * 2.8 + 1.8;
    const windowsPerFloor = Math.floor(width / 2.5);
    
    for (let w = 0; w < windowsPerFloor; w++) {
      const wx = x - width / 2 + 1.5 + w * 2.5;
      const isLit = Math.random() > 0.3;
      const litColor = [COLORS.windowLit, COLORS.windowBlue, COLORS.windowGreen][Math.floor(Math.random() * 3)];
      
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1.6),
        new THREE.MeshStandardMaterial({
          color: isLit ? litColor : COLORS.window,
          emissive: isLit ? litColor : 0,
          emissiveIntensity: isLit ? 0.6 : 0
        })
      );
      win.position.set(wx, floorY, faceZ + (side === 'front' ? -0.01 : 0.01));
      if (side === 'back') win.rotation.y = Math.PI;
      outdoorScene.add(win);

      // Window glow
      if (isLit && Math.random() > 0.7) {
        const glow = new THREE.PointLight(litColor, 0.3, 4);
        glow.position.set(wx, floorY, faceZ + (side === 'front' ? -0.5 : 0.5));
        outdoorScene.add(glow);
      }
    }
  }

  // AC units scattered on facade
  for (let i = 0; i < floors * 2; i++) {
    const ac = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    ac.position.set(
      x - width / 2 + Math.random() * width,
      1 + Math.random() * (height - 2),
      faceZ + (side === 'front' ? -0.3 : 0.3)
    );
    outdoorScene.add(ac);
  }

  // Pipes running down
  for (let p = 0; p < 2; p++) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, height, 6),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    pipe.position.set(
      x - width / 2 + 0.5 + p * (width - 1),
      height / 2,
      faceZ + (side === 'front' ? -0.15 : 0.15)
    );
    outdoorScene.add(pipe);
  }

  // DOOR - clearly visible with glow
  const doorZ2 = side === 'front' ? z - depth / 2 - 0.1 : z + depth / 2 + 0.1;
  
  // Door frame
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(3, 3.5, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x332211 })
  );
  doorFrame.position.set(x, 1.75, doorZ2);
  outdoorScene.add(doorFrame);

  // Door
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 3),
    new THREE.MeshStandardMaterial({ color: COLORS.door })
  );
  door.position.set(x, 1.5, doorZ2 + (side === 'front' ? -0.2 : 0.2));
  if (side === 'back') door.rotation.y = Math.PI;
  outdoorScene.add(door);

  // Door light (warm glow)
  const doorLight = new THREE.PointLight(0xffaa55, 1, 6);
  doorLight.position.set(x, 3, doorZ2 + (side === 'front' ? -1 : 1));
  outdoorScene.add(doorLight);

  // "ENTER" indicator above door
  const enterSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 0.5),
    new THREE.MeshStandardMaterial({ 
      color: 0x00ff00, 
      emissive: 0x00ff00, 
      emissiveIntensity: 0.8 
    })
  );
  enterSign.position.set(x, 3.8, doorZ2 + (side === 'front' ? -0.3 : 0.3));
  if (side === 'back') enterSign.rotation.y = Math.PI;
  outdoorScene.add(enterSign);

  const idx = buildingsData.length;
  buildingsData.push({
    x,
    floors,
    width,
    side,
    doorX: x,
    doorZ: side === 'front' ? 8 : -8  // Position on sidewalk
  });

  return idx;
}

// Add neon sign to building
function addNeonSign(x: number, y: number, z: number, color: number, width: number, height: number, vertical: boolean = false) {
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(vertical ? 0.8 : width, vertical ? height : 0.8, 0.3),
    new THREE.MeshStandardMaterial({ 
      color, 
      emissive: color, 
      emissiveIntensity: 1.5 
    })
  );
  sign.position.set(x, y, z);
  outdoorScene.add(sign);
  
  // Strong glow
  const glow = new THREE.PointLight(color, 2, 12);
  glow.position.set(x, y, z + 0.5);
  outdoorScene.add(glow);

  // Reflection on ground
  const reflection = new THREE.PointLight(color, 0.5, 8);
  reflection.position.set(x, 0.1, z > 0 ? 5 : -5);
  outdoorScene.add(reflection);
}

// Create buildings - FRONT SIDE
createKowloonBuilding(-40, 14, 12, 'front');
createKowloonBuilding(-25, 18, 10, 'front');
createKowloonBuilding(-12, 12, 11, 'front');
createKowloonBuilding(2, 20, 12, 'front');
createKowloonBuilding(16, 15, 10, 'front');
createKowloonBuilding(30, 17, 12, 'front');
createKowloonBuilding(45, 13, 11, 'front');

// Create buildings - BACK SIDE
createKowloonBuilding(-35, 16, 11, 'back');
createKowloonBuilding(-20, 14, 10, 'back');
createKowloonBuilding(-5, 19, 12, 'back');
createKowloonBuilding(10, 11, 10, 'back');
createKowloonBuilding(25, 18, 12, 'back');
createKowloonBuilding(40, 15, 11, 'back');

// NEON SIGNS - Lots of them!
// Front buildings
addNeonSign(-40, 10, 9.5, COLORS.neonPink, 4, 1);
addNeonSign(-40, 18, 9.5, COLORS.neonCyan, 1, 6, true);
addNeonSign(-25, 14, 9.5, COLORS.neonGreen, 3, 1);
addNeonSign(-25, 8, 9.5, COLORS.neonOrange, 1, 4, true);
addNeonSign(-12, 7, 9.5, COLORS.neonPurple, 4, 1);
addNeonSign(2, 16, 9.5, COLORS.neonRed, 5, 1);
addNeonSign(2, 10, 9.5, COLORS.neonCyan, 1, 8, true);
addNeonSign(2, 6, 9.5, COLORS.neonYellow, 3, 1);
addNeonSign(16, 12, 9.5, COLORS.neonPink, 4, 1);
addNeonSign(30, 9, 9.5, COLORS.neonGreen, 1, 5, true);
addNeonSign(30, 15, 9.5, COLORS.neonOrange, 4, 1);
addNeonSign(45, 8, 9.5, COLORS.neonPurple, 3, 1);

// Back buildings
addNeonSign(-35, 12, -9.5, COLORS.neonCyan, 4, 1);
addNeonSign(-20, 9, -9.5, COLORS.neonPink, 1, 5, true);
addNeonSign(-5, 15, -9.5, COLORS.neonGreen, 5, 1);
addNeonSign(-5, 8, -9.5, COLORS.neonRed, 1, 6, true);
addNeonSign(10, 7, -9.5, COLORS.neonYellow, 3, 1);
addNeonSign(25, 14, -9.5, COLORS.neonPurple, 4, 1);
addNeonSign(25, 8, -9.5, COLORS.neonOrange, 1, 5, true);
addNeonSign(40, 11, -9.5, COLORS.neonCyan, 4, 1);

// Hanging wires between buildings
for (let i = 0; i < 20; i++) {
  const wire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 8 + Math.random() * 6, 4),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  wire.position.set(-50 + i * 5, 10 + Math.random() * 15, 0);
  wire.rotation.z = Math.PI / 2;
  wire.rotation.y = (Math.random() - 0.5) * 0.3;
  outdoorScene.add(wire);
}

// Street lamps with flickering
for (let i = -5; i <= 5; i++) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 4),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  pole.position.set(i * 12, 2, 5);
  outdoorScene.add(pole);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshStandardMaterial({ 
      color: 0xffdd88, 
      emissive: 0xffdd88, 
      emissiveIntensity: 0.5 
    })
  );
  lamp.position.set(i * 12, 4.2, 5);
  outdoorScene.add(lamp);

  const light = new THREE.PointLight(0xffdd88, 0.6, 10);
  light.position.set(i * 12, 4, 5);
  outdoorScene.add(light);
}

// Trash, debris
for (let i = 0; i < 15; i++) {
  const trash = new THREE.Mesh(
    new THREE.BoxGeometry(0.3 + Math.random() * 0.3, 0.2, 0.3 + Math.random() * 0.3),
    new THREE.MeshStandardMaterial({ color: 0x333322 })
  );
  trash.position.set(-50 + Math.random() * 100, 0.1, -6 + Math.random() * 12);
  trash.rotation.y = Math.random() * Math.PI;
  outdoorScene.add(trash);
}

// ============================================
// INDOOR SCENE
// ============================================

const indoorAmbient = new THREE.AmbientLight(0x222222, 0.3);
indoorScene.add(indoorAmbient);

let currentFloorGroup: THREE.Group | null = null;

function createFloorView(buildingIdx: number, floor: number) {
  if (currentFloorGroup) {
    indoorScene.remove(currentFloorGroup);
  }

  const bd = buildingsData[buildingIdx];
  if (!bd) return { floorWidth: 28, floorDepth: 18, isTopFloor: false, isGroundFloor: true };
  
  const floorGroup = new THREE.Group();
  
  const floorWidth = 28;
  const floorDepth = 18;
  const isTopFloor = floor === bd.floors - 1;
  const isGroundFloor = floor === 0;

  // Floor tiles (checkered, grimy)
  for (let tx = -7; tx <= 7; tx++) {
    for (let tz = -4; tz <= 4; tz++) {
      const isDark = (tx + tz) % 2 === 0;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.15, 1.9),
        new THREE.MeshStandardMaterial({ 
          color: isDark ? COLORS.floor : COLORS.floorAlt,
          roughness: 0.9
        })
      );
      tile.position.set(tx * 2, 0, tz * 2);
      floorGroup.add(tile);
    }
  }

  // Walls
  const wallMat = new THREE.MeshStandardMaterial({ 
    color: COLORS.wall, 
    roughness: 0.95
  });
  const wallHeight = 3.5;

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(floorWidth, wallHeight, 0.4), wallMat
  );
  backWall.position.set(0, wallHeight / 2, -floorDepth / 2);
  floorGroup.add(backWall);

  // Side walls
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, wallHeight, floorDepth), wallMat
  );
  leftWall.position.set(-floorWidth / 2, wallHeight / 2, 0);
  floorGroup.add(leftWall);

  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, wallHeight, floorDepth), wallMat
  );
  rightWall.position.set(floorWidth / 2, wallHeight / 2, 0);
  floorGroup.add(rightWall);

  // Front wall
  if (isGroundFloor) {
    // With door hole
    const frontLeft = new THREE.Mesh(
      new THREE.BoxGeometry(floorWidth / 2 - 2.5, wallHeight, 0.4), wallMat
    );
    frontLeft.position.set(-floorWidth / 4 - 1.25, wallHeight / 2, floorDepth / 2);
    floorGroup.add(frontLeft);

    const frontRight = new THREE.Mesh(
      new THREE.BoxGeometry(floorWidth / 2 - 2.5, wallHeight, 0.4), wallMat
    );
    frontRight.position.set(floorWidth / 4 + 1.25, wallHeight / 2, floorDepth / 2);
    floorGroup.add(frontRight);

    // Door header
    const doorHeader = new THREE.Mesh(
      new THREE.BoxGeometry(5, wallHeight - 2.8, 0.4), wallMat
    );
    doorHeader.position.set(0, wallHeight - 0.35, floorDepth / 2);
    floorGroup.add(doorHeader);

    // EXIT sign
    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 })
    );
    exitSign.position.set(0, 3, floorDepth / 2 - 0.3);
    floorGroup.add(exitSign);

    const exitLight = new THREE.PointLight(0x00ff00, 0.8, 5);
    exitLight.position.set(0, 3, floorDepth / 2 - 1);
    floorGroup.add(exitLight);
  } else {
    const frontWall = new THREE.Mesh(
      new THREE.BoxGeometry(floorWidth, wallHeight, 0.4), wallMat
    );
    frontWall.position.set(0, wallHeight / 2, floorDepth / 2);
    floorGroup.add(frontWall);
  }

  // Grimy windows (show outside)
  for (let i = -2; i <= 2; i++) {
    const window1 = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 2),
      new THREE.MeshStandardMaterial({ 
        color: 0x1a2030, 
        emissive: 0x1a2030, 
        emissiveIntensity: 0.1,
        transparent: true,
        opacity: 0.6
      })
    );
    window1.position.set(i * 4, 2, -floorDepth / 2 + 0.25);
    floorGroup.add(window1);
  }

  // STAIRS UP (back-right) - green
  if (!isTopFloor) {
    const stairsUp = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.4, 3.5),
      new THREE.MeshStandardMaterial({ color: COLORS.stairs })
    );
    stairsUp.position.set(floorWidth / 2 - 3, 0.25, -floorDepth / 2 + 3);
    floorGroup.add(stairsUp);

    const arrowUp = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 })
    );
    arrowUp.position.set(floorWidth / 2 - 3, 1.5, -floorDepth / 2 + 3);
    floorGroup.add(arrowUp);

    const upLight = new THREE.PointLight(0x00ff00, 1.5, 6);
    upLight.position.set(floorWidth / 2 - 3, 1.5, -floorDepth / 2 + 3);
    floorGroup.add(upLight);
  }

  // STAIRS DOWN (back-left) - orange
  if (!isGroundFloor) {
    const stairsDown = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.4, 3.5),
      new THREE.MeshStandardMaterial({ color: 0x886633 })
    );
    stairsDown.position.set(-floorWidth / 2 + 3, 0.25, -floorDepth / 2 + 3);
    floorGroup.add(stairsDown);

    const arrowDown = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff8800, emissiveIntensity: 1 })
    );
    arrowDown.position.set(-floorWidth / 2 + 3, 1.5, -floorDepth / 2 + 3);
    arrowDown.rotation.z = Math.PI;
    floorGroup.add(arrowDown);

    const downLight = new THREE.PointLight(0xff8800, 1.5, 6);
    downLight.position.set(-floorWidth / 2 + 3, 1.5, -floorDepth / 2 + 3);
    floorGroup.add(downLight);
  }

  // ROOF ACCESS (top floor) - blue
  if (isTopFloor) {
    const roofAccess = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.4, 3.5),
      new THREE.MeshStandardMaterial({ color: 0x335588 })
    );
    roofAccess.position.set(floorWidth / 2 - 3, 0.25, floorDepth / 2 - 3);
    floorGroup.add(roofAccess);

    const roofArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.2, 4),
      new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 1 })
    );
    roofArrow.position.set(floorWidth / 2 - 3, 1.5, floorDepth / 2 - 3);
    floorGroup.add(roofArrow);

    const roofLight = new THREE.PointLight(0x4488ff, 1.5, 6);
    roofLight.position.set(floorWidth / 2 - 3, 1.5, floorDepth / 2 - 3);
    floorGroup.add(roofLight);
  }

  // Random eerie furniture
  for (let i = 0; i < 6; i++) {
    const furn = new THREE.Mesh(
      new THREE.BoxGeometry(1 + Math.random(), 0.5 + Math.random() * 0.8, 1 + Math.random()),
      new THREE.MeshStandardMaterial({ color: 0x3a2a1a })
    );
    furn.position.set(
      -9 + Math.random() * 18,
      0.4,
      -5 + Math.random() * 10
    );
    floorGroup.add(furn);
  }

  // Flickering ceiling light
  const ceilingLight = new THREE.PointLight(0xffffcc, 0.4, 20);
  ceilingLight.position.set(0, 3, 0);
  floorGroup.add(ceilingLight);

  indoorScene.add(floorGroup);
  currentFloorGroup = floorGroup;

  return { floorWidth, floorDepth, isTopFloor, isGroundFloor };
}

// ============================================
// PLAYER WITH FLASHLIGHT
// ============================================
const playerGroup = new THREE.Group();

const playerBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.35, 0.35, 1.1, 12),
  new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
);
playerBody.position.y = 0.55;
playerGroup.add(playerBody);

const playerHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 12, 12),
  new THREE.MeshStandardMaterial({ color: 0xeeddcc })
);
playerHead.position.y = 1.3;
playerGroup.add(playerHead);

// Direction cone
const dirMarker = new THREE.Mesh(
  new THREE.ConeGeometry(0.15, 0.3, 4),
  new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0xff0066, emissiveIntensity: 0.8 })
);
dirMarker.position.set(0, 1.3, 0.4);
dirMarker.rotation.x = Math.PI / 2;
playerGroup.add(dirMarker);

// Shadow
const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.45, 16),
  new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.4 })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = 0.02;
playerGroup.add(shadow);

// FLASHLIGHT
const flashlight = new THREE.SpotLight(0xffffee, 3, 15, Math.PI / 6, 0.3, 1);
flashlight.position.set(0, 1, 0.3);
flashlight.target.position.set(0, 0, 5);
playerGroup.add(flashlight);
playerGroup.add(flashlight.target);

// Flashlight beam visual
const beamGeo = new THREE.ConeGeometry(0.08, 0.3, 8);
const beamMat = new THREE.MeshStandardMaterial({ 
  color: 0xffffaa, 
  emissive: 0xffffaa, 
  emissiveIntensity: 0.5 
});
const flashlightMesh = new THREE.Mesh(beamGeo, beamMat);
flashlightMesh.position.set(0.25, 0.8, 0.3);
flashlightMesh.rotation.x = Math.PI / 2;
playerGroup.add(flashlightMesh);

playerGroup.position.set(0, 0.1, 0);
outdoorScene.add(playerGroup);

const player = {
  x: 0,
  z: 0,
  facing: 0,
  speed: 0.22
};

// ============================================
// INPUT
// ============================================
const keys = { left: false, right: false, forward: false, backward: false, interact: false };

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.forward = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.backward = true;
  if (e.code === 'KeyE' || e.code === 'Space') keys.interact = true;
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.forward = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.backward = false;
  if (e.code === 'KeyE' || e.code === 'Space') keys.interact = false;
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
let interactCooldown = 0;

canvas.addEventListener('click', () => {
  if (!hasStarted && instructions) {
    instructions.classList.add('hidden');
    hasStarted = true;
  }
});
instructions?.addEventListener('click', () => {
  if (!hasStarted && instructions) {
    instructions.classList.add('hidden');
    hasStarted = true;
  }
});
popupClose?.addEventListener('click', () => { if (popup) popup.style.display = 'none'; });

function showPopup(text: string): void {
  if (popup && popupText) {
    popupText.textContent = text;
    popup.style.display = 'flex';
  }
}

function updateUI(): void {
  if (scrollCounter) {
    if (state.mode === 'indoor' && state.currentBuilding >= 0) {
      const bd = buildingsData[state.currentBuilding];
      scrollCounter.textContent = `FLOOR ${state.currentFloor + 1} / ${bd?.floors ?? '?'}`;
    } else {
      scrollCounter.textContent = 'KOWLOON STREETS';
    }
  }
}

// ============================================
// GAME LOGIC
// ============================================
let floorInfo = { floorWidth: 28, floorDepth: 18, isTopFloor: false, isGroundFloor: true };

function enterBuilding(buildingIdx: number) {
  state.mode = 'indoor';
  state.currentBuilding = buildingIdx;
  state.currentFloor = 0;

  outdoorScene.visible = false;
  indoorScene.visible = true;

  outdoorScene.remove(playerGroup);
  indoorScene.add(playerGroup);

  floorInfo = createFloorView(buildingIdx, 0);
  player.x = 0;
  player.z = 6;
  playerGroup.position.set(0, 0.1, 6);

  updateUI();
}

function exitBuilding() {
  state.mode = 'outdoor';
  const bd = buildingsData[state.currentBuilding];

  outdoorScene.visible = true;
  indoorScene.visible = false;

  indoorScene.remove(playerGroup);
  outdoorScene.add(playerGroup);

  player.x = bd?.doorX ?? 0;
  player.z = bd?.doorZ ?? 0;
  playerGroup.position.set(player.x, 0.1, player.z);

  state.currentBuilding = -1;
  state.currentFloor = 0;

  updateUI();
}

function goUpFloor() {
  const bd = buildingsData[state.currentBuilding];
  if (!bd) return;
  if (state.currentFloor < bd.floors - 1) {
    state.currentFloor++;
    floorInfo = createFloorView(state.currentBuilding, state.currentFloor);
    player.x = floorInfo.floorWidth / 2 - 3;
    player.z = -floorInfo.floorDepth / 2 + 5;
    playerGroup.position.set(player.x, 0.1, player.z);
    updateUI();
  }
}

function goDownFloor() {
  if (state.currentFloor > 0) {
    state.currentFloor--;
    floorInfo = createFloorView(state.currentBuilding, state.currentFloor);
    player.x = -floorInfo.floorWidth / 2 + 3;
    player.z = -floorInfo.floorDepth / 2 + 5;
    playerGroup.position.set(player.x, 0.1, player.z);
    updateUI();
  }
}

function jumpOffRoof() {
  exitBuilding();
  showPopup("You jumped from the roof and landed on the street below!");
}

function update() {
  if (interactCooldown > 0) interactCooldown--;

  let moveX = 0;
  let moveZ = 0;
  if (keys.left) moveX -= player.speed;
  if (keys.right) moveX += player.speed;
  if (keys.forward) moveZ -= player.speed;
  if (keys.backward) moveZ += player.speed;

  // Update facing
  if (moveX !== 0 || moveZ !== 0) {
    player.facing = Math.atan2(moveX, -moveZ);
    dirMarker.rotation.y = player.facing;
    dirMarker.position.x = Math.sin(player.facing) * 0.35;
    dirMarker.position.z = -Math.cos(player.facing) * 0.35;
    
    // Update flashlight direction
    flashlight.target.position.x = Math.sin(player.facing) * 10;
    flashlight.target.position.z = -Math.cos(player.facing) * 10;
    flashlightMesh.rotation.y = player.facing;
    flashlightMesh.position.x = Math.sin(player.facing) * 0.35 + 0.1;
    flashlightMesh.position.z = -Math.cos(player.facing) * 0.35;
  }

  if (state.mode === 'outdoor') {
    player.x += moveX;
    player.z += moveZ;

    // Stay on sidewalks/street
    player.x = Math.max(-55, Math.min(55, player.x));
    player.z = Math.max(-6, Math.min(6, player.z));

    playerGroup.position.set(player.x, 0.1, player.z);

    // Check building entry
    if (keys.interact && interactCooldown === 0) {
      for (let i = 0; i < buildingsData.length; i++) {
        const bd = buildingsData[i];
        if (!bd) continue;
        const dist = Math.abs(player.x - bd.doorX) + Math.abs(player.z - bd.doorZ);
        if (dist < 4) {
          enterBuilding(i);
          interactCooldown = 15;
          return;
        }
      }
    }

  } else {
    player.x += moveX;
    player.z += moveZ;

    const halfW = floorInfo.floorWidth / 2 - 1;
    const halfD = floorInfo.floorDepth / 2 - 1;
    player.x = Math.max(-halfW, Math.min(halfW, player.x));
    player.z = Math.max(-halfD, Math.min(halfD, player.z));

    playerGroup.position.set(player.x, 0.1, player.z);

    if (keys.interact && interactCooldown === 0) {
      // STAIRS UP
      if (!floorInfo.isTopFloor) {
        const stairX = halfW - 1;
        const stairZ = -halfD + 1;
        if (Math.abs(player.x - stairX) < 2.5 && Math.abs(player.z - stairZ) < 2.5) {
          goUpFloor();
          interactCooldown = 15;
          return;
        }
      }

      // STAIRS DOWN
      if (!floorInfo.isGroundFloor) {
        const stairX = -halfW + 1;
        const stairZ = -halfD + 1;
        if (Math.abs(player.x - stairX) < 2.5 && Math.abs(player.z - stairZ) < 2.5) {
          goDownFloor();
          interactCooldown = 15;
          return;
        }
      }

      // DOOR EXIT (ground floor)
      if (floorInfo.isGroundFloor && Math.abs(player.x) < 3 && player.z > halfD - 2) {
        exitBuilding();
        interactCooldown = 15;
        return;
      }

      // ROOF EXIT (top floor)
      if (floorInfo.isTopFloor) {
        const roofX = halfW - 1;
        const roofZ = halfD - 1;
        if (Math.abs(player.x - roofX) < 2.5 && Math.abs(player.z - roofZ) < 2.5) {
          jumpOffRoof();
          interactCooldown = 15;
          return;
        }
      }
    }
  }
}

// ============================================
// CAMERA
// ============================================
function updateCamera() {
  if (state.mode === 'outdoor') {
    viewSize = 14;
    camera.position.set(player.x + 12, 10, player.z + 22);
    camera.lookAt(player.x, 4, player.z);
  } else {
    viewSize = 16;
    camera.position.set(0, 28, 12);
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
// GAME LOOP
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
