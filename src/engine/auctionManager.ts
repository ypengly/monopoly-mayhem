import type { GameState } from '../types';
import { BOARD } from '../data/boardSpaces';
import { RULES } from '../data/gameRules';
import { activePlayers, addLog, getPlayer, invalid } from './state';
import { purchaseProperty } from './propertyManager';

/** Begin an auction. Bidding starts with the player after the current one. */
export function startAuction(s: GameState, spaceIndex: number, reason: string): void {
  const players = activePlayers(s);
  const startAt = s.currentPlayerIndex;
  const ordered = [...s.players.slice(startAt + 1), ...s.players.slice(0, startAt + 1)].filter(
    (p) => !p.bankrupt && players.includes(p),
  );
  s.pending = null;
  s.auction = {
    spaceIndex,
    bidderOrder: ordered.map((p) => p.id),
    turn: 0,
    highBidderId: null,
    currentBid: 0,
    reason,
  };
  addLog(s, `🔨 ${reason}: ${BOARD[spaceIndex].name} goes to auction!`, 'event');
}

export function minimumBid(s: GameState): number {
  const a = s.auction;
  if (!a) return 0;
  return a.currentBid === 0 ? RULES.auctionIncrement : a.currentBid + RULES.auctionIncrement;
}

export function auctionBidder(s: GameState): string | null {
  const a = s.auction;
  if (!a || a.bidderOrder.length === 0) return null;
  return a.bidderOrder[a.turn % a.bidderOrder.length];
}

/** Returns true when the auction has finished (the last remaining bidder won). */
export function placeBid(s: GameState, playerId: string, amount: number): boolean {
  const a = s.auction;
  if (!a) invalid('There is no auction right now.');
  if (auctionBidder(s) !== playerId) invalid('It is not your turn to bid.');
  const player = getPlayer(s, playerId);
  amount = Math.floor(amount);
  if (!Number.isFinite(amount) || amount < minimumBid(s)) invalid(`Minimum bid is $${minimumBid(s)}.`);
  if (amount > player.cash) invalid('You cannot bid more than you have.');
  a.currentBid = amount;
  a.highBidderId = playerId;
  a.turn = (a.turn + 1) % a.bidderOrder.length;
  addLog(s, `${player.name} bids $${amount}.`, 'info');
  if (a.bidderOrder.length === 1) {
    endAuction(s, true);
    return true;
  }
  return false;
}

/** Returns true when the auction has finished. */
export function passBid(s: GameState, playerId: string): boolean {
  const a = s.auction;
  if (!a) invalid('There is no auction right now.');
  if (auctionBidder(s) !== playerId) invalid('It is not your turn to bid.');
  const idx = a.bidderOrder.indexOf(playerId);
  a.bidderOrder.splice(idx, 1);
  if (idx < a.turn) a.turn -= 1;
  if (a.turn >= a.bidderOrder.length) a.turn = 0;
  addLog(s, `${getPlayer(s, playerId).name} passes.`, 'info');

  if (a.bidderOrder.length === 0) {
    endAuction(s, false);
    return true;
  }
  if (a.bidderOrder.length === 1 && a.highBidderId === a.bidderOrder[0]) {
    endAuction(s, true);
    return true;
  }
  return false;
}

function endAuction(s: GameState, sold: boolean): void {
  const a = s.auction;
  if (!a) return;
  s.auction = null;
  if (sold && a.highBidderId) {
    purchaseProperty(s, a.highBidderId, a.spaceIndex, a.currentBid);
    addLog(
      s,
      `${getPlayer(s, a.highBidderId).name} won ${BOARD[a.spaceIndex].name} at auction for $${a.currentBid}!`,
      'good',
    );
  } else {
    addLog(s, `Nobody wanted ${BOARD[a.spaceIndex].name}. It stays with the bank.`, 'info');
  }
}
