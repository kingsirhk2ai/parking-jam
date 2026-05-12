import Phaser from 'phaser';
import { COLORS, HUD_X, HUD_W, LOGICAL_H } from '../config';

export interface HudCallbacks {
  onRestart: () => void;
  onBack: () => void;
}

interface ButtonRefs {
  bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  hit: Phaser.GameObjects.Zone;
  hovered: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Hud {
  scene: Phaser.Scene;
  levelLabel!: Phaser.GameObjects.Text;
  levelName!: Phaser.GameObjects.Text;
  movesLabel!: Phaser.GameObjects.Text;
  movesValue!: Phaser.GameObjects.Text;
  bestLabel!: Phaser.GameObjects.Text;
  bestValue!: Phaser.GameObjects.Text;
  parLabel!: Phaser.GameObjects.Text;
  parValue!: Phaser.GameObjects.Text;
  hintLabel!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, levelId: number, levelName: string, par: number, best: number | undefined, cb: HudCallbacks) {
    this.scene = scene;
    this.draw(levelId, levelName, par, best, cb);
  }

  private draw(levelId: number, levelName: string, par: number, best: number | undefined, cb: HudCallbacks): void {
    // Panel background
    const panel = this.scene.add.graphics();
    panel.fillStyle(COLORS.hudPanel, 1);
    panel.fillRoundedRect(HUD_X, 30, HUD_W, LOGICAL_H - 60, 18);
    panel.lineStyle(2, COLORS.hudBorder, 1);
    panel.strokeRoundedRect(HUD_X, 30, HUD_W, LOGICAL_H - 60, 18);

    const cx = HUD_X + HUD_W / 2;
    const padX = HUD_X + 24;

    // Title
    this.scene.add.text(cx, 60, 'Parking Jam', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // Level number + name
    this.levelLabel = this.scene.add.text(padX, 110, `Level ${levelId}`, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '20px',
      color: '#a0a8b8',
    });
    this.levelName = this.scene.add.text(padX, 138, levelName, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Stat rows
    this.movesLabel = this.scene.add.text(padX, 210, 'Moves', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '18px',
      color: '#a0a8b8',
    });
    this.movesValue = this.scene.add.text(HUD_X + HUD_W - 24, 205, '0', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.parLabel = this.scene.add.text(padX, 260, 'Par', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '18px',
      color: '#a0a8b8',
    });
    this.parValue = this.scene.add.text(HUD_X + HUD_W - 24, 258, `${par}`, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '22px',
      color: '#ffd54a',
    }).setOrigin(1, 0);

    this.bestLabel = this.scene.add.text(padX, 305, 'Best', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '18px',
      color: '#a0a8b8',
    });
    this.bestValue = this.scene.add.text(HUD_X + HUD_W - 24, 303, best === undefined ? '—' : `${best}`, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(1, 0);

    // Hint
    this.hintLabel = this.scene.add.text(cx, 370, 'Drag the red car\nto the right exit', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '15px',
      color: '#7a8290',
      align: 'center',
    }).setOrigin(0.5, 0);

    // Buttons
    const btnW = HUD_W - 48;
    this.makeButton(cx, LOGICAL_H - 140, btnW, 56, 'Restart', cb.onRestart);
    this.makeButton(cx, LOGICAL_H - 78, btnW, 56, 'Back to Menu', cb.onBack);
  }

  private makeButton(cx: number, cy: number, w: number, h: number, label: string, onClick: () => void): ButtonRefs {
    const bg = this.scene.add.graphics();
    const drawBg = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? COLORS.buttonHover : COLORS.button, 1);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 12);
    };
    drawBg(false);

    const text = this.scene.add.text(cx, cy, label, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    const hit = this.scene.add.zone(cx, cy, w, h).setRectangleDropZone(w, h);
    hit.setInteractive({ useHandCursor: true });
    const refs: ButtonRefs = { bg, label: text, hit, hovered: false, x: cx, y: cy, w, h };

    hit.on('pointerover', () => { refs.hovered = true; drawBg(true); });
    hit.on('pointerout', () => { refs.hovered = false; drawBg(false); });
    hit.on('pointerdown', () => { drawBg(false); onClick(); });

    return refs;
  }

  setMoves(n: number): void {
    this.movesValue.setText(`${n}`);
  }
}
