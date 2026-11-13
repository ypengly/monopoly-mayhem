import type {
  AIPersonality,
  CardEffect,
  GameAction,
  GameSettings,
  GameState,
  PlayerConfig,
  TokenId,
} from '../../types';
import { createGame, defaultSettings, dispatch } from '../gameEngine';
import { decideAIAction } from '../ai/aiController';

const TOKENS: TokenId[] = ['cat', 'robot', 'penguin', 'dinosaur', 'astronaut', 'duck', 'fox', 'alien'];
const PERSONALITIES: AIPersonality[] = ['investor', 'banker', 'trader', 'gambler'];

export function configs(count: number, ai = false): PlayerConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Player ${i + 1}`,
    tokenId: TOKENS[i % TOKENS.length],
    isAI: ai,
    personality: ai ? PERSONALITIES[i % PERSONALITIES.length] : undefined,
  }));
}

export function newGame(count = 2, overrides: Partial<GameSettings> = {}, ai = false): GameState {
  return createGame(defaultSettings(overrides), configs(count, ai));
}

/** Dispatch and throw if the engine rejects the action. */
export function must(s: GameState, action: GameAction): GameState {
  const result = dispatch(s, action);
  if (result.error) throw new Error(`Action ${action.type} failed: ${result.error}`);
  return result.state;
}

export function roll(s: GameState, a: number, b: number): GameState {
  return must(s, { type: 'ROLL', dice: [a, b] });
}

export function give(s: GameState, playerId: string, indexes: number[]): void {
  for (const i of indexes) s.properties[i].ownerId = playerId;
}

export function playCard(s: GameState, effect: CardEffect): GameState {
  s.pending = {
    type: 'card',
    card: { id: 'test', deck: 'chaos', title: 'Test Card', text: 'test', emoji: '🧪', tone: 'neutral', effect },
  };
  return must(s, { type: 'RESOLVE_CARD' });
}

export function player(s: GameState, id: string) {
  const p = s.players.find((pl) => pl.id === id);
  if (!p) throw new Error(`no player ${id}`);
  return p;
}

/** Let the computer play the whole game. Throws if the AI ever makes an illegal move. */
export function simulate(
  settings: Partial<GameSettings>,
  count: number,
  maxSteps = 40000,
): { state: GameState; steps: number } {
  let s = createGame(defaultSettings(settings), configs(count, true));
  let steps = 0;
  while (s.phase !== 'game-over' && steps < maxSteps) {
    const action = decideAIAction(s);
    if (!action) throw new Error('AI produced no action while the game is running');
    const result = dispatch(s, action);
    if (result.error) {
      throw new Error(`AI made an illegal move ${JSON.stringify(action)}: ${result.error}`);
    }
    s = result.state;
    steps += 1;
  }
  return { state: s, steps };
}

export function assertInvariants(s: GameState): void {
  for (const p of s.players) {
    if (!Number.isFinite(p.cash)) throw new Error(`${p.name} has non-finite cash`);
    if (!p.bankrupt && p.cash < 0) throw new Error(`${p.name} has negative cash ${p.cash}`);
    if (p.bankrupt && p.cash !== 0) throw new Error(`${p.name} is bankrupt but holds cash`);
    if (p.position < 0 || p.position > 39) throw new Error('position out of range');
  }
  for (const [index, ps] of Object.entries(s.properties)) {
    if (ps.houses < 0 || ps.houses > 5) throw new Error(`bad houses on ${index}`);
    if (ps.ownerId) {
      const owner = s.players.find((p) => p.id === ps.ownerId);
      if (!owner) throw new Error(`unknown owner on ${index}`);
      if (owner.bankrupt) throw new Error(`bankrupt player still owns ${index}`);
    } else if (ps.houses > 0 || ps.mortgaged) {
      throw new Error(`unowned property ${index} has buildings or a mortgage`);
    }
  }
}
