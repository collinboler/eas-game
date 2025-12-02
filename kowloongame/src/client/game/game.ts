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
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshLambertMaterial({ color: 0x1a1815 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, 0, 0);
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

// City layout - buildings arranged in dense blocks with alleyways
// ALL buildings are enterable
const cityLayout = [
  // Row 1 (back) - z = -35
  { x: -30, z: -35, w: 10, d: 8, floors: 16 },
  { x: -18, z: -35, w: 8, d: 8, floors: 14 },
  { x: -8, z: -35, w: 9, d: 8, floors: 18 },
  { x: 4, z: -35, w: 10, d: 8, floors: 12 },
  { x: 16, z: -35, w: 8, d: 8, floors: 15 },
  { x: 28, z: -35, w: 10, d: 8, floors: 17 },
  // Row 2 - z = -22
  { x: -28, z: -22, w: 9, d: 7, floors: 13 },
  { x: -16, z: -22, w: 10, d: 7, floors: 19 },
  { x: -4, z: -22, w: 8, d: 7, floors: 11 },
  { x: 8, z: -22, w: 9, d: 7, floors: 16 },
  { x: 20, z: -22, w: 10, d: 7, floors: 14 },
  // Row 3 - z = -10
  { x: -25, z: -10, w: 8, d: 6, floors: 15 },
  { x: -14, z: -10, w: 9, d: 6, floors: 12 },
  { x: -2, z: -10, w: 10, d: 6, floors: 20 },
  { x: 12, z: -10, w: 8, d: 6, floors: 13 },
  { x: 24, z: -10, w: 9, d: 6, floors: 17 },
];

function createCityBuilding(config: typeof cityLayout[0], index: number) {
  const { x, z, w, d, floors } = config;
  const height = floors * 2.2;
  const group = new THREE.Group();
  
  const colors = [0x3a3540, 0x35303a, 0x403538, 0x383540, 0x353038];
  const color = colors[index % colors.length];
  
  // Main building mesh
  const buildingMat = new THREE.MeshLambertMaterial({ 
    color, 
    transparent: true, 
    opacity: 1 
  });
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(w, height, d),
    buildingMat
  );
  building.position.set(0, height / 2, 0);
  group.add(building);
  allBuildingMeshes.push(building);

  // Windows
  for (let f = 0; f < Math.min(floors, 10); f++) {
    const y = f * 2.2 + 1.5;
    for (let wx = 0; wx < Math.floor(w / 2.5); wx++) {
      const isLit = Math.random() > 0.35;
      const litColors = [0xffdd66, 0xffaa44, 0x66ddff, 0x88ffaa];
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1.4),
        new THREE.MeshBasicMaterial({ 
          color: isLit ? litColors[Math.floor(Math.random() * 4)] : 0x1a2030,
          transparent: true, opacity: 1
        })
      );
      win.position.set(-w/2 + 1.5 + wx * 2.5, y, d/2 + 0.01);
      group.add(win);
      allBuildingMeshes.push(win);
    }
  }

  // Neon signs (random)
  if (Math.random() > 0.4) {
    const neonColors = [0xff0066, 0x00ffff, 0xff6600, 0x00ff66, 0xff00ff, 0xffff00];
    const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];
    const signW = 1 + Math.random() * 2;
    const signH = 0.4 + Math.random() * 0.4;
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(signW, signH, 0.15),
      new THREE.MeshBasicMaterial({ color: neonColor, transparent: true, opacity: 1 })
    );
    sign.position.set((Math.random() - 0.5) * (w - 2), 3 + Math.random() * 4, d/2 + 0.2);
    group.add(sign);
    allBuildingMeshes.push(sign);
    
    const glow = new THREE.PointLight(neonColor, 0.8, 6);
    glow.position.copy(sign.position);
    glow.position.z += 0.5;
    group.add(glow);
  }

  // Door - all buildings are enterable
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
  
  // Door light
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

// Update NPC positions
function updateNPCs() {
  const npcsToUpdate = state.mode === 'outdoor' ? outdoorNPCs : indoorNPCs;
  
  for (const npc of npcsToUpdate) {
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
        // Outdoor - wander in alleyways
        npc.targetX = npc.x + (Math.random() - 0.5) * 20;
        npc.targetZ = npc.z + (Math.random() - 0.5) * 20;
        // Clamp to city bounds
        npc.targetX = Math.max(-38, Math.min(38, npc.targetX));
        npc.targetZ = Math.max(-42, Math.min(3, npc.targetZ));
      }
    } else {
      // Move towards target
      const moveX = (dx / dist) * npc.speed;
      const moveZ = (dz / dist) * npc.speed;
      npc.x += moveX;
      npc.z += moveZ;
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

  // ====== LOBBY (Ground Floor) ======
  } else if (isGround) {
    // Marble floor
    const lobbyFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshLambertMaterial({ color: 0x8a8070 })
    );
    lobbyFloor.rotation.x = -Math.PI / 2;
    lobbyFloor.position.y = 0.01;
    group.add(lobbyFloor);

    // Checkered marble tiles
    for (let x = -6; x <= 6; x++) {
      for (let z = -4; z <= 4; z++) {
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(1.9, 1.9),
          new THREE.MeshLambertMaterial({ color: (x + z) % 2 === 0 ? 0x9a9080 : 0x706858 })
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x * 2, 0.02, z * 2);
        group.add(tile);
      }
    }

    // Walls - darker/dirtier
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x4a4540 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.3), wallMat);
    back.position.set(0, wallH/2, -d/2);
    group.add(back);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, d), wallMat);
    left.position.set(-w/2, wallH/2, 0);
    group.add(left);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, d), wallMat);
    right.position.set(w/2, wallH/2, 0);
    group.add(right);

    // Front wall with exit
    const fl = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 3, wallH, 0.3), wallMat);
    fl.position.set(-w/4 - 1.5, wallH/2, d/2);
    group.add(fl);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(w/2 - 3, wallH, 0.3), wallMat);
    fr.position.set(w/4 + 1.5, wallH/2, d/2);
    group.add(fr);

    // Reception desk
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(6, 1.2, 2),
      new THREE.MeshLambertMaterial({ color: 0x553322 })
    );
    desk.position.set(0, 0.6, -d/2 + 4);
    group.add(desk);
    
    // Desk lamp
    const lamp = new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.5, 8),
      new THREE.MeshBasicMaterial({ color: 0xffdd88 })
    );
    lamp.position.set(-2, 1.5, -d/2 + 4);
    group.add(lamp);
    const deskLight = new THREE.PointLight(0xffdd88, 1, 5);
    deskLight.position.set(-2, 1.5, -d/2 + 4);
    group.add(deskLight);

    // Mailboxes on left wall
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.6, 0.4),
          new THREE.MeshLambertMaterial({ color: 0x886644 })
        );
        box.position.set(-w/2 + 0.5, 1.5 + r * 0.7, -4 + c * 1);
        group.add(box);
      }
    }

    // Waiting chairs
    for (let i = 0; i < 3; i++) {
      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.8, 1.2),
        new THREE.MeshLambertMaterial({ color: 0x664422 })
      );
      chair.position.set(w/2 - 3, 0.4, -2 + i * 2);
      group.add(chair);
    }

    // Potted plant
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.4, 0.8, 8),
      new THREE.MeshLambertMaterial({ color: 0x885544 })
    );
    pot.position.set(-w/2 + 3, 0.4, d/2 - 3);
    group.add(pot);
    const plant = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x336622 })
    );
    plant.position.set(-w/2 + 3, 1.2, d/2 - 3);
    group.add(plant);

    // Elevator doors (decorative)
    for (let i = 0; i < 2; i++) {
      const elev = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 3),
        new THREE.MeshLambertMaterial({ color: 0x777777 })
      );
      elev.position.set(6 + i * 3.5, 1.5, -d/2 + 0.2);
      group.add(elev);
      // Button
      const btn = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      btn.position.set(4.5 + i * 3.5, 1.2, -d/2 + 0.3);
      group.add(btn);
    }

    // Neon "LOBBY" sign
    const lobbySign = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.6, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xff00ff })
    );
    lobbySign.position.set(0, wallH - 0.5, -d/2 + 0.3);
    group.add(lobbySign);
    const lobbyGlow = new THREE.PointLight(0xff00ff, 1.5, 8);
    lobbyGlow.position.set(0, wallH - 0.5, -d/2 + 1);
    group.add(lobbyGlow);

    // Door mat at exit
    const doorMat = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 2),
      new THREE.MeshLambertMaterial({ color: 0x3a3025 })
    );
    doorMat.rotation.x = -Math.PI / 2;
    doorMat.position.set(0, 0.03, d/2 - 1.5);
    group.add(doorMat);
    
    // Small EXIT sign above door (subtle red)
    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xcc3333 })
    );
    exitSign.position.set(0, wallH - 0.3, d/2 - 0.2);
    group.add(exitSign);
    const exitGlow = new THREE.PointLight(0xff4444, 0.3, 4);
    exitGlow.position.set(0, wallH - 0.5, d/2 - 0.5);
    group.add(exitGlow);

    // UP STAIRS (back right) - light to dark gradient
    const upColors = [0xaaaaaa, 0x999999, 0x888888, 0x777777, 0x666666, 0x555555, 0x444444];
    for (let s = 0; s < 7; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.3, 1.2),
        new THREE.MeshLambertMaterial({ color: upColors[s] })
      );
      step.position.set(w/2 - 4, 0.15, -d/2 + 1 + s * 1.0);
      group.add(step);
    }
    // UP label
    const upLabel = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x558855 })
    );
    upLabel.position.set(w/2 - 4, 2.5, -d/2 + 0.2);
    group.add(upLabel);
    
    // Stair light
    const stairLight = new THREE.PointLight(0xffeedd, 0.5, 10);
    stairLight.position.set(w/2 - 4, 3, -d/2 + 3);
    group.add(stairLight);

    // Ceiling light
    const ceil = new THREE.PointLight(0xffffee, 1.2, 35);
    ceil.position.set(0, 3.5, 0);
    group.add(ceil);

  // ====== APARTMENT FLOORS ======
  } else {
    // Hallway carpet
    const hallFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshLambertMaterial({ color: 0x4a3530 })
    );
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.y = 0.01;
    group.add(hallFloor);

    // Main corridor runner
    const runner = new THREE.Mesh(
      new THREE.PlaneGeometry(5, d - 4),
      new THREE.MeshLambertMaterial({ color: 0x3a2520 })
    );
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(0, 0.02, 0);
    group.add(runner);

    // Walls - yellowed wallpaper
    const wallMat = new THREE.MeshLambertMaterial({ color: 0x6a6050 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.3), wallMat);
    back.position.set(0, wallH/2, -d/2);
    group.add(back);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, d), wallMat);
    left.position.set(-w/2, wallH/2, 0);
    group.add(left);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, d), wallMat);
    right.position.set(w/2, wallH/2, 0);
    group.add(right);
    const front = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, 0.3), wallMat);
    front.position.set(0, wallH/2, d/2);
    group.add(front);

    // Many apartment doors on both sides
    const doorColors = [0x553322, 0x4a3020, 0x5a4030, 0x443322, 0x504028];
    for (let z = -d/2 + 4; z < d/2 - 4; z += 5) {
      // Left wall doors
      const leftDoor = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 3),
        new THREE.MeshLambertMaterial({ color: doorColors[Math.floor(Math.random() * 5)] })
      );
      leftDoor.position.set(-w/2 + 0.2, 1.5, z);
      leftDoor.rotation.y = Math.PI / 2;
      group.add(leftDoor);
      // Door frame
      const leftFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3.2, 2.3),
        new THREE.MeshLambertMaterial({ color: 0x3a3025 })
      );
      leftFrame.position.set(-w/2 + 0.15, 1.6, z);
      group.add(leftFrame);
      // Door number plate
      const numL = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.35),
        new THREE.MeshBasicMaterial({ color: 0xccaa77 })
      );
      numL.position.set(-w/2 + 0.25, 2.3, z);
      numL.rotation.y = Math.PI / 2;
      group.add(numL);
      // Random light under door
      if (Math.random() > 0.5) {
        const glow = new THREE.PointLight(0xffdd88, 0.25, 3);
        glow.position.set(-w/2 + 1, 0.1, z);
        group.add(glow);
      }

      // Right wall doors
      const rightDoor = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 3),
        new THREE.MeshLambertMaterial({ color: doorColors[Math.floor(Math.random() * 5)] })
      );
      rightDoor.position.set(w/2 - 0.2, 1.5, z);
      rightDoor.rotation.y = -Math.PI / 2;
      group.add(rightDoor);
      const rightFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 3.2, 2.3),
        new THREE.MeshLambertMaterial({ color: 0x3a3025 })
      );
      rightFrame.position.set(w/2 - 0.15, 1.6, z);
      group.add(rightFrame);
      const numR = new THREE.Mesh(
        new THREE.PlaneGeometry(0.5, 0.35),
        new THREE.MeshBasicMaterial({ color: 0xccaa77 })
      );
      numR.position.set(w/2 - 0.25, 2.3, z);
      numR.rotation.y = -Math.PI / 2;
      group.add(numR);
      if (Math.random() > 0.5) {
        const glow = new THREE.PointLight(0xffdd88, 0.25, 3);
        glow.position.set(w/2 - 1, 0.1, z);
        group.add(glow);
      }
    }

    // Vending machines (scattered)
    const vendingPositions = [
      { x: -w/2 + 2, z: -8 },
      { x: w/2 - 2, z: 5 },
    ];
    for (const pos of vendingPositions) {
      const vend = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 2.2, 1),
        new THREE.MeshLambertMaterial({ color: 0x334455 })
      );
      vend.position.set(pos.x, 1.1, pos.z);
      group.add(vend);
      // Screen
      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2, 1),
        new THREE.MeshBasicMaterial({ color: 0x88aacc })
      );
      screen.position.set(pos.x + (pos.x > 0 ? -0.76 : 0.76), 1.4, pos.z);
      screen.rotation.y = pos.x > 0 ? Math.PI / 2 : -Math.PI / 2;
      group.add(screen);
      const vendLight = new THREE.PointLight(0x88aacc, 0.3, 4);
      vendLight.position.set(pos.x, 1.5, pos.z);
      group.add(vendLight);
    }

    // Potted plants
    const plantPositions = [
      { x: -10, z: 10 }, { x: 10, z: -10 }, { x: -15, z: -5 }, { x: 15, z: 8 }
    ];
    for (const pos of plantPositions) {
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.35, 0.6, 8),
        new THREE.MeshLambertMaterial({ color: 0x6a4030 })
      );
      pot.position.set(pos.x, 0.3, pos.z);
      group.add(pot);
      const plant = new THREE.Mesh(
        new THREE.SphereGeometry(0.6, 8, 6),
        new THREE.MeshLambertMaterial({ color: 0x3a5530 })
      );
      plant.position.set(pos.x, 0.9, pos.z);
      group.add(plant);
    }

    // Benches/seats
    const benchPositions = [{ x: -8, z: 0 }, { x: 12, z: 0 }];
    for (const pos of benchPositions) {
      const bench = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.6, 1),
        new THREE.MeshLambertMaterial({ color: 0x5a4535 })
      );
      bench.position.set(pos.x, 0.3, pos.z);
      group.add(bench);
      // Legs
      for (const lx of [-1.2, 1.2]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.6, 0.8),
          new THREE.MeshLambertMaterial({ color: 0x3a3025 })
        );
        leg.position.set(pos.x + lx, 0.3, pos.z);
        group.add(leg);
      }
    }

    // Trash cans
    const trashPositions = [{ x: -5, z: 12 }, { x: 8, z: -12 }, { x: -18, z: 0 }];
    for (const pos of trashPositions) {
      const trash = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.35, 0.9, 8),
        new THREE.MeshLambertMaterial({ color: 0x404040 })
      );
      trash.position.set(pos.x, 0.45, pos.z);
      group.add(trash);
    }

    // Wall notices/bulletin boards
    for (let i = 0; i < 5; i++) {
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.4, 0.08),
        new THREE.MeshLambertMaterial({ color: 0x5a5045 })
      );
      board.position.set(-18 + i * 8, 2.2, -d/2 + 0.2);
      group.add(board);
      // Papers on board
      for (let p = 0; p < 3; p++) {
        const paper = new THREE.Mesh(
          new THREE.PlaneGeometry(0.5, 0.6),
          new THREE.MeshLambertMaterial({ color: 0x908070 + Math.random() * 0x101010 })
        );
        paper.position.set(-18.5 + i * 8 + p * 0.6, 2.2, -d/2 + 0.25);
        group.add(paper);
      }
    }

    // Fire extinguisher
    const extinguisher = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.14, 0.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x8b2020 })
    );
    extinguisher.position.set(-w/2 + 0.5, 1.1, 10);
    group.add(extinguisher);

    // Utility closet door (back wall)
    const closetDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 2.8),
      new THREE.MeshLambertMaterial({ color: 0x505050 })
    );
    closetDoor.position.set(-10, 1.4, -d/2 + 0.2);
    group.add(closetDoor);

    // Laundry area (corner alcove)
    const washer = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.3, 1),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    washer.position.set(-w/2 + 3, 0.65, d/2 - 3);
    group.add(washer);
    const washerDoor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    washerDoor.rotation.z = Math.PI / 2;
    washerDoor.position.set(-w/2 + 3.6, 0.8, d/2 - 3);
    group.add(washerDoor);

    // Ceiling lights (multiple)
    const lightPositions = [
      { x: -15, z: -10 }, { x: 0, z: -10 }, { x: 15, z: -10 },
      { x: -15, z: 5 }, { x: 0, z: 5 }, { x: 15, z: 5 },
    ];
    for (const pos of lightPositions) {
      const light = new THREE.PointLight(0xffffcc, 0.5, 12);
      light.position.set(pos.x, 3.5, pos.z);
      group.add(light);
      // Light fixture
      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 0.1, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffee })
      );
      fixture.position.set(pos.x, 3.9, pos.z);
      group.add(fixture);
    }

    // ========== STAIRWELL (back right corner) ==========
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
  ctx.strokeRect(8, 8, W - 16, H - 28);
  ctx.fillStyle = '#252018';
  ctx.fillRect(8, 8, W - 16, H - 28);
  
  // Scale: map coords (-35 to 5 Z, -35 to 35 X) to minimap
  const mapScale = (W - 20) / 70;
  const offsetX = 10;
  const offsetZ = 10;
  
  function worldToMap(wx: number, wz: number) {
    return {
      x: offsetX + (wx + 35) * mapScale,
      y: offsetZ + (-wz + 5) * mapScale * 0.8
    };
  }
  
  // Draw all buildings from buildingsData
  for (let i = 0; i < buildingsData.length; i++) {
    const b = buildingsData[i];
    if (!b) continue;
    const pos = worldToMap(b.x, b.z);
    const bw = b.width * mapScale * 0.9;
    const bd = b.depth * mapScale * 0.7;
    
    // Check if this is the current building
    const isCurrentBuilding = state.mode === 'indoor' && state.currentBuilding === i;
    
    // Building fill - all buildings enterable
    ctx.fillStyle = isCurrentBuilding ? '#ff5533' : '#4a4540';
    ctx.fillRect(pos.x - bw/2, pos.y - bd/2, bw, bd);
    
    // Border
    ctx.strokeStyle = isCurrentBuilding ? '#ffaa66' : '#6a6050';
    ctx.lineWidth = isCurrentBuilding ? 2 : 1;
    ctx.strokeRect(pos.x - bw/2, pos.y - bd/2, bw, bd);
  }
  
  // Draw alleyways (darker lines)
  ctx.strokeStyle = '#151210';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(worldToMap(-35, -28).x, worldToMap(-35, -28).y);
  ctx.lineTo(worldToMap(35, -28).x, worldToMap(35, -28).y);
  ctx.moveTo(worldToMap(-35, -16).x, worldToMap(-35, -16).y);
  ctx.lineTo(worldToMap(35, -16).x, worldToMap(35, -16).y);
  ctx.stroke();
  
  // Draw player position
  if (state.mode === 'outdoor') {
    const pp = worldToMap(player.x, player.z);
    
    // Player dot (pulsing red)
    const pulse = Math.sin(Date.now() / 150) * 1.5;
    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 4 + pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // White center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Title
  ctx.fillStyle = '#8a7060';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('九龍城寨', W/2, H - 6);
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
    player.z = Math.max(-45, Math.min(5, player.z));
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
    player.x += mx;
    player.z += mz;
    const hw = floor.w / 2 - 0.5, hd = floor.d / 2 - 0.5;
    
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
