import Phaser from 'phaser';
import {
  CAR_COLORS,
  CELL,
  COLORS,
  EXIT_ROW,
  GRID_PIXEL,
  GRID_SIZE,
  GRID_X,
  GRID_Y,
  LOGICAL_W,
} from '../config';
import { levels } from '../data/levels';
import { Board } from '../systems/Board';
import { loadProgress } from '../systems/Progress';
import type { CarSpec, Level } from '../types';
import { Hud } from '../ui/Hud';

interface CarView {
  spec: CarSpec;
  container: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Graphics;
  width: number;
  height: number;
  color: number;
}

interface GameSceneData {
  levelId: number;
}

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private level!: Level;
  private views: Map<string, CarView> = new Map();
  private hud!: Hud;
  private moves: number = 0;
  private isLocked: boolean = false;
  private dragStartCell: { col: number; row: number } | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    const id = data?.levelId ?? 1;
    const found = levels.find((l) => l.id === id);
    this.level = found ?? levels[0];
    this.board = new Board(this.level.cars);
    this.views = new Map();
    this.moves = 0;
    this.isLocked = false;
    this.dragStartCell = null;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bgTop);

    this.drawLot();
    this.drawGridLines();
    this.drawExit();
    this.spawnCars();
    this.setupHud();
  }

  // ------------------------------------------------------------------
  // Drawing
  // ------------------------------------------------------------------

  private drawLot(): void {
    const g = this.add.graphics();
    g.fillStyle(COLORS.lot, 1);
    g.fillRoundedRect(GRID_X - 14, GRID_Y - 14, GRID_PIXEL + 28, GRID_PIXEL + 28, 22);
    g.lineStyle(4, COLORS.lotEdge, 1);
    g.strokeRoundedRect(GRID_X - 14, GRID_Y - 14, GRID_PIXEL + 28, GRID_PIXEL + 28, 22);

    // Inner asphalt
    const inner = this.add.graphics();
    inner.fillStyle(0x222838, 1);
    inner.fillRoundedRect(GRID_X, GRID_Y, GRID_PIXEL, GRID_PIXEL, 10);
  }

  private drawGridLines(): void {
    const g = this.add.graphics();
    g.lineStyle(2, COLORS.gridLine, 0.65);
    for (let i = 1; i < GRID_SIZE; i += 1) {
      g.lineBetween(GRID_X + i * CELL, GRID_Y + 6, GRID_X + i * CELL, GRID_Y + GRID_PIXEL - 6);
      g.lineBetween(GRID_X + 6, GRID_Y + i * CELL, GRID_X + GRID_PIXEL - 6, GRID_Y + i * CELL);
    }

    // Parking-stripe markers (subtle) along left and bottom — purely decorative
    const stripe = this.add.graphics();
    stripe.lineStyle(2, COLORS.lotStripe, 0.5);
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const x = GRID_X + c * CELL + 8;
      stripe.lineBetween(x, GRID_Y + 4, x + CELL - 16, GRID_Y + 4);
    }
  }

  private drawExit(): void {
    const exitX = GRID_X + GRID_PIXEL;
    const exitY = GRID_Y + EXIT_ROW * CELL;
    // Gap in right wall: subtle glow + arrow.
    const g = this.add.graphics();
    g.fillStyle(COLORS.exitGlow, 0.18);
    g.fillRect(exitX - 4, exitY + 6, 60, CELL - 12);
    g.lineStyle(3, COLORS.exitGlow, 0.9);
    g.strokeRoundedRect(exitX - 2, exitY + 6, 60, CELL - 12, 8);

    // Arrow
    const a = this.add.graphics();
    a.fillStyle(COLORS.exitGlow, 0.95);
    const cx = exitX + 22;
    const cy = exitY + CELL / 2;
    a.beginPath();
    a.moveTo(cx, cy - 14);
    a.lineTo(cx + 16, cy);
    a.lineTo(cx, cy + 14);
    a.lineTo(cx + 4, cy + 5);
    a.lineTo(cx - 8, cy + 5);
    a.lineTo(cx - 8, cy - 5);
    a.lineTo(cx + 4, cy - 5);
    a.closePath();
    a.fillPath();

    // Pulse the arrow gently
    this.tweens.add({
      targets: a,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.inOut',
    });
  }

  // ------------------------------------------------------------------
  // Cars
  // ------------------------------------------------------------------

  private spawnCars(): void {
    let palIdx = 0;
    this.level.cars.forEach((spec) => {
      const color = spec.isTarget
        ? COLORS.target
        : spec.color ?? CAR_COLORS[palIdx++ % CAR_COLORS.length];
      this.buildCarView(spec, color);
    });
  }

  private buildCarView(spec: CarSpec, color: number): void {
    const w = spec.orient === 'h' ? spec.length * CELL : CELL;
    const h = spec.orient === 'v' ? spec.length * CELL : CELL;
    const x = GRID_X + spec.col * CELL + w / 2;
    const y = GRID_Y + spec.row * CELL + h / 2;

    const container = this.add.container(x, y);
    const body = this.add.graphics();
    this.paintCarBody(body, w, h, color, spec.isTarget === true);
    container.add(body);
    container.setSize(w, h);

    // Make container interactive + draggable. Hit area is in local space
    // (centered on container origin), so we offset by half-w/half-h.
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
    this.input.setDraggable(container);

    container.on('pointerover', () => {
      if (!this.isLocked) this.scale.canvas.style.cursor = 'grab';
    });
    container.on('pointerout', () => {
      this.scale.canvas.style.cursor = '';
    });

    container.on('dragstart', () => {
      if (this.isLocked) return;
      this.scale.canvas.style.cursor = 'grabbing';
      const car = this.board.cars.get(spec.id);
      if (car) this.dragStartCell = { col: car.col, row: car.row };
      container.setDepth(10);
    });

    container.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.isLocked) return;
      const car = this.board.cars.get(spec.id);
      if (!car) return;

      if (spec.orient === 'h') {
        const min = -this.board.maxSlide(spec.id, -1);
        const max = this.board.maxSlide(spec.id, +1);
        const minPx = GRID_X + (car.col + min) * CELL + w / 2;
        const maxPx = GRID_X + (car.col + max) * CELL + w / 2;
        container.x = Phaser.Math.Clamp(dragX, minPx, maxPx);
        container.y = GRID_Y + car.row * CELL + h / 2;
      } else {
        const min = -this.board.maxSlide(spec.id, -1);
        const max = this.board.maxSlide(spec.id, +1);
        const minPx = GRID_Y + (car.row + min) * CELL + h / 2;
        const maxPx = GRID_Y + (car.row + max) * CELL + h / 2;
        container.y = Phaser.Math.Clamp(dragY, minPx, maxPx);
        container.x = GRID_X + car.col * CELL + w / 2;
      }
    });

    container.on('dragend', () => {
      if (this.isLocked) return;
      this.scale.canvas.style.cursor = '';
      const car = this.board.cars.get(spec.id);
      if (!car) return;

      let newCol = car.col;
      let newRow = car.row;
      if (spec.orient === 'h') {
        newCol = Math.round((container.x - w / 2 - GRID_X) / CELL);
      } else {
        newRow = Math.round((container.y - h / 2 - GRID_Y) / CELL);
      }
      // Clamp to [0, GRID_SIZE - length]
      const maxCol = GRID_SIZE - spec.length;
      newCol = Phaser.Math.Clamp(newCol, 0, spec.orient === 'h' ? maxCol : car.col);
      newRow = Phaser.Math.Clamp(newRow, 0, spec.orient === 'v' ? maxCol : car.row);

      const delta = spec.orient === 'h' ? newCol - car.col : newRow - car.row;
      // Re-validate via maxSlide (board could have unexpected state)
      if (delta !== 0) {
        const allowed = delta > 0 ? this.board.maxSlide(spec.id, +1) : -this.board.maxSlide(spec.id, -1);
        const clamped = delta > 0 ? Math.min(delta, allowed) : Math.max(delta, allowed);
        if (clamped !== 0) {
          this.board.slide(spec.id, clamped);
          if (this.dragStartCell) {
            const moved = spec.orient === 'h'
              ? car.col !== this.dragStartCell.col
              : car.row !== this.dragStartCell.row;
            if (moved) {
              this.moves += 1;
              this.hud.setMoves(this.moves);
            }
          }
        }
      }

      // Snap visual to grid
      this.tweens.add({
        targets: container,
        x: GRID_X + car.col * CELL + w / 2,
        y: GRID_Y + car.row * CELL + h / 2,
        duration: 90,
        ease: 'Quad.out',
        onComplete: () => container.setDepth(0),
      });

      this.dragStartCell = null;

      if (this.board.targetAtExit()) {
        this.triggerWin();
      }
    });

    const view: CarView = { spec, container, body, width: w, height: h, color };
    this.views.set(spec.id, view);
  }

  private paintCarBody(g: Phaser.GameObjects.Graphics, w: number, h: number, color: number, isTarget: boolean): void {
    const pad = 6;
    const radius = 14;

    // Shadow
    g.fillStyle(COLORS.carShadow, 0.35);
    g.fillRoundedRect(-w / 2 + pad, -h / 2 + pad + 4, w - pad * 2, h - pad * 2, radius);

    // Body
    g.fillStyle(color, 1);
    g.fillRoundedRect(-w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2, radius);

    // Darker bottom stripe / shading
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(28).color;
    g.fillStyle(dark, 1);
    g.fillRoundedRect(-w / 2 + pad, h / 2 - pad - 8, w - pad * 2, 8, { tl: 0, tr: 0, bl: radius, br: radius });

    // Highlight stripe (cabin glass)
    const light = Phaser.Display.Color.IntegerToColor(color).brighten(40).color;
    g.fillStyle(light, 0.85);
    if (w >= h) {
      // horizontal car — cabin is a centered rounded rect
      const cw = w * 0.42;
      const ch = h * 0.5;
      g.fillRoundedRect(-cw / 2, -ch / 2 - 4, cw, ch, 8);
    } else {
      const cw = w * 0.5;
      const ch = h * 0.42;
      g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 8);
    }

    // Wheels
    g.fillStyle(0x0a0a0a, 1);
    if (w >= h) {
      // h car: 2 wheels each side (or 3 wheels for length 3)
      const wheelY = h / 2 - pad - 4;
      const wheels = Math.max(2, Math.round(w / CELL) + 1);
      for (let i = 0; i < wheels; i += 1) {
        const wx = -w / 2 + pad + 12 + (i / (wheels - 1)) * (w - pad * 2 - 24);
        g.fillCircle(wx, wheelY, 6);
        g.fillCircle(wx, -h / 2 + pad + 4, 6);
      }
    } else {
      const wheelX = w / 2 - pad - 4;
      const wheels = Math.max(2, Math.round(h / CELL) + 1);
      for (let i = 0; i < wheels; i += 1) {
        const wy = -h / 2 + pad + 12 + (i / (wheels - 1)) * (h - pad * 2 - 24);
        g.fillCircle(wheelX, wy, 6);
        g.fillCircle(-w / 2 + pad + 4, wy, 6);
      }
    }

    if (isTarget) {
      // Pulsing white ring outline
      g.lineStyle(3, 0xffffff, 0.95);
      g.strokeRoundedRect(-w / 2 + pad, -h / 2 + pad, w - pad * 2, h - pad * 2, radius);
    }
  }

  // ------------------------------------------------------------------
  // HUD
  // ------------------------------------------------------------------

  private setupHud(): void {
    const progress = loadProgress();
    const best = progress.bestMoves[this.level.id];
    this.hud = new Hud(this, this.level.id, this.level.name, this.level.minMoves, best, {
      onRestart: () => this.scene.restart({ levelId: this.level.id }),
      onBack: () => this.scene.start('MenuScene'),
    });
  }

  // ------------------------------------------------------------------
  // Win
  // ------------------------------------------------------------------

  private triggerWin(): void {
    this.isLocked = true;
    const target = this.board.targetCar();
    if (!target) return;
    const view = this.views.get(target.id);
    if (!view) return;

    // Slide target off the right edge
    const offX = LOGICAL_W + 100;
    this.tweens.add({
      targets: view.container,
      x: offX,
      duration: 650,
      ease: 'Quad.in',
    });

    // Confetti burst at the exit
    const exitX = GRID_X + GRID_PIXEL + 30;
    const exitY = GRID_Y + EXIT_ROW * CELL + CELL / 2;
    this.spawnConfetti(exitX, exitY);

    this.time.delayedCall(800, () => {
      this.scene.start('WinScene', {
        levelId: this.level.id,
        moves: this.moves,
        par: this.level.minMoves,
      });
    });
  }

  private spawnConfetti(x: number, y: number): void {
    const colors = [0xffd54a, 0x4a90e2, 0x7ed321, 0xef4444, 0xf5a623, 0xbd10e0, 0x50e3c2];
    for (let i = 0; i < 36; i += 1) {
      const c = colors[i % colors.length];
      const piece = this.add.rectangle(x, y, 8, 14, c);
      piece.setDepth(20);
      const dirAngle = Phaser.Math.FloatBetween(-Math.PI * 0.75, -Math.PI * 0.25);
      const speed = Phaser.Math.FloatBetween(180, 420);
      const dx = Math.cos(dirAngle) * speed * 0.001;
      const dy = Math.sin(dirAngle) * speed * 0.001;
      const targetX = x + dx * 700;
      const targetY = y + dy * 700 + 280; // gravity
      this.tweens.add({
        targets: piece,
        x: targetX,
        y: targetY,
        angle: Phaser.Math.Between(-540, 540),
        alpha: { from: 1, to: 0 },
        duration: Phaser.Math.Between(700, 1300),
        ease: 'Quad.out',
        onComplete: () => piece.destroy(),
      });
    }
  }
}
