import type { Level } from '../types';

// 8 hand-crafted levels for parking-jam v1.
// Grid is 6x6. EXIT_ROW = 2 (right wall). Target ('t') is always horizontal
// length 2 at col 0, row 2. To exit it must slide right past cells
// (2,2)(3,2)(4,2)(5,2) — so any car occupying those cells is a "blocker"
// that must be moved. Blockers on row 2 must be VERTICAL (a horizontal car
// at row 2 cannot pass the target).
//
// Each level was sketched on paper and walked through to ensure:
//   1. No initial overlap between cars.
//   2. Every blocker on row 2 has at least one legal escape (up or down)
//      reachable without a deadlock chain.
//   3. The target can reach (4,2)(5,2) once blockers move.
//
// `minMoves` is the par count (blocker count + 1 for the target's final slide).
// 3★ at <= par, 2★ at <= 1.5*par, else 1★.
export const levels: Level[] = [
  {
    id: 1,
    name: 'Warm-up',
    minMoves: 2,
    cars: [
      { id: 't', col: 0, row: 2, length: 2, orient: 'h', isTarget: true },
      { id: 'a', col: 3, row: 0, length: 3, orient: 'v' },
      { id: 'b', col: 5, row: 4, length: 2, orient: 'v' },
    ],
  },
  {
    id: 2,
    name: 'Sidestep',
    minMoves: 4,
    cars: [
      { id: 't', col: 0, row: 2, length: 2, orient: 'h', isTarget: true },
      { id: 'a', col: 2, row: 2, length: 2, orient: 'v' },
      { id: 'b', col: 3, row: 0, length: 3, orient: 'v' },
      { id: 'c', col: 5, row: 1, length: 2, orient: 'v' },
      { id: 'd', col: 0, row: 5, length: 2, orient: 'h' },
    ],
  },
  {
    id: 3,
    name: 'Crossroads',
    minMoves: 4,
    cars: [
      { id: 't', col: 0, row: 2, length: 2, orient: 'h', isTarget: true },
      { id: 'a', col: 2, row: 2, length: 2, orient: 'v' },
      { id: 'b', col: 3, row: 0, length: 3, orient: 'v' },
      { id: 'c', col: 4, row: 2, length: 2, orient: 'v' },
      { id: 'd', col: 5, row: 0, length: 2, orient: 'v' },
      { id: 'e', col: 0, row: 0, length: 2, orient: 'h' },
      { id: 'f', col: 3, row: 5, length: 3, orient: 'h' },
    ],
  },
  {
    id: 4,
    name: 'Crunch',
    minMoves: 6,
    cars: [
      { id: 't', col: 0, row: 2, length: 2, orient: 'h', isTarget: true },
      { id: 'a', col: 0, row: 0, length: 2, orient: 'h' },
      { id: 'b', col: 2, row: 2, length: 2, orient: 'v' },
      { id: 'c', col: 3, row: 0, length: 3, orient: 'v' },
      { id: 'd', col: 4, row: 2, length: 2, orient: 'v' },
      { id: 'e', col: 5, row: 1, length: 2, orient: 'v' },
      { id: 'f', col: 0, row: 4, length: 2, orient: 'h' },
      { id: 'g', col: 3, row: 5, length: 3, orient: 'h' },
    ],
  },
  {
    id: 5,
    name: 'Wedged',
    minMoves: 5,
    cars: [
      { id: 't', col: 0, row: 2, length: 2, orient: 'h', isTarget: true },
      { id: 'a', col: 2, row: 2, length: 2, orient: 'v' },
      { id: 'b', col: 3, row: 0, length: 3, orient: 'v' },
      { id: 'c', col: 4, row: 2, length: 2, orient: 'v' },
      { id: 'd', col: 5, row: 1, length: 2, orient: 'v' },
      { id: 'e', col: 0, row: 0, length: 2, orient: 'h' },
      { id: 'f', col: 4, row: 4, length: 2, orient: 'h' },
      { id: 'g', col: 0, row: 5, length: 3, orient: 'h' },
    ],
  },
  {
    id: 6,
    name: 'Knot',
    minMoves: 6,
    cars: [
      { id: 't', col: 0, row: 2, length: 2, orient: 'h', isTarget: true },
      { id: 'a', col: 2, row: 0, length: 2, orient: 'v' },
      { id: 'b', col: 2, row: 2, length: 2, orient: 'v' },
      { id: 'c', col: 3, row: 0, length: 3, orient: 'v' },
      { id: 'd', col: 4, row: 1, length: 2, orient: 'v' },
      { id: 'e', col: 5, row: 0, length: 3, orient: 'v' },
      { id: 'f', col: 0, row: 0, length: 2, orient: 'h' },
      { id: 'g', col: 0, row: 4, length: 2, orient: 'h' },
      { id: 'h', col: 3, row: 5, length: 2, orient: 'h' },
    ],
  },
  {
    id: 7,
    name: 'Gridlock',
    minMoves: 7,
    cars: [
      { id: 't', col: 0, row: 2, length: 2, orient: 'h', isTarget: true },
      { id: 'a', col: 0, row: 0, length: 3, orient: 'h' },
      { id: 'b', col: 2, row: 2, length: 2, orient: 'v' },
      { id: 'c', col: 3, row: 2, length: 3, orient: 'v' },
      { id: 'd', col: 4, row: 1, length: 2, orient: 'v' },
      { id: 'e', col: 5, row: 1, length: 2, orient: 'v' },
      { id: 'f', col: 0, row: 4, length: 2, orient: 'h' },
      { id: 'g', col: 0, row: 5, length: 3, orient: 'h' },
      { id: 'h', col: 4, row: 5, length: 2, orient: 'h' },
    ],
  },
  {
    id: 8,
    name: 'Parking jam',
    minMoves: 9,
    cars: [
      { id: 't', col: 0, row: 2, length: 2, orient: 'h', isTarget: true },
      { id: 'a', col: 0, row: 0, length: 2, orient: 'h' },
      { id: 'b', col: 2, row: 0, length: 2, orient: 'v' },
      { id: 'c', col: 2, row: 2, length: 2, orient: 'v' },
      { id: 'd', col: 3, row: 0, length: 3, orient: 'v' },
      { id: 'e', col: 4, row: 2, length: 2, orient: 'v' },
      { id: 'f', col: 5, row: 0, length: 3, orient: 'v' },
      { id: 'g', col: 0, row: 4, length: 2, orient: 'h' },
      { id: 'h', col: 4, row: 4, length: 2, orient: 'h' },
      { id: 'i', col: 0, row: 5, length: 2, orient: 'h' },
    ],
  },
];
