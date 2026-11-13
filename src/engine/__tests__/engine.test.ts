import { describe, expect, it } from 'vitest';
import { dispatch, getActor } from '../gameEngine';
import { calculateRent, canBuild, mortgageValue, unmortgageCost } from '../propertyManager';
import { netWorth } from '../economyManager';
import { validateTrade } from '../tradeManager';
import { give, must, newGame, player, roll } from './helpers';

describe('game setup', () => {
  it('starts every player with the configured cash at Start', () => {
    const s = newGame(3, { startingCash: 2000 });
    expect(s.players).toHaveLength(3);
    for (const p of s.players) {
      expect(p.cash).toBe(2000);
      expect(p.position).toBe(0);
      expect(p.inJail).toBe(false);
    }
    expect(s.phase).toBe('pre-roll');
    expect(s.currentPlayerIndex).toBe(0);
  });

  it('rejects invalid player counts', () => {
    expect(() => newGame(1)).toThrow();
    expect(() => newGame(9)).toThrow();
  });

  it('is deterministic for a given seed', () => {
    const a = must(newGame(2, { seed: 99 }), { type: 'ROLL' });
    const b = must(newGame(2, { seed: 99 }), { type: 'ROLL' });
    expect(a.dice).toEqual(b.dice);
    expect(a.players[0].position).toBe(b.players[0].position);
  });

  it('survives a JSON save/load round trip', () => {
    const s = roll(newGame(2), 1, 2);
    const loaded = JSON.parse(JSON.stringify(s));
    const next = must(loaded, { type: 'BUY' });
    expect(player(next, 'p1').cash).toBe(1500 - 60);
  });
});

describe('movement and dice', () => {
  it('moves the token by the dice total', () => {
    const s = roll(newGame(), 1, 2);
    expect(player(s, 'p1').position).toBe(3);
    expect(s.dice).toEqual([1, 2]);
  });

  it('collects salary when passing Start', () => {
    const s0 = newGame();
    player(s0, 'p1').position = 38;
    const s = roll(s0, 1, 2);
    expect(player(s, 'p1').position).toBe(1);
    expect(player(s, 'p1').cash).toBe(1700);
  });

  it('gives an extra roll after doubles', () => {
    const s = roll(newGame(), 2, 2); // lands on Income Tax
    expect(s.players[s.currentPlayerIndex].id).toBe('p1');
    expect(s.phase).toBe('pre-roll');
    expect(player(s, 'p1').cash).toBe(1300);
  });

  it('sends a player to jail after three doubles in a row', () => {
    const s0 = newGame();
    s0.doublesCount = 2;
    const s = roll(s0, 3, 3);
    expect(player(s, 'p1').inJail).toBe(true);
    expect(player(s, 'p1').position).toBe(10);
    expect(s.phase).toBe('post-roll');
  });

  it('wraps around the board', () => {
    const s0 = newGame();
    player(s0, 'p1').position = 39;
    const s = roll(s0, 1, 3);
    expect(player(s, 'p1').position).toBe(3);
  });
});

describe('buying properties', () => {
  it('offers an unowned property and deducts the price when bought', () => {
    let s = roll(newGame(), 1, 2);
    expect(s.pending).toEqual({ type: 'buy', spaceIndex: 3 });
    s = must(s, { type: 'BUY' });
    expect(s.properties[3].ownerId).toBe('p1');
    expect(player(s, 'p1').cash).toBe(1440);
    expect(s.phase).toBe('post-roll');
  });

  it('refuses to buy without enough cash', () => {
    const s0 = newGame();
    player(s0, 'p1').cash = 10;
    const s = roll(s0, 1, 2);
    const result = dispatch(s, { type: 'BUY' });
    expect(result.error).toMatch(/\$60/);
    expect(result.state).toBe(s);
  });

  it('sends a declined property to auction', () => {
    const s = must(roll(newGame(3), 1, 2), { type: 'DECLINE_BUY' });
    expect(s.auction).not.toBeNull();
    expect(s.auction?.bidderOrder).toEqual(['p2', 'p3', 'p1']);
  });

  it('leaves a declined property unowned when auctions are off', () => {
    const s = must(roll(newGame(2, { auctions: false }), 1, 2), { type: 'DECLINE_BUY' });
    expect(s.auction).toBeNull();
    expect(s.properties[3].ownerId).toBeNull();
    expect(s.phase).toBe('post-roll');
  });
});

describe('rent', () => {
  it('pays base rent to the owner', () => {
    const s0 = newGame();
    give(s0, 'p2', [3]);
    const s = roll(s0, 1, 2);
    expect(player(s, 'p1').cash).toBe(1496);
    expect(player(s, 'p2').cash).toBe(1504);
    expect(s.fx.some((f) => f.kind === 'rent')).toBe(true);
  });

  it('doubles rent on an unbuilt full colour set', () => {
    const s0 = newGame();
    give(s0, 'p2', [1, 3]);
    expect(calculateRent(s0, 3, 3)).toBe(8);
  });

  it('uses the house and hotel rent table', () => {
    const s0 = newGame();
    give(s0, 'p2', [1, 3]);
    s0.properties[3].houses = 2;
    expect(calculateRent(s0, 3, 3)).toBe(60);
    s0.properties[3].houses = 5;
    expect(calculateRent(s0, 3, 3)).toBe(450);
  });

  it('scales station rent with how many are owned', () => {
    const s0 = newGame();
    give(s0, 'p2', [5]);
    expect(calculateRent(s0, 5, 7)).toBe(25);
    give(s0, 'p2', [15]);
    expect(calculateRent(s0, 5, 7)).toBe(50);
    give(s0, 'p2', [25, 35]);
    expect(calculateRent(s0, 5, 7)).toBe(200);
  });

  it('charges utilities by the dice roll', () => {
    const s0 = newGame();
    give(s0, 'p2', [12]);
    expect(calculateRent(s0, 12, 9)).toBe(36);
    give(s0, 'p2', [28]);
    expect(calculateRent(s0, 12, 9)).toBe(90);
  });

  it('charges nothing on mortgaged properties or for the owner', () => {
    const s0 = newGame();
    give(s0, 'p2', [3]);
    s0.properties[3].mortgaged = true;
    const s = roll(s0, 1, 2);
    expect(player(s, 'p1').cash).toBe(1500);
  });

  it('applies rent boosts', () => {
    const s0 = newGame();
    give(s0, 'p2', [3]);
    s0.properties[3].rentBoost = 1.5;
    expect(calculateRent(s0, 3, 3)).toBe(6);
  });
});

describe('building, mortgages and selling', () => {
  it('requires the full colour set to build', () => {
    const s0 = newGame();
    give(s0, 'p1', [1]);
    expect(canBuild(s0, 'p1', 1).ok).toBe(false);
    give(s0, 'p1', [3]);
    expect(canBuild(s0, 'p1', 1).ok).toBe(true);
  });

  it('builds evenly and upgrades to a hotel', () => {
    let s = newGame();
    give(s, 'p1', [1, 3]);
    s = must(s, { type: 'BUILD', index: 1 });
    expect(dispatch(s, { type: 'BUILD', index: 1 }).error).toMatch(/evenly/i);
    s = must(s, { type: 'BUILD', index: 3 });
    for (let i = 0; i < 4; i++) {
      s = must(s, { type: 'BUILD', index: 1 });
      s = must(s, { type: 'BUILD', index: 3 });
    }
    expect(s.properties[1].houses).toBe(5);
    expect(s.properties[3].houses).toBe(5);
    expect(dispatch(s, { type: 'BUILD', index: 1 }).error).toBeTruthy();
    expect(player(s, 'p1').cash).toBe(1500 - 10 * 50);
  });

  it('sells buildings for half price', () => {
    let s = newGame();
    give(s, 'p1', [1, 3]);
    s = must(s, { type: 'BUILD', index: 1 });
    s = must(s, { type: 'SELL_HOUSE', index: 1 });
    expect(player(s, 'p1').cash).toBe(1500 - 50 + 25);
    expect(s.properties[1].houses).toBe(0);
  });

  it('mortgages and unmortgages with interest', () => {
    let s = newGame();
    give(s, 'p1', [3]);
    s = must(s, { type: 'MORTGAGE', index: 3 });
    expect(player(s, 'p1').cash).toBe(1500 + mortgageValue(3));
    expect(mortgageValue(3)).toBe(30);
    expect(unmortgageCost(3)).toBe(33);
    expect(dispatch(s, { type: 'MORTGAGE', index: 3 }).error).toBeTruthy();
    s = must(s, { type: 'UNMORTGAGE', index: 3 });
    expect(player(s, 'p1').cash).toBe(1500 + 30 - 33);
    expect(s.properties[3].mortgaged).toBe(false);
  });

  it('will not mortgage a street while its set has buildings', () => {
    let s = newGame();
    give(s, 'p1', [1, 3]);
    s = must(s, { type: 'BUILD', index: 1 });
    expect(dispatch(s, { type: 'MORTGAGE', index: 3 }).error).toMatch(/buildings/i);
  });

  it('sells an unbuilt property back to the bank for half', () => {
    let s = newGame();
    give(s, 'p1', [3]);
    s = must(s, { type: 'SELL_PROPERTY', index: 3 });
    expect(s.properties[3].ownerId).toBeNull();
    expect(player(s, 'p1').cash).toBe(1530);
  });

  it('does not allow managing someone else\'s property', () => {
    const s = newGame();
    give(s, 'p2', [3]);
    expect(dispatch(s, { type: 'MORTGAGE', index: 3 }).error).toBeTruthy();
    expect(dispatch(s, { type: 'BUILD', index: 3 }).error).toBeTruthy();
    expect(dispatch(s, { type: 'SELL_PROPERTY', index: 3 }).error).toBeTruthy();
  });
});

describe('taxes and free parking', () => {
  it('pays tax into the Free Parking pot, which the next lander collects', () => {
    let s = roll(newGame(), 1, 3); // Income Tax $200
    expect(player(s, 'p1').cash).toBe(1300);
    expect(s.freeParkingPot).toBe(200);
    s = must(s, { type: 'END_TURN' });
    player(s, 'p2').position = 14;
    s = roll(s, 2, 4); // Free Parking
    expect(player(s, 'p2').cash).toBe(1700);
    expect(s.freeParkingPot).toBe(0);
  });

  it('can turn the jackpot off', () => {
    const s = roll(newGame(2, { freeParkingJackpot: false }), 1, 3);
    expect(s.freeParkingPot).toBe(0);
  });
});

describe('jail', () => {
  function jailed() {
    const s = newGame();
    const p = player(s, 'p1');
    p.inJail = true;
    p.position = 10;
    return s;
  }

  it('sends you to jail from the Go To Jail space', () => {
    const s0 = newGame();
    player(s0, 'p1').position = 24;
    const s = roll(s0, 2, 4);
    expect(player(s, 'p1').inJail).toBe(true);
    expect(player(s, 'p1').position).toBe(10);
    expect(s.phase).toBe('post-roll');
  });

  it('lets you pay the fine and then roll', () => {
    let s = must(jailed(), { type: 'PAY_JAIL_FINE' });
    expect(player(s, 'p1').inJail).toBe(false);
    expect(player(s, 'p1').cash).toBe(1450);
    expect(s.freeParkingPot).toBe(50);
    s = roll(s, 1, 2);
    expect(player(s, 'p1').position).toBe(13);
  });

  it('lets you use a Get Out of Jail Free card', () => {
    const s0 = jailed();
    player(s0, 'p1').jailCards = 1;
    const s = must(s0, { type: 'USE_JAIL_CARD' });
    expect(player(s, 'p1').inJail).toBe(false);
    expect(player(s, 'p1').jailCards).toBe(0);
    expect(dispatch(s, { type: 'USE_JAIL_CARD' }).error).toBeTruthy();
  });

  it('frees you on doubles, moves you, but gives no extra roll', () => {
    let s = roll(jailed(), 3, 3);
    expect(player(s, 'p1').inJail).toBe(false);
    expect(player(s, 'p1').position).toBe(16);
    expect(s.pending).toEqual({ type: 'buy', spaceIndex: 16 });
    s = must(s, { type: 'BUY' });
    expect(s.phase).toBe('post-roll'); // doubles that free you do not roll again
    expect(s.players[s.currentPlayerIndex].id).toBe('p1');
  });

  it('keeps you in jail on a failed roll', () => {
    const s = roll(jailed(), 1, 2);
    expect(player(s, 'p1').inJail).toBe(true);
    expect(player(s, 'p1').jailTurns).toBe(1);
    expect(s.phase).toBe('post-roll');
    expect(player(s, 'p1').position).toBe(10);
  });

  it('forces the fine and movement on the third failed turn', () => {
    const s0 = jailed();
    player(s0, 'p1').jailTurns = 2;
    const s = roll(s0, 1, 2);
    expect(player(s, 'p1').inJail).toBe(false);
    expect(player(s, 'p1').cash).toBe(1450);
    expect(player(s, 'p1').position).toBe(13);
  });

  it('treats the Jail space as just visiting when you land there normally', () => {
    const s0 = newGame();
    player(s0, 'p1').position = 7;
    const s = roll(s0, 1, 2);
    expect(player(s, 'p1').inJail).toBe(false);
    expect(player(s, 'p1').position).toBe(10);
    expect(player(s, 'p1').cash).toBe(1500);
  });

  it('refuses the fine without enough cash', () => {
    const s0 = jailed();
    player(s0, 'p1').cash = 20;
    expect(dispatch(s0, { type: 'PAY_JAIL_FINE' }).error).toMatch(/\$50/);
  });
});

describe('debt and bankruptcy', () => {
  function brokeAtMoonBase() {
    const s = newGame();
    give(s, 'p2', [37]);
    s.properties[37].houses = 5;
    player(s, 'p1').position = 31;
    player(s, 'p1').cash = 30;
    return roll(s, 2, 4); // 37 Moon Base hotel rent 1500
  }

  it('creates a debt instead of letting cash go negative', () => {
    const s = brokeAtMoonBase();
    expect(s.debt).not.toBeNull();
    expect(s.debt?.total).toBe(1500);
    expect(player(s, 'p1').cash).toBe(30);
    expect(dispatch(s, { type: 'END_TURN' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'PAY_DEBT' }).error).toMatch(/cannot afford/i);
  });

  it('lets a player raise cash by mortgaging, then pay the debt', () => {
    const s0 = newGame();
    give(s0, 'p1', [39, 37]);
    give(s0, 'p2', [3]);
    s0.properties[3].houses = 5; // $450 rent
    player(s0, 'p1').cash = 100;
    let s = roll(s0, 1, 2);
    expect(s.debt?.total).toBe(450);
    s = must(s, { type: 'MORTGAGE', index: 39 }); // +200
    expect(player(s, 'p1').cash).toBe(300);
    expect(dispatch(s, { type: 'PAY_DEBT' }).error).toBeTruthy();
    s = must(s, { type: 'MORTGAGE', index: 37 }); // +175
    s = must(s, { type: 'PAY_DEBT' });
    expect(s.debt).toBeNull();
    expect(player(s, 'p1').cash).toBe(25);
    expect(player(s, 'p2').cash).toBe(1950);
    expect(player(s, 'p1').stats.biggestRentPaid).toBe(450);
    expect(s.phase).toBe('post-roll');
  });

  it('transfers everything to the creditor on bankruptcy and ends a 2-player game', () => {
    let s = brokeAtMoonBase();
    give(s, 'p1', [1]);
    s = must(s, { type: 'BANKRUPT' });
    expect(player(s, 'p1').bankrupt).toBe(true);
    expect(s.properties[1].ownerId).toBe('p2');
    expect(s.phase).toBe('game-over');
    expect(s.winnerId).toBe('p2');
    expect(s.standings[0].playerId).toBe('p2');
    expect(dispatch(s, { type: 'ROLL' }).error).toMatch(/over/i);
  });

  it('returns assets to the bank when the creditor is the bank, and play continues', () => {
    const s0 = newGame(3);
    give(s0, 'p1', [1, 3]);
    s0.properties[1].houses = 2;
    player(s0, 'p1').cash = 10;
    s0.pending = null;
    player(s0, 'p1').position = 0;
    let s = roll(s0, 1, 3); // Income Tax $200 -> debt to the pot
    expect(s.debt?.total).toBe(200);
    s = must(s, { type: 'BANKRUPT' });
    expect(s.properties[1].ownerId).toBeNull();
    expect(s.properties[1].houses).toBe(0);
    expect(s.phase).toBe('pre-roll');
    expect(s.players[s.currentPlayerIndex].id).toBe('p2');
    expect(s.winnerId).toBeNull();
  });

  it('skips bankrupt players in the turn order', () => {
    let s = newGame(3);
    s = must(s, { type: 'BANKRUPT' }); // p1 resigns
    expect(s.players[s.currentPlayerIndex].id).toBe('p2');
    s = roll(s, 1, 3);
    s = must(s, { type: 'END_TURN' });
    expect(s.players[s.currentPlayerIndex].id).toBe('p3');
    s = roll(s, 1, 3);
    s = must(s, { type: 'END_TURN' });
    expect(s.players[s.currentPlayerIndex].id).toBe('p2');
  });
});

describe('auctions', () => {
  it('awards the property to the highest bidder', () => {
    let s = must(roll(newGame(3), 1, 2), { type: 'DECLINE_BUY' });
    expect(getActor(s)?.id).toBe('p2');
    s = must(s, { type: 'BID', playerId: 'p2', amount: 50 });
    expect(getActor(s)?.id).toBe('p3');
    s = must(s, { type: 'PASS_BID', playerId: 'p3' });
    s = must(s, { type: 'PASS_BID', playerId: 'p1' });
    expect(s.auction).toBeNull();
    expect(s.properties[3].ownerId).toBe('p2');
    expect(player(s, 'p2').cash).toBe(1450);
    expect(s.phase).toBe('post-roll');
  });

  it('enforces turn order, minimum raises and cash limits', () => {
    const s = must(roll(newGame(3), 1, 2), { type: 'DECLINE_BUY' });
    expect(dispatch(s, { type: 'BID', playerId: 'p3', amount: 50 }).error).toMatch(/turn/i);
    expect(dispatch(s, { type: 'BID', playerId: 'p2', amount: 5 }).error).toMatch(/minimum/i);
    expect(dispatch(s, { type: 'BID', playerId: 'p2', amount: 5000 }).error).toMatch(/more than/i);
    const s2 = must(s, { type: 'BID', playerId: 'p2', amount: 50 });
    expect(dispatch(s2, { type: 'BID', playerId: 'p3', amount: 55 }).error).toMatch(/minimum/i);
  });

  it('leaves the property unsold if everyone passes', () => {
    let s = must(roll(newGame(2), 1, 2), { type: 'DECLINE_BUY' });
    s = must(s, { type: 'PASS_BID', playerId: 'p2' });
    s = must(s, { type: 'PASS_BID', playerId: 'p1' });
    expect(s.auction).toBeNull();
    expect(s.properties[3].ownerId).toBeNull();
    expect(s.phase).toBe('post-roll');
  });

  it('ends immediately when the last bidder remaining makes a bid', () => {
    let s = must(roll(newGame(2), 1, 2), { type: 'DECLINE_BUY' });
    s = must(s, { type: 'PASS_BID', playerId: 'p2' });
    s = must(s, { type: 'BID', playerId: 'p1', amount: 10 });
    expect(s.auction).toBeNull();
    expect(s.properties[3].ownerId).toBe('p1');
  });

  it('blocks rolling and ending the turn during an auction', () => {
    const s = must(roll(newGame(2), 1, 2), { type: 'DECLINE_BUY' });
    expect(dispatch(s, { type: 'END_TURN' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'BUILD', index: 3 }).error).toBeTruthy();
  });
});

describe('trading', () => {
  it('executes a property + cash swap with a human opponent after they accept', () => {
    let s = newGame();
    give(s, 'p1', [1]);
    give(s, 'p2', [3]);
    s = must(s, {
      type: 'PROPOSE_TRADE',
      trade: {
        fromId: 'p1',
        toId: 'p2',
        offer: { cash: 100, properties: [1], jailCards: 0 },
        request: { cash: 0, properties: [3], jailCards: 0 },
      },
    });
    expect(s.pending?.type).toBe('tradeOffer');
    expect(getActor(s)?.id).toBe('p2');
    expect(dispatch(s, { type: 'ROLL' }).error).toBeTruthy();
    s = must(s, { type: 'ACCEPT_TRADE' });
    expect(s.properties[1].ownerId).toBe('p2');
    expect(s.properties[3].ownerId).toBe('p1');
    expect(player(s, 'p1').cash).toBe(1400);
    expect(player(s, 'p2').cash).toBe(1600);
    expect(s.pending).toBeNull();
  });

  it('leaves everything alone when the offer is rejected', () => {
    let s = newGame();
    give(s, 'p2', [3]);
    s = must(s, {
      type: 'PROPOSE_TRADE',
      trade: {
        fromId: 'p1',
        toId: 'p2',
        offer: { cash: 100, properties: [], jailCards: 0 },
        request: { cash: 0, properties: [3], jailCards: 0 },
      },
    });
    s = must(s, { type: 'REJECT_TRADE' });
    expect(s.properties[3].ownerId).toBe('p2');
    expect(player(s, 'p1').cash).toBe(1500);
  });

  it('validates trades', () => {
    const s = newGame();
    give(s, 'p1', [1]);
    give(s, 'p2', [3]);
    const base = { id: 't', fromId: 'p1', toId: 'p2' };
    const empty = { cash: 0, properties: [] as number[], jailCards: 0 };
    expect(validateTrade(s, { ...base, offer: empty, request: empty })).toMatch(/empty/i);
    expect(validateTrade(s, { ...base, offer: { ...empty, cash: 9999 }, request: empty })).toMatch(/does not have/i);
    expect(validateTrade(s, { ...base, offer: { ...empty, properties: [3] }, request: empty })).toMatch(/does not own/i);
    expect(validateTrade(s, { ...base, offer: { ...empty, cash: -5 }, request: empty })).toBeTruthy();
    expect(validateTrade(s, { ...base, offer: { ...empty, jailCards: 1 }, request: empty })).toBeTruthy();
    expect(validateTrade(s, { ...base, fromId: 'p1', toId: 'p1', offer: { ...empty, cash: 5 }, request: empty })).toBeTruthy();
    expect(validateTrade(s, { ...base, offer: { ...empty, properties: [1] }, request: empty })).toBeNull();
  });

  it('refuses to trade streets in a set that has buildings', () => {
    const s = newGame();
    give(s, 'p1', [1, 3]);
    s.properties[1].houses = 1;
    const empty = { cash: 0, properties: [] as number[], jailCards: 0 };
    expect(
      validateTrade(s, { id: 't', fromId: 'p1', toId: 'p2', offer: { ...empty, properties: [3] }, request: { ...empty, cash: 10 } }),
    ).toMatch(/buildings/i);
  });

  it('lets an AI evaluate trade fairness', () => {
    let s = newGame(2, {}, true);
    give(s, 'p2', [3]);
    const lowball = must(s, {
      type: 'PROPOSE_TRADE',
      trade: {
        fromId: 'p1',
        toId: 'p2',
        offer: { cash: 10, properties: [], jailCards: 0 },
        request: { cash: 0, properties: [3], jailCards: 0 },
      },
    });
    expect(lowball.properties[3].ownerId).toBe('p2');
    expect(lowball.log[lowball.log.length - 1].text).toMatch(/turned down/);
    s = must(s, {
      type: 'PROPOSE_TRADE',
      trade: {
        fromId: 'p1',
        toId: 'p2',
        offer: { cash: 300, properties: [], jailCards: 0 },
        request: { cash: 0, properties: [3], jailCards: 0 },
      },
    });
    expect(s.properties[3].ownerId).toBe('p1');
    expect(player(s, 'p1').cash).toBe(1200);
  });
});

describe('turn management and validation', () => {
  it('does not let you end your turn before rolling', () => {
    const s = newGame();
    expect(dispatch(s, { type: 'END_TURN' }).error).toBeTruthy();
  });

  it('does not let you roll twice without doubles', () => {
    const s = roll(newGame(), 1, 3);
    expect(dispatch(s, { type: 'ROLL' }).error).toBeTruthy();
  });

  it('does not let you roll or end the turn with a decision pending', () => {
    const s = roll(newGame(), 1, 2);
    expect(dispatch(s, { type: 'ROLL' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'END_TURN' }).error).toBeTruthy();
  });

  it('rejects actions that make no sense right now', () => {
    const s = newGame();
    expect(dispatch(s, { type: 'BUY' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'DECLINE_BUY' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'RESOLVE_CARD' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'PAY_DEBT' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'ACCEPT_TRADE' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'USE_JAIL_CARD' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'PASS_BID', playerId: 'p1' }).error).toBeTruthy();
    expect(dispatch(s, { type: 'MINIGAME_RESULT', delta: 100, message: 'cheat' }).error).toBeTruthy();
  });

  it('never mutates the previous state', () => {
    const s = newGame();
    const snapshot = JSON.stringify(s);
    roll(s, 1, 2);
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('passes the turn to the next player and counts rounds', () => {
    let s = roll(newGame(2), 1, 3);
    s = must(s, { type: 'END_TURN' });
    expect(s.players[s.currentPlayerIndex].id).toBe('p2');
    expect(s.round).toBe(1);
    s = roll(s, 1, 3);
    s = must(s, { type: 'END_TURN' });
    expect(s.players[s.currentPlayerIndex].id).toBe('p1');
    expect(s.round).toBe(2);
  });
});

describe('game end', () => {
  it('ends after the round limit and crowns the richest player', () => {
    const s0 = newGame(2, { length: 'quick' });
    s0.round = 15;
    s0.currentPlayerIndex = 1;
    give(s0, 'p2', [39, 37]);
    player(s0, 'p2').cash = 2000;
    player(s0, 'p1').cash = 900;
    let s = roll(s0, 1, 3); // p2 pays tax, but is still richer
    s = must(s, { type: 'END_TURN' });
    expect(s.phase).toBe('game-over');
    expect(s.winnerId).toBe('p2');
    expect(s.standings.map((x) => x.playerId)).toEqual(['p2', 'p1']);
    expect(netWorth(s, 'p2')).toBeGreaterThan(netWorth(s, 'p1'));
  });

  it('counts mortgaged property and buildings in net worth', () => {
    const s = newGame();
    give(s, 'p1', [1, 3]);
    s.properties[1].houses = 2;
    s.properties[3].mortgaged = true;
    expect(netWorth(s, 'p1')).toBe(1500 + 60 + 100 + 30);
  });

  it('blocks every action once the game is over', () => {
    let s = newGame();
    s = must(s, { type: 'BANKRUPT' });
    expect(s.phase).toBe('game-over');
    for (const type of ['ROLL', 'END_TURN', 'BUY'] as const) {
      expect(dispatch(s, { type }).error).toBeTruthy();
    }
    expect(getActor(s)).toBeNull();
  });
});
