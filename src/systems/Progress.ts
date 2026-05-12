import { STORAGE_PROGRESS } from '../config';
import type { ProgressState } from '../types';

const EMPTY: ProgressState = { solved: [], bestMoves: {} };

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      solved: Array.isArray(parsed.solved) ? parsed.solved.filter((n) => typeof n === 'number') : [],
      bestMoves: parsed.bestMoves && typeof parsed.bestMoves === 'object' ? parsed.bestMoves : {},
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_PROGRESS, JSON.stringify(state));
  } catch {
    // Quota or private-mode — silently drop. Game still playable in-session.
  }
}

export function markSolved(levelId: number, moves: number): ProgressState {
  const s = loadProgress();
  if (!s.solved.includes(levelId)) s.solved.push(levelId);
  const prev = s.bestMoves[levelId];
  if (prev === undefined || moves < prev) s.bestMoves[levelId] = moves;
  saveProgress(s);
  return s;
}

export function firstUnsolved(totalLevels: number): number {
  const s = loadProgress();
  for (let i = 1; i <= totalLevels; i += 1) {
    if (!s.solved.includes(i)) return i;
  }
  return totalLevels;
}
