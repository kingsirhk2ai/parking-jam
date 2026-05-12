import { GRID_SIZE } from '../config';
import type { CarSpec, Orient } from '../types';

// Internal car state — same shape as CarSpec but with mutable col/row.
export interface CarState {
  id: string;
  col: number;
  row: number;
  length: 2 | 3;
  orient: Orient;
  color?: number;
  isTarget?: boolean;
}

export class Board {
  cars: Map<string, CarState>;

  constructor(specs: CarSpec[]) {
    this.cars = new Map();
    for (const s of specs) {
      this.cars.set(s.id, { ...s });
    }
  }

  /** True if (col,row) is occupied by any car other than `excludeId`. */
  private isOccupied(col: number, row: number, excludeId?: string): boolean {
    for (const c of this.cars.values()) {
      if (c.id === excludeId) continue;
      if (this.carCovers(c, col, row)) return true;
    }
    return false;
  }

  private carCovers(c: CarState, col: number, row: number): boolean {
    if (c.orient === 'h') {
      return c.row === row && col >= c.col && col < c.col + c.length;
    } else {
      return c.col === col && row >= c.row && row < c.row + c.length;
    }
  }

  /**
   * Maximum legal `delta` for car `id` along its axis (positive = right/down,
   * negative = left/up). The car can slide through intermediate cells only if
   * every cell between current and final position is empty.
   */
  maxSlide(id: string, direction: 1 | -1): number {
    const car = this.cars.get(id);
    if (!car) return 0;

    let steps = 0;
    if (car.orient === 'h') {
      if (direction === 1) {
        // Slide right — check each cell to the right of car's right edge.
        let next = car.col + car.length;
        while (next < GRID_SIZE && !this.isOccupied(next, car.row, id)) {
          steps += 1;
          next += 1;
        }
      } else {
        let next = car.col - 1;
        while (next >= 0 && !this.isOccupied(next, car.row, id)) {
          steps += 1;
          next -= 1;
        }
      }
    } else {
      if (direction === 1) {
        let next = car.row + car.length;
        while (next < GRID_SIZE && !this.isOccupied(car.col, next, id)) {
          steps += 1;
          next += 1;
        }
      } else {
        let next = car.row - 1;
        while (next >= 0 && !this.isOccupied(car.col, next, id)) {
          steps += 1;
          next -= 1;
        }
      }
    }
    return steps;
  }

  /** Apply a slide; assumes caller already validated via maxSlide. */
  slide(id: string, delta: number): void {
    if (delta === 0) return;
    const car = this.cars.get(id);
    if (!car) return;
    if (car.orient === 'h') car.col += delta;
    else car.row += delta;
  }

  /**
   * True if the target car has reached the right wall and can exit
   * (its right edge is at col GRID_SIZE-1 and no car is to its right).
   * Caller may treat this as "level cleared" once target slides off.
   */
  targetAtExit(): boolean {
    for (const c of this.cars.values()) {
      if (c.isTarget && c.orient === 'h') {
        return c.col + c.length >= GRID_SIZE;
      }
    }
    return false;
  }

  targetCar(): CarState | undefined {
    for (const c of this.cars.values()) {
      if (c.isTarget) return c;
    }
    return undefined;
  }
}
