import type { EventCard, GameState, MiniGameId } from '../types';
import { BOARD, OWNABLE_INDEXES } from '../data/boardSpaces';
import { CHAOS_CARDS, TREASURE_CARDS } from '../data/eventCards';
import { chance, pick, shuffle } from '../utils/random';
import {
  activePlayers,
  addLog,
  currentPlayer,
  invalid,
  otherActivePlayers,
  ownedIndexes,
  pushFx,
} from './state';
import { charge, chargeBank, chargePot, earn, netWorth } from './economyManager';
import { jumpTo, moveBackward, moveForward, moveForwardTo, nearestRailroad, sendToJail } from './movement';
import { freeBuild } from './propertyManager';
import { startAuction } from './auctionManager';
import { resolveLanding } from './spaceManager';

export function initDecks(s: GameState): void {
  s.deckChaos = shuffle(s, CHAOS_CARDS.map((_, i) => i));
  s.deckTreasure = shuffle(s, TREASURE_CARDS.map((_, i) => i));
}

export function drawCard(s: GameState, deck: 'chaos' | 'treasure'): EventCard {
  const cards = deck === 'chaos' ? CHAOS_CARDS : TREASURE_CARDS;
  for (let attempts = 0; attempts < 200; attempts++) {
    const order = deck === 'chaos' ? s.deckChaos : s.deckTreasure;
    if (order.length === 0) {
      const fresh = shuffle(s, cards.map((_, i) => i));
      if (deck === 'chaos') s.deckChaos = fresh;
      else s.deckTreasure = fresh;
      continue;
    }
    const idx = order.shift() as number;
    const card = cards[idx];
    if (card.effect.kind === 'miniGame' && !s.settings.miniGames) continue;
    return card;
  }
  return cards[0];
}

/** Draw a card and show it to the player. Its effect is applied when acknowledged. */
export function presentCard(s: GameState, deck: 'chaos' | 'treasure'): void {
  const card = drawCard(s, deck);
  const player = currentPlayer(s);
  s.pending = { type: 'card', card };
  pushFx(s, { kind: 'card', playerId: player.id, tone: card.tone });
  addLog(s, `${card.emoji} ${player.name} drew "${card.title}".`, 'event');
}

export function resolveCard(s: GameState): void {
  const pending = s.pending;
  if (!pending || pending.type !== 'card') invalid('There is no card to resolve.');
  s.pending = null;
  applyCard(s, pending.card);
}

function richest(s: GameState) {
  return [...activePlayers(s)].sort((a, b) => netWorth(s, b.id) - netWorth(s, a.id))[0];
}

function poorest(s: GameState) {
  return [...activePlayers(s)].sort((a, b) => a.cash - b.cash)[0];
}

function landed(s: GameState): void {
  resolveLanding(s, currentPlayer(s).id);
}

export function startMiniGame(s: GameState, game: MiniGameId, reason: string): void {
  const player = currentPlayer(s);
  let opponentId: string | null = null;
  if (game === 'diceDuel') {
    const others = otherActivePlayers(s, player.id);
    if (others.length) opponentId = pick(s, others).id;
  }
  s.pending = { type: 'minigame', game, reason, opponentId };
}

function applyCard(s: GameState, card: EventCard): void {
  const player = currentPlayer(s);
  const e = card.effect;
  switch (e.kind) {
    case 'cash':
      if (e.amount >= 0) earn(s, player.id, e.amount, card.title);
      else chargePot(s, player.id, -e.amount, card.title);
      break;

    case 'collectFromEach': {
      let total = 0;
      for (const other of otherActivePlayers(s, player.id)) {
        const pay = Math.min(e.amount, other.cash);
        if (pay <= 0) continue;
        other.cash -= pay;
        pushFx(s, { kind: 'money', playerId: other.id, amount: -pay, label: card.title });
        total += pay;
      }
      earn(s, player.id, total, card.title);
      addLog(s, `${player.name} collected $${total} from the other players.`, 'good');
      break;
    }

    case 'payEach': {
      const payees = otherActivePlayers(s, player.id).map((o) => ({ to: o.id, amount: e.amount }));
      charge(s, player.id, payees, card.title);
      break;
    }

    case 'moveForward':
      moveForward(s, player.id, e.steps);
      landed(s);
      break;

    case 'moveBack':
      moveBackward(s, player.id, e.steps);
      landed(s);
      break;

    case 'moveTo':
      moveForwardTo(s, player.id, e.index);
      landed(s);
      break;

    case 'nearestRailroad':
      moveForwardTo(s, player.id, nearestRailroad(player.position));
      landed(s);
      break;

    case 'goToJail':
      sendToJail(s, player.id);
      break;

    case 'jailCard':
      player.jailCards += 1;
      addLog(s, `${player.name} keeps a Get Out of Jail Free card.`, 'good');
      break;

    case 'skipMove':
      player.skipNextMove = true;
      addLog(s, `${player.name} will skip their next movement.`, 'bad');
      break;

    case 'propertyBoom': {
      const owned = ownedIndexes(s, player.id);
      if (owned.length === 0) {
        earn(s, player.id, 50, 'Consolation boom');
        addLog(s, `${player.name} owns nothing to boom, so gets a $50 consolation prize.`, 'info');
      } else {
        const index = pick(s, owned);
        const ps = s.properties[index];
        ps.rentBoost = Math.min(3, (ps.rentBoost || 1) * 1.5);
        addLog(s, `📈 ${BOARD[index].name} is booming! Its rent is now x${ps.rentBoost.toFixed(2)}.`, 'good');
      }
      break;
    }

    case 'rentHoliday':
      s.rentHolidayTurns = activePlayers(s).length;
      addLog(s, '🏖️ Rent Holiday! Nobody pays rent for one full round.', 'event');
      break;

    case 'crazyAuction': {
      const free = OWNABLE_INDEXES.filter((i) => !s.properties[i].ownerId);
      if (free.length === 0) {
        earn(s, player.id, 100, 'No properties left');
        addLog(s, 'Every property is owned, so the auctioneer pays you $100 to go away.', 'info');
      } else {
        startAuction(s, pick(s, free), 'Crazy Auction');
      }
      break;
    }

    case 'repairs': {
      let houses = 0;
      let hotels = 0;
      for (const i of ownedIndexes(s, player.id)) {
        const h = s.properties[i].houses;
        if (h === 5) hotels += 1;
        else houses += h;
      }
      const total = houses * e.perHouse + hotels * e.perHotel;
      if (total > 0) chargeBank(s, player.id, total, card.title);
      else addLog(s, `${player.name} has no buildings, so repairs cost nothing.`, 'info');
      break;
    }

    case 'perProperty': {
      const count = ownedIndexes(s, player.id).length;
      const total = Math.abs(e.amount) * count;
      if (total === 0) {
        addLog(s, `${player.name} owns no properties. Nothing happens.`, 'info');
      } else if (e.amount > 0) {
        earn(s, player.id, total, card.title);
      } else {
        chargePot(s, player.id, total, card.title);
      }
      break;
    }

    case 'swapPlaces': {
      const options = otherActivePlayers(s, player.id).filter((o) => !o.inJail);
      if (player.inJail || options.length === 0) {
        addLog(s, 'Nobody is available to swap with. Awkward.', 'info');
        break;
      }
      const other = pick(s, options);
      const mine = player.position;
      const theirs = other.position;
      other.position = mine;
      jumpTo(s, player.id, theirs);
      addLog(s, `🔄 ${player.name} swapped places with ${other.name}!`, 'event');
      landed(s);
      break;
    }

    case 'robinHood': {
      const rich = richest(s);
      const poor = poorest(s);
      if (!rich || !poor || rich.id === poor.id) {
        addLog(s, 'Robin Hood could not find anyone to rob. Awkward.', 'info');
        break;
      }
      const amount = Math.min(e.amount, rich.cash);
      rich.cash -= amount;
      pushFx(s, { kind: 'money', playerId: rich.id, amount: -amount, label: 'Robin Hood' });
      earn(s, poor.id, amount, 'Robin Hood');
      addLog(s, `🏹 Robin Hood took $${amount} from ${rich.name} and gave it to ${poor.name}.`, 'event');
      break;
    }

    case 'coinFlip': {
      const heads = chance(s, 0.5);
      addLog(s, heads ? '🪙 Heads! You win!' : '🪙 Tails... ouch.', heads ? 'good' : 'bad');
      if (heads) earn(s, player.id, e.amount, 'Coin flip win');
      else chargePot(s, player.id, e.amount, 'Coin flip loss');
      break;
    }

    case 'freeHouse': {
      const built = freeBuild(s, player.id);
      if (built === null) {
        earn(s, player.id, 75, 'Renovation voucher');
        addLog(s, `${player.name} has no set to build on, so takes a $75 voucher instead.`, 'info');
      } else {
        addLog(s, `🏗️ A free house appears on ${BOARD[built].name}!`, 'good');
      }
      break;
    }

    case 'rollAgain':
      s.extraRoll = true;
      addLog(s, `${player.name} gets an extra roll!`, 'good');
      break;

    case 'miniGame':
      startMiniGame(s, e.game, card.title);
      break;

    case 'jackpot': {
      const pot = s.freeParkingPot;
      if (pot > 0) {
        s.freeParkingPot = 0;
        earn(s, player.id, pot, 'Jackpot');
        addLog(s, `🎰 ${player.name} won the $${pot} Free Parking jackpot!`, 'good');
      } else {
        earn(s, player.id, 25, 'Jackpot');
        addLog(s, 'The jackpot is empty, so the casino hands you $25 for trying.', 'info');
      }
      break;
    }

    case 'poorestBonus': {
      const poor = poorest(s);
      earn(s, poor.id, e.amount, card.title);
      addLog(s, `🎟️ ${poor.name} wins the raffle: +$${e.amount}.`, 'event');
      break;
    }

    default: {
      const never: never = e;
      void never;
    }
  }
}
