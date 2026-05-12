# Parking Jam

A 2D top-down parking puzzle. Slide cars to clear a path for the red car to escape through the right wall. Inspired by *Parking Jam 3D* (Popcore Games).

Built with **Phaser 3.90 + Vite 8 + TypeScript 6**. Android shell via **Capacitor 8**.

## Quick start

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # → dist/
pnpm preview      # serve the built bundle locally
pnpm typecheck
```

## Gameplay

- 6×6 grid. Horizontal cars only slide left/right; vertical cars only up/down.
- The red car must exit through the gap on the right wall at row 2 (0-indexed).
- Drag with mouse or touch along the car's axis — snaps to nearest valid cell on release.
- 8 hand-crafted levels with increasing difficulty.
- 3★ if you solve within the par move count, 2★ for ≤ 1.5× par, else 1★.

## Project layout

```
src/
├── main.ts              Phaser game init
├── config.ts            Grid/layout constants + color palette
├── types/index.ts       Level / CarSpec / Direction types
├── data/levels.ts       8 hand-crafted puzzles
├── systems/
│   ├── Board.ts         Grid state + collision + move logic
│   └── Progress.ts      localStorage save/load
├── ui/Hud.ts            Right-side sidebar (moves, best, restart, back)
└── scenes/
    ├── BootScene.ts
    ├── PreloadScene.ts
    ├── MenuScene.ts     Title + level picker
    ├── GameScene.ts     Main play loop
    └── WinScene.ts      Stars + Next Level
```

Logical resolution is **1280×720**, scaled with `Phaser.Scale.FIT` + `CENTER_BOTH`. No camera zoom (per the `phaser-hd-retina` rule — camera zoom breaks input mapping).

All visuals are Phaser graphics primitives — no PNG assets in v1.

## Deploy

Production web build is served by nginx (`Dockerfile` + `nginx.conf`). Auto-deploys to <https://parking.eggtart.io> from this repo's `master` branch via Coolify.

## Android (Capacitor shell)

```sh
pnpm build
npx cap sync android
npx cap open android
```

Bundle ID: `ai.kingsirhk2.parkingjam`
