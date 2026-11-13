import type { AIPersonality, GameLength, GameMode } from '../types';

export const RULES = {
  salary: 200,
  jailFine: 50,
  jailPosition: 10,
  goToJailPosition: 30,
  freeParkingPosition: 20,
  maxJailTurns: 3,
  maxDoubles: 3,
  mortgageRate: 0.5,
  unmortgageInterest: 0.1,
  sellBackRate: 0.5,
  houseSellRate: 0.5,
  maxHouses: 5, // 5 == hotel
  auctionIncrement: 10,
  logLimit: 150,
  fxLimit: 40,
  hardRoundCap: 400,
  chaosEventChance: 0.22,
  maxPlayers: 8,
  minPlayers: 2,
} as const;

export interface LengthConfig {
  label: string;
  blurb: string;
  maxRounds: number | null;
  startingCash: number;
}

export const LENGTH_CONFIG: Record<GameLength, LengthConfig> = {
  quick: {
    label: 'Quick',
    blurb: '~20 minutes. Ends after 15 rounds - richest player wins.',
    maxRounds: 15,
    startingCash: 1000,
  },
  standard: {
    label: 'Standard',
    blurb: '~45 minutes. Ends after 40 rounds - richest player wins.',
    maxRounds: 40,
    startingCash: 1500,
  },
  long: {
    label: 'Long',
    blurb: 'Traditional. Play until only one player is left standing.',
    maxRounds: null,
    startingCash: 1500,
  },
};

export interface ModeConfig {
  label: string;
  emoji: string;
  blurb: string;
  minPlayers: number;
  maxPlayers: number;
  defaultLength: GameLength;
  chaosEvents: boolean;
  miniGames: boolean;
  vsAI: boolean;
  available: boolean;
}

export const MODE_CONFIG: Record<GameMode, ModeConfig> = {
  quick: {
    label: 'Quick Match',
    emoji: '⚡',
    blurb: '2-4 players, short game. Fast deals and fast fun.',
    minPlayers: 2,
    maxPlayers: 4,
    defaultLength: 'quick',
    chaosEvents: false,
    miniGames: true,
    vsAI: true,
    available: true,
  },
  classic: {
    label: 'Classic',
    emoji: '🎩',
    blurb: 'Traditional property trading with no random surprises.',
    minPlayers: 2,
    maxPlayers: 8,
    defaultLength: 'standard',
    chaosEvents: false,
    miniGames: false,
    vsAI: true,
    available: true,
  },
  chaos: {
    label: 'Chaos Mode',
    emoji: '🌪️',
    blurb: 'Random events strike every few turns. Anything can happen!',
    minPlayers: 2,
    maxPlayers: 8,
    defaultLength: 'standard',
    chaosEvents: true,
    miniGames: true,
    vsAI: true,
    available: true,
  },
  solo: {
    label: 'Solo vs AI',
    emoji: '🤖',
    blurb: 'You against 1-3 computer opponents with their own personalities.',
    minPlayers: 2,
    maxPlayers: 4,
    defaultLength: 'standard',
    chaosEvents: true,
    miniGames: true,
    vsAI: true,
    available: true,
  },
  local: {
    label: 'Local Multiplayer',
    emoji: '👯',
    blurb: 'Pass the device! 2-8 humans share one screen.',
    minPlayers: 2,
    maxPlayers: 8,
    defaultLength: 'standard',
    chaosEvents: true,
    miniGames: true,
    vsAI: false,
    available: true,
  },
  online: {
    label: 'Online Multiplayer',
    emoji: '🌍',
    blurb: 'Coming soon. The engine is already action-based and server-ready.',
    minPlayers: 2,
    maxPlayers: 8,
    defaultLength: 'standard',
    chaosEvents: true,
    miniGames: true,
    vsAI: false,
    available: false,
  },
};

export interface PersonalityInfo {
  name: string;
  emoji: string;
  blurb: string;
}

export const PERSONALITIES: Record<AIPersonality, PersonalityInfo> = {
  investor: {
    name: 'The Investor',
    emoji: '📈',
    blurb: 'Buys nearly everything and builds fast.',
  },
  banker: {
    name: 'The Banker',
    emoji: '🏦',
    blurb: 'Hoards cash and avoids risky purchases.',
  },
  trader: {
    name: 'The Trader',
    emoji: '🤝',
    blurb: 'Constantly proposes deals to finish color sets.',
  },
  gambler: {
    name: 'The Gambler',
    emoji: '🎲',
    blurb: 'Unpredictable. Might bid a fortune on a whim.',
  },
};

export const PERSONALITY_ORDER: AIPersonality[] = ['investor', 'banker', 'trader', 'gambler'];

export const PLAYER_COLORS = [
  '#ff5fa2',
  '#3ea8ff',
  '#2ed573',
  '#ffb02e',
  '#a06bff',
  '#ff6b4a',
  '#17c3b2',
  '#8d99ae',
];

export const CASH_OPTIONS = [500, 1000, 1500, 2000, 3000];
