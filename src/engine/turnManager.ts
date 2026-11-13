import type { GameState, Standing } from '../types';
import { LENGTH_CONFIG, RULES } from '../data/gameRules';
import { chance, randInt } from '../utils/random';
import {
  activePlayers,
  addLog,
  blocked,
  currentPlayer,
  invalid,
  pushFx,
} from './state';
import { chargePot, netWorth } from './economyManager';
import { moveForward, releaseFromJail, sendToJail } from './movement';
import { presentCard } from './eventManager';
import { resolveLanding } from './spaceManager';

// ----- Game end ----------------------------------------------------------------

export function computeStandings(s: GameState): Standing[] {
  return s.players
    .map((p) => ({ playerId: p.id, netWorth: netWorth(s, p.id), bankrupt: p.bankrupt }))
    .sort((a, b) => {
      if (a.bankrupt !== b.bankrupt) return a.bankrupt ? 1 : -1;
      return b.netWorth - a.netWorth;
    });
}

export function endGame(s: GameState, forcedWinnerId?: string): void {
  s.standings = computeStandings(s);
  const winnerId = forcedWinnerId ?? s.standings[0].playerId;
  s.winnerId = winnerId;
  s.phase = 'game-over';
  s.pending = null;
  s.auction = null;
  s.debt = null;
  const winner = s.players.find((p) => p.id === winnerId);
  pushFx(s, { kind: 'win', playerId: winnerId });
  addLog(s, `🏆 ${winner?.name ?? 'Someone'} wins Monopoly Mayhem!`, 'good');
}

/** Ends the game if only one player remains. Returns true if the game ended. */
export function checkGameEnd(s: GameState): boolean {
  if (s.phase === 'game-over') return true;
  const active = activePlayers(s);
  if (active.length <= 1) {
    endGame(s, active[0]?.id);
    return true;
  }
  return false;
}

// ----- Turn flow ---------------------------------------------------------------------

export function startTurn(s: GameState): void {
  const p = currentPlayer(s);
  s.turnCount += 1;
  s.rolledThisTurn = false;
  s.lastRollDoubles = false;
  s.doublesCount = 0;
  s.extraRoll = false;
  s.skippedMove = false;
  s.phase = 'pre-roll';
  addLog(s, `— ${p.name}'s turn —`);

  if (p.skipNextMove) {
    p.skipNextMove = false;
    s.skippedMove = true;
    s.phase = 'post-roll';
    addLog(s, `🚗 ${p.name} is stuck in a traffic jam and skips their movement.`, 'bad');
    return;
  }
  if (s.settings.chaosEvents && chance(s, RULES.chaosEventChance)) {
    addLog(s, '🌪️ A Chaos Event strikes!', 'event');
    presentCard(s, 'chaos');
  }
}

/**
 * Call after any action that may have resolved the last blocker. Decides what
 * the current player can do next.
 */
export function finishAction(s: GameState): void {
  if (s.phase === 'game-over') return;
  if (checkGameEnd(s)) return;
  if (blocked(s)) return;
  const p = currentPlayer(s);
  if (p.bankrupt) {
    advanceTurn(s);
    return;
  }
  if (s.skippedMove) {
    s.phase = 'post-roll';
    return;
  }
  if (!s.rolledThisTurn) {
    s.phase = 'pre-roll';
    return;
  }
  if (p.inJail) {
    s.lastRollDoubles = false;
    s.extraRoll = false;
    s.phase = 'post-roll';
    return;
  }
  if (s.lastRollDoubles || s.extraRoll) {
    s.lastRollDoubles = false;
    s.extraRoll = false;
    s.phase = 'pre-roll';
    addLog(s, `🎲 ${p.name} rolls again!`, 'good');
    return;
  }
  s.phase = 'post-roll';
}

export function advanceTurn(s: GameState): void {
  if (s.phase === 'game-over') return;
  if (checkGameEnd(s)) return;
  const n = s.players.length;
  let next = s.currentPlayerIndex;
  do {
    next = (next + 1) % n;
  } while (s.players[next].bankrupt);

  if (next <= s.currentPlayerIndex) s.round += 1;
  if (s.rentHolidayTurns > 0) s.rentHolidayTurns -= 1;

  const maxRounds = LENGTH_CONFIG[s.settings.length].maxRounds;
  if ((maxRounds !== null && s.round > maxRounds) || s.round > RULES.hardRoundCap) {
    s.round = Math.min(s.round, maxRounds ?? RULES.hardRoundCap);
    addLog(s, '⏰ Time is up! The richest player wins.', 'event');
    endGame(s);
    return;
  }
  s.currentPlayerIndex = next;
  s.pending = null;
  startTurn(s);
}

export function endTurn(s: GameState): void {
  if (s.phase !== 'post-roll') invalid('You cannot end your turn yet.');
  if (blocked(s)) invalid('Finish the current decision first.');
  advanceTurn(s);
}

// ----- Dice -----------------------------------------------------------------------------

export function rollDice(s: GameState, forced?: [number, number]): void {
  if (s.phase !== 'pre-roll') invalid('You cannot roll right now.');
  if (blocked(s)) invalid('Finish the current decision first.');
  const p = currentPlayer(s);
  const d1 = forced ? forced[0] : randInt(s, 1, 6);
  const d2 = forced ? forced[1] : randInt(s, 1, 6);
  const total = d1 + d2;
  const doubles = d1 === d2;
  s.dice = [d1, d2];
  s.rolledThisTurn = true;
  // Tentatively "after the roll"; finishAction() re-opens rolling for doubles.
  s.phase = 'post-roll';
  pushFx(s, { kind: 'dice' });
  addLog(s, `🎲 ${p.name} rolled ${d1} + ${d2} = ${total}${doubles ? ' (DOUBLES!)' : ''}.`);

  if (p.inJail) {
    if (doubles) {
      releaseFromJail(s, p.id);
      s.lastRollDoubles = false;
      addLog(s, `${p.name} rolled doubles and busted out of Jail!`, 'good');
      moveAndResolve(s, p.id, total);
    } else {
      p.jailTurns += 1;
      if (p.jailTurns >= RULES.maxJailTurns) {
        addLog(s, `${p.name} has served enough time and pays the $${RULES.jailFine} fine.`, 'info');
        chargePot(s, p.id, RULES.jailFine, 'Jail fine');
        releaseFromJail(s, p.id);
        s.lastRollDoubles = false;
        moveAndResolve(s, p.id, total);
      } else {
        addLog(s, `${p.name} stays in Jail (${p.jailTurns}/${RULES.maxJailTurns}).`, 'bad');
      }
    }
    finishAction(s);
    return;
  }

  if (doubles) {
    s.doublesCount += 1;
    if (s.doublesCount >= RULES.maxDoubles) {
      addLog(s, `${p.name} rolled doubles three times in a row. Speeding ticket!`, 'bad');
      sendToJail(s, p.id);
      finishAction(s);
      return;
    }
  } else {
    s.doublesCount = 0;
  }
  s.lastRollDoubles = doubles;
  moveAndResolve(s, p.id, total);
  finishAction(s);
}

function moveAndResolve(s: GameState, playerId: string, steps: number): void {
  moveForward(s, playerId, steps);
  resolveLanding(s, playerId);
}

// ----- Jail options ----------------------------------------------------------------------------

export function payJailFine(s: GameState): void {
  const p = currentPlayer(s);
  if (!p.inJail) invalid('You are not in Jail.');
  if (s.phase !== 'pre-roll' || blocked(s)) invalid('You cannot do that right now.');
  if (p.cash < RULES.jailFine) invalid(`You need $${RULES.jailFine} to pay the fine.`);
  chargePot(s, p.id, RULES.jailFine, 'Jail fine');
  releaseFromJail(s, p.id);
  addLog(s, `${p.name} paid $${RULES.jailFine} to leave Jail.`, 'info');
}

export function useJailCard(s: GameState): void {
  const p = currentPlayer(s);
  if (!p.inJail) invalid('You are not in Jail.');
  if (s.phase !== 'pre-roll' || blocked(s)) invalid('You cannot do that right now.');
  if (p.jailCards <= 0) invalid('You have no Get Out of Jail Free cards.');
  p.jailCards -= 1;
  releaseFromJail(s, p.id);
  addLog(s, `${p.name} used a Get Out of Jail Free card.`, 'good');
}
