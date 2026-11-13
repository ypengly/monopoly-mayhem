import type { BoardSpace, ColorGroup } from '../types';
import {
  GROUPS,
  PROPERTY_DATA,
  RAILROAD_DATA,
  RAILROAD_PRICE,
  UTILITY_DATA,
  UTILITY_PRICE,
} from './properties';

function buildBoard(): BoardSpace[] {
  const spaces: BoardSpace[] = new Array(40);

  const fixed: BoardSpace[] = [
    { index: 0, name: 'Start Party', type: 'go', emoji: '🎉' },
    { index: 2, name: 'Treasure Chest', type: 'chest', emoji: '🎁' },
    { index: 4, name: 'Income Tax', type: 'tax', emoji: '🧾', amount: 200 },
    { index: 7, name: 'Chaos Card', type: 'chance', emoji: '🌀' },
    { index: 10, name: 'Jail / Just Visiting', type: 'jail', emoji: '🚔' },
    { index: 17, name: 'Treasure Chest', type: 'chest', emoji: '🎁' },
    { index: 20, name: 'Free Parking', type: 'parking', emoji: '🅿️' },
    { index: 22, name: 'Chaos Card', type: 'chance', emoji: '🌀' },
    { index: 30, name: 'Go To Jail', type: 'gotojail', emoji: '👮' },
    { index: 33, name: 'Treasure Chest', type: 'chest', emoji: '🎁' },
    { index: 36, name: 'Mini-Game Arcade', type: 'event', emoji: '🎰' },
    { index: 38, name: 'Luxury Tax', type: 'tax', emoji: '💎', amount: 100 },
  ];
  for (const s of fixed) spaces[s.index] = s;

  for (const p of PROPERTY_DATA) {
    spaces[p.index] = {
      index: p.index,
      name: p.name,
      type: 'property',
      emoji: p.emoji,
      group: p.group,
      price: p.price,
      rent: p.rent,
      houseCost: GROUPS[p.group].houseCost,
    };
  }
  for (const r of RAILROAD_DATA) {
    spaces[r.index] = {
      index: r.index,
      name: r.name,
      type: 'railroad',
      emoji: r.emoji,
      group: 'railroad',
      price: RAILROAD_PRICE,
    };
  }
  for (const u of UTILITY_DATA) {
    spaces[u.index] = {
      index: u.index,
      name: u.name,
      type: 'utility',
      emoji: u.emoji,
      group: 'utility',
      price: UTILITY_PRICE,
    };
  }
  return spaces;
}

export const BOARD: BoardSpace[] = buildBoard();

export const OWNABLE_INDEXES: number[] = BOARD.filter(
  (s) => s.type === 'property' || s.type === 'railroad' || s.type === 'utility',
).map((s) => s.index);

export const GROUP_MEMBERS: Record<ColorGroup, number[]> = (() => {
  const out = {} as Record<ColorGroup, number[]>;
  for (const g of Object.keys(GROUPS) as ColorGroup[]) out[g] = [];
  for (const s of BOARD) if (s.group) out[s.group].push(s.index);
  return out;
})();

export const RAILROAD_INDEXES = GROUP_MEMBERS.railroad;
export const UTILITY_INDEXES = GROUP_MEMBERS.utility;

export function isOwnable(index: number): boolean {
  return OWNABLE_INDEXES.includes(index);
}

export function spaceAt(index: number): BoardSpace {
  return BOARD[((index % 40) + 40) % 40];
}

/**
 * Board layout helper: returns the CSS grid cell (1-based row / col) of a
 * space on an 11x11 grid. Index 0 is the bottom-right corner and the board is
 * walked clockwise... well, "left along the bottom, then up, then right, then down".
 */
export function gridCell(index: number): { row: number; col: number } {
  if (index === 0) return { row: 11, col: 11 };
  if (index < 10) return { row: 11, col: 11 - index };
  if (index === 10) return { row: 11, col: 1 };
  if (index < 20) return { row: 11 - (index - 10), col: 1 };
  if (index === 20) return { row: 1, col: 1 };
  if (index < 30) return { row: 1, col: 1 + (index - 20) };
  if (index === 30) return { row: 1, col: 11 };
  return { row: 1 + (index - 30), col: 11 };
}

export type BoardSide = 'bottom' | 'left' | 'top' | 'right' | 'corner';

export function sideOf(index: number): BoardSide {
  if (index % 10 === 0) return 'corner';
  if (index < 10) return 'bottom';
  if (index < 20) return 'left';
  if (index < 30) return 'top';
  return 'right';
}

const CORNER = 1.6;
const TOTAL = CORNER * 2 + 9;

/** Centre of a space as percentages of the board (for placing tokens). */
export function tileCenter(index: number): { x: number; y: number } {
  const { row, col } = gridCell(index);
  const pos = (n: number) => (n === 1 ? CORNER / 2 : n === 11 ? CORNER + 9 + CORNER / 2 : CORNER + (n - 2) + 0.5);
  return { x: (pos(col) / TOTAL) * 100, y: (pos(row) / TOTAL) * 100 };
}

export const GRID_TEMPLATE = `${CORNER}fr repeat(9, 1fr) ${CORNER}fr`;
