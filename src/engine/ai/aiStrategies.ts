import type { AIPersonality, GameState, Player, Trade } from '../../types';
import { BOARD, GROUP_MEMBERS } from '../../data/boardSpaces';
import { nextRandom, type Rng } from '../../utils/random';
import { ownedIndexes } from '../state';
import { canBuild, countOwnedInGroup, groupHasBuildings } from '../propertyManager';

export interface TradeVerdict {
  accept: boolean;
  score: number;
  reason: string;
}

export function aiRng(s: GameState, salt = 0): Rng {
  return { rng: (s.rng ^ Math.imul(s.counter + 1 + salt, 2654435761)) | 0 };
}

export function personalityOf(p: Player): AIPersonality {
  return p.personality ?? 'investor';
}

/** Cash the AI wants to keep in the bank when buying. */
export function buyReserve(p: Player): number {
  switch (personalityOf(p)) {
    case 'investor':
      return 40;
    case 'banker':
      return 300;
    case 'trader':
      return 150;
    case 'gambler':
      return 0;
  }
}

export function buildReserve(p: Player): number {
  switch (personalityOf(p)) {
    case 'investor':
      return 100;
    case 'banker':
      return 500;
    case 'trader':
      return 200;
    case 'gambler':
      return 40;
  }
}

/** Does owning `index` bring `playerId` to a full colour set? */
export function completesSet(s: GameState, playerId: string, index: number): boolean {
  const group = BOARD[index].group;
  if (!group) return false;
  const total = GROUP_MEMBERS[group].length;
  return countOwnedInGroup(s, playerId, group) === total - 1 && !s.properties[index].ownerId;
}

/** Does `rivalId` already hold the rest of this set (so buying blocks them)? */
export function blocksRival(s: GameState, playerId: string, index: number): boolean {
  const group = BOARD[index].group;
  if (!group) return false;
  const total = GROUP_MEMBERS[group].length;
  return s.players.some(
    (p) => !p.bankrupt && p.id !== playerId && countOwnedInGroup(s, p.id, group) === total - 1,
  );
}

/** How much a property is worth to a particular player, in dollars. */
export function propertyWorth(s: GameState, index: number, forId: string): number {
  const space = BOARD[index];
  const price = space.price ?? 0;
  const group = space.group;
  if (!group) return price;
  const total = GROUP_MEMBERS[group].length;
  const ownedAlready = GROUP_MEMBERS[group].filter((i) => i !== index && s.properties[i].ownerId === forId).length;
  let worth = price;
  if (ownedAlready === total - 1) worth *= 1.7; // completes the set
  else if (ownedAlready >= 1) worth *= 1.15;
  if (space.type === 'railroad') worth *= 1 + 0.1 * ownedAlready;
  if (space.type === 'utility') worth *= 0.95;
  if (s.properties[index].mortgaged) worth *= 0.8;
  return Math.round(worth);
}

export function shouldBuy(s: GameState, p: Player, index: number): boolean {
  const price = BOARD[index].price ?? 0;
  if (p.cash < price) return false;
  const r = aiRng(s, 1);
  const personality = personalityOf(p);
  if (personality === 'gambler') return nextRandom(r) < 0.72;
  const reserve = buyReserve(p);
  if (completesSet(s, p.id, index)) return p.cash - price >= Math.min(reserve, 60);
  if (blocksRival(s, p.id, index) && p.cash - price >= reserve / 2) return true;
  return p.cash - price >= reserve;
}

export function maxBid(s: GameState, p: Player, index: number): number {
  const worth = propertyWorth(s, index, p.id);
  const r = aiRng(s, 7);
  let factor: number;
  switch (personalityOf(p)) {
    case 'investor':
      factor = 1.2;
      break;
    case 'banker':
      factor = 0.8;
      break;
    case 'trader':
      factor = 1.0;
      break;
    case 'gambler':
      factor = 0.4 + nextRandom(r) * 1.6;
      break;
  }
  const reserve = Math.min(buyReserve(p), 100);
  return Math.max(0, Math.min(Math.floor(worth * factor), p.cash - reserve));
}

// ----- Trading --------------------------------------------------------------------------

function givingValue(s: GameState, ai: Player, trade: Trade): number {
  let total = trade.request.cash + trade.request.jailCards * 50;
  for (const index of trade.request.properties) {
    const group = BOARD[index].group;
    let value = propertyWorth(s, index, ai.id);
    if (group) {
      const members = GROUP_MEMBERS[group].length;
      const mine = countOwnedInGroup(s, ai.id, group);
      if (mine >= members - 1 && members > 1) value *= 1.6; // breaking up my near-set
      const recipientOwns = countOwnedInGroup(s, trade.fromId, group);
      if (recipientOwns + 1 === members) value *= 1.4; // handing a rival a set
    }
    total += value;
  }
  return total;
}

function receivingValue(s: GameState, ai: Player, trade: Trade): number {
  let total = trade.offer.cash + trade.offer.jailCards * 50;
  for (const index of trade.offer.properties) {
    total += propertyWorth(s, index, ai.id);
  }
  return total;
}

/** The AI `ai` decides whether it would accept `trade` (which it receives). */
export function evaluateTradeForAI(s: GameState, ai: Player, trade: Trade): TradeVerdict {
  const gives = givingValue(s, ai, trade);
  const gets = receivingValue(s, ai, trade);
  const cashAfter = ai.cash + trade.offer.cash - trade.request.cash;
  if (cashAfter < 25) {
    return { accept: false, score: 0, reason: 'I need to keep some cash on hand.' };
  }
  const ratio = gets / Math.max(1, gives);
  let threshold: number;
  const r = aiRng(s, 13);
  switch (personalityOf(ai)) {
    case 'investor':
      threshold = 1.05;
      break;
    case 'banker':
      threshold = 1.18;
      break;
    case 'trader':
      threshold = 0.95;
      break;
    case 'gambler':
      threshold = 0.7 + nextRandom(r) * 0.6;
      break;
  }
  if (gives === 0) return { accept: true, score: ratio, reason: 'Free stuff? Yes please!' };
  if (ratio >= threshold) return { accept: true, score: ratio, reason: 'Deal!' };
  return {
    accept: false,
    score: ratio,
    reason: ratio < 0.6 ? 'That is nowhere near fair.' : 'Close, but I want a better deal.',
  };
}

/** Value a human sees at a glance: how fair is this deal for the receiver? */
export function fairnessRatio(s: GameState, receiver: Player, trade: Trade): number {
  return receivingValue(s, receiver, trade) / Math.max(1, givingValue(s, receiver, trade));
}

/** Trader-style proposal: try to buy the one property that completes a set. */
export function proposeTrade(s: GameState, ai: Player): Omit<Trade, 'id'> | null {
  for (const group of Object.keys(GROUP_MEMBERS) as (keyof typeof GROUP_MEMBERS)[]) {
    const members = GROUP_MEMBERS[group];
    if (members.length < 2) continue;
    const mine = members.filter((i) => s.properties[i].ownerId === ai.id);
    if (mine.length === 0 || mine.length !== members.length - 1) continue;
    const missing = members.find((i) => s.properties[i].ownerId !== ai.id) as number;
    const owner = s.properties[missing].ownerId;
    if (!owner) continue;
    const target = s.players.find((p) => p.id === owner);
    if (!target || target.bankrupt) continue;
    if (groupHasBuildings(s, group)) continue;

    const price = BOARD[missing].price ?? 0;
    const offerCash = Math.min(ai.cash - 60, Math.round((price * 1.6) / 10) * 10);
    if (offerCash >= price) {
      return {
        fromId: ai.id,
        toId: owner,
        offer: { cash: offerCash, properties: [], jailCards: 0 },
        request: { cash: 0, properties: [missing], jailCards: 0 },
      };
    }
    // Not enough cash: swap a spare property plus whatever cash we can spare.
    const spare = ownedIndexes(s, ai.id).find((i) => {
      const g = BOARD[i].group;
      return g !== group && g && countOwnedInGroup(s, ai.id, g) < GROUP_MEMBERS[g].length - 1 && !groupHasBuildings(s, g);
    });
    if (spare !== undefined) {
      return {
        fromId: ai.id,
        toId: owner,
        offer: { cash: Math.max(0, Math.min(ai.cash - 60, 100)), properties: [spare], jailCards: 0 },
        request: { cash: 0, properties: [missing], jailCards: 0 },
      };
    }
  }
  return null;
}

export function tradeProbability(p: Player): number {
  switch (personalityOf(p)) {
    case 'trader':
      return 0.75;
    case 'investor':
      return 0.2;
    case 'gambler':
      return 0.1;
    default:
      return 0;
  }
}

/** The best street to build on next, or null. */
export function chooseBuild(s: GameState, p: Player): number | null {
  const reserve = buildReserve(p);
  let best: number | null = null;
  let bestScore = -1;
  for (const index of ownedIndexes(s, p.id)) {
    const check = canBuild(s, p.id, index);
    if (!check.ok) continue;
    const space = BOARD[index];
    const cost = space.houseCost ?? 0;
    if (p.cash - cost < reserve) continue;
    // Prefer expensive sets: they pay out more per house.
    const score = (space.price ?? 0) - s.properties[index].houses * 30;
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  }
  return best;
}
