import type { GameState, Payee } from '../types';
import { BOARD } from '../data/boardSpaces';
import { RULES } from '../data/gameRules';
import { addLog, getPlayer, ownedIndexes, pushFx } from './state';

export function earn(s: GameState, playerId: string, amount: number, reason: string): void {
  if (amount <= 0) return;
  const p = getPlayer(s, playerId);
  p.cash += amount;
  p.stats.earned += amount;
  pushFx(s, { kind: 'money', playerId, amount, label: reason });
}

function creditPayee(s: GameState, payee: Payee, reason: string): void {
  if (payee.amount <= 0) return;
  if (payee.to === 'bank') return;
  if (payee.to === 'pot') {
    if (s.settings.freeParkingJackpot) s.freeParkingPot += payee.amount;
    return;
  }
  earn(s, payee.to, payee.amount, reason);
}

/** Actually moves the money. Caller must have checked the payer can afford it. */
export function settlePayment(
  s: GameState,
  payerId: string,
  payees: Payee[],
  reason: string,
  isRent: boolean,
): void {
  const payer = getPlayer(s, payerId);
  const total = payees.reduce((sum, p) => sum + p.amount, 0);
  payer.cash -= total;
  pushFx(s, { kind: 'money', playerId: payerId, amount: -total, label: reason });
  if (isRent) payer.stats.biggestRentPaid = Math.max(payer.stats.biggestRentPaid, total);
  for (const payee of payees) {
    creditPayee(s, payee, reason);
    if (isRent && payee.to !== 'bank' && payee.to !== 'pot') {
      getPlayer(s, payee.to).stats.rentCollected += payee.amount;
    }
  }
}

/**
 * Charge a player. If they can afford it the payment is made immediately and
 * `true` is returned. Otherwise a debt is recorded and the player must raise
 * cash (mortgage / sell buildings) or declare bankruptcy.
 */
export function charge(
  s: GameState,
  payerId: string,
  payees: Payee[],
  reason: string,
  isRent = false,
): boolean {
  const filtered = payees.filter((p) => p.amount > 0);
  const total = filtered.reduce((sum, p) => sum + p.amount, 0);
  if (total <= 0) return true;
  const payer = getPlayer(s, payerId);
  if (payer.cash >= total) {
    settlePayment(s, payerId, filtered, reason, isRent);
    return true;
  }
  if (s.debt) {
    // Merge into the existing debt so nothing is ever lost.
    s.debt.payees.push(...filtered);
    s.debt.total += total;
  } else {
    s.debt = { playerId: payerId, payees: filtered, total, reason, isRent };
  }
  addLog(s, `${payer.name} owes ${'$' + total} but only has $${payer.cash}!`, 'bad');
  return false;
}

export function chargeBank(s: GameState, payerId: string, amount: number, reason: string): boolean {
  return charge(s, payerId, [{ to: 'bank', amount }], reason);
}

export function chargePot(s: GameState, payerId: string, amount: number, reason: string): boolean {
  return charge(s, payerId, [{ to: 'pot', amount }], reason);
}

/** Resolve an outstanding debt if the player now has enough cash. */
export function payDebt(s: GameState): boolean {
  const debt = s.debt;
  if (!debt) return false;
  const payer = getPlayer(s, debt.playerId);
  if (payer.cash < debt.total) return false;
  s.debt = null;
  settlePayment(s, debt.playerId, debt.payees, debt.reason, debt.isRent);
  addLog(s, `${payer.name} settled their debt of $${debt.total}.`, 'info');
  return true;
}

export function propertyValue(s: GameState, index: number): number {
  const space = BOARD[index];
  const ps = s.properties[index];
  const price = space.price ?? 0;
  const base = ps?.mortgaged ? price * RULES.mortgageRate : price;
  const buildings = (ps?.houses ?? 0) * (space.houseCost ?? 0);
  return base + buildings;
}

export function netWorth(s: GameState, playerId: string): number {
  const p = getPlayer(s, playerId);
  if (p.bankrupt) return 0;
  return p.cash + ownedIndexes(s, playerId).reduce((sum, i) => sum + propertyValue(s, i), 0);
}

/** Total cash a player could raise by liquidating everything. */
export function liquidationValue(s: GameState, playerId: string): number {
  const p = getPlayer(s, playerId);
  let total = p.cash;
  for (const i of ownedIndexes(s, playerId)) {
    const space = BOARD[i];
    const ps = s.properties[i];
    total += Math.floor(ps.houses * (space.houseCost ?? 0) * RULES.houseSellRate);
    if (!ps.mortgaged) total += Math.floor((space.price ?? 0) * RULES.mortgageRate);
  }
  return total;
}
