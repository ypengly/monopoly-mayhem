import type { GameState, Trade, TradeSide } from '../types';
import { BOARD } from '../data/boardSpaces';
import { addLog, getPlayer, invalid, nextId, pushFx } from './state';
import { groupHasBuildings, transferOwnership } from './propertyManager';

export function emptySide(): TradeSide {
  return { cash: 0, properties: [], jailCards: 0 };
}

export function makeTrade(s: GameState, input: Omit<Trade, 'id'>): Trade {
  return { ...input, id: `trade-${nextId(s)}` };
}

function validateSide(
  s: GameState,
  ownerId: string,
  side: TradeSide,
  label: string,
): string | null {
  const owner = getPlayer(s, ownerId);
  if (!Number.isInteger(side.cash) || side.cash < 0) return `${label}: cash must be a whole, positive number.`;
  if (side.cash > owner.cash) return `${owner.name} does not have $${side.cash}.`;
  if (side.jailCards < 0 || side.jailCards > owner.jailCards)
    return `${owner.name} does not have that many Get Out of Jail Free cards.`;
  const seen = new Set<number>();
  for (const index of side.properties) {
    if (seen.has(index)) return 'A property appears twice in the deal.';
    seen.add(index);
    const ps = s.properties[index];
    if (!ps || ps.ownerId !== ownerId) return `${owner.name} does not own ${BOARD[index]?.name ?? 'that property'}.`;
    const group = BOARD[index].group;
    if (group && groupHasBuildings(s, group))
      return `Sell the buildings in the ${BOARD[index].name} colour set before trading it.`;
  }
  return null;
}

export function sideIsEmpty(side: TradeSide): boolean {
  return side.cash === 0 && side.properties.length === 0 && side.jailCards === 0;
}

/** Returns an error message, or null if the trade is legal. */
export function validateTrade(s: GameState, trade: Trade): string | null {
  if (trade.fromId === trade.toId) return 'You cannot trade with yourself.';
  const from = getPlayer(s, trade.fromId);
  const to = getPlayer(s, trade.toId);
  if (from.bankrupt || to.bankrupt) return 'Bankrupt players cannot trade.';
  if (sideIsEmpty(trade.offer) && sideIsEmpty(trade.request)) return 'The deal is empty.';
  return validateSide(s, trade.fromId, trade.offer, 'Offer') ?? validateSide(s, trade.toId, trade.request, 'Request');
}

export function executeTrade(s: GameState, trade: Trade): void {
  const error = validateTrade(s, trade);
  if (error) invalid(error);
  const from = getPlayer(s, trade.fromId);
  const to = getPlayer(s, trade.toId);

  from.cash += trade.request.cash - trade.offer.cash;
  to.cash += trade.offer.cash - trade.request.cash;
  from.jailCards += trade.request.jailCards - trade.offer.jailCards;
  to.jailCards += trade.offer.jailCards - trade.request.jailCards;
  for (const i of trade.offer.properties) transferOwnership(s, i, to.id);
  for (const i of trade.request.properties) transferOwnership(s, i, from.id);

  pushFx(s, { kind: 'trade' });
  addLog(s, `🤝 ${from.name} and ${to.name} made a deal! (${describeTrade(trade)})`, 'good');
}

export function describeSide(side: TradeSide): string {
  const parts: string[] = [];
  if (side.cash) parts.push(`$${side.cash}`);
  for (const i of side.properties) parts.push(BOARD[i].name);
  if (side.jailCards) parts.push(`${side.jailCards} jail card${side.jailCards > 1 ? 's' : ''}`);
  return parts.length ? parts.join(' + ') : 'nothing';
}

export function describeTrade(trade: Trade): string {
  return `${describeSide(trade.offer)} for ${describeSide(trade.request)}`;
}
