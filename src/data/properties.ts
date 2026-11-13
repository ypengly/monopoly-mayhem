import type { ColorGroup } from '../types';

export interface GroupInfo {
  id: ColorGroup;
  label: string;
  color: string; // css colour for the colour band
  textOnColor: string;
  houseCost: number;
}

export const GROUPS: Record<ColorGroup, GroupInfo> = {
  brown: { id: 'brown', label: 'Brown', color: '#a0643c', textOnColor: '#fff', houseCost: 50 },
  lightblue: { id: 'lightblue', label: 'Sky Blue', color: '#7fd4ff', textOnColor: '#123', houseCost: 50 },
  pink: { id: 'pink', label: 'Pink', color: '#ff7ac6', textOnColor: '#fff', houseCost: 100 },
  orange: { id: 'orange', label: 'Orange', color: '#ff9a3c', textOnColor: '#fff', houseCost: 100 },
  red: { id: 'red', label: 'Red', color: '#ff4d4d', textOnColor: '#fff', houseCost: 150 },
  yellow: { id: 'yellow', label: 'Yellow', color: '#ffd93d', textOnColor: '#432', houseCost: 150 },
  green: { id: 'green', label: 'Green', color: '#2ed573', textOnColor: '#fff', houseCost: 200 },
  darkblue: { id: 'darkblue', label: 'Deep Blue', color: '#3a5bff', textOnColor: '#fff', houseCost: 200 },
  railroad: { id: 'railroad', label: 'Transit', color: '#4b4b63', textOnColor: '#fff', houseCost: 0 },
  utility: { id: 'utility', label: 'Utility', color: '#b8c0d0', textOnColor: '#223', houseCost: 0 },
};

export interface RawProperty {
  index: number;
  name: string;
  group: ColorGroup;
  price: number;
  rent: number[];
  emoji: string;
}

// Street rents: [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
export const PROPERTY_DATA: RawProperty[] = [
  { index: 1, name: 'Noodle Alley', group: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], emoji: '🍜' },
  { index: 3, name: 'Pancake Plaza', group: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], emoji: '🥞' },
  { index: 6, name: 'Bubble Tea Bay', group: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], emoji: '🧋' },
  { index: 8, name: 'Donut Docks', group: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], emoji: '🍩' },
  { index: 9, name: 'Taco Terrace', group: 'lightblue', price: 120, rent: [8, 40, 100, 300, 450, 600], emoji: '🌮' },
  { index: 11, name: 'Pixel Park', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], emoji: '👾' },
  { index: 13, name: 'Arcade Avenue', group: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], emoji: '🕹️' },
  { index: 14, name: 'Console Court', group: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], emoji: '🎮' },
  { index: 16, name: 'Disco District', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], emoji: '🪩' },
  { index: 18, name: 'Karaoke Korner', group: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], emoji: '🎤' },
  { index: 19, name: 'Roller Rink', group: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], emoji: '🛼' },
  { index: 21, name: 'Dragon Dojo', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], emoji: '🐉' },
  { index: 23, name: 'Ninja Nook', group: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], emoji: '🥷' },
  { index: 24, name: 'Samurai Square', group: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], emoji: '⚔️' },
  { index: 26, name: 'Sunny Beach', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], emoji: '🏖️' },
  { index: 27, name: 'Palm Plaza', group: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], emoji: '🌴' },
  { index: 29, name: 'Coconut Cove', group: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], emoji: '🥥' },
  { index: 31, name: 'Jungle Junction', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], emoji: '🦜' },
  { index: 32, name: 'Treehouse Trail', group: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], emoji: '🌳' },
  { index: 34, name: 'Safari Street', group: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], emoji: '🦒' },
  { index: 37, name: 'Moon Base', group: 'darkblue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], emoji: '🌙' },
  { index: 39, name: 'Galaxy Gardens', group: 'darkblue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], emoji: '🌌' },
];

export const RAILROAD_DATA = [
  { index: 5, name: 'Rocket Express', emoji: '🚀' },
  { index: 15, name: 'Monorail Line', emoji: '🚝' },
  { index: 25, name: 'Sky Tram', emoji: '🚠' },
  { index: 35, name: 'Hyperloop', emoji: '🛸' },
];

export const UTILITY_DATA = [
  { index: 12, name: 'Power Plant', emoji: '⚡' },
  { index: 28, name: 'Water Works', emoji: '💧' },
];

export const RAILROAD_PRICE = 200;
export const UTILITY_PRICE = 150;
export const RAILROAD_BASE_RENT = 25;
