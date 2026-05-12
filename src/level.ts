import * as THREE from 'three';
import { Tween, Easing, Group as TweenGroup } from '@tweenjs/tween.js';
import { LevelData, Facing, yawFor } from './types';
import { Car } from './car';
import { wobbleClicked, flashBlockedRed, addBlockerOutline, addDashedConnector } from './effects';

export interface LevelEvents {
  onMove: (moves: number) => void;
  onWin: () => void;
}

export class Level {
  data: LevelData;
  scene: THREE.Scene;
  cars: Car[];
  ground: THREE.Group;
  moves = 0;

  private tweens = new TweenGroup();
  private events: LevelEvents;
  private picker = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private won = false;
  private hoveredCar: Car | null = null;

  constructor(data: LevelData, scene: THREE.Scene, events: LevelEvents) {
    this.data = data;
    this.scene = scene;
    this.events = events;
    validateLevel(data);
    this.ground = buildGround(data);
    scene.add(this.ground);
    this.cars = data.cars.map(spec => new Car(spec, data.gridWidth, data.gridHeight));
    for (const c of this.cars) scene.add(c.mesh);
  }

  dispose(): void {
    for (const c of this.cars) this.scene.remove(c.mesh);
    this.scene.remove(this.ground);
    disposeObject(this.ground);
    for (const c of this.cars) disposeObject(c.mesh);
    this.hoveredCar = null;
  }

  update(): void {
    this.tweens.update();
    for (const c of this.cars) c.updateWarning();
  }

  handlePointer(clientX: number, clientY: number, camera: THREE.Camera): void {
    if (this.won) return;
    const target = this.pickCar(clientX, clientY, camera);
    if (!target || target.driving || !target.alive) return;
    this.driveCar(target);
  }

  handleHover(clientX: number, clientY: number, camera: THREE.Camera): void {
    if (this.won) {
      this.clearHover();
      return;
    }
    const target = this.pickCar(clientX, clientY, camera);
    if (target === this.hoveredCar) return;
    if (this.hoveredCar) this.hoveredCar.setHover(false);
    if (target && !target.driving && target.alive) target.setHover(true);
    this.hoveredCar = target;
  }

  clearHover(): void {
    if (this.hoveredCar) {
      this.hoveredCar.setHover(false);
      this.hoveredCar = null;
    }
  }

  private pickCar(clientX: number, clientY: number, camera: THREE.Camera): Car | null {
    this.ndc.x = (clientX / window.innerWidth) * 2 - 1;
    this.ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    this.picker.setFromCamera(this.ndc, camera);
    const meshes = this.cars.filter(c => c.alive && !c.driving).map(c => c.mesh);
    if (meshes.length === 0) return null;
    const hits = this.picker.intersectObjects(meshes, true);
    for (const hit of hits) {
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        const c = obj.userData['car'] as Car | undefined;
        if (c) return c;
        obj = obj.parent;
      }
    }
    return null;
  }

  private driveCar(car: Car): void {
    if (this.hoveredCar === car) {
      car.setHover(false);
      this.hoveredCar = null;
    }
    const dir = car.facingDir();
    const others = this.cars.filter(c => c !== car && c.alive);
    let blockedDist = Infinity;
    let blockerCar: Car | null = null;
    for (const other of others) {
      const d = collisionDistance(car, other);
      if (d < blockedDist) {
        blockedDist = d;
        blockerCar = other;
      }
    }
    const exitDist = distanceToExit(car, this.data.gridWidth, this.data.gridHeight);

    const exits = exitDist <= blockedDist;
    const driveDist = exits ? exitDist : Math.max(0, blockedDist);

    this.moves++;
    this.events.onMove(this.moves);

    if (driveDist <= 0.001) {
      this.showBlockedFeedback(car, blockerCar);
      return;
    }

    car.driving = true;
    const start = car.mesh.position.clone();
    const target = {
      x: start.x + dir.x * driveDist,
      z: start.z + dir.z * driveDist,
    };
    const duration = Math.max(220, driveDist * 130);

    new Tween(car.mesh.position, this.tweens)
      .to({ x: target.x, z: target.z }, duration)
      .easing(exits ? Easing.Quadratic.In : Easing.Quadratic.Out)
      .onComplete(() => {
        car.driving = false;
        if (exits) {
          car.alive = false;
          const scaleObj = { s: 1 };
          new Tween(scaleObj, this.tweens)
            .to({ s: 0 }, 220)
            .easing(Easing.Quadratic.In)
            .onUpdate(() => car.mesh.scale.setScalar(scaleObj.s))
            .onComplete(() => {
              this.scene.remove(car.mesh);
              if (!this.won && this.cars.every(c => !c.alive)) {
                this.won = true;
                this.events.onWin();
              }
            })
            .start();
        } else {
          this.showBlockedFeedback(car, this.findBlocker(car));
        }
      })
      .start();
  }

  private findBlocker(car: Car): Car | null {
    let blockedDist = Infinity;
    let blocker: Car | null = null;
    for (const other of this.cars) {
      if (other === car || !other.alive) continue;
      const d = collisionDistance(car, other);
      if (d < blockedDist) { blockedDist = d; blocker = other; }
    }
    return blocker;
  }

  private showBlockedFeedback(car: Car, blocker: Car | null): void {
    car.showBlockedFeedback();
    wobbleClicked(car, this.tweens);
    flashBlockedRed(car, this.tweens);
    if (blocker) {
      addBlockerOutline(blocker, this.scene, 800);
      flashBlockedRed(blocker, this.tweens);
      addDashedConnector(car.center(), blocker.center(), this.scene, 800);
    }
  }
}

function collisionDistance(car: Car, other: Car): number {
  const dir = car.facingDir();
  const c1 = car.center();
  const e1 = car.halfExtents();
  const c2 = other.center();
  const e2 = other.halfExtents();
  const eps = 0.001;

  if (dir.x !== 0) {
    const zOverlap = Math.abs(c1.z - c2.z) < (e1.z + e2.z) - eps;
    if (!zOverlap) return Infinity;
    const gap = (c2.x - c1.x) * dir.x - (e1.x + e2.x);
    return Math.max(0, gap);
  } else {
    const xOverlap = Math.abs(c1.x - c2.x) < (e1.x + e2.x) - eps;
    if (!xOverlap) return Infinity;
    const gap = (c2.z - c1.z) * dir.z - (e1.z + e2.z);
    return Math.max(0, gap);
  }
}

function distanceToExit(car: Car, gw: number, gh: number): number {
  const dir = car.facingDir();
  const c = car.center();
  const e = car.halfExtents();
  if (dir.x === 1)  return (gw / 2 - c.x) + e.x + 1.5;
  if (dir.x === -1) return (c.x + gw / 2) + e.x + 1.5;
  if (dir.z === 1)  return (gh / 2 - c.z) + e.z + 1.5;
  return (c.z + gh / 2) + e.z + 1.5;
}

function validateLevel(data: LevelData): void {
  const occ = new Map<string, string>();
  for (const car of data.cars) {
    const cells = carCells(car);
    for (const [x, y] of cells) {
      if (x < 0 || x >= data.gridWidth || y < 0 || y >= data.gridHeight) {
        console.warn(`[level ${data.id}] car ${car.id} cell out of bounds (${x},${y})`);
      }
      const key = `${x},${y}`;
      const prev = occ.get(key);
      if (prev) console.warn(`[level ${data.id}] car ${car.id} overlaps ${prev} at (${x},${y})`);
      occ.set(key, car.id);
    }
  }
}

function carCells(car: { x: number; y: number; length: number; facing: Facing }): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  let dx = 0, dy = 0;
  switch (car.facing) {
    case 'right':  dx = 1;  break;
    case 'left':   dx = -1; break;
    case 'top':    dy = -1; break;
    case 'bottom': dy = 1;  break;
  }
  for (let i = 0; i < car.length; i++) {
    cells.push([car.x + dx * i, car.y + dy * i]);
  }
  return cells;
}

function buildGround(data: LevelData): THREE.Group {
  const g = new THREE.Group();
  const W = data.gridWidth;
  const H = data.gridHeight;
  const pad = 3;

  // Outer ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(W + pad * 2, H + pad * 2),
    new THREE.MeshStandardMaterial({ color: 0x40465a, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  g.add(ground);

  // Parking lot floor
  const lot = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshStandardMaterial({ color: 0x2a2f39, roughness: 0.9 }),
  );
  lot.rotation.x = -Math.PI / 2;
  lot.position.y = 0;
  lot.receiveShadow = true;
  g.add(lot);

  // Slot stripes
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xfff6d0, roughness: 0.6 });
  for (let i = 1; i < W; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.005, H - 0.2), stripeMat);
    stripe.position.set(i - W / 2, 0.005, 0);
    g.add(stripe);
  }
  for (let j = 1; j < H; j++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.005, 0.04), stripeMat);
    stripe.position.set(0, 0.005, j - H / 2);
    g.add(stripe);
  }

  // Border outline
  const borderMat = new THREE.MeshStandardMaterial({ color: 0xfff6d0, roughness: 0.6 });
  const borderTop = new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.005, 0.06), borderMat);
  borderTop.position.set(0, 0.006, -H / 2);
  g.add(borderTop);
  const borderBot = borderTop.clone();
  borderBot.position.z = H / 2;
  g.add(borderBot);
  const borderL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.005, H + 0.04), borderMat);
  borderL.position.set(-W / 2, 0.006, 0);
  g.add(borderL);
  const borderR = borderL.clone();
  borderR.position.x = W / 2;
  g.add(borderR);

  // Perimeter curbs (with gaps on each side, larger gap on exitSide)
  const curbMat = new THREE.MeshStandardMaterial({ color: 0xd9d0a8, roughness: 0.75 });
  const curbH = 0.28;
  const curbT = 0.22;
  const gapHalf = 1.0;
  const exitGapHalf = 1.6;

  const drawCurb = (along: 'x' | 'z', edgePos: number, segStart: number, segEnd: number) => {
    const len = segEnd - segStart;
    if (len <= 0.02) return;
    const geo = along === 'x'
      ? new THREE.BoxGeometry(len, curbH, curbT)
      : new THREE.BoxGeometry(curbT, curbH, len);
    const mesh = new THREE.Mesh(geo, curbMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (along === 'x') mesh.position.set((segStart + segEnd) / 2, curbH / 2, edgePos);
    else               mesh.position.set(edgePos, curbH / 2, (segStart + segEnd) / 2);
    g.add(mesh);
  };

  const halfGap = (side: Facing) => (data.exitSide === side ? exitGapHalf : gapHalf);

  drawCurb('x', -H / 2 - curbT / 2 - 0.05, -W / 2 - 0.2, -halfGap('top'));
  drawCurb('x', -H / 2 - curbT / 2 - 0.05,  halfGap('top'), W / 2 + 0.2);

  drawCurb('x',  H / 2 + curbT / 2 + 0.05, -W / 2 - 0.2, -halfGap('bottom'));
  drawCurb('x',  H / 2 + curbT / 2 + 0.05,  halfGap('bottom'), W / 2 + 0.2);

  drawCurb('z', -W / 2 - curbT / 2 - 0.05, -H / 2 - 0.2, -halfGap('left'));
  drawCurb('z', -W / 2 - curbT / 2 - 0.05,  halfGap('left'), H / 2 + 0.2);

  drawCurb('z',  W / 2 + curbT / 2 + 0.05, -H / 2 - 0.2, -halfGap('right'));
  drawCurb('z',  W / 2 + curbT / 2 + 0.05,  halfGap('right'), H / 2 + 0.2);

  // Exit arrow
  g.add(buildExitArrow(data.exitSide, W, H));
  return g;
}

function buildExitArrow(side: Facing, W: number, H: number): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(0.55, 0);
  shape.lineTo(0.05, 0.45);
  shape.lineTo(0.05, 0.15);
  shape.lineTo(-0.55, 0.15);
  shape.lineTo(-0.55, -0.15);
  shape.lineTo(0.05, -0.15);
  shape.lineTo(0.05, -0.45);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  // Flatten from XY to XZ: (x, y, z=0) → (x, 0, y)
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setXYZ(i, x, 0, y);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x6cf08a, emissive: 0x1a6634, emissiveIntensity: 0.55,
    roughness: 0.45, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.y = yawFor(side);
  switch (side) {
    case 'right':  mesh.position.set( W / 2 + 1.1, 0.03, 0); break;
    case 'left':   mesh.position.set(-W / 2 - 1.1, 0.03, 0); break;
    case 'top':    mesh.position.set(0, 0.03, -H / 2 - 1.1); break;
    case 'bottom': mesh.position.set(0, 0.03,  H / 2 + 1.1); break;
  }
  return mesh;
}

function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach(mm => mm.dispose());
    else if (mat) mat.dispose();
  });
}
