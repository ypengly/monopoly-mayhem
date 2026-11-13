import type { ColorGroup, GameState } from '../types';
import { BOARD, GROUP_MEMBERS, RAILROAD_INDEXES, UTILITY_INDEXES } from '../data/boardSpaces';
import { RAILROAD_BASE_RENT } from '../data/properties';
import { RULES } from '../data/gameRules';
import { addLog, getPlayer, invalid, ownedIndexes, pushFx } from './state';
import { earn, chargeBank } from './economyManager';

export function groupOf(index: number): ColorGroup | undefined {
  return BOARD[index].group;
}

export function groupIndexes(group: ColorGroup): number[] {
  return GROUP_MEMBERS[group];
}

export function ownsFullGroup(s: GameState, ownerId: string, group: ColorGroup): boolean {
  return GROUP_MEMBERS[group].every((i) => s.properties[i]?.ownerId === ownerId);
}

export function countOwnedInGroup(s: GameState, ownerId: string, group: ColorGroup): number {
  return GROUP_MEMBERS[group].filter((i) => s.properties[i]?.ownerId === ownerId).length;
}

export function groupHasBuildings(s: GameState, group: ColorGroup): boolean {
  return GROUP_MEMBERS[group].some((i) => (s.properties[i]?.houses ?? 0) > 0);
}

/** Rent owed when someone lands on `index`. `diceTotal` only matters for utilities. */
export function calculateRent(s: GameState, index: number, diceTotal: number): number {
  const space = BOARD[index];
  const ps = s.properties[index];
  if (!ps || !ps.ownerId || ps.mortgaged) return 0;
  if (s.rentHolidayTurns > 0) return 0;
  const ownerId = ps.ownerId;
  let rent = 0;

  if (space.type === 'railroad') {
    const count = RAILROAD_INDEXES.filter((i) => s.properties[i].ownerId === ownerId).length;
    rent = RAILROAD_BASE_RENT * 2 ** (count - 1);
  } else if (space.type === 'utility') {
    const count = UTILITY_INDEXES.filter((i) => s.properties[i].ownerId === ownerId).length;
    rent = diceTotal * (count === 2 ? 10 : 4);
  } else if (space.type === 'property' && space.rent && space.group) {
    rent = space.rent[Math.min(ps.houses, 5)];
    if (ps.houses === 0 && ownsFullGroup(s, ownerId, space.group)) rent *= 2;
  }
  return Math.round(rent * (ps.rentBoost || 1));
}

export function transferOwnership(s: GameState, index: number, newOwnerId: string | null): void {
  const ps = s.properties[index];
  ps.ownerId = newOwnerId;
  if (newOwnerId === null) {
    ps.houses = 0;
    ps.mortgaged = false;
    ps.rentBoost = 1;
  }
}

/** Standard purchase from the bank. */
export function purchaseProperty(s: GameState, playerId: string, index: number, price: number): void {
  const player = getPlayer(s, playerId);
  const ps = s.properties[index];
  if (ps.ownerId) invalid('That property is already owned.');
  if (player.cash < price) invalid('Not enough cash.');
  player.cash -= price;
  ps.ownerId = playerId;
  ps.houses = 0;
  ps.mortgaged = false;
  pushFx(s, { kind: 'money', playerId, amount: -price, label: BOARD[index].name });
  pushFx(s, { kind: 'purchase', playerId, spaceIndex: index, price });
  addLog(s, `${player.name} bought ${BOARD[index].name} for $${price}.`, 'good');
}

// ----- Building ------------------------------------------------------------

export function canBuild(
  s: GameState,
  playerId: string,
  index: number,
): { ok: boolean; reason?: string } {
  const space = BOARD[index];
  const ps = s.properties[index];
  const player = getPlayer(s, playerId);
  if (space.type !== 'property' || !space.group) return { ok: false, reason: 'You can only build on streets.' };
  if (ps.ownerId !== playerId) return { ok: false, reason: 'You do not own this property.' };
  if (!ownsFullGroup(s, playerId, space.group))
    return { ok: false, reason: 'Own the full colour set first.' };
  const members = GROUP_MEMBERS[space.group];
  if (members.some((i) => s.properties[i].mortgaged))
    return { ok: false, reason: 'Unmortgage the whole set first.' };
  if (ps.houses >= RULES.maxHouses) return { ok: false, reason: 'Already a hotel.' };
  const min = Math.min(...members.map((i) => s.properties[i].houses));
  if (ps.houses > min) return { ok: false, reason: 'Build evenly across the set.' };
  const cost = space.houseCost ?? 0;
  if (player.cash < cost) return { ok: false, reason: `You need $${cost}.` };
  return { ok: true };
}

export function buildHouse(s: GameState, playerId: string, index: number): void {
  const check = canBuild(s, playerId, index);
  if (!check.ok) invalid(check.reason ?? 'Cannot build here.');
  const space = BOARD[index];
  const cost = space.houseCost ?? 0;
  if (!chargeBank(s, playerId, cost, `Building on ${space.name}`)) invalid('Not enough cash.');
  const ps = s.properties[index];
  ps.houses += 1;
  pushFx(s, { kind: 'build', playerId, spaceIndex: index, houses: ps.houses });
  const name = getPlayer(s, playerId).name;
  addLog(
    s,
    ps.houses === 5
      ? `${name} upgraded ${space.name} to a HOTEL!`
      : `${name} built house #${ps.houses} on ${space.name}.`,
    'good',
  );
}

/** Free building from an event card. Returns the index built on, or null. */
export function freeBuild(s: GameState, playerId: string): number | null {
  for (const i of ownedIndexes(s, playerId)) {
    const space = BOARD[i];
    if (space.type !== 'property' || !space.group) continue;
    if (!ownsFullGroup(s, playerId, space.group)) continue;
    const members = GROUP_MEMBERS[space.group];
    if (members.some((m) => s.properties[m].mortgaged)) continue;
    const ps = s.properties[i];
    if (ps.houses >= RULES.maxHouses) continue;
    if (ps.houses > Math.min(...members.map((m) => s.properties[m].houses))) continue;
    ps.houses += 1;
    pushFx(s, { kind: 'build', playerId, spaceIndex: i, houses: ps.houses });
    return i;
  }
  return null;
}

export function canSellHouse(s: GameState, playerId: string, index: number): { ok: boolean; reason?: string } {
  const space = BOARD[index];
  const ps = s.properties[index];
  if (ps.ownerId !== playerId) return { ok: false, reason: 'You do not own this property.' };
  if (space.type !== 'property' || !space.group) return { ok: false, reason: 'No buildings here.' };
  if (ps.houses <= 0) return { ok: false, reason: 'No buildings to sell.' };
  const max = Math.max(...GROUP_MEMBERS[space.group].map((i) => s.properties[i].houses));
  if (ps.houses < max) return { ok: false, reason: 'Sell evenly across the set.' };
  return { ok: true };
}

export function sellHouse(s: GameState, playerId: string, index: number): void {
  const check = canSellHouse(s, playerId, index);
  if (!check.ok) invalid(check.reason ?? 'Cannot sell.');
  const space = BOARD[index];
  const ps = s.properties[index];
  ps.houses -= 1;
  const refund = Math.floor((space.houseCost ?? 0) * RULES.houseSellRate);
  earn(s, playerId, refund, `Sold building on ${space.name}`);
  // Selling stock is not "earning" in the statistical sense.
  getPlayer(s, playerId).stats.earned -= refund;
  addLog(s, `${getPlayer(s, playerId).name} sold a building on ${space.name} for $${refund}.`, 'info');
}

// ----- Mortgage / sell -------------------------------------------------------

export function mortgageValue(index: number): number {
  return Math.floor((BOARD[index].price ?? 0) * RULES.mortgageRate);
}

export function unmortgageCost(index: number): number {
  return Math.ceil(mortgageValue(index) * (1 + RULES.unmortgageInterest));
}

export function canMortgage(s: GameState, playerId: string, index: number): { ok: boolean; reason?: string } {
  const ps = s.properties[index];
  const group = BOARD[index].group;
  if (!ps || ps.ownerId !== playerId) return { ok: false, reason: 'You do not own this property.' };
  if (ps.mortgaged) return { ok: false, reason: 'Already mortgaged.' };
  if (group && groupHasBuildings(s, group)) return { ok: false, reason: 'Sell all buildings in the set first.' };
  return { ok: true };
}

export function mortgageProperty(s: GameState, playerId: string, index: number): void {
  const check = canMortgage(s, playerId, index);
  if (!check.ok) invalid(check.reason ?? 'Cannot mortgage.');
  const value = mortgageValue(index);
  s.properties[index].mortgaged = true;
  const player = getPlayer(s, playerId);
  player.cash += value; // borrowed money is not "earned"
  pushFx(s, { kind: 'money', playerId, amount: value, label: 'Mortgage' });
  addLog(s, `${player.name} mortgaged ${BOARD[index].name} for $${value}.`, 'info');
}

export function unmortgageProperty(s: GameState, playerId: string, index: number): void {
  const ps = s.properties[index];
  if (!ps || ps.ownerId !== playerId) invalid('You do not own this property.');
  if (!ps.mortgaged) invalid('That property is not mortgaged.');
  const cost = unmortgageCost(index);
  const player = getPlayer(s, playerId);
  if (player.cash < cost) invalid(`You need $${cost} to unmortgage.`);
  player.cash -= cost;
  ps.mortgaged = false;
  pushFx(s, { kind: 'money', playerId, amount: -cost, label: 'Unmortgage' });
  addLog(s, `${player.name} paid $${cost} to unmortgage ${BOARD[index].name}.`, 'info');
}

export function sellPropertyToBank(s: GameState, playerId: string, index: number): void {
  const ps = s.properties[index];
  const group = BOARD[index].group;
  if (!ps || ps.ownerId !== playerId) invalid('You do not own this property.');
  if (ps.mortgaged) invalid('Unmortgage it before selling.');
  if (group && groupHasBuildings(s, group)) invalid('Sell all buildings in the set first.');
  const value = Math.floor((BOARD[index].price ?? 0) * RULES.sellBackRate);
  transferOwnership(s, index, null);
  const player = getPlayer(s, playerId);
  player.cash += value;
  pushFx(s, { kind: 'money', playerId, amount: value, label: 'Sold property' });
  addLog(s, `${player.name} sold ${BOARD[index].name} back to the bank for $${value}.`, 'info');
}

/** Cheapest-to-lose first: used by the AI when raising cash. */
export function sellOrMortgageCandidates(s: GameState, playerId: string): number[] {
  return ownedIndexes(s, playerId);
}
