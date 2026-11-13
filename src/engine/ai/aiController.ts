import type { GameAction, GameState, Player } from '../../types';
import { BOARD } from '../../data/boardSpaces';
import { RULES } from '../../data/gameRules';
import { simulateMiniGame } from '../../data/miniGames';
import { nextRandom } from '../../utils/random';
import { getActor } from '../gameEngine';
import { minimumBid } from '../auctionManager';
import { liquidationValue } from '../economyManager';
import {
  canMortgage,
  canSellHouse,
  mortgageValue,
  unmortgageCost,
} from '../propertyManager';
import { ownedIndexes } from '../state';
import {
  aiRng,
  buildReserve,
  buyReserve,
  chooseBuild,
  evaluateTradeForAI,
  maxBid,
  personalityOf,
  propertyWorth,
  proposeTrade,
  shouldBuy,
  tradeProbability,
} from './aiStrategies';

/**
 * Decides the next action for whoever has to act, if that player is a
 * computer. Returns null when a human needs to act (or the game is over).
 * This function never mutates the state, so it is trivial to test.
 */
export function decideAIAction(s: GameState): GameAction | null {
  const actor = getActor(s);
  if (!actor || !actor.isAI) return null;

  if (s.auction) return decideAuction(s, actor);

  if (s.pending?.type === 'tradeOffer') {
    const verdict = evaluateTradeForAI(s, actor, s.pending.trade);
    return { type: verdict.accept ? 'ACCEPT_TRADE' : 'REJECT_TRADE' };
  }

  if (s.debt) return decideDebt(s, actor);

  if (s.pending) {
    switch (s.pending.type) {
      case 'buy':
        return { type: shouldBuy(s, actor, s.pending.spaceIndex) ? 'BUY' : 'DECLINE_BUY' };
      case 'card':
        return { type: 'RESOLVE_CARD' };
      case 'minigame': {
        const game = s.pending.game;
        if (game === 'diceDuel' && personalityOf(actor) === 'banker') return { type: 'SKIP_MINIGAME' };
        const outcome = simulateMiniGame(game, aiRng(s, 3));
        return { type: 'MINIGAME_RESULT', delta: outcome.delta, message: `${actor.name}: ${outcome.message}`, jailCard: outcome.jailCard };
      }
    }
  }

  if (s.phase === 'pre-roll') {
    if (actor.inJail) return decideJail(s, actor);
    return { type: 'ROLL' };
  }

  if (s.phase === 'post-roll') return decideManagement(s, actor);
  return null;
}

function decideAuction(s: GameState, actor: Player): GameAction {
  const a = s.auction!;
  const limit = maxBid(s, actor, a.spaceIndex);
  const min = minimumBid(s);
  if (a.highBidderId === actor.id || min > limit || min > actor.cash) {
    return { type: 'PASS_BID', playerId: actor.id };
  }
  const r = aiRng(s, 11);
  const bump = RULES.auctionIncrement * (1 + Math.floor(nextRandom(r) * 3));
  const amount = Math.min(limit, a.currentBid === 0 ? Math.max(min, Math.floor((limit * 0.4) / 10) * 10) : a.currentBid + bump);
  return { type: 'BID', playerId: actor.id, amount: Math.max(min, amount) };
}

function decideDebt(s: GameState, actor: Player): GameAction {
  const debt = s.debt!;
  if (actor.cash >= debt.total) return { type: 'PAY_DEBT' };
  if (liquidationValue(s, actor.id) < debt.total) return { type: 'BANKRUPT' };

  // 1. Mortgage the least valuable mortgage-able property.
  const mortgageable = ownedIndexes(s, actor.id)
    .filter((i) => canMortgage(s, actor.id, i).ok)
    .sort((a, b) => propertyWorth(s, a, actor.id) - propertyWorth(s, b, actor.id));
  if (mortgageable.length) return { type: 'MORTGAGE', index: mortgageable[0] };

  // 2. Sell buildings.
  const sellable = ownedIndexes(s, actor.id).filter((i) => canSellHouse(s, actor.id, i).ok);
  if (sellable.length) {
    sellable.sort((a, b) => (BOARD[b].houseCost ?? 0) - (BOARD[a].houseCost ?? 0));
    return { type: 'SELL_HOUSE', index: sellable[0] };
  }
  return { type: 'BANKRUPT' };
}

function decideJail(s: GameState, actor: Player): GameAction {
  if (actor.jailCards > 0) return { type: 'USE_JAIL_CARD' };
  const personality = personalityOf(actor);
  const unownedLeft = Object.values(s.properties).filter((p) => !p.ownerId).length;
  const wantsOut =
    (personality === 'investor' || personality === 'trader') && unownedLeft > 8 && actor.cash >= 300;
  if (wantsOut) return { type: 'PAY_JAIL_FINE' };
  if (personality === 'gambler' && nextRandom(aiRng(s, 5)) < 0.3 && actor.cash >= RULES.jailFine + 100) {
    return { type: 'PAY_JAIL_FINE' };
  }
  return { type: 'ROLL' };
}

function decideManagement(s: GameState, actor: Player): GameAction {
  // 1. Unmortgage if comfortably rich.
  const reserve = Math.max(buildReserve(actor), buyReserve(actor)) + 50;
  const mortgaged = ownedIndexes(s, actor.id)
    .filter((i) => s.properties[i].mortgaged && actor.cash - unmortgageCost(i) >= reserve)
    .sort((a, b) => mortgageValue(b) - mortgageValue(a));
  if (mortgaged.length) return { type: 'UNMORTGAGE', index: mortgaged[0] };

  // 2. Build.
  const build = chooseBuild(s, actor);
  if (build !== null) {
    const skip = personalityOf(actor) === 'gambler' && nextRandom(aiRng(s, 17)) < 0.3;
    if (!skip) return { type: 'BUILD', index: build };
  }

  // 3. Propose a deal (once per turn).
  if (s.aiTradeTurn !== s.turnCount && nextRandom(aiRng(s, 19)) < tradeProbability(actor)) {
    const trade = proposeTrade(s, actor);
    if (trade) return { type: 'PROPOSE_TRADE', trade };
  }

  return { type: 'END_TURN' };
}
