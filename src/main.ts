import { createScene, fitCameraToLevel, handleResize } from './scene';
import { Level } from './level';
import { LEVELS } from './data/levels';
import {
  buildUI, setStarsBar,
  showWinModal, hideModal, showLevelSelect,
} from './ui';
import { load, save, recordStars, starsForMoves } from './progress';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const setup = createScene(canvas);
const ui = buildUI();
const progress = load();

let currentLevel: Level | null = null;
let currentIndex = 0;

function loadLevelByIndex(idx: number): void {
  if (currentLevel) currentLevel.dispose();
  hideModal(ui.modal);
  currentIndex = ((idx % LEVELS.length) + LEVELS.length) % LEVELS.length;
  const data = LEVELS[currentIndex];
  fitCameraToLevel(setup.camera, data.gridWidth, data.gridHeight);
  ui.levelLabel.textContent = `Level ${data.id}`;
  ui.movesLabel.textContent = `Moves: 0  •  Par ${data.parMoves}`;
  setStarsBar(ui.starsBar, progress.stars[data.id] ?? 0);
  if (data.tutorialText) {
    ui.tutorialLabel.textContent = data.tutorialText;
    ui.tutorialLabel.style.display = 'block';
  } else {
    ui.tutorialLabel.style.display = 'none';
  }
  currentLevel = new Level(data, setup.scene, {
    onMove: (moves) => {
      ui.movesLabel.textContent = `Moves: ${moves}  •  Par ${data.parMoves}`;
      if (moves >= 1) ui.tutorialLabel.style.display = 'none';
    },
    onWin: () => {
      if (!currentLevel) return;
      const stars = starsForMoves(currentLevel.moves, data.parMoves);
      recordStars(progress, data.id, stars);
      progress.currentLevel = Math.min(data.id + 1, LEVELS[LEVELS.length - 1].id);
      save(progress);
      setStarsBar(ui.starsBar, progress.stars[data.id] ?? 0);
      const isLast = currentIndex === LEVELS.length - 1;
      const cleared = currentLevel.moves;
      showWinModal(
        ui.modal, data.id, cleared, data.parMoves, stars, isLast,
        () => { hideModal(ui.modal); loadLevelByIndex(currentIndex + 1); },
        () => { hideModal(ui.modal); loadLevelByIndex(currentIndex); },
      );
    },
  });
}

ui.resetButton.addEventListener('click', () => loadLevelByIndex(currentIndex));
ui.selectButton.addEventListener('click', () => {
  showLevelSelect(
    ui.modal, LEVELS.length, progress.stars, LEVELS[currentIndex].id,
    (id) => {
      const idx = LEVELS.findIndex(l => l.id === id);
      if (idx >= 0) { hideModal(ui.modal); loadLevelByIndex(idx); }
    },
    () => hideModal(ui.modal),
  );
});

canvas.addEventListener('pointerdown', (e) => {
  if (!currentLevel) return;
  currentLevel.handlePointer(e.clientX, e.clientY, setup.camera);
});

canvas.addEventListener('pointermove', (e) => {
  if (!currentLevel) return;
  if (e.pointerType === 'touch') return;
  currentLevel.handleHover(e.clientX, e.clientY, setup.camera);
});

canvas.addEventListener('pointerleave', () => {
  if (currentLevel) currentLevel.clearHover();
});

window.addEventListener('resize', () => handleResize(setup));
window.addEventListener('orientationchange', () => handleResize(setup));

const startIdx = Math.max(0, LEVELS.findIndex(l => l.id === progress.currentLevel));
loadLevelByIndex(startIdx >= 0 ? startIdx : 0);

function animate(): void {
  requestAnimationFrame(animate);
  if (currentLevel) currentLevel.update();
  setup.renderer.render(setup.scene, setup.camera);
}
requestAnimationFrame(animate);
