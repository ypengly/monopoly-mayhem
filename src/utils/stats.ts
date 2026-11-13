import type { GameState, LifetimeStats } from '../types';
import { BOARD } from '../data/boardSpaces';
import { ownedIndexes } from '../engine/state';

/**
 * Folds a finished game into the lifetime statistics of the human players
 * (all humans on this device share one profile, so "won" means a human won).
 */
export function recordGame(stats: LifetimeStats, game: GameState): LifetimeStats {
  const humans = game.players.filter((p) => !p.isAI);
  if (humans.length === 0) return stats;
  const next: LifetimeStats = { ...stats, mostExpensiveProperty: stats.mostExpensiveProperty };
  next.gamesPlayed += 1;
  const winner = game.players.find((p) => p.id === game.winnerId);
  if (winner && !winner.isAI) next.gamesWon += 1;

  for (const h of humans) {
    const owned = ownedIndexes(game, h.id);
    next.propertiesOwned += owned.length;
    next.totalMoneyEarned += h.stats.earned;
    next.biggestRent = Math.max(next.biggestRent, h.stats.biggestRentPaid);
    for (const i of owned) {
      const price = BOARD[i].price ?? 0;
      if (!next.mostExpensiveProperty || price > next.mostExpensiveProperty.price) {
        next.mostExpensiveProperty = { name: BOARD[i].name, price };
      }
    }
  }
  return next;
}

export function winPercentage(stats: LifetimeStats): number {
  return stats.gamesPlayed === 0 ? 0 : Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}
