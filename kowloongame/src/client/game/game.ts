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
  if (!bd) return { w: 28, d: 20, top: false, ground: true, leftRoof: false, rightRoof: false };
  
  const group = new THREE.Group();
  const w = 28, d = 20, wallH = 4;
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
    
    // Clothes on line
    const clothColors = [0xff6666, 0x6666ff, 0xffff66, 0x66ff66];
    for (let i = 0; i < 4; i++) {
      const cloth = new THREE.Mesh(
        new THREE.PlaneGeometry(0.8, 1.2),
        new THREE.MeshBasicMaterial({ color: clothColors[i], side: THREE.DoubleSide })
      );
      cloth.position.set(-3 + i * 2, 1.5, 0);
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

    // Stairwell (back right) - doorframe and stairs visible
    const stairFrame = new THREE.Mesh(
      new THREE.BoxGeometry(4, wallH, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x4a4035 })
    );
    stairFrame.position.set(w/2 - 3.5, wallH/2, -d/2 + 0.2);
    group.add(stairFrame);
    // Dark stairwell opening
    const stairOpening = new THREE.Mesh(
      new THREE.PlaneGeometry(3, 3),
      new THREE.MeshBasicMaterial({ color: 0x1a1815 })
    );
    stairOpening.position.set(w/2 - 3.5, 1.6, -d/2 + 0.25);
    group.add(stairOpening);
    // Visible stairs going up
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.2, 0.6),
        new THREE.MeshLambertMaterial({ color: 0x5a5550 })
      );
      step.position.set(w/2 - 3.5, 0.3 + s * 0.4, -d/2 + 2 + s * 0.5);
      group.add(step);
    }
    // Handrail
    const rail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3, 6),
      new THREE.MeshLambertMaterial({ color: 0x666655 })
    );
    rail.rotation.x = Math.PI / 4;
    rail.position.set(w/2 - 2, 1.5, -d/2 + 3);
    group.add(rail);
    // Stair light
    const stairLight = new THREE.PointLight(0xffffee, 0.4, 8);
    stairLight.position.set(w/2 - 3.5, 2.5, -d/2 + 3);
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
      new THREE.MeshLambertMaterial({ color: 0x553333 })
    );
    hallFloor.rotation.x = -Math.PI / 2;
    hallFloor.position.y = 0.01;
    group.add(hallFloor);

    // Carpet pattern
    const runner = new THREE.Mesh(
      new THREE.PlaneGeometry(4, d - 2),
      new THREE.MeshLambertMaterial({ color: 0x442222 })
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

    // Apartment doors on both sides
    const doorPositions = [-8, -4, 0, 4, 8];
    const apartmentSide = floor % 2 === 0 ? -1 : 1; // Alternate which side is "open"
    
    for (const px of doorPositions) {
      // Left side doors
      const leftDoor = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 2.8),
        new THREE.MeshLambertMaterial({ color: 0x553322 })
      );
      leftDoor.position.set(-w/2 + 0.2, 1.4, px);
      leftDoor.rotation.y = Math.PI / 2;
      group.add(leftDoor);
      
      // Door number
      const numL = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xccaa77 })
      );
      numL.position.set(-w/2 + 0.25, 2.2, px);
      numL.rotation.y = Math.PI / 2;
      group.add(numL);

      // Right side doors
      const rightDoor = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 2.8),
        new THREE.MeshLambertMaterial({ color: 0x443322 })
      );
      rightDoor.position.set(w/2 - 0.2, 1.4, px);
      rightDoor.rotation.y = -Math.PI / 2;
      group.add(rightDoor);
      
      const numR = new THREE.Mesh(
        new THREE.PlaneGeometry(0.4, 0.3),
        new THREE.MeshBasicMaterial({ color: 0xccaa77 })
      );
      numR.position.set(w/2 - 0.25, 2.2, px);
      numR.rotation.y = -Math.PI / 2;
      group.add(numR);

      // Some doors have light underneath (occupied)
      if (Math.random() > 0.4) {
        const light = new THREE.PointLight(0xffdd88, 0.3, 3);
        light.position.set(apartmentSide * (w/2 - 1), 0.1, px);
        group.add(light);
      }
    }

    // Wall decorations - peeling posters
    for (let i = 0; i < 3; i++) {
      const poster = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 2),
        new THREE.MeshBasicMaterial({ color: [0xcc6666, 0x66cc66, 0x6666cc][i] })
      );
      poster.position.set(-6 + i * 6, 2, -d/2 + 0.2);
      group.add(poster);
    }

    // Fire extinguisher
    const extinguisher = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8),
      new THREE.MeshBasicMaterial({ color: 0xff2222 })
    );
    extinguisher.position.set(-w/2 + 0.4, 1.2, 6);
    group.add(extinguisher);

    // Flickering hallway lights
    const ceilLight1 = new THREE.PointLight(0xffffcc, 0.8, 15);
    ceilLight1.position.set(-5, 3.5, 0);
    group.add(ceilLight1);
    const ceilLight2 = new THREE.PointLight(0xffffcc, 0.6, 15);
    ceilLight2.position.set(5, 3.5, 0);
    group.add(ceilLight2);

    // Floor number on wall
    const floorNum = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x3a3530 })
    );
    floorNum.position.set(0, 2.5, -d/2 + 0.2);
    group.add(floorNum);

    // STAIRWELL AREA (back right corner) - UP and DOWN side by side
    // Stairwell enclosure
    const stairwellWallL = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, wallH, 7),
      new THREE.MeshLambertMaterial({ color: 0x4a4540 })
    );
    stairwellWallL.position.set(w/2 - 8, wallH/2, -d/2 + 3.5);
    group.add(stairwellWallL);
    
    // Stairwell floor (landing)
    const landing = new THREE.Mesh(
      new THREE.PlaneGeometry(7.5, 6),
      new THREE.MeshLambertMaterial({ color: 0x3a3530 })
    );
    landing.rotation.x = -Math.PI / 2;
    landing.position.set(w/2 - 4, 0.03, -d/2 + 3);
    group.add(landing);

    // UP stairs (right side of stairwell)
    const upSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x2a2520 })
    );
    upSign.position.set(w/2 - 2, 3, -d/2 + 0.2);
    group.add(upSign);
    // Stairs going up
    for (let s = 0; s < 5; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.18, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x5a5550 })
      );
      step.position.set(w/2 - 2, 0.2 + s * 0.35, -d/2 + 1.5 + s * 0.45);
      group.add(step);
    }
    // Up handrail
    const upRailL = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 4),
      new THREE.MeshLambertMaterial({ color: 0x666655 })
    );
    upRailL.rotation.x = Math.PI / 5;
    upRailL.position.set(w/2 - 0.5, 1.3, -d/2 + 3);
    group.add(upRailL);

    // DOWN stairs (left side of stairwell)
    const downSign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x2a2520 })
    );
    downSign.position.set(w/2 - 6, 3, -d/2 + 0.2);
    group.add(downSign);
    // Stairs going down (into darkness)
    for (let s = 0; s < 4; s++) {
      const step = new THREE.Mesh(
        new THREE.BoxGeometry(3, 0.18, 0.5),
        new THREE.MeshLambertMaterial({ color: 0x4a4540 })
      );
      step.position.set(w/2 - 6, -0.1 - s * 0.3, -d/2 + 1.5 + s * 0.4);
      group.add(step);
    }
    // Down handrail
    const downRailL = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.08, 3.5),
      new THREE.MeshLambertMaterial({ color: 0x555544 })
    );
    downRailL.rotation.x = -Math.PI / 6;
    downRailL.position.set(w/2 - 7.5, 0.8, -d/2 + 2.5);
    group.add(downRailL);

    // Divider between up and down
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1.2, 5),
      new THREE.MeshLambertMaterial({ color: 0x4a4540 })
    );
    divider.position.set(w/2 - 4, 0.6, -d/2 + 3);
    group.add(divider);

    // Stairwell light
    const stairLight = new THREE.PointLight(0xffffee, 0.4, 10);
    stairLight.position.set(w/2 - 4, 3, -d/2 + 3);
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

// Player starts in FRONT of buildings
playerGroup.position.set(0, 0.1, 4);
outdoorScene.add(playerGroup);

const player = { x: 0, z: 4, facing: 0, speed: 0.28 };

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
  // Spawn at stairwell (back-right, near the down stairs side)
  player.x = floor.w / 2 - 6;
  player.z = -floor.d / 2 + 5;
  playerGroup.position.set(player.x, 0.1, player.z);
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
  updateUI();
}

function jumpRoof() {
  exit();
  showPopup("You jumped from the roof!");
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
  updateUI();
  showPopup("Jumped to building on the left!");
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
  updateUI();
  showPopup("Jumped to building on the right!");
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
    player.x += mx;
    player.z += mz;
    player.x = Math.max(-42, Math.min(42, player.x));
    player.z = Math.max(0, Math.min(8, player.z));
    playerGroup.position.set(player.x, 0.1, player.z);

    // Find nearest building for prompt
    let nearestDist = 999;
    for (const bd of buildingsData) {
      const d = Math.abs(player.x - bd.x);
      if (d < nearestDist) nearestDist = d;
    }
    
    // Show prompt when near a building
    if (nearestDist < 5) {
      prompt = 'enter';
    }

    // Press E/SPACE/ENTER to enter NEAREST building
    if (acted && buildingsData.length > 0) {
      let best = 0;
      let bestDist = Math.abs(player.x - (buildingsData[0]?.x ?? 0));
      for (let i = 1; i < buildingsData.length; i++) {
        const bd = buildingsData[i];
        if (!bd) continue;
        const d = Math.abs(player.x - bd.x);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      enter(best);
      showPrompt('');
      return;
    }
  } else {
    player.x += mx;
    player.z += mz;
    const hw = floor.w / 2 - 0.5, hd = floor.d / 2 - 0.5;
    player.x = Math.max(-hw, Math.min(hw, player.x));
    player.z = Math.max(-hd, Math.min(hd, player.z));
    playerGroup.position.set(player.x, 0.1, player.z);

    // Check proximity to interactive elements
    // Stairwell is in back-right corner: UP on right side, DOWN on left side
    const inStairwell = player.x > hw - 10 && player.z < -hd + 7;
    const nearStairsUp = !floor.top && inStairwell && player.x > hw - 5;
    const nearStairsDown = !floor.ground && inStairwell && player.x < hw - 5;
    const nearExit = floor.ground && Math.abs(player.x) < 4 && player.z > hd - 3;
    const nearJumpDown = floor.top && Math.abs(player.x) < 4 && player.z > hd - 5;
    const nearJumpLeft = floor.leftRoof && player.x < -hw + 6 && player.z > hd - 5;
    const nearJumpRight = floor.rightRoof && player.x > hw - 6 && player.z > hd - 5;
    const nearStairsDownRoof = floor.top && inStairwell && player.x < hw - 5;

    // Set prompt based on what player is near
    if (nearStairsUp) prompt = 'upstairs';
    else if (nearStairsDown || nearStairsDownRoof) prompt = 'downstairs';
    else if (nearExit) prompt = 'exit';
    else if (nearJumpDown) prompt = 'jump down';
    else if (nearJumpLeft) prompt = 'jump left';
    else if (nearJumpRight) prompt = 'jump right';

    if (acted) {
      if (nearStairsUp) { goUp(); showPrompt(''); return; }
      if (nearStairsDown || nearStairsDownRoof) { goDown(); showPrompt(''); return; }
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
