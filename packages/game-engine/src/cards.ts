// ============================================================
// Card utilities
// ============================================================

import type { Card, Suit, Rank } from '@poker/shared';
import { RANK_VALUES } from '@poker/shared';

/**
 * Create a Card value.
 */
export function createCard(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

/**
 * Human-readable card string, e.g. "A♠".
 */
export function cardToString(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

/**
 * Numeric value of a rank (Ace = 14).
 */
export function rankValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

/**
 * Compare two cards for sorting (ascending by rank, then suit alphabetically).
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function compareCards(a: Card, b: Card): number {
  const rv = rankValue(a.rank) - rankValue(b.rank);
  if (rv !== 0) return rv;
  return a.suit.localeCompare(b.suit);
}
