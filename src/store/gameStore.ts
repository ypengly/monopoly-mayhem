import { create } from 'zustand';
import type { GameAction, GameSettings, GameState, LifetimeStats, PlayerConfig } from '../types';
import { createGame, dispatch } from '../engine/gameEngine';
import {
  DEFAULT_APP_SETTINGS,
  EMPTY_STATS,
  clearSave,
  loadAppSettings,
  loadGame,
  loadStats,
  resetStats,
  saveAppSettings,
  saveGame,
  saveStats,
  type AppSettings,
} from '../utils/storage';
import { recordGame } from '../utils/stats';
import { sound } from '../utils/sound';

export type Screen = 'menu' | 'setup' | 'game' | 'stats' | 'howto' | 'settings';

interface Store {
  screen: Screen;
  game: GameState | null;
  settings: AppSettings;
  stats: LifetimeStats;
  /** Dice are tumbling (engine has not been asked to roll yet). */
  rolling: boolean;
  /** Token is walking / an animation is playing; modals and AI wait. */
  busy: boolean;
  toast: { id: number; text: string } | null;
  selectedProperty: number | null;
  tradeOpen: boolean;
  managerOpen: boolean;
  setupMode: string;
  /** Stats only count once per game. */
  recordedGameId: string | null;

  navigate: (screen: Screen) => void;
  startGame: (settings: GameSettings, configs: PlayerConfig[]) => void;
  resumeGame: () => boolean;
  act: (action: GameAction) => string | null;
  roll: () => void;
  quitToMenu: () => void;
  showToast: (text: string) => void;
  selectProperty: (index: number | null) => void;
  setTradeOpen: (open: boolean) => void;
  setManagerOpen: (open: boolean) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  clearStats: () => void;
}

const ROLL_MS = 1100;
const STEP_MS = 170;

let toastId = 0;
let busyTimer: ReturnType<typeof setTimeout> | undefined;

function applySound(settings: AppSettings): void {
  sound.configure({ sfx: settings.sfx, music: settings.music, volume: settings.volume });
}

function setBusyFor(ms: number, set: (p: Partial<Store>) => void): void {
  if (busyTimer) clearTimeout(busyTimer);
  set({ busy: true });
  busyTimer = setTimeout(() => set({ busy: false }), ms);
}

/** Play the sound effects that match whatever just happened. */
function playFxSounds(prev: GameState, next: GameState): void {
  const seen = prev.fx.length ? prev.fx[prev.fx.length - 1].id : 0;
  const fresh = next.fx.filter((f) => f.id > seen);
  const kinds = new Set(fresh.map((f) => f.kind));
  if (kinds.has('win')) sound.play('win');
  else if (kinds.has('bankrupt')) sound.play('lose');
  else if (kinds.has('jail')) sound.play('jail');
  else if (kinds.has('rent')) sound.play('rent');
  else if (kinds.has('purchase')) sound.play('buy');
  else if (kinds.has('build')) sound.play('build');
  else if (kinds.has('card')) sound.play('event');
  else if (kinds.has('trade')) sound.play('buy');
  else if (fresh.some((f) => f.kind === 'money' && f.amount > 0)) sound.play('coin');
  else if (fresh.some((f) => f.kind === 'money' && f.amount < 0)) sound.play('rent');
}

export const useGameStore = create<Store>((set, get) => {
  const initialSettings = loadAppSettings();
  applySound(initialSettings);

  return {
    screen: 'menu',
    game: null,
    settings: initialSettings,
    stats: loadStats(),
    rolling: false,
    busy: false,
    toast: null,
    selectedProperty: null,
    tradeOpen: false,
    managerOpen: false,
    setupMode: 'classic',
    recordedGameId: null,

    navigate: (screen) => {
      sound.play('click');
      set({ screen });
    },

    startGame: (settings, configs) => {
      const game = createGame(settings, configs);
      saveGame(game);
      set({
        game,
        screen: 'game',
        rolling: false,
        busy: false,
        selectedProperty: null,
        tradeOpen: false,
        managerOpen: false,
        recordedGameId: null,
      });
      sound.play('whoosh');
      if (get().settings.music) sound.startMusic();
    },

    resumeGame: () => {
      const game = loadGame();
      if (!game) return false;
      set({ game, screen: 'game', rolling: false, busy: false, recordedGameId: null });
      if (get().settings.music) sound.startMusic();
      return true;
    },

    act: (action) => {
      const { game } = get();
      if (!game) return 'No game in progress.';
      const result = dispatch(game, action);
      if (result.error) {
        sound.play('click');
        get().showToast(result.error);
        return result.error;
      }
      const next = result.state;
      playFxSounds(game, next);

      // Let the token finish walking before anything else happens.
      if (next.lastMove && (!game.lastMove || next.lastMove.id !== game.lastMove.id)) {
        const steps = next.lastMove.kind === 'walk' ? next.lastMove.path.length : 2;
        setBusyFor(Math.min(2400, steps * STEP_MS + 350), set);
      }
      set({ game: next });
      saveGame(next);

      if (next.phase === 'game-over' && get().recordedGameId !== next.id) {
        const stats = recordGame(get().stats, next);
        saveStats(stats);
        set({ stats, recordedGameId: next.id });
        clearSave();
      }
      return null;
    },

    roll: () => {
      const { game, rolling, act } = get();
      if (!game || rolling || game.phase !== 'pre-roll') return;
      sound.play('dice');
      set({ rolling: true });
      setTimeout(() => {
        set({ rolling: false });
        act({ type: 'ROLL' });
      }, ROLL_MS);
    },

    quitToMenu: () => {
      sound.stopMusic();
      if (busyTimer) clearTimeout(busyTimer);
      set({ screen: 'menu', rolling: false, busy: false, tradeOpen: false, managerOpen: false, selectedProperty: null });
    },

    showToast: (text) => {
      const id = ++toastId;
      set({ toast: { id, text } });
      setTimeout(() => {
        if (get().toast?.id === id) set({ toast: null });
      }, 2800);
    },

    selectProperty: (index) => set({ selectedProperty: index }),
    setTradeOpen: (open) => set({ tradeOpen: open }),
    setManagerOpen: (open) => set({ managerOpen: open }),

    updateSettings: (patch) => {
      const settings = { ...get().settings, ...patch };
      saveAppSettings(settings);
      applySound(settings);
      if ('music' in patch) {
        if (settings.music && get().screen === 'game') sound.startMusic();
        if (!settings.music) sound.stopMusic();
      }
      set({ settings });
    },

    clearStats: () => set({ stats: resetStats() }),
  };
});

export { DEFAULT_APP_SETTINGS, EMPTY_STATS };
export const AI_DELAY: Record<AppSettings['aiSpeed'], number> = { slow: 1500, normal: 850, fast: 280 };
