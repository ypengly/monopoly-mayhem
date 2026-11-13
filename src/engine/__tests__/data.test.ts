import { describe, expect, it } from 'vitest';
import { BOARD, GROUP_MEMBERS, OWNABLE_INDEXES, gridCell, tileCenter } from '../../data/boardSpaces';
import { ALL_CARDS, CHAOS_CARDS, TREASURE_CARDS } from '../../data/eventCards';
import { TOKENS, TOKEN_ORDER } from '../../data/tokens';

describe('board data', () => {
  it('has exactly 40 spaces with sequential indexes', () => {
    expect(BOARD).toHaveLength(40);
    BOARD.forEach((space, i) => {
      expect(space).toBeDefined();
      expect(space.index).toBe(i);
      expect(space.name.length).toBeGreaterThan(0);
    });
  });

  it('contains the required special spaces', () => {
    const types = BOARD.map((s) => s.type);
    expect(types.filter((t) => t === 'go')).toHaveLength(1);
    expect(types.filter((t) => t === 'jail')).toHaveLength(1);
    expect(types.filter((t) => t === 'gotojail')).toHaveLength(1);
    expect(types.filter((t) => t === 'parking')).toHaveLength(1);
    expect(types.filter((t) => t === 'tax')).toHaveLength(2);
    expect(types.filter((t) => t === 'chance').length).toBeGreaterThanOrEqual(2);
    expect(types.filter((t) => t === 'chest').length).toBeGreaterThanOrEqual(2);
    expect(types.filter((t) => t === 'event').length).toBeGreaterThanOrEqual(1);
    expect(types.filter((t) => t === 'property')).toHaveLength(22);
    expect(types.filter((t) => t === 'railroad')).toHaveLength(4);
    expect(types.filter((t) => t === 'utility')).toHaveLength(2);
  });

  it('has rent tables and prices for every street', () => {
    for (const i of OWNABLE_INDEXES) {
      expect(BOARD[i].price).toBeGreaterThan(0);
      if (BOARD[i].type === 'property') {
        expect(BOARD[i].rent).toHaveLength(6);
        expect(BOARD[i].houseCost).toBeGreaterThan(0);
        // Rent must strictly grow with buildings.
        const rent = BOARD[i].rent as number[];
        for (let k = 1; k < rent.length; k++) expect(rent[k]).toBeGreaterThan(rent[k - 1]);
      }
    }
  });

  it('groups have the right sizes', () => {
    expect(GROUP_MEMBERS.brown).toHaveLength(2);
    expect(GROUP_MEMBERS.darkblue).toHaveLength(2);
    expect(GROUP_MEMBERS.lightblue).toHaveLength(3);
    expect(GROUP_MEMBERS.railroad).toHaveLength(4);
    expect(GROUP_MEMBERS.utility).toHaveLength(2);
  });

  it('maps every space to a unique grid cell on the outer ring', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const { row, col } = gridCell(i);
      expect(row === 1 || row === 11 || col === 1 || col === 11).toBe(true);
      seen.add(`${row},${col}`);
      const c = tileCenter(i);
      expect(c.x).toBeGreaterThan(0);
      expect(c.x).toBeLessThan(100);
      expect(c.y).toBeGreaterThan(0);
      expect(c.y).toBeLessThan(100);
    }
    expect(seen.size).toBe(40);
  });
});

describe('event cards', () => {
  it('has 40+ unique event cards', () => {
    expect(ALL_CARDS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(ALL_CARDS.map((c) => c.id)).size).toBe(ALL_CARDS.length);
    expect(new Set(ALL_CARDS.map((c) => c.title)).size).toBe(ALL_CARDS.length);
  });

  it('has the headline chaos events from the design brief', () => {
    const ids = CHAOS_CARDS.map((c) => c.id);
    for (const id of [
      'pizza-party',
      'rich-uncle',
      'bank-error',
      'broken-elevator',
      'tax-inspection',
      'lucky-day',
      'traffic-jam',
      'property-boom',
      'rent-holiday',
      'crazy-auction',
    ]) {
      expect(ids).toContain(id);
    }
  });

  it('every card has funny text and an emoji', () => {
    for (const card of ALL_CARDS) {
      expect(card.text.length).toBeGreaterThan(15);
      expect(card.emoji.length).toBeGreaterThan(0);
    }
    expect(TREASURE_CARDS.length).toBeGreaterThan(10);
  });
});

describe('tokens', () => {
  it('offers the eight required characters', () => {
    expect(TOKEN_ORDER).toHaveLength(8);
    for (const id of ['cat', 'robot', 'penguin', 'dinosaur', 'astronaut', 'duck', 'fox', 'alien'] as const) {
      expect(TOKENS[id]).toBeDefined();
    }
  });
});
