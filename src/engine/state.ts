import type { GameFxInput, GameState, LogTone, Player } from '../types';
import { RULES } from '../data/gameRules';

// Shared helpers. Every function in the engine managers MUTATES the draft
// state passed in; only gameEngine.dispatch() clones the state first.

export class InvalidAction extends Error {}

export function invalid(message: string): never {
  throw new InvalidAction(message);
}

export function getPlayer(s: GameState, id: string): Player {
  const p = s.players.find((pl) => pl.id === id);
  if (!p) invalid(`Unknown player ${id}`);
  return p;
}

export function currentPlayer(s: GameState): Player {
  return s.players[s.currentPlayerIndex];
}

export function activePlayers(s: GameState): Player[] {
  return s.players.filter((p) => !p.bankrupt);
}

export function otherActivePlayers(s: GameState, id: string): Player[] {
  return s.players.filter((p) => !p.bankrupt && p.id !== id);
}

export function nextId(s: GameState): number {
  s.counter += 1;
  return s.counter;
}

export function addLog(s: GameState, text: string, tone: LogTone = 'info'): void {
  s.log.push({ id: nextId(s), text, tone, round: s.round });
  if (s.log.length > RULES.logLimit) s.log.splice(0, s.log.length - RULES.logLimit);
}

export function pushFx(s: GameState, fx: GameFxInput): void {
  s.fx.push({ ...fx, id: nextId(s) } as GameState['fx'][number]);
  if (s.fx.length > RULES.fxLimit) s.fx.splice(0, s.fx.length - RULES.fxLimit);
}

export function ownedIndexes(s: GameState, playerId: string): number[] {
  return Object.entries(s.properties)
    .filter(([, p]) => p.ownerId === playerId)
    .map(([i]) => Number(i))
    .sort((a, b) => a - b);
}

export function blocked(s: GameState): boolean {
  return s.pending !== null || s.auction !== null || s.debt !== null;
}
