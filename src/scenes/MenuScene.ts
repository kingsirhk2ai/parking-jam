import Phaser from 'phaser';
import { COLORS, LOGICAL_W, LOGICAL_H } from '../config';
import { levels } from '../data/levels';
import { firstUnsolved, loadProgress } from '../systems/Progress';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgTop);

    // Title
    this.add.text(LOGICAL_W / 2, 110, 'PARKING JAM', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '72px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#0e1016',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(LOGICAL_W / 2, 175, 'Slide cars. Free the red one.', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '22px',
      color: '#a0a8b8',
    }).setOrigin(0.5);

    // "Play" big button → first unsolved
    this.makeButton(LOGICAL_W / 2, 245, 240, 64, 'PLAY', () => {
      const id = firstUnsolved(levels.length);
      this.scene.start('GameScene', { levelId: id });
    }, 0x4a90e2);

    // Level grid
    const progress = loadProgress();
    const cols = 4;
    const rows = Math.ceil(levels.length / cols);
    const cellW = 130;
    const cellH = 110;
    const gridW = cols * cellW + (cols - 1) * 16;
    const gridH = rows * cellH + (rows - 1) * 16;
    const gx0 = (LOGICAL_W - gridW) / 2;
    const gy0 = 340;

    this.add.text(LOGICAL_W / 2, gy0 - 32, 'Select level', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '20px',
      color: '#a0a8b8',
    }).setOrigin(0.5);

    levels.forEach((lvl, idx) => {
      const cIdx = idx % cols;
      const rIdx = Math.floor(idx / cols);
      const x = gx0 + cIdx * (cellW + 16) + cellW / 2;
      const y = gy0 + rIdx * (cellH + 16) + cellH / 2;
      const solved = progress.solved.includes(lvl.id);
      const best = progress.bestMoves[lvl.id];
      this.makeLevelTile(x, y, cellW, cellH, lvl.id, lvl.name, solved, best, lvl.minMoves);
    });

    // Footer
    this.add.text(LOGICAL_W / 2, LOGICAL_H - 28, 'v0.1 · drag with mouse or finger', {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '14px',
      color: '#5a6076',
    }).setOrigin(0.5);
  }

  private makeButton(cx: number, cy: number, w: number, h: number, label: string, onClick: () => void, color: number): void {
    const bg = this.add.graphics();
    const draw = (hover: boolean) => {
      bg.clear();
      const c = hover ? Phaser.Display.Color.IntegerToColor(color).brighten(15).color : color;
      bg.fillStyle(c, 1);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 14);
    };
    draw(false);
    const txt = this.add.text(cx, cy, label, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const hit = this.add.zone(cx, cy, w, h).setRectangleDropZone(w, h);
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', () => { draw(false); onClick(); });
    void txt;
  }

  private makeLevelTile(cx: number, cy: number, w: number, h: number, levelId: number, name: string, solved: boolean, best: number | undefined, par: number): void {
    const fill = solved ? 0x2f3a52 : 0x232735;
    const border = solved ? COLORS.win : COLORS.hudBorder;
    const bg = this.add.graphics();
    const draw = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? Phaser.Display.Color.IntegerToColor(fill).brighten(10).color : fill, 1);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 12);
      bg.lineStyle(2, border, 1);
      bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 12);
    };
    draw(false);

    this.add.text(cx, cy - 28, `${levelId}`, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, cy + 5, name, {
      fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      fontSize: '14px',
      color: '#a0a8b8',
    }).setOrigin(0.5);

    // Stars
    const stars = best === undefined ? 0 : this.starsFor(best, par);
    for (let i = 0; i < 3; i += 1) {
      const sx = cx + (i - 1) * 16;
      const sy = cy + 32;
      this.drawStar(sx, sy, 6, i < stars ? COLORS.star : COLORS.starDim);
    }

    const hit = this.add.zone(cx, cy, w, h).setRectangleDropZone(w, h);
    hit.setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => draw(true));
    hit.on('pointerout', () => draw(false));
    hit.on('pointerdown', () => {
      draw(false);
      this.scene.start('GameScene', { levelId });
    });
  }

  private starsFor(moves: number, par: number): number {
    if (moves <= par) return 3;
    if (moves <= Math.ceil(par * 1.5)) return 2;
    return 1;
  }

  private drawStar(cx: number, cy: number, r: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    const points: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      points.push(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    }
    g.fillPoints(points.reduce<Phaser.Math.Vector2[]>((acc, _, i, arr) => {
      if (i % 2 === 0) acc.push(new Phaser.Math.Vector2(arr[i], arr[i + 1]));
      return acc;
    }, []), true);
  }
}
