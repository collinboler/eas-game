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
  -viewSize * aspect,
  viewSize * aspect,
  viewSize,
  -viewSize,
  0.1,
  200
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
  mode: 'outdoor' as 'outdoor' | 'indoor' | 'underground',
  currentBuilding: -1,
  currentFloor: 0,
  currentDrain: -1, // Which drain was entered
  undergroundDepth: 0, // How deep underground (0 = main tunnel)
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
ground.position.set(0, 0, -35); // Centered on the expanded city
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

// City layout - MERGED buildings forming one massive interconnected structure
// Buildings are connected horizontally and vertically - Kowloon Walled City style
// Each building section has a door entrance on the front face
// Buildings are 10 units wide (touching neighbors) and 12 units deep (merging rows)
const cityLayout = [
  // Row 1 (far back) - z = -64 (merged pairs of original rows)
  { x: -30, z: -64, w: 10, d: 12, floors: 15 },
  { x: -20, z: -64, w: 10, d: 12, floors: 17 },
  { x: -10, z: -64, w: 10, d: 12, floors: 14 },
  { x: 0, z: -64, w: 10, d: 12, floors: 19 },
  { x: 10, z: -64, w: 10, d: 12, floors: 14 },
  { x: 20, z: -64, w: 10, d: 12, floors: 16 },
  { x: 30, z: -64, w: 10, d: 12, floors: 15 },
  // Row 2 - z = -52 (merged)
  { x: -30, z: -52, w: 10, d: 12, floors: 16 },
  { x: -20, z: -52, w: 10, d: 12, floors: 12 },
  { x: -10, z: -52, w: 10, d: 12, floors: 20 },
  { x: 0, z: -52, w: 10, d: 12, floors: 12 },
  { x: 10, z: -52, w: 10, d: 12, floors: 17 },
  { x: 20, z: -52, w: 10, d: 12, floors: 14 },
  { x: 30, z: -52, w: 10, d: 12, floors: 14 },
  // Row 3 - z = -40 (merged)
  { x: -30, z: -40, w: 10, d: 12, floors: 14 },
  { x: -20, z: -40, w: 10, d: 12, floors: 17 },
  { x: -10, z: -40, w: 10, d: 12, floors: 15 },
  { x: 0, z: -40, w: 10, d: 12, floors: 20 },
  { x: 10, z: -40, w: 10, d: 12, floors: 12 },
  { x: 20, z: -40, w: 10, d: 12, floors: 17 },
  { x: 30, z: -40, w: 10, d: 12, floors: 14 },
  // Row 4 - z = -28 (merged)
  { x: -30, z: -28, w: 10, d: 12, floors: 16 },
  { x: -20, z: -28, w: 10, d: 12, floors: 14 },
  { x: -10, z: -28, w: 10, d: 12, floors: 16 },
  { x: 0, z: -28, w: 10, d: 12, floors: 21 },
  { x: 10, z: -28, w: 10, d: 12, floors: 14 },
  { x: 20, z: -28, w: 10, d: 12, floors: 16 },
  { x: 30, z: -28, w: 10, d: 12, floors: 15 },
  // Row 5 (front) - z = -16
  { x: -30, z: -16, w: 10, d: 12, floors: 15 },
  { x: -20, z: -16, w: 10, d: 12, floors: 18 },
  { x: -10, z: -16, w: 10, d: 12, floors: 12 },
  { x: 0, z: -16, w: 10, d: 12, floors: 19 },
  { x: 10, z: -16, w: 10, d: 12, floors: 16 },
  { x: 20, z: -16, w: 10, d: 12, floors: 13 },
  { x: 30, z: -16, w: 10, d: 12, floors: 17 },
];

function createCityBuilding(config: (typeof cityLayout)[0], index: number) {
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
            transparent: true,
            opacity: 1,
          })
        );
        win.position.set(-w / 2 + 1 + wx * 2 + Math.random() * 0.5, y, d / 2 + 0.01);
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
            transparent: true,
            opacity: 1,
          })
        );
        win.position.set(-w / 2 + 1 + wx * 2 + Math.random() * 0.5, y, -d / 2 - 0.01);
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
            transparent: true,
            opacity: 1,
          })
        );
        win.position.set(-w / 2 - 0.01, y, -d / 2 + 1 + wz * 2 + Math.random() * 0.5);
        win.rotation.y = -Math.PI / 2;
        group.add(win);
        allBuildingMeshes.push(win);

        // AC unit on side
        if (Math.random() > 0.7) {
          const ac = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.4, 0.6),
            new THREE.MeshLambertMaterial({ color: 0xccccbb, transparent: true, opacity: 1 })
          );
          ac.position.set(-w / 2 - 0.3, y - 0.3, -d / 2 + 1 + wz * 2);
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
            transparent: true,
            opacity: 1,
          })
        );
        win.position.set(w / 2 + 0.01, y, -d / 2 + 1 + wz * 2 + Math.random() * 0.5);
        win.rotation.y = Math.PI / 2;
        group.add(win);
        allBuildingMeshes.push(win);

        // AC unit on side
        if (Math.random() > 0.7) {
          const ac = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.4, 0.6),
            new THREE.MeshLambertMaterial({ color: 0xccccbb, transparent: true, opacity: 1 })
          );
          ac.position.set(w / 2 + 0.3, y - 0.3, -d / 2 + 1 + wz * 2);
          group.add(ac);
        }
      }
    }
  }

  // ========== AC UNITS - Lots of them! ==========
  for (let f = 0; f < floors; f++) {
    if (Math.random() > 0.3) {
      const acX = -w / 2 + 1 + Math.random() * (w - 2);
      const ac = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.6),
        new THREE.MeshLambertMaterial({ color: 0xccccbb, transparent: true, opacity: 1 })
      );
      ac.position.set(acX, f * 2.2 + 1, d / 2 + 0.35);
      group.add(ac);
      allBuildingMeshes.push(ac);
      // AC drip stain
      const drip = new THREE.Mesh(
        new THREE.PlaneGeometry(0.2, Math.random() * 2 + 0.5),
        new THREE.MeshBasicMaterial({ color: 0x2a3530, transparent: true, opacity: 0.6 })
      );
      drip.position.set(acX, f * 2.2 - 0.5, d / 2 + 0.02);
      group.add(drip);
    }
  }

  // ========== PIPES - Running up the building ==========
  const pipeCount = 2 + Math.floor(Math.random() * 4);
  for (let p = 0; p < pipeCount; p++) {
    const pipeX = -w / 2 + 0.5 + Math.random() * (w - 1);
    const pipeH = 3 + Math.random() * (height - 5);
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, pipeH, 6),
      new THREE.MeshLambertMaterial({ color: 0x444444, transparent: true, opacity: 1 })
    );
    pipe.position.set(pipeX, pipeH / 2 + Math.random() * 3, d / 2 + 0.15);
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
    wire.position.set(0, wireY, d / 2 + 0.25 + Math.random() * 0.2);
    group.add(wire);
  }

  // ========== NEON SIGNS - Multiple chaotic signs ==========
  const signCount = 1 + Math.floor(Math.random() * 4);
  const neonColors = [
    0xff0066, 0x00ffff, 0xff6600, 0x00ff66, 0xff00ff, 0xffff00, 0xff3333, 0x33ff33,
  ];
  for (let s = 0; s < signCount; s++) {
    const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];
    const isVertical = Math.random() > 0.5;
    const signW = isVertical ? 0.4 + Math.random() * 0.3 : 1.5 + Math.random() * 2;
    const signH = isVertical ? 2 + Math.random() * 4 : 0.5 + Math.random() * 0.5;
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(signW, signH, 0.1),
      new THREE.MeshBasicMaterial({ color: neonColor, transparent: true, opacity: 1 })
    );
    const signX = (Math.random() - 0.5) * w * 0.9;
    const signY = 3 + Math.random() * Math.min(height - 6, 15);
    sign.position.set(signX, signY, d / 2 + 0.3 + s * 0.1);
    group.add(sign);
    allBuildingMeshes.push(sign);

    const glow = new THREE.PointLight(neonColor, 0.5, 4);
    glow.position.set(signX, signY, d / 2 + 1);
    group.add(glow);
  }

  // ========== LAUNDRY - Hanging clothes ==========
  for (let f = 2; f < floors - 1; f += 2) {
    if (Math.random() > 0.4) {
      const laundryX = -w / 2 + 2 + Math.random() * (w - 4);
      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 2.5, 4),
        new THREE.MeshLambertMaterial({ color: 0x666666 })
      );
      pole.rotation.z = Math.PI / 2;
      pole.position.set(laundryX, f * 2.2 + 1.5, d / 2 + 1);
      group.add(pole);
      // Clothes
      const clothColors = [0xeeeedd, 0x6688aa, 0xaa6655, 0x55aa66, 0xddddcc, 0x887766];
      for (let c = 0; c < 3 + Math.floor(Math.random() * 4); c++) {
        const cloth = new THREE.Mesh(
          new THREE.PlaneGeometry(0.3 + Math.random() * 0.3, 0.5 + Math.random() * 0.4),
          new THREE.MeshLambertMaterial({
            color: clothColors[Math.floor(Math.random() * clothColors.length)],
            side: THREE.DoubleSide,
          })
        );
        cloth.position.set(laundryX - 1 + c * 0.5, f * 2.2 + 1.2, d / 2 + 1);
        cloth.rotation.y = Math.random() * 0.3;
        group.add(cloth);
      }
    }
  }

  // ========== PLANTS on windowsills ==========
  for (let f = 0; f < floors; f++) {
    if (Math.random() > 0.7) {
      const plantX = -w / 2 + 1 + Math.random() * (w - 2);
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.12, 0.2, 6),
        new THREE.MeshLambertMaterial({ color: 0x8b4513 })
      );
      pot.position.set(plantX, f * 2.2 + 0.6, d / 2 + 0.3);
      group.add(pot);
      const plant = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 6, 6),
        new THREE.MeshLambertMaterial({ color: 0x228822 })
      );
      plant.position.set(plantX, f * 2.2 + 0.9, d / 2 + 0.3);
      group.add(plant);
    }
  }

  // ========== BALCONY CLUTTER ==========
  for (let f = 1; f < floors; f++) {
    if (Math.random() > 0.6) {
      const clutterX = -w / 2 + 1 + Math.random() * (w - 2);
      // Random boxes/stuff
      for (let b = 0; b < 2 + Math.floor(Math.random() * 3); b++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.3 + Math.random() * 0.3, 0.2 + Math.random() * 0.3, 0.2),
          new THREE.MeshLambertMaterial({ color: 0x665544 + Math.floor(Math.random() * 0x222222) })
        );
        box.position.set(clutterX + b * 0.35, f * 2.2 + 0.15, d / 2 + 0.35);
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
    tank.position.set(-w / 3 + t * 2 + Math.random(), height + 0.6, Math.random() * 2 - 1);
    group.add(tank);
    allBuildingMeshes.push(tank);
  }
  // Antennas
  for (let a = 0; a < 2 + Math.floor(Math.random() * 4); a++) {
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 1.5 + Math.random() * 2, 4),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    antenna.position.set(-w / 3 + Math.random() * (w * 0.6), height + 1, Math.random() * 2 - 1);
    group.add(antenna);
  }
  // Satellite dishes
  if (Math.random() > 0.5) {
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    dish.rotation.x = Math.PI / 4;
    dish.position.set(w / 4, height + 0.3, 0);
    group.add(dish);
  }

  // ========== DOOR ==========
  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 3.2, 0.25),
    new THREE.MeshLambertMaterial({ color: 0x3a2a1a, transparent: true, opacity: 1 })
  );
  doorFrame.position.set(0, 1.6, d / 2 + 0.15);
  group.add(doorFrame);
  allBuildingMeshes.push(doorFrame);

  const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2.8),
    new THREE.MeshLambertMaterial({ color: 0x553322, transparent: true, opacity: 1 })
  );
  door.position.set(0, 1.4, d / 2 + 0.3);
  group.add(door);
  allBuildingMeshes.push(door);

  // ========== CHINESE NUMBER SIGN above door ==========
  const buildingNum = index + 1;
  // Create sign backing plate
  const signBacking = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 0.1),
    new THREE.MeshLambertMaterial({ color: 0x8b0000 }) // Dark red traditional color
  );
  signBacking.position.set(0, 3.3, d / 2 + 0.35);
  group.add(signBacking);

  // Gold border
  const signBorder = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.9, 0.08),
    new THREE.MeshLambertMaterial({ color: 0xdaa520 }) // Gold color
  );
  signBorder.position.set(0, 3.3, d / 2 + 0.33);
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
  signFace.position.set(0, 3.3, d / 2 + 0.41);
  group.add(signFace);

  const doorLight = new THREE.PointLight(0xffaa55, 0.6, 5);
  doorLight.position.set(0, 3, d / 2 + 1);
  group.add(doorLight);

  // ========== VERTICAL CHINESE SIGNS (KWC signature) ==========
  // These hang perpendicular from buildings with Chinese characters
  const chineseTexts = [
    '診所',
    '藥房',
    '茶餐廳',
    '酒樓',
    '雜貨',
    '理髮',
    '牙科',
    '眼鏡',
    '五金',
    '電器',
    '洗衣',
    '麵家',
    '粥店',
    '燒味',
    '豆腐',
    '餅家',
    '涼茶',
    '報紙',
    '雜誌',
    '修理',
    '裁縫',
    '花店',
    '魚店',
    '肉檔',
    '大押',
    '金行',
    '當鋪',
    '藥材',
    '中醫',
    '西醫',
    '牙醫',
    '獸醫',
  ];
  const signColors = [
    0xdd2222, 0x22aa22, 0x2222dd, 0xdd8822, 0xaa22aa, 0x22aaaa, 0xdddd22, 0xffffff,
  ];
  const bgColors = [0x111144, 0x441111, 0x114411, 0x444411, 0x114444, 0x441144, 0x222222, 0x880000];

  // Add 2-5 vertical hanging signs (above door level)
  const numVerticalSigns = 2 + Math.floor(Math.random() * 4);
  for (let vs = 0; vs < numVerticalSigns; vs++) {
    const signHeight = 3 + Math.random() * 4;
    const signWidth = 0.8 + Math.random() * 0.4;
    // Start at y=7 minimum to be well above the door (door top is at ~3.3)
    const signY = 7 + Math.random() * Math.max(0, height - 12);
    // Avoid center where door is (x = 0), place on sides
    let signX = -w / 2 + 1.5 + vs * (w / numVerticalSigns);
    // Push signs away from center door area
    if (Math.abs(signX) < 2) signX = signX < 0 ? -2.5 : 2.5;
    const signExtend = 1.5 + Math.random(); // How far it sticks out

    // Sign board (vertical rectangle)
    const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(signWidth, signHeight, 0.15),
      new THREE.MeshLambertMaterial({ color: bgColor, transparent: true, opacity: 1 })
    );
    signBoard.position.set(signX, signY, d / 2 + signExtend);
    group.add(signBoard);
    allBuildingMeshes.push(signBoard);

    // Gold/red border
    const borderColor = Math.random() > 0.5 ? 0xdaa520 : 0xcc3333;
    const border = new THREE.Mesh(
      new THREE.BoxGeometry(signWidth + 0.1, signHeight + 0.1, 0.12),
      new THREE.MeshLambertMaterial({ color: borderColor })
    );
    border.position.set(signX, signY, d / 2 + signExtend - 0.02);
    group.add(border);

    // Create Chinese text texture
    const textCanvas = document.createElement('canvas');
    const numChars = 2 + Math.floor(Math.random() * 3);
    textCanvas.width = 64;
    textCanvas.height = 64 * numChars;
    const textCtx = textCanvas.getContext('2d');
    if (textCtx) {
      // Background
      textCtx.fillStyle = '#' + bgColor.toString(16).padStart(6, '0');
      textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height);

      // Text color
      const textColor = signColors[Math.floor(Math.random() * signColors.length)];
      textCtx.fillStyle = '#' + textColor.toString(16).padStart(6, '0');
      textCtx.font = 'bold 52px serif';
      textCtx.textAlign = 'center';
      textCtx.textBaseline = 'middle';

      // Write characters vertically
      const text = chineseTexts[Math.floor(Math.random() * chineseTexts.length)];
      for (let c = 0; c < Math.min(text.length, numChars); c++) {
        textCtx.fillText(text[c] || '', 32, 32 + c * 64);
      }
    }

    const textTexture = new THREE.CanvasTexture(textCanvas);
    const textFace = new THREE.Mesh(
      new THREE.PlaneGeometry(signWidth - 0.15, signHeight - 0.15),
      new THREE.MeshBasicMaterial({ map: textTexture })
    );
    textFace.position.set(signX, signY, d / 2 + signExtend + 0.08);
    group.add(textFace);
    allBuildingMeshes.push(textFace);

    // Mount bracket
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.15, signExtend),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    bracket.position.set(signX, signY + signHeight / 2 - 0.3, d / 2 + signExtend / 2);
    group.add(bracket);
  }

  // ========== HORIZONTAL SHOP SIGNS ==========
  // Signs above door level on sides of building
  const numShopSigns = 1 + Math.floor(Math.random() * 2);
  for (let ss = 0; ss < numShopSigns; ss++) {
    const shopSignW = 2 + Math.random() * 1.5;
    const shopSignH = 0.6 + Math.random() * 0.3;
    // Place on left or right side, avoiding door center
    const side = ss % 2 === 0 ? -1 : 1;
    const shopSignX = side * (w / 4 + 1 + Math.random());
    // Above door (door top is at ~3.3)
    const shopSignY = 4.5 + ss * 1.5 + Math.random();

    const shopBg = bgColors[Math.floor(Math.random() * bgColors.length)];
    const shopSign = new THREE.Mesh(
      new THREE.BoxGeometry(shopSignW, shopSignH, 0.1),
      new THREE.MeshLambertMaterial({ color: shopBg })
    );
    shopSign.position.set(shopSignX, shopSignY, d / 2 + 0.5);
    group.add(shopSign);
    allBuildingMeshes.push(shopSign);

    // Create horizontal text
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 256;
    hCanvas.height = 64;
    const hCtx = hCanvas.getContext('2d');
    if (hCtx) {
      hCtx.fillStyle = '#' + shopBg.toString(16).padStart(6, '0');
      hCtx.fillRect(0, 0, 256, 64);

      const hTextColor = signColors[Math.floor(Math.random() * signColors.length)];
      hCtx.fillStyle = '#' + hTextColor.toString(16).padStart(6, '0');
      hCtx.font = 'bold 40px serif';
      hCtx.textAlign = 'center';
      hCtx.textBaseline = 'middle';

      const shopText = chineseTexts[Math.floor(Math.random() * chineseTexts.length)];
      hCtx.fillText(shopText, 128, 32);
    }

    const hTexture = new THREE.CanvasTexture(hCanvas);
    const hFace = new THREE.Mesh(
      new THREE.PlaneGeometry(shopSignW - 0.1, shopSignH - 0.1),
      new THREE.MeshBasicMaterial({ map: hTexture })
    );
    hFace.position.set(shopSignX, shopSignY, d / 2 + 0.56);
    group.add(hFace);
    allBuildingMeshes.push(hFace);
  }

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
  sellerX: number; // World position of seller
  sellerZ: number;
}

const shopStalls: ShopStall[] = [];

// Dialogue for shop sellers based on their type
const shopSellerDialogues: Record<ShopStall['type'], string[]> = {
  food: [
    '"Best noodles in Kowloon! My grandmother\'s recipe!"',
    '"Fresh today! Fish balls, dumplings, whatever you like!"',
    '"Hungry? Sit down, sit down. I\'ll make you something special."',
    '"Try the char siu bao. You won\'t find better anywhere."',
    '"Ah, a customer! The soup is hot and ready."',
    '"My congee has been simmering since dawn. Perfect for you!"',
  ],
  clothes: [
    '"Good quality! Look, feel the fabric. Real silk, very cheap."',
    '"This would look perfect on you. Very fashionable!"',
    '"I have everything. Jackets, shirts, pants. What do you need?"',
    '"Brand name, brand name! Nobody can tell the difference."',
    '"Special price for you today. I give you good deal."',
    '"Looking for something? I can find any style, any size."',
  ],
  drugs: [
    '"...What do you want? Make it quick."',
    '"You didn\'t see me. I wasn\'t here."',
    '"Looking for something... special? Keep your voice down."',
    '"Wrong stall, friend. Move along."',
    '"I don\'t know you. You don\'t know me. Understand?"',
    '"Cash only. No questions. That\'s how this works."',
  ],
  electronics: [
    '"Latest models! Phones, watches, cameras. All working!"',
    '"Need it fixed? I can repair anything electronic."',
    '"Cheap prices! These fell off a truck, if you know what I mean."',
    '"Batteries, cables, chargers. Everything you need."',
    '"This radio picks up frequencies you won\'t believe."',
    '"Looking for parts? I have components from everywhere."',
  ],
  trinkets: [
    '"Beautiful jade! Brings good luck, very powerful."',
    '"Antiques from the old city. Each one has a story."',
    '"This charm will protect you. My grandmother blessed it."',
    '"Souvenirs! Something to remember Kowloon by."',
    '"Hand-carved, very old. A real collector\'s piece."',
    '"Incense, candles, paper offerings. For the ancestors."',
  ],
};

function createShopStall(x: number, z: number, type: ShopStall['type']): THREE.Group {
  const group = new THREE.Group();

  // Random variations for each stall
  const variant = Math.floor(Math.random() * 3); // 0, 1, or 2 for sub-variants
  const stallScale = 0.85 + Math.random() * 0.3; // Size variation
  const isWorn = Math.random() > 0.5; // Worn/weathered look

  // Varied table colors and styles
  const tableColors = [0x5a4030, 0x4a3525, 0x6a5040, 0x3a2a1a, 0x7a6050];
  const tableColor =
    type === 'drugs'
      ? 0x1a1a22
      : (tableColors[Math.floor(Math.random() * tableColors.length)] ?? 0x5a4030);

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
      new THREE.MeshLambertMaterial({
        color: clothColors[Math.floor(Math.random() * clothColors.length)] ?? 0xcc3333,
      })
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
      trinkets: [0xccaa33, 0xddbb44, 0xbb9922, 0xeecc55, 0xcc8800],
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
        canopyStripe.position.set(
          -tableWidth / 2 + stripeWidth / 2 + stripe * stripeWidth,
          canopyHeight,
          0
        );
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
      pole.position.set(cx * (tableWidth / 2 + 0.2), canopyHeight / 2, tableDepth / 2 + 0.1);
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

  const stallLight = new THREE.PointLight(
    0xffddaa,
    0.6 + Math.random() * 0.4,
    5 + Math.random() * 2
  );
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
          new THREE.CylinderGeometry(
            0.18 + Math.random() * 0.1,
            0.22 + Math.random() * 0.1,
            0.25 + Math.random() * 0.1,
            8
          ),
          new THREE.MeshLambertMaterial({ color: 0x555555 + Math.floor(Math.random() * 0x222222) })
        );
        pot.position.set(-0.6 + i * 0.6, 0.95, 0.1);
        group.add(pot);

        // Steam
        for (let s = 0; s < 4; s++) {
          const steam = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.04, 0.25, 4),
            new THREE.MeshBasicMaterial({
              color: 0xffffff,
              transparent: true,
              opacity: 0.3 + Math.random() * 0.2,
            })
          );
          steam.position.set(
            -0.6 + i * 0.6 + (Math.random() - 0.5) * 0.12,
            1.2 + s * 0.12,
            0.1 + (Math.random() - 0.5) * 0.08
          );
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
          new THREE.MeshLambertMaterial({
            color: ingredientColors[i % ingredientColors.length] ?? 0xdd8844,
          })
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
          const fruitColor =
            fruitColors[Math.floor(Math.random() * fruitColors.length)] ?? 0xff6633;
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
      new THREE.MeshBasicMaterial({
        color: signColors[Math.floor(Math.random() * signColors.length)] ?? 0xff4444,
      })
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
    const clothColors: number[] = palettes[paletteIdx] ?? [
      0x3366cc, 0xcc3366, 0x66cc33, 0xcccc33, 0x333333, 0xffffff,
    ];

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
        cloth.position.set(
          -tableWidth / 2 + 0.2 + i * (tableWidth / (numClothes + 1)),
          hasCanopy ? canopyHeight - 0.6 - clothH / 2 : 1.5 - clothH / 2,
          -0.2
        );
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
            new THREE.MeshLambertMaterial({
              color: shoeColors[Math.floor(Math.random() * shoeColors.length)] ?? 0x222222,
            })
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
          new THREE.MeshLambertMaterial({
            color: fabricColors[i % fabricColors.length] ?? 0xcc3366,
          })
        );
        roll.rotation.z = Math.PI / 2;
        roll.position.set(-0.5 + i * 0.35, 0.95, 0);
        group.add(roll);
      }

      // Draped fabric
      const drape = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.8),
        new THREE.MeshLambertMaterial({
          color: fabricColors[0] ?? 0xcc3366,
          side: THREE.DoubleSide,
        })
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
          new THREE.MeshLambertMaterial({
            color: clothColors[Math.floor(Math.random() * clothColors.length)] ?? 0x3366cc,
          })
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
          new THREE.CylinderGeometry(
            0.05 + Math.random() * 0.03,
            0.05,
            0.15 + Math.random() * 0.1,
            6
          ),
          new THREE.MeshLambertMaterial({
            color: [0x885522, 0x553311, 0x224488, 0x448822][i % 4] ?? 0x885522,
          })
        );
        bottle.position.set(-0.5 + (i % 4) * 0.3, 0.88 + Math.floor(i / 4) * 0.18, 0);
        group.add(bottle);
      }
    } else if (drugsVariant === 1) {
      // PACKAGE DEALER
      for (let i = 0; i < 10; i++) {
        const pkg = new THREE.Mesh(
          new THREE.BoxGeometry(0.12 + Math.random() * 0.08, 0.08, 0.08 + Math.random() * 0.05),
          new THREE.MeshLambertMaterial({
            color: [0x333333, 0x222222, 0x444444][i % 3] ?? 0x333333,
          })
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
          new THREE.MeshLambertMaterial({
            color: [0x336633, 0x553322, 0x663322, 0x225533, 0x443322][i] ?? 0x336633,
          })
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
        new THREE.MeshLambertMaterial({
          color: [0x222244, 0x442222, 0x224422][Math.floor(Math.random() * 3)] ?? 0x222244,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        })
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
          new THREE.MeshBasicMaterial({
            color: isOn
              ? ([0x3366ff, 0x33ff66, 0xff6633][Math.floor(Math.random() * 3)] ?? 0x3366ff)
              : 0x111111,
          })
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
            new THREE.MeshLambertMaterial({
              color:
                [0x111111, 0x222222, 0xcccccc, 0x886644][Math.floor(Math.random() * 4)] ?? 0x111111,
            })
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
            new THREE.MeshLambertMaterial({
              color:
                [0x00ff00, 0xff0000, 0x0000ff, 0xffff00][Math.floor(Math.random() * 4)] ?? 0x00ff00,
            })
          );
          comp.position.set(
            -0.5 + i * 0.35 + (Math.random() - 0.5) * 0.15,
            1.0,
            (Math.random() - 0.5) * 0.1
          );
          group.add(comp);
        }
      }
    }

    // Cables everywhere (always)
    const numCables = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numCables; i++) {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.5 + Math.random() * 0.5, 4),
        new THREE.MeshLambertMaterial({
          color: [0x111111, 0x222222, 0x444444][Math.floor(Math.random() * 3)] ?? 0x111111,
        })
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
            new THREE.MeshLambertMaterial({
              color: [0xffd700, 0xc0c0c0, 0x333333][Math.floor(Math.random() * 3)] ?? 0xffd700,
            })
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
            new THREE.MeshLambertMaterial({
              color: toyColors[Math.floor(Math.random() * toyColors.length)] ?? 0xff0000,
            })
          );
        } else if (toyType === 1) {
          // Car
          toy = new THREE.Mesh(
            new THREE.BoxGeometry(0.2, 0.08, 0.1),
            new THREE.MeshLambertMaterial({
              color: toyColors[Math.floor(Math.random() * toyColors.length)] ?? 0xff0000,
            })
          );
        } else {
          // Figure
          toy = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.05, 0.15, 6),
            new THREE.MeshLambertMaterial({
              color: toyColors[Math.floor(Math.random() * toyColors.length)] ?? 0xff0000,
            })
          );
        }
        toy.position.set(
          -0.5 + (i % 4) * 0.3,
          0.92 + Math.floor(i / 4) * 0.15,
          Math.random() * 0.3
        );
        group.add(toy);
      }
    } else {
      // SOUVENIR STALL
      // Mini figurines
      for (let i = 0; i < 6; i++) {
        const figurine = new THREE.Mesh(
          new THREE.BoxGeometry(0.08, 0.18, 0.06),
          new THREE.MeshLambertMaterial({
            color: [0xffd700, 0xc41e3a, 0x228b22][Math.floor(Math.random() * 3)] ?? 0xffd700,
          })
        );
        figurine.position.set(-0.5 + i * 0.22, 0.94, 0.1);
        group.add(figurine);
      }

      // Postcards/pictures
      for (let i = 0; i < 4; i++) {
        const card = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.2, 0.01),
          new THREE.MeshLambertMaterial({
            color: [0xffffff, 0xffffcc, 0xccffff, 0xffcccc][i] ?? 0xffffff,
          })
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
          new THREE.MeshLambertMaterial({
            color: flagColors[i] ?? 0xff0000,
            side: THREE.DoubleSide,
          })
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
    trinkets: [0xcc6633, 0x33cc66, 0x6633cc, 0xcccc33, 0x33cccc],
  };
  const shirtColor =
    shirtPalettes[type][Math.floor(Math.random() * shirtPalettes[type].length)] ?? 0x334455;

  // Varied pants colors
  const pantsColors = [0x222233, 0x333322, 0x2a2a3a, 0x3a3a2a, 0x222222, 0x444444];
  const pantsColor = pantsColors[Math.floor(Math.random() * pantsColors.length)] ?? 0x222233;

  // Varied skin tones
  const skinColors = [0xeeddcc, 0xd4a574, 0x8d5524, 0x4a3728, 0xf5deb3, 0xc68642];
  const skinColor = skinColors[Math.floor(Math.random() * skinColors.length)] ?? 0xeeddcc;

  // Varied hair colors
  const hairColors = [0x222211, 0x111111, 0x332211, 0x553322, 0x666655, 0x888877, 0xaaaaaa];
  const hairColor = isOld
    ? ([0x888888, 0x999999, 0xaaaaaa][Math.floor(Math.random() * 3)] ?? 0x888888)
    : (hairColors[Math.floor(Math.random() * hairColors.length)] ?? 0x222211);

  // Body scale based on characteristics
  const bodyWidth = isHeavy ? 0.5 : isFemale ? 0.35 : 0.4;
  const bodyHeight = isOld ? 0.45 : 0.5;

  // Torso
  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth, bodyHeight, 0.25),
    new THREE.MeshLambertMaterial({ color: shirtColor })
  );
  torso.position.y = 0.75;
  group.add(torso);

  // Apron (for some sellers)
  const hasApron = type === 'food' || (type === 'clothes' && Math.random() > 0.5);
  if (hasApron) {
    const apronColors = [0xffffff, 0xdddddd, 0x4444aa, 0xaa4444, 0x44aa44];
    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(bodyWidth - 0.05, 0.4, 0.05),
      new THREE.MeshLambertMaterial({
        color: apronColors[Math.floor(Math.random() * apronColors.length)] ?? 0xffffff,
      })
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
      new THREE.MeshLambertMaterial({
        color: [0xff0000, 0xffffff, 0x0000ff][Math.floor(Math.random() * 3)] ?? 0xff0000,
      })
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
      new THREE.MeshLambertMaterial({
        color: [0x333333, 0x0000aa, 0xaa0000, 0x00aa00][Math.floor(Math.random() * 4)] ?? 0x333333,
      })
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
        new THREE.MeshLambertMaterial({
          color:
            [0xff0000, 0x0000ff, 0xff00ff, 0xffff00][Math.floor(Math.random() * 4)] ?? 0xff0000,
        })
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

// Place shop stalls in the open street area in front of the merged building mass
// Stalls line the front of the city and along the sides
const streetZPositions = [-4, -2, 0, 2]; // Open street area in front of buildings
const shopTypes: ShopStall['type'][] = ['food', 'clothes', 'drugs', 'electronics', 'trinkets'];

streetZPositions.forEach((stallZ) => {
  // 3-4 stalls per street row
  const numStalls = 3 + Math.floor(Math.random() * 2);
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
    else if (rand < 0.7) type = 'electronics';
    else if (rand < 0.85) type = 'trinkets';
    else type = 'drugs'; // Rarer

    const stallGroup = createShopStall(xPos, stallZ, type);
    outdoorScene.add(stallGroup);

    // Calculate actual seller world position (seller is behind the stall)
    const stallRotated = Math.random() > 0.5; // Same logic as in createShopStall
    const sellerOffsetZ = stallRotated ? 0.8 : -0.8;
    
    shopStalls.push({
      type,
      x: xPos,
      z: stallZ,
      group: stallGroup,
      seller: stallGroup.children.find((c) => c instanceof THREE.Group) as THREE.Group,
      sellerX: xPos,
      sellerZ: stallZ + sellerOffsetZ,
    });
  }
});

// ============================================
// UNDERGROUND ENTRANCES - Secret passages throughout city
// ============================================
interface UndergroundEntrance {
  x: number;
  z: number;
  mesh: THREE.Group;
}

const undergroundEntrances: UndergroundEntrance[] = [];

// Create underground entrance - secret passage style
function createUndergroundEntrance(x: number, z: number): THREE.Group {
  const group = new THREE.Group();

  // Broken concrete hole (irregular shape)
  const holeW = 1.2 + Math.random() * 0.4;
  const holeD = 1.0 + Math.random() * 0.3;
  const hole = new THREE.Mesh(
    new THREE.BoxGeometry(holeW, 0.3, holeD),
    new THREE.MeshBasicMaterial({ color: 0x030303 })
  );
  hole.position.y = -0.1;
  group.add(hole);

  // Crumbling concrete edges (irregular)
  const edgeColors = [0x3a3530, 0x2f2a25, 0x353028];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const dist = 0.5 + Math.random() * 0.3;
    const edgeW = 0.2 + Math.random() * 0.3;
    const edgeH = 0.1 + Math.random() * 0.15;
    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(edgeW, edgeH, edgeW),
      new THREE.MeshLambertMaterial({ color: edgeColors[Math.floor(Math.random() * 3)] })
    );
    edge.position.set(Math.cos(angle) * dist, edgeH / 2, Math.sin(angle) * dist);
    edge.rotation.y = Math.random() * Math.PI;
    group.add(edge);
  }

  // Rusty metal ladder rungs visible in hole
  for (let i = 0; i < 3; i++) {
    const rung = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.05, 0.05),
      new THREE.MeshLambertMaterial({ color: 0x4a4035 })
    );
    rung.position.set(0, -0.1 - i * 0.25, 0);
    group.add(rung);
  }

  // Dark stains around entrance
  const stain = new THREE.Mesh(
    new THREE.CircleGeometry(1.5 + Math.random() * 0.5, 8),
    new THREE.MeshBasicMaterial({ color: 0x1a1815, transparent: true, opacity: 0.3 })
  );
  stain.rotation.x = -Math.PI / 2;
  stain.position.y = 0.01;
  group.add(stain);

  // Debris around entrance
  for (let i = 0; i < 4; i++) {
    const debris = new THREE.Mesh(
      new THREE.BoxGeometry(0.1 + Math.random() * 0.2, 0.05, 0.1 + Math.random() * 0.2),
      new THREE.MeshLambertMaterial({ color: 0x3a3530 })
    );
    debris.position.set((Math.random() - 0.5) * 2, 0.03, (Math.random() - 0.5) * 2);
    debris.rotation.y = Math.random() * Math.PI;
    group.add(debris);
  }

  group.position.set(x, 0, z);
  return group;
}

// Underground entrances - ONE outdoor entrance near spawn, rest are inside buildings
// Each entrance is associated with a building index (-1 for outdoor street entrance)
interface UndergroundEntranceData {
  x: number;
  z: number;
  buildingIdx: number; // Which building this entrance is in (-1 for outdoor)
}

const drainPositions: UndergroundEntranceData[] = [
  // Index 0: OUTDOOR entrance near player spawn (the only street-level entrance)
  { x: 0, z: -8, buildingIdx: -1 },
  
  // Indices 1-5: Underground exits that lead INTO buildings (evenly dispersed)
  { x: -20, z: -16, buildingIdx: 29 }, // Front-left area - Building at x=-20, z=-16
  { x: 20, z: -16, buildingIdx: 33 },  // Front-right area - Building at x=20, z=-16
  { x: 0, z: -40, buildingIdx: 17 },   // Center - Building at x=0, z=-40
  { x: -30, z: -52, buildingIdx: 7 },  // Back-left - Building at x=-30, z=-52
  { x: 30, z: -52, buildingIdx: 13 },  // Back-right - Building at x=30, z=-52
];

// Create visual markers for entrances
drainPositions.forEach((pos, idx) => {
  const drain = createUndergroundEntrance(pos.x, pos.z);
  // Only the outdoor entrance (index 0) is visible on the street
  drain.visible = (pos.buildingIdx === -1);
  outdoorScene.add(drain);
  undergroundEntrances.push({ x: pos.x, z: pos.z, mesh: drain });
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
  // Scroll properties
  hasScroll?: boolean;
  scrollId?: number;
  scrollCollected?: boolean;
  // Supernatural character properties
  characterId?: string;
  characterName?: string;
}

// ============================================
// AMBIENT GHOSTS - Spectral figures that appear and disappear
// ============================================
interface AmbientGhost {
  mesh: THREE.Group;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  speed: number;
  visible: boolean;
  nextToggleTime: number; // When to appear/disappear
  fadeAlpha: number; // Current opacity (0-1)
  fadeDirection: number; // 1 = fading in, -1 = fading out
  floatOffset: number; // For floating animation
}

const ambientGhosts: AmbientGhost[] = [];
const GHOST_TOGGLE_INTERVAL = 15000; // 15 seconds
const GHOST_FADE_SPEED = 0.02; // How fast they fade in/out

// ============================================
// SUPERNATURAL CHARACTERS - Story ghosts with scrolls
// ============================================
interface SupernaturalCharacter {
  id: string;
  name: string;
  story: string;
  scrollQuote: string;
  source: string;
  interactions: {
    greeting: string;
    handoff: string;
    congratulation: string;
    farewell: string;
  };
}

// The 10 supernatural characters from Chinese ghost stories
const supernaturalCharacters: SupernaturalCharacter[] = [
  {
    id: 'judge_bao',
    name: 'Judge Bao (Bao Zheng)',
    story: 'Judge Bao Selling Rice in Chenzhou (Sept 17)',
    scrollQuote: 'The law is not established for the sake of the powerful, nor does it bend for the wealthy. It is set down so that right and wrong may be distinguished clearly, and so that Heaven may judge through human hands.',
    source: 'Judge Bao case stories',
    interactions: {
      greeting: 'You stand before the law. Speak carefully—truth echoes longer than words.',
      handoff: 'Take this decree. Justice must circulate like grain.',
      congratulation: 'You have acted without fear or favor. Heaven records this.',
      farewell: 'Go. Let fairness guide your steps.',
    },
  },
  {
    id: 'phantom_heroine',
    name: 'The Phantom Heroine',
    story: 'The Phantom Heroine: Ghosts and Gender (Sept 29)',
    scrollQuote: 'Though my bones lie cold and my name has faded among the living, my grievance is not buried. I return because what was done to me was never answered, and because silence would be the greater injustice.',
    source: 'Seventeenth-century chuanqi ghost tales',
    interactions: {
      greeting: 'Do not fear me. Fear what was done while I still breathed.',
      handoff: 'Read this, and remember why I returned.',
      congratulation: 'You listened when others would not.',
      farewell: 'I remain until justice is done.',
    },
  },
  {
    id: 'corporeal_ghost',
    name: 'The Corporeal Female Ghost',
    story: "The Ghost's Body (Sept 29 / Oct 1)",
    scrollQuote: 'She ate with the living and spoke with the living, casting a shadow where she stood. Yet when one drew near, no breath warmed her body, and those who touched her felt only the chill of death.',
    source: "The Ghost's Body",
    interactions: {
      greeting: 'You expected mist and shadow. Instead, you found flesh.',
      handoff: 'Take this proof that death does not erase presence.',
      congratulation: 'You did not turn away.',
      farewell: 'Remember what a body can carry.',
    },
  },
  {
    id: 'shen_xiu',
    name: 'Shen Xiu',
    story: 'Shen Xiu (Sept 10)',
    scrollQuote: 'The dead may not speak in court, nor may they plead their case before men. Yet Heaven hears what the living refuse to hear, and it does not forget injustice merely because a body has perished.',
    source: 'Stories Old and New (Jingu qiguan)',
    interactions: {
      greeting: 'I have already died once. You need not bow.',
      handoff: 'This is what I returned to say.',
      congratulation: 'You have finished what I could not.',
      farewell: 'Now I may finally rest.',
    },
  },
  {
    id: 'magistrate_teng_ghost',
    name: 'The Wronged Ghost',
    story: 'Magistrate Teng (Sept 8)',
    scrollQuote: 'When human judgment failed and the magistrate closed his ears, the spirit came forth to accuse. What could not be spoken among the living was declared openly among the dead.',
    source: 'Magistrate Teng, Stories Old and New',
    interactions: {
      greeting: 'The living ignored me. You did not.',
      handoff: 'Carry my accusation where I cannot.',
      congratulation: 'Justice has weight, even beyond the grave.',
      farewell: 'I will trouble the courts no longer.',
    },
  },
  {
    id: 'underworld_bureaucrat',
    name: 'Underworld Bureaucrat',
    story: 'The Chinese Deathscape (Oct 20)',
    scrollQuote: 'In death, as in life, there are offices to pass through and registers to be checked. Merit and crime are recorded without omission, and no soul departs until its account is settled.',
    source: 'The Chinese Deathscape, Introduction',
    interactions: {
      greeting: 'State your name. The dead queue as well.',
      handoff: 'Keep this record. Nothing escapes documentation.',
      congratulation: 'Your papers are in order.',
      farewell: 'Next.',
    },
  },
  {
    id: 'hungry_ghost',
    name: 'Hungry Ghost',
    story: 'The Chinese Deathscape (Oct 20)',
    scrollQuote: 'With throats no wider than needles and bellies like great drums, they hunger without relief. Food turns to flame before it can be swallowed, and desire itself becomes punishment.',
    source: 'The Chinese Deathscape',
    interactions: {
      greeting: 'Food… no, not food—memory.',
      handoff: 'This is all I was given.',
      congratulation: 'You saw me.',
      farewell: 'I remain.',
    },
  },
  {
    id: 'qutu_zhongren',
    name: 'Qutu Zhongren',
    story: 'Qutu Zhongren Cruelly Kills Other Creatures (Oct 22)',
    scrollQuote: 'Qutu Zhongren took pleasure not merely in killing, but in cruelty itself. He delighted in suffering, and his heart was unmoved by pleading, blood, or death.',
    source: 'Slapping the Table in Amazement',
    interactions: {
      greeting: 'Do you hear them? They never stop.',
      handoff: "Take it. I don't need reminders.",
      congratulation: 'You think this makes you better than me?',
      farewell: 'Run.',
    },
  },
  {
    id: 'fox_spirit',
    name: 'Fox Spirit (Huli Jing)',
    story: 'Alien Kind: Foxes and Late Imperial Chinese Narrative (Nov 3)',
    scrollQuote: 'Do not ask whether I am human or spirit. Ask only whether I am sincere, for sincerity is rarer than either form and far more dangerous.',
    source: 'Late-imperial fox-spirit tales',
    interactions: {
      greeting: "Relax. If I meant to harm you, you'd never know.",
      handoff: 'Read carefully. Words bite.',
      congratulation: 'Clever enough to survive—impressive.',
      farewell: "We'll meet again. Or we won't.",
    },
  },
  {
    id: 'ghost_witness',
    name: 'Ghost Witness',
    story: 'Stories Old and New (judicial ghost motif)',
    scrollQuote: 'The ghost testified clearly, naming names and crimes without hesitation, and when the truth was revealed, the case was finally resolved and the living left without excuse.',
    source: 'Stories Old and New (Jingu qiguan)',
    interactions: {
      greeting: 'I was summoned.',
      handoff: 'This is what I said.',
      congratulation: 'The record is complete.',
      farewell: 'Court is adjourned.',
    },
  },
];

// Dialogue state for multi-step conversations
type DialogueStage = 'greeting' | 'backstory' | 'accept' | 'farewell' | 'closed';
let currentDialogueStage: DialogueStage = 'closed';
let isHoodlumDialogue = false;

// ============================================
// SCROLL SYSTEM - Ancient wisdom from supernatural characters
// ============================================
interface Scroll {
  id: number;
  name: string;
  excerpt: string;
  fullText: string;
  characterId: string;
}

const scrollData: Scroll[] = supernaturalCharacters.map((char, idx) => ({
  id: idx + 1,
  name: char.name,
  excerpt: `"${char.scrollQuote}"`,
  fullText: `${char.scrollQuote}\n\n— ${char.name}, from "${char.story}"\nSource: ${char.source}`,
  characterId: char.id,
}));

// Track collected scrolls by ID
const collectedScrolls: number[] = [];
let scrollViewerOpen = false;
let currentDialogueNPC: NPC | null = null;

// Global tracker for which scroll IDs are assigned to NPCs across all areas
const assignedScrollIds: Set<number> = new Set();

const outdoorNPCs: NPC[] = [];
const indoorNPCs: NPC[] = [];

// Create a person mesh - same style as player character
function createPersonMesh(): THREE.Group {
  const group = new THREE.Group();

  // Random clothing colors
  const shirtColors = [
    0x334455, 0x553333, 0x335533, 0x555533, 0x443355, 0x335555, 0x554433, 0x3355aa, 0xaa3355,
  ];
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

// Create an ambient ghost mesh - ethereal, transparent, floating humanoid
function createAmbientGhostMesh(): THREE.Group {
  const group = new THREE.Group();

  // Ghost material - transparent white/gray
  const ghostMaterial = new THREE.MeshLambertMaterial({
    color: 0xccccdd,
    transparent: true,
    opacity: 0.4,
  });

  const ghostMaterialDark = new THREE.MeshLambertMaterial({
    color: 0x888899,
    transparent: true,
    opacity: 0.3,
  });

  // Ethereal body - slightly elongated and wispy
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.25), ghostMaterial);
  torso.position.y = 0.9; // Floating higher
  group.add(torso);

  // Trailing lower body (no distinct legs - ghost-like)
  const trail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.6, 8), ghostMaterial);
  trail.position.y = 0.35;
  trail.rotation.x = Math.PI; // Point downward
  group.add(trail);

  // Ghostly head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.28), ghostMaterial);
  head.position.y = 1.4;
  group.add(head);

  // Empty eye sockets - darker
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), ghostMaterialDark);
  leftEye.position.set(-0.08, 1.42, 0.14);
  group.add(leftEye);

  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), ghostMaterialDark);
  rightEye.position.set(0.08, 1.42, 0.14);
  group.add(rightEye);

  // Wispy arms
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), ghostMaterial);
  leftArm.position.set(-0.28, 0.85, 0);
  leftArm.rotation.z = 0.2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), ghostMaterial);
  rightArm.position.set(0.28, 0.85, 0);
  rightArm.rotation.z = -0.2;
  group.add(rightArm);

  return group;
}

// Create supernatural character meshes - human-like figures with unique characteristics
function createSupernaturalMesh(characterId: string): THREE.Group {
  const group = new THREE.Group();
  
  // Glow group - contains all the glow shells (separate so we can control them)
  const glowGroup = new THREE.Group();
  glowGroup.name = 'glowGroup';
  group.add(glowGroup);

  // Create ethereal material with transparency
  const createGhostMat = (color: number, opacity = 0.75) =>
    new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity,
      emissive: color,
      emissiveIntensity: 0.05,
    });

  // Create a glow shell material
  const createGlowMat = () =>
    new THREE.MeshBasicMaterial({
      color: 0xaaddff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide, // Render on backside so it shows around the mesh
    });

  // Helper to add a glow shell around a mesh
  const addGlowShell = (mesh: THREE.Mesh, scaleMultiplier = 1.15) => {
    const glowMat = createGlowMat();
    const glowMesh = new THREE.Mesh(mesh.geometry.clone(), glowMat);
    glowMesh.position.copy(mesh.position);
    glowMesh.rotation.copy(mesh.rotation);
    glowMesh.scale.copy(mesh.scale).multiplyScalar(scaleMultiplier);
    glowMesh.name = 'glowShell';
    glowGroup.add(glowMesh);
    return glowMesh;
  };

  // Helper to create a basic human body structure
  const createHumanBase = (
    skinColor: number,
    clothColor: number,
    pantsColor: number,
    hairColor: number,
    opacity = 0.75
  ) => {
    const skinMat = createGhostMat(skinColor, opacity);
    const clothMat = createGhostMat(clothColor, opacity);
    const pantsMat = createGhostMat(pantsColor, opacity);
    const hairMat = createGhostMat(hairColor, opacity);

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), clothMat);
    torso.position.y = 0.75;
    group.add(torso);
    addGlowShell(torso, 1.2);

    // Left leg
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.16), pantsMat);
    leftLeg.position.set(-0.1, 0.25, 0);
    group.add(leftLeg);
    addGlowShell(leftLeg, 1.25);

    // Right leg
    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.16), pantsMat);
    rightLeg.position.set(0.1, 0.25, 0);
    group.add(rightLeg);
    addGlowShell(rightLeg, 1.25);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.28), skinMat);
    head.position.y = 1.2;
    group.add(head);
    addGlowShell(head, 1.3); // Head gets a bigger glow

    // Hair
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.3), hairMat);
    hair.position.y = 1.42;
    group.add(hair);
    addGlowShell(hair, 1.2);

    // Eyes
    const eyeMat = createGhostMat(0x111122, 0.9);
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    leftEye.position.set(-0.08, 1.22, 0.14);
    group.add(leftEye);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
    rightEye.position.set(0.08, 1.22, 0.14);
    group.add(rightEye);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), clothMat);
    leftArm.position.set(-0.28, 0.7, 0);
    group.add(leftArm);
    addGlowShell(leftArm, 1.3);
    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), clothMat);
    rightArm.position.set(0.28, 0.7, 0);
    group.add(rightArm);
    addGlowShell(rightArm, 1.3);

    // Hands
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), skinMat);
    leftHand.position.set(-0.28, 0.45, 0);
    group.add(leftHand);
    addGlowShell(leftHand, 1.3);
    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), skinMat);
    rightHand.position.set(0.28, 0.45, 0);
    group.add(rightHand);
    addGlowShell(rightHand, 1.3);

    return { skinMat, clothMat, pantsMat, hairMat };
  };

  switch (characterId) {
    case 'judge_bao': {
      // Judge Bao - stern official in dark robes with distinctive official cap
      createHumanBase(0xccccdd, 0x1a1a2e, 0x1a1a2e, 0x111111, 0.8);

      // Official cap (wushamao) with extended wings
      const capMat = createGhostMat(0x1a1a2e, 0.85);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.32), capMat);
      cap.position.y = 1.52;
      group.add(cap);

      // Cap wings (the distinctive horizontal extensions)
      const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.06), capMat);
      leftWing.position.set(-0.28, 1.52, 0);
      group.add(leftWing);
      const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.06), capMat);
      rightWing.position.set(0.28, 1.52, 0);
      group.add(rightWing);

      // Golden belt (symbol of official rank)
      const beltMat = createGhostMat(0xdaa520, 0.9);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.26), beltMat);
      belt.position.y = 0.52;
      group.add(belt);

      // Crescent moon on forehead (his famous symbol)
      const moon = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 6, 12, Math.PI), beltMat);
      moon.position.set(0, 1.38, 0.15);
      moon.rotation.z = Math.PI;
      group.add(moon);

      // Beard
      const beardMat = createGhostMat(0x222222, 0.8);
      const beard = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.08), beardMat);
      beard.position.set(0, 1.02, 0.12);
      group.add(beard);
      break;
    }

    case 'phantom_heroine': {
      // Phantom Heroine - graceful female figure in flowing white robes
      createHumanBase(0xeeeeff, 0xffffff, 0xeeeeff, 0x222233, 0.6);

      // Long flowing hair reaching down the back
      const hairMat = createGhostMat(0x222233, 0.7);
      const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.7, 0.08), hairMat);
      hairBack.position.set(0, 0.95, -0.14);
      group.add(hairBack);

      // Hair sides framing face
      const hairLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.1), hairMat);
      hairLeft.position.set(-0.18, 1.15, 0.05);
      group.add(hairLeft);
      const hairRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.1), hairMat);
      hairRight.position.set(0.18, 1.15, 0.05);
      group.add(hairRight);

      // Red sash (symbolizing grievance/blood)
      const sashMat = createGhostMat(0x8b0000, 0.8);
      const sash = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.04), sashMat);
      sash.position.set(0.18, 0.6, 0.14);
      sash.rotation.z = -0.2;
      group.add(sash);

      // Delicate hands held together
      const handsMat = createGhostMat(0xeeeeff, 0.7);
      const hands = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.1), handsMat);
      hands.position.set(0, 0.55, 0.12);
      group.add(hands);
      break;
    }

    case 'corporeal_ghost': {
      // Corporeal Ghost - looks almost completely human, just slightly pale
      createHumanBase(0xd8d8e8, 0x4a5a6a, 0x3a4a5a, 0x1a1a24, 0.88);

      // She looks so human, add subtle details
      // Earrings
      const earringMat = createGhostMat(0xaaaacc, 0.9);
      const leftEarring = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), earringMat);
      leftEarring.position.set(-0.17, 1.15, 0.08);
      group.add(leftEarring);
      const rightEarring = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), earringMat);
      rightEarring.position.set(0.17, 1.15, 0.08);
      group.add(rightEarring);

      // Longer hair
      const hairMat = createGhostMat(0x1a1a24, 0.85);
      const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.06), hairMat);
      hairBack.position.set(0, 1.1, -0.13);
      group.add(hairBack);
      break;
    }

    case 'shen_xiu': {
      // Shen Xiu - tragic figure, disheveled appearance, visible wounds
      createHumanBase(0xbbccdd, 0x3a4a5a, 0x2a3a4a, 0x222233, 0.7);

      // Disheveled hair (tilted)
      const messyHair = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.14, 0.32),
        createGhostMat(0x222233, 0.7)
      );
      messyHair.position.y = 1.42;
      messyHair.rotation.z = 0.15;
      group.add(messyHair);

      // Wound marks on torso (dark red stains)
      const woundMat = createGhostMat(0x550022, 0.85);
      const wound1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.02), woundMat);
      wound1.position.set(0.08, 0.82, 0.13);
      group.add(wound1);
      const wound2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), woundMat);
      wound2.position.set(-0.05, 0.7, 0.13);
      group.add(wound2);

      // Torn sleeve
      const tornMat = createGhostMat(0x2a3a4a, 0.6);
      const tornSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.06), tornMat);
      tornSleeve.position.set(-0.32, 0.52, 0);
      tornSleeve.rotation.z = 0.3;
      group.add(tornSleeve);
      break;
    }

    case 'magistrate_teng_ghost': {
      // The Wronged Ghost - anguished spirit, reaching out pleadingly
      createHumanBase(0xaabbcc, 0x555566, 0x444455, 0x333344, 0.55);

      // Arms reaching forward (pleading gesture)
      const armMat = createGhostMat(0x555566, 0.55);
      // Override arm positions
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.position.x === -0.28 && child.position.y === 0.7) {
          child.position.set(-0.22, 0.75, 0.15);
          child.rotation.x = -0.5;
        }
        if (child instanceof THREE.Mesh && child.position.x === 0.28 && child.position.y === 0.7) {
          child.position.set(0.22, 0.75, 0.15);
          child.rotation.x = -0.5;
        }
      });

      // Tear marks under eyes
      const tearMat = createGhostMat(0x334455, 0.7);
      const leftTear = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.02), tearMat);
      leftTear.position.set(-0.08, 1.12, 0.15);
      group.add(leftTear);
      const rightTear = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.02), tearMat);
      rightTear.position.set(0.08, 1.12, 0.15);
      group.add(rightTear);
      break;
    }

    case 'underworld_bureaucrat': {
      // Underworld Bureaucrat - formal official in dark robes, holding ledger
      createHumanBase(0xaabbcc, 0x1a1a2a, 0x1a1a2a, 0x111111, 0.8);

      // Official cap
      const capMat = createGhostMat(0x1a1a2a, 0.85);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.3), capMat);
      cap.position.y = 1.5;
      group.add(cap);

      // Ledger/registry book in hand
      const bookMat = createGhostMat(0xddddcc, 0.9);
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.03), bookMat);
      book.position.set(-0.3, 0.6, 0.1);
      book.rotation.z = 0.2;
      group.add(book);

      // Brush/pen in other hand
      const brushMat = createGhostMat(0x332211, 0.9);
      const brush = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 6), brushMat);
      brush.position.set(0.3, 0.5, 0.08);
      brush.rotation.z = 0.3;
      group.add(brush);
      break;
    }

    case 'hungry_ghost': {
      // Hungry Ghost - emaciated figure with distended belly
      // Don't use standard base - custom thin body
      const ghostMat = createGhostMat(0x778899, 0.6);
      const skinMat = createGhostMat(0x99aabb, 0.65);

      // Distended belly
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), ghostMat);
      belly.position.y = 0.65;
      belly.scale.set(1, 1.1, 0.9);
      group.add(belly);

      // Thin torso above belly
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.15), ghostMat);
      torso.position.y = 1.0;
      group.add(torso);

      // Emaciated limbs
      const limbMat = createGhostMat(0x667788, 0.6);

      // Thin arms
      const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.45, 6), limbMat);
      leftArm.position.set(-0.2, 0.8, 0);
      leftArm.rotation.z = 0.3;
      group.add(leftArm);
      const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.45, 6), limbMat);
      rightArm.position.set(0.2, 0.8, 0);
      rightArm.rotation.z = -0.3;
      group.add(rightArm);

      // Thin legs
      const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.4, 6), limbMat);
      leftLeg.position.set(-0.1, 0.2, 0);
      group.add(leftLeg);
      const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.4, 6), limbMat);
      rightLeg.position.set(0.1, 0.2, 0);
      group.add(rightLeg);

      // Large head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), skinMat);
      head.position.y = 1.25;
      group.add(head);

      // Sunken eyes
      const eyeMat = createGhostMat(0x223344, 0.9);
      const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
      leftEye.position.set(-0.07, 1.28, 0.14);
      group.add(leftEye);
      const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
      rightEye.position.set(0.07, 1.28, 0.14);
      group.add(rightEye);

      // Tiny needle-thin throat
      const throat = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6), limbMat);
      throat.position.set(0, 1.08, 0);
      group.add(throat);
      break;
    }

    case 'qutu_zhongren': {
      // Qutu Zhongren - dark, menacing figure
      createHumanBase(0x99aabb, 0x2a2a3a, 0x1a1a2a, 0x111111, 0.75);

      // Blood-stained hands
      const bloodMat = createGhostMat(0x660022, 0.85);
      // Override hand colors
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const pos = child.position;
          if ((pos.x === -0.28 || pos.x === 0.28) && pos.y === 0.45) {
            child.material = bloodMat;
          }
        }
      });

      // Dark aura around him
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x220011,
        transparent: true,
        opacity: 0.12,
      });
      const aura = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), auraMat);
      aura.position.y = 0.8;
      group.add(aura);

      // Sinister smile
      const smileMat = createGhostMat(0x330011, 0.9);
      const smile = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), smileMat);
      smile.position.set(0, 1.08, 0.15);
      group.add(smile);
      break;
    }

    case 'fox_spirit': {
      // Fox Spirit - beautiful human form with subtle fox features
      createHumanBase(0xeeddcc, 0x995533, 0x884422, 0x111111, 0.8);

      // Long flowing black hair
      const hairMat = createGhostMat(0x111111, 0.85);
      const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.6, 0.08), hairMat);
      hairBack.position.set(0, 1.0, -0.13);
      group.add(hairBack);

      // Fox ears (subtle, could be mistaken for hair ornaments)
      const earMat = createGhostMat(0xcc7744, 0.8);
      const leftEar = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), earMat);
      leftEar.position.set(-0.14, 1.48, -0.02);
      group.add(leftEar);
      const rightEar = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 4), earMat);
      rightEar.position.set(0.14, 1.48, -0.02);
      group.add(rightEar);

      // Golden fox eyes
      const eyeMat = createGhostMat(0xddaa00, 0.95);
      // Override eye colors
      group.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
          const pos = child.position;
          if (pos.y > 1.1 && pos.y < 1.3 && Math.abs(pos.x) < 0.15) {
            child.material = eyeMat;
          }
        }
      });

      // Fox tail (partially hidden behind robes)
      const tailMat = createGhostMat(0xcc7744, 0.75);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.08, 0.4, 6), tailMat);
      tail.position.set(0, 0.4, -0.2);
      tail.rotation.x = -0.6;
      group.add(tail);
      const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), createGhostMat(0xeeeecc, 0.8));
      tailTip.position.set(0, 0.55, -0.38);
      group.add(tailTip);
      break;
    }

    case 'ghost_witness': {
      // Ghost Witness - formal, composed figure
      createHumanBase(0xbbccdd, 0x4a4a5a, 0x3a3a4a, 0x222233, 0.7);

      // Hands clasped in formal posture
      const handsMat = createGhostMat(0xbbccdd, 0.7);
      const clasped = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.1), handsMat);
      clasped.position.set(0, 0.55, 0.12);
      group.add(clasped);

      // Simple official headpiece
      const headpiece = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.06, 0.26),
        createGhostMat(0x3a3a4a, 0.75)
      );
      headpiece.position.y = 1.48;
      group.add(headpiece);
      break;
    }

    default: {
      // Default - basic human ghost
      createHumanBase(0xaabbcc, 0x555566, 0x444455, 0x333344, 0.6);
    }
  }

  // Add point light for actual illumination (will be controlled in update)
  const glowLight = new THREE.PointLight(0xaaddff, 1.5, 8);
  glowLight.position.set(0, 1, 0);
  glowLight.name = 'glowLight';
  group.add(glowLight);

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
  const brown = 0x8b4513;
  const tan = 0xdeb887;

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
  const lightGray = 0xc0c0c0;

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
  const pink = 0xffaaaa;

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
    { body: 0x8b4513, belly: 0xd2b48c }, // Brown
    { body: 0x111111, belly: 0x333333 }, // Black
    { body: 0xffffff, belly: 0xeeeeee }, // White
    { body: 0xd2691e, belly: 0xf5deb3 }, // Tan
    { body: 0x808080, belly: 0xa9a9a9 }, // Gray
    { body: 0xa0522d, belly: 0xdeb887 }, // Sienna
  ];
  const colorIdx = Math.floor(Math.random() * dogColors.length);
  const colorScheme = dogColors[colorIdx] ?? { body: 0x8b4513, belly: 0xd2b48c };

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

// Spawn ambient ghosts that appear/disappear
function spawnAmbientGhosts() {
  const ghostCount = 20; // Number of ambient ghosts wandering the city

  for (let i = 0; i < ghostCount; i++) {
    const mesh = createAmbientGhostMesh();
    const x = -35 + Math.random() * 70;
    const z = -70 + Math.random() * 75;

    mesh.position.set(x, 0.3, z); // Slightly elevated for floating effect
    mesh.visible = Math.random() > 0.5; // Some start visible, some don't
    outdoorScene.add(mesh);

    const ghost: AmbientGhost = {
      mesh,
      x,
      z,
      targetX: x + (Math.random() - 0.5) * 15,
      targetZ: z + (Math.random() - 0.5) * 15,
      speed: 0.03 + Math.random() * 0.015, // Walk like normal people
      visible: mesh.visible,
      nextToggleTime: Date.now() + GHOST_TOGGLE_INTERVAL * (0.5 + Math.random()), // Stagger initial toggles
      fadeAlpha: mesh.visible ? 0.4 : 0,
      fadeDirection: 0,
      floatOffset: Math.random() * Math.PI * 2,
    };

    ambientGhosts.push(ghost);
  }
}

// The supernatural characters who carry scrolls
const supernaturalNPCs: NPC[] = [];

// Spawn the 10 unique supernatural characters at fixed locations
function spawnSupernaturalCharacters() {
  // Fixed spawn locations spread across the city - closer to player spawn (0,0)
  const spawnLocations = [
    { x: -8, z: -8 }, // Judge Bao - very close to spawn
    { x: 10, z: -12 }, // Phantom Heroine
    { x: -15, z: -20 }, // Corporeal Ghost
    { x: 18, z: -25 }, // Shen Xiu
    { x: -20, z: -35 }, // Wronged Ghost
    { x: 5, z: -40 }, // Underworld Bureaucrat
    { x: 25, z: -45 }, // Hungry Ghost
    { x: -25, z: -50 }, // Qutu Zhongren
    { x: 15, z: -55 }, // Fox Spirit
    { x: -10, z: -60 }, // Ghost Witness
  ];

  for (let i = 0; i < supernaturalCharacters.length; i++) {
    const char = supernaturalCharacters[i];
    if (!char) continue;

    const location = spawnLocations[i] ?? { x: Math.random() * 40 - 20, z: -40 + Math.random() * 30 };
    const mesh = createSupernaturalMesh(char.id);

    mesh.position.set(location.x, 0.15, location.z); // Slightly floating
    outdoorScene.add(mesh);

    const scrollId = i + 1; // Scroll IDs 1-10

    const npcData: NPC = {
      mesh,
      x: location.x,
      z: location.z,
      targetX: location.x + (Math.random() - 0.5) * 10,
      targetZ: location.z + (Math.random() - 0.5) * 10,
      speed: 0.035, // Move like regular people, slightly slower
      type: 'person',
      indoor: false,
      buildingIdx: -1,
      floorIdx: -1,
      hasScroll: true,
      scrollId,
      scrollCollected: collectedScrolls.includes(scrollId),
      characterId: char.id,
      characterName: char.name,
    };

    supernaturalNPCs.push(npcData);
    outdoorNPCs.push(npcData); // Also add to outdoor NPCs for collision/interaction
    assignedScrollIds.add(scrollId);
  }
}

// Spawn outdoor NPCs
function spawnOutdoorNPCs() {
  // Spawn various NPCs in the city - increased counts
  // 41 people, 10 dogs, 11 foxes, 8 monkeys, 13 squirrels, 26 mice = 109 total
  // Note: Regular NPCs no longer carry scrolls - only supernatural characters do
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
        case 'fox':
          mesh = createFoxMesh();
          break;
        case 'monkey':
          mesh = createMonkeyMesh();
          break;
        case 'squirrel':
          mesh = createSquirrelMesh();
          break;
        case 'mouse':
          mesh = createMouseMesh();
          break;
        case 'dog':
          mesh = createDogMesh();
          break;
        default:
          mesh = createPersonMesh();
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
        floorIdx: -1,
        // Regular NPCs no longer have scrolls
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

  // Note: Indoor NPCs no longer carry scrolls - only supernatural characters in the outdoor area do

  // Spawn 8-14 NPCs per floor (mix of types) - 30% more
  const count = 8 + Math.floor(Math.random() * 7); // 8-14 NPCs per floor
  for (let i = 0; i < count; i++) {
    // Random type selection - more people and dogs indoors
    const roll = Math.random();
    let type: NPC['type'];
    let mesh: THREE.Group;
    let speed: number;

    if (roll < 0.45) {
      type = 'person';
      mesh = createPersonMesh();
      speed = 0.03;
    } else if (roll < 0.6) {
      type = 'dog';
      mesh = createDogMesh();
      speed = 0.04;
    } else if (roll < 0.7) {
      type = 'fox';
      mesh = createFoxMesh();
      speed = 0.05;
    } else if (roll < 0.78) {
      type = 'monkey';
      mesh = createMonkeyMesh();
      speed = 0.045;
    } else if (roll < 0.9) {
      type = 'squirrel';
      mesh = createSquirrelMesh();
      speed = 0.07;
    } else {
      type = 'mouse';
      mesh = createMouseMesh();
      speed = 0.08;
    }

    // Random position on floor (avoiding edges)
    const x = -floorW / 2 + 3 + Math.random() * (floorW - 6);
    const z = -floorD / 2 + 3 + Math.random() * (floorD - 6);

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
      floorIdx,
      // Indoor NPCs no longer have scrolls
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
  const npcsToUpdate =
    state.mode === 'outdoor'
      ? outdoorNPCs
      : state.mode === 'underground'
        ? undergroundNPCs
        : indoorNPCs;

  // Room definitions for indoor collision (same as player)
  const doorW = 1.6;
  type RoomDef = {
    x: number;
    z: number;
    w: number;
    d: number;
    door: 'front' | 'back' | 'left' | 'right';
  };

  function getIndoorRooms(): RoomDef[] {
    if (!floor) return [];
    const hw = floor.w / 2,
      hd = floor.d / 2;

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
  function checkRoomCollision(
    x: number,
    z: number,
    oldX: number,
    oldZ: number,
    rooms: RoomDef[]
  ): { x: number; z: number } {
    const wallT = 0.5;
    const doorHalf = doorW / 2;
    let newX = x,
      newZ = z;

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
      } else if (
        newX > left &&
        newX < right &&
        newZ > back - wallT &&
        newZ < back + wallT &&
        (newX < room.x - doorHalf || newX > room.x + doorHalf)
      ) {
        newZ = oldZ >= back ? back + wallT : back - wallT;
      }

      // Front wall
      if (room.door !== 'front') {
        if (newX > left && newX < right && newZ > front - wallT && newZ < front + wallT) {
          newZ = oldZ <= front ? front - wallT : front + wallT;
        }
      } else if (
        newX > left &&
        newX < right &&
        newZ > front - wallT &&
        newZ < front + wallT &&
        (newX < room.x - doorHalf || newX > room.x + doorHalf)
      ) {
        newZ = oldZ <= front ? front - wallT : front + wallT;
      }

      // Left wall
      if (room.door !== 'left') {
        if (newZ > back && newZ < front && newX > left - wallT && newX < left + wallT) {
          newX = oldX >= left ? left + wallT : left - wallT;
        }
      } else if (
        newZ > back &&
        newZ < front &&
        newX > left - wallT &&
        newX < left + wallT &&
        (newZ < room.z - doorHalf || newZ > room.z + doorHalf)
      ) {
        newX = oldX >= left ? left + wallT : left - wallT;
      }

      // Right wall
      if (room.door !== 'right') {
        if (newZ > back && newZ < front && newX > right - wallT && newX < right + wallT) {
          newX = oldX <= right ? right - wallT : right + wallT;
        }
      } else if (
        newZ > back &&
        newZ < front &&
        newX > right - wallT &&
        newX < right + wallT &&
        (newZ < room.z - doorHalf || newZ > room.z + doorHalf)
      ) {
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
      // Pick new target - wander locally, not across the whole map
      if (state.mode === 'underground') {
        // Underground - large area (100x120), stay dispersed locally
        npc.targetX = npc.x + (Math.random() - 0.5) * 25;
        npc.targetZ = npc.z + (Math.random() - 0.5) * 25;
        // Clamp to underground bounds
        npc.targetX = Math.max(-45, Math.min(45, npc.targetX));
        npc.targetZ = Math.max(-55, Math.min(55, npc.targetZ));
      } else if (npc.indoor) {
        // Indoor building - use floor dimensions
        const hw = floor.w / 2 - 3;
        const hd = floor.d / 2 - 3;
        npc.targetX = npc.x + (Math.random() - 0.5) * 15;
        npc.targetZ = npc.z + (Math.random() - 0.5) * 15;
        npc.targetX = Math.max(-hw, Math.min(hw, npc.targetX));
        npc.targetZ = Math.max(-hd, Math.min(hd, npc.targetZ));
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

      // Apply collision for NPCs
      if (state.mode === 'underground') {
        // Underground collision for NPCs - walls and pillars
        const npcR = 0.4;
        let hitObstacle = false;

        // Internal walls (same as player collision)
        const internalWalls = [
          { x: -30, z: -45, w: 18, d: 0.6 },
          { x: 10, z: -40, w: 22, d: 0.6 },
          { x: -20, z: -25, w: 16, d: 0.6 },
          { x: 25, z: -20, w: 20, d: 0.6 },
          { x: -35, z: -5, w: 14, d: 0.6 },
          { x: 5, z: 0, w: 24, d: 0.6 },
          { x: 35, z: 5, w: 12, d: 0.6 },
          { x: -25, z: 20, w: 18, d: 0.6 },
          { x: 15, z: 25, w: 16, d: 0.6 },
          { x: -10, z: 40, w: 20, d: 0.6 },
          { x: 30, z: 35, w: 14, d: 0.6 },
          { x: -35, z: 50, w: 16, d: 0.6 },
          { x: -40, z: -30, w: 0.6, d: 20 },
          { x: -25, z: -35, w: 0.6, d: 16 },
          { x: -10, z: -15, w: 0.6, d: 22 },
          { x: 5, z: -30, w: 0.6, d: 18 },
          { x: 20, z: -10, w: 0.6, d: 24 },
          { x: 35, z: -35, w: 0.6, d: 14 },
          { x: -38, z: 15, w: 0.6, d: 20 },
          { x: -20, z: 30, w: 0.6, d: 18 },
          { x: 0, z: 20, w: 0.6, d: 16 },
          { x: 18, z: 45, w: 0.6, d: 22 },
          { x: 38, z: 25, w: 0.6, d: 18 },
          { x: -30, z: 45, w: 0.6, d: 14 },
        ];

        // Check wall collision
        for (const wall of internalWalls) {
          const halfW = wall.w / 2 + npcR;
          const halfD = wall.d / 2 + npcR;

          if (
            npc.x > wall.x - halfW &&
            npc.x < wall.x + halfW &&
            npc.z > wall.z - halfD &&
            npc.z < wall.z + halfD
          ) {
            npc.x = oldX;
            npc.z = oldZ;
            hitObstacle = true;
            break;
          }
        }

        // Check pillar collision
        if (!hitObstacle) {
          const pillarSize = 1.2;
          for (let px = -35; px <= 35; px += 20) {
            for (let pz = -50; pz <= 50; pz += 25) {
              const halfP = pillarSize / 2 + npcR;

              if (
                npc.x > px - halfP &&
                npc.x < px + halfP &&
                npc.z > pz - halfP &&
                npc.z < pz + halfP
              ) {
                npc.x = oldX;
                npc.z = oldZ;
                hitObstacle = true;
                break;
              }
            }
            if (hitObstacle) break;
          }
        }

        // Clamp to bounds
        npc.x = Math.max(-45, Math.min(45, npc.x));
        npc.z = Math.max(-55, Math.min(55, npc.z));

        if (hitObstacle) {
          // Pick a new random direction
          npc.targetX = npc.x + (Math.random() - 0.5) * 20;
          npc.targetZ = npc.z + (Math.random() - 0.5) * 20;
          npc.targetX = Math.max(-45, Math.min(45, npc.targetX));
          npc.targetZ = Math.max(-55, Math.min(55, npc.targetZ));
        }
      } else if (npc.indoor && indoorRooms.length > 0) {
        // Indoor building room collision
        const collision = checkRoomCollision(npc.x, npc.z, oldX, oldZ, indoorRooms);
        npc.x = collision.x;
        npc.z = collision.z;

        // If NPC hit a wall, pick a new target
        if (npc.x !== oldX + moveX || npc.z !== oldZ + moveZ) {
          const hw = floor.w / 2 - 3;
          const hd = floor.d / 2 - 3;
          npc.targetX = npc.x + (Math.random() - 0.5) * 10;
          npc.targetZ = npc.z + (Math.random() - 0.5) * 10;
          npc.targetX = Math.max(-hw, Math.min(hw, npc.targetX));
          npc.targetZ = Math.max(-hd, Math.min(hd, npc.targetZ));
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
      const actualType = npc.isShapeshifter && npc.isTransformed ? 'person' : npc.type;
      switch (actualType) {
        case 'dog':
          bobSpeed = 90;
          bobHeight = 0.1;
          break;
        case 'fox':
          bobSpeed = 80;
          bobHeight = 0.08;
          break;
        case 'monkey':
          bobSpeed = 100;
          bobHeight = 0.1;
          break;
        case 'squirrel':
          bobSpeed = 50;
          bobHeight = 0.05;
          break;
        case 'mouse':
          bobSpeed = 40;
          bobHeight = 0.03;
          break;
      }
      npc.mesh.position.y = Math.abs(Math.sin(Date.now() / bobSpeed)) * bobHeight;
    }
  }
}

// Update ambient ghosts - handle fading in/out and floating animation
function updateAmbientGhosts() {
  if (state.mode !== 'outdoor') return; // Only update when in outdoor mode

  const now = Date.now();

  for (const ghost of ambientGhosts) {
    // Check if it's time to toggle visibility
    if (now >= ghost.nextToggleTime) {
      if (ghost.visible) {
        // Start fading out
        ghost.fadeDirection = -1;
      } else {
        // Start fading in
        ghost.fadeDirection = 1;
      }
      ghost.nextToggleTime = now + GHOST_TOGGLE_INTERVAL + (Math.random() - 0.5) * 5000;
    }

    // Handle fading
    if (ghost.fadeDirection !== 0) {
      ghost.fadeAlpha += ghost.fadeDirection * GHOST_FADE_SPEED;

      if (ghost.fadeAlpha >= 0.4) {
        ghost.fadeAlpha = 0.4;
        ghost.fadeDirection = 0;
        ghost.visible = true;
        ghost.mesh.visible = true;
      } else if (ghost.fadeAlpha <= 0) {
        ghost.fadeAlpha = 0;
        ghost.fadeDirection = 0;
        ghost.visible = false;
        ghost.mesh.visible = false;
      }

      // Update material opacity for all children
      ghost.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
          child.material.opacity = ghost.fadeAlpha;
        }
      });
    }

    // Floating animation (when visible) - subtle hover just above ground
    if (ghost.visible || ghost.fadeAlpha > 0) {
      ghost.floatOffset += 0.015;
      const floatY = 0.1 + Math.sin(ghost.floatOffset) * 0.05; // Subtle float
      ghost.mesh.position.y = floatY;
    }

    // Move around like normal people
    if (ghost.visible) {
      // Occasionally pick new target - more frequently for natural movement
      if (Math.random() < 0.008) {
        ghost.targetX = ghost.x + (Math.random() - 0.5) * 20;
        ghost.targetZ = ghost.z + (Math.random() - 0.5) * 20;
        // Keep within bounds
        ghost.targetX = Math.max(-35, Math.min(35, ghost.targetX));
        ghost.targetZ = Math.max(-70, Math.min(5, ghost.targetZ));
      }

      // Move toward target at normal walking speed
      const dx = ghost.targetX - ghost.x;
      const dz = ghost.targetZ - ghost.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.5) {
        ghost.x += (dx / dist) * ghost.speed;
        ghost.z += (dz / dist) * ghost.speed;
        ghost.mesh.position.x = ghost.x;
        ghost.mesh.position.z = ghost.z;

        // Face movement direction
        ghost.mesh.rotation.y = Math.atan2(dx, dz);
      }
    }
  }
}

// Update supernatural character movement and floating effect
function updateSupernaturalCharacters() {
  if (state.mode !== 'outdoor') return;

  for (const npc of supernaturalNPCs) {
    // Movement like regular NPCs - occasionally pick new random targets
    if (Math.random() < 0.008) {
      // Pick a new target within a reasonable range
      npc.targetX = npc.x + (Math.random() - 0.5) * 20;
      npc.targetZ = npc.z + (Math.random() - 0.5) * 20;
      // Keep within city bounds
      npc.targetX = Math.max(-35, Math.min(35, npc.targetX));
      npc.targetZ = Math.max(-70, Math.min(5, npc.targetZ));
    }

    // Move toward target
    const dx = npc.targetX - npc.x;
    const dz = npc.targetZ - npc.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.5) {
      // Move toward target
      npc.x += (dx / dist) * npc.speed;
      npc.z += (dz / dist) * npc.speed;
      npc.mesh.position.x = npc.x;
      npc.mesh.position.z = npc.z;

      // Face movement direction
      npc.mesh.rotation.y = Math.atan2(dx, dz);
    }

    // Gentle floating bob - just slightly above ground
    const floatY = 0.12 + Math.sin(Date.now() / 800 + npc.x * 0.5) * 0.06;
    npc.mesh.position.y = floatY;

    // Determine glow intensity based on whether scroll has been collected
    const hasUncollectedScroll = npc.hasScroll && !npc.scrollCollected;
    const pulseValue = Math.sin(Date.now() / 500 + npc.x) * 0.5 + 0.5; // 0 to 1

    // Update body glow shells (the glowGroup contains all body-shaped glow meshes)
    npc.mesh.traverse((child) => {
      // Find the glow group and update all glow shells inside it
      if (child instanceof THREE.Group && child.name === 'glowGroup') {
        child.traverse((glowChild) => {
          if (glowChild instanceof THREE.Mesh && glowChild.material instanceof THREE.MeshBasicMaterial) {
            if (hasUncollectedScroll) {
              // Bright pulsing glow for uncollected
              glowChild.material.opacity = 0.25 + pulseValue * 0.2;
              glowChild.material.color.setHex(0xaaddff);
              glowChild.visible = true;
            } else {
              // Very dim glow for collected
              glowChild.material.opacity = 0.03;
              glowChild.material.color.setHex(0x445566);
              glowChild.visible = true;
            }
          }
        });
      }

      // Update the point light
      if (child instanceof THREE.PointLight || child.name === 'glowLight') {
        if (child instanceof THREE.PointLight) {
          if (hasUncollectedScroll) {
            child.intensity = 1.2 + pulseValue * 0.8;
            child.distance = 10;
            child.color.setHex(0xaaddff);
          } else {
            child.intensity = 0.1;
            child.distance = 2;
            child.color.setHex(0x333344);
          }
        }
      }
    });

    // Update emissive on all body materials for inner glow effect
    npc.mesh.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshLambertMaterial &&
        child.name !== 'glowShell'
      ) {
        if (hasUncollectedScroll) {
          // Strong emissive glow that pulses
          child.material.emissiveIntensity = 0.2 + pulseValue * 0.15;
        } else {
          // Very subtle emissive when collected
          child.material.emissiveIntensity = 0.02;
        }
      }
    });
  }
}

// Initialize outdoor NPCs
spawnOutdoorNPCs();
// Spawn supernatural characters (the 10 unique ghosts with scrolls)
spawnSupernaturalCharacters();
// Spawn ambient ghosts (wandering spectral figures)
spawnAmbientGhosts();

// ============================================
// INDOOR SCENE
// ============================================
const indoorAmbient = new THREE.AmbientLight(0xffffff, 0.5);
indoorScene.add(indoorAmbient);

let currentFloorGroup: THREE.Group | null = null;

function createFloorView(buildingIdx: number, floor: number) {
  if (currentFloorGroup) indoorScene.remove(currentFloorGroup);

  const bd = buildingsData[buildingIdx];
  if (!bd)
    return {
      w: 28,
      d: 20,
      top: false,
      ground: true,
      leftRoof: false,
      rightRoof: false,
      northRoof: false,
      southRoof: false,
      northIdx: -1,
      southIdx: -1,
    };

  const group = new THREE.Group();
  const w = 50,
    d = 36,
    wallH = 4;
  const isTop = floor === bd.floors - 1;
  const isGround = floor === 0;
  const hasLeftBuilding = buildingIdx > 0;
  const hasRightBuilding = buildingIdx < buildingsData.length - 1;

  // Find buildings to the north (z - 12) and south (z + 12) at similar x position
  let northBuildingIdx = -1;
  let southBuildingIdx = -1;
  for (let i = 0; i < buildingsData.length; i++) {
    const otherBd = buildingsData[i];
    if (!otherBd || i === buildingIdx) continue;
    const xDiff = Math.abs(otherBd.x - bd.x);
    const zDiff = otherBd.z - bd.z;
    // Must be within 5 units x-wise and exactly one row apart (12 units z)
    if (xDiff < 5) {
      if (zDiff > 10 && zDiff < 14) southBuildingIdx = i; // South is positive Z
      if (zDiff < -10 && zDiff > -14) northBuildingIdx = i; // North is negative Z
    }
  }
  const hasNorthBuilding = northBuildingIdx >= 0;
  const hasSouthBuilding = southBuildingIdx >= 0;

  // ====== ROOF (Top Floor) - KWC Style: Antenna forest, debris, chaos ======
  if (isTop) {
    // Weathered concrete roof floor with stains
    const roofFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshLambertMaterial({ color: 0x4a4a48 })
    );
    roofFloor.rotation.x = -Math.PI / 2;
    roofFloor.position.y = 0.01;
    group.add(roofFloor);

    // Water stains and damage patches
    for (let i = 0; i < 12; i++) {
      const stain = new THREE.Mesh(
        new THREE.CircleGeometry(0.5 + Math.random() * 1.5, 8),
        new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x3a3a38 : 0x404038 })
      );
      stain.rotation.x = -Math.PI / 2;
      stain.position.set((Math.random() - 0.5) * w * 0.9, 0.02, (Math.random() - 0.5) * d * 0.9);
      group.add(stain);
    }

    // Cracks
    for (let i = 0; i < 15; i++) {
      const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, 1.5 + Math.random() * 4),
        new THREE.MeshBasicMaterial({ color: 0x2a2a2a })
      );
      crack.rotation.x = -Math.PI / 2;
      crack.rotation.z = Math.random() * Math.PI;
      crack.position.set((Math.random() - 0.5) * w * 0.85, 0.025, (Math.random() - 0.5) * d * 0.85);
      group.add(crack);
    }

    // Low wall around edge
    const edgeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
    const edgeH = 1.2;
    const backEdge = new THREE.Mesh(new THREE.BoxGeometry(w, edgeH, 0.4), edgeMat);
    backEdge.position.set(0, edgeH / 2, -d / 2 + 0.2);
    group.add(backEdge);

    // ========== ANTENNA FOREST (KWC signature) ==========
    const antennaMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const antennaRustMat = new THREE.MeshLambertMaterial({ color: 0x6a4a3a });

    // Create multiple antenna clusters
    for (let cluster = 0; cluster < 6; cluster++) {
      const cx = (Math.random() - 0.5) * w * 0.7;
      const cz = (Math.random() - 0.5) * d * 0.6;

      // Main pole
      const poleH = 3 + Math.random() * 2;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, poleH, 6),
        Math.random() > 0.5 ? antennaMat : antennaRustMat
      );
      pole.position.set(cx, poleH / 2, cz);
      group.add(pole);

      // TV antenna arms (the horizontal bars)
      const numArms = 3 + Math.floor(Math.random() * 4);
      for (let a = 0; a < numArms; a++) {
        const armLen = 1 + Math.random() * 1.5;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, armLen, 4), antennaMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(cx, poleH * 0.5 + a * 0.4, cz);
        group.add(arm);

        // Vertical elements on arm
        for (let v = 0; v < 5; v++) {
          const el = new THREE.Mesh(
            new THREE.CylinderGeometry(0.015, 0.015, 0.3 + Math.random() * 0.3, 4),
            antennaMat
          );
          el.position.set(cx - armLen / 2 + (v * armLen) / 4, poleH * 0.5 + a * 0.4 + 0.15, cz);
          group.add(el);
        }
      }

      // Cross bars and diagonal supports
      const crossBar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2, 4), antennaMat);
      crossBar.rotation.x = Math.PI / 4;
      crossBar.position.set(cx, poleH * 0.3, cz);
      group.add(crossBar);
    }

    // Standalone thin antennas scattered around
    for (let i = 0; i < 12; i++) {
      const ax = (Math.random() - 0.5) * w * 0.8;
      const az = (Math.random() - 0.5) * d * 0.7;
      const ah = 2 + Math.random() * 3;
      const thinAnt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.04, ah, 4),
        Math.random() > 0.3 ? antennaMat : antennaRustMat
      );
      thinAnt.position.set(ax, ah / 2, az);
      // Slight tilt
      thinAnt.rotation.x = (Math.random() - 0.5) * 0.2;
      thinAnt.rotation.z = (Math.random() - 0.5) * 0.2;
      group.add(thinAnt);
    }

    // ========== SATELLITE DISHES (multiple) ==========
    for (let i = 0; i < 3; i++) {
      const dishX = (Math.random() - 0.5) * w * 0.6;
      const dishZ = (Math.random() - 0.5) * d * 0.5;
      const dishSize = 0.8 + Math.random() * 0.8;
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(dishSize, 10, 6, 0, Math.PI),
        new THREE.MeshLambertMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide })
      );
      dish.rotation.x = -Math.PI / 3 - Math.random() * 0.3;
      dish.rotation.y = Math.random() * Math.PI * 2;
      dish.position.set(dishX, 1 + Math.random(), dishZ);
      group.add(dish);

      // Dish mount
      const mount = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.08, 1.2, 6),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      mount.position.set(dishX, 0.6, dishZ);
      group.add(mount);
    }

    // ========== MAKESHIFT SHED/STRUCTURE ==========
    const shedX = w / 2 - 5;
    const shedZ = -d / 2 + 5;
    // Corrugated metal walls
    const shedMat = new THREE.MeshLambertMaterial({ color: 0x5a6a5a });
    const shedBack = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.1), shedMat);
    shedBack.position.set(shedX, 1.25, shedZ - 2);
    group.add(shedBack);
    const shedLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 4), shedMat);
    shedLeft.position.set(shedX - 2, 1.25, shedZ);
    group.add(shedLeft);
    const shedRight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 4), shedMat);
    shedRight.position.set(shedX + 2, 1.25, shedZ);
    group.add(shedRight);
    // Roof
    const shedRoof = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 4.5), shedMat);
    shedRoof.position.set(shedX, 2.6, shedZ);
    shedRoof.rotation.x = 0.1;
    group.add(shedRoof);

    // ========== WATER TANKS (multiple) ==========
    const tankMat = new THREE.MeshLambertMaterial({ color: 0x3a5060 });
    const tank1 = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 10), tankMat);
    tank1.position.set(-w / 2 + 4, 1.5, 2);
    group.add(tank1);

    const tank2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 2), tankMat);
    tank2.position.set(-w / 2 + 5, 1, -d / 2 + 5);
    group.add(tank2);

    // ========== AC UNITS (more of them) ==========
    for (let i = 0; i < 5; i++) {
      const acX = -w / 2 + 3 + i * 4 + Math.random() * 2;
      const acZ = -d / 2 + 2.5 + Math.random() * 2;
      const ac = new THREE.Mesh(
        new THREE.BoxGeometry(1.8 + Math.random(), 1.2, 1.5),
        new THREE.MeshLambertMaterial({ color: 0x5a5a5a + Math.floor(Math.random() * 0x101010) })
      );
      ac.position.set(acX, 0.6, acZ);
      group.add(ac);

      // Fan grill
      const fan = new THREE.Mesh(
        new THREE.CircleGeometry(0.4, 8),
        new THREE.MeshBasicMaterial({ color: 0x333333 })
      );
      fan.rotation.x = Math.PI / 2;
      fan.position.set(acX, 1, acZ - 0.76);
      group.add(fan);
    }

    // ========== DEBRIS AND JUNK ==========
    const debrisColors = [0x6a5a4a, 0x5a5a5a, 0x4a4a4a, 0x7a6a5a, 0x555045];

    // Random debris pile
    for (let i = 0; i < 25; i++) {
      const debrisType = Math.random();
      const dx = (Math.random() - 0.5) * w * 0.8;
      const dz = (Math.random() - 0.5) * d * 0.7;

      if (debrisType < 0.3) {
        // Box/crate
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.4 + Math.random() * 0.6,
            0.3 + Math.random() * 0.5,
            0.4 + Math.random() * 0.6
          ),
          new THREE.MeshLambertMaterial({
            color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
          })
        );
        box.position.set(dx, 0.2, dz);
        box.rotation.y = Math.random() * Math.PI;
        group.add(box);
      } else if (debrisType < 0.5) {
        // Barrel/cylinder
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.2 + Math.random() * 0.2,
            0.2 + Math.random() * 0.2,
            0.5 + Math.random() * 0.5,
            8
          ),
          new THREE.MeshLambertMaterial({
            color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
          })
        );
        barrel.position.set(dx, 0.25, dz);
        if (Math.random() > 0.7) barrel.rotation.x = Math.PI / 2; // Fallen over
        group.add(barrel);
      } else if (debrisType < 0.7) {
        // Flat panel (old door, board, etc)
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(0.8 + Math.random() * 0.8, 0.05, 1.5 + Math.random()),
          new THREE.MeshLambertMaterial({
            color: debrisColors[Math.floor(Math.random() * debrisColors.length)],
          })
        );
        panel.position.set(dx, 0.05 + Math.random() * 0.3, dz);
        panel.rotation.y = Math.random() * Math.PI;
        if (Math.random() > 0.5) panel.rotation.x = Math.random() * 0.3;
        group.add(panel);
      } else {
        // Plastic bag / garbage
        const bag = new THREE.Mesh(
          new THREE.SphereGeometry(0.15 + Math.random() * 0.2, 6, 4),
          new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0x888888 : 0x4a4a4a })
        );
        bag.position.set(dx, 0.15, dz);
        bag.scale.y = 0.6;
        group.add(bag);
      }
    }

    // ========== WIRES AND CABLES ==========
    for (let i = 0; i < 8; i++) {
      const wireLen = 3 + Math.random() * 6;
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, wireLen, 4),
        new THREE.MeshBasicMaterial({ color: 0x222222 })
      );
      wire.rotation.z = Math.PI / 2;
      wire.rotation.y = Math.random() * Math.PI;
      wire.position.set(
        (Math.random() - 0.5) * w * 0.6,
        0.5 + Math.random() * 2,
        (Math.random() - 0.5) * d * 0.5
      );
      group.add(wire);
    }

    // ========== CLOTHESLINES (multiple) ==========
    for (let lineNum = 0; lineNum < 3; lineNum++) {
      const lineZ = -d / 4 + (lineNum * d) / 4;
      const line = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 12, 4),
        new THREE.MeshBasicMaterial({ color: 0x666666 })
      );
      line.rotation.z = Math.PI / 2;
      line.position.set(0, 1.8 + lineNum * 0.3, lineZ);
      group.add(line);

      // Clothes hanging
      const clothColors = [0x8a7060, 0x606878, 0x807870, 0x607060, 0x9a8070, 0x708080];
      for (let c = 0; c < 5 + Math.floor(Math.random() * 3); c++) {
        const cloth = new THREE.Mesh(
          new THREE.PlaneGeometry(0.5 + Math.random() * 0.4, 0.7 + Math.random() * 0.5),
          new THREE.MeshLambertMaterial({
            color: clothColors[Math.floor(Math.random() * clothColors.length)],
            side: THREE.DoubleSide,
          })
        );
        cloth.position.set(-5 + c * 2 + Math.random(), 1.3 + lineNum * 0.3, lineZ);
        cloth.rotation.y = (Math.random() - 0.5) * 0.3;
        group.add(cloth);
      }
    }

    // ========== PIPES RUNNING ACROSS ==========
    const pipeMat = new THREE.MeshLambertMaterial({ color: 0x6a5040 });
    for (let i = 0; i < 6; i++) {
      const pipeLen = 5 + Math.random() * 10;
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.1 + Math.random() * 0.1,
          0.1 + Math.random() * 0.1,
          pipeLen,
          6
        ),
        pipeMat
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(
        -w / 2 + 2 + i * 3,
        0.3 + Math.random() * 0.3,
        (Math.random() - 0.5) * d * 0.5
      );
      group.add(pipe);
    }

    // Front edge - low wall with gap to look/jump down
    const frontEdgeL = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 4, edgeH, 0.4), edgeMat);
    frontEdgeL.position.set(-w / 4 - 2, edgeH / 2, d / 2 - 0.2);
    group.add(frontEdgeL);
    const frontEdgeR = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 4, edgeH, 0.4), edgeMat);
    frontEdgeR.position.set(w / 4 + 2, edgeH / 2, d / 2 - 0.2);
    group.add(frontEdgeR);
    // Gap in middle - can see street below (just dark area)
    const streetBelow = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    streetBelow.rotation.x = -Math.PI / 2;
    streetBelow.position.set(0, -0.5, d / 2);
    group.add(streetBelow);

    // Left edge with adjacent building visible
    if (hasLeftBuilding) {
      const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.4, edgeH, d - 8), edgeMat);
      leftEdge.position.set(-w / 2 + 0.2, edgeH / 2, -2);
      group.add(leftEdge);
      // Adjacent building roof visible
      const adjRoofL = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.3, 8),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      adjRoofL.position.set(-w / 2 - 3, -0.5, d / 2 - 5);
      group.add(adjRoofL);
      // Gap area to jump
      const gapL = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 6),
        new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
      );
      gapL.rotation.x = -Math.PI / 2;
      gapL.position.set(-w / 2 + 1, -0.3, d / 2 - 4);
      group.add(gapL);
    } else {
      const leftEdgeFull = new THREE.Mesh(new THREE.BoxGeometry(0.4, edgeH, d), edgeMat);
      leftEdgeFull.position.set(-w / 2 + 0.2, edgeH / 2, 0);
      group.add(leftEdgeFull);
    }

    // Right edge with adjacent building visible
    if (hasRightBuilding) {
      const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.4, edgeH, d - 8), edgeMat);
      rightEdge.position.set(w / 2 - 0.2, edgeH / 2, -2);
      group.add(rightEdge);
      // Adjacent building roof visible
      const adjRoofR = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.3, 8),
        new THREE.MeshLambertMaterial({ color: 0x444444 })
      );
      adjRoofR.position.set(w / 2 + 3, -0.5, d / 2 - 5);
      group.add(adjRoofR);
      // Gap area to jump
      const gapR = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 6),
        new THREE.MeshBasicMaterial({ color: 0x0a0a0a })
      );
      gapR.rotation.x = -Math.PI / 2;
      gapR.position.set(w / 2 - 1, -0.3, d / 2 - 4);
      group.add(gapR);
    } else {
      const rightEdgeFull = new THREE.Mesh(new THREE.BoxGeometry(0.4, edgeH, d), edgeMat);
      rightEdgeFull.position.set(w / 2 - 0.2, edgeH / 2, 0);
      group.add(rightEdgeFull);
    }

    // Stairwell structure (back right) - small shed with door going down
    const stairShed = new THREE.Mesh(
      new THREE.BoxGeometry(8, 3, 5),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    stairShed.position.set(w / 2 - 5, 1.5, -d / 2 + 4);
    group.add(stairShed);
    // Door on stairwell
    const stairDoor = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 2.5),
      new THREE.MeshLambertMaterial({ color: 0x4a4035 })
    );
    stairDoor.position.set(w / 2 - 5, 1.25, -d / 2 + 6.6);
    group.add(stairDoor);
    // Dim light by door
    const stairLight = new THREE.PointLight(0xffeecc, 0.5, 6);
    stairLight.position.set(w / 2 - 5, 2.5, -d / 2 + 7);
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
    wallBack.position.set(0, wallH / 2, -d / 2);
    group.add(wallBack);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH, d), wallMat);
    wallLeft.position.set(-w / 2, wallH / 2, 0);
    group.add(wallLeft);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH, d), wallMat);
    wallRight.position.set(w / 2, wallH / 2, 0);
    group.add(wallRight);
    // Front wall with exit
    const wallFrontL = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 3, wallH, 0.2), wallMat);
    wallFrontL.position.set(-w / 4 - 1.5, wallH / 2, d / 2);
    group.add(wallFrontL);
    const wallFrontR = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 3, wallH, 0.2), wallMat);
    wallFrontR.position.set(w / 4 + 1.5, wallH / 2, d / 2);
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
        box.position.set(-w / 2 + 0.4, 1.5 + r * 0.6, 8 + c * 0.8);
        group.add(box);
      }
    }

    // ========== CRAMPED BEDROOMS around lobby edges ==========
    // Helper to create a lobby room with solid walls
    function createLobbyRoom(
      x: number,
      z: number,
      rw: number,
      rd: number,
      doorSide: 'left' | 'right' | 'front' | 'back',
      colorIdx: number
    ) {
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
        back.position.set(x, wallH / 2, z - rd / 2);
        group.add(back);
      } else {
        const backL = new THREE.Mesh(
          new THREE.BoxGeometry((rw - doorW) / 2, wallH, 0.15),
          roomWallMat
        );
        backL.position.set(x - rw / 4 - doorW / 4, wallH / 2, z - rd / 2);
        group.add(backL);
        const backR = new THREE.Mesh(
          new THREE.BoxGeometry((rw - doorW) / 2, wallH, 0.15),
          roomWallMat
        );
        backR.position.set(x + rw / 4 + doorW / 4, wallH / 2, z - rd / 2);
        group.add(backR);
      }

      // Front wall
      if (doorSide !== 'front') {
        const front = new THREE.Mesh(new THREE.BoxGeometry(rw, wallH, 0.15), roomWallMat);
        front.position.set(x, wallH / 2, z + rd / 2);
        group.add(front);
      } else {
        const frontL = new THREE.Mesh(
          new THREE.BoxGeometry((rw - doorW) / 2, wallH, 0.15),
          roomWallMat
        );
        frontL.position.set(x - rw / 4 - doorW / 4, wallH / 2, z + rd / 2);
        group.add(frontL);
        const frontR = new THREE.Mesh(
          new THREE.BoxGeometry((rw - doorW) / 2, wallH, 0.15),
          roomWallMat
        );
        frontR.position.set(x + rw / 4 + doorW / 4, wallH / 2, z + rd / 2);
        group.add(frontR);
      }

      // Left wall
      if (doorSide !== 'left') {
        const left = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, rd), roomWallMat);
        left.position.set(x - rw / 2, wallH / 2, z);
        group.add(left);
      } else {
        const leftF = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, wallH, (rd - doorW) / 2),
          roomWallMat
        );
        leftF.position.set(x - rw / 2, wallH / 2, z - rd / 4 - doorW / 4);
        group.add(leftF);
        const leftB = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, wallH, (rd - doorW) / 2),
          roomWallMat
        );
        leftB.position.set(x - rw / 2, wallH / 2, z + rd / 4 + doorW / 4);
        group.add(leftB);
      }

      // Right wall
      if (doorSide !== 'right') {
        const right = new THREE.Mesh(new THREE.BoxGeometry(0.15, wallH, rd), roomWallMat);
        right.position.set(x + rw / 2, wallH / 2, z);
        group.add(right);
      } else {
        const rightF = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, wallH, (rd - doorW) / 2),
          roomWallMat
        );
        rightF.position.set(x + rw / 2, wallH / 2, z - rd / 4 - doorW / 4);
        group.add(rightF);
        const rightB = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, wallH, (rd - doorW) / 2),
          roomWallMat
        );
        rightB.position.set(x + rw / 2, wallH / 2, z + rd / 4 + doorW / 4);
        group.add(rightB);
      }

      // BED with legs (more 3D)
      const bedX = x;
      const bedZ = z - rd / 4;
      const bedW = 2,
        bedD = 1.3;

      // Bed frame (raised)
      const bedFrame = new THREE.Mesh(
        new THREE.BoxGeometry(bedW, 0.25, bedD),
        new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
      );
      bedFrame.position.set(bedX, 0.35, bedZ);
      group.add(bedFrame);

      // Bed legs
      const legMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
      const legH = 0.22;
      [
        [-bedW / 2 + 0.1, -bedD / 2 + 0.1],
        [bedW / 2 - 0.1, -bedD / 2 + 0.1],
        [-bedW / 2 + 0.1, bedD / 2 - 0.1],
        [bedW / 2 - 0.1, bedD / 2 - 0.1],
      ].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, legH, 0.1), legMat);
        leg.position.set(bedX + lx, legH / 2, bedZ + lz);
        group.add(leg);
      });

      // Mattress
      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(bedW - 0.1, 0.2, bedD - 0.1),
        new THREE.MeshLambertMaterial({ color: 0x887766 })
      );
      mattress.position.set(bedX, 0.57, bedZ);
      group.add(mattress);

      // Blanket (puffy)
      const blanketColors = [0x7a6555, 0x665544, 0x887766, 0x556655, 0x775566];
      const blanket = new THREE.Mesh(
        new THREE.BoxGeometry(bedW - 0.2, 0.2, bedD * 0.65),
        new THREE.MeshLambertMaterial({ color: blanketColors[colorIdx % 5] })
      );
      blanket.position.set(bedX, 0.75, bedZ + bedD * 0.15);
      group.add(blanket);

      // Pillow (fluffy)
      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.25, 0.8),
        new THREE.MeshLambertMaterial({ color: 0xddccbb })
      );
      pillow.position.set(bedX - bedW / 2 + 0.45, 0.75, bedZ);
      group.add(pillow);

      // Small stool/table beside bed (30%)
      if (Math.random() > 0.7) {
        const stool = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.5, 0.4),
          new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
        );
        stool.position.set(bedX + bedW / 2 + 0.3, 0.25, bedZ);
        group.add(stool);
      }

      // Wall lamp - 95% of lobby rooms have a warm orange wall lamp
      if (Math.random() < 0.95) {
        const lampColor = 0xff8833;

        // Lamp on wall away from door
        let lampX = x,
          lampZ = z;
        if (doorSide === 'left') lampX = x + rw / 2 - 0.5;
        else if (doorSide === 'right') lampX = x - rw / 2 + 0.5;
        else if (doorSide === 'front') lampZ = z - rd / 2 + 0.5;
        else lampZ = z + rd / 2 - 0.5;

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
    createLobbyRoom(-w / 2 + 5, -d / 2 + 5, 6, 5, 'right', 0);
    createLobbyRoom(-w / 2 + 5, -d / 2 + 11, 6, 5, 'right', 1);
    createLobbyRoom(-w / 2 + 5, -d / 2 + 17, 6, 5, 'right', 2);
    createLobbyRoom(-w / 2 + 5, d / 2 - 10, 6, 5, 'right', 3);

    // Right side rooms (3 rooms, leaving space for stairs at back corner)
    createLobbyRoom(w / 2 - 5, d / 2 - 5, 6, 5, 'left', 4);
    createLobbyRoom(w / 2 - 5, d / 2 - 11, 6, 5, 'left', 5);
    createLobbyRoom(w / 2 - 5, 0, 6, 5, 'left', 6);

    // Back wall rooms (left side only - stairs on back-right)
    createLobbyRoom(-15, -d / 2 + 4.5, 6, 5, 'front', 7);
    createLobbyRoom(-7, -d / 2 + 4.5, 6, 5, 'front', 8);

    // Center-left area rooms (more cramped feel)
    createLobbyRoom(-13, 0, 5, 4, 'right', 9);
    createLobbyRoom(-13, 6, 5, 4, 'right', 10);

    // Additional rooms near center-right (but away from stairs which are at back-right)
    createLobbyRoom(5, d / 2 - 8, 5, 4, 'left', 11);
    createLobbyRoom(5, 0, 5, 4, 'left', 12);

    // EXIT sign and door mat
    const exitSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xcc3333 })
    );
    exitSign.position.set(0, wallH - 0.3, d / 2 - 0.15);
    group.add(exitSign);
    const doorMat = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 2),
      new THREE.MeshLambertMaterial({ color: 0x3a3025 })
    );
    doorMat.rotation.x = -Math.PI / 2;
    doorMat.position.set(0, 0.03, d / 2 - 1.5);
    group.add(doorMat);

    // UP STAIRS (back right corner) - ROTATED 180°, extends to ceiling
    const lobbyStairX = w / 2 - 4;
    const railMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
    const numLobbySteps = 12;
    const lobbyStepRise = wallH / numLobbySteps;

    for (let s = 0; s < numLobbySteps; s++) {
      const stepY = s * lobbyStepRise;

      // Gradient: light at bottom (front), dark at top (back)
      const gradientVal = Math.floor(0x99 - (s / numLobbySteps) * 0x66);
      const stepColor = (gradientVal << 16) | (gradientVal << 8) | (gradientVal - 0x11);

      // Step tread - facing FORWARD
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.12, 0.8),
        new THREE.MeshLambertMaterial({ color: stepColor })
      );
      tread.position.set(lobbyStairX, stepY + 0.06, -d / 2 + 8 - s * 0.6);
      group.add(tread);

      // Step riser
      const riser = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, lobbyStepRise, 0.08),
        new THREE.MeshLambertMaterial({ color: stepColor - 0x222222 })
      );
      riser.position.set(lobbyStairX, stepY + lobbyStepRise / 2, -d / 2 + 8.4 - s * 0.6);
      group.add(riser);
    }

    // Lobby stairs handrails - longer, steeper
    const lobbyRailLen = 9;
    const lobbyRailAngle = Math.atan2(wallH, 7);
    const lobbyRail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, lobbyRailLen), railMat);
    lobbyRail1.position.set(lobbyStairX - 1.8, wallH / 2, -d / 2 + 4);
    lobbyRail1.rotation.x = lobbyRailAngle;
    group.add(lobbyRail1);
    const lobbyRail2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, lobbyRailLen), railMat);
    lobbyRail2.position.set(lobbyStairX + 1.8, wallH / 2, -d / 2 + 4);
    lobbyRail2.rotation.x = lobbyRailAngle;
    group.add(lobbyRail2);

    // Support posts
    for (let p = 0; p < 4; p++) {
      const postH = 0.8 + p * 0.8;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, postH, 0.1), railMat);
      post.position.set(lobbyStairX - 1.8, postH / 2, -d / 2 + 7.5 - p * 2);
      group.add(post);
      const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, postH, 0.1), railMat);
      post2.position.set(lobbyStairX + 1.8, postH / 2, -d / 2 + 7.5 - p * 2);
      group.add(post2);
    }

    // UP arrow sign on side
    const upSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.0, 1.5),
      new THREE.MeshLambertMaterial({ color: 0x336633 })
    );
    upSign.position.set(lobbyStairX + 1.9, 1.5, -d / 2 + 7);
    group.add(upSign);
    const upArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.5, 3),
      new THREE.MeshBasicMaterial({ color: 0x88ff88 })
    );
    upArrow.position.set(lobbyStairX + 2.0, 1.5, -d / 2 + 7);
    group.add(upArrow);

    // Lights
    const mainLight = new THREE.PointLight(0xffffee, 0.8, 30);
    mainLight.position.set(0, 3.5, 5);
    group.add(mainLight);
    const stairLight = new THREE.PointLight(0xffeedd, 0.5, 10);
    stairLight.position.set(w / 2 - 4, 3, -d / 2 + 3);
    group.add(stairLight);

    // ========== LOBBY CLUTTER AND DETAILS ==========

    // Trash and debris in corridors
    for (let i = 0; i < 20; i++) {
      const trashX = (Math.random() - 0.5) * w * 0.7;
      const trashZ = (Math.random() - 0.5) * d * 0.7;
      const trash = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.15 + Math.random() * 0.2,
          0.1 + Math.random() * 0.15,
          0.15 + Math.random() * 0.2
        ),
        new THREE.MeshLambertMaterial({
          color: [0x4a4540, 0x5a5550, 0x3a3530, 0x555550][Math.floor(Math.random() * 4)],
        })
      );
      trash.position.set(trashX, 0.08, trashZ);
      trash.rotation.y = Math.random() * Math.PI;
      group.add(trash);
    }

    // Pipes along ceiling
    for (let i = 0; i < 6; i++) {
      const pipeLen = 8 + Math.random() * 15;
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, pipeLen, 6),
        new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
      );
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(
        (Math.random() - 0.5) * w * 0.5,
        wallH - 0.3,
        (Math.random() - 0.5) * d * 0.6
      );
      group.add(pipe);
    }

    // Wires hanging from ceiling
    for (let i = 0; i < 15; i++) {
      const wireLen = 3 + Math.random() * 8;
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, wireLen, 4),
        new THREE.MeshBasicMaterial({ color: 0x222222 })
      );
      wire.rotation.x = Math.random() * Math.PI;
      wire.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
      wire.position.set(
        (Math.random() - 0.5) * w * 0.7,
        wallH - 0.5 - Math.random() * 0.5,
        (Math.random() - 0.5) * d * 0.7
      );
      group.add(wire);
    }

    // Shoes/slippers outside rooms
    for (let i = 0; i < 8; i++) {
      const shoeX = -w / 2 + 6 + Math.random() * 3;
      const shoeZ = -d / 2 + 5 + i * 4;
      const shoe = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.08, 0.12),
        new THREE.MeshLambertMaterial({
          color: [0x333333, 0x4a3a2a, 0x2a2a4a][Math.floor(Math.random() * 3)],
        })
      );
      shoe.position.set(shoeX, 0.04, shoeZ);
      shoe.rotation.y = Math.random() * 0.5;
      group.add(shoe);
    }

    // Buckets
    for (let i = 0; i < 4; i++) {
      const bucket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.15, 0.35, 8),
        new THREE.MeshLambertMaterial({
          color: [0x335588, 0x885533, 0x555555][Math.floor(Math.random() * 3)],
        })
      );
      bucket.position.set(-12 + i * 6 + Math.random() * 2, 0.175, (Math.random() - 0.5) * d * 0.5);
      group.add(bucket);
    }

    // Old bicycle
    const bikeX = -w / 2 + 3;
    const bikeZ = 3;
    const bikeFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.5, 1.2),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    bikeFrame.position.set(bikeX, 0.5, bikeZ);
    bikeFrame.rotation.x = 0.1;
    group.add(bikeFrame);
    const bikeWheel1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 8, 16),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    bikeWheel1.position.set(bikeX, 0.4, bikeZ - 0.5);
    group.add(bikeWheel1);
    const bikeWheel2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 8, 16),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    bikeWheel2.position.set(bikeX, 0.4, bikeZ + 0.5);
    group.add(bikeWheel2);

    // Notice board on wall
    const noticeBoard = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 0.08),
      new THREE.MeshLambertMaterial({ color: 0x8a7a6a })
    );
    noticeBoard.position.set(-w / 2 + 0.2, 1.8, 0);
    group.add(noticeBoard);
    // Papers on board
    for (let p = 0; p < 6; p++) {
      const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4 + Math.random() * 0.3, 0.5 + Math.random() * 0.3),
        new THREE.MeshBasicMaterial({
          color: [0xeeeeee, 0xffffaa, 0xffdddd, 0xddffdd][Math.floor(Math.random() * 4)],
        })
      );
      paper.position.set(-w / 2 + 0.25, 1.5 + Math.random() * 0.6, -0.6 + p * 0.25);
      paper.rotation.y = Math.PI / 2;
      paper.rotation.z = (Math.random() - 0.5) * 0.2;
      group.add(paper);
    }

    // Stacked boxes near reception
    for (let b = 0; b < 4; b++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.6 + Math.random() * 0.3, 0.4, 0.6 + Math.random() * 0.3),
        new THREE.MeshLambertMaterial({ color: 0x7a6a5a })
      );
      box.position.set(-9 + Math.random() * 0.5, 0.2 + b * 0.35, 7 + Math.random() * 0.5);
      box.rotation.y = Math.random() * 0.3;
      group.add(box);
    }

    // Fire extinguisher
    const extinguisher = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8),
      new THREE.MeshLambertMaterial({ color: 0xaa3333 })
    );
    extinguisher.position.set(w / 2 - 0.3, 0.8, 5);
    group.add(extinguisher);

    // Laundry hanging
    const laundryLine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 10, 4),
      new THREE.MeshBasicMaterial({ color: 0x666666 })
    );
    laundryLine.rotation.z = Math.PI / 2;
    laundryLine.position.set(-5, 3.2, -5);
    group.add(laundryLine);
    const clothColors = [0x8a7a6a, 0x6a7a8a, 0x7a8a7a, 0x9a8a7a];
    for (let c = 0; c < 4; c++) {
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.8),
        new THREE.MeshLambertMaterial({ color: clothColors[c], side: THREE.DoubleSide })
      );
      cloth.position.set(-8 + c * 2, 2.6, -5);
      cloth.rotation.y = (Math.random() - 0.5) * 0.3;
      group.add(cloth);
    }

    // ========== UNDERGROUND ENTRANCE (if this building has one) ==========
    // Check if this building has an underground entrance
    const undergroundEntryForThisBuilding = drainPositions.find(
      (drain) => drain.buildingIdx === buildingIdx
    );
    if (undergroundEntryForThisBuilding) {
      // Create a dark hole in the floor in the back-left corner
      const holeX = -w / 2 + 8;
      const holeZ = -d / 2 + 8;
      const holeW = 2.5;
      const holeD = 2.0;

      // Dark hole
      const hole = new THREE.Mesh(
        new THREE.PlaneGeometry(holeW, holeD),
        new THREE.MeshBasicMaterial({ color: 0x050505 })
      );
      hole.rotation.x = -Math.PI / 2;
      hole.position.set(holeX, 0.02, holeZ);
      group.add(hole);

      // Crumbling concrete edges
      const edgeMat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 1.0 + Math.random() * 0.4;
        const edgeW = 0.3 + Math.random() * 0.4;
        const edgeH = 0.15 + Math.random() * 0.1;
        const edge = new THREE.Mesh(new THREE.BoxGeometry(edgeW, edgeH, edgeW), edgeMat);
        edge.position.set(holeX + Math.cos(angle) * dist, edgeH / 2 + 0.02, holeZ + Math.sin(angle) * dist);
        edge.rotation.y = Math.random() * Math.PI;
        group.add(edge);
      }

      // Rusty ladder going down
      const ladderMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
      const ladderHeight = 3;
      // Side rails
      const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, ladderHeight, 0.08), ladderMat);
      rail1.position.set(holeX - 0.3, -ladderHeight / 2 + 0.1, holeZ);
      group.add(rail1);
      const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, ladderHeight, 0.08), ladderMat);
      rail2.position.set(holeX + 0.3, -ladderHeight / 2 + 0.1, holeZ);
      group.add(rail2);
      // Rungs
      for (let r = 0; r < 8; r++) {
        const rung = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.08), ladderMat);
        rung.position.set(holeX, -r * 0.35, holeZ);
        group.add(rung);
      }

      // Warning sign nearby
      const warnSign = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.5, 0.05),
        new THREE.MeshLambertMaterial({ color: 0xaa5500 })
      );
      warnSign.position.set(holeX + 2, 1.2, holeZ);
      warnSign.rotation.y = -0.3;
      group.add(warnSign);

      // Faint glow from below
      const underGlow = new THREE.PointLight(0x331100, 0.3, 5);
      underGlow.position.set(holeX, -1, holeZ);
      group.add(underGlow);
    }

    // ====== APARTMENT FLOORS - Multiple corridors with rooms ======
  } else {
    const hallW = 2.5; // Corridor width
    const wallThick = 0.15; // Wall thickness
    const roomSize = 5; // Room size

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
    wallBack.position.set(0, wallH / 2, -d / 2);
    group.add(wallBack);
    const wallFront = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, wallThick), wallMat);
    wallFront.position.set(0, wallH / 2, d / 2);
    group.add(wallFront);
    const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, d), wallMat);
    wallLeft.position.set(-w / 2, wallH / 2, 0);
    group.add(wallLeft);
    const wallRight = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, d), wallMat);
    wallRight.position.set(w / 2, wallH / 2, 0);
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
      backW.position.set(x, wallH / 2, z - rd / 2 + wallThick / 2);
      group.add(backW);

      // Front wall (with door opening)
      const frontW1 = new THREE.Mesh(
        new THREE.BoxGeometry((rw - doorW) / 2, wallH, wallThick),
        roomWallMat
      );
      frontW1.position.set(x - rw / 4 - doorW / 4, wallH / 2, z + rd / 2 - wallThick / 2);
      group.add(frontW1);
      const frontW2 = new THREE.Mesh(
        new THREE.BoxGeometry((rw - doorW) / 2, wallH, wallThick),
        roomWallMat
      );
      frontW2.position.set(x + rw / 4 + doorW / 4, wallH / 2, z + rd / 2 - wallThick / 2);
      group.add(frontW2);
      // Wall above door
      const frontTop = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.2, wallH - 2.5, wallThick),
        roomWallMat
      );
      frontTop.position.set(x, wallH - (wallH - 2.5) / 2, z + rd / 2 - wallThick / 2);
      group.add(frontTop);

      // Side walls (solid)
      const sideW1 = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, rd), roomWallMat);
      sideW1.position.set(x - rw / 2 + wallThick / 2, wallH / 2, z);
      group.add(sideW1);
      const sideW2 = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallH, rd), roomWallMat);
      sideW2.position.set(x + rw / 2 - wallThick / 2, wallH / 2, z);
      group.add(sideW2);

      // Door frame (decorative)
      const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.15, 2.5, wallThick + 0.05),
        new THREE.MeshLambertMaterial({ color: 0x3a2a1a })
      );
      doorFrame.position.set(x, 1.25, z + rd / 2 - wallThick / 2);
      group.add(doorFrame);

      // BED with legs (more 3D)
      const bedW = rotated ? 1.4 : 2.2;
      const bedD = rotated ? 2.2 : 1.4;
      const bedX = x - rw / 2 + bedW / 2 + 0.5;
      const bedZ = z - rd / 2 + bedD / 2 + 0.5;

      // Bed frame (raised)
      const bedFrame = new THREE.Mesh(
        new THREE.BoxGeometry(bedW, 0.25, bedD),
        new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
      );
      bedFrame.position.set(bedX, 0.35, bedZ);
      group.add(bedFrame);

      // Bed legs (visible from 2.5D angle)
      const legH = 0.22;
      const legMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
      const legPositions = [
        [bedX - bedW / 2 + 0.1, legH / 2, bedZ - bedD / 2 + 0.1],
        [bedX + bedW / 2 - 0.1, legH / 2, bedZ - bedD / 2 + 0.1],
        [bedX - bedW / 2 + 0.1, legH / 2, bedZ + bedD / 2 - 0.1],
        [bedX + bedW / 2 - 0.1, legH / 2, bedZ + bedD / 2 - 0.1],
      ];
      legPositions.forEach((pos) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, legH, 0.1), legMat);
        leg.position.set(pos[0], pos[1], pos[2]);
        group.add(leg);
      });

      // Mattress
      const mattress = new THREE.Mesh(
        new THREE.BoxGeometry(bedW - 0.1, 0.2, bedD - 0.1),
        new THREE.MeshLambertMaterial({ color: 0x887766 })
      );
      mattress.position.set(bedX, 0.57, bedZ);
      group.add(mattress);

      // Blanket (puffy)
      const blanketColors = [0x7a6555, 0x665544, 0x887766, 0x556655, 0x775566, 0x667755];
      const blanket = new THREE.Mesh(
        new THREE.BoxGeometry(bedW - 0.2, 0.2, bedD * 0.65),
        new THREE.MeshLambertMaterial({ color: blanketColors[colorIdx % 6] })
      );
      blanket.position.set(bedX, 0.75, bedZ + bedD * 0.15);
      group.add(blanket);

      // Pillow (fluffy)
      const pillow = new THREE.Mesh(
        new THREE.BoxGeometry(rotated ? 0.9 : 0.6, 0.25, rotated ? 0.5 : 0.9),
        new THREE.MeshLambertMaterial({ color: 0xddccbb })
      );
      pillow.position.set(
        bedX - (rotated ? 0 : bedW / 2 - 0.45),
        0.75,
        bedZ - (rotated ? bedD / 2 - 0.35 : 0)
      );
      group.add(pillow);

      // Small nightstand/dresser beside bed
      const dresserX = bedX + bedW / 2 + 0.4;
      const dresserZ = bedZ - bedD / 2 + 0.4;
      const dresser = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.7, 0.4),
        new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
      );
      dresser.position.set(dresserX, 0.35, dresserZ);
      group.add(dresser);

      // Dresser drawers (detail)
      const drawer = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.25),
        new THREE.MeshBasicMaterial({ color: 0x3a2a1a })
      );
      drawer.position.set(dresserX, 0.3, dresserZ + 0.21);
      group.add(drawer);

      // Item on dresser (50% chance)
      if (Math.random() > 0.5) {
        const item = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.2, 0.15),
          new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0x666666 : 0x445566 })
        );
        item.position.set(dresserX, 0.8, dresserZ);
        group.add(item);
      }

      // Small TV on wall (30% of rooms)
      if (Math.random() > 0.7) {
        const tv = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.5, 0.08),
          new THREE.MeshLambertMaterial({ color: 0x222222 })
        );
        tv.position.set(x + rw / 2 - 0.6, 1.5, z - rd / 2 + 0.08);
        group.add(tv);

        // TV screen glow
        const screen = new THREE.Mesh(
          new THREE.PlaneGeometry(0.7, 0.4),
          new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x3366aa : 0x334455 })
        );
        screen.position.set(x + rw / 2 - 0.6, 1.5, z - rd / 2 + 0.12);
        group.add(screen);
      }

      // Wall lamp - 95% of rooms have a warm orange wall lamp
      if (Math.random() < 0.95) {
        // Orange/warm lamp color
        const lampColor = 0xff8833;
        const intensity = 0.8;

        // Wall lamp position - on wall opposite the door, not on bed
        const lampWallX = rotated ? x : x + (Math.random() > 0.5 ? 2 : -2);
        const lampWallZ = rotated ? z + (Math.random() > 0.5 ? 2 : -2) : z;

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
      { x: -12, z: -12 },
      { x: -12, z: 12 },
      { x: 12, z: -12 },
      { x: 12, z: 12 },
      { x: -20, z: 0 },
      { x: 20, z: 0 },
      { x: 0, z: -15 },
      { x: 0, z: 15 },
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

      // Hanging shade/cone around bulb (more 3D)
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.15, 6, 1, true),
        new THREE.MeshLambertMaterial({ color: 0x334433, side: THREE.DoubleSide })
      );
      shade.rotation.x = Math.PI;
      shade.position.set(pos.x, 3.55, pos.z);
      group.add(shade);
    }

    // ========== CEILING BEAMS (more 2.5D depth) ==========
    const beamMat = new THREE.MeshLambertMaterial({ color: 0x3a3530 });
    // Horizontal beams across ceiling
    for (let bx = -w / 2 + 8; bx < w / 2; bx += 12) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, d - 4), beamMat);
      beam.position.set(bx, wallH - 0.2, 0);
      group.add(beam);
    }
    // Cross beams
    for (let bz = -d / 2 + 8; bz < d / 2; bz += 12) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w - 4, 0.4, 0.3), beamMat);
      beam.position.set(0, wallH - 0.2, bz);
      group.add(beam);
    }

    // ========== HANGING SIGNS (more depth) ==========
    const signTexts = ['階段', '出口', '注意', '禁煙'];
    for (let i = 0; i < 4; i++) {
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.4, 0.05),
        new THREE.MeshLambertMaterial({ color: 0x226622 })
      );
      const signX = -15 + i * 10 + Math.random() * 5;
      const signZ = -d / 2 + 10 + Math.random() * (d - 20);
      sign.position.set(signX, 3.0, signZ);
      group.add(sign);

      // Sign chain
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.8, 4),
        new THREE.MeshBasicMaterial({ color: 0x444444 })
      );
      chain.position.set(signX, 3.4, signZ);
      group.add(chain);
    }

    // ========== POSTS/COLUMNS (vertical depth cues) ==========
    const postMat = new THREE.MeshLambertMaterial({ color: 0x4a4540 });
    const postPositions = [
      { x: -w / 2 + 5, z: -d / 2 + 5 },
      { x: w / 2 - 8, z: -d / 2 + 5 },
      { x: -w / 2 + 5, z: d / 2 - 8 },
    ];
    postPositions.forEach((pos) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallH, 0.4), postMat);
      post.position.set(pos.x, wallH / 2, pos.z);
      group.add(post);
    });

    // ========== SPORADIC WIRES (natural look, no grid) ==========

    // Random wire bundles across ceiling - different lengths and angles
    for (let i = 0; i < 35; i++) {
      const wireLen = 2 + Math.random() * 6;
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.015 + Math.random() * 0.02,
          0.015 + Math.random() * 0.02,
          wireLen,
          4
        ),
        new THREE.MeshBasicMaterial({
          color: [0x111111, 0x1a1a1a, 0x0a0a0a, 0x181818][Math.floor(Math.random() * 4)],
        })
      );
      // Random orientations - not aligned to grid
      wire.rotation.x = Math.random() * Math.PI;
      wire.rotation.y = Math.random() * Math.PI;
      wire.rotation.z = Math.random() * Math.PI;
      wire.position.set(
        -w / 2 + 6 + Math.random() * (w - 12),
        3.0 + Math.random() * 0.7,
        -d / 2 + 6 + Math.random() * (d - 12)
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
        -w / 2 + 8 + Math.random() * (w - 16),
        3.5 - droopLen / 2,
        -d / 2 + 8 + Math.random() * (d - 16)
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
        wallSide ? -w / 2 + 2 : w / 2 - 2,
        2.8 + Math.random() * 0.5,
        -d / 3 + Math.random() * (d * 0.66)
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
        -w / 2 + 8 + Math.random() * (w - 16),
        0.15,
        -d / 2 + 8 + Math.random() * (d - 16)
      );
      group.add(bag);
    }
    // Small trash pieces
    for (let i = 0; i < 40; i++) {
      const trash = new THREE.Mesh(
        new THREE.BoxGeometry(0.08 + Math.random() * 0.15, 0.03, 0.08 + Math.random() * 0.15),
        new THREE.MeshLambertMaterial({
          color: [0x8b7355, 0x666666, 0x444444, 0x554433, 0x445544][Math.floor(Math.random() * 5)],
        })
      );
      trash.rotation.y = Math.random() * Math.PI;
      trash.position.set(
        -w / 2 + 6 + Math.random() * (w - 12),
        0.02,
        -d / 2 + 6 + Math.random() * (d - 12)
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
        -w / 2 + 8 + Math.random() * (w - 16),
        0.04,
        -d / 2 + 8 + Math.random() * (d - 16)
      );
      group.add(paper);
    }

    // Cardboard boxes stacked
    for (let i = 0; i < 12; i++) {
      const stackHeight = 1 + Math.floor(Math.random() * 3);
      const bx = -w / 2 + 10 + Math.random() * (w - 20);
      const bz = -d / 2 + 10 + Math.random() * (d - 20);
      for (let b = 0; b < stackHeight; b++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(
            0.5 + Math.random() * 0.4,
            0.35 + Math.random() * 0.2,
            0.4 + Math.random() * 0.3
          ),
          new THREE.MeshLambertMaterial({ color: 0x8b7355 + Math.floor(Math.random() * 0x222222) })
        );
        box.position.set(
          bx + (Math.random() - 0.5) * 0.2,
          0.2 + b * 0.35,
          bz + (Math.random() - 0.5) * 0.2
        );
        box.rotation.y = Math.random() * 0.5;
        group.add(box);
      }
    }

    // Buckets
    for (let i = 0; i < 6; i++) {
      const bucket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.15, 0.35, 8),
        new THREE.MeshLambertMaterial({
          color: [0x3355aa, 0x55aa33, 0xaa5533, 0x555555][Math.floor(Math.random() * 4)],
        })
      );
      bucket.position.set(
        -w / 2 + 10 + Math.random() * (w - 20),
        0.175,
        -d / 2 + 10 + Math.random() * (d - 20)
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
        -w / 2 + 8 + Math.random() * (w - 16),
        0.03,
        -d / 2 + 8 + Math.random() * (d - 16)
      );
      shoe.rotation.y = Math.random() * Math.PI;
      group.add(shoe);
    }

    // Laundry hanging across some corridors
    for (let l = 0; l < 6; l++) {
      const lineX = -w / 3 + l * (w / 9);
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
            color: [0xccbbaa, 0x8899aa, 0xaa8877, 0xaaaaaa, 0x778899, 0x998877][
              Math.floor(Math.random() * 6)
            ],
            side: THREE.DoubleSide,
          })
        );
        cloth.position.set(lineX - 1.5 + c * 1.2, 2.2, lineZ);
        group.add(cloth);
      }
    }

    // Bicycles
    for (let i = 0; i < 3; i++) {
      const bikeX = -w / 3 + i * (w / 5);
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
        -w / 3 + Math.random() * (w * 0.66),
        0.35,
        -d / 3 + Math.random() * (d * 0.66)
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
        wallSide ? -w / 2 + 0.08 : w / 2 - 0.08,
        1.8 + Math.random() * 0.5,
        -d / 3 + i * (d / 6)
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
          wallSide ? -w / 2 + 0.5 : w / 2 - 0.5,
          1.8 + wi * 0.15,
          -d / 3 + i * (d / 6)
        );
        group.add(jWire);
      }
    }

    // ========== STAIRWELL (back right corner - clear area) ==========
    const stairMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
    const railMat = new THREE.MeshLambertMaterial({ color: 0x444433 });

    // UP STAIRS (right side) - ROTATED 180°, extends to ceiling
    // Stairs go from front (low, light) to back (high, dark) - player approaches from front
    const upStairX = w / 2 - 3;
    const numSteps = 12; // More steps to reach ceiling
    const stepRise = wallH / numSteps; // Height per step

    for (let s = 0; s < numSteps; s++) {
      const stepY = s * stepRise; // Step height

      // Gradient: light at bottom (front), dark at top (back)
      const gradientVal = Math.floor(0x99 - (s / numSteps) * 0x66);
      const stepColor = (gradientVal << 16) | (gradientVal << 8) | (gradientVal - 0x11);

      // Step tread (horizontal surface) - facing FORWARD (positive Z)
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.12, 0.8),
        new THREE.MeshLambertMaterial({ color: stepColor })
      );
      // Steps go from front (high Z) to back (low Z), rising as they go back
      tread.position.set(upStairX, stepY + 0.06, -d / 2 + 8 - s * 0.6);
      group.add(tread);

      // Step riser (vertical face) - visible from front
      const riser = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, stepRise, 0.08),
        new THREE.MeshLambertMaterial({ color: stepColor - 0x222222 })
      );
      riser.position.set(upStairX, stepY + stepRise / 2, -d / 2 + 8.4 - s * 0.6);
      group.add(riser);
    }

    // UP stairs handrails - longer, steeper angle
    const railLen = 9;
    const railAngle = Math.atan2(wallH, 7); // Angle based on rise/run
    const upRail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, railLen), railMat);
    upRail1.position.set(upStairX - 1.8, wallH / 2, -d / 2 + 4);
    upRail1.rotation.x = railAngle;
    group.add(upRail1);
    const upRail2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, railLen), railMat);
    upRail2.position.set(upStairX + 1.8, wallH / 2, -d / 2 + 4);
    upRail2.rotation.x = railAngle;
    group.add(upRail2);

    // UP stairs support posts - taller
    for (let p = 0; p < 4; p++) {
      const postH = 0.8 + p * 0.8;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, postH, 0.1), railMat);
      post.position.set(upStairX - 1.8, postH / 2, -d / 2 + 7.5 - p * 2);
      group.add(post);
      const post2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, postH, 0.1), railMat);
      post2.position.set(upStairX + 1.8, postH / 2, -d / 2 + 7.5 - p * 2);
      group.add(post2);
    }

    // UP arrow sign on side wall (visible from approach)
    const upSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.0, 1.5),
      new THREE.MeshLambertMaterial({ color: 0x336633 })
    );
    upSign.position.set(upStairX + 1.9, 1.5, -d / 2 + 7);
    group.add(upSign);
    // Arrow pointing up
    const upArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.5, 3),
      new THREE.MeshBasicMaterial({ color: 0x88ff88 })
    );
    upArrow.position.set(upStairX + 2.0, 1.5, -d / 2 + 7);
    group.add(upArrow);

    // DOWN STAIRS (left side) - actual 3D steps going down
    const downStairX = w / 2 - 8;
    for (let s = 0; s < 7; s++) {
      // Each step gets lower (going DOWN into darkness)
      const stepH = 0.8 - s * 0.1; // Gets lower
      const stepY = -s * 0.12; // Base drops

      // Step tread (horizontal surface)
      const tread = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 0.15, 1.0),
        new THREE.MeshLambertMaterial({ color: 0x444433 + s * 0x111111 }) // Gets lighter coming out
      );
      tread.position.set(downStairX, stepY + 0.4, -d / 2 + 1.5 + s * 0.9);
      group.add(tread);

      // Step riser (vertical face) - visible going down
      if (s < 6) {
        const riser = new THREE.Mesh(
          new THREE.BoxGeometry(3.5, 0.15, 0.1),
          new THREE.MeshLambertMaterial({ color: 0x333322 })
        );
        riser.position.set(downStairX, stepY + 0.32, -d / 2 + 1 + s * 0.9);
        group.add(riser);
      }
    }

    // Dark hole at bottom of down stairs (going into darkness)
    const darkHole = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 0.5, 2),
      new THREE.MeshBasicMaterial({ color: 0x111108 })
    );
    darkHole.position.set(downStairX, -0.5, -d / 2 + 1);
    group.add(darkHole);

    // DOWN stairs handrails
    const downRail1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 6), railMat);
    downRail1.position.set(downStairX - 1.8, 0.7, -d / 2 + 4);
    downRail1.rotation.x = 0.1; // Tilted down
    group.add(downRail1);
    const downRail2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 6), railMat);
    downRail2.position.set(downStairX + 1.8, 0.7, -d / 2 + 4);
    downRail2.rotation.x = 0.1;
    group.add(downRail2);

    // DOWN arrow sign on wall
    const downSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.0, 0.1),
      new THREE.MeshLambertMaterial({ color: 0x663333 })
    );
    downSign.position.set(downStairX, 2.2, -d / 2 + 0.15);
    group.add(downSign);
    // Arrow pointing down
    const downArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.5, 3),
      new THREE.MeshBasicMaterial({ color: 0xff8888 })
    );
    downArrow.position.set(downStairX, 2.2, -d / 2 + 0.25);
    downArrow.rotation.x = Math.PI / 2;
    group.add(downArrow);

    // Center divider between stairs
    const divider = new THREE.Mesh(new THREE.BoxGeometry(0.2, wallH, 7), stairMat);
    divider.position.set(w / 2 - 5.5, wallH / 2, -d / 2 + 4);
    group.add(divider);

    // Stairwell light
    const stairLight = new THREE.PointLight(0xffffee, 0.6, 12);
    stairLight.position.set(w / 2 - 5.5, 3.5, -d / 2 + 4);
    group.add(stairLight);
  }

  indoorScene.add(group);
  currentFloorGroup = group;
  return {
    w,
    d,
    top: isTop,
    ground: isGround,
    leftRoof: isTop && hasLeftBuilding,
    rightRoof: isTop && hasRightBuilding,
    northRoof: isTop && hasNorthBuilding,
    southRoof: isTop && hasSouthBuilding,
    northIdx: northBuildingIdx,
    southIdx: southBuildingIdx,
  };
}

// ============================================
// UNDERGROUND - Cramped tunnels beneath KWC (NOT a clean sewer!)
// Hand-dug passages, military bunkers, gang hideouts, chaotic pipes
// ============================================
let currentUndergroundGroup: THREE.Group | null = null;
const undergroundNPCs: NPC[] = [];

// Track which ladder player is near for exit
let nearestLadderIdx = -1;

function createUndergroundView(drainIdx: number) {
  if (currentUndergroundGroup) indoorScene.remove(currentUndergroundGroup);
  if (currentFloorGroup) indoorScene.remove(currentFloorGroup);

  const group = new THREE.Group();
  // Sprawling underground network beneath KWC
  const w = 100,
    d = 120,
    wallH = 3.5; // Lower ceiling - cramped!

  // ========== FLOOR - Visible concrete ==========
  // Base floor (lighter concrete so it's visible)
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x4a4540 });
  const mainFloor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
  mainFloor.rotation.x = -Math.PI / 2;
  mainFloor.position.y = 0.01;
  group.add(mainFloor);

  // Uneven floor patches (different heights, materials)
  for (let i = 0; i < 100; i++) {
    const patchW = 2 + Math.random() * 5;
    const patchD = 2 + Math.random() * 5;
    const patchH = Math.random() * 0.15;
    const patch = new THREE.Mesh(
      new THREE.BoxGeometry(patchW, patchH, patchD),
      new THREE.MeshLambertMaterial({
        color: [0x2a2520, 0x1f1a18, 0x302820, 0x252018, 0x1a1815][Math.floor(Math.random() * 5)],
      })
    );
    patch.position.set(
      -w / 2 + 5 + Math.random() * (w - 10),
      patchH / 2,
      -d / 2 + 5 + Math.random() * (d - 10)
    );
    group.add(patch);
  }

  // ========== BLACK-WATER CHANNELS - Trickling dirty water ==========
  const blackWaterMat = new THREE.MeshBasicMaterial({
    color: 0x0a0808,
    transparent: true,
    opacity: 0.8,
  });

  // Irregular channels (not a grid - organic paths)
  const channelPaths = [
    { startX: -40, startZ: -55, endX: 35, endZ: -50, width: 1.5 },
    { startX: -30, startZ: -30, endX: 40, endZ: -25, width: 2 },
    { startX: -35, startZ: 0, endX: 30, endZ: 5, width: 1.8 },
    { startX: -25, startZ: 25, endX: 45, endZ: 30, width: 1.5 },
    { startX: -10, startZ: -55, endX: -5, endZ: 50, width: 2.5 }, // Main N-S
    { startX: 20, startZ: -50, endX: 25, endZ: 45, width: 2 },
  ];

  channelPaths.forEach((path) => {
    const len = Math.sqrt(
      Math.pow(path.endX - path.startX, 2) + Math.pow(path.endZ - path.startZ, 2)
    );
    const angle = Math.atan2(path.endZ - path.startZ, path.endX - path.startX);

    const channel = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.3, path.width),
      new THREE.MeshLambertMaterial({ color: 0x151210 })
    );
    channel.position.set((path.startX + path.endX) / 2, -0.15, (path.startZ + path.endZ) / 2);
    channel.rotation.y = -angle + Math.PI / 2;
    group.add(channel);

    // Black water surface
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(len - 0.5, path.width - 0.3),
      blackWaterMat
    );
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = -angle + Math.PI / 2;
    water.position.set((path.startX + path.endX) / 2, -0.05, (path.startZ + path.endZ) / 2);
    group.add(water);
  });

  // ========== CRAMPED TUNNEL WALLS - Irregular, hand-dug feel ==========
  // ========== IRREGULAR WALLS - Hand-dug, crumbling concrete ==========
  const wallMats = [
    new THREE.MeshLambertMaterial({ color: 0x5a5550 }),
    new THREE.MeshLambertMaterial({ color: 0x504a45 }),
    new THREE.MeshLambertMaterial({ color: 0x555048 }),
  ];

  // Outer boundary walls (rough, irregular)
  for (let i = 0; i < 30; i++) {
    const segW = 3 + Math.random() * 5;
    const segH = wallH - 0.5 + Math.random() * 1;
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(segW, segH, 0.4 + Math.random() * 0.3),
      wallMats[Math.floor(Math.random() * 3)]
    );
    wall.position.set(-w / 2 + i * 3.5, segH / 2, -d / 2 + Math.random() * 0.5);
    group.add(wall);
  }
  for (let i = 0; i < 30; i++) {
    const segW = 3 + Math.random() * 5;
    const segH = wallH - 0.5 + Math.random() * 1;
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(segW, segH, 0.4 + Math.random() * 0.3),
      wallMats[Math.floor(Math.random() * 3)]
    );
    wall.position.set(-w / 2 + i * 3.5, segH / 2, d / 2 - Math.random() * 0.5);
    group.add(wall);
  }
  for (let i = 0; i < 35; i++) {
    const segD = 3 + Math.random() * 5;
    const segH = wallH - 0.5 + Math.random() * 1;
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.4 + Math.random() * 0.3, segH, segD),
      wallMats[Math.floor(Math.random() * 3)]
    );
    wall.position.set(-w / 2 + Math.random() * 0.5, segH / 2, -d / 2 + i * 3.5);
    group.add(wall);
  }
  for (let i = 0; i < 35; i++) {
    const segD = 3 + Math.random() * 5;
    const segH = wallH - 0.5 + Math.random() * 1;
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(0.4 + Math.random() * 0.3, segH, segD),
      wallMats[Math.floor(Math.random() * 3)]
    );
    wall.position.set(w / 2 - Math.random() * 0.5, segH / 2, -d / 2 + i * 3.5);
    group.add(wall);
  }

  // ========== INTERNAL WALLS - Creates cramped passages ==========
  // Fixed wall positions for consistent collision detection
  // Format: { x, z, w (width in X), d (depth in Z) }
  const internalWalls = [
    // Horizontal walls (wide in X, thin in Z)
    { x: -30, z: -45, w: 18, d: 0.6 },
    { x: 10, z: -40, w: 22, d: 0.6 },
    { x: -20, z: -25, w: 16, d: 0.6 },
    { x: 25, z: -20, w: 20, d: 0.6 },
    { x: -35, z: -5, w: 14, d: 0.6 },
    { x: 5, z: 0, w: 24, d: 0.6 },
    { x: 35, z: 5, w: 12, d: 0.6 },
    { x: -25, z: 20, w: 18, d: 0.6 },
    { x: 15, z: 25, w: 16, d: 0.6 },
    { x: -10, z: 40, w: 20, d: 0.6 },
    { x: 30, z: 35, w: 14, d: 0.6 },
    { x: -35, z: 50, w: 16, d: 0.6 },
    // Vertical walls (thin in X, deep in Z)
    { x: -40, z: -30, w: 0.6, d: 20 },
    { x: -25, z: -35, w: 0.6, d: 16 },
    { x: -10, z: -15, w: 0.6, d: 22 },
    { x: 5, z: -30, w: 0.6, d: 18 },
    { x: 20, z: -10, w: 0.6, d: 24 },
    { x: 35, z: -35, w: 0.6, d: 14 },
    { x: -38, z: 15, w: 0.6, d: 20 },
    { x: -20, z: 30, w: 0.6, d: 18 },
    { x: 0, z: 20, w: 0.6, d: 16 },
    { x: 18, z: 45, w: 0.6, d: 22 },
    { x: 38, z: 25, w: 0.6, d: 18 },
    { x: -30, z: 45, w: 0.6, d: 14 },
  ];

  // Render the internal walls
  for (const wallDef of internalWalls) {
    const segH = 3 + Math.random() * 0.5;
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(wallDef.w, segH, wallDef.d),
      wallMats[Math.floor(Math.random() * 3)]
    );
    wall.position.set(wallDef.x, segH / 2, wallDef.z);
    group.add(wall);
  }

  // NO CEILING - Open top so player can see everything from above (2.5D view)

  // ========== LEAKING PIPES EVERYWHERE - Chaotic angles ==========
  const pipeColors = [0x4a4540, 0x5a4535, 0x3a3530, 0x555045, 0x443830, 0x3a3028];

  // Pipes along walls at random heights
  for (let i = 0; i < 80; i++) {
    const pipeLen = 3 + Math.random() * 15;
    const pipeR = 0.08 + Math.random() * 0.2;
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(pipeR, pipeR, pipeLen, 6),
      new THREE.MeshLambertMaterial({
        color: pipeColors[Math.floor(Math.random() * pipeColors.length)],
      })
    );
    // Random orientation
    pipe.rotation.x = Math.random() * Math.PI;
    pipe.rotation.z = Math.random() * Math.PI;
    pipe.position.set(
      -w / 2 + 5 + Math.random() * (w - 10),
      0.5 + Math.random() * (wallH - 1),
      -d / 2 + 5 + Math.random() * (d - 10)
    );
    group.add(pipe);

    // Dripping water/leak from many pipes
    if (Math.random() > 0.6) {
      const dripLen = 0.5 + Math.random() * 2;
      const drip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.01, dripLen, 4),
        new THREE.MeshBasicMaterial({ color: 0x1a2a1a, transparent: true, opacity: 0.5 })
      );
      drip.position.set(pipe.position.x, pipe.position.y - dripLen / 2 - 0.2, pipe.position.z);
      group.add(drip);

      // Puddle below drip
      if (pipe.position.y < 2) {
        const puddle = new THREE.Mesh(
          new THREE.CircleGeometry(0.3 + Math.random() * 0.5, 6),
          new THREE.MeshBasicMaterial({ color: 0x151a15, transparent: true, opacity: 0.6 })
        );
        puddle.rotation.x = -Math.PI / 2;
        puddle.position.set(pipe.position.x, 0.02, pipe.position.z);
        group.add(puddle);
      }
    }
  }

  // ========== CHAOTIC WIRING - Crossing at random angles ==========
  const wireColors = [0x111111, 0x1a1a1a, 0x0f0f0f, 0x151515, 0x222222];

  for (let i = 0; i < 150; i++) {
    const wireLen = 2 + Math.random() * 12;
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.015 + Math.random() * 0.025,
        0.015 + Math.random() * 0.025,
        wireLen,
        4
      ),
      new THREE.MeshBasicMaterial({
        color: wireColors[Math.floor(Math.random() * wireColors.length)],
      })
    );
    wire.rotation.x = Math.random() * Math.PI;
    wire.rotation.y = Math.random() * Math.PI;
    wire.rotation.z = Math.random() * Math.PI;
    wire.position.set(
      -w / 2 + 8 + Math.random() * (w - 16),
      1 + Math.random() * (wallH - 1.5),
      -d / 2 + 8 + Math.random() * (d - 16)
    );
    group.add(wire);
  }

  // Wire bundles (clusters of wires)
  for (let i = 0; i < 30; i++) {
    const bundleX = -w / 2 + 10 + Math.random() * (w - 20);
    const bundleZ = -d / 2 + 10 + Math.random() * (d - 20);
    const bundleY = 1.5 + Math.random() * 2;
    for (let j = 0; j < 5 + Math.floor(Math.random() * 8); j++) {
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 3 + Math.random() * 6, 4),
        new THREE.MeshBasicMaterial({
          color: wireColors[Math.floor(Math.random() * wireColors.length)],
        })
      );
      wire.rotation.x = Math.random() * 0.5;
      wire.rotation.z = Math.random() * 0.5;
      wire.position.set(bundleX + Math.random() * 0.5, bundleY, bundleZ + Math.random() * 0.5);
      group.add(wire);
    }
  }

  // ========== BROKEN CONCRETE VOIDS - Dark gaps ==========
  for (let i = 0; i < 25; i++) {
    const voidW = 1 + Math.random() * 3;
    const voidD = 1 + Math.random() * 3;
    const voidH = 0.5 + Math.random() * 1;
    const concreteVoid = new THREE.Mesh(
      new THREE.BoxGeometry(voidW, voidH, voidD),
      new THREE.MeshBasicMaterial({ color: 0x050505 })
    );
    concreteVoid.position.set(
      -w / 2 + 10 + Math.random() * (w - 20),
      -voidH / 2,
      -d / 2 + 10 + Math.random() * (d - 20)
    );
    group.add(concreteVoid);
  }

  // ========== OLD MILITARY BUNKER ELEMENTS ==========
  // Rusty metal doors (sealed passages)
  for (let i = 0; i < 8; i++) {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2.5, 0.15),
      new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
    );
    const onWall = Math.random() > 0.5;
    door.position.set(
      onWall ? -w / 2 + 1 + Math.random() * 0.3 : -w / 2 + 15 + Math.random() * (w - 30),
      1.25,
      onWall ? -d / 2 + 15 + Math.random() * (d - 30) : -d / 2 + 1 + Math.random() * 0.3
    );
    if (!onWall) door.rotation.y = Math.PI / 2;
    group.add(door);

    // Rust streaks
    const rust = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 1.5),
      new THREE.MeshBasicMaterial({ color: 0x3a2a1a, transparent: true, opacity: 0.5 })
    );
    rust.position.set(
      door.position.x + (onWall ? 0.1 : 0),
      door.position.y - 0.5,
      door.position.z + (onWall ? 0 : 0.1)
    );
    rust.rotation.y = onWall ? 0 : Math.PI / 2;
    group.add(rust);
  }

  // ========== SECRET GANG PASSAGE MARKERS ==========
  // Graffiti/markings
  const graffiti = [0x881111, 0x118811, 0x111188, 0x888811, 0xffffff];
  for (let i = 0; i < 15; i++) {
    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5 + Math.random() * 1.5, 0.3 + Math.random() * 0.8),
      new THREE.MeshBasicMaterial({
        color: graffiti[Math.floor(Math.random() * graffiti.length)],
        transparent: true,
        opacity: 0.7,
      })
    );
    const onLeftWall = Math.random() > 0.5;
    mark.position.set(
      onLeftWall ? -w / 2 + 0.3 : w / 2 - 0.3,
      1 + Math.random() * 2,
      -d / 2 + 10 + Math.random() * (d - 20)
    );
    mark.rotation.y = onLeftWall ? Math.PI / 2 : -Math.PI / 2;
    group.add(mark);
  }

  // ========== EXIT LADDERS AT EACH DRAIN POSITION ==========
  // Create ladder at each drain location so player can exit anywhere
  const ladderMat = new THREE.MeshLambertMaterial({ color: 0x666655 });

  drainPositions.forEach((drain, idx) => {
    // Convert city coordinates to sewer coordinates
    // City: x from -40 to 40, z from -80 to 5
    // Sewer: x from -50 to 50, z from -60 to 60
    const sewerX = drain.x * 1.1;
    const sewerZ = (drain.z + 35) * 1.1; // Shift and scale

    const ladderGroup = new THREE.Group();

    // Ladder hole in ceiling (light shaft)
    const holeLight = new THREE.SpotLight(0x889988, 0.5, 12, Math.PI / 5);
    holeLight.position.set(sewerX, wallH + 2, sewerZ);
    holeLight.target.position.set(sewerX, 0, sewerZ);
    ladderGroup.add(holeLight);
    ladderGroup.add(holeLight.target);

    // Manhole circle on ceiling
    const manholeRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.15, 8, 16),
      new THREE.MeshLambertMaterial({ color: 0x444444 })
    );
    manholeRing.rotation.x = Math.PI / 2;
    manholeRing.position.set(sewerX, wallH - 0.1, sewerZ);
    ladderGroup.add(manholeRing);

    // Ladder rails
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH + 1, 0.1), ladderMat);
    rail1.position.set(sewerX - 0.5, wallH / 2, sewerZ);
    ladderGroup.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallH + 1, 0.1), ladderMat);
    rail2.position.set(sewerX + 0.5, wallH / 2, sewerZ);
    ladderGroup.add(rail2);

    // Rungs
    for (let r = 0; r < 9; r++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), ladderMat);
      rung.position.set(sewerX, 0.5 + r * 0.7, sewerZ);
      ladderGroup.add(rung);
    }

    // Floor marking (glow ring to show exit point)
    const exitRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.1, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0x446644 })
    );
    exitRing.rotation.x = -Math.PI / 2;
    exitRing.position.set(sewerX, 0.02, sewerZ);
    ladderGroup.add(exitRing);

    // Number marker
    const markerColor = idx === 0 ? 0x66aa66 : 0x447744; // Brighter for spawn point
    const marker = new THREE.Mesh(
      new THREE.CircleGeometry(0.8, 8),
      new THREE.MeshBasicMaterial({ color: markerColor })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(sewerX, 0.03, sewerZ);
    ladderGroup.add(marker);

    group.add(ladderGroup);
  });

  // ========== TUNNEL PILLARS/SUPPORTS ==========
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x4a4540 });
  for (let x = -35; x <= 35; x += 20) {
    for (let z = -50; z <= 50; z += 25) {
      // Skip if too close to a drain
      const tooClose = drainPositions.some((dr) => {
        const sx = dr.x * 1.1;
        const sz = (dr.z + 35) * 1.1;
        return Math.abs(x - sx) < 5 && Math.abs(z - sz) < 5;
      });
      if (tooClose) continue;

      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, wallH, 1.2), pillarMat);
      pillar.position.set(x, wallH / 2, z);
      group.add(pillar);
    }
  }

  // ========== DEBRIS AND DETAILS ==========
  // Puddles
  for (let i = 0; i < 50; i++) {
    const puddle = new THREE.Mesh(
      new THREE.CircleGeometry(0.6 + Math.random() * 1.5, 8),
      new THREE.MeshBasicMaterial({ color: 0x1a2a18, transparent: true, opacity: 0.4 })
    );
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(
      -w / 2 + 8 + Math.random() * (w - 16),
      0.02,
      -d / 2 + 8 + Math.random() * (d - 16)
    );
    group.add(puddle);
  }

  // Debris
  for (let i = 0; i < 80; i++) {
    const debris = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.2 + Math.random() * 0.4,
        0.1 + Math.random() * 0.3,
        0.2 + Math.random() * 0.4
      ),
      new THREE.MeshLambertMaterial({
        color: [0x3a3530, 0x4a4035, 0x2a2520, 0x353025][Math.floor(Math.random() * 4)],
      })
    );
    debris.position.set(
      -w / 2 + 5 + Math.random() * (w - 10),
      0.15,
      -d / 2 + 5 + Math.random() * (d - 10)
    );
    debris.rotation.y = Math.random() * Math.PI;
    group.add(debris);
  }

  // ========== KWC-STYLE WARNING SIGNS ==========
  const signMat = new THREE.MeshBasicMaterial({ color: 0xddddcc });
  const dangerMat = new THREE.MeshBasicMaterial({ color: 0xcc4444 });

  for (let i = 0; i < 20; i++) {
    const signX = -w / 2 + 8 + Math.random() * (w - 16);
    const signZ = -d / 2 + 8 + Math.random() * (d - 16);
    const signY = 1.5 + Math.random() * 1.5;

    // Sign board
    const signW = 0.8 + Math.random() * 0.6;
    const signH = 0.5 + Math.random() * 0.4;
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(signW, signH, 0.05),
      Math.random() > 0.7 ? dangerMat : signMat
    );
    sign.position.set(signX, signY, signZ);
    sign.rotation.y = Math.random() * Math.PI * 2;
    group.add(sign);

    // Some signs have red border
    if (Math.random() > 0.5) {
      const border = new THREE.Mesh(
        new THREE.BoxGeometry(signW + 0.1, signH + 0.1, 0.03),
        new THREE.MeshBasicMaterial({ color: 0x883333 })
      );
      border.position.copy(sign.position);
      border.position.z -= 0.02;
      border.rotation.y = sign.rotation.y;
      group.add(border);
    }
  }

  // ========== TRASH BAGS AND GARBAGE ==========
  for (let i = 0; i < 40; i++) {
    const bagX = -w / 2 + 6 + Math.random() * (w - 12);
    const bagZ = -d / 2 + 6 + Math.random() * (d - 12);

    // White/grey plastic bags
    const bag = new THREE.Mesh(
      new THREE.SphereGeometry(0.25 + Math.random() * 0.3, 6, 5),
      new THREE.MeshLambertMaterial({ color: Math.random() > 0.4 ? 0xcccccc : 0x888888 })
    );
    bag.position.set(bagX, 0.2 + Math.random() * 0.2, bagZ);
    bag.scale.set(1, 0.7 + Math.random() * 0.3, 1);
    group.add(bag);
  }

  // Piles of garbage against walls
  for (let i = 0; i < 15; i++) {
    const pileX =
      Math.random() > 0.5 ? -w / 2 + 3 + Math.random() * 5 : w / 2 - 3 - Math.random() * 5;
    const pileZ = -d / 2 + 10 + Math.random() * (d - 20);

    for (let j = 0; j < 4 + Math.floor(Math.random() * 4); j++) {
      const junk = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.3 + Math.random() * 0.4,
          0.2 + Math.random() * 0.3,
          0.3 + Math.random() * 0.4
        ),
        new THREE.MeshLambertMaterial({
          color: [0x5a5550, 0x4a4540, 0x6a6560, 0x3a3530][Math.floor(Math.random() * 4)],
        })
      );
      junk.position.set(
        pileX + (Math.random() - 0.5) * 1.5,
        0.15 + j * 0.15,
        pileZ + (Math.random() - 0.5) * 1.5
      );
      junk.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3);
      group.add(junk);
    }
  }

  // ========== BUCKETS AND CONTAINERS ==========
  for (let i = 0; i < 25; i++) {
    const bucketX = -w / 2 + 8 + Math.random() * (w - 16);
    const bucketZ = -d / 2 + 8 + Math.random() * (d - 16);

    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.15, 0.4, 8),
      new THREE.MeshLambertMaterial({
        color: [0x335577, 0x553322, 0x555555, 0x774433][Math.floor(Math.random() * 4)],
      })
    );
    bucket.position.set(bucketX, 0.2, bucketZ);
    group.add(bucket);
  }

  // ========== CARDBOARD BOXES ==========
  for (let i = 0; i < 30; i++) {
    const boxX = -w / 2 + 6 + Math.random() * (w - 12);
    const boxZ = -d / 2 + 6 + Math.random() * (d - 12);
    const boxW = 0.4 + Math.random() * 0.5;
    const boxH = 0.3 + Math.random() * 0.4;
    const boxD = 0.4 + Math.random() * 0.5;

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, boxD),
      new THREE.MeshLambertMaterial({ color: 0x8a7560 + Math.floor(Math.random() * 0x101010) })
    );
    box.position.set(boxX, boxH / 2, boxZ);
    box.rotation.y = Math.random() * Math.PI;
    group.add(box);
  }

  // ========== CRATES AND STORAGE ==========
  for (let i = 0; i < 12; i++) {
    const crateX = -w / 2 + 10 + Math.random() * (w - 20);
    const crateZ = -d / 2 + 10 + Math.random() * (d - 20);

    // Wooden crate
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1 + Math.random() * 0.5, 0.8, 1 + Math.random() * 0.5),
      new THREE.MeshLambertMaterial({ color: 0x6a5a4a })
    );
    crate.position.set(crateX, 0.4, crateZ);
    group.add(crate);

    // Slats detail
    for (let s = 0; s < 3; s++) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.05, 0.08),
        new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
      );
      slat.position.set(crateX, 0.2 + s * 0.3, crateZ + 0.5);
      group.add(slat);
    }
  }

  // ========== METAL BARRELS ==========
  for (let i = 0; i < 15; i++) {
    const barrelX = -w / 2 + 8 + Math.random() * (w - 16);
    const barrelZ = -d / 2 + 8 + Math.random() * (d - 16);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.35, 1, 10),
      new THREE.MeshLambertMaterial({
        color: [0x3a5a3a, 0x5a5a5a, 0x4a3a2a, 0x2a4a5a][Math.floor(Math.random() * 4)],
      })
    );
    barrel.position.set(barrelX, 0.5, barrelZ);
    if (Math.random() > 0.8) {
      barrel.rotation.x = Math.PI / 2; // Fallen over
      barrel.position.y = 0.35;
    }
    group.add(barrel);
  }

  // ========== OLD FURNITURE ==========
  // Broken chairs
  for (let i = 0; i < 8; i++) {
    const chairX = -w / 2 + 10 + Math.random() * (w - 20);
    const chairZ = -d / 2 + 10 + Math.random() * (d - 20);

    // Seat
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.08, 0.5),
      new THREE.MeshLambertMaterial({ color: 0x5a4a3a })
    );
    seat.position.set(chairX, 0.45, chairZ);
    group.add(seat);

    // Legs (some missing)
    const numLegs = 2 + Math.floor(Math.random() * 3);
    for (let l = 0; l < numLegs; l++) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4),
        new THREE.MeshLambertMaterial({ color: 0x4a3a2a })
      );
      leg.position.set(chairX + (l < 2 ? -0.2 : 0.2), 0.2, chairZ + (l % 2 === 0 ? -0.2 : 0.2));
      group.add(leg);
    }
  }

  // ========== HANGING ITEMS FROM PIPES ==========
  for (let i = 0; i < 20; i++) {
    const hangX = -w / 2 + 10 + Math.random() * (w - 20);
    const hangZ = -d / 2 + 10 + Math.random() * (d - 20);
    const hangY = 2.5 + Math.random();

    // String/wire
    const string = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 0.8 + Math.random() * 0.5, 4),
      new THREE.MeshBasicMaterial({ color: 0x333333 })
    );
    string.position.set(hangX, hangY - 0.4, hangZ);
    group.add(string);

    // Hanging item (bag, clothes, bucket)
    const itemType = Math.random();
    if (itemType < 0.4) {
      // Bag
      const bag = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 6, 4),
        new THREE.MeshLambertMaterial({ color: Math.random() > 0.5 ? 0xaaaaaa : 0x666666 })
      );
      bag.position.set(hangX, hangY - 0.9, hangZ);
      bag.scale.y = 1.3;
      group.add(bag);
    } else if (itemType < 0.7) {
      // Cloth
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.6),
        new THREE.MeshLambertMaterial({
          color: [0x8a7a6a, 0x6a6a7a, 0x7a8a7a][Math.floor(Math.random() * 3)],
          side: THREE.DoubleSide,
        })
      );
      cloth.position.set(hangX, hangY - 0.9, hangZ);
      cloth.rotation.y = Math.random() * Math.PI;
      group.add(cloth);
    } else {
      // Container
      const container = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.08, 0.2, 6),
        new THREE.MeshLambertMaterial({ color: 0x555555 })
      );
      container.position.set(hangX, hangY - 0.9, hangZ);
      group.add(container);
    }
  }

  // ========== STACKED ITEMS AGAINST WALLS ==========
  // Stacked metal dim sum containers (like in the photo)
  for (let stack = 0; stack < 6; stack++) {
    const stackX = -w / 2 + 4 + Math.random() * 8;
    const stackZ = -d / 2 + 10 + Math.random() * (d - 20);
    const numContainers = 3 + Math.floor(Math.random() * 5);

    for (let c = 0; c < numContainers; c++) {
      const container = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12),
        new THREE.MeshLambertMaterial({ color: 0x888888 })
      );
      container.position.set(stackX, 0.1 + c * 0.15, stackZ);
      group.add(container);
    }
  }

  // ========== BRIGHT LIGHTING - Full visibility like outdoors ==========
  // Strong ambient light so everything is clearly visible
  const undergroundAmbient = new THREE.AmbientLight(0xffffff, 0.8);
  group.add(undergroundAmbient);

  // Strong directional light from above
  const undergroundSun = new THREE.DirectionalLight(0xffffff, 0.6);
  undergroundSun.position.set(20, 50, 20);
  group.add(undergroundSun);

  // Additional fill light
  const fillLight = new THREE.DirectionalLight(0xaabbaa, 0.4);
  fillLight.position.set(-20, 40, -20);
  group.add(fillLight);

  // Sparse, flickering fluorescent tubes - not a grid, random placement
  const fluorescentPositions: { x: number; z: number }[] = [];
  for (let i = 0; i < 35; i++) {
    fluorescentPositions.push({
      x: -w / 2 + 10 + Math.random() * (w - 20),
      z: -d / 2 + 10 + Math.random() * (d - 20),
    });
  }

  fluorescentPositions.forEach((pos, i) => {
    // Some lights are dead (dark)
    const isWorking = Math.random() > 0.25;
    const isBroken = Math.random() > 0.7; // Dim/flickering

    // Fluorescent tube fixture
    const tubeLen = 1 + Math.random() * 1.5;
    const tube = new THREE.Mesh(
      new THREE.BoxGeometry(tubeLen, 0.08, 0.15),
      new THREE.MeshBasicMaterial({
        color: isWorking ? (isBroken ? 0x556655 : 0x88aa88) : 0x222222,
      })
    );
    tube.position.set(pos.x, wallH - 0.5 + Math.random() * 0.3, pos.z);
    tube.rotation.y = Math.random() * Math.PI;
    group.add(tube);

    // Metal housing
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(tubeLen + 0.2, 0.12, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x333333 })
    );
    housing.position.set(pos.x, wallH - 0.4, pos.z);
    housing.rotation.y = tube.rotation.y;
    group.add(housing);

    // Light source (only if working) - BRIGHTER for visibility
    if (isWorking) {
      const lightColor = isBroken ? 0x88aa77 : 0xaaddaa;
      const lightIntensity = isBroken ? 0.4 : 0.7;
      const light = new THREE.PointLight(lightColor, lightIntensity, 18);
      light.position.set(pos.x, wallH - 0.6, pos.z);
      group.add(light);
    }
  });

  // Some bare bulbs hanging from wires (gang hideout style)
  for (let i = 0; i < 15; i++) {
    const bulbX = -w / 2 + 15 + Math.random() * (w - 30);
    const bulbZ = -d / 2 + 15 + Math.random() * (d - 30);
    const wireLen = 0.5 + Math.random() * 1.5;

    // Hanging wire
    const wire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, wireLen, 4),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    wire.position.set(bulbX, wallH - wireLen / 2, bulbZ);
    group.add(wire);

    // Bare bulb
    const isLit = Math.random() > 0.3;
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshBasicMaterial({ color: isLit ? 0xffdd88 : 0x222211 })
    );
    bulb.position.set(bulbX, wallH - wireLen - 0.08, bulbZ);
    group.add(bulb);

    if (isLit) {
      const bulbLight = new THREE.PointLight(0xffcc66, 0.5, 12);
      bulbLight.position.set(bulbX, wallH - wireLen - 0.1, bulbZ);
      group.add(bulbLight);
    }
  }

  indoorScene.add(group);
  currentUndergroundGroup = group;
  currentFloorGroup = null;

  // Spawn underground NPCs (rats, foxes, and shady dealers)
  spawnUndergroundNPCs(w, d);

  return { w, d };
}

function spawnUndergroundNPCs(w: number, d: number) {
  // Clear old underground NPCs
  undergroundNPCs.forEach((npc) => indoorScene.remove(npc.mesh));
  undergroundNPCs.length = 0;

  // GRID-BASED SPAWNING to ensure rats are dispersed across ENTIRE map
  // Divide map into grid cells and spawn 1-3 rats per cell
  const cellSize = 12;
  const cellsX = Math.floor(w / cellSize);
  const cellsZ = Math.floor(d / cellSize);

  for (let cx = 0; cx < cellsX; cx++) {
    for (let cz = 0; cz < cellsZ; cz++) {
      // 1-3 rats per cell
      const ratsInCell = 1 + Math.floor(Math.random() * 3);
      for (let r = 0; r < ratsInCell; r++) {
        const rat = createMouseMesh();
        // Underground rats are bigger and nastier
        rat.scale.set(
          1.3 + Math.random() * 0.3,
          1.3 + Math.random() * 0.3,
          1.3 + Math.random() * 0.3
        );

        // Random position within this grid cell
        const x = -w / 2 + cx * cellSize + 2 + Math.random() * (cellSize - 4);
        const z = -d / 2 + cz * cellSize + 2 + Math.random() * (cellSize - 4);
        rat.position.set(x, 0.1, z);
        indoorScene.add(rat);

        // Random target in nearby area (not across the whole map)
        const targetX = x + (Math.random() - 0.5) * 20;
        const targetZ = z + (Math.random() - 0.5) * 20;

        undergroundNPCs.push({
          mesh: rat,
          x,
          z,
          targetX,
          targetZ,
          speed: 0.04 + Math.random() * 0.04, // Fast rats!
          type: 'mouse',
          indoor: true,
          buildingIdx: -1,
          floorIdx: -1,
        });
      }
    }
  }

  // Foxes also grid-distributed but sparser (every 3rd cell)
  for (let cx = 0; cx < cellsX; cx += 3) {
    for (let cz = 0; cz < cellsZ; cz += 3) {
      if (Math.random() > 0.4) {
        // 60% chance per cell
        const fox = createFoxMesh();
        const x = -w / 2 + cx * cellSize + cellSize / 2 + (Math.random() - 0.5) * 8;
        const z = -d / 2 + cz * cellSize + cellSize / 2 + (Math.random() - 0.5) * 8;
        fox.position.set(x, 0.1, z);
        indoorScene.add(fox);

        undergroundNPCs.push({
          mesh: fox,
          x,
          z,
          targetX: x + (Math.random() - 0.5) * 15,
          targetZ: z + (Math.random() - 0.5) * 15,
          speed: 0.025 + Math.random() * 0.025,
          type: 'fox',
          indoor: true,
          buildingIdx: -1,
          floorIdx: -1,
        });
      }
    }
  }

  // ========== SHADY HOODLUMS prowling the underground ==========
  // Spawn 15-25 hoodlums scattered throughout
  const numHoodlums = 15 + Math.floor(Math.random() * 10);
  for (let i = 0; i < numHoodlums; i++) {
    const hoodlum = createDrugDealerMesh();
    const x = -w / 2 + 10 + Math.random() * (w - 20);
    const z = -d / 2 + 10 + Math.random() * (d - 20);
    hoodlum.position.set(x, 0.1, z);
    indoorScene.add(hoodlum);

    const npcData: NPC = {
      mesh: hoodlum,
      x,
      z,
      targetX: x + (Math.random() - 0.5) * 25,
      targetZ: z + (Math.random() - 0.5) * 25,
      speed: 0.015 + Math.random() * 0.015, // Slow, lurking movement
      type: 'person', // Use person type for movement
      indoor: true,
      buildingIdx: -1,
      floorIdx: -1,
      characterId: 'hoodlum', // Mark as hoodlum for interaction
    };
    undergroundNPCs.push(npcData);
  }
}

// Create shady drug dealer mesh
function createDrugDealerMesh(): THREE.Group {
  const group = new THREE.Group();

  // Dark hoodie/jacket (body)
  const hoodieColors = [0x1a1a1a, 0x222222, 0x151520, 0x201515, 0x2a2a2a];
  const hoodieColor = hoodieColors[Math.floor(Math.random() * hoodieColors.length)];

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.7, 0.35),
    new THREE.MeshLambertMaterial({ color: hoodieColor })
  );
  torso.position.y = 0.85;
  group.add(torso);

  // Hood (pulled up, shady)
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.35, 0.4),
    new THREE.MeshLambertMaterial({ color: hoodieColor })
  );
  hood.position.set(0, 1.35, -0.05);
  group.add(hood);

  // Face (barely visible in shadow)
  const face = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.15),
    new THREE.MeshLambertMaterial({ color: 0x8a7a6a })
  );
  face.position.set(0, 1.3, 0.15);
  group.add(face);

  // Suspicious eyes (glinting)
  const eyeColor = Math.random() > 0.5 ? 0xffffff : 0xffddaa;
  const leftEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.03, 0.02),
    new THREE.MeshBasicMaterial({ color: eyeColor })
  );
  leftEye.position.set(-0.06, 1.33, 0.22);
  group.add(leftEye);
  const rightEye = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.03, 0.02),
    new THREE.MeshBasicMaterial({ color: eyeColor })
  );
  rightEye.position.set(0.06, 1.33, 0.22);
  group.add(rightEye);

  // Dark pants
  const pants = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 0.5, 0.3),
    new THREE.MeshLambertMaterial({ color: 0x111115 })
  );
  pants.position.y = 0.35;
  group.add(pants);

  // Legs
  const legMat = new THREE.MeshLambertMaterial({ color: 0x111115 });
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), legMat);
  leftLeg.position.set(-0.12, 0.08, 0);
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.35, 0.18), legMat);
  rightLeg.position.set(0.12, 0.08, 0);
  group.add(rightLeg);

  // Bag/backpack (carrying "goods")
  if (Math.random() > 0.3) {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.35, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x2a2520 })
    );
    bag.position.set(0, 0.7, -0.25);
    group.add(bag);
  }

  // Some have visible phone (checking deals)
  if (Math.random() > 0.6) {
    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.15, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x333355 })
    );
    phone.position.set(0.3, 0.9, 0.15);
    phone.rotation.z = -0.3;
    group.add(phone);

    // Phone screen glow
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.06, 0.1),
      new THREE.MeshBasicMaterial({ color: 0x6688ff })
    );
    screen.position.set(0.3, 0.9, 0.17);
    screen.rotation.z = -0.3;
    group.add(screen);
  }

  return group;
}

// Convert drain position to underground coordinates
function drainToUndergroundCoords(drainIdx: number): { x: number; z: number } {
  const drain = drainPositions[drainIdx];
  if (!drain) return { x: 0, z: 40 };
  return {
    x: drain.x * 1.1,
    z: (drain.z + 35) * 1.1,
  };
}

// Find nearest ladder in underground
function findNearestLadder(): { idx: number; dist: number; x: number; z: number } {
  let nearest = { idx: -1, dist: 999, x: 0, z: 0 };

  for (let i = 0; i < drainPositions.length; i++) {
    const coords = drainToUndergroundCoords(i);
    const dist = Math.sqrt(Math.pow(player.x - coords.x, 2) + Math.pow(player.z - coords.z, 2));
    if (dist < nearest.dist) {
      nearest = { idx: i, dist, x: coords.x, z: coords.z };
    }
  }
  return nearest;
}

function enterUnderground(drainIdx: number) {
  state.mode = 'underground';
  state.currentDrain = drainIdx;
  state.undergroundDepth = 0;
  outdoorScene.visible = false;
  indoorScene.visible = true;
  outdoorScene.remove(playerGroup);
  indoorScene.add(playerGroup);

  createUndergroundView(drainIdx);

  // Spawn at the ladder corresponding to entry drain
  const coords = drainToUndergroundCoords(drainIdx);
  player.x = coords.x;
  player.z = coords.z + 2; // Slightly in front of ladder
  playerGroup.position.set(player.x, 0.1, player.z);
  updateUI();
}

function exitUnderground(exitDrainIdx: number) {
  // Clear sewer NPCs first
  undergroundNPCs.forEach((npc) => indoorScene.remove(npc.mesh));
  undergroundNPCs.length = 0;
  if (currentUndergroundGroup) {
    indoorScene.remove(currentUndergroundGroup);
    currentUndergroundGroup = null;
  }

  // Check if this exit is inside a building
  const exitDrainData = drainPositions[exitDrainIdx];
  if (exitDrainData && exitDrainData.buildingIdx >= 0) {
    // Exit into the building (ground floor)
    const buildingIdx = exitDrainData.buildingIdx;
    state.mode = 'indoor';
    state.currentBuilding = buildingIdx;
    state.currentFloor = 0;
    state.currentDrain = -1;
    
    outdoorScene.visible = false;
    indoorScene.visible = true;
    // playerGroup is already in indoorScene
    
    floor = createFloorView(buildingIdx, 0);
    
    // Spawn near the underground hole
    const hw = floor.w / 2;
    const hd = floor.d / 2;
    player.x = -hw + 8 + 2; // Near the hole
    player.z = -hd + 8 + 2;
    playerGroup.position.set(player.x, 0.1, player.z);
    spawnIndoorNPCs(buildingIdx, 0, floor.w, floor.d);
    updateUI();
    return;
  }

  // Outdoor exit (fallback - shouldn't happen with new system)
  state.mode = 'outdoor';
  const drain = undergroundEntrances[exitDrainIdx];
  outdoorScene.visible = true;
  indoorScene.visible = false;
  indoorScene.remove(playerGroup);
  outdoorScene.add(playerGroup);

  // Spawn at the EXIT drain location
  player.x = drain?.x ?? 0;
  player.z = drain?.z ?? 0;
  playerGroup.position.set(player.x, 0.1, player.z);
  state.currentDrain = -1;
  updateUI();
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
  if (!previewAnimating || !previewScene || !previewCamera || !previewRenderer || !previewCharacter)
    return;

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
  skinOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      skinOptions.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const color = parseInt((btn as HTMLElement).dataset.color || '0xeeddcc');
      playerConfig.skinColor = color;
      updatePlayerAppearance();
      updatePreviewCharacter();
    });
  });

  // Hair color options
  const hairOptions = document.querySelectorAll('#hair-options .color-btn');
  hairOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      hairOptions.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const color = parseInt((btn as HTMLElement).dataset.color || '0x332211');
      playerConfig.hairColor = color;
      updatePlayerAppearance();
      updatePreviewCharacter();
    });
  });

  // Shirt color options
  const shirtOptions = document.querySelectorAll('#shirt-options .color-btn');
  shirtOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      shirtOptions.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const color = parseInt((btn as HTMLElement).dataset.color || '0x334455');
      playerConfig.shirtColor = color;
      updatePlayerAppearance();
      updatePreviewCharacter();
    });
  });

  // Pants color options
  const pantsOptions = document.querySelectorAll('#pants-options .color-btn');
  pantsOptions.forEach((btn) => {
    btn.addEventListener('click', () => {
      pantsOptions.forEach((b) => b.classList.remove('selected'));
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
const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
  action: false,
  actionPressed: false,
};

window.addEventListener('keydown', (e) => {
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

window.addEventListener('keyup', (e) => {
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
popupClose?.addEventListener('click', () => {
  if (popup) popup.style.display = 'none';
});

function showPopup(t: string) {
  if (popup && popupText) {
    popupText.textContent = t;
    popup.style.display = 'flex';
  }
}

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

// ============================================
// SCROLL COLLECTION UI
// ============================================
const scrollCollectionBtn = document.getElementById('scroll-collection') as HTMLDivElement;
const scrollCountEl = document.getElementById('scroll-count') as HTMLDivElement;
const scrollViewer = document.getElementById('scroll-viewer') as HTMLDivElement;
const scrollList = document.getElementById('scroll-list') as HTMLDivElement;
const scrollViewerClose = document.getElementById('scroll-viewer-close') as HTMLButtonElement;

// NPC Dialogue elements
const npcDialogue = document.getElementById('npc-dialogue') as HTMLDivElement;
const npcDialogueHeader = document.getElementById('npc-dialogue-header') as HTMLDivElement;
const npcDialogueText = document.getElementById('npc-dialogue-text') as HTMLDivElement;
const npcDialogueAccept = document.getElementById('npc-dialogue-accept') as HTMLButtonElement;
const npcDialogueClose = document.getElementById('npc-dialogue-close') as HTMLButtonElement;

function updateScrollCount() {
  if (scrollCountEl) {
    scrollCountEl.textContent = `${collectedScrolls.length}/10`;
  }
}

function openScrollViewer() {
  if (!scrollViewer || !scrollList) return;
  scrollViewerOpen = true;

  // Populate scroll list
  scrollList.innerHTML = '';
  for (const scroll of scrollData) {
    const isCollected = collectedScrolls.includes(scroll.id);
    const item = document.createElement('div');
    item.className = `scroll-item ${isCollected ? '' : 'locked'}`;

    if (isCollected) {
      item.innerHTML = `
        <div class="scroll-item-title">${scroll.name}</div>
        <div class="scroll-item-preview">${scroll.excerpt}</div>
        <div class="scroll-item-full">${scroll.fullText}</div>
      `;
      item.addEventListener('click', () => {
        item.classList.toggle('expanded');
      });
    } else {
      item.innerHTML = `
        <div class="scroll-item-title">??? LOCKED ???</div>
        <div class="scroll-item-preview">Find and talk to NPCs to collect this scroll...</div>
      `;
    }

    scrollList.appendChild(item);
  }

  scrollViewer.classList.add('visible');
}

function closeScrollViewer() {
  if (scrollViewer) {
    scrollViewer.classList.remove('visible');
    scrollViewerOpen = false;
  }
}

function collectScroll(scrollId: number) {
  if (!collectedScrolls.includes(scrollId)) {
    collectedScrolls.push(scrollId);
    updateScrollCount();
  }
}

function showNPCDialogue(npc: NPC) {
  if (!npcDialogue || !npcDialogueText || !npcDialogueAccept) return;

  currentDialogueNPC = npc;
  isHoodlumDialogue = false;

  if (npc.hasScroll && !npc.scrollCollected && npc.scrollId !== undefined && npc.characterId) {
    // Supernatural character with a scroll to give - start multi-step dialogue
    const character = supernaturalCharacters.find((c) => c.id === npc.characterId);
    if (character) {
      currentDialogueStage = 'greeting';
      npcDialogueHeader.textContent = character.name.toUpperCase();
      npcDialogueText.textContent = `"${character.interactions.greeting}"`;
      npcDialogueAccept.classList.remove('hidden');
      npcDialogueAccept.textContent = 'CONTINUE';
    }
  } else if (npc.hasScroll && npc.scrollCollected && npc.characterId) {
    // Already collected this character's scroll - show farewell only
    const character = supernaturalCharacters.find((c) => c.id === npc.characterId);
    if (character) {
      currentDialogueStage = 'farewell';
      npcDialogueHeader.textContent = character.name.toUpperCase();
      npcDialogueText.textContent = `"${character.interactions.farewell}"`;
      npcDialogueAccept.classList.remove('hidden');
      npcDialogueAccept.textContent = 'FAREWELL';
    }
  } else {
    // Regular NPC dialogue (no scrolls from regular NPCs)
    currentDialogueStage = 'farewell'; // So pressing button closes it
    const genericDialogues = [
      '"The walls have ears here. Be careful who you trust."',
      '"I\'ve lived here for forty years. The city knows me."',
      '"Looking for something? You won\'t find it standing there."',
      '"The dentist on the third floor is good. No questions asked."',
      '"Stay out of the underground unless you know the way out."',
      '"The noodles from Mr. Chen\'s stall are the best in Kowloon."',
      '"Don\'t bother the animals. Some of them aren\'t what they seem."',
      '"Have you seen the ghosts? They wander these streets at night..."',
      '"Strange spirits roam Kowloon. They carry ancient wisdom."',
      '"The supernatural ones... they have scrolls. Seek them out."',
    ];
    const randomDialogue = genericDialogues[Math.floor(Math.random() * genericDialogues.length)];
    npcDialogueHeader.textContent = 'RESIDENT';
    npcDialogueText.textContent = randomDialogue ?? '"..."';
    npcDialogueAccept.classList.remove('hidden');
    npcDialogueAccept.textContent = 'OK';
  }

  npcDialogue.classList.add('visible');
}

// Show hoodlum dialogue in underground - just dismissive conversation
function showHoodlumDialogue() {
  if (!npcDialogue || !npcDialogueText || !npcDialogueAccept) return;

  isHoodlumDialogue = true;
  currentDialogueStage = 'farewell'; // Just show and close
  currentDialogueNPC = null;

  const shadyDialogues = [
    '"Scram, kid. This ain\'t your turf."',
    '"Get lost. I\'ve got business to attend to."',
    '"You didn\'t see nothin\'. Now beat it."',
    '"Wrong place, wrong time. Move along."',
    '"Keep walking. Nothing for you here."',
    '"Eyes forward. Don\'t make me repeat myself."',
    '"This is my corner. Find your own."',
    '"You got a death wish? Get outta here."',
    '"I don\'t know you. Keep it that way."',
    '"Curiosity killed the cat. Scram."',
  ];

  npcDialogueHeader.textContent = 'SHADY FIGURE';
  npcDialogueText.textContent = shadyDialogues[Math.floor(Math.random() * shadyDialogues.length)] ?? '"..."';
  npcDialogueAccept.classList.remove('hidden');
  npcDialogueAccept.textContent = 'BACK AWAY';
  npcDialogue.classList.add('visible');
}

// Current seller being talked to (for dialogue state)
let currentSellerType: ShopStall['type'] | null = null;

// Show shop seller dialogue
function showSellerDialogue(stallType: ShopStall['type']) {
  if (!npcDialogue || !npcDialogueText || !npcDialogueAccept) return;

  currentSellerType = stallType;
  currentDialogueStage = 'farewell'; // Simple one-shot dialogue
  currentDialogueNPC = null;
  isHoodlumDialogue = false;

  const dialogues = shopSellerDialogues[stallType];
  const randomDialogue = dialogues[Math.floor(Math.random() * dialogues.length)] ?? '"..."';

  // Header based on stall type
  const headers: Record<ShopStall['type'], string> = {
    food: 'FOOD VENDOR',
    clothes: 'CLOTHING SELLER',
    drugs: 'SHADY DEALER',
    electronics: 'ELECTRONICS VENDOR',
    trinkets: 'TRINKET SELLER',
  };

  npcDialogueHeader.textContent = headers[stallType];
  npcDialogueText.textContent = randomDialogue;
  npcDialogueAccept.classList.remove('hidden');
  npcDialogueAccept.textContent = stallType === 'drugs' ? 'WALK AWAY' : 'THANKS';
  npcDialogue.classList.add('visible');
}

function closeNPCDialogue() {
  if (npcDialogue) {
    npcDialogue.classList.remove('visible');
    currentDialogueNPC = null;
    currentDialogueStage = 'closed';
    isHoodlumDialogue = false;
    currentSellerType = null;
  }
}

function advanceDialogue() {
  if (!npcDialogue || !npcDialogueText || !npcDialogueAccept) return;

  // Handle hoodlum dialogue - just close it
  if (isHoodlumDialogue) {
    closeNPCDialogue();
    return;
  }

  // Handle seller dialogue - just close it
  if (currentSellerType !== null) {
    currentSellerType = null;
    closeNPCDialogue();
    return;
  }

  // Handle regular NPC dialogue (no characterId or no scroll) - just close
  if (!currentDialogueNPC || !currentDialogueNPC.characterId || currentDialogueNPC.characterId === 'hoodlum') {
    closeNPCDialogue();
    return;
  }

  // Handle supernatural character multi-step dialogue
  const character = supernaturalCharacters.find((c) => c.id === currentDialogueNPC?.characterId);
  if (!character) {
    closeNPCDialogue();
    return;
  }

  switch (currentDialogueStage) {
    case 'greeting':
      // Move to backstory - show the scroll quote
      currentDialogueStage = 'backstory';
      npcDialogueHeader.textContent = `${character.name.toUpperCase()} SPEAKS...`;
      npcDialogueText.textContent = `"${character.scrollQuote}"`;
      npcDialogueAccept.textContent = 'ACCEPT SCROLL';
      break;

    case 'backstory':
      // Accept the scroll and show congratulation
      if (currentDialogueNPC.scrollId !== undefined) {
        collectScroll(currentDialogueNPC.scrollId);
        currentDialogueNPC.scrollCollected = true;
      }
      currentDialogueStage = 'accept';
      npcDialogueHeader.textContent = 'SCROLL RECEIVED';
      npcDialogueText.textContent = `"${character.interactions.congratulation}"\n\n"${character.interactions.handoff}"`;
      npcDialogueAccept.textContent = 'CONTINUE';
      break;

    case 'accept':
      // Show farewell
      currentDialogueStage = 'farewell';
      npcDialogueHeader.textContent = character.name.toUpperCase();
      npcDialogueText.textContent = `"${character.interactions.farewell}"`;
      npcDialogueAccept.textContent = 'FAREWELL';
      break;

    case 'farewell':
      // Close dialogue
      closeNPCDialogue();
      break;

    default:
      closeNPCDialogue();
  }
}

// Legacy function for compatibility
function acceptScrollFromNPC() {
  advanceDialogue();
}

// Event listeners for scroll UI
scrollCollectionBtn?.addEventListener('click', openScrollViewer);
scrollViewerClose?.addEventListener('click', closeScrollViewer);
npcDialogueClose?.addEventListener('click', closeNPCDialogue);
npcDialogueAccept?.addEventListener('click', acceptScrollFromNPC);

// Initialize scroll count
updateScrollCount();

function updateUI() {
  if (!scrollCounter) return;
  if (state.mode === 'indoor') {
    const bd = buildingsData[state.currentBuilding];
    const floorName =
      state.currentFloor === 0
        ? 'LOBBY'
        : state.currentFloor === (bd?.floors ?? 1) - 1
          ? 'ROOFTOP'
          : `FLOOR ${state.currentFloor + 1}`;
    scrollCounter.textContent = `${floorName} • ${state.currentFloor + 1}/${bd?.floors ?? '?'}`;
  } else if (state.mode === 'underground') {
    scrollCounter.textContent = '地下 UNDERGROUND';
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
  const offsetY = H - 14; // Bottom of map area

  function worldToMap(wx: number, wz: number) {
    return {
      x: offsetX + wx * mapScale,
      y: offsetY + (wz + 5) * mapScale, // +5 to shift so z=-5 is at bottom
    };
  }

  // Draw the merged building mass - one large interconnected structure
  // The entire city block from x=-35 to x=35 and z=-70 to z=-10
  const mergedTopLeft = worldToMap(-35, -70);
  const mergedBottomRight = worldToMap(35, -10);
  const mergedWidth = mergedBottomRight.x - mergedTopLeft.x;
  const mergedHeight = mergedBottomRight.y - mergedTopLeft.y;

  // Main building mass fill - dark concrete
  ctx.fillStyle = '#3a3530';
  ctx.fillRect(mergedTopLeft.x, mergedTopLeft.y, mergedWidth, mergedHeight);

  // Outer border of the merged structure
  ctx.strokeStyle = '#5a5045';
  ctx.lineWidth = 2;
  ctx.strokeRect(mergedTopLeft.x, mergedTopLeft.y, mergedWidth, mergedHeight);

  // Draw internal divisions (lighter lines showing building sections)
  ctx.strokeStyle = '#2a2520';
  ctx.lineWidth = 0.5;

  // Horizontal divisions between rows
  for (const rowZ of [-52, -40, -28, -16]) {
    const start = worldToMap(-35, rowZ - 6);
    const end = worldToMap(35, rowZ - 6);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  // Vertical divisions between columns
  for (const colX of [-25, -15, -5, 5, 15, 25]) {
    const start = worldToMap(colX, -70);
    const end = worldToMap(colX, -10);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  // Highlight individual building sections with varying heights
  for (let i = 0; i < buildingsData.length; i++) {
    const b = buildingsData[i];
    if (!b) continue;
    const pos = worldToMap(b.x, b.z);
    const bw = b.width * mapScale;
    const bd = b.depth * mapScale;

    // Check if this is the current building
    const isCurrentBuilding = state.mode === 'indoor' && state.currentBuilding === i;

    // Height variation shading (taller = lighter)
    const heightShade = Math.floor(b.floors * 1.5);
    if (isCurrentBuilding) {
      ctx.fillStyle = '#ff5533';
      ctx.fillRect(pos.x - bw / 2 + 1, pos.y - bd / 2 + 1, bw - 2, bd - 2);
      ctx.strokeStyle = '#ffaa66';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x - bw / 2, pos.y - bd / 2, bw, bd);
    } else {
      // Subtle height variation
      ctx.fillStyle = `rgb(${50 + heightShade}, ${48 + heightShade}, ${45 + heightShade})`;
      ctx.fillRect(pos.x - bw / 2 + 1, pos.y - bd / 2 + 1, bw - 2, bd - 2);
    }
  }

  // Draw the outdoor underground entrance marker (the main entrance near spawn)
  const outdoorEntrance = drainPositions[0];
  if (outdoorEntrance && outdoorEntrance.buildingIdx === -1) {
    ctx.fillStyle = '#443344';
    const pos = worldToMap(outdoorEntrance.x, outdoorEntrance.z);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#665566';
    ctx.lineWidth = 1;
    ctx.stroke();
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
  } else if (state.mode === 'underground') {
    // Underground minimap - show underground layout
    // Clear and redraw with underground theme
    ctx.fillStyle = '#0a0808';
    ctx.fillRect(4, 4, W - 8, H - 20);

    // Underground boundary
    ctx.strokeStyle = '#3a2a20';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, W - 12, H - 24);

    // Scale for underground (100x120 area mapped to minimap)
    const ugScaleX = (W - 20) / 100;
    const ugScaleZ = (H - 32) / 120;
    const ugScale = Math.min(ugScaleX, ugScaleZ);
    const ugOffsetX = W / 2;
    const ugOffsetY = H / 2 - 6;

    function undergroundToMap(ux: number, uz: number) {
      return {
        x: ugOffsetX + ux * ugScale,
        y: ugOffsetY + uz * ugScale,
      };
    }

    // Draw internal walls
    ctx.fillStyle = '#3a3530';
    const ugWalls = [
      { x: -30, z: -45, w: 18, d: 0.6 },
      { x: 10, z: -40, w: 22, d: 0.6 },
      { x: -20, z: -25, w: 16, d: 0.6 },
      { x: 25, z: -20, w: 20, d: 0.6 },
      { x: -35, z: -5, w: 14, d: 0.6 },
      { x: 5, z: 0, w: 24, d: 0.6 },
      { x: 35, z: 5, w: 12, d: 0.6 },
      { x: -25, z: 20, w: 18, d: 0.6 },
      { x: 15, z: 25, w: 16, d: 0.6 },
      { x: -10, z: 40, w: 20, d: 0.6 },
      { x: 30, z: 35, w: 14, d: 0.6 },
      { x: -35, z: 50, w: 16, d: 0.6 },
      { x: -40, z: -30, w: 0.6, d: 20 },
      { x: -25, z: -35, w: 0.6, d: 16 },
      { x: -10, z: -15, w: 0.6, d: 22 },
      { x: 5, z: -30, w: 0.6, d: 18 },
      { x: 20, z: -10, w: 0.6, d: 24 },
      { x: 35, z: -35, w: 0.6, d: 14 },
      { x: -38, z: 15, w: 0.6, d: 20 },
      { x: -20, z: 30, w: 0.6, d: 18 },
      { x: 0, z: 20, w: 0.6, d: 16 },
      { x: 18, z: 45, w: 0.6, d: 22 },
      { x: 38, z: 25, w: 0.6, d: 18 },
      { x: -30, z: 45, w: 0.6, d: 14 },
    ];

    for (const wall of ugWalls) {
      const wp = undergroundToMap(wall.x, wall.z);
      const ww = Math.max(wall.w * ugScale, 2);
      const wd = Math.max(wall.d * ugScale, 2);
      ctx.fillRect(wp.x - ww / 2, wp.y - wd / 2, ww, wd);
    }

    // Draw pillars
    ctx.fillStyle = '#4a4540';
    for (let px = -35; px <= 35; px += 20) {
      for (let pz = -50; pz <= 50; pz += 25) {
        const pp = undergroundToMap(px, pz);
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw exit ladders (green dots)
    ctx.fillStyle = '#33aa33';
    for (const drain of drainPositions) {
      const lp = undergroundToMap(drain.x * 1.1, (drain.z + 35) * 1.1);
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player position in underground
    const pp = undergroundToMap(player.x, player.z);

    // Outer glow
    const pulse = Math.sin(Date.now() / 150) * 1.5;
    ctx.fillStyle = 'rgba(255, 100, 50, 0.4)';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 6 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#ff6633';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // White center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator
    const angle = Math.PI - player.facing;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pp.x, pp.y);
    ctx.lineTo(pp.x + Math.sin(angle) * 6, pp.y - Math.cos(angle) * 6);
    ctx.stroke();

    // Underground title
    ctx.fillStyle = '#6a5a4a';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('地下 UNDERGROUND', W / 2, H - 5);

    return; // Exit early for underground
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
  ctx.fillText('九龍城寨', W / 2, H - 5);

  // Compass
  ctx.fillStyle = '#6a5a4a';
  ctx.font = '6px monospace';
  ctx.fillText('N', W - 10, 12);
  ctx.textAlign = 'left';
}

// ============================================
// GAME LOGIC
// ============================================
let floor = {
  w: 28,
  d: 20,
  top: false,
  ground: true,
  leftRoof: false,
  rightRoof: false,
  northRoof: false,
  southRoof: false,
  northIdx: -1,
  southIdx: -1,
};

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

function jumpToNorthBuilding() {
  const northIdx = floor.northIdx;
  if (northIdx < 0) return;
  const northBd = buildingsData[northIdx];
  if (!northBd) return;

  state.currentBuilding = northIdx;
  state.currentFloor = northBd.floors - 1; // Top floor of north building
  floor = createFloorView(northIdx, state.currentFloor);
  player.x = 0; // Arrive in center
  player.z = floor.d / 2 - 4; // Arrive on south side (front)
  playerGroup.position.set(player.x, 0.1, player.z);
  spawnIndoorNPCs(northIdx, state.currentFloor, floor.w, floor.d);
  updateUI();
}

function jumpToSouthBuilding() {
  const southIdx = floor.southIdx;
  if (southIdx < 0) return;
  const southBd = buildingsData[southIdx];
  if (!southBd) return;

  state.currentBuilding = southIdx;
  state.currentFloor = southBd.floors - 1; // Top floor of south building
  floor = createFloorView(southIdx, state.currentFloor);
  player.x = 0; // Arrive in center
  player.z = -floor.d / 2 + 4; // Arrive on north side (back)
  playerGroup.position.set(player.x, 0.1, player.z);
  spawnIndoorNPCs(southIdx, state.currentFloor, floor.w, floor.d);
  updateUI();
}

// ============================================
// JUMP ANIMATION SYSTEM
// ============================================
interface JumpAnimation {
  active: boolean;
  progress: number; // 0 to 1
  duration: number; // in frames (60fps)
  startPos: { x: number; y: number; z: number };
  endPos: { x: number; y: number; z: number };
  startHeight: number; // building height player jumps from
  endHeight: number; // building/ground height player lands on
  type: 'roof-to-roof' | 'roof-to-ground';
  targetBuildingIdx: number;
  callback: () => void;
}

const jumpAnim: JumpAnimation = {
  active: false,
  progress: 0,
  duration: 90, // ~1.5 seconds at 60fps
  startPos: { x: 0, y: 0, z: 0 },
  endPos: { x: 0, y: 0, z: 0 },
  startHeight: 0,
  endHeight: 0,
  type: 'roof-to-roof',
  targetBuildingIdx: -1,
  callback: () => {},
};

// Create a jumping player mesh for outdoor animation
const jumpingPlayerGroup = new THREE.Group();
const jumpPlayerBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 1.0, 0.4),
  new THREE.MeshLambertMaterial({ color: playerConfig.shirtColor })
);
jumpPlayerBody.position.y = 0.5;
jumpingPlayerGroup.add(jumpPlayerBody);
const jumpPlayerHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.35, 0.35, 0.35),
  new THREE.MeshLambertMaterial({ color: playerConfig.skinColor })
);
jumpPlayerHead.position.y = 1.2;
jumpingPlayerGroup.add(jumpPlayerHead);
const jumpPlayerLegs = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.5, 0.35),
  new THREE.MeshLambertMaterial({ color: playerConfig.pantsColor })
);
jumpPlayerLegs.position.y = -0.1;
jumpingPlayerGroup.add(jumpPlayerLegs);
jumpingPlayerGroup.visible = false;
outdoorScene.add(jumpingPlayerGroup);

function startJumpAnimation(
  fromBuildingIdx: number,
  toBuildingIdx: number | 'ground',
  type: 'roof-to-roof' | 'roof-to-ground',
  callback: () => void
) {
  const fromBd = buildingsData[fromBuildingIdx];
  if (!fromBd) return;

  const fromHeight = fromBd.floors * 2.2;
  let toX: number, toZ: number, toHeight: number;

  if (toBuildingIdx === 'ground') {
    // Jumping to ground in front of building
    toX = fromBd.x;
    toZ = fromBd.z + fromBd.depth / 2 + 3;
    toHeight = 0;
  } else {
    const toBd = buildingsData[toBuildingIdx];
    if (!toBd) return;
    toX = toBd.x;
    toZ = toBd.z;
    toHeight = toBd.floors * 2.2;
  }

  // Set up animation
  jumpAnim.active = true;
  jumpAnim.progress = 0;
  jumpAnim.duration = type === 'roof-to-ground' ? 75 : 60; // Longer for falling
  jumpAnim.startPos = { x: fromBd.x, y: fromHeight, z: fromBd.z };
  jumpAnim.endPos = { x: toX, y: toHeight, z: toZ };
  jumpAnim.startHeight = fromHeight;
  jumpAnim.endHeight = toHeight;
  jumpAnim.type = type;
  jumpAnim.targetBuildingIdx = toBuildingIdx === 'ground' ? -1 : toBuildingIdx;
  jumpAnim.callback = callback;

  // Show jumping player in outdoor scene
  jumpingPlayerGroup.visible = true;
  jumpingPlayerGroup.position.set(jumpAnim.startPos.x, jumpAnim.startPos.y, jumpAnim.startPos.z);

  // Update colors to match current player
  (jumpPlayerBody.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.shirtColor);
  (jumpPlayerHead.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.skinColor);
  (jumpPlayerLegs.material as THREE.MeshLambertMaterial).color.setHex(playerConfig.pantsColor);

  // Switch to outdoor view for the animation
  outdoorScene.visible = true;
  indoorScene.visible = false;
}

function updateJumpAnimation() {
  if (!jumpAnim.active) return false;

  jumpAnim.progress += 1 / jumpAnim.duration;

  if (jumpAnim.progress >= 1) {
    // Animation complete
    jumpAnim.active = false;
    jumpingPlayerGroup.visible = false;
    jumpAnim.callback();
    return false;
  }

  const t = jumpAnim.progress;
  // Ease in-out for smoother motion
  const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // Parabolic arc for Y position (jump height)
  const arcHeight = 8 + Math.abs(jumpAnim.startHeight - jumpAnim.endHeight) * 0.3;
  const jumpY = 4 * arcHeight * t * (1 - t); // Parabola peaking at t=0.5

  // Linear interpolation for X and Z
  const posX = jumpAnim.startPos.x + (jumpAnim.endPos.x - jumpAnim.startPos.x) * easeT;
  const posZ = jumpAnim.startPos.z + (jumpAnim.endPos.z - jumpAnim.startPos.z) * easeT;
  // Y goes from start height, up in an arc, then down to end height
  const baseY = jumpAnim.startPos.y + (jumpAnim.endPos.y - jumpAnim.startPos.y) * easeT;
  const posY = baseY + jumpY;

  // Update jumping player position
  jumpingPlayerGroup.position.set(posX, posY, posZ);

  // Rotate player to face direction of travel
  const angle = Math.atan2(
    jumpAnim.endPos.x - jumpAnim.startPos.x,
    jumpAnim.endPos.z - jumpAnim.startPos.z
  );
  jumpingPlayerGroup.rotation.y = angle;

  // Slight tilt during jump
  jumpingPlayerGroup.rotation.x = -Math.sin(t * Math.PI) * 0.3;

  return true;
}

function getJumpAnimationCamera() {
  if (!jumpAnim.active) return null;

  const t = jumpAnim.progress;

  // Calculate midpoint of jump for camera focus
  const midX = (jumpAnim.startPos.x + jumpAnim.endPos.x) / 2;
  const midZ = (jumpAnim.startPos.z + jumpAnim.endPos.z) / 2;
  const maxY = Math.max(jumpAnim.startPos.y, jumpAnim.endPos.y);

  // Camera zooms out then back in
  const zoomOut = Math.sin(t * Math.PI); // 0 -> 1 -> 0
  const camDist = 40 + zoomOut * 30; // Further during middle of jump
  const camHeight = 50 + zoomOut * 25;

  return {
    position: { x: midX + 15, y: camHeight, z: midZ + camDist },
    lookAt: {
      x: jumpingPlayerGroup.position.x,
      y: jumpingPlayerGroup.position.y,
      z: jumpingPlayerGroup.position.z,
    },
  };
}

// Wrapper functions that start animations
function animatedJumpToRoof() {
  const fromIdx = state.currentBuilding;
  const fromBd = buildingsData[fromIdx];
  if (!fromBd) return;

  startJumpAnimation(fromIdx, 'ground', 'roof-to-ground', () => {
    exit();
  });
}

function animatedJumpToLeftBuilding() {
  const fromIdx = state.currentBuilding;
  const leftIdx = fromIdx - 1;
  if (leftIdx < 0) return;
  const leftBd = buildingsData[leftIdx];
  if (!leftBd) return;

  startJumpAnimation(fromIdx, leftIdx, 'roof-to-roof', () => {
    state.currentBuilding = leftIdx;
    state.currentFloor = leftBd.floors - 1;
    floor = createFloorView(leftIdx, state.currentFloor);
    player.x = floor.w / 2 - 4;
    player.z = floor.d / 2 - 4;
    indoorScene.add(playerGroup);
    playerGroup.position.set(player.x, 0.1, player.z);
    spawnIndoorNPCs(leftIdx, state.currentFloor, floor.w, floor.d);
    outdoorScene.visible = false;
    indoorScene.visible = true;
    updateUI();
  });
}

function animatedJumpToRightBuilding() {
  const fromIdx = state.currentBuilding;
  const rightIdx = fromIdx + 1;
  if (rightIdx >= buildingsData.length) return;
  const rightBd = buildingsData[rightIdx];
  if (!rightBd) return;

  startJumpAnimation(fromIdx, rightIdx, 'roof-to-roof', () => {
    state.currentBuilding = rightIdx;
    state.currentFloor = rightBd.floors - 1;
    floor = createFloorView(rightIdx, state.currentFloor);
    player.x = -floor.w / 2 + 4;
    player.z = floor.d / 2 - 4;
    indoorScene.add(playerGroup);
    playerGroup.position.set(player.x, 0.1, player.z);
    spawnIndoorNPCs(rightIdx, state.currentFloor, floor.w, floor.d);
    outdoorScene.visible = false;
    indoorScene.visible = true;
    updateUI();
  });
}

function animatedJumpToNorthBuilding() {
  const fromIdx = state.currentBuilding;
  const northIdx = floor.northIdx;
  if (northIdx < 0) return;
  const northBd = buildingsData[northIdx];
  if (!northBd) return;

  startJumpAnimation(fromIdx, northIdx, 'roof-to-roof', () => {
    state.currentBuilding = northIdx;
    state.currentFloor = northBd.floors - 1;
    floor = createFloorView(northIdx, state.currentFloor);
    player.x = 0;
    player.z = floor.d / 2 - 4;
    indoorScene.add(playerGroup);
    playerGroup.position.set(player.x, 0.1, player.z);
    spawnIndoorNPCs(northIdx, state.currentFloor, floor.w, floor.d);
    outdoorScene.visible = false;
    indoorScene.visible = true;
    updateUI();
  });
}

function animatedJumpToSouthBuilding() {
  const fromIdx = state.currentBuilding;
  const southIdx = floor.southIdx;
  if (southIdx < 0) return;
  const southBd = buildingsData[southIdx];
  if (!southBd) return;

  startJumpAnimation(fromIdx, southIdx, 'roof-to-roof', () => {
    state.currentBuilding = southIdx;
    state.currentFloor = southBd.floors - 1;
    floor = createFloorView(southIdx, state.currentFloor);
    player.x = 0;
    player.z = -floor.d / 2 + 4;
    indoorScene.add(playerGroup);
    playerGroup.position.set(player.x, 0.1, player.z);
    spawnIndoorNPCs(southIdx, state.currentFloor, floor.w, floor.d);
    outdoorScene.visible = false;
    indoorScene.visible = true;
    updateUI();
  });
}

// ============================================
// UPDATE
// ============================================
function update() {
  // One-shot action detection
  const acted = keys.actionPressed;
  keys.actionPressed = false;

  // Slower movement indoors (cramped spaces), medium in sewers
  const currentSpeed =
    state.mode === 'indoor'
      ? player.speed * 0.45
      : state.mode === 'underground'
        ? player.speed * 0.7
        : player.speed;

  let mx = 0,
    mz = 0;
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

      const bx = bd.x,
        bz = bd.z,
        bw = bd.width,
        bdepth = bd.depth;
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

    // Check for nearby person NPCs to talk to
    let nearestPersonNPC: NPC | null = null;
    let nearestPersonDist = 999;
    for (const npc of outdoorNPCs) {
      if (npc.type === 'person') {
        const dist = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.z - npc.z, 2));
        if (dist < nearestPersonDist) {
          nearestPersonDist = dist;
          nearestPersonNPC = npc;
        }
      }
    }

    // Check for nearby shop stall sellers
    let nearestStall: ShopStall | null = null;
    let nearestStallDist = 999;
    for (const stall of shopStalls) {
      const dist = Math.sqrt(Math.pow(player.x - stall.x, 2) + Math.pow(player.z - stall.z, 2));
      if (dist < nearestStallDist) {
        nearestStallDist = dist;
        nearestStall = stall;
      }
    }

    // Show prompt when near a person NPC (priority over building)
    if (nearestPersonNPC && nearestPersonDist < 2.5) {
      if (nearestPersonNPC.hasScroll && !nearestPersonNPC.scrollCollected && nearestPersonNPC.characterName) {
        // Supernatural character with uncollected scroll
        prompt = `speak with ${nearestPersonNPC.characterName}`;
      } else if (nearestPersonNPC.hasScroll && !nearestPersonNPC.scrollCollected) {
        prompt = 'talk (has scroll)';
      } else {
        prompt = 'talk';
      }
    } else if (nearestStall && nearestStallDist < 3) {
      // Near a shop stall - show prompt to talk to seller
      const stallNames: Record<ShopStall['type'], string> = {
        food: 'food vendor',
        clothes: 'clothing seller',
        drugs: 'shady dealer',
        electronics: 'electronics vendor',
        trinkets: 'trinket seller',
      };
      prompt = `talk to ${stallNames[nearestStall.type]}`;
    } else if (nearestDist < 5) {
      prompt = 'enter building';
    }

    // Check for nearby sewer drains (only outdoor entrances - buildingIdx === -1)
    let nearestDrainIdx = -1;
    let nearestDrainDist = 999;
    for (let i = 0; i < undergroundEntrances.length; i++) {
      const drainData = drainPositions[i];
      // Only check outdoor entrances (buildingIdx === -1)
      if (!drainData || drainData.buildingIdx !== -1) continue;
      
      const drain = undergroundEntrances[i];
      if (!drain) continue;
      const dist = Math.sqrt(Math.pow(player.x - drain.x, 2) + Math.pow(player.z - drain.z, 2));
      if (dist < nearestDrainDist) {
        nearestDrainDist = dist;
        nearestDrainIdx = i;
      }
    }

    // Sewer drain prompt takes priority if closer
    if (nearestDrainDist < 2.5) {
      prompt = 'go underground';
    }

    // Press E/SPACE/ENTER to interact
    if (acted) {
      // Person NPC takes priority if very close
      if (nearestPersonNPC && nearestPersonDist < 2.5) {
        showNPCDialogue(nearestPersonNPC);
        showPrompt('');
        return;
      }
      // Shop stall seller interaction
      if (nearestStall && nearestStallDist < 3) {
        showSellerDialogue(nearestStall.type);
        showPrompt('');
        return;
      }
      // Sewer takes priority if very close
      if (nearestDrainIdx >= 0 && nearestDrainDist < 2.5) {
        enterUnderground(nearestDrainIdx);
        showPrompt('');
        return;
      }
      if (nearestBuildingIdx >= 0 && nearestDist < 6) {
        enter(nearestBuildingIdx);
        showPrompt('');
        return;
      }
    }
  } else if (state.mode === 'underground') {
    // Underground movement - MASSIVE area (100x120)
    const newX = player.x + mx;
    const newZ = player.z + mz;
    const playerR = 0.5;

    let finalX = newX;
    let finalZ = newZ;

    // Internal walls (same positions as rendered walls)
    const internalWalls = [
      // Horizontal walls
      { x: -30, z: -45, w: 18, d: 0.6 },
      { x: 10, z: -40, w: 22, d: 0.6 },
      { x: -20, z: -25, w: 16, d: 0.6 },
      { x: 25, z: -20, w: 20, d: 0.6 },
      { x: -35, z: -5, w: 14, d: 0.6 },
      { x: 5, z: 0, w: 24, d: 0.6 },
      { x: 35, z: 5, w: 12, d: 0.6 },
      { x: -25, z: 20, w: 18, d: 0.6 },
      { x: 15, z: 25, w: 16, d: 0.6 },
      { x: -10, z: 40, w: 20, d: 0.6 },
      { x: 30, z: 35, w: 14, d: 0.6 },
      { x: -35, z: 50, w: 16, d: 0.6 },
      // Vertical walls
      { x: -40, z: -30, w: 0.6, d: 20 },
      { x: -25, z: -35, w: 0.6, d: 16 },
      { x: -10, z: -15, w: 0.6, d: 22 },
      { x: 5, z: -30, w: 0.6, d: 18 },
      { x: 20, z: -10, w: 0.6, d: 24 },
      { x: 35, z: -35, w: 0.6, d: 14 },
      { x: -38, z: 15, w: 0.6, d: 20 },
      { x: -20, z: 30, w: 0.6, d: 18 },
      { x: 0, z: 20, w: 0.6, d: 16 },
      { x: 18, z: 45, w: 0.6, d: 22 },
      { x: 38, z: 25, w: 0.6, d: 18 },
      { x: -30, z: 45, w: 0.6, d: 14 },
    ];

    // Check collision with internal walls
    for (const wall of internalWalls) {
      const halfW = wall.w / 2 + playerR;
      const halfD = wall.d / 2 + playerR;

      if (
        finalX > wall.x - halfW &&
        finalX < wall.x + halfW &&
        finalZ > wall.z - halfD &&
        finalZ < wall.z + halfD
      ) {
        // Push out to nearest edge
        const distLeft = finalX - (wall.x - halfW);
        const distRight = wall.x + halfW - finalX;
        const distBack = finalZ - (wall.z - halfD);
        const distFront = wall.z + halfD - finalZ;

        const minDist = Math.min(distLeft, distRight, distBack, distFront);

        if (minDist === distLeft) finalX = wall.x - halfW;
        else if (minDist === distRight) finalX = wall.x + halfW;
        else if (minDist === distBack) finalZ = wall.z - halfD;
        else finalZ = wall.z + halfD;
      }
    }

    // Check collision with pillars
    // Pillars are on a grid: x from -35 to 35 (step 20), z from -50 to 50 (step 25)
    const pillarSize = 1.2;
    for (let px = -35; px <= 35; px += 20) {
      for (let pz = -50; pz <= 50; pz += 25) {
        const halfP = pillarSize / 2 + playerR;

        if (
          finalX > px - halfP &&
          finalX < px + halfP &&
          finalZ > pz - halfP &&
          finalZ < pz + halfP
        ) {
          const distLeft = finalX - (px - halfP);
          const distRight = px + halfP - finalX;
          const distBack = finalZ - (pz - halfP);
          const distFront = pz + halfP - finalZ;

          const minDist = Math.min(distLeft, distRight, distBack, distFront);

          if (minDist === distLeft) finalX = px - halfP;
          else if (minDist === distRight) finalX = px + halfP;
          else if (minDist === distBack) finalZ = pz - halfP;
          else finalZ = pz + halfP;
        }
      }
    }

    // Outer boundary (the perimeter walls)
    const sw = 48,
      sd = 58;
    finalX = Math.max(-sw, Math.min(sw, finalX));
    finalZ = Math.max(-sd, Math.min(sd, finalZ));

    player.x = finalX;
    player.z = finalZ;
    playerGroup.position.set(player.x, 0.1, player.z);

    // Find nearest hoodlum (person type NPC with hoodlum characterId)
    let nearestHoodlum: NPC | null = null;
    let nearestHoodlumDist = 999;
    for (const npc of undergroundNPCs) {
      if (npc.type === 'person' && npc.characterId === 'hoodlum') {
        const dist = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.z - npc.z, 2));
        if (dist < nearestHoodlumDist) {
          nearestHoodlumDist = dist;
          nearestHoodlum = npc;
        }
      }
    }

    // Show hoodlum prompt when near (priority over ladder)
    if (nearestHoodlum && nearestHoodlumDist < 2.5) {
      prompt = 'talk to shady figure';
    }

    // Handle hoodlum interaction
    if (acted && nearestHoodlum && nearestHoodlumDist < 2.5) {
      showHoodlumDialogue();
      showPrompt('');
      return;
    }

    // Find nearest ladder exit
    const nearest = findNearestLadder();
    nearestLadderIdx = nearest.idx;

    // Show exit prompt when near any ladder (if not near hoodlum)
    if (nearest.dist < 3 && (!nearestHoodlum || nearestHoodlumDist >= 2.5)) {
      // Show which exit this is
      const exitName = nearest.idx === 0 ? 'SPAWN' : `EXIT ${nearest.idx}`;
      prompt = `climb up (${exitName})`;
    }

    if (acted && nearest.dist < 3) {
      exitUnderground(nearest.idx);
      showPrompt('');
      return;
    }
  } else {
    const oldX = player.x;
    const oldZ = player.z;
    player.x += mx;
    player.z += mz;
    const hw = floor.w / 2 - 0.5,
      hd = floor.d / 2 - 0.5;

    // ========== ROOM COLLISION - Only enter through doors ==========
    const doorW = 1.6;

    // Define room positions with door side
    type RoomDef = {
      x: number;
      z: number;
      w: number;
      d: number;
      door: 'front' | 'back' | 'left' | 'right';
    };
    let rooms: RoomDef[] = [];

    if (floor.ground) {
      // Lobby rooms (with w, d, and door side)
      const hw = floor.w / 2,
        hd = floor.d / 2;
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
        if (
          player.x > left &&
          player.x < right &&
          player.z > back - wallT &&
          player.z < back + wallT
        ) {
          if (oldZ >= back) player.z = back + wallT;
          else player.z = back - wallT;
        }
      } else {
        // Back wall with door opening
        if (
          player.x > left &&
          player.x < right &&
          player.z > back - wallT &&
          player.z < back + wallT &&
          (player.x < room.x - doorHalf || player.x > room.x + doorHalf)
        ) {
          if (oldZ >= back) player.z = back + wallT;
          else player.z = back - wallT;
        }
      }

      // FRONT WALL (z = front) - solid unless door is 'front'
      if (room.door !== 'front') {
        // Solid front wall
        if (
          player.x > left &&
          player.x < right &&
          player.z > front - wallT &&
          player.z < front + wallT
        ) {
          if (oldZ <= front) player.z = front - wallT;
          else player.z = front + wallT;
        }
      } else {
        // Front wall with door opening
        if (
          player.x > left &&
          player.x < right &&
          player.z > front - wallT &&
          player.z < front + wallT &&
          (player.x < room.x - doorHalf || player.x > room.x + doorHalf)
        ) {
          if (oldZ <= front) player.z = front - wallT;
          else player.z = front + wallT;
        }
      }

      // LEFT WALL (x = left) - solid unless door is 'left'
      if (room.door !== 'left') {
        // Solid left wall
        if (
          player.z > back &&
          player.z < front &&
          player.x > left - wallT &&
          player.x < left + wallT
        ) {
          if (oldX >= left) player.x = left + wallT;
          else player.x = left - wallT;
        }
      } else {
        // Left wall with door opening
        if (
          player.z > back &&
          player.z < front &&
          player.x > left - wallT &&
          player.x < left + wallT &&
          (player.z < room.z - doorHalf || player.z > room.z + doorHalf)
        ) {
          if (oldX >= left) player.x = left + wallT;
          else player.x = left - wallT;
        }
      }

      // RIGHT WALL (x = right) - solid unless door is 'right'
      if (room.door !== 'right') {
        // Solid right wall
        if (
          player.z > back &&
          player.z < front &&
          player.x > right - wallT &&
          player.x < right + wallT
        ) {
          if (oldX <= right) player.x = right - wallT;
          else player.x = right + wallT;
        }
      } else {
        // Right wall with door opening
        if (
          player.z > back &&
          player.z < front &&
          player.x > right - wallT &&
          player.x < right + wallT &&
          (player.z < room.z - doorHalf || player.z > room.z + doorHalf)
        ) {
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
    if (
      player.x > upStairX - 2.5 &&
      player.x < upStairX + 2.5 &&
      player.z < stairZEnd &&
      player.z > stairZStart
    ) {
      if (mz < 0) player.z = stairZEnd; // pushed back to front of stairs
    }
    // Block walking into DOWN stairs area (except from front edge)
    if (
      player.x > downStairX - 2.5 &&
      player.x < downStairX + 2.5 &&
      player.z < stairZEnd &&
      player.z > stairZStart
    ) {
      if (mz < 0) player.z = stairZEnd; // pushed back to front of stairs
    }

    player.x = Math.max(-hw, Math.min(hw, player.x));
    player.z = Math.max(-hd, Math.min(hd, player.z));
    playerGroup.position.set(player.x, 0.1, player.z);

    // Check for nearby person NPCs to talk to (indoors)
    let nearestIndoorNPC: NPC | null = null;
    let nearestIndoorNPCDist = 999;
    for (const npc of indoorNPCs) {
      if (npc.type === 'person') {
        const dist = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.z - npc.z, 2));
        if (dist < nearestIndoorNPCDist) {
          nearestIndoorNPCDist = dist;
          nearestIndoorNPC = npc;
        }
      }
    }

    // Check proximity to interactive elements (standing in front of stairs)
    const atUpStairs =
      !floor.top &&
      Math.abs(player.x - upStairX) < 3 &&
      player.z > stairZEnd - 1 &&
      player.z < stairZEnd + 2;
    const atDownStairs =
      !floor.ground &&
      Math.abs(player.x - downStairX) < 3 &&
      player.z > stairZEnd - 1 &&
      player.z < stairZEnd + 2;
    const nearExit = floor.ground && Math.abs(player.x) < 4 && player.z > hd - 3;
    
    // Check for underground entrance (only on ground floor of buildings that have one)
    const undergroundEntryForThisBuilding = drainPositions.find(
      (drain) => drain.buildingIdx === state.currentBuilding
    );
    const holeX = -hw + 8;
    const holeZ = -hd + 8;
    const nearUndergroundHole = floor.ground && undergroundEntryForThisBuilding &&
      Math.abs(player.x - holeX) < 2 && Math.abs(player.z - holeZ) < 2;
    
    const nearJumpDown = floor.top && Math.abs(player.x) < 4 && player.z > hd - 5;
    const nearJumpLeft = floor.leftRoof && player.x < -hw + 6;
    const nearJumpRight = floor.rightRoof && player.x > hw - 6;
    const nearJumpNorth = floor.northRoof && player.z < -hd + 6; // North is back (negative Z)
    const nearJumpSouth = floor.southRoof && player.z > hd - 6 && Math.abs(player.x) > 6; // South is front, but not at center (where jump down is)
    const atDownStairsRoof =
      floor.top &&
      Math.abs(player.x - downStairX) < 3 &&
      player.z > stairZEnd - 1 &&
      player.z < stairZEnd + 2;

    // Set prompt based on what player is near (NPC takes priority)
    if (nearestIndoorNPC && nearestIndoorNPCDist < 2.5) {
      if (nearestIndoorNPC.hasScroll && !nearestIndoorNPC.scrollCollected) {
        prompt = 'talk (has scroll)';
      } else {
        prompt = 'talk';
      }
    } else if (nearUndergroundHole) prompt = 'descend underground';
    else if (atUpStairs) prompt = 'upstairs';
    else if (atDownStairs || atDownStairsRoof) prompt = 'downstairs';
    else if (nearExit) prompt = 'exit';
    else if (nearJumpDown) prompt = 'jump down';
    else if (nearJumpLeft) prompt = 'jump left';
    else if (nearJumpRight) prompt = 'jump right';
    else if (nearJumpNorth) prompt = 'jump north';
    else if (nearJumpSouth) prompt = 'jump south';

    if (acted) {
      // NPC interaction takes priority
      if (nearestIndoorNPC && nearestIndoorNPCDist < 2.5) {
        showNPCDialogue(nearestIndoorNPC);
        showPrompt('');
        return;
      }
      // Underground entrance from inside building
      if (nearUndergroundHole && undergroundEntryForThisBuilding) {
        // Find the drain index for this building's entrance
        const drainIdx = drainPositions.findIndex(
          (drain) => drain.buildingIdx === state.currentBuilding
        );
        if (drainIdx >= 0) {
          enterUnderground(drainIdx);
          showPrompt('');
          return;
        }
      }
      if (atUpStairs) {
        goUp();
        showPrompt('');
        return;
      }
      if (atDownStairs || atDownStairsRoof) {
        goDown();
        showPrompt('');
        return;
      }
      if (nearExit) {
        exit();
        showPrompt('');
        return;
      }
      if (nearJumpDown) {
        animatedJumpToRoof();
        showPrompt('');
        return;
      }
      if (nearJumpLeft) {
        animatedJumpToLeftBuilding();
        showPrompt('');
        return;
      }
      if (nearJumpRight) {
        animatedJumpToRightBuilding();
        showPrompt('');
        return;
      }
      if (nearJumpNorth) {
        animatedJumpToNorthBuilding();
        showPrompt('');
        return;
      }
      if (nearJumpSouth) {
        animatedJumpToSouthBuilding();
        showPrompt('');
        return;
      }
    }
  }

  showPrompt(prompt);
}

// ============================================
// CAMERA
// ============================================
function updateCamera() {
  // Check if jump animation is active - use cinematic camera
  const jumpCam = getJumpAnimationCamera();
  if (jumpCam) {
    viewSize = 35; // Wider view for cinematic effect
    camera.position.set(jumpCam.position.x, jumpCam.position.y, jumpCam.position.z);
    camera.lookAt(jumpCam.lookAt.x, jumpCam.lookAt.y, jumpCam.lookAt.z);
  } else if (state.mode === 'outdoor') {
    viewSize = 18;
    // Camera follows player directly from above/behind at a steeper angle
    // This keeps the player visible in alleyways without relying on transparency
    camera.position.set(player.x + 8, 45, player.z + 18);
    camera.lookAt(player.x, 0, player.z - 5);
    // Still update transparency for buildings directly in front
    updateBuildingTransparency();
  } else if (state.mode === 'underground') {
    viewSize = 28;
    // Follow player through massive sewer system
    camera.position.set(player.x + 10, 35, player.z + 25);
    camera.lookAt(player.x, 0, player.z);
  } else {
    viewSize = 20;
    // Static 2.5D isometric view - fixed camera position looking at floor center
    // Camera doesn't follow player to reduce motion sickness
    camera.position.set(15, 30, 25);
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

  // Check if jump animation is playing
  const isJumping = updateJumpAnimation();

  // Only update normal game logic if not in jump animation
  if (!isJumping) {
    update();
    updateNPCs();
  }

  // Update ghosts (always, even during jumps for visual effect)
  updateAmbientGhosts();
  updateSupernaturalCharacters();

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
