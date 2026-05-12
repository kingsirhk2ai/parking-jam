import * as THREE from 'three';
import { CarSpec, Facing, dirVec, yawFor } from './types';

export class Car {
  spec: CarSpec;
  mesh: THREE.Group;
  facing: Facing;
  length: number;
  alive = true;
  driving = false;
  flashing = false;

  flashMaterials: THREE.MeshStandardMaterial[];

  private warning: THREE.Sprite | null = null;
  private warningUntil = 0;
  private blockedLabel: THREE.Sprite | null = null;
  private blockedLabelUntil = 0;
  private hovered = false;

  constructor(spec: CarSpec, gridWidth: number, gridHeight: number) {
    this.spec = spec;
    this.facing = spec.facing;
    this.length = spec.length;
    const built = buildCarMesh(spec.color, spec.length);
    this.mesh = built.group;
    this.flashMaterials = built.flashMaterials;
    this.mesh.position.copy(carWorldCenter(spec, gridWidth, gridHeight));
    this.mesh.rotation.y = yawFor(spec.facing);
    this.mesh.userData['car'] = this;
  }

  center(): THREE.Vector3 {
    return this.mesh.position;
  }

  facingDir(): { x: number; z: number } {
    return dirVec(this.facing);
  }

  /** Cell-aligned AABB half-extents (used for grid collision). */
  halfExtents(): { x: number; z: number } {
    const horiz = this.facing === 'right' || this.facing === 'left';
    return horiz
      ? { x: this.length / 2, z: 0.5 }
      : { x: 0.5, z: this.length / 2 };
  }

  showBlockedFeedback(): void {
    if (!this.warning) {
      this.warning = makeWarningSprite();
      this.warning.position.set(0, 1.95, 0);
      this.mesh.add(this.warning);
    }
    this.warning.visible = true;
    this.warningUntil = performance.now() + 1100;

    if (!this.blockedLabel) {
      this.blockedLabel = makeBlockedLabel();
      this.blockedLabel.position.set(0, 1.25, 0);
      this.mesh.add(this.blockedLabel);
    }
    this.blockedLabel.visible = true;
    this.blockedLabelUntil = performance.now() + 1100;
  }

  setHover(on: boolean): void {
    if (!this.alive || this.driving) return;
    if (this.flashing) return;
    if (on === this.hovered) return;
    this.hovered = on;
    for (const m of this.flashMaterials) {
      if (on) {
        m.emissive.setHex(0x33aaff);
        m.emissiveIntensity = 0.45;
      } else {
        m.emissive.setHex(0x000000);
        m.emissiveIntensity = 1;
      }
    }
  }

  updateWarning(): void {
    const now = performance.now();
    if (this.warning && this.warning.visible && now > this.warningUntil) {
      this.warning.visible = false;
    }
    if (this.blockedLabel && this.blockedLabel.visible && now > this.blockedLabelUntil) {
      this.blockedLabel.visible = false;
    }
  }
}

export function carWorldCenter(spec: CarSpec, gw: number, gh: number): THREE.Vector3 {
  const d = dirVec(spec.facing);
  const cxGrid = spec.x + d.x * (spec.length - 1) / 2;
  const cyGrid = spec.y + d.z * (spec.length - 1) / 2;
  return new THREE.Vector3(
    cxGrid + 0.5 - gw / 2,
    0,
    cyGrid + 0.5 - gh / 2,
  );
}

interface BuildResult {
  group: THREE.Group;
  flashMaterials: THREE.MeshStandardMaterial[];
}

function buildCarMesh(color: number, length: number): BuildResult {
  const g = new THREE.Group();
  const L = length;

  const bodyMat = new THREE.MeshStandardMaterial({
    color, metalness: 0.4, roughness: 0.5,
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: shade(color, 0.78), metalness: 0.45, roughness: 0.45,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: shade(color, 0.55), metalness: 0.65, roughness: 0.35,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
    metalness: 0.3,
    side: THREE.DoubleSide,
  });
  const tireMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0c, roughness: 0.95, metalness: 0.05,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x40434a, roughness: 0.4, metalness: 0.85,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff4c2,
    emissive: 0xffffaa,
    emissiveIntensity: 1.5,
    roughness: 0.25,
  });
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff5050,
    emissive: 0xff2222,
    emissiveIntensity: 1.5,
    roughness: 0.25,
  });

  // ── Chassis (lower body, wider) ────────────────────────────
  const chassisH = 0.32;
  const chassisW = 0.78;
  const chassisLen = L - 0.08;
  const chassis = new THREE.Mesh(
    new THREE.BoxGeometry(chassisLen, chassisH, chassisW),
    bodyMat,
  );
  chassis.position.y = chassisH / 2 + 0.16;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  g.add(chassis);

  // Lower skirt
  const skirt = new THREE.Mesh(
    new THREE.BoxGeometry(chassisLen + 0.04, 0.14, chassisW + 0.04),
    trimMat,
  );
  skirt.position.y = 0.16 + 0.07;
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  g.add(skirt);

  // ── Cabin / roof (narrower, slightly toward rear) ─────────
  const cabinLen = L * 0.6;
  const cabinW = 0.62;
  const cabinH = 0.34;
  const cabinOffsetX = -0.05;
  const cabinBottomY = chassis.position.y + chassisH / 2;
  const cabinCenterY = cabinBottomY + cabinH / 2;

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(cabinLen, cabinH, cabinW),
    cabinMat,
  );
  cabin.position.set(cabinOffsetX, cabinCenterY, 0);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  g.add(cabin);

  // ── Windshields / windows ─────────────────────────────────
  const glassFront = new THREE.Mesh(
    new THREE.PlaneGeometry(cabinW * 0.88, cabinH * 0.78),
    glassMat,
  );
  glassFront.position.set(cabinOffsetX + cabinLen / 2 + 0.002, cabinCenterY, 0);
  glassFront.rotation.y = -Math.PI / 2;
  g.add(glassFront);

  const glassRear = new THREE.Mesh(
    new THREE.PlaneGeometry(cabinW * 0.88, cabinH * 0.78),
    glassMat,
  );
  glassRear.position.set(cabinOffsetX - cabinLen / 2 - 0.002, cabinCenterY, 0);
  glassRear.rotation.y = Math.PI / 2;
  g.add(glassRear);

  const glassSideL = new THREE.Mesh(
    new THREE.PlaneGeometry(cabinLen * 0.85, cabinH * 0.7),
    glassMat,
  );
  glassSideL.position.set(cabinOffsetX, cabinCenterY, cabinW / 2 + 0.002);
  g.add(glassSideL);

  const glassSideR = new THREE.Mesh(
    new THREE.PlaneGeometry(cabinLen * 0.85, cabinH * 0.7),
    glassMat,
  );
  glassSideR.position.set(cabinOffsetX, cabinCenterY, -cabinW / 2 - 0.002);
  glassSideR.rotation.y = Math.PI;
  g.add(glassSideR);

  // ── Roof centre trim line ─────────────────────────────────
  const roofLine = new THREE.Mesh(
    new THREE.BoxGeometry(cabinLen * 0.92, 0.04, 0.06),
    trimMat,
  );
  roofLine.position.set(cabinOffsetX, cabinCenterY + cabinH / 2 + 0.022, 0);
  g.add(roofLine);

  // Side body trim (waist line)
  for (const tz of [chassisW / 2 + 0.005, -chassisW / 2 - 0.005]) {
    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(chassisLen - 0.08, 0.05, 0.03),
      trimMat,
    );
    sideTrim.position.set(0, cabinBottomY - 0.02, tz);
    g.add(sideTrim);
  }

  // ── Wheels: tire + rim ────────────────────────────────────
  const tireGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 22);
  const rimGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.185, 16);
  const wheelXs = [-L / 2 + 0.34, L / 2 - 0.34];
  const wheelZs = [-0.44, 0.44];
  for (const wx of wheelXs) {
    for (const wz of wheelZs) {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(wx, 0.22, wz);
      tire.castShadow = true;
      g.add(tire);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(wx, 0.22, wz);
      g.add(rim);
    }
  }

  // ── Headlights (front, +X) ────────────────────────────────
  for (const lz of [-0.26, 0.26]) {
    const h = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.14, 0.18),
      headlightMat,
    );
    h.position.set(L / 2 - 0.01, chassis.position.y + 0.02, lz);
    g.add(h);
  }
  // Tail lights (rear, -X)
  for (const lz of [-0.26, 0.26]) {
    const t = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.12, 0.2),
      taillightMat,
    );
    t.position.set(-L / 2 + 0.01, chassis.position.y + 0.02, lz);
    g.add(t);
  }

  return { group: g, flashMaterials: [bodyMat, cabinMat, trimMat] };
}

function shade(hex: number, factor: number): number {
  const r = Math.min(255, Math.floor(((hex >> 16) & 0xff) * factor));
  const gr = Math.min(255, Math.floor(((hex >> 8) & 0xff) * factor));
  const b = Math.min(255, Math.floor((hex & 0xff) * factor));
  return (r << 16) | (gr << 8) | b;
}

function makeWarningSprite(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ff3030';
  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 92px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('!', 64, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.85, 0.85, 0.85);
  sprite.renderOrder = 999;
  return sprite;
}

function makeBlockedLabel(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 72;
  const ctx = canvas.getContext('2d')!;
  roundRectPath(ctx, 4, 8, 248, 56, 14);
  ctx.fillStyle = 'rgba(220, 32, 32, 0.92)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BLOCKED', 128, 38);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.4, 0.4, 1);
  sprite.renderOrder = 999;
  return sprite;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
