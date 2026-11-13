import { describe, expect, it } from 'vitest';
import type { GameState } from '../../types';
import { decideAIAction } from '../ai/aiController';
import { evaluateTradeForAI, maxBid, proposeTrade, shouldBuy } from '../ai/aiStrategies';
import { dispatch } from '../gameEngine';
import { assertInvariants, give, must, newGame, player, roll, simulate } from './helpers';

function aiGame(personalities: Array<'investor' | 'banker' | 'trader' | 'gambler'>): GameState {
  const s = newGame(personalities.length, {}, true);
  s.players.forEach((p, i) => (p.personality = personalities[i]));
  return s;
}

describe('AI decisions', () => {
  it('stays out of human turns', () => {
    expect(decideAIAction(newGame(2))).toBeNull();
  });

  it('rolls at the start of its turn', () => {
    expect(decideAIAction(aiGame(['investor', 'banker']))).toEqual({ type: 'ROLL' });
  });

  it('personalities buy differently', () => {
    const s = aiGame(['investor', 'banker', 'trader']);
    player(s, 'p1').cash = 200;
    player(s, 'p2').cash = 200;
    // Pancake Plaza costs $60: investor keeps $40+, banker wants $300.
    expect(shouldBuy(s, player(s, 'p1'), 3)).toBe(true);
    expect(shouldBuy(s, player(s, 'p2'), 3)).toBe(false);
    player(s, 'p2').cash = 600;
    expect(shouldBuy(s, player(s, 'p2'), 3)).toBe(true);
  });

  it('never tries to buy something it cannot afford', () => {
    const s = aiGame(['investor', 'gambler']);
    player(s, 'p1').cash = 50;
    player(s, 'p2').cash = 50;
    expect(shouldBuy(s, player(s, 'p1'), 39)).toBe(false);
    expect(shouldBuy(s, player(s, 'p2'), 39)).toBe(false);
  });

  it('buys eagerly to finish a colour set', () => {
    const s = aiGame(['banker', 'investor']);
    give(s, 'p1', [1]);
    player(s, 'p1').cash = 150;
    expect(shouldBuy(s, player(s, 'p1'), 3)).toBe(true);
  });

  it('bids within its means', () => {
    const s = aiGame(['investor', 'banker']);
    player(s, 'p1').cash = 150;
    expect(maxBid(s, player(s, 'p1'), 39)).toBeLessThanOrEqual(110);
    expect(maxBid(s, player(s, 'p2'), 3)).toBeGreaterThan(0);
  });

  it('accepts gifts, rejects rip-offs, and accepts fair deals', () => {
    const s = aiGame(['investor', 'trader']);
    give(s, 'p2', [3]);
    const trade = (cash: number) => ({
      id: 't',
      fromId: 'p1',
      toId: 'p2',
      offer: { cash, properties: [] as number[], jailCards: 0 },
      request: { cash: 0, properties: [3], jailCards: 0 },
    });
    expect(evaluateTradeForAI(s, player(s, 'p2'), trade(5)).accept).toBe(false);
    expect(evaluateTradeForAI(s, player(s, 'p2'), trade(200)).accept).toBe(true);
    expect(
      evaluateTradeForAI(s, player(s, 'p2'), {
        id: 't',
        fromId: 'p1',
        toId: 'p2',
        offer: { cash: 100, properties: [], jailCards: 0 },
        request: { cash: 0, properties: [], jailCards: 0 },
      }).accept,
    ).toBe(true);
  });

  it('refuses deals that would leave it broke', () => {
    const s = aiGame(['investor', 'banker']);
    player(s, 'p2').cash = 100;
    const verdict = evaluateTradeForAI(s, player(s, 'p2'), {
      id: 't',
      fromId: 'p1',
      toId: 'p2',
      offer: { cash: 0, properties: [], jailCards: 0 },
      request: { cash: 90, properties: [], jailCards: 0 },
    });
    expect(verdict.accept).toBe(false);
  });

  it('proposes a deal to finish a colour set', () => {
    const s = aiGame(['trader', 'investor']);
    give(s, 'p1', [1]);
    give(s, 'p2', [3]);
    const trade = proposeTrade(s, player(s, 'p1'));
    expect(trade).not.toBeNull();
    expect(trade?.request.properties).toEqual([3]);
    expect(trade?.toId).toBe('p2');
  });

  it('raises cash by mortgaging when in debt, then pays', () => {
    let s = aiGame(['investor', 'banker']);
    give(s, 'p1', [39, 37]);
    give(s, 'p2', [3]);
    s.properties[3].houses = 0;
    player(s, 'p1').cash = 0;
    player(s, 'p1').position = 0;
    // $4 rent... not enough cash for even that.
    s = roll(s, 1, 2);
    expect(s.debt).not.toBeNull();
    const steps: string[] = [];
    for (let i = 0; i < 6 && s.debt; i++) {
      const action = decideAIAction(s)!;
      steps.push(action.type);
      s = must(s, action);
    }
    expect(steps[0]).toBe('MORTGAGE');
    expect(steps).toContain('PAY_DEBT');
    expect(s.debt).toBeNull();
  });

  it('declares bankruptcy when it cannot possibly pay', () => {
    let s = aiGame(['investor', 'banker']);
    give(s, 'p2', [37]);
    s.properties[37].houses = 5;
    player(s, 'p1').position = 31;
    player(s, 'p1').cash = 20;
    s = roll(s, 2, 4);
    expect(decideAIAction(s)).toEqual({ type: 'BANKRUPT' });
  });

  it('builds houses once it owns a full set', () => {
    let s = aiGame(['investor', 'banker']);
    give(s, 'p1', [1, 3]);
    s = roll(s, 1, 3);
    expect(s.phase).toBe('post-roll');
    expect(decideAIAction(s)).toMatchObject({ type: 'BUILD' });
  });

  it('every action the AI picks is accepted by the engine', () => {
    let s = aiGame(['investor', 'banker', 'trader', 'gambler']);
    for (let i = 0; i < 600 && s.phase !== 'game-over'; i++) {
      const action = decideAIAction(s)!;
      const result = dispatch(s, action);
      expect(result.error, JSON.stringify(action)).toBeNull();
      s = result.state;
    }
  });
});

describe('full computer-played games', () => {
  const combos: Array<[string, Parameters<typeof simulate>[0], number]> = [
    ['quick match, 2 players', { length: 'quick', startingCash: 1000, seed: 1 }, 2],
    ['quick match, 4 players', { length: 'quick', startingCash: 1000, seed: 2 }, 4],
    ['standard, 4 players', { length: 'standard', seed: 3 }, 4],
    ['chaos mode, 4 players', { length: 'standard', seed: 4, chaosEvents: true, miniGames: true }, 4],
    ['chaos mode, 8 players', { length: 'quick', seed: 5, chaosEvents: true, miniGames: true }, 8],
    ['no auctions', { length: 'quick', seed: 6, auctions: false }, 3],
    ['no free parking jackpot', { length: 'quick', seed: 7, freeParkingJackpot: false }, 3],
    ['poor start, bankruptcies likely', { length: 'standard', seed: 8, startingCash: 500, chaosEvents: true }, 4],
    ['long game (last player standing)', { length: 'long', seed: 9, startingCash: 800 }, 3],
  ];

  for (const [label, settings, players] of combos) {
    it(`finishes: ${label}`, () => {
      const { state, steps } = simulate(settings, players, 60000);
      expect(state.phase, `stuck after ${steps} steps`).toBe('game-over');
      expect(state.winnerId).not.toBeNull();
      expect(state.standings).toHaveLength(players);
      expect(state.standings[0].playerId).toBe(state.winnerId);
      assertInvariants(state);
    });
  }

  it('is reproducible from a seed', () => {
    const a = simulate({ length: 'quick', seed: 42 }, 3);
    const b = simulate({ length: 'quick', seed: 42 }, 3);
    expect(a.steps).toBe(b.steps);
    expect(a.state.winnerId).toBe(b.state.winnerId);
    expect(a.state.players.map((p) => p.cash)).toEqual(b.state.players.map((p) => p.cash));
  });

  it('plays many different seeds without ever breaking an invariant', () => {
    for (let seed = 100; seed < 130; seed++) {
      const { state } = simulate({ length: 'quick', seed, chaosEvents: seed % 2 === 0, miniGames: seed % 3 === 0 }, 2 + (seed % 4));
      expect(state.phase).toBe('game-over');
      assertInvariants(state);
    }
  });

  it('chaos mode actually triggers chaos events and mini-games', () => {
    const { state } = simulate({ length: 'standard', seed: 11, chaosEvents: true, miniGames: true }, 4);
    const text = state.log.map((l) => l.text).join('\n');
    expect(text).toMatch(/drew/);
  });
});
