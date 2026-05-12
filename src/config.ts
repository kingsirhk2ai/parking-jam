import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { WinScene } from './scenes/WinScene';

// Logical (design) resolution. Phaser.Scale.FIT scales the canvas to fit the
// viewport while preserving aspect ratio. NO camera zoom — that breaks input
// mapping on HD/retina displays.
export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

// Grid layout
export const GRID_SIZE = 6;
export const CELL = 110;
export const GRID_PIXEL = GRID_SIZE * CELL; // 660
export const GRID_X = 40; // left padding
export const GRID_Y = (LOGICAL_H - GRID_PIXEL) / 2; // vertically centered (30)

// Exit row (0-indexed) — target car must be horizontal at this row.
export const EXIT_ROW = 2;

// HUD sidebar
export const HUD_X = GRID_X + GRID_PIXEL + 40; // 740
export const HUD_W = LOGICAL_W - HUD_X - 30; // ~510

// localStorage keys
export const STORAGE_PROGRESS = 'parkingjam.progress.v1';
export const STORAGE_BEST = 'parkingjam.best.v1';

// Palette
export const COLORS = {
  bgTop: 0x1a1d26,
  bgBottom: 0x0e1016,
  lot: 0x2a3142,
  lotEdge: 0x3a4256,
  lotStripe: 0x4a5066,
  gridLine: 0x383f52,
  hudPanel: 0x232735,
  hudBorder: 0x3a4256,
  text: 0xffffff,
  textDim: 0xa0a8b8,
  star: 0xffd54a,
  starDim: 0x4a4d56,
  carShadow: 0x000000,
  exitGlow: 0x39e07a,
  target: 0xef4444,
  button: 0x4a5066,
  buttonHover: 0x5a6076,
  buttonText: 0xffffff,
  win: 0x39e07a,
} as const;

// Car palette (non-target). Picked for clear contrast against red target.
export const CAR_COLORS = [
  0x4a90e2, // blue
  0xf5a623, // orange
  0x7ed321, // green
  0xbd10e0, // purple
  0x50e3c2, // teal
  0xf8e71c, // yellow
  0x9b9b9b, // grey
  0xff8c42, // bright orange
  0x6dd5ed, // sky
];

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: LOGICAL_W,
  height: LOGICAL_H,
  parent: document.body,
  backgroundColor: 0x1a1d26,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'high-performance',
  },
  input: {
    activePointers: 3,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, WinScene],
};
