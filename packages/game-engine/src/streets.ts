// ============================================================
// Street progression logic
// ============================================================

import type { Street } from '@poker/shared';
import { TOTAL_COMMUNITY_CARDS, COMMUNITY_CARDS_PER_STREET } from '@poker/shared';

const STREET_ORDER: Street[] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

/**
 * Advance to the next street.
 */
export function advanceStreet(currentStreet: Street): Street {
  const idx = STREET_ORDER.indexOf(currentStreet);
  if (idx === -1 || idx >= STREET_ORDER.length - 1) {
    return 'showdown';
  }
  return STREET_ORDER[idx + 1];
}

/**
 * Total community cards visible at a given street.
 */
export function getCommunityCardCount(street: Street): number {
  return TOTAL_COMMUNITY_CARDS[street] ?? 0;
}

/**
 * Number of new community cards to deal for a given street.
 */
export function getCardsToDeal(street: Street): number {
  return COMMUNITY_CARDS_PER_STREET[street] ?? 0;
}

/**
 * Whether this street is terminal (no more action).
 */
export function isTerminalStreet(street: Street): boolean {
  return street === 'showdown';
}

/**
 * Whether this is the last betting street.
 */
export function isLastBettingStreet(street: Street): boolean {
  return street === 'river';
}
