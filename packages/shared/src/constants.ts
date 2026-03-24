// ============================================================
// Shared Constants for Poker App
// ============================================================

import type { Suit, Rank } from './types';

export const MAX_SEATS = 8;

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export const RANKS: Rank[] = [
  '2', '3', '4', '5', '6', '7', '8', '9', '10',
  'J', 'Q', 'K', 'A',
];

/**
 * Standard poker hand rankings from lowest (index 0) to highest (index 9).
 */
export const HAND_RANKINGS = [
  'High Card',
  'One Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
] as const;

export type HandRanking = (typeof HAND_RANKINGS)[number];

/** Number of community cards dealt per street. */
export const COMMUNITY_CARDS_PER_STREET: Record<string, number> = {
  preflop: 0,
  flop: 3,
  turn: 1,
  river: 1,
  showdown: 0,
};

/** Total community cards visible at each street. */
export const TOTAL_COMMUNITY_CARDS: Record<string, number> = {
  preflop: 0,
  flop: 3,
  turn: 4,
  river: 5,
  showdown: 5,
};

/** Rank value map used for comparison (Ace high = 14). */
export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};
