import * as THREE from 'three';
import { CarSpec, Facing, dirVec, yawFor } from './types';

export class Car {
  spec: CarSpec;
  mesh: THREE.Group;
  facing: Facing;
  length: number;
  alive = true;
  driving = false;

  private warning: THREE.Sprite | null = null;
  private warningUntil = 0;

  constructor(spec: CarSpec, gridWidth: number, gridHeight: number) {
    this.spec = spec;
    this.facing = spec.facing;
    this.length = spec.length;
    this.mesh = buildCarMesh(spec.color, spec.length);
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

  showWarning(): void {
    if (!this.warning) {
      this.warning = makeWarningSprite();
      this.warning.position.set(0, 1.6, 0);
      this.mesh.add(this.warning);
    }
    this.warning.visible = true;
    this.warningUntil = performance.now() + 1500;
  }

  updateWarning(): void {
    if (this.warning && this.warning.visible && performance.now() > this.warningUntil) {
      this.warning.visible = false;
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

function buildCarMesh(color: number, length: number): THREE.Group {
  const g = new THREE.Group();
  const L = length;
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.25 });
  const roofMat = new THREE.MeshStandardMaterial({ color: shade(color, 0.65), roughness: 0.35, metalness: 0.3 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.9 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfff7c2, emissive: 0xfff7c2, emissiveIntensity: 0.9, roughness: 0.3,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xff3a3a, emissive: 0xaa0000, emissiveIntensity: 0.7, roughness: 0.3,
  });

  // Lower body
  const body = new THREE.Mesh(new THREE.BoxGeometry(L - 0.1, 0.35, 0.72), bodyMat);
  body.position.y = 0.35;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Roof (slightly offset toward rear for a stylized look)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(L * 0.55, 0.32, 0.62), roofMat);
  roof.position.set(-0.05, 0.7, 0);
  roof.castShadow = true;
  g.add(roof);

  // Wheels (axis along Z)
  const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 18);
  const wheelXs = [-L / 2 + 0.3, L / 2 - 0.3];
  const wheelZs = [-0.38, 0.38];
  for (const wx of wheelXs) {
    for (const wz of wheelZs) {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(wx, 0.18, wz);
      w.castShadow = true;
      g.add(w);
    }
  }

  // Headlights (front, +X)
  for (const lz of [-0.22, 0.22]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.13, 0.16), lightMat);
    h.position.set(L / 2 - 0.03, 0.38, lz);
    g.add(h);
  }
  // Tail lights (rear, -X)
  for (const lz of [-0.22, 0.22]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.16), tailMat);
    h.position.set(-L / 2 + 0.03, 0.38, lz);
    g.add(h);
  }

  return g;
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
