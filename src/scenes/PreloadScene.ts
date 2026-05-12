import Phaser from 'phaser';
import { LOGICAL_W, LOGICAL_H } from '../config';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // v1 uses Phaser graphics primitives only — no PNG/audio assets.
    // We still draw a brief progress bar to give the boot a moment of polish.
    const barW = Math.min(360, LOGICAL_W * 0.6);
    const barH = 16;
    const barX = (LOGICAL_W - barW) / 2;
    const barY = LOGICAL_H / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x232735, 1);
    bg.fillRoundedRect(barX, barY, barW, barH, 8);

    const fill = this.add.graphics();
    this.load.on('progress', (value: number) => {
      fill.clear();
      fill.fillStyle(0x4a90e2, 1);
      fill.fillRoundedRect(barX, barY, barW * value, barH, 8);
    });

    // Force at least one trivial load so the bar animates briefly.
    this.load.image('__pixel__', this.makePixelDataUri());
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private makePixelDataUri(): string {
    // 1x1 transparent PNG.
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}
