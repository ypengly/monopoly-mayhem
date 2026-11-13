import type { TokenId } from '../types';

export interface TokenInfo {
  id: TokenId;
  name: string;
  emoji: string;
  /** Soft gradient pair used to build the glossy 3D-style token. */
  from: string;
  to: string;
  tagline: string;
}

export const TOKENS: Record<TokenId, TokenInfo> = {
  cat: { id: 'cat', name: 'Cute Cat', emoji: '🐱', from: '#ffd6a5', to: '#ff9f68', tagline: 'Lands on its feet. Mostly.' },
  robot: { id: 'robot', name: 'Robot', emoji: '🤖', from: '#d0e6ff', to: '#6ea8ff', tagline: 'Calculating profit margins.' },
  penguin: { id: 'penguin', name: 'Penguin', emoji: '🐧', from: '#d9f2ff', to: '#5ec2ff', tagline: 'Cool under pressure.' },
  dinosaur: { id: 'dinosaur', name: 'Dinosaur', emoji: '🦖', from: '#c8f7c5', to: '#3fd17a', tagline: 'Extinct rent prices.' },
  astronaut: { id: 'astronaut', name: 'Astronaut', emoji: '🧑‍🚀', from: '#e6e1ff', to: '#9a85ff', tagline: 'Taking property to orbit.' },
  duck: { id: 'duck', name: 'Duck', emoji: '🦆', from: '#fff3b0', to: '#ffd23f', tagline: 'Quacks the market.' },
  fox: { id: 'fox', name: 'Fox', emoji: '🦊', from: '#ffd0b0', to: '#ff7a3d', tagline: 'Sly dealmaker.' },
  alien: { id: 'alien', name: 'Alien', emoji: '👽', from: '#d5ffd0', to: '#6be07a', tagline: 'Here to buy the planet.' },
};

export const TOKEN_ORDER: TokenId[] = [
  'cat',
  'robot',
  'penguin',
  'dinosaur',
  'astronaut',
  'duck',
  'fox',
  'alien',
];
