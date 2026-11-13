import type { GameState } from '../types';
import { BOARD } from '../data/boardSpaces';
import { RULES } from '../data/gameRules';
import { addLog, getPlayer, pushFx } from './state';
import { charge, chargePot, earn } from './economyManager';
import { calculateRent } from './propertyManager';
import { sendToJail } from './movement';
import { presentCard, startMiniGame } from './eventManager';

/**
 * Resolve whatever space the player is standing on. May set `s.pending`
 * (buy decision, card, mini-game) or `s.debt`.
 */
export function resolveLanding(s: GameState, playerId: string): void {
  const player = getPlayer(s, playerId);
  const space = BOARD[player.position];
  addLog(s, `${player.name} landed on ${space.emoji} ${space.name}.`);

  switch (space.type) {
    case 'property':
    case 'railroad':
    case 'utility': {
      const ps = s.properties[space.index];
      if (!ps.ownerId) {
        s.pending = { type: 'buy', spaceIndex: space.index };
      } else if (ps.ownerId === playerId) {
        addLog(s, `${player.name} owns this one already. Home sweet home!`);
      } else {
        const owner = getPlayer(s, ps.ownerId);
        if (ps.mortgaged) {
          addLog(s, `${space.name} is mortgaged, so no rent is due.`);
        } else if (s.rentHolidayTurns > 0) {
          addLog(s, `🏖️ Rent Holiday! ${player.name} pays nothing to ${owner.name}.`, 'good');
        } else {
          const diceTotal = s.dice ? s.dice[0] + s.dice[1] : 7;
          const rent = calculateRent(s, space.index, diceTotal);
          if (rent > 0) {
            pushFx(s, { kind: 'rent', payerId: playerId, ownerId: owner.id, amount: rent, spaceIndex: space.index });
            addLog(s, `${player.name} owes ${owner.name} $${rent} rent.`, 'bad');
            charge(s, playerId, [{ to: owner.id, amount: rent }], `Rent: ${space.name}`, true);
          }
        }
      }
      break;
    }

    case 'tax':
      addLog(s, `${player.name} pays $${space.amount} in tax. Ouch!`, 'bad');
      chargePot(s, playerId, space.amount ?? 0, space.name);
      break;

    case 'chance':
      presentCard(s, 'chaos');
      break;

    case 'chest':
      presentCard(s, 'treasure');
      break;

    case 'gotojail':
      sendToJail(s, playerId);
      break;

    case 'parking':
      if (s.freeParkingPot > 0) {
        const pot = s.freeParkingPot;
        s.freeParkingPot = 0;
        earn(s, playerId, pot, 'Free Parking jackpot');
        addLog(s, `🅿️ ${player.name} scooped the $${pot} Free Parking jackpot!`, 'good');
      }
      break;

    case 'event':
      if (s.settings.miniGames) {
        const games = ['luckyWheel', 'quickTap', 'diceDuel', 'memoryMatch', 'numberGuess'] as const;
        const game = games[Math.abs(s.counter + s.turnCount) % games.length];
        startMiniGame(s, game, 'Mini-Game Arcade');
      } else {
        earn(s, playerId, 50, 'Free snack');
        addLog(s, `${player.name} gets a free $50 snack at the arcade.`, 'good');
      }
      break;

    case 'go':
    case 'jail':
    default:
      break;
  }
  void RULES;
}
