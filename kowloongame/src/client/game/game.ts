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
// KOWLOON CITY LAYOUT - Dense buildings with alleyways
// ============================================
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 150),
  new THREE.MeshLambertMaterial({ color: 0x1a1815 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, 0, -35);  // Centered on the expanded city
outdoorScene.add(ground);

// ============================================
// BUILDING DATA
// ============================================
interface BuildingData {
  x: number;
  z: number;
  floors: number;
  group: THREE.Group;
  width: number;
  depth: number;
}

const buildingsData: BuildingData[] = [];
const allBuildingMeshes: THREE.Mesh[] = [];

// City layout - DENSE buildings with NAVIGABLE alleyways (7 rows)
// ALL buildings are enterable - consistent spacing for player access
// Buildings are 7 units wide, spaced 10 units apart (3 unit alleyways)
const cityLayout = [
  // Row 1 (far back) - z = -70
  { x: -30, z: -70, w: 7, d: 6, floors: 14 },
  { x: -20, z: -70, w: 7, d: 6, floors: 16 },
  { x: -10, z: -70, w: 7, d: 6, floors: 12 },
  { x: 0, z: -70, w: 7, d: 6, floors: 18 },
  { x: 10, z: -70, w: 7, d: 6, floors: 13 },
  { x: 20, z: -70, w: 7, d: 6, floors: 15 },
  { x: 30, z: -70, w: 7, d: 6, floors: 17 },
  // Row 2 - z = -58
  { x: -30, z: -58, w: 7, d: 6, floors: 15 },
  { x: -20, z: -58, w: 7, d: 6, floors: 11 },
  { x: -10, z: -58, w: 7, d: 6, floors: 19 },
  { x: 0, z: -58, w: 7, d: 6, floors: 13 },
  { x: 10, z: -58, w: 7, d: 6, floors: 16 },
  { x: 20, z: -58, w: 7, d: 6, floors: 14 },
  { x: 30, z: -58, w: 7, d: 6, floors: 12 },
  // Row 3 - z = -46
  { x: -30, z: -46, w: 7, d: 6, floors: 17 },
  { x: -20, z: -46, w: 7, d: 6, floors: 13 },
  { x: -10, z: -46, w: 7, d: 6, floors: 20 },
  { x: 0, z: -46, w: 7, d: 6, floors: 11 },
  { x: 10, z: -46, w: 7, d: 6, floors: 18 },
  { x: 20, z: -46, w: 7, d: 6, floors: 14 },
  { x: 30, z: -46, w: 7, d: 6, floors: 16 },
  // Row 4 - z = -34
  { x: -30, z: -34, w: 7, d: 6, floors: 12 },
  { x: -20, z: -34, w: 7, d: 6, floors: 16 },
  { x: -10, z: -34, w: 7, d: 6, floors: 14 },
  { x: 0, z: -34, w: 7, d: 6, floors: 19 },
  { x: 10, z: -34, w: 7, d: 6, floors: 11 },
  { x: 20, z: -34, w: 7, d: 6, floors: 17 },
  { x: 30, z: -34, w: 7, d: 6, floors: 13 },
  // Row 5 - z = -22
  { x: -30, z: -22, w: 7, d: 6, floors: 18 },
  { x: -20, z: -22, w: 7, d: 6, floors: 12 },
  { x: -10, z: -22, w: 7, d: 6, floors: 15 },
  { x: 0, z: -22, w: 7, d: 6, floors: 20 },
  { x: 10, z: -22, w: 7, d: 6, floors: 13 },
  { x: 20, z: -22, w: 7, d: 6, floors: 16 },
  { x: 30, z: -22, w: 7, d: 6, floors: 14 },
  // Row 6 - z = -10
  { x: -30, z: -10, w: 7, d: 6, floors: 14 },
  { x: -20, z: -10, w: 7, d: 6, floors: 17 },
  { x: -10, z: -10, w: 7, d: 6, floors: 11 },
  { x: 0, z: -10, w: 7, d: 6, floors: 19 },
  { x: 10, z: -10, w: 7, d: 6, floors: 15 },
  { x: 20, z: -10, w: 7, d: 6, floors: 12 },
  { x: 30, z: -10, w: 7, d: 6, floors: 18 },
];

function createCityBuilding(config: typeof cityLayout[0], index: number) {
  const { x, z, w, d, floors } = config;
  const height = floors * 2.2;
  const group = new THREE.Group();
  
  const colors = [0x4a4540, 0x45404a, 0x504548, 0x484550, 0x454048];
  const color = colors[index % colors.length];
  
  // Main building mesh
  const buildingMat = new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 1 });
  const building = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), buildingMat);
  building.position.set(0, height / 2, 0);
  group.add(building);
  allBuildingMeshes.push(building);

  // ========== WINDOWS - Chaotic pattern ==========
  for (let f = 0; f < floors; f++) {
    const y = f * 2.2 + 1.5;
    for (let wx = 0; wx < Math.floor(w / 2); wx++) {
      if (Math.random() > 0.15) { // Some windows missing/blocked
        const isLit = Math.random() > 0.4;
        const litColors = [0xffdd66, 0xffaa44, 0x66ddff, 0x88ffaa, 0xffccaa, 0xaaffcc];
        const winW = 0.6 + Math.random() * 0.5;
        const winH = 0.8 + Math.random() * 0.8;
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(winW, winH),
          new THREE.MeshBasicMaterial({ 
            color: isLit ? litColors[Math.floor(Math.random() * 6)] : 0x1a2535,
            transparent: true, opacity: 1
          })
        );
        win.position.set(-w/2 + 1 + wx * 2 + Math.random() * 0.5, y, d/2 + 0.01);
        group.add(win);
        allBuildingMeshes.push(win);
        
        // Window frames (random styles)
        if (Math.random() > 0.5) {
          const frame = new THREE.Mesh(
            new THREE.BoxGeometry(winW + 0.2, winH + 0.2, 0.05),
            new THREE.MeshLambertMaterial({ color: 0x333333, transparent: true, opacity: 1 })
          );
          frame.position.copy(win.position);
          frame.position.z -= 0.02;
          group.add(frame);
        }
      }
    }
  }

  // ========== AC UNITS - Lots of them! ==========
  for (let f = 0; f < floors; f++) {
    if (Math.random() > 0.3) {
      const acX = -w/2 + 1 + Math.random() * (w - 2);
      const ac = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.6),
        new THREE.MeshLambertMaterial({ color: 0xccccbb, transparent: true, opacity: 1 })
      );
      ac.position.set(acX, f * 2.2 + 1, d/2 + 0.35);
      group.add(ac);
      allBuildingMeshes.push(ac);
      // AC drip stain
      const drip = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, Math.random() * 2 + 0.5),
        new THREE.MeshBasicMaterial({ color: 0x2a3530, transparent: true, opacity: 0.6 })
      );
      drip.position.set(acX, f * 2.2 - 0.5, d/2 + 0.02);
      group.add(drip);
    }
  }

  // ========== PIPES - Running up the building ==========
  const pipeCount = 2 + Math.floor(Math.random() * 4);
  for (let p = 0; p < pipeCount; p++) {
    const pipeX = -w/2 + 0.5 + Math.random() * (w - 1);
    const pipeH = 3 + Math.random() * (height - 5);
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, pipeH, 6),
      new THREE.MeshLambertMaterial({ color: 0x444444, transparent: true, opacity: 1 })
    );
    pipe.position.set(pipeX, pipeH / 2 + Math.random() * 3, d/2 + 0.15);
    group.add(pipe);
    allBuildingMeshes.push(pipe);
  }

  // ========== WIRES - Messy electrical ==========
  for (let i = 0; i < 5 + Math.floor(Math.random() * 8); i++) {
    const wireY = 2 + Math.random() * (height - 4);
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, w * 0.8, 4),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    wire.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
    wire.position.set(0, wireY, d/2 + 0.25 + Math.random() * 0.2);
    group.add(wire);
  }

  // ========== NEON SIGNS - Multiple chaotic signs ==========
  const signCount = 1 + Math.floor(Math.random() * 4);
  const neonColors = [0xff0066, 0x00ffff, 0xff6600, 0x00ff66, 0xff00ff, 0xffff00, 0xff3333, 0x33ff33];
  for (let s = 0; s < signCount; s++) {
    const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];
    const isVertical = Math.random() > 0.5;
    const signW = isVertical ? (0.4 + Math.random() * 0.3) : (1.5 + Math.random() * 2);
    const signH = isVertical ? (2 + Math.random() * 4) : (0.5 + Math.random() * 0.5);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(signW, signH, 0.1),
      new THREE.MeshBasicMaterial({ color: neonColor, transparent: true, opacity: 1 })
    );
    const signX = (Math.random() - 0.5) * w * 0.9;
    const signY = 3 + Math.random() * Math.min(height - 6, 15);
    sign.position.set(signX, signY, d/2 + 0.3 + s * 0.1);
    group.add(sign);
    allBuildingMeshes.push(sign);
    
    const glow = new THREE.PointLight(neonColor, 0.5, 4);
    glow.position.set(signX, signY, d/2 + 1);
    group.add(glow);
  }

  // ========== LAUNDRY - Hanging clothes ==========
  for (let f = 2; f < floors - 1; f += 2) {
    if (Math.random() > 0.4) {
      const laundryX = -w/2 + 2 + Math.random() * (w - 4);
      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 2.5, 4),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      pole.rotation.z = Math.PI / 2;
      pole.position.set(laundryX, f * 2.2 + 1.5, d/2 + 1);
      group.add(pole);
      // Clothes
      const clothColors = [0xeeeedd, 0x6688aa, 0xaa6655, 0x55aa66, 0xddddcc, 0x887766];
      for (let c = 0; c < 3 + Math.floor(Math.random() * 4); c++) {
        const cloth = new THREE.Mesh(
          new THREE.PlaneGeometry(0.3 + Math.random() * 0.3, 0.5 + Math.random() * 0.4),
          new THREE.MeshLambertMaterial({ 
            color: clothColors[Math.floor(Math.random() * clothColors.length)],
            side: THREE.DoubleSide
          })
        );
        cloth.position.set(laundryX - 1 + c * 0.5, f * 2.2 + 1.2, d/2 + 1);
        cloth.rotation.y = Math.random() * 0.3;
        group.add(cloth);
      }
    }
  }

  // ========== PLANTS on windowsills ==========
  for (let f = 0; f < floors; f++) {
    if (Math.random() > 0.7) {
      const plantX = -w/2 + 1 + Math.random() * (w - 2);
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.12, 0.2, 6),
        new THREE.MeshLambertMaterial({ color: 0x8b4513 })
      );
      pot.position.set(plantX, f * 2.2 + 0.6, d/2 + 0.3);
      group.add(pot);
      const plant = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0x228822 })
      );
      plant.position.set(plantX, f * 2.2 + 0.9, d/2 + 0.3);
      group.add(plant);
    }
  }

  // ========== BALCONY CLUTTER ==========
  for (let f = 1; f < floors; f++) {
    if (Math.random() > 0.6) {
      const clutterX = -w/2 + 1 + Math.random() * (w - 2);
      // Random boxes/stuff
      for (let b = 0; b < 2 + Math.floor(Math.random() * 3); b++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.3 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0.2),
          new THREE.MeshLambertMaterial({ color: 0x665544 + Math.floor(Math.random() * 0x222222) })
        );
        box.position.set(clutterX + b * 0.35, f * 2.2 + 0.15, d/2 + 0.35);
        group.add(box);
      }
    }
  }

  // ========== ROOFTOP CHAOS ==========
  // Water tanks
  for (let t = 0; t < 1 + Math.floor(Math.random() * 3); t++) {
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 1.2, 8),
      new THREE.MeshLambertMaterial({ color: 0x4466aa, transparent: true, opacity: 1 })
    );
    tank.position.set(-w/3 + t * 2 + Math.random(), height + 0.6, Math.random() * 2 - 1);
    group.add(tank);
    allBuildingMeshes.push(tank);
  }
  // Antennas
  for (let a = 0; a < 2 + Math.floor(Math.random() * 4); a++) {
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.5 + Math.random() * 2, 4),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    antenna.position.set(-w/3 + Math.random() * (w * 0.6), height + 1, Math.random() * 2 - 1);
    group.add(antenna);
  }
  // Satellite dishes
  if (Math.random() > 0.5) {
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    dish.rotation.x = Math.PI / 4;
    dish.position.set(w/4, height + 0.3, 0);
    group.add(dish);
  }

  // ========== DOOR ==========
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 3.2, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x3a2a1a, transparent: true, opacity: 1 })
  );
  doorFrame.position.set(0, 1.6, d/2 + 0.15);
  group.add(doorFrame);
  allBuildingMeshes.push(doorFrame);
  
  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2.8),
    new THREE.MeshLambertMaterial({ color: 0x553322, transparent: true, opacity: 1 })
  );
  door.position.set(0, 1.4, d/2 + 0.3);
  group.add(door);
  allBuildingMeshes.push(door);
  
  const doorLight = new THREE.PointLight(0xffaa55, 0.6, 5);
  doorLight.position.set(0, 3, d/2 + 1);
  group.add(doorLight);
  
  // Store building data for entry
  buildingsData.push({ x, z, floors, group, width: w, depth: d });
  
  group.position.set(x, 0, z);
  outdoorScene.add(group);
}

// Create all city buildings
cityLayout.forEach((config, i) => createCityBuilding(config, i));

// Alleyway ground markings
for (let i = 0; i < 20; i++) {
  const alley = new THREE.Mesh(
    new THREE.PlaneGeometry(2 + Math.random() * 2, 15 + Math.random() * 20),
    new THREE.MeshLambertMaterial({ color: 0x252220 })
  );
  alley.rotation.x = -Math.PI / 2;
  alley.position.set(-30 + Math.random() * 60, 0.01, -35 + Math.random() * 30);
  alley.rotation.z = Math.random() * 0.3;
  outdoorScene.add(alley);
}

// Ambient city lights
for (let i = 0; i < 8; i++) {
  const light = new THREE.PointLight(0xffddaa, 0.3, 15);
  light.position.set(-25 + i * 8, 3, -20 + (i % 3) * 10);
  outdoorScene.add(light);
}

// Function to update building transparency based on player position
function updateBuildingTransparency() {
  const playerPos = new THREE.Vector3(player.x, 1.5, player.z);
  const cameraPos = camera.position.clone();
  
  for (const mesh of allBuildingMeshes) {
    if (!mesh.material || Array.isArray(mesh.material)) continue;
    const mat = mesh.material as THREE.MeshLambertMaterial | THREE.MeshBasicMaterial;
    
    // Get mesh world position
    const meshPos = new THREE.Vector3();
    mesh.getWorldPosition(meshPos);
    
    // Check if mesh is between camera and player
    const toPlayer = playerPos.clone().sub(cameraPos);
    const toMesh = meshPos.clone().sub(cameraPos);
    
    const distToPlayer = toPlayer.length();
    const distToMesh = toMesh.length();
    
    // If mesh is closer than player and roughly in the same direction
    if (distToMesh < distToPlayer - 2) {
      const dot = toPlayer.normalize().dot(toMesh.normalize());
      if (dot > 0.7) {
        // Mesh is blocking view - make transparent
        mat.opacity = 0.15;
      } else {
        mat.opacity = 1;
      }
    } else {
      mat.opacity = 1;
    }
  }
}

// ============================================
// NPCs - People and Animals
// ============================================
interface NPC {
  mesh: THREE.Group;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  type: 'person' | 'fox' | 'monkey' | 'squirrel' | 'mouse';
  indoor: boolean;
  buildingIdx: number;
  floorIdx: number;
}

const outdoorNPCs: NPC[] = [];
const indoorNPCs: NPC[] = [];

// Create a person mesh
function createPersonMesh(): THREE.Group {
  const group = new THREE.Group();
  
  // Random clothing colors
  const shirtColors = [0x3355aa, 0xaa3355, 0x55aa33, 0xaaaa33, 0x8833aa, 0x33aaaa, 0xaa5533];
  const pantsColors = [0x222233, 0x333322, 0x2a2a3a, 0x3a3a2a];
  const skinColors = [0xeeddcc, 0xddccaa, 0xccaa88, 0xaa8866];
  
  // Body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 0.9, 8),
    new THREE.MeshLambertMaterial({ color: shirtColors[Math.floor(Math.random() * shirtColors.length)] })
  );
  body.position.y = 0.7;
  group.add(body);
  
  // Legs
  const legs = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.2, 0.5, 8),
    new THREE.MeshLambertMaterial({ color: pantsColors[Math.floor(Math.random() * pantsColors.length)] })
  );
  legs.position.y = 0.25;
  group.add(legs);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 8),
    new THREE.MeshLambertMaterial({ color: skinColors[Math.floor(Math.random() * skinColors.length)] })
  );
  head.position.y = 1.35;
  group.add(head);
  
  // Hair
  const hairColors = [0x222211, 0x111100, 0x332211, 0x553322, 0x666655];
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshLambertMaterial({ color: hairColors[Math.floor(Math.random() * hairColors.length)] })
  );
  hair.position.y = 1.4;
  group.add(hair);
  
  return group;
}

// Create a fox mesh
function createFoxMesh(): THREE.Group {
  const group = new THREE.Group();
  
  // Body
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.7, 8),
    new THREE.MeshLambertMaterial({ color: 0xdd6622 })
  );
  body.rotation.x = Math.PI / 2;
  body.position.set(0, 0.3, 0);
  group.add(body);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshLambertMaterial({ color: 0xdd6622 })
  );
  head.position.set(0, 0.35, 0.4);
  group.add(head);
  
  // Snout
  const snout = new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.25, 6),
    new THREE.MeshLambertMaterial({ color: 0xeeeeee })
  );
  snout.rotation.x = -Math.PI / 2;
  snout.position.set(0, 0.3, 0.6);
  group.add(snout);
  
  // Ears
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.2, 4),
      new THREE.MeshLambertMaterial({ color: 0xdd6622 })
    );
    ear.position.set(side * 0.12, 0.55, 0.35);
    group.add(ear);
  }
  
  // Tail
  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.15, 0.5, 6),
    new THREE.MeshLambertMaterial({ color: 0xeeeeee })
  );
  tail.rotation.x = Math.PI / 4;
  tail.position.set(0, 0.4, -0.45);
  group.add(tail);
  
  // Legs
  for (let lx = -1; lx <= 1; lx += 2) {
    for (let lz = -1; lz <= 1; lz += 2) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.25, 4),
        new THREE.MeshLambertMaterial({ color: 0x111111 })
      );
      leg.position.set(lx * 0.12, 0.1, lz * 0.15);
      group.add(leg);
    }
  }
  
  return group;
}

// Create a monkey mesh
function createMonkeyMesh(): THREE.Group {
  const group = new THREE.Group();
  const brown = 0x8B4513;
  const tan = 0xDEB887;
  
  // Body
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 8),
    new THREE.MeshLambertMaterial({ color: brown })
  );
  body.scale.set(1, 1.2, 0.9);
  body.position.set(0, 0.5, 0);
  group.add(body);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 8, 8),
    new THREE.MeshLambertMaterial({ color: brown })
  );
  head.position.set(0, 0.85, 0.1);
  group.add(head);
  
  // Face
  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshLambertMaterial({ color: tan })
  );
  face.position.set(0, 0.82, 0.22);
  group.add(face);
  
  // Ears
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshLambertMaterial({ color: tan })
    );
    ear.position.set(side * 0.2, 0.9, 0.05);
    group.add(ear);
  }
  
  // Arms
  for (let side = -1; side <= 1; side += 2) {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.04, 0.4, 6),
      new THREE.MeshLambertMaterial({ color: brown })
    );
    arm.position.set(side * 0.25, 0.4, 0);
    arm.rotation.z = side * 0.3;
    group.add(arm);
  }
  
  // Legs
  for (let side = -1; side <= 1; side += 2) {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.05, 0.3, 6),
      new THREE.MeshLambertMaterial({ color: brown })
    );
    leg.position.set(side * 0.12, 0.15, 0);
    group.add(leg);
  }
  
  // Tail (curled)
  const tail = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.03, 6, 12, Math.PI * 1.5),
    new THREE.MeshLambertMaterial({ color: brown })
  );
  tail.position.set(0, 0.5, -0.3);
  tail.rotation.y = Math.PI / 2;
  group.add(tail);
  
  return group;
}

// Create a squirrel mesh
function createSquirrelMesh(): THREE.Group {
  const group = new THREE.Group();
  const gray = 0x808080;
  const lightGray = 0xC0C0C0;
  
  // Body
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshLambertMaterial({ color: gray })
  );
  body.scale.set(1, 0.8, 1.3);
  body.position.set(0, 0.15, 0);
  group.add(body);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshLambertMaterial({ color: gray })
  );
  head.position.set(0, 0.22, 0.15);
  group.add(head);
  
  // Nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 4, 4),
    new THREE.MeshLambertMaterial({ color: 0x111111 })
  );
  nose.position.set(0, 0.2, 0.23);
  group.add(nose);
  
  // Ears
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.06, 4),
      new THREE.MeshLambertMaterial({ color: gray })
    );
    ear.position.set(side * 0.06, 0.3, 0.12);
    group.add(ear);
  }
  
  // Big fluffy tail
  const tail = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshLambertMaterial({ color: lightGray })
  );
  tail.scale.set(0.6, 1.5, 0.6);
  tail.position.set(0, 0.25, -0.18);
  tail.rotation.x = -0.5;
  group.add(tail);
  
  // Legs
  for (let lx = -1; lx <= 1; lx += 2) {
    for (let lz = -1; lz <= 1; lz += 2) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 0.1, 4),
        new THREE.MeshLambertMaterial({ color: gray })
      );
      leg.position.set(lx * 0.06, 0.05, lz * 0.08);
      group.add(leg);
    }
  }
  
  return group;
}

// Create a mouse mesh
function createMouseMesh(): THREE.Group {
  const group = new THREE.Group();
  const gray = 0x555555;
  const pink = 0xFFAAAA;
  
  // Body
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshLambertMaterial({ color: gray })
  );
  body.scale.set(1, 0.7, 1.4);
  body.position.set(0, 0.06, 0);
  group.add(body);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshLambertMaterial({ color: gray })
  );
  head.position.set(0, 0.08, 0.08);
  group.add(head);
  
  // Nose
  const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.015, 4, 4),
    new THREE.MeshLambertMaterial({ color: pink })
  );
  nose.position.set(0, 0.07, 0.12);
  group.add(nose);
  
  // Big round ears
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 6, 6),
      new THREE.MeshLambertMaterial({ color: pink })
    );
    ear.scale.set(1, 1, 0.3);
    ear.position.set(side * 0.04, 0.12, 0.05);
    group.add(ear);
  }
  
  // Long thin tail
  const tail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.008, 0.15, 4),
    new THREE.MeshLambertMaterial({ color: pink })
  );
  tail.rotation.x = Math.PI / 3;
  tail.position.set(0, 0.08, -0.12);
  group.add(tail);
  
  // Tiny legs
  for (let lx = -1; lx <= 1; lx += 2) {
    for (let lz = -1; lz <= 1; lz += 2) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.04, 4),
        new THREE.MeshLambertMaterial({ color: pink })
      );
      leg.position.set(lx * 0.03, 0.02, lz * 0.04);
      group.add(leg);
    }
  }
  
  return group;
}

// Spawn outdoor NPCs
function spawnOutdoorNPCs() {
  // Spawn various NPCs in the city
  // 12 people, 4 foxes, 4 monkeys, 6 squirrels, 8 mice = 34 total
  const npcTypes: { type: NPC['type']; count: number; speed: number }[] = [
    { type: 'person', count: 12, speed: 0.04 },
    { type: 'fox', count: 4, speed: 0.08 },
    { type: 'monkey', count: 4, speed: 0.06 },
    { type: 'squirrel', count: 6, speed: 0.1 },
    { type: 'mouse', count: 8, speed: 0.12 },
  ];
  
  for (const npcDef of npcTypes) {
    for (let i = 0; i < npcDef.count; i++) {
      let mesh: THREE.Group;
      switch (npcDef.type) {
        case 'fox': mesh = createFoxMesh(); break;
        case 'monkey': mesh = createMonkeyMesh(); break;
        case 'squirrel': mesh = createSquirrelMesh(); break;
        case 'mouse': mesh = createMouseMesh(); break;
        default: mesh = createPersonMesh();
      }
      
      // Random position in alleyways
      const x = -35 + Math.random() * 70;
      const z = -40 + Math.random() * 45;
      
      mesh.position.set(x, 0, z);
      outdoorScene.add(mesh);
      
      outdoorNPCs.push({
        mesh,
        x,
        z,
        targetX: x,
        targetZ: z,
        speed: npcDef.speed,
        type: npcDef.type,
        indoor: false,
        buildingIdx: -1,
        floorIdx: -1
      });
    }
  }
}

// Spawn indoor NPCs for current floor
function spawnIndoorNPCs(buildingIdx: number, floorIdx: number, floorW: number, floorD: number) {
  // Clear existing indoor NPCs
  for (const npc of indoorNPCs) {
    indoorScene.remove(npc.mesh);
  }
  indoorNPCs.length = 0;
  
  // Spawn 4-8 NPCs per floor (mix of types)
  const count = 4 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    // Random type selection
    const roll = Math.random();
    let type: NPC['type'];
    let mesh: THREE.Group;
    let speed: number;
    
    if (roll < 0.5) {
      type = 'person'; mesh = createPersonMesh(); speed = 0.03;
    } else if (roll < 0.65) {
      type = 'fox'; mesh = createFoxMesh(); speed = 0.05;
    } else if (roll < 0.75) {
      type = 'monkey'; mesh = createMonkeyMesh(); speed = 0.045;
    } else if (roll < 0.88) {
      type = 'squirrel'; mesh = createSquirrelMesh(); speed = 0.07;
    } else {
      type = 'mouse'; mesh = createMouseMesh(); speed = 0.08;
    }
    
    // Random position on floor (avoiding edges)
    const x = -floorW/2 + 3 + Math.random() * (floorW - 6);
    const z = -floorD/2 + 3 + Math.random() * (floorD - 6);
    
    mesh.position.set(x, 0, z);
    indoorScene.add(mesh);
    
    indoorNPCs.push({
      mesh,
      x,
      z,
      targetX: x,
      targetZ: z,
      speed,
      type,
      indoor: true,
      buildingIdx,
      floorIdx
    });
  }
}

// Update NPC positions with wall collision
function updateNPCs() {
  const npcsToUpdate = state.mode === 'outdoor' ? outdoorNPCs : indoorNPCs;
  
  // Room definitions for indoor collision (same as player)
  const doorW = 1.6;
  type RoomDef = { x: number, z: number, w: number, d: number, door: 'front' | 'back' | 'left' | 'right' };
  
  function getIndoorRooms(): RoomDef[] {
    if (!floor) return [];
    const hw = floor.w / 2, hd = floor.d / 2;
    
    if (floor.ground) {
      return [
        { x: -hw + 5, z: -hd + 6, w: 7, d: 5, door: 'right' },
        { x: -hw + 5, z: -hd + 13, w: 7, d: 5, door: 'right' },
        { x: -hw + 5, z: -hd + 20, w: 7, d: 5, door: 'right' },
        { x: hw - 5, z: hd - 6, w: 7, d: 5, door: 'left' },
        { x: hw - 5, z: hd - 13, w: 7, d: 5, door: 'left' },
        { x: -12, z: -hd + 5, w: 6, d: 5, door: 'front' },
      ];
    } else if (!floor.top) {
      return [
        { x: -20, z: -12, w: 5, d: 5, door: 'front' },
        { x: -20, z: -4, w: 5, d: 5, door: 'front' },
        { x: -20, z: 4, w: 5, d: 5, door: 'front' },
        { x: -20, z: 12, w: 5, d: 5, door: 'front' },
        { x: -10, z: -12, w: 5, d: 5, door: 'front' },
        { x: -10, z: -4, w: 5, d: 5, door: 'front' },
        { x: -10, z: 4, w: 5, d: 5, door: 'front' },
        { x: -10, z: 12, w: 5, d: 5, door: 'front' },
        { x: 2, z: -12, w: 5, d: 5, door: 'front' },
        { x: 2, z: -4, w: 5, d: 5, door: 'front' },
        { x: 2, z: 4, w: 5, d: 5, door: 'front' },
        { x: 2, z: 12, w: 5, d: 5, door: 'front' },
        { x: 12, z: 4, w: 5, d: 5, door: 'front' },
        { x: 12, z: 12, w: 5, d: 5, door: 'front' },
      ];
    }
    return [];
  }
  
  // Check if position collides with room walls (for NPCs)
  function checkRoomCollision(x: number, z: number, oldX: number, oldZ: number, rooms: RoomDef[]): { x: number, z: number } {
    const wallT = 0.5;
    const doorHalf = doorW / 2;
    let newX = x, newZ = z;
    
    for (const room of rooms) {
      const left = room.x - room.w / 2;
      const right = room.x + room.w / 2;
      const back = room.z - room.d / 2;
      const front = room.z + room.d / 2;
      
      // Back wall
      if (room.door !== 'back') {
        if (newX > left && newX < right && newZ > back - wallT && newZ < back + wallT) {
          newZ = oldZ >= back ? back + wallT : back - wallT;
        }
      } else if (newX > left && newX < right && newZ > back - wallT && newZ < back + wallT &&
          (newX < room.x - doorHalf || newX > room.x + doorHalf)) {
        newZ = oldZ >= back ? back + wallT : back - wallT;
      }
      
      // Front wall
      if (room.door !== 'front') {
        if (newX > left && newX < right && newZ > front - wallT && newZ < front + wallT) {
          newZ = oldZ <= front ? front - wallT : front + wallT;
        }
      } else if (newX > left && newX < right && newZ > front - wallT && newZ < front + wallT &&
          (newX < room.x - doorHalf || newX > room.x + doorHalf)) {
        newZ = oldZ <= front ? front - wallT : front + wallT;
      }
      
      // Left wall
      if (room.door !== 'left') {
        if (newZ > back && newZ < front && newX > left - wallT && newX < left + wallT) {
          newX = oldX >= left ? left + wallT : left - wallT;
        }
      } else if (newZ > back && newZ < front && newX > left - wallT && newX < left + wallT &&
          (newZ < room.z - doorHalf || newZ > room.z + doorHalf)) {
        newX = oldX >= left ? left + wallT : left - wallT;
      }
      
      // Right wall
      if (room.door !== 'right') {
        if (newZ > back && newZ < front && newX > right - wallT && newX < right + wallT) {
          newX = oldX <= right ? right - wallT : right + wallT;
        }
      } else if (newZ > back && newZ < front && newX > right - wallT && newX < right + wallT &&
          (newZ < room.z - doorHalf || newZ > room.z + doorHalf)) {
        newX = oldX <= right ? right - wallT : right + wallT;
      }
    }
    return { x: newX, z: newZ };
  }
  
  const indoorRooms = state.mode === 'indoor' ? getIndoorRooms() : [];
  
  for (const npc of npcsToUpdate) {
    const oldX = npc.x;
    const oldZ = npc.z;
    
    // Check if reached target
    const dx = npc.targetX - npc.x;
    const dz = npc.targetZ - npc.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < 0.5) {
      // Pick new target
      if (npc.indoor) {
        const hw = floor.w / 2 - 3;
        const hd = floor.d / 2 - 3;
        npc.targetX = -hw + Math.random() * hw * 2;
        npc.targetZ = -hd + Math.random() * hd * 2;
      } else {
        // Outdoor - wander in alleyways between buildings
        npc.targetX = npc.x + (Math.random() - 0.5) * 15;
        npc.targetZ = npc.z + (Math.random() - 0.5) * 15;
        // Clamp to city bounds
        npc.targetX = Math.max(-38, Math.min(38, npc.targetX));
        npc.targetZ = Math.max(-75, Math.min(3, npc.targetZ));
      }
    } else {
      // Move towards target
      const moveX = (dx / dist) * npc.speed;
      const moveZ = (dz / dist) * npc.speed;
      npc.x += moveX;
      npc.z += moveZ;
      
      // Apply indoor room collision for NPCs
      if (npc.indoor && indoorRooms.length > 0) {
        const collision = checkRoomCollision(npc.x, npc.z, oldX, oldZ, indoorRooms);
        npc.x = collision.x;
        npc.z = collision.z;
        
        // If NPC hit a wall, pick a new target
        if (npc.x !== oldX + moveX || npc.z !== oldZ + moveZ) {
          const hw = floor.w / 2 - 3;
          const hd = floor.d / 2 - 3;
          npc.targetX = -hw + Math.random() * hw * 2;
          npc.targetZ = -hd + Math.random() * hd * 2;
        }
      }
      
      npc.mesh.position.set(npc.x, 0, npc.z);
      
      // Face movement direction
      npc.mesh.rotation.y = Math.atan2(moveX, moveZ);
    }
    
    // Simple walk animation (bobbing) - different speeds for different animals
    if (dist > 0.5) {
      let bobSpeed = 150; // default for person
      let bobHeight = 0.08;
      switch (npc.type) {
        case 'fox': bobSpeed = 80; bobHeight = 0.08; break;
        case 'monkey': bobSpeed = 100; bobHeight = 0.1; break;
        case 'squirrel': bobSpeed = 50; bobHeight = 0.05; break;
        case 'mouse': bobSpeed = 40; bobHeight = 0.03; break;
      }
      npc.mesh.position.y = Math.abs(Math.sin(Date.now() / bobSpeed)) * bobHeight;
    }
  }
}

// Initialize outdoor NPCs
spawnOutdoorNPCs();

// ============================================
// INDOOR SCENE
// ============================================
const indoorAmbient = new THREE.AmbientLight(0xffffff, 0.5);
indoorScene.add(indoorAmbient);

let currentFloorGroup: THREE.Group | null = null;

function createFloorView(buildingIdx: number, floor: number) {
  if (currentFloorGroup) indoorScene.remove(currentFloorGroup);

  const bd = buildingsData[buildingIdx];
  if (!bd) return { w: 28, d: 20, top: false, ground: true, leftRoof: false, rightRoof: false };
  
  const group = new THREE.Group();
  const w = 50, d = 36, wallH = 4;
  const isTop = floor === bd.floors - 1;
  const isGround = floor === 0;
  const hasLeftBuilding = buildingIdx > 0;
  const hasRightBuilding = buildingIdx < buildingsData.length - 1;

  // ====== ROOF (Top Floor) ======
  if (isTop) {
    // Concrete roof floor
    const roofFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshLambertMaterial({ color: 0x555555 })
    );
    roofFloor.rotation.x = -Math.PI / 2;
    roofFloor.position.y = 0.01;
    group.add(roofFloor);

    // Roof texture - cracks
    for (let i = 0; i < 8; i++) {
      const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, 2 + Math.random() * 3),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
      );
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = Math.random() * Math.PI;
      crack.position.set((Math.random() - 0.5) * w * 0.8, 0.02, (Math.random() - 0.5) * d * 0.8);
      group.add(crack);
    }

    // Low wall around edge
    const edgeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const edgeH = 1.2;
    const backEdge = new THREE.Mesh(new THREE.BoxGeometry(w, edgeH, 0.4), edgeMat);
    backEdge.position.set(0, edgeH/2, -d/2 + 0.2);
    group.add(backEdge);
    
    // AC Units
    for (let i = 0; i < 3; i++) {
      const ac = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 1.5, 2),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      ac.position.set(-8 + i * 6, 0.75, -d/2 + 3);
      group.add(ac);
      
      const fan = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
      );
      fan.rotation.x = Math.PI / 2;
      fan.position.set(-8 + i * 6, 1.2, -d/2 + 2);
      group.add(fan);
    }

    // Water tank
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 4, 12),
      new THREE.MeshLambertMaterial({ color: 0x4a6080 })
    );
    tank.position.set(-w/2 + 4, 2, 2);
    group.add(tank);

    // Pipes
    for (let i = 0; i < 3; i++) {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, d * 0.6, 6),
        new THREE.MeshLambertMaterial({ color: 0x885533 })
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(-w/2 + 2 + i * 0.5, 0.5, 0);
      group.add(pipe);
    }

    // Satellite dish
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI),
      new THREE.MeshLambertMaterial({ color: 0xcccccc, side: THREE.DoubleSide })
    );
    dish.rotation.x = -Math.PI / 3;
    dish.position.set(w/2 - 4, 1.5, 3);
    group.add(dish);

    // Clothesline
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 10, 4),
      new THREE.MeshBasicMaterial({ color: 0x888888 })
    );
    line.rotation.z = Math.PI / 2;
    line.position.set(0, 2, 0);
    group.add(line);
    
    // Clothes on line - muted colors
    const clothColors = [0x8a7060, 0x606878, 0x807870, 0x607060];
    for (let i = 0; i < 4; i++) {
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 1),
        new THREE.MeshLambertMaterial({ color: clothColors[i], side: THREE.DoubleSide })
      );
      cloth.position.set(-3 + i * 2, 1.4, 0);
      cloth.rotation.y = 0.1 * (i - 1.5);
      group.add(cloth);
    }

    // Front edge - low wall with gap to look/jump down
    const frontEdgeL = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 4, edgeH, 0.4), edgeMat);
    frontEdgeL.position.set(-w/4 - 2, edgeH/2, d/2 - 0.2);
    group.add(frontEdgeL);
    const frontEdgeR = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 4, edgeH, 0.4), edgeMat);
    frontEdgeR.position.set(w/4 + 2, edgeH/2, d/2 - 0.2);
    group.add(frontEdgeR);
    // Gap in middle - can see street below (just dark area)
    const streetBelow = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    streetBelow.rotation.x = -Math.PI / 2;
    streetBelow.position.set(0, -0.5, d/2);
    group.add(streetBelow);

    // Left edge with adjacent building visible
    if (hasLeftBuilding) {
      const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.4, edgeH, d - 8), edgeMat);
      leftEdge.position.set(-w/2 + 0.2, edgeH/2, -2);
      group.add(leftEdge);
      // Adjacent building roof visible
      const adjRoofL = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.3, 8),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      adjRoofL.position.set(-w/2 - 3, -0.5, d/2 - 5);
      group.add(adjRoofL);
      // Gap area to jump
      const gapL = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 6),
        new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
      );
      gapL.rotation.x = -Math.PI / 2;
      gapL.position.set(-w/2 + 1, -0.3, d/2 - 4);
      group.add(gapL);
    } else {
      const leftEdgeFull = new THREE.Mesh(new THREE.BoxGeometry(0.4, edgeH, d), edgeMat);
      leftEdgeFull.position.set(-w/2 + 0.2, edgeH/2, 0);
      group.add(leftEdgeFull);
    }

    // Right edge with adjacent building visible
    if (hasRightBuilding) {
      const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.4, edgeH, d - 8), edgeMat);
      rightEdge.position.set(w/2 - 0.2, edgeH/2, -2);
      group.add(rightEdge);
      // Adjacent building roof visible
      const adjRoofR = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.3, 8),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      adjRoofR.position.set(w/2 + 3, -0.5, d/2 - 5);
      group.add(adjRoofR);
      // Gap area to jump
      const gapR = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 6),
        new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
      );
      gapR.rotation.x = -Math.PI / 2;
      gapR.position.set(w/2 - 1, -0.3, d/2 - 4);
      group.add(gapR);
    } else {
      const rightEdgeFull = new THREE.Mesh(new THREE.BoxGeometry(0.4, edgeH, d), edgeMat);
      rightEdgeFull.position.set(w/2 - 0.2, edgeH/2, 0);
      group.add(rightEdgeFull);
    }

    // Stairwell structure (back right) - small shed with door going down
    const stairShed = new THREE.Mesh(
      new THREE.BoxGeometry(8, 3, 5),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    stairShed.position.set(w/2 - 5, 1.5, -d/2 + 4);
    group.add(stairShed);
    // Door on stairwell
    const stairDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 2.5),
      new THREE.MeshLambertMaterial({ color: 0x4a4035 })
    );
    stairDoor.position.set(w/2 - 5, 1.25, -d/2 + 6.6);
    group.add(stairDoor);
    // Dim light by door
    const stairLight = new THREE.PointLight(0xffeecc, 0.5, 6);
    stairLight.position.set(w/2 - 5, 2.5, -d/2 + 7);
    group.add(stairLight);

    // Night sky ambient
    const skyLight = new THREE.AmbientLight(0x335577, 0.3);
    group.add(skyLight);
    const moonLight = new THREE.DirectionalLight(0xaabbcc, 0.4);
    moonLight.position.set(5, 10, 5);
    group.add(moonLight);

  // ====== LOBBY (Ground Floor) - With cramped bedrooms ======
  } else if (isGround) {
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x5a5545 });
    const roomWallMat = new THREE.MeshLambertMaterial({ color: 0x6a6555 });
    
    // Main floor
    const lobbyFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshLambertMaterial({ color: 0x4a4540 })
    );
    lobbyFloor.rotation.x = -Math.PI / 2;
    lobbyFloor.position.y = 0.01;
    group.add(lobbyFloor);

    // Outer walls
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.2), wallMat);
    wallBack.position.set(0, wallH/2, -d/2);
    group.add(wallBack);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH, d), wallMat);
    wallLeft.position.set(-w/2, wallH/2, 0);
    group.add(wallLeft);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH, d), wallMat);
    wallRight.position.set(w/2, wallH/2, 0);
    group.add(wallRight);
    // Front wall with exit
    const wallFrontL = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 3, wallH, 0.2), wallMat);
    wallFrontL.position.set(-w/4 - 1.5, wallH/2, d/2);
    group.add(wallFrontL);
    const wallFrontR = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 3, wallH, 0.2), wallMat);
    wallFrontR.position.set(w/4 + 1.5, wallH/2, d/2);
    group.add(wallFrontR);

    // Small lobby/entrance area (center)
    const lobbyTile = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 10),
      new THREE.MeshLambertMaterial({ color: 0x5a5550 })
    );
    lobbyTile.rotation.x = -Math.PI / 2;
    lobbyTile.position.set(0, 0.02, 5);
    group.add(lobbyTile);

    // Small reception counter
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1, 1.5),
      new THREE.MeshLambertMaterial({ color: 0x553322 })
    );
    counter.position.set(-8, 0.5, 8);
    group.add(counter);

    // Mailboxes (small)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.6, 0.5, 0.3),
          new THREE.MeshLambertMaterial({ color: 0x775533 })
        );
        box.position.set(-w/2 + 0.4, 1.5 + r * 0.6, 8 + c * 0.8);
        group.add(box);
      }
    }

    // ========== CRAMPED BEDROOMS around lobby edges ==========
    // Helper to create a lobby room with solid walls
    function createLobbyRoom(x: number, z: number, rw: number, rd: number, doorSide: 'left' | 'right' | 'front' | 'back', colorIdx: number) {
      const roomLit = Math.random() > 0.35;
      const glowing = roomLit && Math.random() > 0.6;
      
      // Room floor
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(rw - 0.3, rd - 0.3),
        new THREE.MeshLambertMaterial({ color: roomLit ? 0x5a5545 : 0x4a4540 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(x, 0.02, z);
      group.add(floor);
      
      // Solid walls (full height) with door opening
      const doorW = 1.6;
      
      // Back wall
      if (doorSide !== 'back') {
        const back = new THREE.Mesh(new THREE.BoxGeometry(rw, wallH, 0.15), roomWallMat);
        back.position.set(x, wallH/2, z - rd/2);
        group.add(back);
      } else {
        const backL = new THREE.Mesh(new THREE.BoxGeometry((rw - doorW)/2, wallH, 0.15), roomWallMat);
        backL.position.set(x - rw/4 - doorW/4, wallH/2, z - rd/2);
        group.add(backL);
        const backR = new THREE.Mesh(new THREE.BoxGeometry((rw - doorW)/2, wallH, 0.15), roomWallMat);
        backR.position.set(x + rw/4 + doorW/4, wallH/2, z - rd/2);
        group.add(backR);
      }
      
      // Front wall
      if (doorSide !== 'front') {
        const front = new THREE.Mesh(new THREE.BoxGeometry(rw, wallH, 0.15), roomWallMat);
        front.position.set(x, wallH/2, z + rd/2);
        group.add(front);
      } else {
        const frontL = new THREE.Mesh(new THREE.BoxGeometry((rw - doorW)/2, wallH, 0.15), roomWallMat);
        frontL.position.set(x - rw/4 - doorW/4, wallH/2, z + rd/2);
        group.add(frontL);
        const frontR = new THREE.Mesh(new THREE.BoxGeometry((rw - doorW)/2, wallH, 0.15), roomWallMat);
        frontR.position.set(x + rw/4 + doorW/4, wallH/2, z + rd/2);
        group.add(frontR);
      }
      
      // Left wall
      if (doorSide !== 'left') {
        const left = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, rd), roomWallMat);
        left.position.set(x - rw/2, wallH/2, z);
        group.add(left);
      } else {
        const leftF = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, (rd - doorW)/2), roomWallMat);
        leftF.position.set(x - rw/2, wallH/2, z - rd/4 - doorW/4);
        group.add(leftF);
        const leftB = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, (rd - doorW)/2), roomWallMat);
        leftB.position.set(x - rw/2, wallH/2, z + rd/4 + doorW/4);
        group.add(leftB);
      }
      
      // Right wall
      if (doorSide !== 'right') {
        const right = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, rd), roomWallMat);
        right.position.set(x + rw/2, wallH/2, z);
        group.add(right);
      } else {
        const rightF = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, (rd - doorW)/2), roomWallMat);
        rightF.position.set(x + rw/2, wallH/2, z - rd/4 - doorW/4);
        group.add(rightF);
        const rightB = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, (rd - doorW)/2), roomWallMat);
        rightB.position.set(x + rw/2, wallH/2, z + rd/4 + doorW/4);
        group.add(rightB);
      }
      
      // BED
      const bed = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1.3), new THREE.MeshLambertMaterial({ color: 0x5a4a3a }));
      bed.position.set(x, 0.2, z - rd/4);
      group.add(bed);
      const blanketColors = [0x7a6555, 0x665544, 0x887766, 0x556655, 0x775566];
      const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.1), new THREE.MeshLambertMaterial({ color: blanketColors[colorIdx % 5] }));
      blanket.position.set(x, 0.45, z - rd/4);
      group.add(blanket);
      const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.7), new THREE.MeshLambertMaterial({ color: 0xccbbaa }));
      pillow.position.set(x - 0.6, 0.5, z - rd/4);
      group.add(pillow);
      
      // Light
      if (roomLit) {
        const neonColors = [0xff4466, 0x44ff88, 0x4488ff, 0xffaa44, 0xff44ff, 0x44ffff];
        const lightColor = glowing ? neonColors[Math.floor(Math.random() * neonColors.length)] : 0xffddaa;
        const light = new THREE.PointLight(lightColor, glowing ? 1.2 : 0.5, glowing ? 10 : 6);
        light.position.set(x, 2.5, z);
        group.add(light);
        
        if (glowing) {
          const glowBulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            new THREE.MeshBasicMaterial({ color: lightColor })
          );
          glowBulb.position.set(x, 2.8, z);
          group.add(glowBulb);
        }
      }
    }
    
    // Left side rooms (3 rooms, avoiding exit area)
    createLobbyRoom(-w/2 + 5, -d/2 + 6, 7, 5, 'right', 0);
    createLobbyRoom(-w/2 + 5, -d/2 + 13, 7, 5, 'right', 1);
    createLobbyRoom(-w/2 + 5, -d/2 + 20, 7, 5, 'right', 2);

    // Right side rooms (2 rooms, leaving space for stairs at back)
    createLobbyRoom(w/2 - 5, d/2 - 6, 7, 5, 'left', 3);
    createLobbyRoom(w/2 - 5, d/2 - 13, 7, 5, 'left', 4);

    // Back wall rooms (only 1 room on left side, stairs on right)
    createLobbyRoom(-12, -d/2 + 5, 6, 5, 'front', 5);

    // EXIT sign and door mat
    const exitSign = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.05), new THREE.MeshBasicMaterial({ color: 0xcc3333 }));
    exitSign.position.set(0, wallH - 0.3, d/2 - 0.15);
    group.add(exitSign);
    const doorMat = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshLambertMaterial({ color: 0x3a3025 }));
    doorMat.rotation.x = -Math.PI / 2;
    doorMat.position.set(0, 0.03, d/2 - 1.5);
    group.add(doorMat);

    // UP STAIRS (back right corner)
    const upColors = [0xaaaaaa, 0x999999, 0x888888, 0x777777, 0x666666, 0x555555, 0x444444];
    for (let s = 0; s < 7; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.3, 1.2), new THREE.MeshLambertMaterial({ color: upColors[s] }));
      step.position.set(w/2 - 4, 0.15, -d/2 + 1 + s * 1.0);
      group.add(step);
    }
    const upLabel = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.8), new THREE.MeshBasicMaterial({ color: 0x558855 }));
    upLabel.position.set(w/2 - 4, 2.5, -d/2 + 0.15);
    group.add(upLabel);

    // Lights
    const mainLight = new THREE.PointLight(0xffffee, 0.8, 30);
    mainLight.position.set(0, 3.5, 5);
    group.add(mainLight);
    const stairLight = new THREE.PointLight(0xffeedd, 0.5, 10);
    stairLight.position.set(w/2 - 4, 3, -d/2 + 3);
    group.add(stairLight);

  // ====== APARTMENT FLOORS - Multiple corridors with rooms ======
  } else {
    const hallW = 2.5;      // Corridor width
    const wallThick = 0.15; // Wall thickness
    const roomSize = 5;     // Room size
    
    // Main floor
    const mainFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshLambertMaterial({ color: 0x4a4540 })
    );
    mainFloor.rotation.x = -Math.PI / 2;
    mainFloor.position.y = 0.01;
    group.add(mainFloor);

    // ========== OUTER WALLS ==========
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x6a6055 });
    const roomWallMat = new THREE.MeshLambertMaterial({ color: 0x7a7565 });
    
    const wallBack = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, wallThick), wallMat);
    wallBack.position.set(0, wallH/2, -d/2);
    group.add(wallBack);
    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, wallThick), wallMat);
    wallFront.position.set(0, wallH/2, d/2);
    group.add(wallFront);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, d), wallMat);
    wallLeft.position.set(-w/2, wallH/2, 0);
    group.add(wallLeft);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, d), wallMat);
    wallRight.position.set(w/2, wallH/2, 0);
    group.add(wallRight);

    // ========== CORRIDOR GRID SYSTEM ==========
    // Main horizontal corridor (runs left-right)
    const mainCorridor = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 4, hallW),
      new THREE.MeshLambertMaterial({ color: 0x5a5550 })
    );
    mainCorridor.rotation.x = -Math.PI / 2;
    mainCorridor.position.set(0, 0.02, 0);
    group.add(mainCorridor);

    // Vertical corridor 1 (left side)
    const vCorridor1 = new THREE.Mesh(
      new THREE.PlaneGeometry(hallW, d - 4),
      new THREE.MeshLambertMaterial({ color: 0x5a5550 })
    );
    vCorridor1.rotation.x = -Math.PI / 2;
    vCorridor1.position.set(-12, 0.02, 0);
    group.add(vCorridor1);

    // Vertical corridor 2 (right side)
    const vCorridor2 = new THREE.Mesh(
      new THREE.PlaneGeometry(hallW, d - 4),
      new THREE.MeshLambertMaterial({ color: 0x5a5550 })
    );
    vCorridor2.rotation.x = -Math.PI / 2;
    vCorridor2.position.set(12, 0.02, 0);
    group.add(vCorridor2);

    // ========== ROOMS IN GRID BLOCKS ==========
    // Helper function to create a room
    function createRoom(x: number, z: number, rotated: boolean, colorIdx: number) {
      const roomLit = Math.random() > 0.35;
      const rw = rotated ? roomSize : roomSize;
      const rd = rotated ? roomSize : roomSize;
      
      // Room floor
      const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(rw - 0.5, rd - 0.5),
        new THREE.MeshLambertMaterial({ color: roomLit ? 0x5a5545 : 0x4a4540 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(x, 0.02, z);
      group.add(floor);
      
      // Room walls (FULL HEIGHT - can only enter through door)
      const doorW = 1.8;
      
      // Back wall (solid)
      const backW = new THREE.Mesh(new THREE.BoxGeometry(rw, wallH, wallThick), roomWallMat);
      backW.position.set(x, wallH/2, z - rd/2 + wallThick/2);
      group.add(backW);
      
      // Front wall (with door opening)
      const frontW1 = new THREE.Mesh(new THREE.BoxGeometry((rw - doorW) / 2, wallH, wallThick), roomWallMat);
      frontW1.position.set(x - rw/4 - doorW/4, wallH/2, z + rd/2 - wallThick/2);
      group.add(frontW1);
      const frontW2 = new THREE.Mesh(new THREE.BoxGeometry((rw - doorW) / 2, wallH, wallThick), roomWallMat);
      frontW2.position.set(x + rw/4 + doorW/4, wallH/2, z + rd/2 - wallThick/2);
      group.add(frontW2);
      // Wall above door
      const frontTop = new THREE.Mesh(new THREE.BoxGeometry(doorW + 0.2, wallH - 2.5, wallThick), roomWallMat);
      frontTop.position.set(x, wallH - (wallH - 2.5)/2, z + rd/2 - wallThick/2);
      group.add(frontTop);
      
      // Side walls (solid)
      const sideW1 = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, rd), roomWallMat);
      sideW1.position.set(x - rw/2 + wallThick/2, wallH/2, z);
      group.add(sideW1);
      const sideW2 = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, rd), roomWallMat);
      sideW2.position.set(x + rw/2 - wallThick/2, wallH/2, z);
      group.add(sideW2);
      
      // Door frame (decorative)
      const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.15, 2.5, wallThick + 0.05),
        new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
      );
      doorFrame.position.set(x, 1.25, z + rd/2 - wallThick/2);
      group.add(doorFrame);
      
      // BED
      const bedW = rotated ? 1.4 : 2.2;
      const bedD = rotated ? 2.2 : 1.4;
      const bed = new THREE.Mesh(
        new THREE.BoxGeometry(bedW, 0.4, bedD),
        new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
      );
      bed.position.set(x - rw/2 + bedW/2 + 0.5, 0.2, z - rd/2 + bedD/2 + 0.5);
      group.add(bed);
      
      // Blanket
      const blanketColors = [0x7a6555, 0x665544, 0x887766, 0x556655, 0x775566, 0x667755];
      const blanket = new THREE.Mesh(
        new THREE.BoxGeometry(bedW - 0.2, 0.15, bedD - 0.2),
        new THREE.MeshLambertMaterial({ color: blanketColors[colorIdx % 6] })
      );
      blanket.position.set(bed.position.x, 0.45, bed.position.z);
      group.add(blanket);
      
      // Pillow
      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(rotated ? 0.8 : 0.5, 0.2, rotated ? 0.5 : 0.8),
        new THREE.MeshLambertMaterial({ color: 0xccbbaa })
      );
      pillow.position.set(
        bed.position.x - (rotated ? 0 : bedW/2 - 0.4),
        0.5,
        bed.position.z - (rotated ? bedD/2 - 0.4 : 0)
      );
      group.add(pillow);
      
      // Light - some rooms have glowing colored lights
      if (roomLit) {
        const glowChance = Math.random();
        let lightColor = 0xffddaa;
        let intensity = 0.6;
        
        if (glowChance > 0.5) {
          // Neon glow colors - brighter and more visible
          const neonColors = [0xff4466, 0x44ff88, 0x4488ff, 0xffaa44, 0xff44ff, 0x44ffff, 0xff6644, 0x66ff44];
          lightColor = neonColors[Math.floor(Math.random() * neonColors.length)] ?? 0xff4466;
          intensity = 1.5;
          
          // Add large glowing light source mesh
          const glowBulb = new THREE.Mesh(
            new THREE.SphereGeometry(0.25, 8, 8),
            new THREE.MeshBasicMaterial({ color: lightColor })
          );
          glowBulb.position.set(x, 2.6, z);
          group.add(glowBulb);
          
          // Add glow halo
          const halo = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshBasicMaterial({ color: lightColor, transparent: true, opacity: 0.3 })
          );
          halo.position.set(x, 2.6, z);
          group.add(halo);
        }
        
        const light = new THREE.PointLight(lightColor, intensity, 10);
        light.position.set(x, 2.5, z);
        group.add(light);
      }
    }

    // ========== CREATE ROOM GRID - Clean layout with no overlap ==========
    let roomIdx = 0;
    
    // Room grid with proper spacing (7 units apart)
    const roomSpacing = 7;
    
    // Left column of rooms (x = -20)
    createRoom(-20, -12, false, roomIdx++);
    createRoom(-20, -4, false, roomIdx++);
    createRoom(-20, 4, true, roomIdx++);
    createRoom(-20, 12, true, roomIdx++);
    
    // Left-center column (x = -10)
    createRoom(-10, -12, false, roomIdx++);
    createRoom(-10, -4, false, roomIdx++);
    createRoom(-10, 4, true, roomIdx++);
    createRoom(-10, 12, true, roomIdx++);
    
    // Right-center column (x = 2)
    createRoom(2, -12, false, roomIdx++);
    createRoom(2, -4, false, roomIdx++);
    createRoom(2, 4, true, roomIdx++);
    createRoom(2, 12, true, roomIdx++);
    
    // Right column (x = 12, avoiding stairs at top right)
    createRoom(12, 4, true, roomIdx++);
    createRoom(12, 12, true, roomIdx++);

    // ========== CORRIDOR LIGHTING ==========
    const corridorLights = [
      { x: 0, z: 0 },
      { x: -12, z: -12 }, { x: -12, z: 12 },
      { x: 12, z: -12 }, { x: 12, z: 12 },
      { x: -20, z: 0 }, { x: 20, z: 0 },
      { x: 0, z: -15 }, { x: 0, z: 15 },
    ];
    for (const pos of corridorLights) {
      const light = new THREE.PointLight(0xffffcc, 0.35, 10);
      light.position.set(pos.x, 3.5, pos.z);
      group.add(light);
      // Bare bulb with wire
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffdd })
      );
      bulb.position.set(pos.x, 3.65, pos.z);
      group.add(bulb);
      const bulbWire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      bulbWire.position.set(pos.x, 3.85, pos.z);
      group.add(bulbWire);
    }

    // ========== SPORADIC WIRES (natural look, no grid) ==========
    
    // Random wire bundles across ceiling - different lengths and angles
    for (let i = 0; i < 35; i++) {
      const wireLen = 2 + Math.random() * 6;
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015 + Math.random() * 0.02, 0.015 + Math.random() * 0.02, wireLen, 4),
        new THREE.MeshBasicMaterial({ color: [0x111111, 0x1a1a1a, 0x0a0a0a, 0x181818][Math.floor(Math.random() * 4)] })
      );
      // Random orientations - not aligned to grid
      wire.rotation.x = Math.random() * Math.PI;
      wire.rotation.y = Math.random() * Math.PI;
      wire.rotation.z = Math.random() * Math.PI;
      wire.position.set(
        -w/2 + 6 + Math.random() * (w - 12),
        3.0 + Math.random() * 0.7,
        -d/2 + 6 + Math.random() * (d - 12)
      );
      group.add(wire);
    }
    
    // Drooping/hanging wires from ceiling
    for (let i = 0; i < 30; i++) {
      const droopLen = 0.4 + Math.random() * 2;
      const droop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, droopLen, 4),
        new THREE.MeshBasicMaterial({ color: 0x111111 })
      );
      // Mostly vertical with slight angle
      droop.rotation.x = (Math.random() - 0.5) * 0.3;
      droop.rotation.z = (Math.random() - 0.5) * 0.3;
      droop.position.set(
        -w/2 + 8 + Math.random() * (w - 16),
        3.5 - droopLen/2,
        -d/2 + 8 + Math.random() * (d - 16)
      );
      group.add(droop);
    }
    
    // Some longer wires running along walls (not a grid)
    for (let i = 0; i < 8; i++) {
      const wallWire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 5 + Math.random() * 8, 4),
        new THREE.MeshBasicMaterial({ color: 0x1a1a1a })
      );
      const wallSide = Math.random() > 0.5;
      wallWire.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      wallWire.position.set(
        wallSide ? (-w/2 + 2) : (w/2 - 2),
        2.8 + Math.random() * 0.5,
        -d/3 + Math.random() * (d * 0.66)
      );
      group.add(wallWire);
    }
    
    // TRASH everywhere
    // Garbage bags
    for (let i = 0; i < 20; i++) {
      const bag = new THREE.Mesh(
        new THREE.SphereGeometry(0.25 + Math.random() * 0.2, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0x222222 })
      );
      bag.scale.set(1, 0.7, 1);
      bag.position.set(
        -w/2 + 8 + Math.random() * (w - 16),
        0.15,
        -d/2 + 8 + Math.random() * (d - 16)
      );
      group.add(bag);
    }
    // Small trash pieces
    for (let i = 0; i < 40; i++) {
      const trash = new THREE.Mesh(
        new THREE.BoxGeometry(0.08 + Math.random() * 0.15, 0.03, 0.08 + Math.random() * 0.15),
        new THREE.MeshLambertMaterial({ color: [0x8b7355, 0x666666, 0x444444, 0x554433, 0x445544][Math.floor(Math.random() * 5)] })
      );
      trash.rotation.y = Math.random() * Math.PI;
      trash.position.set(
        -w/2 + 6 + Math.random() * (w - 12),
        0.02,
        -d/2 + 6 + Math.random() * (d - 12)
      );
      group.add(trash);
    }
    // Crumpled paper
    for (let i = 0; i < 15; i++) {
      const paper = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.05, 4, 4),
        new THREE.MeshLambertMaterial({ color: 0xccccbb })
      );
      paper.scale.set(1, 0.5, 1);
      paper.position.set(
        -w/2 + 8 + Math.random() * (w - 16),
        0.04,
        -d/2 + 8 + Math.random() * (d - 16)
      );
      group.add(paper);
    }
    
    // Cardboard boxes stacked
    for (let i = 0; i < 12; i++) {
      const stackHeight = 1 + Math.floor(Math.random() * 3);
      const bx = -w/2 + 10 + Math.random() * (w - 20);
      const bz = -d/2 + 10 + Math.random() * (d - 20);
      for (let b = 0; b < stackHeight; b++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.5 + Math.random() * 0.4, 0.35 + Math.random() * 0.2, 0.4 + Math.random() * 0.3),
          new THREE.MeshLambertMaterial({ color: 0x8b7355 + Math.floor(Math.random() * 0x222222) })
        );
        box.position.set(bx + (Math.random() - 0.5) * 0.2, 0.2 + b * 0.35, bz + (Math.random() - 0.5) * 0.2);
        box.rotation.y = Math.random() * 0.5;
        group.add(box);
      }
    }
    
    // Buckets
    for (let i = 0; i < 6; i++) {
      const bucket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.15, 0.35, 8),
        new THREE.MeshLambertMaterial({ color: [0x3355aa, 0x55aa33, 0xaa5533, 0x555555][Math.floor(Math.random() * 4)] })
      );
      bucket.position.set(
        -w/2 + 10 + Math.random() * (w - 20),
        0.175,
        -d/2 + 10 + Math.random() * (d - 20)
      );
      group.add(bucket);
    }
    
    // Shoes/slippers scattered outside doors
    const shoeColors = [0x222222, 0x443322, 0x223344, 0x884433, 0x555555];
    for (let i = 0; i < 25; i++) {
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.06, 0.1),
        new THREE.MeshLambertMaterial({ color: shoeColors[Math.floor(Math.random() * 5)] })
      );
      shoe.position.set(
        -w/2 + 8 + Math.random() * (w - 16),
        0.03,
        -d/2 + 8 + Math.random() * (d - 16)
      );
      shoe.rotation.y = Math.random() * Math.PI;
      group.add(shoe);
    }
    
    // Laundry hanging across some corridors
    for (let l = 0; l < 6; l++) {
      const lineX = -w/3 + l * (w/9);
      const lineZ = -5 + Math.random() * 10;
      const line = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 4 + Math.random() * 3, 4),
        new THREE.MeshBasicMaterial({ color: 0x666666 })
      );
      line.rotation.z = Math.PI / 2;
      line.position.set(lineX, 2.6, lineZ);
      group.add(line);
      // Hanging clothes
      for (let c = 0; c < 2 + Math.floor(Math.random() * 3); c++) {
        const cloth = new THREE.Mesh(
          new THREE.PlaneGeometry(0.35, 0.5 + Math.random() * 0.3),
          new THREE.MeshLambertMaterial({ 
            color: [0xccbbaa, 0x8899aa, 0xaa8877, 0xaaaaaa, 0x778899, 0x998877][Math.floor(Math.random() * 6)],
            side: THREE.DoubleSide 
          })
        );
        cloth.position.set(lineX - 1.5 + c * 1.2, 2.2, lineZ);
        group.add(cloth);
      }
    }
    
    // Bicycles
    for (let i = 0; i < 3; i++) {
      const bikeX = -w/3 + i * (w/5);
      const bikeZ = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 8);
      // Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(1, 0.06, 0.06),
        new THREE.MeshLambertMaterial({ color: 0x333355 + Math.floor(Math.random() * 0x333333) })
      );
      frame.position.set(bikeX, 0.5, bikeZ);
      group.add(frame);
      // Wheels
      for (const wx of [-0.4, 0.4]) {
        const wheel = new THREE.Mesh(
          new THREE.TorusGeometry(0.3, 0.025, 6, 12),
          new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        wheel.rotation.y = Math.PI / 2;
        wheel.position.set(bikeX + wx, 0.3, bikeZ);
        group.add(wheel);
      }
    }
    
    // Old broken furniture
    for (let i = 0; i < 4; i++) {
      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.7, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
      );
      chair.position.set(
        -w/3 + Math.random() * (w * 0.66),
        0.35,
        -d/3 + Math.random() * (d * 0.66)
      );
      chair.rotation.y = Math.random() * Math.PI;
      chair.rotation.z = (Math.random() - 0.5) * 0.3; // Tilted/broken
      group.add(chair);
    }
    
    // Electric meters/junction boxes on walls (added to corridor walls)
    for (let i = 0; i < 8; i++) {
      const jbox = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.6, 0.12),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      const wallSide = Math.random() > 0.5;
      jbox.position.set(
        wallSide ? (-w/2 + 0.08) : (w/2 - 0.08),
        1.8 + Math.random() * 0.5,
        -d/3 + i * (d/6)
      );
      group.add(jbox);
      // Wires coming out
      for (let wi = 0; wi < 2 + Math.floor(Math.random() * 3); wi++) {
        const jWire = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, 0.8 + Math.random() * 1.5, 4),
          new THREE.MeshBasicMaterial({ color: 0x111111 })
        );
        jWire.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        jWire.position.set(
          wallSide ? (-w/2 + 0.5) : (w/2 - 0.5),
          1.8 + wi * 0.15,
          -d/3 + i * (d/6)
        );
        group.add(jWire);
      }
    }

    // ========== STAIRWELL (back right corner - clear area) ==========
    // UP STAIRS (right side) - light to dark gradient (going up into darkness)
    const upColors = [0xaaaaaa, 0x999999, 0x888888, 0x777777, 0x666666, 0x555555, 0x444444];
    for (let s = 0; s < 7; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.3, 1.2),
        new THREE.MeshLambertMaterial({ color: upColors[s] })
      );
      step.position.set(w/2 - 3, 0.15, -d/2 + 1 + s * 1.0);
      group.add(step);
    }
    // UP label
    const upLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x558855 })
    );
    upLabel.position.set(w/2 - 3, 2.5, -d/2 + 0.2);
    group.add(upLabel);

    // DOWN STAIRS (left side) - dark to light gradient (coming from darkness)
    const downColors = [0x333333, 0x444444, 0x555555, 0x666666, 0x777777, 0x888888, 0x999999];
    for (let s = 0; s < 7; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.3, 1.2),
        new THREE.MeshLambertMaterial({ color: downColors[s] })
      );
      step.position.set(w/2 - 8, 0.15, -d/2 + 1 + s * 1.0);
      group.add(step);
    }
    // DOWN label
    const downLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x885555 })
    );
    downLabel.position.set(w/2 - 8, 2.5, -d/2 + 0.2);
    group.add(downLabel);

    // Stairwell light
    const stairLight = new THREE.PointLight(0xffffee, 0.6, 12);
    stairLight.position.set(w/2 - 5.5, 3.5, -d/2 + 4);
    group.add(stairLight);
  }

  indoorScene.add(group);
  currentFloorGroup = group;
  return { w, d, top: isTop, ground: isGround, leftRoof: isTop && hasLeftBuilding, rightRoof: isTop && hasRightBuilding };
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

// Player starts in alleyway area (south of city)
playerGroup.position.set(0, 0.1, 0);
outdoorScene.add(playerGroup);

const player = { x: 0, z: 0, facing: 0, speed: 0.25 };

// ============================================
// INPUT
// ============================================
const keys = { left: false, right: false, up: false, down: false, action: false, actionPressed: false };

window.addEventListener('keydown', e => {
  // Start game on any key
  if (!started && instructions) {
    instructions.classList.add('hidden');
    started = true;
  }
  
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
    keys.action = true;
    keys.actionPressed = true; // One-shot trigger
  }
});

window.addEventListener('keyup', e => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
  if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
  if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') keys.action = false;
});

// ============================================
// UI
// ============================================
const instructions = document.getElementById('instructions') as HTMLDivElement;
const scrollCounter = document.getElementById('scroll-counter') as HTMLDivElement;
const popup = document.getElementById('popup') as HTMLDivElement;
const popupText = document.getElementById('popup-text') as HTMLDivElement;
const popupClose = document.getElementById('popup-close') as HTMLButtonElement;
const actionPrompt = document.getElementById('action-prompt') as HTMLDivElement;

let started = false;
let cooldown = 0;
let currentPrompt = '';

canvas.addEventListener('click', () => { if (!started && instructions) { instructions.classList.add('hidden'); started = true; }});
instructions?.addEventListener('click', () => { if (!started && instructions) { instructions.classList.add('hidden'); started = true; }});
popupClose?.addEventListener('click', () => { if (popup) popup.style.display = 'none'; });

function showPopup(t: string) { if (popup && popupText) { popupText.textContent = t; popup.style.display = 'flex'; }}

function showPrompt(text: string) {
  if (!actionPrompt) return;
  if (text !== currentPrompt) {
    currentPrompt = text;
    if (text) {
      actionPrompt.innerHTML = `<span class="key">E</span> ${text}`;
      actionPrompt.classList.add('visible');
    } else {
      actionPrompt.classList.remove('visible');
    }
  }
}

function updateUI() {
  if (!scrollCounter) return;
  if (state.mode === 'indoor') {
    const bd = buildingsData[state.currentBuilding];
    const floorName = state.currentFloor === 0 ? 'LOBBY' : 
                      state.currentFloor === (bd?.floors ?? 1) - 1 ? 'ROOFTOP' : 
                      `FLOOR ${state.currentFloor + 1}`;
    scrollCounter.textContent = `${floorName} • ${state.currentFloor + 1}/${bd?.floors ?? '?'}`;
  } else {
    scrollCounter.textContent = 'KOWLOON CITY';
  }
}

// ============================================
// MINIMAP - Kowloon Walled City layout
// ============================================
const minimapCanvas = document.getElementById('minimap-canvas') as HTMLCanvasElement;
const minimapCtx = minimapCanvas?.getContext('2d');

function drawMinimap() {
  if (!minimapCtx || !minimapCanvas) return;
  const ctx = minimapCtx;
  const W = minimapCanvas.width;
  const H = minimapCanvas.height;
  
  // Clear
  ctx.fillStyle = '#1a1510';
  ctx.fillRect(0, 0, W, H);
  
  // Draw city boundary
  ctx.strokeStyle = '#5a4535';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, W - 8, H - 20);
  ctx.fillStyle = '#201810';
  ctx.fillRect(4, 4, W - 8, H - 20);
  
  // Scale to fit all buildings: X from -35 to 35 (70 units), Z from -75 to -5 (70 units)
  const scaleX = (W - 16) / 70;
  const scaleZ = (H - 28) / 70;
  const mapScale = Math.min(scaleX, scaleZ);
  const offsetX = W / 2;
  const offsetY = H - 14;  // Bottom of map area
  
  function worldToMap(wx: number, wz: number) {
    return {
      x: offsetX + wx * mapScale,
      y: offsetY + (wz + 5) * mapScale  // +5 to shift so z=-5 is at bottom
    };
  }
  
  // Draw alleyways first (under buildings)
  ctx.strokeStyle = '#2a2520';
  ctx.lineWidth = 2;
  
  // Horizontal alleyways between rows
  for (const rowZ of [-64, -52, -40, -28, -16]) {
    const start = worldToMap(-35, rowZ);
    const end = worldToMap(35, rowZ);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  
  // Vertical alleyways between building columns
  for (const colX of [-25, -15, -5, 5, 15, 25]) {
    const start = worldToMap(colX, -73);
    const end = worldToMap(colX, -7);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  
  // Draw all buildings from buildingsData
  for (let i = 0; i < buildingsData.length; i++) {
    const b = buildingsData[i];
    if (!b) continue;
    const pos = worldToMap(b.x, b.z);
    const bw = b.width * mapScale;
    const bd = b.depth * mapScale;
    
    // Check if this is the current building
    const isCurrentBuilding = state.mode === 'indoor' && state.currentBuilding === i;
    
    // Building fill - shade based on height
    const heightShade = Math.floor(b.floors * 2);
    if (isCurrentBuilding) {
      ctx.fillStyle = '#ff5533';
    } else {
      ctx.fillStyle = `rgb(${60 + heightShade}, ${55 + heightShade}, ${50 + heightShade})`;
    }
    ctx.fillRect(pos.x - bw/2, pos.y - bd/2, bw, bd);
    
    // Border
    ctx.strokeStyle = isCurrentBuilding ? '#ffaa66' : '#7a7060';
    ctx.lineWidth = isCurrentBuilding ? 2 : 0.5;
    ctx.strokeRect(pos.x - bw/2, pos.y - bd/2, bw, bd);
    
    // Add small details inside buildings
    if (!isCurrentBuilding && bw > 4) {
      ctx.fillStyle = '#3a3530';
      ctx.fillRect(pos.x - bw/4, pos.y - bd/4, bw/3, bd/3);
    }
  }
  
  // Draw player position
  if (state.mode === 'outdoor') {
    const pp = worldToMap(player.x, player.z);
    
    // Outer glow
    const pulse = Math.sin(Date.now() / 150) * 1.5;
    ctx.fillStyle = 'rgba(255, 50, 50, 0.4)';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 6 + pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // Player dot (red)
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // White center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Direction indicator (player.facing is already an angle in radians)
    const angle = player.facing + Math.PI / 2; // Rotate to match minimap orientation
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(pp.x + Math.sin(angle) * 5, pp.y - Math.cos(angle) * 5);
    ctx.stroke();
  } else {
    // Indoor - show building location
    const bd = buildingsData[state.currentBuilding];
    if (bd) {
      const bp = worldToMap(bd.x, bd.z);
      const pulse = Math.sin(Date.now() / 200) * 2;
      ctx.strokeStyle = '#ffaa33';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, 8 + pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // Title and subtitle
  ctx.fillStyle = '#8a7060';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('九龍城寨', W/2, H - 5);
  
  // Compass
  ctx.fillStyle = '#6a5a4a';
  ctx.font = '6px monospace';
  ctx.fillText('N', W - 10, 12);
  ctx.textAlign = 'left';
}

// ============================================
// GAME LOGIC
// ============================================
let floor = { w: 28, d: 20, top: false, ground: true, leftRoof: false, rightRoof: false };

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
  spawnIndoorNPCs(i, 0, floor.w, floor.d);
  updateUI();
}

function exit() {
  state.mode = 'outdoor';
  const bd = buildingsData[state.currentBuilding];
  outdoorScene.visible = true;
  indoorScene.visible = false;
  indoorScene.remove(playerGroup);
  outdoorScene.add(playerGroup);
  // Spawn in front of the building door
  player.x = bd?.x ?? 0;
  player.z = (bd?.z ?? 0) + (bd?.depth ?? 6) / 2 + 2;
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
  // Spawn at stairwell (back-right, near the down stairs side)
  player.x = floor.w / 2 - 6;
  player.z = -floor.d / 2 + 5;
  playerGroup.position.set(player.x, 0.1, player.z);
  spawnIndoorNPCs(state.currentBuilding, state.currentFloor, floor.w, floor.d);
  updateUI();
}

function goDown() {
  if (state.currentFloor <= 0) return;
  state.currentFloor--;
  floor = createFloorView(state.currentBuilding, state.currentFloor);
  // Spawn at stairwell (back-right, near the up stairs side)
  player.x = floor.w / 2 - 3;
  player.z = -floor.d / 2 + 5;
  playerGroup.position.set(player.x, 0.1, player.z);
  spawnIndoorNPCs(state.currentBuilding, state.currentFloor, floor.w, floor.d);
  updateUI();
}

function jumpRoof() {
  // Jump down to street - instant transition
  exit();
}

function jumpToLeftBuilding() {
  const leftIdx = state.currentBuilding - 1;
  if (leftIdx < 0) return;
  const leftBd = buildingsData[leftIdx];
  if (!leftBd) return;
  
  state.currentBuilding = leftIdx;
  state.currentFloor = leftBd.floors - 1; // Top floor of left building
  floor = createFloorView(leftIdx, state.currentFloor);
  player.x = floor.w / 2 - 4; // Arrive on right side
  player.z = floor.d / 2 - 4;
  playerGroup.position.set(player.x, 0.1, player.z);
  spawnIndoorNPCs(leftIdx, state.currentFloor, floor.w, floor.d);
  updateUI();
}

function jumpToRightBuilding() {
  const rightIdx = state.currentBuilding + 1;
  if (rightIdx >= buildingsData.length) return;
  const rightBd = buildingsData[rightIdx];
  if (!rightBd) return;
  
  state.currentBuilding = rightIdx;
  state.currentFloor = rightBd.floors - 1; // Top floor of right building
  floor = createFloorView(rightIdx, state.currentFloor);
  player.x = -floor.w / 2 + 4; // Arrive on left side
  player.z = floor.d / 2 - 4;
  playerGroup.position.set(player.x, 0.1, player.z);
  spawnIndoorNPCs(rightIdx, state.currentFloor, floor.w, floor.d);
  updateUI();
}

// ============================================
// UPDATE
// ============================================
function update() {
  // One-shot action detection
  const acted = keys.actionPressed;
  keys.actionPressed = false;

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

  let prompt = '';

  if (state.mode === 'outdoor') {
    // Try to move
    const newX = player.x + mx;
    const newZ = player.z + mz;
    
    // Check collision with buildings (simplified - alleyways between them)
    let canMove = true;
    let nearestBuildingIdx = -1;
    let nearestDist = 999;
    
    for (let i = 0; i < buildingsData.length; i++) {
      const bd = buildingsData[i];
      if (!bd) continue;
      
      const bx = bd.x, bz = bd.z, bw = bd.width, bdepth = bd.depth;
      const halfW = bw / 2 + 0.5;
      const halfD = bdepth / 2 + 0.5;
      
      // Check if player would be inside building
      if (newX > bx - halfW && newX < bx + halfW && 
          newZ > bz - halfD && newZ < bz + halfD) {
        // Inside a building - only block if not near door
        const doorZone = newZ > bz + halfD - 3;
        if (!doorZone) {
          canMove = false;
        }
      }
      
      // Distance to building door (front face)
      const doorX = bx;
      const doorZ = bz + bdepth / 2;
      const dist = Math.sqrt(Math.pow(player.x - doorX, 2) + Math.pow(player.z - doorZ, 2));
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestBuildingIdx = i;
      }
    }
    
    if (canMove) {
      player.x = newX;
      player.z = newZ;
    }
    
    // Bounds
    player.x = Math.max(-40, Math.min(40, player.x));
    player.z = Math.max(-80, Math.min(5, player.z));
    playerGroup.position.set(player.x, 0.1, player.z);

    // Show prompt when near a building door
    if (nearestDist < 5) {
      prompt = 'enter';
    }

    // Press E/SPACE/ENTER to enter nearest building
    if (acted && nearestBuildingIdx >= 0 && nearestDist < 6) {
      enter(nearestBuildingIdx);
      showPrompt('');
      return;
    }
  } else {
    const oldX = player.x;
    const oldZ = player.z;
    player.x += mx;
    player.z += mz;
    const hw = floor.w / 2 - 0.5, hd = floor.d / 2 - 0.5;
    
    // ========== ROOM COLLISION - Only enter through doors ==========
    const doorW = 1.6;
    
    // Define room positions with door side
    type RoomDef = { x: number, z: number, w: number, d: number, door: 'front' | 'back' | 'left' | 'right' };
    let rooms: RoomDef[] = [];
    
    if (floor.ground) {
      // Lobby rooms (with w, d, and door side)
      const hw = floor.w / 2, hd = floor.d / 2;
      rooms = [
        { x: -hw + 5, z: -hd + 6, w: 7, d: 5, door: 'right' },
        { x: -hw + 5, z: -hd + 13, w: 7, d: 5, door: 'right' },
        { x: -hw + 5, z: -hd + 20, w: 7, d: 5, door: 'right' },
        { x: hw - 5, z: hd - 6, w: 7, d: 5, door: 'left' },
        { x: hw - 5, z: hd - 13, w: 7, d: 5, door: 'left' },
        { x: -12, z: -hd + 5, w: 6, d: 5, door: 'front' },
      ];
    } else if (!floor.top) {
      // Apartment floors - all doors on front (positive Z)
      rooms = [
        { x: -20, z: -12, w: 5, d: 5, door: 'front' },
        { x: -20, z: -4, w: 5, d: 5, door: 'front' },
        { x: -20, z: 4, w: 5, d: 5, door: 'front' },
        { x: -20, z: 12, w: 5, d: 5, door: 'front' },
        { x: -10, z: -12, w: 5, d: 5, door: 'front' },
        { x: -10, z: -4, w: 5, d: 5, door: 'front' },
        { x: -10, z: 4, w: 5, d: 5, door: 'front' },
        { x: -10, z: 12, w: 5, d: 5, door: 'front' },
        { x: 2, z: -12, w: 5, d: 5, door: 'front' },
        { x: 2, z: -4, w: 5, d: 5, door: 'front' },
        { x: 2, z: 4, w: 5, d: 5, door: 'front' },
        { x: 2, z: 12, w: 5, d: 5, door: 'front' },
        { x: 12, z: 4, w: 5, d: 5, door: 'front' },
        { x: 12, z: 12, w: 5, d: 5, door: 'front' },
      ];
    }
    
    // Check collision with each room's walls
    for (const room of rooms) {
      const left = room.x - room.w / 2;
      const right = room.x + room.w / 2;
      const back = room.z - room.d / 2;
      const front = room.z + room.d / 2;
      const wallT = 0.4; // Wall thickness for collision
      
      // Door opening bounds
      const doorHalf = doorW / 2;
      
      // Check each wall individually (works for both entry and exit)
      
      // BACK WALL (z = back) - solid unless door is 'back'
      if (room.door !== 'back') {
        // Solid back wall
        if (player.x > left && player.x < right && 
            player.z > back - wallT && player.z < back + wallT) {
          if (oldZ >= back) player.z = back + wallT;
          else player.z = back - wallT;
        }
      } else {
        // Back wall with door opening
        if (player.x > left && player.x < right && 
            player.z > back - wallT && player.z < back + wallT &&
            (player.x < room.x - doorHalf || player.x > room.x + doorHalf)) {
          if (oldZ >= back) player.z = back + wallT;
          else player.z = back - wallT;
        }
      }
      
      // FRONT WALL (z = front) - solid unless door is 'front'
      if (room.door !== 'front') {
        // Solid front wall
        if (player.x > left && player.x < right && 
            player.z > front - wallT && player.z < front + wallT) {
          if (oldZ <= front) player.z = front - wallT;
          else player.z = front + wallT;
        }
      } else {
        // Front wall with door opening
        if (player.x > left && player.x < right && 
            player.z > front - wallT && player.z < front + wallT &&
            (player.x < room.x - doorHalf || player.x > room.x + doorHalf)) {
          if (oldZ <= front) player.z = front - wallT;
          else player.z = front + wallT;
        }
      }
      
      // LEFT WALL (x = left) - solid unless door is 'left'
      if (room.door !== 'left') {
        // Solid left wall
        if (player.z > back && player.z < front && 
            player.x > left - wallT && player.x < left + wallT) {
          if (oldX >= left) player.x = left + wallT;
          else player.x = left - wallT;
        }
      } else {
        // Left wall with door opening
        if (player.z > back && player.z < front && 
            player.x > left - wallT && player.x < left + wallT &&
            (player.z < room.z - doorHalf || player.z > room.z + doorHalf)) {
          if (oldX >= left) player.x = left + wallT;
          else player.x = left - wallT;
        }
      }
      
      // RIGHT WALL (x = right) - solid unless door is 'right'
      if (room.door !== 'right') {
        // Solid right wall
        if (player.z > back && player.z < front && 
            player.x > right - wallT && player.x < right + wallT) {
          if (oldX <= right) player.x = right - wallT;
          else player.x = right + wallT;
        }
      } else {
        // Right wall with door opening
        if (player.z > back && player.z < front && 
            player.x > right - wallT && player.x < right + wallT &&
            (player.z < room.z - doorHalf || player.z > room.z + doorHalf)) {
          if (oldX <= right) player.x = right - wallT;
          else player.x = right + wallT;
        }
      }
    }
    
    // Stair collision - can't walk ON the stairs, only approach from front
    const upStairX = hw - 3;
    const downStairX = hw - 8;
    const stairZStart = -hd + 2;
    const stairZEnd = -hd + 8;
    
    // Block walking into UP stairs area (except from front edge)
    if (player.x > upStairX - 2.5 && player.x < upStairX + 2.5 && player.z < stairZEnd && player.z > stairZStart) {
      if (mz < 0) player.z = stairZEnd; // pushed back to front of stairs
    }
    // Block walking into DOWN stairs area (except from front edge)  
    if (player.x > downStairX - 2.5 && player.x < downStairX + 2.5 && player.z < stairZEnd && player.z > stairZStart) {
      if (mz < 0) player.z = stairZEnd; // pushed back to front of stairs
    }
    
    player.x = Math.max(-hw, Math.min(hw, player.x));
    player.z = Math.max(-hd, Math.min(hd, player.z));
    playerGroup.position.set(player.x, 0.1, player.z);

    // Check proximity to interactive elements (standing in front of stairs)
    const atUpStairs = !floor.top && Math.abs(player.x - upStairX) < 3 && player.z > stairZEnd - 1 && player.z < stairZEnd + 2;
    const atDownStairs = !floor.ground && Math.abs(player.x - downStairX) < 3 && player.z > stairZEnd - 1 && player.z < stairZEnd + 2;
    const nearExit = floor.ground && Math.abs(player.x) < 4 && player.z > hd - 3;
    const nearJumpDown = floor.top && Math.abs(player.x) < 4 && player.z > hd - 5;
    const nearJumpLeft = floor.leftRoof && player.x < -hw + 6 && player.z > hd - 5;
    const nearJumpRight = floor.rightRoof && player.x > hw - 6 && player.z > hd - 5;
    const atDownStairsRoof = floor.top && Math.abs(player.x - downStairX) < 3 && player.z > stairZEnd - 1 && player.z < stairZEnd + 2;

    // Set prompt based on what player is near
    if (atUpStairs) prompt = 'upstairs';
    else if (atDownStairs || atDownStairsRoof) prompt = 'downstairs';
    else if (nearExit) prompt = 'exit';
    else if (nearJumpDown) prompt = 'jump down';
    else if (nearJumpLeft) prompt = 'jump left';
    else if (nearJumpRight) prompt = 'jump right';

    if (acted) {
      if (atUpStairs) { goUp(); showPrompt(''); return; }
      if (atDownStairs || atDownStairsRoof) { goDown(); showPrompt(''); return; }
      if (nearExit) { exit(); showPrompt(''); return; }
      if (nearJumpDown) { jumpRoof(); showPrompt(''); return; }
      if (nearJumpLeft) { jumpToLeftBuilding(); showPrompt(''); return; }
      if (nearJumpRight) { jumpToRightBuilding(); showPrompt(''); return; }
    }
  }

  showPrompt(prompt);
}

// ============================================
// CAMERA
// ============================================
function updateCamera() {
  if (state.mode === 'outdoor') {
    viewSize = 22;
    // Isometric view following player through city
    camera.position.set(player.x + 15, 35, player.z + 30);
    camera.lookAt(player.x, 3, player.z - 10);
    // Update building transparency
    updateBuildingTransparency();
  } else {
    viewSize = 22;
    // Bird's eye view - camera follows player across the larger floor
    const camX = player.x * 0.5;
    const camZ = player.z * 0.5;
    camera.position.set(camX, 40, camZ + 25);
    camera.lookAt(camX, 0, camZ);
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
  updateNPCs();
  updateCamera();
  drawMinimap();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  updateCamera();
});

updateUI();
drawMinimap();
animate();
