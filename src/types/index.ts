export type Orient = 'h' | 'v';
export type Direction = 'left' | 'right' | 'up' | 'down';

export interface CarSpec {
  id: string;
  col: number; // top-left grid column (0..GRID_SIZE-1)
  row: number; // top-left grid row (0..GRID_SIZE-1)
  length: 2 | 3;
  orient: Orient;
  color?: number; // optional palette override; auto-assigned if missing
  isTarget?: boolean;
}

export interface Level {
  id: number;
  name: string;
  cars: CarSpec[];
  minMoves: number;
}

export interface ProgressState {
  solved: number[];
  bestMoves: Record<number, number>;
}
