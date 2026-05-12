import { LevelData } from '../types';

const RED    = 0xff3b3b;
const BLUE   = 0x3b82f6;
const YELLOW = 0xfacc15;
const GREEN  = 0x4ade80;
const PURPLE = 0xc084fc;
const ORANGE = 0xfb923c;
const CYAN   = 0x22d3ee;
const PINK   = 0xf472b6;
const WHITE  = 0xf1f5f9;

export const LEVELS: LevelData[] = [
  // ── 1 — tutorial, 2 cars ───────────────────────────────
  {
    id: 1, gridWidth: 4, gridHeight: 4, exitSide: 'right', parMoves: 2,
    cars: [
      { id: 'r', x: 0, y: 1, length: 2, facing: 'right',  color: RED  },
      { id: 'b', x: 3, y: 0, length: 2, facing: 'bottom', color: BLUE },
    ],
    tutorialText: 'Tap any car — it drives forward along its facing automatically. Cars only move when the path ahead is clear — a red flash means another car is blocking it. Plan the order to free the red target.',
  },

  // ── 2 — 4 cars ─────────────────────────────────────────
  {
    id: 2, gridWidth: 5, gridHeight: 5, exitSide: 'right', parMoves: 4,
    cars: [
      { id: 'r', x: 0, y: 2, length: 2, facing: 'right',  color: RED    },
      { id: 'b', x: 3, y: 0, length: 2, facing: 'bottom', color: BLUE   },
      { id: 'y', x: 1, y: 4, length: 3, facing: 'right',  color: YELLOW },
      { id: 'g', x: 4, y: 3, length: 2, facing: 'top',    color: GREEN  },
    ],
  },

  // ── 3 — 5 cars ─────────────────────────────────────────
  {
    id: 3, gridWidth: 5, gridHeight: 5, exitSide: 'bottom', parMoves: 5,
    cars: [
      { id: 'r', x: 0, y: 0, length: 3, facing: 'bottom', color: RED    },
      { id: 'b', x: 2, y: 0, length: 2, facing: 'right',  color: BLUE   },
      { id: 'y', x: 4, y: 1, length: 2, facing: 'bottom', color: YELLOW },
      { id: 'g', x: 1, y: 4, length: 3, facing: 'right',  color: GREEN  },
      { id: 'p', x: 1, y: 1, length: 2, facing: 'bottom', color: PURPLE },
    ],
  },

  // ── 4 — 6 cars ─────────────────────────────────────────
  {
    id: 4, gridWidth: 6, gridHeight: 6, exitSide: 'right', parMoves: 6,
    cars: [
      { id: 'r', x: 0, y: 1, length: 2, facing: 'right',  color: RED    },
      { id: 'b', x: 0, y: 3, length: 3, facing: 'right',  color: BLUE   },
      { id: 'y', x: 3, y: 0, length: 2, facing: 'bottom', color: YELLOW },
      { id: 'g', x: 5, y: 0, length: 3, facing: 'bottom', color: GREEN  },
      { id: 'p', x: 2, y: 5, length: 3, facing: 'right',  color: PURPLE },
      { id: 'o', x: 0, y: 5, length: 2, facing: 'top',    color: ORANGE },
    ],
  },

  // ── 5 — 7 cars ─────────────────────────────────────────
  {
    id: 5, gridWidth: 6, gridHeight: 6, exitSide: 'top', parMoves: 7,
    cars: [
      { id: 'r', x: 1, y: 1, length: 2, facing: 'top',    color: RED    },
      { id: 'b', x: 3, y: 2, length: 3, facing: 'top',    color: BLUE   },
      { id: 'y', x: 0, y: 2, length: 3, facing: 'right',  color: YELLOW },
      { id: 'g', x: 5, y: 0, length: 2, facing: 'bottom', color: GREEN  },
      { id: 'p', x: 0, y: 4, length: 2, facing: 'right',  color: PURPLE },
      { id: 'o', x: 4, y: 4, length: 2, facing: 'right',  color: ORANGE },
      { id: 'c', x: 2, y: 5, length: 2, facing: 'left',   color: CYAN   },
    ],
  },

  // ── 6 — 8 cars ─────────────────────────────────────────
  {
    id: 6, gridWidth: 6, gridHeight: 6, exitSide: 'left', parMoves: 8,
    cars: [
      { id: 'r', x: 5, y: 0, length: 2, facing: 'left',   color: RED    },
      { id: 'b', x: 5, y: 2, length: 3, facing: 'left',   color: BLUE   },
      { id: 'y', x: 0, y: 0, length: 2, facing: 'bottom', color: YELLOW },
      { id: 'g', x: 2, y: 1, length: 2, facing: 'bottom', color: GREEN  },
      { id: 'p', x: 4, y: 4, length: 3, facing: 'left',   color: PURPLE },
      { id: 'o', x: 5, y: 5, length: 2, facing: 'top',    color: ORANGE },
      { id: 'c', x: 0, y: 4, length: 2, facing: 'right',  color: CYAN   },
      { id: 'k', x: 3, y: 5, length: 2, facing: 'left',   color: PINK   },
    ],
  },

  // ── 7 — 9 cars ─────────────────────────────────────────
  {
    id: 7, gridWidth: 7, gridHeight: 7, exitSide: 'right', parMoves: 10,
    cars: [
      { id: 'r', x: 0, y: 0, length: 2, facing: 'right',  color: RED    },
      { id: 'b', x: 0, y: 2, length: 3, facing: 'right',  color: BLUE   },
      { id: 'y', x: 0, y: 4, length: 2, facing: 'right',  color: YELLOW },
      { id: 'g', x: 0, y: 6, length: 3, facing: 'right',  color: GREEN  },
      { id: 'p', x: 3, y: 0, length: 2, facing: 'bottom', color: PURPLE },
      { id: 'o', x: 5, y: 0, length: 3, facing: 'bottom', color: ORANGE },
      { id: 'c', x: 4, y: 5, length: 3, facing: 'top',    color: CYAN   },
      { id: 'k', x: 6, y: 4, length: 3, facing: 'top',    color: PINK   },
      { id: 'w', x: 3, y: 5, length: 2, facing: 'left',   color: WHITE  },
    ],
  },

  // ── 8 — 10 cars, packed ────────────────────────────────
  {
    id: 8, gridWidth: 7, gridHeight: 7, exitSide: 'right', parMoves: 12,
    cars: [
      { id: 'r',  x: 0, y: 0, length: 2, facing: 'right',  color: RED    },
      { id: 'b',  x: 3, y: 0, length: 3, facing: 'right',  color: BLUE   },
      { id: 'y',  x: 0, y: 2, length: 3, facing: 'right',  color: YELLOW },
      { id: 'g',  x: 4, y: 2, length: 2, facing: 'right',  color: GREEN  },
      { id: 'p',  x: 0, y: 4, length: 2, facing: 'bottom', color: PURPLE },
      { id: 'o',  x: 2, y: 4, length: 3, facing: 'right',  color: ORANGE },
      { id: 'c',  x: 6, y: 3, length: 3, facing: 'bottom', color: CYAN   },
      { id: 'k',  x: 1, y: 6, length: 3, facing: 'right',  color: PINK   },
      { id: 'w',  x: 5, y: 4, length: 2, facing: 'top',    color: WHITE  },
      { id: 'r2', x: 4, y: 6, length: 3, facing: 'right',  color: RED    },
    ],
  },
];
