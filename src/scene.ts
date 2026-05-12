import * as THREE from 'three';

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export function createScene(canvas: HTMLCanvasElement): SceneSetup {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1d26);
  scene.fog = new THREE.Fog(0x1a1d26, 28, 70);

  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 14, 14);
  camera.lookAt(0, 0, 0);

  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  // Cool sky / warm ground hemisphere for car body environmental wash
  const hemi = new THREE.HemisphereLight(0x9cc3ff, 0x3a3528, 0.6);
  scene.add(hemi);

  // Soft secondary fill from below-front to lift dark sides
  const fill = new THREE.HemisphereLight(0xffe6c2, 0x222633, 0.35);
  fill.position.set(0, -1, 0);
  scene.add(fill);

  const dir = new THREE.DirectionalLight(0xffffff, 1.25);
  dir.position.set(7, 14, 5);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -14;
  dir.shadow.camera.right = 14;
  dir.shadow.camera.top = 14;
  dir.shadow.camera.bottom = -14;
  dir.shadow.camera.near = 1;
  dir.shadow.camera.far = 50;
  dir.shadow.bias = -0.0005;
  dir.shadow.normalBias = 0.02;
  scene.add(dir);

  return { scene, camera, renderer };
}

export function fitCameraToLevel(camera: THREE.PerspectiveCamera, gridWidth: number, gridHeight: number): void {
  const maxDim = Math.max(gridWidth, gridHeight);
  const dist = maxDim * 1.45 + 5;
  camera.position.set(0, dist * 0.82, dist * 0.82);
  camera.lookAt(0, 0, 0);
}

export function handleResize(setup: SceneSetup): void {
  setup.renderer.setSize(window.innerWidth, window.innerHeight);
  setup.camera.aspect = window.innerWidth / window.innerHeight;
  setup.camera.updateProjectionMatrix();
}
