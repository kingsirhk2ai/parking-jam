export type Facing = 'right' | 'left' | 'top' | 'bottom';

export interface CarSpec {
  id: string;
  x: number;
  y: number;
  length: number;
  facing: Facing;
  color: number;
}

export interface LevelData {
  id: number;
  gridWidth: number;
  gridHeight: number;
  exitSide: Facing;
  parMoves: number;
  cars: CarSpec[];
  tutorialText?: string;
}

export function dirVec(f: Facing): { x: number; z: number } {
  switch (f) {
    case 'right':  return { x:  1, z:  0 };
    case 'left':   return { x: -1, z:  0 };
    case 'top':    return { x:  0, z: -1 };
    case 'bottom': return { x:  0, z:  1 };
  }
}

export function yawFor(f: Facing): number {
  switch (f) {
    case 'right':  return 0;
    case 'top':    return Math.PI / 2;
    case 'left':   return Math.PI;
    case 'bottom': return -Math.PI / 2;
  }
}
