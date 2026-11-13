import type { MiniGameId } from '../types';
import { nextRandom, randInt, type Rng } from '../utils/random';

export interface MiniGameInfo {
  id: MiniGameId;
  name: string;
  emoji: string;
  blurb: string;
}

export const MINI_GAMES: Record<MiniGameId, MiniGameInfo> = {
  diceDuel: { id: 'diceDuel', name: 'Dice Duel', emoji: '⚔️', blurb: 'Roll against an opponent. Higher total wins $50 from them!' },
  quickTap: { id: 'quickTap', name: 'Quick Tap', emoji: '👆', blurb: 'Tap the button as many times as you can in 5 seconds. $5 per tap, up to $200!' },
  luckyWheel: { id: 'luckyWheel', name: 'Lucky Wheel', emoji: '🎡', blurb: 'Spin the wheel for cash or even a Get Out of Jail Free card.' },
  memoryMatch: { id: 'memoryMatch', name: 'Memory Match', emoji: '🧠', blurb: 'Match all the pairs. Fewer mistakes means more money (up to $200).' },
  numberGuess: { id: 'numberGuess', name: 'Number Guess', emoji: '🔢', blurb: 'Guess the hidden number from 1 to 10 in 3 tries. Fewer tries, bigger prize!' },
};

export interface WheelSegment {
  label: string;
  delta: number;
  jailCard?: boolean;
  color: string;
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { label: '$25', delta: 25, color: '#ff5fa2' },
  { label: '$100', delta: 100, color: '#3ea8ff' },
  { label: '$0', delta: 0, color: '#9aa4b2' },
  { label: '$200', delta: 200, color: '#2ed573' },
  { label: '-$30', delta: -30, color: '#ff6b4a' },
  { label: '$75', delta: 75, color: '#ffb02e' },
  { label: 'JAIL CARD', delta: 0, jailCard: true, color: '#a06bff' },
  { label: '$300', delta: 300, color: '#17c3b2' },
  { label: '$50', delta: 50, color: '#ff8fc7' },
  { label: '$150', delta: 150, color: '#5aa9ff' },
];

export const TAP_SECONDS = 5;
export const TAP_VALUE = 5;
export const TAP_MAX = 200;
export const DUEL_STAKE = 50;
export const MEMORY_SYMBOLS = ['🐱', '🤖', '🐧', '🦖', '🦆', '🦊'];

export function memoryReward(mistakes: number): number {
  return Math.max(20, 200 - mistakes * 25);
}

export function guessReward(attempts: number): number {
  return attempts === 1 ? 250 : attempts === 2 ? 150 : 75;
}

export interface MiniGameOutcome {
  delta: number;
  message: string;
  jailCard?: boolean;
}

/** Used when an AI player takes a mini-game. */
export function simulateMiniGame(game: MiniGameId, r: Rng): MiniGameOutcome {
  switch (game) {
    case 'luckyWheel': {
      const seg = WHEEL_SEGMENTS[randInt(r, 0, WHEEL_SEGMENTS.length - 1)];
      return { delta: seg.delta, jailCard: seg.jailCard, message: `Lucky Wheel landed on ${seg.label}.` };
    }
    case 'quickTap': {
      const taps = randInt(r, 18, 42);
      return { delta: Math.min(TAP_MAX, taps * TAP_VALUE), message: `Quick Tap: ${taps} taps in ${TAP_SECONDS} seconds!` };
    }
    case 'diceDuel': {
      const win = nextRandom(r) < 0.5;
      return {
        delta: win ? DUEL_STAKE : -DUEL_STAKE,
        message: win ? 'Won the Dice Duel!' : 'Lost the Dice Duel.',
      };
    }
    case 'memoryMatch': {
      const mistakes = randInt(r, 0, 6);
      return { delta: memoryReward(mistakes), message: `Memory Match cleared with ${mistakes} mistakes.` };
    }
    case 'numberGuess': {
      const roll = nextRandom(r);
      if (roll < 0.1) return { delta: guessReward(1), message: 'Number Guess: nailed it on the first try!' };
      if (roll < 0.3) return { delta: guessReward(2), message: 'Number Guess: got it on the second try.' };
      if (roll < 0.55) return { delta: guessReward(3), message: 'Number Guess: got it on the last try.' };
      return { delta: 0, message: 'Number Guess: no luck this time.' };
    }
  }
}
