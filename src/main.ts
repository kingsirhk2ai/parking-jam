import Phaser from 'phaser';
import { gameConfig } from './config';

const DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));

// Text resolution override: rasterize text textures at dpr× their game-units
// size so the text textures themselves stay crisp when Phaser.Scale.FIT
// CSS-scales the canvas up on retina/HiDPI displays.
Phaser.GameObjects.GameObjectFactory.register(
  'text',
  function (
    this: Phaser.GameObjects.GameObjectFactory,
    x: number,
    y: number,
    text: string | string[],
    style?: Phaser.Types.GameObjects.Text.TextStyle,
  ) {
    const enhanced: Phaser.Types.GameObjects.Text.TextStyle = {
      ...(style || {}),
      resolution: (style && (style as { resolution?: number }).resolution) || DPR,
    };
    const obj = new Phaser.GameObjects.Text(this.scene, x, y, text, enhanced);
    this.scene.sys.displayList.add(obj);
    this.scene.sys.updateList.add(obj);
    return obj;
  },
);

const game = new Phaser.Game(gameConfig);

(window as unknown as { __PHASER_GAME__?: Phaser.Game }).__PHASER_GAME__ = game;
(window as unknown as { __DPR__?: number }).__DPR__ = DPR;
