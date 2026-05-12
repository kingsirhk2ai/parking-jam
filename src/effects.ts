import * as THREE from 'three';
import { Tween, Easing, Group as TweenGroup } from '@tweenjs/tween.js';
import { Car } from './car';

const FLASH_COLOR = 0xff2200;
const OUTLINE_COLOR = 0xff3a3a;
const CONNECTOR_COLOR = 0xff4040;

export function wobbleClicked(car: Car, tweens: TweenGroup): void {
  const baseYaw = car.mesh.rotation.y;
  const obj = { a: 0 };
  new Tween(obj, tweens)
    .to({ a: 0.05 }, 70)
    .yoyo(true)
    .repeat(3)
    .easing(Easing.Sinusoidal.InOut)
    .onUpdate(() => { car.mesh.rotation.y = baseYaw + obj.a; })
    .onComplete(() => { car.mesh.rotation.y = baseYaw; })
    .start();
}

export function flashBlockedRed(car: Car, tweens: TweenGroup): void {
  if (car.flashing) return;
  car.flashing = true;
  for (const m of car.flashMaterials) m.emissive.setHex(FLASH_COLOR);
  const obj = { i: 0 };
  new Tween(obj, tweens)
    .to({ i: 1.6 }, 200)
    .easing(Easing.Quadratic.Out)
    .onUpdate(() => { for (const m of car.flashMaterials) m.emissiveIntensity = obj.i; })
    .onComplete(() => {
      new Tween(obj, tweens)
        .to({ i: 0 }, 220)
        .easing(Easing.Quadratic.In)
        .onUpdate(() => { for (const m of car.flashMaterials) m.emissiveIntensity = obj.i; })
        .onComplete(() => {
          for (const m of car.flashMaterials) {
            m.emissive.setHex(0x000000);
            m.emissiveIntensity = 1;
          }
          car.flashing = false;
        })
        .start();
    })
    .start();
}

interface TempEffect {
  remove(): void;
}

export function addBlockerOutline(car: Car, scene: THREE.Scene, durationMs: number): TempEffect {
  const group = new THREE.Group();
  car.mesh.updateWorldMatrix(true, true);
  car.mesh.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!(mesh as { isMesh?: boolean }).isMesh) return;
    if (!mesh.geometry) return;
    const mat = mesh.material as THREE.Material | undefined;
    if (mat && (mat as THREE.Material & { transparent?: boolean }).transparent) return;
    const edges = new THREE.EdgesGeometry(mesh.geometry, 25);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: OUTLINE_COLOR,
        transparent: true,
        opacity: 0.95,
        depthTest: false,
      }),
    );
    mesh.updateWorldMatrix(true, false);
    line.applyMatrix4(mesh.matrixWorld);
    line.renderOrder = 998;
    group.add(line);
  });
  scene.add(group);
  const handle: TempEffect = {
    remove() {
      scene.remove(group);
      group.traverse((o) => {
        const ls = o as THREE.LineSegments;
        if (ls.geometry) ls.geometry.dispose();
        const m = ls.material as THREE.Material | undefined;
        if (m) m.dispose();
      });
    },
  };
  setTimeout(() => handle.remove(), durationMs);
  return handle;
}

export function addDashedConnector(
  from: THREE.Vector3,
  to: THREE.Vector3,
  scene: THREE.Scene,
  durationMs: number,
): TempEffect {
  const a = from.clone(); a.y = 0.7;
  const b = to.clone();   b.y = 0.7;
  const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
  const mat = new THREE.LineDashedMaterial({
    color: CONNECTOR_COLOR,
    dashSize: 0.22,
    gapSize: 0.16,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  line.renderOrder = 997;
  scene.add(line);
  const handle: TempEffect = {
    remove() {
      scene.remove(line);
      geo.dispose();
      mat.dispose();
    },
  };
  setTimeout(() => handle.remove(), durationMs);
  return handle;
}
