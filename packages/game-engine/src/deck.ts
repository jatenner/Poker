// ============================================================
// Deck - standard 52-card deck with Fisher-Yates shuffle
// ============================================================

import type { Card } from '@poker/shared';
import { SUITS, RANKS } from '@poker/shared';
import { createCard } from './cards';

export class Deck {
  private cards: Card[] = [];

  constructor() {
    this.reset();
  }

  /**
   * Recreate and shuffle a fresh 52-card deck.
   */
  reset(): void {
    this.cards = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push(createCard(suit, rank));
      }
    }
    this.shuffle();
  }

  /**
   * Fisher-Yates (Knuth) shuffle in-place.
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Deal n cards from the top of the deck.
   * @throws if not enough cards remain.
   */
  deal(n: number): Card[] {
    if (n > this.cards.length) {
      throw new Error(
        `Cannot deal ${n} cards, only ${this.cards.length} remaining`,
      );
    }
    return this.cards.splice(0, n);
  }

  /**
   * Number of cards remaining in the deck.
   */
  remaining(): number {
    return this.cards.length;
  }
}
