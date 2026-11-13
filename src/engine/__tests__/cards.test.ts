import { describe, expect, it } from 'vitest';
import { dispatch } from '../gameEngine';
import { ALL_CARDS } from '../../data/eventCards';
import { assertInvariants, give, must, newGame, playCard, player, roll } from './helpers';

describe('event card effects', () => {
  it('adds and removes cash (losses feed the Free Parking pot)', () => {
    let s = playCard(newGame(), { kind: 'cash', amount: 100 });
    expect(player(s, 'p1').cash).toBe(1600);
    s = playCard(newGame(), { kind: 'cash', amount: -75 });
    expect(player(s, 'p1').cash).toBe(1425);
    expect(s.freeParkingPot).toBe(75);
  });

  it('Pizza Party: everyone else pays the host', () => {
    const s = playCard(newGame(3), { kind: 'collectFromEach', amount: 25 });
    expect(player(s, 'p1').cash).toBe(1550);
    expect(player(s, 'p2').cash).toBe(1475);
    expect(player(s, 'p3').cash).toBe(1475);
  });

  it('only collects what a broke guest can afford', () => {
    const s0 = newGame(3);
    player(s0, 'p2').cash = 10;
    const s = playCard(s0, { kind: 'collectFromEach', amount: 25 });
    expect(player(s, 'p2').cash).toBe(0);
    expect(player(s, 'p1').cash).toBe(1535);
  });

  it('pays each other player', () => {
    const s = playCard(newGame(3), { kind: 'payEach', amount: 20 });
    expect(player(s, 'p1').cash).toBe(1460);
    expect(player(s, 'p2').cash).toBe(1520);
    expect(player(s, 'p3').cash).toBe(1520);
  });

  it('turns an unaffordable payment into a debt with several creditors', () => {
    const s0 = newGame(3);
    player(s0, 'p1').cash = 10;
    const s = playCard(s0, { kind: 'payEach', amount: 20 });
    expect(s.debt?.total).toBe(40);
    expect(s.debt?.payees).toHaveLength(2);
    const bankrupt = must(s, { type: 'BANKRUPT' });
    expect(player(bankrupt, 'p2').cash).toBe(1505);
    expect(player(bankrupt, 'p3').cash).toBe(1505);
  });

  it('Lucky Day moves forward and resolves the new space', () => {
    const s = playCard(newGame(), { kind: 'moveForward', steps: 3 });
    expect(player(s, 'p1').position).toBe(3);
    expect(s.pending).toEqual({ type: 'buy', spaceIndex: 3 });
    expect(s.lastMove?.path).toEqual([1, 2, 3]);
  });

  it('moving backwards never pays salary', () => {
    const s0 = newGame();
    player(s0, 'p1').position = 1;
    const s = playCard(s0, { kind: 'moveBack', steps: 3 });
    expect(player(s, 'p1').position).toBe(38);
    expect(player(s, 'p1').cash).toBe(1400); // Luxury Tax only
  });

  it('moving to Start pays salary', () => {
    const s0 = newGame();
    player(s0, 'p1').position = 20;
    const s = playCard(s0, { kind: 'moveTo', index: 0 });
    expect(player(s, 'p1').position).toBe(0);
    expect(player(s, 'p1').cash).toBe(1700);
  });

  it('finds the nearest station', () => {
    const s0 = newGame();
    player(s0, 'p1').position = 7;
    expect(player(playCard(s0, { kind: 'nearestRailroad' }), 'p1').position).toBe(15);
    const s1 = newGame();
    player(s1, 'p1').position = 36;
    const after = playCard(s1, { kind: 'nearestRailroad' });
    expect(player(after, 'p1').position).toBe(5);
    expect(player(after, 'p1').cash).toBe(1700);
  });

  it('jail and jail-free cards', () => {
    const jailed = playCard(newGame(), { kind: 'goToJail' });
    expect(player(jailed, 'p1').inJail).toBe(true);
    expect(jailed.phase).toBe('post-roll');
    const kept = playCard(newGame(), { kind: 'jailCard' });
    expect(player(kept, 'p1').jailCards).toBe(1);
  });

  it('Traffic Jam skips the next movement', () => {
    let s = playCard(newGame(), { kind: 'skipMove' });
    expect(player(s, 'p1').skipNextMove).toBe(true);
    s = roll(s, 1, 3);
    s = must(s, { type: 'END_TURN' });
    s = roll(s, 1, 3);
    s = must(s, { type: 'END_TURN' });
    expect(s.players[s.currentPlayerIndex].id).toBe('p1');
    expect(s.phase).toBe('post-roll');
    expect(s.skippedMove).toBe(true);
    expect(dispatch(s, { type: 'ROLL' }).error).toBeTruthy();
    expect(player(s, 'p1').skipNextMove).toBe(false);
    s = must(s, { type: 'END_TURN' });
    player(s, 'p2').position = 0;
    s = roll(s, 1, 3);
    s = must(s, { type: 'END_TURN' });
    expect(s.players[s.currentPlayerIndex].id).toBe('p1');
    expect(s.phase).toBe('pre-roll'); // back to normal
  });

  it('Property Boom raises one property rent, or pays a consolation prize', () => {
    const s0 = newGame();
    give(s0, 'p1', [3]);
    const s = playCard(s0, { kind: 'propertyBoom' });
    expect(s.properties[3].rentBoost).toBe(1.5);
    expect(player(playCard(newGame(), { kind: 'propertyBoom' }), 'p1').cash).toBe(1550);
  });

  it('Rent Holiday suspends rent for a full round', () => {
    let s0 = newGame();
    give(s0, 'p1', [3]);
    s0 = playCard(s0, { kind: 'rentHoliday' });
    expect(s0.rentHolidayTurns).toBe(2);
    s0 = roll(s0, 1, 3);
    s0 = must(s0, { type: 'END_TURN' });
    const s = roll(s0, 1, 2); // p2 lands on p1's Pancake Plaza
    expect(player(s, 'p2').cash).toBe(1500);
    expect(player(s, 'p1').cash).toBe(1300);
  });

  it('Crazy Auction puts a free property up for bids', () => {
    const s = playCard(newGame(3), { kind: 'crazyAuction' });
    expect(s.auction).not.toBeNull();
    expect(s.properties[s.auction!.spaceIndex].ownerId).toBeNull();
    expect(s.auction!.reason).toBe('Crazy Auction');
  });

  it('Crazy Auction pays cash if nothing is left to sell', () => {
    const s0 = newGame();
    for (const k of Object.keys(s0.properties)) s0.properties[Number(k)].ownerId = 'p2';
    const s = playCard(s0, { kind: 'crazyAuction' });
    expect(s.auction).toBeNull();
    expect(player(s, 'p1').cash).toBe(1600);
  });

  it('Gremlins charge per house and hotel', () => {
    const s0 = newGame();
    give(s0, 'p1', [1, 3]);
    s0.properties[1].houses = 2;
    s0.properties[3].houses = 5;
    const s = playCard(s0, { kind: 'repairs', perHouse: 25, perHotel: 100 });
    expect(player(s, 'p1').cash).toBe(1500 - 150);
  });

  it('per-property cards scale with holdings', () => {
    const s0 = newGame();
    give(s0, 'p1', [1, 3, 5]);
    expect(player(playCard(s0, { kind: 'perProperty', amount: -20 }), 'p1').cash).toBe(1440);
    const s1 = newGame();
    give(s1, 'p1', [1, 3, 5]);
    expect(player(playCard(s1, { kind: 'perProperty', amount: 10 }), 'p1').cash).toBe(1530);
  });

  it('Body Swap exchanges positions', () => {
    const s0 = newGame();
    player(s0, 'p2').position = 12;
    const s = playCard(s0, { kind: 'swapPlaces' });
    expect(player(s, 'p1').position).toBe(12);
    expect(player(s, 'p2').position).toBe(0);
    expect(s.pending).toEqual({ type: 'buy', spaceIndex: 12 });
  });

  it('Robin Hood moves money from the richest to the poorest', () => {
    const s0 = newGame(3);
    player(s0, 'p1').cash = 500;
    player(s0, 'p2').cash = 1500;
    player(s0, 'p3').cash = 1000;
    const s = playCard(s0, { kind: 'robinHood', amount: 100 });
    expect(player(s, 'p1').cash).toBe(600);
    expect(player(s, 'p2').cash).toBe(1400);
    expect(player(s, 'p3').cash).toBe(1000);
  });

  it('Double Or Nothing is exactly one of the two outcomes', () => {
    const s = playCard(newGame(), { kind: 'coinFlip', amount: 150 });
    expect([1350, 1650]).toContain(player(s, 'p1').cash);
  });

  it('Free Renovation builds on a complete set, or gives a voucher', () => {
    const s0 = newGame();
    give(s0, 'p1', [1, 3]);
    const s = playCard(s0, { kind: 'freeHouse' });
    expect(s.properties[1].houses).toBe(1);
    expect(player(s, 'p1').cash).toBe(1500);
    expect(player(playCard(newGame(), { kind: 'freeHouse' }), 'p1').cash).toBe(1575);
  });

  it('Double Espresso grants an extra roll', () => {
    let s = playCard(newGame(), { kind: 'rollAgain' });
    expect(s.extraRoll).toBe(true);
    s = roll(s, 1, 3);
    expect(s.phase).toBe('pre-roll');
    expect(s.players[s.currentPlayerIndex].id).toBe('p1');
    s = roll(s, 1, 2); // lands on a Chaos Card space
    expect(s.pending?.type).toBe('card');
    expect(s.phase).toBe('post-roll');
  });

  it('Free Parking Jackpot pays out the pot', () => {
    const s0 = newGame();
    s0.freeParkingPot = 300;
    const s = playCard(s0, { kind: 'jackpot' });
    expect(player(s, 'p1').cash).toBe(1800);
    expect(s.freeParkingPot).toBe(0);
  });

  it('Charity Raffle goes to the poorest player', () => {
    const s0 = newGame(3);
    player(s0, 'p3').cash = 100;
    const s = playCard(s0, { kind: 'poorestBonus', amount: 150 });
    expect(player(s, 'p3').cash).toBe(250);
  });
});

describe('mini-game results', () => {
  it('pays out and clamps rewards', () => {
    let s0 = newGame();
    s0 = playCard(s0, { kind: 'miniGame', game: 'luckyWheel' });
    expect(s0.pending?.type).toBe('minigame');
    const s = must(s0, { type: 'MINIGAME_RESULT', delta: 100, message: 'won' });
    expect(player(s, 'p1').cash).toBe(1600);
    const cheated = must(playCard(newGame(), { kind: 'miniGame', game: 'luckyWheel' }), {
      type: 'MINIGAME_RESULT',
      delta: 1_000_000,
      message: 'cheat',
    });
    expect(player(cheated, 'p1').cash).toBe(2000);
  });

  it('settles dice duels between two players', () => {
    const s0 = playCard(newGame(), { kind: 'miniGame', game: 'diceDuel' });
    expect(s0.pending).toMatchObject({ type: 'minigame', opponentId: 'p2' });
    const s = must(s0, { type: 'MINIGAME_RESULT', delta: 50, message: 'win' });
    expect(player(s, 'p1').cash).toBe(1550);
    expect(player(s, 'p2').cash).toBe(1450);
    const lost = must(playCard(newGame(), { kind: 'miniGame', game: 'diceDuel' }), {
      type: 'MINIGAME_RESULT',
      delta: -50,
      message: 'lose',
    });
    expect(player(lost, 'p1').cash).toBe(1450);
    expect(player(lost, 'p2').cash).toBe(1550);
  });

  it('awards Get Out of Jail Free cards from the wheel and can be skipped', () => {
    const s = must(playCard(newGame(), { kind: 'miniGame', game: 'luckyWheel' }), {
      type: 'MINIGAME_RESULT',
      delta: 0,
      message: 'jail card',
      jailCard: true,
    });
    expect(player(s, 'p1').jailCards).toBe(1);
    const skipped = must(playCard(newGame(), { kind: 'miniGame', game: 'quickTap' }), { type: 'SKIP_MINIGAME' });
    expect(skipped.pending).toBeNull();
    expect(player(skipped, 'p1').cash).toBe(1500);
    expect(skipped.phase).toBe('pre-roll');
  });
});

describe('every event card is playable', () => {
  const scenarios: Array<[string, (s: ReturnType<typeof newGame>) => void]> = [
    ['fresh game', () => undefined],
    [
      'broke player',
      (s) => {
        player(s, 'p1').cash = 5;
      },
    ],
    [
      'property owner with buildings',
      (s) => {
        give(s, 'p1', [1, 3, 5, 6, 8, 9]);
        s.properties[1].houses = 3;
        s.properties[3].houses = 5;
        player(s, 'p1').position = 30;
      },
    ],
    [
      'jailed player',
      (s) => {
        player(s, 'p1').inJail = true;
        player(s, 'p1').position = 10;
      },
    ],
  ];

  for (const [label, setup] of scenarios) {
    it(`resolves all ${ALL_CARDS.length} cards without errors (${label})`, () => {
      for (const card of ALL_CARDS) {
        const s = newGame(3);
        setup(s);
        s.pending = { type: 'card', card };
        const result = dispatch(s, { type: 'RESOLVE_CARD' });
        expect(result.error, card.id).toBeNull();
        assertInvariantsAllowingDebt(result.state);
      }
    });
  }
});

function assertInvariantsAllowingDebt(s: ReturnType<typeof newGame>) {
  if (s.debt) {
    for (const p of s.players) expect(Number.isFinite(p.cash)).toBe(true);
    return;
  }
  assertInvariants(s);
}
