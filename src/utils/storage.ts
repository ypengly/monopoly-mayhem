import type { GameState, LifetimeStats } from '../types';

const SAVE_KEY = 'monopoly-mayhem:save:v1';
const STATS_KEY = 'monopoly-mayhem:stats:v1';
const SETTINGS_KEY = 'monopoly-mayhem:settings:v1';

export interface AppSettings {
  sfx: boolean;
  music: boolean;
  volume: number;
  aiSpeed: 'slow' | 'normal' | 'fast';
  reducedMotion: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  sfx: true,
  music: true,
  volume: 0.7,
  aiSpeed: 'normal',
  reducedMotion: false,
};

export const EMPTY_STATS: LifetimeStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  propertiesOwned: 0,
  totalMoneyEarned: 0,
  biggestRent: 0,
  mostExpensiveProperty: null,
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be full or blocked; the game still works */
  }
}

export function saveGame(state: GameState): void {
  if (state.phase === 'game-over') {
    clearSave();
    return;
  }
  write(SAVE_KEY, state);
}

export function loadGame(): GameState | null {
  const s = read<GameState>(SAVE_KEY);
  if (!s || !Array.isArray(s.players) || !s.properties || typeof s.rng !== 'number') return null;
  if (s.phase === 'game-over') return null;
  return s;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}

export function loadStats(): LifetimeStats {
  return { ...EMPTY_STATS, ...(read<LifetimeStats>(STATS_KEY) ?? {}) };
}

export function saveStats(stats: LifetimeStats): void {
  write(STATS_KEY, stats);
}

export function resetStats(): LifetimeStats {
  write(STATS_KEY, EMPTY_STATS);
  return { ...EMPTY_STATS };
}

export function loadAppSettings(): AppSettings {
  return { ...DEFAULT_APP_SETTINGS, ...(read<AppSettings>(SETTINGS_KEY) ?? {}) };
}

export function saveAppSettings(settings: AppSettings): void {
  write(SETTINGS_KEY, settings);
}
