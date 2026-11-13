import type {
  DispatchResult,
  GameAction,
  GameSettings,
  GameState,
  Player,
  PlayerConfig,
} from '../types';
import { OWNABLE_INDEXES } from '../data/boardSpaces';
import { LENGTH_CONFIG, PLAYER_COLORS, RULES } from '../data/gameRules';
import { clamp } from '../utils/format';
import {
  InvalidAction,
  activePlayers,
  addLog,
  blocked,
  currentPlayer,
  getPlayer,
  invalid,
} from './state';
import { charge, chargePot, earn, netWorth, payDebt } from './economyManager';
import {
  buildHouse,
  mortgageProperty,
  purchaseProperty,
  sellHouse,
  sellPropertyToBank,
  unmortgageProperty,
} from './propertyManager';
import { BOARD } from '../data/boardSpaces';
import { passBid, placeBid, startAuction } from './auctionManager';
import { declareBankruptcy } from './bankruptcyManager';
import { initDecks, resolveCard } from './eventManager';
import { executeTrade, makeTrade, validateTrade, describeTrade } from './tradeManager';
import {
  advanceTurn,
  checkGameEnd,
  endTurn,
  finishAction,
  payJailFine,
  rollDice,
  startTurn,
  useJailCard,
} from './turnManager';
import { evaluateTradeForAI } from './ai/aiStrategies';

export function defaultSettings(overrides: Partial<GameSettings> = {}): GameSettings {
  return {
    mode: 'classic',
    length: 'standard',
    startingCash: LENGTH_CONFIG.standard.startingCash,
    salary: RULES.salary,
    chaosEvents: false,
    miniGames: false,
    freeParkingJackpot: true,
    auctions: true,
    seed: 12345,
    ...overrides,
  };
}

export function createGame(settings: GameSettings, configs: PlayerConfig[]): GameState {
  if (configs.length < RULES.minPlayers || configs.length > RULES.maxPlayers) {
    throw new Error(`A game needs ${RULES.minPlayers}-${RULES.maxPlayers} players.`);
  }
  const players: Player[] = configs.map((c, i) => ({
    id: `p${i + 1}`,
    name: c.name,
    tokenId: c.tokenId,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    isAI: c.isAI,
    personality: c.isAI ? c.personality ?? 'investor' : undefined,
    cash: settings.startingCash,
    position: 0,
    inJail: false,
    jailTurns: 0,
    jailCards: 0,
    bankrupt: false,
    skipNextMove: false,
    stats: { earned: 0, biggestRentPaid: 0, rentCollected: 0 },
  }));

  const properties: GameState['properties'] = {};
  for (const i of OWNABLE_INDEXES) properties[i] = { ownerId: null, houses: 0, mortgaged: false, rentBoost: 1 };

  const s: GameState = {
    id: `game-${settings.seed}-${Date.now().toString(36)}`,
    settings,
    players,
    properties,
    currentPlayerIndex: 0,
    round: 1,
    turnCount: 0,
    phase: 'pre-roll',
    dice: null,
    rolledThisTurn: false,
    lastRollDoubles: false,
    doublesCount: 0,
    extraRoll: false,
    pending: null,
    auction: null,
    debt: null,
    log: [],
    fx: [],
    counter: 0,
    winnerId: null,
    standings: [],
    freeParkingPot: 0,
    rentHolidayTurns: 0,
    deckChaos: [],
    deckTreasure: [],
    rng: settings.seed | 0,
    lastMove: null,
    aiTradeTurn: -1,
    skippedMove: false,
  };
  initDecks(s);
  addLog(s, '🎉 Welcome to Monopoly Mayhem! Let the chaos begin.', 'event');
  startTurn(s);
  return s;
}

/** Who has to make the next decision (a human, or the AI controller)? */
export function getActor(s: GameState): Player | null {
  if (s.phase === 'game-over') return null;
  if (s.auction) {
    const id = s.auction.bidderOrder[s.auction.turn % s.auction.bidderOrder.length];
    return id ? getPlayer(s, id) : null;
  }
  if (s.pending?.type === 'tradeOffer') return getPlayer(s, s.pending.trade.toId);
  return currentPlayer(s);
}

function requireCurrent(s: GameState, playerId?: string): Player {
  const p = currentPlayer(s);
  if (playerId && playerId !== p.id) invalid('It is not your turn.');
  return p;
}

function afterBankruptcy(s: GameState): void {
  if (checkGameEnd(s)) return;
  if (currentPlayer(s).bankrupt) advanceTurn(s);
  else finishAction(s);
}

function apply(s: GameState, action: GameAction): void {
  if (s.phase === 'game-over') invalid('The game is over.');
  const p = currentPlayer(s);

  switch (action.type) {
    case 'ROLL':
      rollDice(s, action.dice);
      break;

    case 'BUY': {
      if (s.pending?.type !== 'buy') invalid('There is nothing to buy.');
      const index = s.pending.spaceIndex;
      const price = BOARD[index].price ?? 0;
      if (p.cash < price) invalid(`You need $${price} to buy ${BOARD[index].name}.`);
      s.pending = null;
      purchaseProperty(s, p.id, index, price);
      finishAction(s);
      break;
    }

    case 'DECLINE_BUY': {
      if (s.pending?.type !== 'buy') invalid('There is nothing to decline.');
      const index = s.pending.spaceIndex;
      s.pending = null;
      if (s.settings.auctions) startAuction(s, index, 'Purchase declined');
      else addLog(s, `${p.name} passed on ${BOARD[index].name}.`);
      finishAction(s);
      break;
    }

    case 'RESOLVE_CARD':
      resolveCard(s);
      finishAction(s);
      break;

    case 'END_TURN':
      endTurn(s);
      break;

    case 'PAY_JAIL_FINE':
      payJailFine(s);
      break;

    case 'USE_JAIL_CARD':
      useJailCard(s);
      break;

    case 'BUILD':
      if (blocked(s)) invalid('Finish the current decision first.');
      buildHouse(s, p.id, action.index);
      break;

    case 'UNMORTGAGE':
      if (blocked(s)) invalid('Finish the current decision first.');
      unmortgageProperty(s, p.id, action.index);
      break;

    case 'SELL_HOUSE':
      if (s.auction) invalid('Wait for the auction to finish.');
      sellHouse(s, p.id, action.index);
      break;

    case 'MORTGAGE':
      if (s.auction) invalid('Wait for the auction to finish.');
      mortgageProperty(s, p.id, action.index);
      break;

    case 'SELL_PROPERTY':
      if (s.auction) invalid('Wait for the auction to finish.');
      sellPropertyToBank(s, p.id, action.index);
      break;

    case 'BID': {
      const ended = placeBid(s, action.playerId, action.amount);
      if (ended) finishAction(s);
      break;
    }

    case 'PASS_BID': {
      const ended = passBid(s, action.playerId);
      if (ended) finishAction(s);
      break;
    }

    case 'PROPOSE_TRADE': {
      if (blocked(s)) invalid('Finish the current decision first.');
      requireCurrent(s, action.trade.fromId);
      const trade = makeTrade(s, action.trade);
      const error = validateTrade(s, trade);
      if (error) invalid(error);
      const target = getPlayer(s, trade.toId);
      const proposer = getPlayer(s, trade.fromId);
      if (proposer.isAI) s.aiTradeTurn = s.turnCount;
      if (target.isAI) {
        const verdict = evaluateTradeForAI(s, target, trade);
        if (verdict.accept) {
          executeTrade(s, trade);
        } else {
          addLog(s, `🙅 ${target.name} turned down ${proposer.name}'s deal (${describeTrade(trade)}). ${verdict.reason}`, 'info');
        }
      } else {
        s.pending = { type: 'tradeOffer', trade };
        addLog(s, `📨 ${proposer.name} offers ${target.name} a deal: ${describeTrade(trade)}.`, 'event');
      }
      break;
    }

    case 'ACCEPT_TRADE': {
      if (s.pending?.type !== 'tradeOffer') invalid('There is no trade to accept.');
      const trade = s.pending.trade;
      s.pending = null;
      executeTrade(s, trade);
      break;
    }

    case 'REJECT_TRADE': {
      if (s.pending?.type !== 'tradeOffer') invalid('There is no trade to reject.');
      const trade = s.pending.trade;
      s.pending = null;
      addLog(s, `${getPlayer(s, trade.toId).name} rejected the deal.`, 'info');
      break;
    }

    case 'PAY_DEBT':
      if (!s.debt) invalid('You do not owe anything.');
      if (!payDebt(s)) invalid('You still cannot afford it. Mortgage or sell something, or declare bankruptcy.');
      finishAction(s);
      break;

    case 'BANKRUPT':
      declareBankruptcy(s, p.id);
      afterBankruptcy(s);
      break;

    case 'MINIGAME_RESULT': {
      const pending = s.pending;
      if (pending?.type !== 'minigame') invalid('There is no mini-game in progress.');
      s.pending = null;
      const delta = Math.round(clamp(action.delta, -300, 500));
      if (pending.opponentId && pending.game === 'diceDuel') {
        const opponent = getPlayer(s, pending.opponentId);
        if (delta > 0) {
          const amount = Math.min(delta, opponent.cash);
          opponent.cash -= amount;
          earn(s, p.id, amount, 'Dice Duel win');
        } else if (delta < 0) {
          charge(s, p.id, [{ to: opponent.id, amount: -delta }], 'Dice Duel loss');
        }
      } else if (delta > 0) {
        earn(s, p.id, delta, pending.reason);
      } else if (delta < 0) {
        chargePot(s, p.id, -delta, pending.reason);
      }
      if (action.jailCard) p.jailCards += 1;
      addLog(s, `🎮 ${action.message}`, delta >= 0 ? 'good' : 'bad');
      finishAction(s);
      break;
    }

    case 'SKIP_MINIGAME':
      if (s.pending?.type !== 'minigame') invalid('There is no mini-game to skip.');
      s.pending = null;
      addLog(s, `${p.name} skipped the mini-game.`);
      finishAction(s);
      break;

    default: {
      const never: never = action;
      invalid(`Unknown action ${(never as { type: string }).type}`);
    }
  }

  // Last player standing / safety net.
  checkGameEnd(s);
}

/**
 * The single entry point for changing a game. Never mutates `state`; returns
 * the same object plus an error message if the action was illegal.
 */
export function dispatch(state: GameState, action: GameAction): DispatchResult {
  try {
    const next = structuredClone(state);
    apply(next, action);
    return { state: next, error: null };
  } catch (e) {
    if (e instanceof InvalidAction) return { state, error: e.message };
    throw e;
  }
}

export function applyAction(state: GameState, action: GameAction): GameState {
  return dispatch(state, action).state;
}

export function playerNetWorth(s: GameState, playerId: string): number {
  return netWorth(s, playerId);
}

export function remainingPlayers(s: GameState): Player[] {
  return activePlayers(s);
}
