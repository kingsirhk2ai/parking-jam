import Phaser from 'phaser';
import { COLORS, LOGICAL_H, LOGICAL_W } from '../config';
import { levels } from '../data/levels';
import { markSolved } from '../systems/Progress';

interface WinSceneData {
  levelId: number;
  moves: number;
  par: number;
}

export class WinScene extends Phaser.Scene {
  private payload!: WinSceneData;

  constructor() {
    super({ key: 'WinScene' });
  }

  init(data: WinSceneData): void {
    this.payload = data;
    markSolved(data.levelId, data.moves);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgTop);

    // Translucent overlay covering the whole logical view (dim background)
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.55);
    overlay.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Card
    const cardW = 520;
    const cardH = 460;
    const cardX = (LOGICAL_W - cardW) / 2;
    const cardY = (LOGICAL_H - cardH) / 2;
    const card = this.add.graphics();
    card.fillStyle(COLORS.hudPanel, 1);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 22);
    card.lineStyle(3, COLORS.win, 0.8);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 22);

    const cx = LOGICAL_W / 2;

    this.add.text(cx, cardY + 56, 'CLEARED!', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '48px',
      color: '#39e07a',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cardY + 104, `Level ${this.payload.levelId}`, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '20px',
      color: '#a0a8b8',
    }).setOrigin(0.5);

    // Stars
    const stars = this.starCount();
    for (let i = 0; i < 3; i += 1) {
      const sx = cx + (i - 1) * 70;
      const sy = cardY + 180;
      this.drawStar(sx, sy, 28, i < stars ? COLORS.star : COLORS.starDim);
    }

    this.add.text(cx, cardY + 245, `Moves: ${this.payload.moves}    Par: ${this.payload.par}`, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hasNext = levels.some((l) => l.id === this.payload.levelId + 1);
    const yButtons = cardY + cardH - 70;

    if (hasNext) {
      this.makeButton(cx - 110, yButtons, 200, 56, 'Next Level', 0x4a90e2, () => {
        this.scene.start('GameScene', { levelId: this.payload.levelId + 1 });
      });
      this.makeButton(cx + 110, yButtons, 200, 56, 'Menu', COLORS.button, () => {
        this.scene.start('MenuScene');
      });
    } else {
      this.add.text(cx, cardY + 300, 'You cleared all 8 levels!', {
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontSize: '18px',
        color: '#ffd54a',
      }).setOrigin(0.5);
      this.makeButton(cx, yButtons, 240, 56, 'Back to Menu', 0x4a90e2, () => {
        this.scene.start('MenuScene');
      });
    }
  }

  private starCount(): number {
    const { moves, par } = this.payload;
    if (moves <= par) return 3;
    if (moves <= Math.ceil(par * 1.5)) return 2;
    return 1;
  }

  private makeButton(cx: number, cy: number, w: number, h: number, label: string, color: number, onClick: () => void): void {
    const bg = this.add.graphics();
    const draw = (hover: boolean) => {
      bg.clear();
      const c = hover ? Phaser.Display.Color.IntegerToColor(color).brighten(15).color : color;
      bg.fillStyle(c, 1);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 12);
    };
    draw(false);
    this.add.text(cx, cy, label, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    const hit = this.add.zone(cx, cy, w, h).setRectangleDropZone(w, h);
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', () => { draw(false); onClick(); });
  }

  private drawStar(cx: number, cy: number, r: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius));
    }
    g.fillPoints(pts, true);
  }
}
