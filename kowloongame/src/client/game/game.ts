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

// Convert number to Chinese characters
function toChineseNumber(num: number): string {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const units = ['', '十', '百'];
  
  if (num <= 0 || num > 99) return num.toString();
  
  if (num <= 10) {
    if (num === 10) return '十';
    return digits[num] ?? num.toString();
  }
  
  if (num < 20) {
    return '十' + (digits[num - 10] ?? '');
  }
  
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  
  let result = (digits[tens] ?? '') + '十';
  if (ones > 0) {
    result += digits[ones] ?? '';
  }
  
  return result;
}

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

  // ========== WINDOWS - Chaotic pattern on ALL sides ==========
  const litColors = [0xffdd66, 0xffaa44, 0x66ddff, 0x88ffaa, 0xffccaa, 0xaaffcc];
  
  for (let f = 0; f < floors; f++) {
    const y = f * 2.2 + 1.5;
    
    // FRONT windows (positive Z)
    for (let wx = 0; wx < Math.floor(w / 2); wx++) {
      if (Math.random() > 0.15) {
        const isLit = Math.random() > 0.4;
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
    
    // BACK windows (negative Z)
    for (let wx = 0; wx < Math.floor(w / 2); wx++) {
      if (Math.random() > 0.2) {
        const isLit = Math.random() > 0.5;
        const winW = 0.5 + Math.random() * 0.4;
        const winH = 0.7 + Math.random() * 0.6;
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(winW, winH),
          new THREE.MeshBasicMaterial({ 
            color: isLit ? litColors[Math.floor(Math.random() * 6)] : 0x1a2535,
            transparent: true, opacity: 1
          })
        );
        win.position.set(-w/2 + 1 + wx * 2 + Math.random() * 0.5, y, -d/2 - 0.01);
        win.rotation.y = Math.PI;
        group.add(win);
        allBuildingMeshes.push(win);
      }
    }
    
    // LEFT side windows (negative X)
    for (let wz = 0; wz < Math.floor(d / 2); wz++) {
      if (Math.random() > 0.2) {
        const isLit = Math.random() > 0.45;
        const winW = 0.5 + Math.random() * 0.4;
        const winH = 0.7 + Math.random() * 0.7;
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(winW, winH),
          new THREE.MeshBasicMaterial({ 
            color: isLit ? litColors[Math.floor(Math.random() * 6)] : 0x1a2535,
            transparent: true, opacity: 1
          })
        );
        win.position.set(-w/2 - 0.01, y, -d/2 + 1 + wz * 2 + Math.random() * 0.5);
        win.rotation.y = -Math.PI / 2;
        group.add(win);
        allBuildingMeshes.push(win);
        
        // AC unit on side
        if (Math.random() > 0.7) {
          const ac = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.4, 0.6),
            new THREE.MeshLambertMaterial({ color: 0xccccbb, transparent: true, opacity: 1 })
          );
          ac.position.set(-w/2 - 0.3, y - 0.3, -d/2 + 1 + wz * 2);
          group.add(ac);
        }
      }
    }
    
    // RIGHT side windows (positive X)
    for (let wz = 0; wz < Math.floor(d / 2); wz++) {
      if (Math.random() > 0.2) {
        const isLit = Math.random() > 0.45;
        const winW = 0.5 + Math.random() * 0.4;
        const winH = 0.7 + Math.random() * 0.7;
        const win = new THREE.Mesh(
          new THREE.PlaneGeometry(winW, winH),
          new THREE.MeshBasicMaterial({ 
            color: isLit ? litColors[Math.floor(Math.random() * 6)] : 0x1a2535,
            transparent: true, opacity: 1
          })
        );
        win.position.set(w/2 + 0.01, y, -d/2 + 1 + wz * 2 + Math.random() * 0.5);
        win.rotation.y = Math.PI / 2;
        group.add(win);
        allBuildingMeshes.push(win);
        
        // AC unit on side
        if (Math.random() > 0.7) {
          const ac = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.4, 0.6),
            new THREE.MeshLambertMaterial({ color: 0xccccbb, transparent: true, opacity: 1 })
          );
          ac.position.set(w/2 + 0.3, y - 0.3, -d/2 + 1 + wz * 2);
          group.add(ac);
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
  
  // ========== CHINESE NUMBER SIGN above door ==========
  const buildingNum = index + 1;
  // Create sign backing plate
  const signBacking = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x8b0000 }) // Dark red traditional color
  );
  signBacking.position.set(0, 3.3, d/2 + 0.35);
  group.add(signBacking);
  
  // Gold border
  const signBorder = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.9, 0.08),
    new THREE.MeshLambertMaterial({ color: 0xdaa520 }) // Gold color
  );
  signBorder.position.set(0, 3.3, d/2 + 0.33);
  group.add(signBorder);
  
  // Create Chinese number using canvas texture
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 128;
  signCanvas.height = 96;
  const signCtx = signCanvas.getContext('2d');
  if (signCtx) {
    // Red background
    signCtx.fillStyle = '#8b0000';
    signCtx.fillRect(0, 0, 128, 96);
    
    // Gold text
    signCtx.fillStyle = '#ffd700';
    signCtx.font = 'bold 48px serif';
    signCtx.textAlign = 'center';
    signCtx.textBaseline = 'middle';
    
    // Convert number to Chinese
    const chineseNum = toChineseNumber(buildingNum);
    signCtx.fillText(chineseNum, 64, 48);
  }
  
  const signTexture = new THREE.CanvasTexture(signCanvas);
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.7),
    new THREE.MeshBasicMaterial({ map: signTexture })
  );
  signFace.position.set(0, 3.3, d/2 + 0.41);
  group.add(signFace);
  
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

// ============================================
// SHOP STALLS - Detailed street vendors
// ============================================
interface ShopStall {
  type: 'food' | 'clothes' | 'drugs' | 'electronics' | 'trinkets';
  x: number;
  z: number;
  group: THREE.Group;
  seller: THREE.Group;
}

const shopStalls: ShopStall[] = [];

function createShopStall(x: number, z: number, type: ShopStall['type']): THREE.Group {
  const group = new THREE.Group();
  
  // Random variations for each stall
  const variant = Math.floor(Math.random() * 3); // 0, 1, or 2 for sub-variants
  const stallScale = 0.85 + Math.random() * 0.3; // Size variation
  const isWorn = Math.random() > 0.5; // Worn/weathered look
  
  // Varied table colors and styles
  const tableColors = [0x5a4030, 0x4a3525, 0x6a5040, 0x3a2a1a, 0x7a6050];
  const tableColor = type === 'drugs' ? 0x1a1a22 : tableColors[Math.floor(Math.random() * tableColors.length)] ?? 0x5a4030;
  
  // Different table styles
  const tableWidth = 2.0 + Math.random() * 1.0;
  const tableDepth = 1.2 + Math.random() * 0.6;
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(tableWidth, 0.7 + Math.random() * 0.2, tableDepth),
    new THREE.MeshLambertMaterial({ color: tableColor })
  );
  table.position.y = 0.4;
  group.add(table);
  
  // Some stalls have a tablecloth
  if (Math.random() > 0.5 && type !== 'drugs') {
    const clothColors = [0xcc3333, 0x3366cc, 0x33cc66, 0xcccc33, 0xcc6633, 0x6633cc];
    const cloth = new THREE.Mesh(
      new THREE.BoxGeometry(tableWidth + 0.1, 0.02, tableDepth + 0.3),
      new THREE.MeshLambertMaterial({ color: clothColors[Math.floor(Math.random() * clothColors.length)] ?? 0xcc3333 })
    );
    cloth.position.y = 0.76;
    group.add(cloth);
  }
  
  // Varied canopy styles
  const hasCanopy = type !== 'drugs' || Math.random() > 0.7;
  const canopyHeight = 2.0 + Math.random() * 0.5;
  
  if (hasCanopy) {
    // Different canopy color palettes per type with variation
    const canopyPalettes: Record<ShopStall['type'], number[]> = {
      food: [0xcc3333, 0xdd4444, 0xbb2222, 0xff6633, 0xcc6600],
      clothes: [0x3366cc, 0x4477dd, 0x2255bb, 0x5588ee, 0x336699],
      drugs: [0x222233, 0x1a1a2a, 0x2a2a3a],
      electronics: [0x33cc66, 0x44dd77, 0x22bb55, 0x55ee88],
      trinkets: [0xccaa33, 0xddbb44, 0xbb9922, 0xeecc55, 0xcc8800]
    };
    const palette = canopyPalettes[type];
    const canopyColor = palette[Math.floor(Math.random() * palette.length)] ?? 0xcc3333;
    
    // Some have striped canopies
    if (Math.random() > 0.6) {
      // Striped canopy
      for (let stripe = 0; stripe < 5; stripe++) {
        const stripeColor = stripe % 2 === 0 ? canopyColor : 0xffffff;
        const stripeWidth = (tableWidth + 0.5) / 5;
        const canopyStripe = new THREE.Mesh(
          new THREE.BoxGeometry(stripeWidth, 0.08, tableDepth + 0.5),
          new THREE.MeshLambertMaterial({ color: stripeColor })
        );
        canopyStripe.position.set(-tableWidth/2 + stripeWidth/2 + stripe * stripeWidth, canopyHeight, 0);
        group.add(canopyStripe);
      }
    } else {
      // Solid canopy (sometimes tattered/slanted)
      const canopy = new THREE.Mesh(
        new THREE.BoxGeometry(tableWidth + 0.5, 0.08, tableDepth + 0.5),
        new THREE.MeshLambertMaterial({ color: canopyColor })
      );
      canopy.position.set(0, canopyHeight, 0);
      if (isWorn) canopy.rotation.z = (Math.random() - 0.5) * 0.15;
      group.add(canopy);
    }
    
    // Canopy supports - varied styles
    const poleColor = Math.random() > 0.5 ? 0x444444 : 0x886644;
    for (let cx = -1; cx <= 1; cx += 2) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04 + Math.random() * 0.02, 0.05, canopyHeight, 6),
        new THREE.MeshLambertMaterial({ color: poleColor })
      );
      pole.position.set(cx * (tableWidth/2 + 0.2), canopyHeight/2, tableDepth/2 + 0.1);
      if (isWorn) pole.rotation.z = (Math.random() - 0.5) * 0.1;
      group.add(pole);
    }
  }
  
  // Varied lighting
  const lightColors = [0xffffaa, 0xffddaa, 0xffeecc, 0xffeedd];
  const bulbColor = lightColors[Math.floor(Math.random() * lightColors.length)] ?? 0xffffaa;
  const numLights = 1 + Math.floor(Math.random() * 2);
  
  for (let li = 0; li < numLights; li++) {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + Math.random() * 0.08, 8, 8),
      new THREE.MeshBasicMaterial({ color: bulbColor })
    );
    bulb.position.set((li - 0.5) * 0.8, hasCanopy ? canopyHeight - 0.3 : 1.5, 0);
    group.add(bulb);
    
    // Wire for bulb
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    wire.position.set((li - 0.5) * 0.8, hasCanopy ? canopyHeight - 0.15 : 1.65, 0);
    group.add(wire);
  }
  
  const stallLight = new THREE.PointLight(0xffddaa, 0.6 + Math.random() * 0.4, 5 + Math.random() * 2);
  stallLight.position.set(0, hasCanopy ? canopyHeight - 0.3 : 1.5, 0);
  group.add(stallLight);
  
  // ============ TYPE-SPECIFIC ITEMS WITH VARIANTS ============
  
  if (type === 'food') {
    const foodVariant = variant;
    
    if (foodVariant === 0) {
      // NOODLE STALL - steaming pots and bowls
      const numPots = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numPots; i++) {
        const pot = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18 + Math.random() * 0.1, 0.22 + Math.random() * 0.1, 0.25 + Math.random() * 0.1, 8),
          new THREE.MeshLambertMaterial({ color: 0x555555 + Math.floor(Math.random() * 0x222222) })
        );
        pot.position.set(-0.6 + i * 0.6, 0.95, 0.1);
        group.add(pot);
        
        // Steam
        for (let s = 0; s < 4; s++) {
          const steam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.04, 0.25, 4),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 + Math.random() * 0.2 })
          );
          steam.position.set(-0.6 + i * 0.6 + (Math.random() - 0.5) * 0.12, 1.2 + s * 0.12, 0.1 + (Math.random() - 0.5) * 0.08);
          group.add(steam);
        }
      }
      
      // Ingredient bowls
      const ingredientColors = [0xdd8844, 0x88dd44, 0xdd4444, 0xdddd44, 0x44dd88, 0xdd88dd];
      for (let i = 0; i < 5; i++) {
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.1, 0.08, 8),
          new THREE.MeshLambertMaterial({ color: 0xddddcc })
        );
        bowl.position.set(-0.5 + i * 0.3, 0.88, -0.35);
        group.add(bowl);
        
        const ingredient = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 4),
          new THREE.MeshLambertMaterial({ color: ingredientColors[i % ingredientColors.length] ?? 0xdd8844 })
        );
        ingredient.position.set(-0.5 + i * 0.3, 0.93, -0.35);
        ingredient.scale.y = 0.4;
        group.add(ingredient);
      }
      
    } else if (foodVariant === 1) {
      // BBQ/ROAST MEAT STALL
      // Hanging meats
      const meatColors = [0x883322, 0x994433, 0x773311, 0xaa4422];
      for (let i = 0; i < 4; i++) {
        const meat = new THREE.Mesh(
          new THREE.BoxGeometry(0.12 + Math.random() * 0.06, 0.35 + Math.random() * 0.15, 0.08),
          new THREE.MeshLambertMaterial({ color: meatColors[i % meatColors.length] ?? 0x883322 })
        );
        meat.position.set(-0.5 + i * 0.35, hasCanopy ? canopyHeight - 0.5 : 1.6, 0);
        group.add(meat);
        
        // Hook
        const hook = new THREE.Mesh(
          new THREE.TorusGeometry(0.04, 0.01, 4, 8, Math.PI),
          new THREE.MeshLambertMaterial({ color: 0x666666 })
        );
        hook.position.set(-0.5 + i * 0.35, hasCanopy ? canopyHeight - 0.3 : 1.8, 0);
        hook.rotation.x = Math.PI;
        group.add(hook);
      }
      
      // Grill/hot plate
      const grill = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.1, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x333333 })
      );
      grill.position.set(0.3, 0.88, 0.2);
      group.add(grill);
      
      // Meat on grill
      for (let i = 0; i < 4; i++) {
        const grillMeat = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.04, 0.08),
          new THREE.MeshLambertMaterial({ color: 0x994433 })
        );
        grillMeat.position.set(0.1 + i * 0.15, 0.95, 0.2);
        group.add(grillMeat);
      }
      
    } else {
      // FRUIT/PRODUCE STALL
      const fruitColors = [0xff6633, 0xffcc00, 0x33cc33, 0xff3366, 0x9933ff, 0xff9900];
      
      // Stacked crates
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const crate = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.2, 0.35),
            new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
          );
          crate.position.set(-0.5 + col * 0.45, 0.88 + row * 0.22, 0);
          group.add(crate);
          
          // Fruit in crate
          const fruitColor = fruitColors[Math.floor(Math.random() * fruitColors.length)] ?? 0xff6633;
          for (let f = 0; f < 3; f++) {
            const fruit = new THREE.Mesh(
              new THREE.SphereGeometry(0.08, 6, 6),
              new THREE.MeshLambertMaterial({ color: fruitColor })
            );
            fruit.position.set(-0.55 + col * 0.45 + f * 0.12, 0.98 + row * 0.22, 0);
            group.add(fruit);
          }
        }
      }
      
      // Hanging bananas
      const bananas = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.03, 0.25, 6),
        new THREE.MeshLambertMaterial({ color: 0xffdd00 })
      );
      bananas.position.set(0.6, hasCanopy ? canopyHeight - 0.4 : 1.6, 0.3);
      bananas.rotation.z = 0.3;
      group.add(bananas);
    }
    
    // Sign with random color
    const signColors = [0xff4444, 0xffaa00, 0xff6633];
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.6 + Math.random() * 0.3, 0.25 + Math.random() * 0.1, 0.04),
      new THREE.MeshBasicMaterial({ color: signColors[Math.floor(Math.random() * signColors.length)] ?? 0xff4444 })
    );
    sign.position.set(Math.random() * 0.4 - 0.2, hasCanopy ? canopyHeight + 0.2 : 2.3, 0.6);
    sign.rotation.z = (Math.random() - 0.5) * 0.15;
    group.add(sign);
    
  } else if (type === 'clothes') {
    const clothesVariant = variant;
    
    // Varied cloth colors for each stall
    const palettes: number[][] = [
      [0x3366cc, 0xcc3366, 0x66cc33, 0xcccc33, 0x333333, 0xffffff], // Colorful
      [0x222222, 0x333333, 0x444444, 0x555555, 0x111111, 0x666666], // Grayscale
      [0xcc3333, 0xdd4444, 0xee5555, 0xaa2222, 0xff6666, 0x991111], // Reds
      [0x3355aa, 0x4466bb, 0x5577cc, 0x2244aa, 0x6688dd, 0x113399], // Blues
    ];
    const paletteIdx = Math.floor(Math.random() * palettes.length);
    const clothColors: number[] = palettes[paletteIdx] ?? [0x3366cc, 0xcc3366, 0x66cc33, 0xcccc33, 0x333333, 0xffffff];
    
    if (clothesVariant === 0) {
      // HANGING CLOTHES RACK
      const rack = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, tableWidth, 6),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      rack.rotation.z = Math.PI / 2;
      rack.position.set(0, hasCanopy ? canopyHeight - 0.6 : 1.5, -0.2);
      group.add(rack);
      
      // Varied hanging clothes
      const numClothes = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numClothes; i++) {
        const clothH = 0.4 + Math.random() * 0.2;
        const cloth = new THREE.Mesh(
          new THREE.BoxGeometry(0.2 + Math.random() * 0.1, clothH, 0.06),
          new THREE.MeshLambertMaterial({ color: clothColors[i % clothColors.length] ?? 0x3366cc })
        );
        cloth.position.set(-tableWidth/2 + 0.2 + i * (tableWidth/(numClothes+1)), hasCanopy ? canopyHeight - 0.6 - clothH/2 : 1.5 - clothH/2, -0.2);
        cloth.rotation.z = (Math.random() - 0.5) * 0.15;
        group.add(cloth);
      }
      
    } else if (clothesVariant === 1) {
      // SHOE STALL
      const shoeColors = [0x222222, 0x8b4513, 0x333333, 0xffffff, 0x8b0000, 0x000080];
      
      // Shoe display shelves
      for (let shelf = 0; shelf < 2; shelf++) {
        for (let col = 0; col < 4; col++) {
          const shoe = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.1, 0.25),
            new THREE.MeshLambertMaterial({ color: shoeColors[Math.floor(Math.random() * shoeColors.length)] ?? 0x222222 })
          );
          shoe.position.set(-0.5 + col * 0.35, 0.9 + shelf * 0.2, 0);
          shoe.rotation.y = (Math.random() - 0.5) * 0.3;
          group.add(shoe);
        }
      }
      
      // Hanging shoe bags
      for (let i = 0; i < 3; i++) {
        const bag = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.4, 0.15),
          new THREE.MeshLambertMaterial({ color: 0x8a6a4a })
        );
        bag.position.set(-0.4 + i * 0.4, hasCanopy ? canopyHeight - 0.5 : 1.6, 0.3);
        group.add(bag);
      }
      
    } else {
      // FABRIC/TEXTILE STALL
      // Fabric rolls
      const fabricColors = [0xcc3366, 0x3366cc, 0xcccc33, 0x33cccc, 0xcc6633];
      for (let i = 0; i < 4; i++) {
        const roll = new THREE.Mesh(
          new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8),
          new THREE.MeshLambertMaterial({ color: fabricColors[i % fabricColors.length] ?? 0xcc3366 })
        );
        roll.rotation.z = Math.PI / 2;
        roll.position.set(-0.5 + i * 0.35, 0.95, 0);
        group.add(roll);
      }
      
      // Draped fabric
      const drape = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.8),
        new THREE.MeshLambertMaterial({ color: fabricColors[0] ?? 0xcc3366, side: THREE.DoubleSide })
      );
      drape.position.set(0, hasCanopy ? canopyHeight - 0.5 : 1.5, 0.5);
      drape.rotation.x = 0.3;
      group.add(drape);
    }
    
    // Folded clothes on table (always)
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const folded = new THREE.Mesh(
          new THREE.BoxGeometry(0.25 + Math.random() * 0.1, 0.08 + Math.random() * 0.04, 0.2),
          new THREE.MeshLambertMaterial({ color: clothColors[Math.floor(Math.random() * clothColors.length)] ?? 0x3366cc })
        );
        folded.position.set(-0.4 + col * 0.35, 0.85 + row * 0.1, -0.3);
        group.add(folded);
      }
    }
    
  } else if (type === 'drugs') {
    // Keep shady but add variety
    const drugsVariant = variant;
    
    if (drugsVariant === 0) {
      // PILL DEALER
      for (let i = 0; i < 8; i++) {
        const bottle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05 + Math.random() * 0.03, 0.05, 0.15 + Math.random() * 0.1, 6),
          new THREE.MeshLambertMaterial({ color: [0x885522, 0x553311, 0x224488, 0x448822][i % 4] ?? 0x885522 })
        );
        bottle.position.set(-0.5 + (i % 4) * 0.3, 0.88 + Math.floor(i / 4) * 0.18, 0);
        group.add(bottle);
      }
    } else if (drugsVariant === 1) {
      // PACKAGE DEALER
      for (let i = 0; i < 10; i++) {
        const pkg = new THREE.Mesh(
          new THREE.BoxGeometry(0.12 + Math.random() * 0.08, 0.08, 0.08 + Math.random() * 0.05),
          new THREE.MeshLambertMaterial({ color: [0x333333, 0x222222, 0x444444][i % 3] ?? 0x333333 })
        );
        pkg.position.set(-0.5 + (i % 5) * 0.25, 0.88 + Math.floor(i / 5) * 0.1, 0.1 * (i % 2));
        group.add(pkg);
      }
    } else {
      // HERBALIST (more traditional look)
      for (let i = 0; i < 5; i++) {
        const jar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.08, 0.2, 8),
          new THREE.MeshLambertMaterial({ color: 0x886644, transparent: true, opacity: 0.7 })
        );
        jar.position.set(-0.5 + i * 0.28, 0.95, 0);
        group.add(jar);
        
        // Contents
        const contents = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.06, 0.12, 8),
          new THREE.MeshLambertMaterial({ color: [0x336633, 0x553322, 0x663322, 0x225533, 0x443322][i] ?? 0x336633 })
        );
        contents.position.set(-0.5 + i * 0.28, 0.9, 0);
        group.add(contents);
      }
    }
    
    // Always have briefcase or bag
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.35 + Math.random() * 0.1, 0.2 + Math.random() * 0.1, 0.12),
      new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0x1a1a1a : 0x3a2a1a })
    );
    bag.position.set(0.7, 0.12, Math.random() * 0.3);
    group.add(bag);
    
    // Privacy element (curtain or boxes)
    if (Math.random() > 0.5) {
      const curtain = new THREE.Mesh(
        new THREE.PlaneGeometry(1.2 + Math.random() * 0.5, 1.3 + Math.random() * 0.3),
        new THREE.MeshLambertMaterial({ color: [0x222244, 0x442222, 0x224422][Math.floor(Math.random() * 3)] ?? 0x222244, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
      );
      curtain.position.set(-1.2, 1.1, 0);
      curtain.rotation.y = Math.PI / 2;
      group.add(curtain);
    }
    
    // Colored light
    const lightColor = [0xff2222, 0x22ff22, 0x2222ff][Math.floor(Math.random() * 3)] ?? 0xff2222;
    const colorLight = new THREE.PointLight(lightColor, 0.4, 3);
    colorLight.position.set(0, 1.3, 0);
    group.add(colorLight);
    
  } else if (type === 'electronics') {
    const elecVariant = variant;
    
    if (elecVariant === 0) {
      // TV/MONITOR REPAIR
      const numTVs = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numTVs; i++) {
        const tvSize = 0.3 + Math.random() * 0.15;
        const tv = new THREE.Mesh(
          new THREE.BoxGeometry(tvSize, tvSize * 0.8, tvSize * 0.9),
          new THREE.MeshLambertMaterial({ color: 0x333333 + Math.floor(Math.random() * 0x111111) })
        );
        tv.position.set(-0.5 + i * 0.5, 0.95 + (i % 2) * 0.2, 0);
        group.add(tv);
        
        // Screen (some on, some off)
        const isOn = Math.random() > 0.5;
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(tvSize * 0.7, tvSize * 0.55),
          new THREE.MeshBasicMaterial({ color: isOn ? [0x3366ff, 0x33ff66, 0xff6633][Math.floor(Math.random() * 3)] ?? 0x3366ff : 0x111111 })
        );
        screen.position.set(-0.5 + i * 0.5, 0.95 + (i % 2) * 0.2, tvSize * 0.45 + 0.01);
        group.add(screen);
      }
    } else if (elecVariant === 1) {
      // PHONE/GADGET STALL
      // Phone display
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 5; col++) {
          const phone = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.02, 0.15),
            new THREE.MeshLambertMaterial({ color: [0x111111, 0x222222, 0xcccccc, 0x886644][Math.floor(Math.random() * 4)] ?? 0x111111 })
          );
          phone.position.set(-0.5 + col * 0.25, 0.88 + row * 0.05, 0.1 - row * 0.25);
          group.add(phone);
        }
      }
      
      // Chargers/cables
      for (let i = 0; i < 4; i++) {
        const charger = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.04, 0.06),
          new THREE.MeshLambertMaterial({ color: 0x111111 })
        );
        charger.position.set(-0.3 + i * 0.22, 0.86, -0.4);
        group.add(charger);
      }
    } else {
      // PARTS/REPAIR STALL
      // Boxes of components
      for (let i = 0; i < 4; i++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.15, 0.25),
          new THREE.MeshLambertMaterial({ color: 0x8a7a6a })
        );
        box.position.set(-0.5 + i * 0.35, 0.92, 0);
        group.add(box);
        
        // Random components inside
        for (let c = 0; c < 3; c++) {
          const comp = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.04, 0.04),
            new THREE.MeshLambertMaterial({ color: [0x00ff00, 0xff0000, 0x0000ff, 0xffff00][Math.floor(Math.random() * 4)] ?? 0x00ff00 })
          );
          comp.position.set(-0.5 + i * 0.35 + (Math.random() - 0.5) * 0.15, 1.0, (Math.random() - 0.5) * 0.1);
          group.add(comp);
        }
      }
    }
    
    // Cables everywhere (always)
    const numCables = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numCables; i++) {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.5 + Math.random() * 0.5, 4),
        new THREE.MeshLambertMaterial({ color: [0x111111, 0x222222, 0x444444][Math.floor(Math.random() * 3)] ?? 0x111111 })
      );
      cable.position.set(-0.4 + Math.random() * 0.8, 0.85, -0.2 + Math.random() * 0.4);
      cable.rotation.set(Math.random() * 0.8, Math.random() * Math.PI, Math.random() * 0.8);
      group.add(cable);
    }
    
  } else if (type === 'trinkets') {
    const trinketVariant = variant;
    
    if (trinketVariant === 0) {
      // KNOCKOFF WATCHES/JEWELRY
      // Watch display
      const displayBoard = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x1a1a2a })
      );
      displayBoard.position.set(0, 1.1, 0.3);
      displayBoard.rotation.x = -0.3;
      group.add(displayBoard);
      
      // Watches
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const watch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8),
            new THREE.MeshLambertMaterial({ color: [0xffd700, 0xc0c0c0, 0x333333][Math.floor(Math.random() * 3)] ?? 0xffd700 })
          );
          watch.position.set(-0.25 + col * 0.18, 0.95 + row * 0.15, 0.3 - row * 0.05);
          watch.rotation.x = -0.3;
          group.add(watch);
        }
      }
      
    } else if (trinketVariant === 1) {
      // TOY STALL
      const toyColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
      
      // Various toys
      for (let i = 0; i < 8; i++) {
        const toyType = Math.floor(Math.random() * 3);
        let toy: THREE.Mesh;
        
        if (toyType === 0) {
          // Ball
          toy = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshLambertMaterial({ color: toyColors[Math.floor(Math.random() * toyColors.length)] ?? 0xff0000 })
          );
        } else if (toyType === 1) {
          // Car
          toy = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.08, 0.1),
            new THREE.MeshLambertMaterial({ color: toyColors[Math.floor(Math.random() * toyColors.length)] ?? 0xff0000 })
          );
        } else {
          // Figure
          toy = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.15, 6),
            new THREE.MeshLambertMaterial({ color: toyColors[Math.floor(Math.random() * toyColors.length)] ?? 0xff0000 })
          );
        }
        toy.position.set(-0.5 + (i % 4) * 0.3, 0.92 + Math.floor(i / 4) * 0.15, Math.random() * 0.3);
        group.add(toy);
      }
      
    } else {
      // SOUVENIR STALL
      // Mini figurines
      for (let i = 0; i < 6; i++) {
        const figurine = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.18, 0.06),
          new THREE.MeshLambertMaterial({ color: [0xffd700, 0xc41e3a, 0x228b22][Math.floor(Math.random() * 3)] ?? 0xffd700 })
        );
        figurine.position.set(-0.5 + i * 0.22, 0.94, 0.1);
        group.add(figurine);
      }
      
      // Postcards/pictures
      for (let i = 0; i < 4; i++) {
        const card = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.2, 0.01),
          new THREE.MeshLambertMaterial({ color: [0xffffff, 0xffffcc, 0xccffff, 0xffcccc][i] ?? 0xffffff })
        );
        card.position.set(-0.3 + i * 0.22, 0.9, -0.35);
        card.rotation.x = -0.5;
        group.add(card);
      }
    }
    
    // Hanging decorations (varied)
    const hangingTypes = Math.floor(Math.random() * 3);
    if (hangingTypes === 0) {
      // Lanterns
      for (let i = 0; i < 3; i++) {
        const lantern = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xff3333 })
        );
        lantern.scale.y = 1.3;
        lantern.position.set(-0.4 + i * 0.4, hasCanopy ? canopyHeight - 0.4 : 1.7, 0.4);
        group.add(lantern);
      }
    } else if (hangingTypes === 1) {
      // Wind chimes
      for (let i = 0; i < 5; i++) {
        const chime = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.2 + Math.random() * 0.1, 6),
          new THREE.MeshLambertMaterial({ color: 0xc0c0c0 })
        );
        chime.position.set(-0.3 + i * 0.18, hasCanopy ? canopyHeight - 0.4 : 1.6, 0.4);
        group.add(chime);
      }
    } else {
      // Flags/banners
      const flagColors = [0xff0000, 0xffff00, 0x0000ff];
      for (let i = 0; i < 3; i++) {
        const flag = new THREE.Mesh(
          new THREE.PlaneGeometry(0.25, 0.4),
          new THREE.MeshLambertMaterial({ color: flagColors[i] ?? 0xff0000, side: THREE.DoubleSide })
        );
        flag.position.set(-0.4 + i * 0.4, hasCanopy ? canopyHeight - 0.4 : 1.6, 0.5);
        group.add(flag);
      }
    }
  }
  
  // Create seller (person standing behind stall)
  const seller = createSellerMesh(type, variant);
  seller.position.set((Math.random() - 0.5) * 0.4, 0, -0.7 - Math.random() * 0.2);
  seller.rotation.y = Math.PI + (Math.random() - 0.5) * 0.4; // Face customer with slight variation
  group.add(seller);
  
  // Scale the whole stall
  group.scale.setScalar(stallScale);
  group.position.set(x, 0, z);
  
  // Random rotation to face alleyway
  group.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
  
  return group;
}

function createSellerMesh(type: ShopStall['type'], variant: number = 0): THREE.Group {
  const group = new THREE.Group();
  
  // Random seller characteristics
  const isOld = Math.random() > 0.7;
  const isFemale = Math.random() > 0.5;
  const isHeavy = Math.random() > 0.7;
  
  // Varied shirt colors based on shop type
  const shirtPalettes: Record<ShopStall['type'], number[]> = {
    food: [0xffffff, 0xeeeeee, 0xdddddd, 0xffffcc, 0xccffcc],
    clothes: [0x3355aa, 0x5533aa, 0xaa3355, 0x33aa55, 0x335555],
    drugs: [0x111111, 0x1a1a1a, 0x222222, 0x0a0a0a, 0x151515],
    electronics: [0x334455, 0x445566, 0x223344, 0x556677],
    trinkets: [0xcc6633, 0x33cc66, 0x6633cc, 0xcccc33, 0x33cccc]
  };
  const shirtColor = shirtPalettes[type][Math.floor(Math.random() * shirtPalettes[type].length)] ?? 0x334455;
  
  // Varied pants colors
  const pantsColors = [0x222233, 0x333322, 0x2a2a3a, 0x3a3a2a, 0x222222, 0x444444];
  const pantsColor = pantsColors[Math.floor(Math.random() * pantsColors.length)] ?? 0x222233;
  
  // Varied skin tones
  const skinColors = [0xeeddcc, 0xd4a574, 0x8d5524, 0x4a3728, 0xf5deb3, 0xc68642];
  const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)] ?? 0xeeddcc;
  
  // Varied hair colors
  const hairColors = [0x222211, 0x111111, 0x332211, 0x553322, 0x666655, 0x888877, 0xaaaaaa];
  const hairColor = isOld ? [0x888888, 0x999999, 0xaaaaaa][Math.floor(Math.random() * 3)] ?? 0x888888 : hairColors[Math.floor(Math.random() * hairColors.length)] ?? 0x222211;
  
  // Body scale based on characteristics
  const bodyWidth = isHeavy ? 0.5 : (isFemale ? 0.35 : 0.4);
  const bodyHeight = isOld ? 0.45 : 0.5;
  
  // Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth, bodyHeight, 0.25),
    new THREE.MeshLambertMaterial({ color: shirtColor })
  );
  torso.position.y = 0.75;
  group.add(torso);
  
  // Apron (for some sellers)
  const hasApron = (type === 'food' || (type === 'clothes' && Math.random() > 0.5));
  if (hasApron) {
    const apronColors = [0xffffff, 0xdddddd, 0x4444aa, 0xaa4444, 0x44aa44];
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth - 0.05, 0.4, 0.05),
      new THREE.MeshLambertMaterial({ color: apronColors[Math.floor(Math.random() * apronColors.length)] ?? 0xffffff })
    );
    apron.position.set(0, 0.65, 0.15);
    group.add(apron);
  }
  
  // Legs
  const legWidth = isHeavy ? 0.16 : 0.13;
  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(legWidth, 0.5, 0.16),
    new THREE.MeshLambertMaterial({ color: pantsColor })
  );
  leftLeg.position.set(-0.1, 0.25, 0);
  group.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(legWidth, 0.5, 0.16),
    new THREE.MeshLambertMaterial({ color: pantsColor })
  );
  rightLeg.position.set(0.1, 0.25, 0);
  group.add(rightLeg);
  
  // Head
  const headSize = isOld ? 0.3 : 0.32;
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(headSize, headSize, 0.28),
    new THREE.MeshLambertMaterial({ color: skinColor })
  );
  head.position.y = 1.2;
  group.add(head);
  
  // Hair/hat variety
  const headwearType = Math.floor(Math.random() * 5);
  
  if (type === 'food' && variant === 0 && Math.random() > 0.3) {
    // Chef hat
    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.2 + Math.random() * 0.1, 8),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    hat.position.y = 1.45;
    group.add(hat);
  } else if (type === 'food' && Math.random() > 0.5) {
    // Headband
    const headband = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.06, 0.3),
      new THREE.MeshLambertMaterial({ color: [0xff0000, 0xffffff, 0x0000ff][Math.floor(Math.random() * 3)] ?? 0xff0000 })
    );
    headband.position.y = 1.38;
    group.add(headband);
    
    // Hair under headband
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.08, 0.3),
      new THREE.MeshLambertMaterial({ color: hairColor })
    );
    hair.position.y = 1.43;
    group.add(hair);
  } else if (headwearType === 0 && type !== 'drugs') {
    // Cap
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.18, 0.1, 8),
      new THREE.MeshLambertMaterial({ color: [0x333333, 0x0000aa, 0xaa0000, 0x00aa00][Math.floor(Math.random() * 4)] ?? 0x333333 })
    );
    cap.position.y = 1.42;
    group.add(cap);
    
    // Cap brim
    const brim = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.02, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    brim.position.set(0, 1.38, 0.15);
    group.add(brim);
  } else if (headwearType === 1 && !isFemale) {
    // Bald/short hair
    const shortHair = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.05, 0.28),
      new THREE.MeshLambertMaterial({ color: hairColor })
    );
    shortHair.position.y = 1.38;
    group.add(shortHair);
  } else if (isFemale) {
    // Longer hair for female
    const longHair = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.25, 0.32),
      new THREE.MeshLambertMaterial({ color: hairColor })
    );
    longHair.position.y = 1.32;
    group.add(longHair);
    
    // Hair tie sometimes
    if (Math.random() > 0.5) {
      const tie = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.02, 6, 8),
        new THREE.MeshLambertMaterial({ color: [0xff0000, 0x0000ff, 0xff00ff, 0xffff00][Math.floor(Math.random() * 4)] ?? 0xff0000 })
      );
      tie.position.set(0, 1.25, -0.18);
      tie.rotation.x = Math.PI / 2;
      group.add(tie);
    }
  } else {
    // Regular hair
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.1 + Math.random() * 0.05, 0.3),
      new THREE.MeshLambertMaterial({ color: hairColor })
    );
    hair.position.y = 1.4 + Math.random() * 0.04;
    group.add(hair);
  }
  
  // Glasses for some sellers
  if (Math.random() > 0.75 || type === 'electronics') {
    const glassFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.06, 0.02),
      new THREE.MeshLambertMaterial({ color: 0x111111 })
    );
    glassFrame.position.set(0, 1.22, 0.14);
    group.add(glassFrame);
  }
  
  // Eyes
  const leftEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  leftEye.position.set(-0.08, 1.22, 0.14);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  rightEye.position.set(0.08, 1.22, 0.14);
  group.add(rightEye);
  
  // Arms (positioned as if working)
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.35, 0.1),
    new THREE.MeshLambertMaterial({ color: shirtColor })
  );
  leftArm.position.set(-0.28, 0.75, 0.1);
  leftArm.rotation.x = -0.3;
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.35, 0.1),
    new THREE.MeshLambertMaterial({ color: shirtColor })
  );
  rightArm.position.set(0.28, 0.75, 0.1);
  rightArm.rotation.x = -0.3;
  group.add(rightArm);
  
  // Hands
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 0.08),
    new THREE.MeshLambertMaterial({ color: skinColor })
  );
  leftHand.position.set(-0.28, 0.55, 0.2);
  group.add(leftHand);
  
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 0.08),
    new THREE.MeshLambertMaterial({ color: skinColor })
  );
  rightHand.position.set(0.28, 0.55, 0.2);
  group.add(rightHand);
  
  return group;
}

// Place shop stalls in alleyways between building rows
// Alleyways are between rows: z = -64, -52, -40, -28, -16, -4
const alleyZPositions = [-64, -52, -40, -28, -16, -4];
const shopTypes: ShopStall['type'][] = ['food', 'clothes', 'drugs', 'electronics', 'trinkets'];

alleyZPositions.forEach((alleyZ, rowIndex) => {
  // 2-3 stalls per alley row
  const numStalls = 2 + Math.floor(Math.random() * 2);
  const usedXPositions: number[] = [];
  
  for (let i = 0; i < numStalls; i++) {
    // Pick a random X position in the alley (between buildings)
    let xPos: number;
    let attempts = 0;
    do {
      // Alleyways are at x = -25, -15, -5, 5, 15, 25 (between 7-unit buildings at x = -30, -20, -10, 0, 10, 20, 30)
      const alleyXOptions = [-25, -15, -5, 5, 15, 25];
      xPos = alleyXOptions[Math.floor(Math.random() * alleyXOptions.length)] ?? -15;
      attempts++;
    } while (usedXPositions.includes(xPos) && attempts < 10);
    
    usedXPositions.push(xPos);
    
    // Pick shop type - ensure variety but weight food higher
    let type: ShopStall['type'];
    const rand = Math.random();
    if (rand < 0.35) type = 'food';
    else if (rand < 0.55) type = 'clothes';
    else if (rand < 0.70) type = 'electronics';
    else if (rand < 0.85) type = 'trinkets';
    else type = 'drugs'; // Rarer
    
    const stallGroup = createShopStall(xPos, alleyZ, type);
    outdoorScene.add(stallGroup);
    
    shopStalls.push({
      type,
      x: xPos,
      z: alleyZ,
      group: stallGroup,
      seller: stallGroup.children.find(c => c instanceof THREE.Group) as THREE.Group
    });
  }
});

// Function to update building transparency - simple distance-based for nearby buildings
function updateBuildingTransparency() {
  for (const mesh of allBuildingMeshes) {
    if (!mesh.material || Array.isArray(mesh.material)) continue;
    const mat = mesh.material as THREE.MeshLambertMaterial | THREE.MeshBasicMaterial;
    
    // Get mesh world position
    const meshPos = new THREE.Vector3();
    mesh.getWorldPosition(meshPos);
    
    // Simple: only fade buildings very close to player (within 4 units horizontally)
    const distX = Math.abs(meshPos.x - player.x);
    const distZ = Math.abs(meshPos.z - player.z);
    const horizDist = Math.sqrt(distX * distX + distZ * distZ);
    
    let targetOpacity = 1;
    
    // Only fade if building is close AND in front of player (positive Z relative to player)
    if (horizDist < 6 && meshPos.z > player.z - 2) {
      // Fade based on distance - closer = more transparent
      const fadeFactor = Math.max(0, 1 - horizDist / 6);
      targetOpacity = 1 - fadeFactor * 0.7;
      targetOpacity = Math.max(0.3, targetOpacity);
    }
    
    // Smooth transition
    mat.opacity = mat.opacity + (targetOpacity - mat.opacity) * 0.15;
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
  type: 'person' | 'fox' | 'monkey' | 'squirrel' | 'mouse' | 'dog';
  indoor: boolean;
  buildingIdx: number;
  floorIdx: number;
  // Shapeshifter fox properties (kitsune)
  isShapeshifter?: boolean;
  isTransformed?: boolean;
  transformTimer?: number;
  shakeTimer?: number;
  originalMesh?: THREE.Group;
}

const outdoorNPCs: NPC[] = [];
const indoorNPCs: NPC[] = [];

// Create a person mesh - same style as player character
function createPersonMesh(): THREE.Group {
  const group = new THREE.Group();
  
  // Random clothing colors
  const shirtColors = [0x334455, 0x553333, 0x335533, 0x555533, 0x443355, 0x335555, 0x554433, 0x3355aa, 0xaa3355];
  const pantsColors = [0x222233, 0x333322, 0x332222, 0x111111, 0x2a2a3a];
  const skinColors = [0xeeddcc, 0xd4a574, 0x8d5524, 0x4a3728];
  const hairColors = [0x332211, 0x111111, 0x664422, 0xffdd88, 0x553322];
  
  const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)] ?? 0x334455;
  const pantsColor = pantsColors[Math.floor(Math.random() * pantsColors.length)] ?? 0x222233;
  const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)] ?? 0xeeddcc;
  const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)] ?? 0x332211;
  
  // Torso (box shape like player)
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.5, 0.25),
    new THREE.MeshLambertMaterial({ color: shirtColor })
  );
  torso.position.y = 0.75;
  group.add(torso);
  
  // Left leg
  const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.5, 0.16),
    new THREE.MeshLambertMaterial({ color: pantsColor })
  );
  leftLeg.position.set(-0.1, 0.25, 0);
  group.add(leftLeg);
  
  // Right leg
  const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.5, 0.16),
    new THREE.MeshLambertMaterial({ color: pantsColor })
  );
  rightLeg.position.set(0.1, 0.25, 0);
  group.add(rightLeg);
  
  // Head (box shape)
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.32, 0.28),
    new THREE.MeshLambertMaterial({ color: skinColor })
  );
  head.position.y = 1.2;
  group.add(head);
  
  // Hair
  const hair = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.12, 0.3),
    new THREE.MeshLambertMaterial({ color: hairColor })
  );
  hair.position.y = 1.42;
  group.add(hair);
  
  // Eyes
  const leftEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  leftEye.position.set(-0.08, 1.22, 0.14);
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  rightEye.position.set(0.08, 1.22, 0.14);
  group.add(rightEye);
  
  // Left arm
  const leftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.4, 0.1),
    new THREE.MeshLambertMaterial({ color: shirtColor })
  );
  leftArm.position.set(-0.28, 0.7, 0);
  group.add(leftArm);
  
  // Right arm
  const rightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.4, 0.1),
    new THREE.MeshLambertMaterial({ color: shirtColor })
  );
  rightArm.position.set(0.28, 0.7, 0);
  group.add(rightArm);
  
  // Hands
  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 0.08),
    new THREE.MeshLambertMaterial({ color: skinColor })
  );
  leftHand.position.set(-0.28, 0.45, 0);
  group.add(leftHand);
  
  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.1, 0.08),
    new THREE.MeshLambertMaterial({ color: skinColor })
  );
  rightHand.position.set(0.28, 0.45, 0);
  group.add(rightHand);
  
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

// Create a dog mesh
function createDogMesh(): THREE.Group {
  const group = new THREE.Group();
  
  // Random dog colors
  const dogColors = [
    { body: 0x8B4513, belly: 0xD2B48C }, // Brown
    { body: 0x111111, belly: 0x333333 }, // Black
    { body: 0xFFFFFF, belly: 0xEEEEEE }, // White
    { body: 0xD2691E, belly: 0xF5DEB3 }, // Tan
    { body: 0x808080, belly: 0xA9A9A9 }, // Gray
    { body: 0xA0522D, belly: 0xDEB887 }, // Sienna
  ];
  const colorIdx = Math.floor(Math.random() * dogColors.length);
  const colorScheme = dogColors[colorIdx] ?? { body: 0x8B4513, belly: 0xD2B48C };
  
  // Body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.25, 0.5),
    new THREE.MeshLambertMaterial({ color: colorScheme.body })
  );
  body.position.set(0, 0.3, 0);
  group.add(body);
  
  // Belly
  const belly = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.15, 0.4),
    new THREE.MeshLambertMaterial({ color: colorScheme.belly })
  );
  belly.position.set(0, 0.22, 0);
  group.add(belly);
  
  // Head
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.22, 0.25),
    new THREE.MeshLambertMaterial({ color: colorScheme.body })
  );
  head.position.set(0, 0.4, 0.3);
  group.add(head);
  
  // Snout
  const snout = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.1, 0.15),
    new THREE.MeshLambertMaterial({ color: colorScheme.belly })
  );
  snout.position.set(0, 0.35, 0.45);
  group.add(snout);
  
  // Nose
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.05, 0.03),
    new THREE.MeshLambertMaterial({ color: 0x111111 })
  );
  nose.position.set(0, 0.38, 0.52);
  group.add(nose);
  
  // Eyes
  for (let side = -1; side <= 1; side += 2) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    eye.position.set(side * 0.07, 0.45, 0.4);
    group.add(eye);
  }
  
  // Ears (floppy)
  for (let side = -1; side <= 1; side += 2) {
    const ear = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.15, 0.06),
      new THREE.MeshLambertMaterial({ color: colorScheme.body })
    );
    ear.position.set(side * 0.12, 0.42, 0.25);
    ear.rotation.z = side * 0.3;
    group.add(ear);
  }
  
  // Legs
  for (let lx = -1; lx <= 1; lx += 2) {
    for (let lz = -1; lz <= 1; lz += 2) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.2, 0.08),
        new THREE.MeshLambertMaterial({ color: colorScheme.body })
      );
      leg.position.set(lx * 0.12, 0.1, lz * 0.18);
      group.add(leg);
    }
  }
  
  // Tail (wagging up)
  const tail = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.18, 0.06),
    new THREE.MeshLambertMaterial({ color: colorScheme.body })
  );
  tail.position.set(0, 0.4, -0.28);
  tail.rotation.x = -0.5;
  group.add(tail);
  
  return group;
}

// Spawn outdoor NPCs
function spawnOutdoorNPCs() {
  // Spawn various NPCs in the city - increased counts
  // 41 people, 10 dogs, 11 foxes, 8 monkeys, 13 squirrels, 26 mice = 109 total
  const npcTypes: { type: NPC['type']; count: number; speed: number }[] = [
    { type: 'person', count: 41, speed: 0.04 },
    { type: 'dog', count: 10, speed: 0.07 },
    { type: 'fox', count: 11, speed: 0.08 },
    { type: 'monkey', count: 8, speed: 0.06 },
    { type: 'squirrel', count: 13, speed: 0.1 },
    { type: 'mouse', count: 26, speed: 0.12 },
  ];
  
  for (const npcDef of npcTypes) {
    for (let i = 0; i < npcDef.count; i++) {
      let mesh: THREE.Group;
      switch (npcDef.type) {
        case 'fox': mesh = createFoxMesh(); break;
        case 'monkey': mesh = createMonkeyMesh(); break;
        case 'squirrel': mesh = createSquirrelMesh(); break;
        case 'mouse': mesh = createMouseMesh(); break;
        case 'dog': mesh = createDogMesh(); break;
        default: mesh = createPersonMesh();
      }
      
      // Random position in alleyways
      const x = -35 + Math.random() * 70;
      const z = -70 + Math.random() * 75;
      
      mesh.position.set(x, 0, z);
      outdoorScene.add(mesh);
      
      const npcData: NPC = {
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
      };
      
      // Some foxes are shapeshifters (kitsune) - 40% chance
      if (npcDef.type === 'fox' && Math.random() < 0.4) {
        npcData.isShapeshifter = true;
        npcData.isTransformed = false;
        npcData.transformTimer = Date.now() + 5000 + Math.random() * 15000; // First transform in 5-20 seconds
        npcData.shakeTimer = 0;
      }
      
      outdoorNPCs.push(npcData);
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
  
  // Spawn 8-14 NPCs per floor (mix of types) - 30% more
  const count = 8 + Math.floor(Math.random() * 7); // 8-14 NPCs per floor
  for (let i = 0; i < count; i++) {
    // Random type selection - more people and dogs indoors
    const roll = Math.random();
    let type: NPC['type'];
    let mesh: THREE.Group;
    let speed: number;
    
    if (roll < 0.45) {
      type = 'person'; mesh = createPersonMesh(); speed = 0.03;
    } else if (roll < 0.60) {
      type = 'dog'; mesh = createDogMesh(); speed = 0.04;
    } else if (roll < 0.70) {
      type = 'fox'; mesh = createFoxMesh(); speed = 0.05;
    } else if (roll < 0.78) {
      type = 'monkey'; mesh = createMonkeyMesh(); speed = 0.045;
    } else if (roll < 0.90) {
      type = 'squirrel'; mesh = createSquirrelMesh(); speed = 0.07;
    } else {
      type = 'mouse'; mesh = createMouseMesh(); speed = 0.08;
    }
    
    // Random position on floor (avoiding edges)
    const x = -floorW/2 + 3 + Math.random() * (floorW - 6);
    const z = -floorD/2 + 3 + Math.random() * (floorD - 6);
    
    mesh.position.set(x, 0, z);
    indoorScene.add(mesh);
    
    const npcData: NPC = {
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
    };
    
    // Some foxes are shapeshifters (kitsune) - 40% chance
    if (type === 'fox' && Math.random() < 0.4) {
      npcData.isShapeshifter = true;
      npcData.isTransformed = false;
      npcData.transformTimer = Date.now() + 5000 + Math.random() * 15000;
      npcData.shakeTimer = 0;
    }
    
    indoorNPCs.push(npcData);
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
        // Left side rooms
        { x: -hw + 5, z: -hd + 5, w: 6, d: 5, door: 'right' },
        { x: -hw + 5, z: -hd + 11, w: 6, d: 5, door: 'right' },
        { x: -hw + 5, z: -hd + 17, w: 6, d: 5, door: 'right' },
        { x: -hw + 5, z: hd - 10, w: 6, d: 5, door: 'right' },
        // Right side rooms
        { x: hw - 5, z: hd - 5, w: 6, d: 5, door: 'left' },
        { x: hw - 5, z: hd - 11, w: 6, d: 5, door: 'left' },
        { x: hw - 5, z: 0, w: 6, d: 5, door: 'left' },
        // Back wall rooms
        { x: -15, z: -hd + 4.5, w: 6, d: 5, door: 'front' },
        { x: -7, z: -hd + 4.5, w: 6, d: 5, door: 'front' },
        // Center rooms
        { x: -13, z: 0, w: 5, d: 4, door: 'right' },
        { x: -13, z: 6, w: 5, d: 4, door: 'right' },
        { x: 5, z: hd - 8, w: 5, d: 4, door: 'left' },
        { x: 5, z: 0, w: 5, d: 4, door: 'left' },
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
    
    // ========== SHAPESHIFTER FOX (KITSUNE) TRANSFORMATION ==========
    if (npc.isShapeshifter && npc.transformTimer) {
      const now = Date.now();
      
      // Check if it's time to start shaking
      if (now >= npc.transformTimer && !npc.shakeTimer) {
        npc.shakeTimer = now;
      }
      
      // Shaking animation (lasts 1.5 seconds)
      if (npc.shakeTimer && now - npc.shakeTimer < 1500) {
        const shakeIntensity = Math.sin((now - npc.shakeTimer) / 30) * 0.15;
        npc.mesh.position.x = npc.x + shakeIntensity;
        npc.mesh.rotation.z = shakeIntensity * 0.5;
        
        // Add some particles/glow effect - scale pulsing
        const pulse = 1 + Math.sin((now - npc.shakeTimer) / 50) * 0.1;
        npc.mesh.scale.setScalar(pulse);
      }
      // Transform after shaking
      else if (npc.shakeTimer && now - npc.shakeTimer >= 1500) {
        // Reset shake
        npc.mesh.scale.setScalar(1);
        npc.mesh.rotation.z = 0;
        
        // Get the correct scene
        const currentScene = npc.indoor ? indoorScene : outdoorScene;
        
        if (!npc.isTransformed) {
          // Transform fox -> human
          npc.originalMesh = npc.mesh;
          currentScene.remove(npc.mesh);
          
          const humanMesh = createPersonMesh();
          humanMesh.position.set(npc.x, 0, npc.z);
          humanMesh.rotation.y = npc.mesh.rotation.y;
          currentScene.add(humanMesh);
          npc.mesh = humanMesh;
          npc.isTransformed = true;
          npc.speed = 0.04; // Human speed
          
          // Stay human for 3-8 seconds
          npc.transformTimer = now + 3000 + Math.random() * 5000;
        } else {
          // Transform human -> fox
          currentScene.remove(npc.mesh);
          
          const foxMesh = createFoxMesh();
          foxMesh.position.set(npc.x, 0, npc.z);
          foxMesh.rotation.y = npc.mesh.rotation.y;
          currentScene.add(foxMesh);
          npc.mesh = foxMesh;
          npc.isTransformed = false;
          npc.speed = 0.08; // Fox speed
          
          // Next transformation in 10-30 seconds
          npc.transformTimer = now + 10000 + Math.random() * 20000;
        }
        
        npc.shakeTimer = 0;
      }
    }
    
    // Simple walk animation (bobbing) - different speeds for different animals
    if (dist > 0.5) {
      let bobSpeed = 150; // default for person
      let bobHeight = 0.08;
      // Use current form for shapeshifters
      const actualType = (npc.isShapeshifter && npc.isTransformed) ? 'person' : npc.type;
      switch (actualType) {
        case 'dog': bobSpeed = 90; bobHeight = 0.1; break;
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
      
      // Wall lamp - 95% of lobby rooms have a warm orange wall lamp
      if (Math.random() < 0.95) {
        const lampColor = 0xff8833;
        
        // Lamp on wall away from door
        let lampX = x, lampZ = z;
        if (doorSide === 'left') lampX = x + rw/2 - 0.5;
        else if (doorSide === 'right') lampX = x - rw/2 + 0.5;
        else if (doorSide === 'front') lampZ = z - rd/2 + 0.5;
        else lampZ = z + rd/2 - 0.5;
        
        // Lamp fixture
        const bracket = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.1, 0.1),
          new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        bracket.position.set(lampX, 2.2, lampZ);
        group.add(bracket);
        
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6),
          new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        arm.rotation.z = Math.PI / 4;
        arm.position.set(lampX, 2.1, lampZ);
        group.add(arm);
        
        const shade = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.2, 8, 1, true),
          new THREE.MeshLambertMaterial({ color: 0x885522, side: THREE.DoubleSide })
        );
        shade.rotation.x = Math.PI;
        shade.position.set(lampX, 1.95, lampZ);
        group.add(shade);
        
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshBasicMaterial({ color: lampColor })
        );
        bulb.position.set(lampX, 1.9, lampZ);
        group.add(bulb);
        
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 8, 8),
          new THREE.MeshBasicMaterial({ color: lampColor, transparent: true, opacity: 0.2 })
        );
        glow.position.set(lampX, 1.9, lampZ);
        group.add(glow);
        
        const light = new THREE.PointLight(lampColor, 0.8, 8);
        light.position.set(lampX, 1.9, lampZ);
        group.add(light);
      }
    }
    
    // Left side rooms (4 rooms, avoiding exit area at front)
    createLobbyRoom(-w/2 + 5, -d/2 + 5, 6, 5, 'right', 0);
    createLobbyRoom(-w/2 + 5, -d/2 + 11, 6, 5, 'right', 1);
    createLobbyRoom(-w/2 + 5, -d/2 + 17, 6, 5, 'right', 2);
    createLobbyRoom(-w/2 + 5, d/2 - 10, 6, 5, 'right', 3);

    // Right side rooms (3 rooms, leaving space for stairs at back corner)
    createLobbyRoom(w/2 - 5, d/2 - 5, 6, 5, 'left', 4);
    createLobbyRoom(w/2 - 5, d/2 - 11, 6, 5, 'left', 5);
    createLobbyRoom(w/2 - 5, 0, 6, 5, 'left', 6);

    // Back wall rooms (left side only - stairs on back-right)
    createLobbyRoom(-15, -d/2 + 4.5, 6, 5, 'front', 7);
    createLobbyRoom(-7, -d/2 + 4.5, 6, 5, 'front', 8);
    
    // Center-left area rooms (more cramped feel)
    createLobbyRoom(-13, 0, 5, 4, 'right', 9);
    createLobbyRoom(-13, 6, 5, 4, 'right', 10);
    
    // Additional rooms near center-right (but away from stairs which are at back-right)
    createLobbyRoom(5, d/2 - 8, 5, 4, 'left', 11);
    createLobbyRoom(5, 0, 5, 4, 'left', 12);

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
      
      // Wall lamp - 95% of rooms have a warm orange wall lamp
      if (Math.random() < 0.95) {
        // Orange/warm lamp color
        const lampColor = 0xff8833;
        const intensity = 0.8;
        
        // Wall lamp position - on wall opposite the door, not on bed
        const lampWallX = rotated ? x : (x + (Math.random() > 0.5 ? 2 : -2));
        const lampWallZ = rotated ? (z + (Math.random() > 0.5 ? 2 : -2)) : z;
        
        // Lamp fixture (wall mount bracket)
        const bracket = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.1, 0.1),
          new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        bracket.position.set(lampWallX, 2.2, lampWallZ);
        group.add(bracket);
        
        // Lamp arm
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6),
          new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        arm.rotation.z = Math.PI / 4;
        arm.position.set(lampWallX, 2.1, lampWallZ);
        group.add(arm);
        
        // Lamp shade (conical)
        const shade = new THREE.Mesh(
          new THREE.ConeGeometry(0.18, 0.2, 8, 1, true),
          new THREE.MeshLambertMaterial({ color: 0x885522, side: THREE.DoubleSide })
        );
        shade.rotation.x = Math.PI;
        shade.position.set(lampWallX, 1.95, lampWallZ);
        group.add(shade);
        
        // Glowing bulb inside shade
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 8, 8),
          new THREE.MeshBasicMaterial({ color: lampColor })
        );
        bulb.position.set(lampWallX, 1.9, lampWallZ);
        group.add(bulb);
        
        // Orange glow effect around lamp
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.25, 8, 8),
          new THREE.MeshBasicMaterial({ color: lampColor, transparent: true, opacity: 0.2 })
        );
        glow.position.set(lampWallX, 1.9, lampWallZ);
        group.add(glow);
        
        // Point light for illumination
        const light = new THREE.PointLight(lampColor, intensity, 8);
        light.position.set(lampWallX, 1.9, lampWallZ);
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
// PLAYER - Better looking character with flashlight
// ============================================
const playerGroup = new THREE.Group();

// Character customization options (will be set from menu)
const playerConfig = {
  skinColor: 0xeeddcc,
  shirtColor: 0x334455,
  pantsColor: 0x222233,
  hairColor: 0x332211,
  hairStyle: 'short' as 'short' | 'long' | 'bald' | 'spiky',
};

// Body (torso)
const torso = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.6, 0.3),
  new THREE.MeshLambertMaterial({ color: playerConfig.shirtColor })
);
torso.position.y = 0.9;
playerGroup.add(torso);

// Legs
const leftLeg = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 0.6, 0.2),
  new THREE.MeshLambertMaterial({ color: playerConfig.pantsColor })
);
leftLeg.position.set(-0.12, 0.3, 0);
playerGroup.add(leftLeg);

const rightLeg = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 0.6, 0.2),
  new THREE.MeshLambertMaterial({ color: playerConfig.pantsColor })
);
rightLeg.position.set(0.12, 0.3, 0);
playerGroup.add(rightLeg);

// Head
const head = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 0.4, 0.35),
  new THREE.MeshLambertMaterial({ color: playerConfig.skinColor })
);
head.position.y = 1.45;
playerGroup.add(head);

// Hair (on top of head)
const hair = new THREE.Mesh(
  new THREE.BoxGeometry(0.42, 0.15, 0.37),
  new THREE.MeshLambertMaterial({ color: playerConfig.hairColor })
);
hair.position.y = 1.72;
playerGroup.add(hair);

// Eyes
const leftEye = new THREE.Mesh(
  new THREE.SphereGeometry(0.05, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0x111111 })
);
leftEye.position.set(-0.1, 1.5, 0.17);
playerGroup.add(leftEye);

const rightEye = new THREE.Mesh(
  new THREE.SphereGeometry(0.05, 8, 8),
  new THREE.MeshBasicMaterial({ color: 0x111111 })
);
rightEye.position.set(0.1, 1.5, 0.17);
playerGroup.add(rightEye);

// Left arm (down at side)
const leftArm = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.5, 0.12),
  new THREE.MeshLambertMaterial({ color: playerConfig.shirtColor })
);
leftArm.position.set(-0.35, 0.85, 0);
playerGroup.add(leftArm);

// Left hand
const leftHand = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 0.12, 0.1),
  new THREE.MeshLambertMaterial({ color: playerConfig.skinColor })
);
leftHand.position.set(-0.35, 0.55, 0);
playerGroup.add(leftHand);

// Right arm (holding flashlight, angled forward)
const rightArmGroup = new THREE.Group();
rightArmGroup.position.set(0.35, 0.9, 0);

const rightArm = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.45, 0.12),
  new THREE.MeshLambertMaterial({ color: playerConfig.shirtColor })
);
rightArm.position.set(0, -0.15, 0.1);
rightArm.rotation.x = -0.4; // Angled forward
rightArmGroup.add(rightArm);

// Right hand (holding flashlight)
const rightHand = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.14, 0.12),
  new THREE.MeshLambertMaterial({ color: playerConfig.skinColor })
);
rightHand.position.set(0, -0.35, 0.25);
rightArmGroup.add(rightHand);

// Flashlight body (held in right hand)
const flashlightBody = new THREE.Mesh(
  new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8),
  new THREE.MeshLambertMaterial({ color: 0x333333 })
);
flashlightBody.rotation.x = Math.PI / 2;
flashlightBody.position.set(0, -0.35, 0.45);
rightArmGroup.add(flashlightBody);

// Flashlight lens (glowing front)
const flashlightLens = new THREE.Mesh(
  new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8),
  new THREE.MeshBasicMaterial({ color: 0xffffdd })
);
flashlightLens.rotation.x = Math.PI / 2;
flashlightLens.position.set(0, -0.35, 0.65);
rightArmGroup.add(flashlightLens);

// Flashlight grip texture
const flashlightGrip = new THREE.Mesh(
  new THREE.CylinderGeometry(0.065, 0.065, 0.15, 8),
  new THREE.MeshLambertMaterial({ color: 0x222222 })
);
flashlightGrip.rotation.x = Math.PI / 2;
flashlightGrip.position.set(0, -0.35, 0.35);
rightArmGroup.add(flashlightGrip);

playerGroup.add(rightArmGroup);

// Direction indicator (small, subtle)
const dir = new THREE.Mesh(
  new THREE.ConeGeometry(0.08, 0.2, 4),
  new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.6 })
);
dir.position.set(0, 0.05, 0.5);
dir.rotation.x = Math.PI / 2;
playerGroup.add(dir);

// Actual spotlight from flashlight - positioned at flashlight lens
const flash = new THREE.SpotLight(0xffffee, 8, 30, Math.PI / 5, 0.3, 1);
flash.position.set(0.35, 0.55, 0.65); // At the flashlight lens position
// Target is straight ahead in local space (positive Z is forward)
flash.target.position.set(0, 0.5, 15);
playerGroup.add(flash);
playerGroup.add(flash.target);

// Subtle player glow
const playerLight = new THREE.PointLight(0xffffee, 0.5, 4);
playerLight.position.set(0.35, 0.6, 0.6);
playerGroup.add(playerLight);

// Player starts in alleyway area (south of city)
playerGroup.position.set(0, 0.1, 0);
outdoorScene.add(playerGroup);

const player = { x: 0, z: 0, facing: 0, speed: 0.32 };

// Function to update player colors (for customization)
function updatePlayerAppearance() {
  (torso.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.shirtColor);
  (leftLeg.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.pantsColor);
  (rightLeg.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.pantsColor);
  (head.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.skinColor);
  (hair.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.hairColor);
  (leftArm.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.shirtColor);
  (leftHand.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.skinColor);
  (rightArm.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.shirtColor);
  (rightHand.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.skinColor);
}

// ============================================
// CHARACTER CUSTOMIZATION WITH PREVIEW
// ============================================

// Preview scene for character customization
let previewScene: THREE.Scene | null = null;
let previewCamera: THREE.PerspectiveCamera | null = null;
let previewRenderer: THREE.WebGLRenderer | null = null;
let previewCharacter: THREE.Group | null = null;
let previewAnimating = false;

function createPreviewCharacter(): THREE.Group {
  const group = new THREE.Group();
  
  // Torso
  const prevTorso = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.6, 0.3),
    new THREE.MeshLambertMaterial({ color: playerConfig.shirtColor })
  );
  prevTorso.position.y = 0.9;
  prevTorso.name = 'torso';
  group.add(prevTorso);
  
  // Legs
  const prevLeftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.6, 0.2),
    new THREE.MeshLambertMaterial({ color: playerConfig.pantsColor })
  );
  prevLeftLeg.position.set(-0.12, 0.3, 0);
  prevLeftLeg.name = 'leftLeg';
  group.add(prevLeftLeg);
  
  const prevRightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.6, 0.2),
    new THREE.MeshLambertMaterial({ color: playerConfig.pantsColor })
  );
  prevRightLeg.position.set(0.12, 0.3, 0);
  prevRightLeg.name = 'rightLeg';
  group.add(prevRightLeg);
  
  // Head
  const prevHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.35),
    new THREE.MeshLambertMaterial({ color: playerConfig.skinColor })
  );
  prevHead.position.y = 1.45;
  prevHead.name = 'head';
  group.add(prevHead);
  
  // Hair
  const prevHair = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.15, 0.37),
    new THREE.MeshLambertMaterial({ color: playerConfig.hairColor })
  );
  prevHair.position.y = 1.72;
  prevHair.name = 'hair';
  group.add(prevHair);
  
  // Eyes
  const prevLeftEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  prevLeftEye.position.set(-0.1, 1.5, 0.17);
  group.add(prevLeftEye);
  
  const prevRightEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  prevRightEye.position.set(0.1, 1.5, 0.17);
  group.add(prevRightEye);
  
  // Left arm
  const prevLeftArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.5, 0.12),
    new THREE.MeshLambertMaterial({ color: playerConfig.shirtColor })
  );
  prevLeftArm.position.set(-0.35, 0.85, 0);
  prevLeftArm.name = 'leftArm';
  group.add(prevLeftArm);
  
  // Left hand
  const prevLeftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.12, 0.1),
    new THREE.MeshLambertMaterial({ color: playerConfig.skinColor })
  );
  prevLeftHand.position.set(-0.35, 0.55, 0);
  prevLeftHand.name = 'leftHand';
  group.add(prevLeftHand);
  
  // Right arm group (holding flashlight)
  const prevRightArmGroup = new THREE.Group();
  prevRightArmGroup.position.set(0.35, 0.9, 0);
  
  const prevRightArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.45, 0.12),
    new THREE.MeshLambertMaterial({ color: playerConfig.shirtColor })
  );
  prevRightArm.position.set(0, -0.15, 0.1);
  prevRightArm.rotation.x = -0.4;
  prevRightArm.name = 'rightArm';
  prevRightArmGroup.add(prevRightArm);
  
  const prevRightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.14, 0.12),
    new THREE.MeshLambertMaterial({ color: playerConfig.skinColor })
  );
  prevRightHand.position.set(0, -0.35, 0.25);
  prevRightHand.name = 'rightHand';
  prevRightArmGroup.add(prevRightHand);
  
  // Flashlight
  const prevFlashlightBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.35, 8),
    new THREE.MeshLambertMaterial({ color: 0x333333 })
  );
  prevFlashlightBody.rotation.x = Math.PI / 2;
  prevFlashlightBody.position.set(0, -0.35, 0.45);
  prevRightArmGroup.add(prevFlashlightBody);
  
  const prevFlashlightLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.07, 0.05, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffdd })
  );
  prevFlashlightLens.rotation.x = Math.PI / 2;
  prevFlashlightLens.position.set(0, -0.35, 0.65);
  prevRightArmGroup.add(prevFlashlightLens);
  
  // Flashlight beam (cone)
  const prevBeam = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 1.5, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.15 })
  );
  prevBeam.rotation.x = -Math.PI / 2;
  prevBeam.position.set(0, -0.35, 1.4);
  prevRightArmGroup.add(prevBeam);
  
  group.add(prevRightArmGroup);
  
  return group;
}

function updatePreviewCharacter() {
  if (!previewCharacter) return;
  
  previewCharacter.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name) {
      const mat = child.material as THREE.MeshLambertMaterial;
      switch (child.name) {
        case 'torso':
        case 'leftArm':
        case 'rightArm':
          mat.color.setHex(playerConfig.shirtColor);
          break;
        case 'leftLeg':
        case 'rightLeg':
          mat.color.setHex(playerConfig.pantsColor);
          break;
        case 'head':
        case 'leftHand':
        case 'rightHand':
          mat.color.setHex(playerConfig.skinColor);
          break;
        case 'hair':
          mat.color.setHex(playerConfig.hairColor);
          break;
      }
    }
  });
}

function initPreviewScene() {
  const canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  
  previewScene = new THREE.Scene();
  previewScene.background = new THREE.Color(0x0a0a15);
  
  previewCamera = new THREE.PerspectiveCamera(45, 200 / 280, 0.1, 100);
  previewCamera.position.set(0, 1.2, 4);
  previewCamera.lookAt(0, 0.9, 0);
  
  previewRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  previewRenderer.setSize(200, 280);
  previewRenderer.setPixelRatio(1);
  
  // Lighting
  const ambient = new THREE.AmbientLight(0x404050, 0.8);
  previewScene.add(ambient);
  
  const frontLight = new THREE.DirectionalLight(0xffffff, 1);
  frontLight.position.set(2, 3, 4);
  previewScene.add(frontLight);
  
  const backLight = new THREE.DirectionalLight(0x4488ff, 0.5);
  backLight.position.set(-2, 2, -3);
  previewScene.add(backLight);
  
  // Flashlight glow
  const flashGlow = new THREE.PointLight(0xffffaa, 0.8, 5);
  flashGlow.position.set(0.5, 0.8, 1);
  previewScene.add(flashGlow);
  
  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    new THREE.MeshLambertMaterial({ color: 0x1a1a2a })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  previewScene.add(floor);
  
  // Character
  previewCharacter = createPreviewCharacter();
  previewScene.add(previewCharacter);
}

function animatePreview() {
  if (!previewAnimating || !previewScene || !previewCamera || !previewRenderer || !previewCharacter) return;
  
  requestAnimationFrame(animatePreview);
  
  // Slow spin
  previewCharacter.rotation.y += 0.01;
  
  previewRenderer.render(previewScene, previewCamera);
}

function setupCustomization() {
  const customizePopup = document.getElementById('customize-popup');
  const customizeBtn = document.getElementById('customize-btn');
  const doneBtn = document.getElementById('customize-done');
  
  // Open customize popup
  customizeBtn?.addEventListener('click', () => {
    customizePopup?.classList.add('visible');
    
    // Initialize preview scene if not already
    if (!previewScene) {
      initPreviewScene();
    }
    
    // Start animation
    previewAnimating = true;
    animatePreview();
  });
  
  // Close customize popup
  doneBtn?.addEventListener('click', () => {
    customizePopup?.classList.remove('visible');
    previewAnimating = false;
  });
  
  // Skin color options
  const skinOptions = document.querySelectorAll('#skin-options .color-btn');
  skinOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      skinOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const color = parseInt((btn as HTMLElement).dataset.color || '0xeeddcc');
      playerConfig.skinColor = color;
      updatePlayerAppearance();
      updatePreviewCharacter();
    });
  });

  // Hair color options
  const hairOptions = document.querySelectorAll('#hair-options .color-btn');
  hairOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      hairOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const color = parseInt((btn as HTMLElement).dataset.color || '0x332211');
      playerConfig.hairColor = color;
      updatePlayerAppearance();
      updatePreviewCharacter();
    });
  });

  // Shirt color options
  const shirtOptions = document.querySelectorAll('#shirt-options .color-btn');
  shirtOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      shirtOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const color = parseInt((btn as HTMLElement).dataset.color || '0x334455');
      playerConfig.shirtColor = color;
      updatePlayerAppearance();
      updatePreviewCharacter();
    });
  });

  // Pants color options
  const pantsOptions = document.querySelectorAll('#pants-options .color-btn');
  pantsOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      pantsOptions.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const color = parseInt((btn as HTMLElement).dataset.color || '0x222233');
      playerConfig.pantsColor = color;
      updatePlayerAppearance();
      updatePreviewCharacter();
    });
  });

  // Start button
  const startBtn = document.getElementById('start-btn');
  startBtn?.addEventListener('click', () => {
    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.classList.add('hidden');
      started = true;
    }
    // Stop preview if running
    previewAnimating = false;
    customizePopup?.classList.remove('visible');
  });
}

// Initialize customization on load
setupCustomization();

// ============================================
// INPUT
// ============================================
const keys = { left: false, right: false, up: false, down: false, action: false, actionPressed: false };

window.addEventListener('keydown', e => {
  // Only process game keys if started
  if (!started) {
    // Allow Enter/Space to start game from menu
    if (e.code === 'Enter' || e.code === 'Space') {
      const instructions = document.getElementById('instructions');
      if (instructions) {
        instructions.classList.add('hidden');
        started = true;
      }
    }
    return;
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

// Click handlers removed - using start button instead
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
    // Convert game facing to minimap: north (π) → up, south (0) → down
    const angle = Math.PI - player.facing;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(pp.x + Math.sin(angle) * 6, pp.y - Math.cos(angle) * 6);
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

  // Slower movement indoors (cramped spaces)
  const currentSpeed = state.mode === 'indoor' ? player.speed * 0.45 : player.speed;

  let mx = 0, mz = 0;
  if (keys.left) mx -= currentSpeed;
  if (keys.right) mx += currentSpeed;
  if (keys.up) mz -= currentSpeed;
  if (keys.down) mz += currentSpeed;

  if (mx !== 0 || mz !== 0) {
    // Calculate facing direction - UP (negative Z) should face north
    player.facing = Math.atan2(mx, mz);
    // Rotate the entire player character to face movement direction
    // This rotates the body AND the flashlight together
    playerGroup.rotation.y = player.facing;
  }

  let prompt = '';

  if (state.mode === 'outdoor') {
    // Try to move with proper building collision
    let newX = player.x + mx;
    let newZ = player.z + mz;
    
    // Player collision radius
    const playerRadius = 0.5;
    
    let nearestBuildingIdx = -1;
    let nearestDist = 999;
    
    // Check collision with each building - separate X and Z for sliding
    for (let i = 0; i < buildingsData.length; i++) {
      const bd = buildingsData[i];
      if (!bd) continue;
      
      const bx = bd.x, bz = bd.z, bw = bd.width, bdepth = bd.depth;
      const halfW = bw / 2;
      const halfD = bdepth / 2;
      
      // Building bounds with padding
      const minX = bx - halfW - playerRadius;
      const maxX = bx + halfW + playerRadius;
      const minZ = bz - halfD - playerRadius;
      const maxZ = bz + halfD + playerRadius;
      
      // Door zone (front of building, centered)
      const doorWidth = 2.0;
      const isDoorX = Math.abs(newX - bx) < doorWidth;
      const isDoorZ = newZ > bz + halfD - playerRadius;
      const atDoor = isDoorX && isDoorZ;
      
      // Check if player would be inside building bounds
      const insideX = newX > minX && newX < maxX;
      const insideZ = newZ > minZ && newZ < maxZ;
      
      if (insideX && insideZ && !atDoor) {
        // Determine which axis to push out
        const overlapLeft = newX - minX;
        const overlapRight = maxX - newX;
        const overlapBack = newZ - minZ;
        const overlapFront = maxZ - newZ;
        
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapBack, overlapFront);
        
        // Push player out of building along the axis with smallest overlap
        if (minOverlap === overlapLeft && !atDoor) {
          newX = minX;
        } else if (minOverlap === overlapRight && !atDoor) {
          newX = maxX;
        } else if (minOverlap === overlapBack) {
          newZ = minZ;
        } else if (minOverlap === overlapFront && !isDoorX) {
          newZ = maxZ;
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
    
    player.x = newX;
    player.z = newZ;
    
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
        // Left side rooms
        { x: -hw + 5, z: -hd + 5, w: 6, d: 5, door: 'right' },
        { x: -hw + 5, z: -hd + 11, w: 6, d: 5, door: 'right' },
        { x: -hw + 5, z: -hd + 17, w: 6, d: 5, door: 'right' },
        { x: -hw + 5, z: hd - 10, w: 6, d: 5, door: 'right' },
        // Right side rooms
        { x: hw - 5, z: hd - 5, w: 6, d: 5, door: 'left' },
        { x: hw - 5, z: hd - 11, w: 6, d: 5, door: 'left' },
        { x: hw - 5, z: 0, w: 6, d: 5, door: 'left' },
        // Back wall rooms
        { x: -15, z: -hd + 4.5, w: 6, d: 5, door: 'front' },
        { x: -7, z: -hd + 4.5, w: 6, d: 5, door: 'front' },
        // Center rooms
        { x: -13, z: 0, w: 5, d: 4, door: 'right' },
        { x: -13, z: 6, w: 5, d: 4, door: 'right' },
        { x: 5, z: hd - 8, w: 5, d: 4, door: 'left' },
        { x: 5, z: 0, w: 5, d: 4, door: 'left' },
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
    viewSize = 18;
    // Camera follows player directly from above/behind at a steeper angle
    // This keeps the player visible in alleyways without relying on transparency
    camera.position.set(player.x + 8, 45, player.z + 18);
    camera.lookAt(player.x, 0, player.z - 5);
    // Still update transparency for buildings directly in front
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
