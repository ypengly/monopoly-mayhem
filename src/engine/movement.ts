import type { GameState } from '../types';
import { BOARD, RAILROAD_INDEXES } from '../data/boardSpaces';
import { RULES } from '../data/gameRules';
import { addLog, getPlayer, nextId, pushFx } from './state';
import { earn } from './economyManager';

const SIZE = BOARD.length;

function recordMove(s: GameState, playerId: string, path: number[], kind: 'walk' | 'jump'): void {
  s.lastMove = { id: nextId(s), playerId, path, kind };
}

function collectSalary(s: GameState, playerId: string): void {
  earn(s, playerId, s.settings.salary, 'Passed Start');
  addLog(s, `${getPlayer(s, playerId).name} passed Start and collected $${s.settings.salary}.`, 'good');
}

/** Walk forward `steps` spaces, collecting salary every time Start is reached. */
export function moveForward(s: GameState, playerId: string, steps: number): void {
  if (steps <= 0) return;
  const p = getPlayer(s, playerId);
  const path: number[] = [];
  let passedStart = false;
  let pos = p.position;
  for (let i = 0; i < steps; i++) {
    pos = (pos + 1) % SIZE;
    path.push(pos);
    if (pos === 0) passedStart = true;
  }
  p.position = pos;
  recordMove(s, playerId, path, 'walk');
  if (passedStart) collectSalary(s, playerId);
}

/** Walk backwards. No salary is ever collected going backwards. */
export function moveBackward(s: GameState, playerId: string, steps: number): void {
  const p = getPlayer(s, playerId);
  const path: number[] = [];
  let pos = p.position;
  for (let i = 0; i < steps; i++) {
    pos = (pos - 1 + SIZE) % SIZE;
    path.push(pos);
  }
  p.position = pos;
  recordMove(s, playerId, path, 'walk');
}

/** Walk forward until reaching `index` (full lap if already there is NOT performed). */
export function moveForwardTo(s: GameState, playerId: string, index: number): void {
  const p = getPlayer(s, playerId);
  const steps = (index - p.position + SIZE) % SIZE;
  moveForward(s, playerId, steps);
}

/** Teleport without passing Start. */
export function jumpTo(s: GameState, playerId: string, index: number): void {
  const p = getPlayer(s, playerId);
  p.position = index;
  recordMove(s, playerId, [index], 'jump');
}

export function sendToJail(s: GameState, playerId: string): void {
  const p = getPlayer(s, playerId);
  jumpTo(s, playerId, RULES.jailPosition);
  p.inJail = true;
  p.jailTurns = 0;
  // Going to jail ends the player's chance to roll this turn.
  s.rolledThisTurn = true;
  s.lastRollDoubles = false;
  s.doublesCount = 0;
  s.extraRoll = false;
  pushFx(s, { kind: 'jail', playerId });
  addLog(s, `${p.name} was sent to Jail! 🚔`, 'bad');
}

export function releaseFromJail(s: GameState, playerId: string): void {
  const p = getPlayer(s, playerId);
  p.inJail = false;
  p.jailTurns = 0;
}

export function nearestRailroad(position: number): number {
  let best = RAILROAD_INDEXES[0];
  let bestDist = SIZE;
  for (const r of RAILROAD_INDEXES) {
    const d = (r - position + SIZE) % SIZE;
    if (d > 0 && d < bestDist) {
      best = r;
      bestDist = d;
    }
  }
  return best;
}
