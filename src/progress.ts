const KEY = 'parking-jam-v2';

export interface Progress {
  currentLevel: number;
  stars: Record<number, number>;
}

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Progress;
      if (typeof p.currentLevel === 'number' && p.stars && typeof p.stars === 'object') return p;
    }
  } catch {}
  return { currentLevel: 1, stars: {} };
}

export function save(p: Progress): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function recordStars(p: Progress, levelId: number, stars: number): void {
  p.stars[levelId] = Math.max(p.stars[levelId] ?? 0, stars);
}

export function starsForMoves(moves: number, par: number): number {
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * 1.5)) return 2;
  return 1;
}
