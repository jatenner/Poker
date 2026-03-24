// ============================================================
// Texas Hold'em Hand Evaluator
// ============================================================

import type { Card, Rank, Suit } from '@poker/shared';
import { rankValue, cardToString } from './cards';

// Hand ranks: 1 (High Card) through 10 (Royal Flush)
export enum HandRank {
  HIGH_CARD = 1,
  PAIR = 2,
  TWO_PAIR = 3,
  THREE_OF_A_KIND = 4,
  STRAIGHT = 5,
  FLUSH = 6,
  FULL_HOUSE = 7,
  FOUR_OF_A_KIND = 8,
  STRAIGHT_FLUSH = 9,
  ROYAL_FLUSH = 10,
}

const HAND_RANK_NAMES: Record<HandRank, string> = {
  [HandRank.HIGH_CARD]: 'High Card',
  [HandRank.PAIR]: 'Pair',
  [HandRank.TWO_PAIR]: 'Two Pair',
  [HandRank.THREE_OF_A_KIND]: 'Three of a Kind',
  [HandRank.STRAIGHT]: 'Straight',
  [HandRank.FLUSH]: 'Flush',
  [HandRank.FULL_HOUSE]: 'Full House',
  [HandRank.FOUR_OF_A_KIND]: 'Four of a Kind',
  [HandRank.STRAIGHT_FLUSH]: 'Straight Flush',
  [HandRank.ROYAL_FLUSH]: 'Royal Flush',
};

export interface HandEvaluation {
  rank: HandRank;
  /** Numeric value for comparison — higher is better. */
  value: number;
  description: string;
  bestCards: Card[];
}

// ---- Utility helpers ----

function getRankCounts(cards: Card[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const c of cards) {
    const rv = rankValue(c.rank);
    counts.set(rv, (counts.get(rv) ?? 0) + 1);
  }
  return counts;
}

function getSuitCounts(cards: Card[]): Map<Suit, number> {
  const counts = new Map<Suit, number>();
  for (const c of cards) {
    counts.set(c.suit, (counts.get(c.suit) ?? 0) + 1);
  }
  return counts;
}

/**
 * Sort cards descending by rank value.
 */
function sortDesc(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
}

/**
 * Encode an array of values into a single comparable number.
 * Uses base-15 positional encoding so each "digit" can hold 0-14.
 */
function encodeValues(vals: number[]): number {
  let result = 0;
  for (const v of vals) {
    result = result * 15 + v;
  }
  return result;
}

// ---- 5-card evaluator ----

function evaluate5(cards: Card[]): HandEvaluation {
  const sorted = sortDesc(cards);
  const values = sorted.map((c) => rankValue(c.rank));
  const rankCounts = getRankCounts(sorted);
  const suitCounts = getSuitCounts(sorted);

  // Check flush
  const isFlush = suitCounts.size === 1;

  // Check straight
  let isStraight = false;
  let straightHigh = 0;
  // Normal straight check
  if (
    values[0] - values[4] === 4 &&
    new Set(values).size === 5
  ) {
    isStraight = true;
    straightHigh = values[0];
  }
  // Ace-low straight: A-2-3-4-5 → values sorted desc: [14, 5, 4, 3, 2]
  if (
    !isStraight &&
    values[0] === 14 &&
    values[1] === 5 &&
    values[2] === 4 &&
    values[3] === 3 &&
    values[4] === 2
  ) {
    isStraight = true;
    straightHigh = 5; // 5-high straight
  }

  // Group ranks by their count
  const countEntries = [...rankCounts.entries()]; // [rankVal, count]
  // Sort: first by count desc, then by rankVal desc
  countEntries.sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  const counts = countEntries.map((e) => e[1]);
  const rankedValues = countEntries.map((e) => e[0]);

  // Determine hand rank
  let rank: HandRank;
  let tiebreakers: number[];

  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      rank = HandRank.ROYAL_FLUSH;
    } else {
      rank = HandRank.STRAIGHT_FLUSH;
    }
    tiebreakers = [straightHigh];
  } else if (counts[0] === 4) {
    rank = HandRank.FOUR_OF_A_KIND;
    tiebreakers = rankedValues; // [quad rank, kicker]
  } else if (counts[0] === 3 && counts[1] === 2) {
    rank = HandRank.FULL_HOUSE;
    tiebreakers = rankedValues; // [trips rank, pair rank]
  } else if (isFlush) {
    rank = HandRank.FLUSH;
    tiebreakers = values; // all 5 values desc
  } else if (isStraight) {
    rank = HandRank.STRAIGHT;
    tiebreakers = [straightHigh];
  } else if (counts[0] === 3) {
    rank = HandRank.THREE_OF_A_KIND;
    tiebreakers = rankedValues; // [trips, kicker1, kicker2]
  } else if (counts[0] === 2 && counts[1] === 2) {
    rank = HandRank.TWO_PAIR;
    tiebreakers = rankedValues; // [high pair, low pair, kicker]
  } else if (counts[0] === 2) {
    rank = HandRank.PAIR;
    tiebreakers = rankedValues; // [pair, k1, k2, k3]
  } else {
    rank = HandRank.HIGH_CARD;
    tiebreakers = values;
  }

  // Encode: rank category * large multiplier + tiebreaker encoding
  const value = rank * 1_000_000 + encodeValues(tiebreakers);

  // For ace-low straight, reorder best cards to show 5-4-3-2-A
  let bestCards = sorted;
  if (isStraight && straightHigh === 5) {
    // Move ace to the end
    const ace = bestCards[0];
    bestCards = [...bestCards.slice(1), ace];
  }

  return {
    rank,
    value,
    description: HAND_RANK_NAMES[rank],
    bestCards,
  };
}

// ---- Combination generator ----

function* combinations<T>(arr: T[], k: number): Generator<T[]> {
  if (k === 0) {
    yield [];
    return;
  }
  for (let i = 0; i <= arr.length - k; i++) {
    for (const rest of combinations(arr.slice(i + 1), k - 1)) {
      yield [arr[i], ...rest];
    }
  }
}

// ---- Public API ----

/**
 * Evaluate the best 5-card hand from up to 7 cards.
 * For exactly 5 cards, evaluates directly.
 * For 6 or 7 cards, checks all C(n,5) combinations.
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    throw new Error(`Need at least 5 cards to evaluate, got ${cards.length}`);
  }

  if (cards.length === 5) {
    return evaluate5(cards);
  }

  let best: HandEvaluation | null = null;
  for (const combo of combinations(cards, 5)) {
    const result = evaluate5(combo);
    if (best === null || result.value > best.value) {
      best = result;
    }
  }
  return best!;
}

/**
 * Compare two evaluated hands.
 * Returns  1 if a wins, -1 if b wins, 0 if tie.
 */
export function compareHands(
  a: HandEvaluation,
  b: HandEvaluation,
): -1 | 0 | 1 {
  if (a.value > b.value) return 1;
  if (a.value < b.value) return -1;
  return 0;
}
