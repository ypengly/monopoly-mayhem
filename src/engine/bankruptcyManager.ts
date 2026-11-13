import type { GameState } from '../types';
import { addLog, getPlayer, ownedIndexes, pushFx } from './state';
import { transferOwnership } from './propertyManager';

/**
 * Eliminates a player. If they owe a single player, that player inherits
 * everything (buildings are sold to the bank). Otherwise assets return to
 * the bank and any cash is split between the player creditors.
 */
export function declareBankruptcy(s: GameState, playerId: string): void {
  const player = getPlayer(s, playerId);
  if (player.bankrupt) return;

  const debt = s.debt && s.debt.playerId === playerId ? s.debt : null;
  const creditorIds = Array.from(
    new Set((debt?.payees ?? []).map((p) => p.to).filter((to) => to !== 'bank' && to !== 'pot')),
  ).filter((id) => id !== playerId && !getPlayer(s, id).bankrupt);
  const heir = creditorIds.length === 1 ? creditorIds[0] : null;

  if (player.cash > 0 && creditorIds.length > 0) {
    const share = Math.floor(player.cash / creditorIds.length);
    for (const id of creditorIds) getPlayer(s, id).cash += share;
  }
  player.cash = 0;

  for (const index of ownedIndexes(s, playerId)) {
    if (heir) {
      const ps = s.properties[index];
      ps.houses = 0;
      ps.rentBoost = 1;
      transferOwnership(s, index, heir);
    } else {
      transferOwnership(s, index, null);
    }
  }
  if (heir) getPlayer(s, heir).jailCards += player.jailCards;
  player.jailCards = 0;

  player.bankrupt = true;
  player.inJail = false;
  s.debt = null;
  s.pending = null;
  s.lastRollDoubles = false;
  s.extraRoll = false;
  pushFx(s, { kind: 'bankrupt', playerId });
  addLog(
    s,
    heir
      ? `💥 ${player.name} went bankrupt! Everything goes to ${getPlayer(s, heir).name}.`
      : `💥 ${player.name} went bankrupt! Their properties return to the bank.`,
    'bad',
  );
}
