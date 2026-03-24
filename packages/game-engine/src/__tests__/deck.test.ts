import { describe, it, expect } from 'vitest';
import { Deck } from '../deck';
import { cardToString } from '../cards';

describe('Deck', () => {
  it('should create a deck with 52 cards', () => {
    const deck = new Deck();
    expect(deck.remaining()).toBe(52);
  });

  it('should have no duplicate cards', () => {
    const deck = new Deck();
    const cards = deck.deal(52);
    const strings = cards.map(cardToString);
    const unique = new Set(strings);
    expect(unique.size).toBe(52);
  });

  it('should contain all 4 suits and 13 ranks', () => {
    const deck = new Deck();
    const cards = deck.deal(52);
    const suits = new Set(cards.map((c) => c.suit));
    const ranks = new Set(cards.map((c) => c.rank));
    expect(suits.size).toBe(4);
    expect(ranks.size).toBe(13);
  });

  it('should shuffle to a different order', () => {
    // Create two decks and compare — statistically almost impossible to match
    const deck1 = new Deck();
    const deck2 = new Deck();
    const cards1 = deck1.deal(52).map(cardToString);
    const cards2 = deck2.deal(52).map(cardToString);
    // At least some cards should be in different positions
    let differences = 0;
    for (let i = 0; i < 52; i++) {
      if (cards1[i] !== cards2[i]) differences++;
    }
    expect(differences).toBeGreaterThan(0);
  });

  it('should deal the correct number of cards', () => {
    const deck = new Deck();
    const hand = deck.deal(5);
    expect(hand.length).toBe(5);
    expect(deck.remaining()).toBe(47);
  });

  it('should remove dealt cards from the deck', () => {
    const deck = new Deck();
    const first5 = deck.deal(5).map(cardToString);
    const remaining = deck.deal(47).map(cardToString);
    // No overlap
    for (const card of first5) {
      expect(remaining).not.toContain(card);
    }
  });

  it('should throw when dealing more cards than remaining', () => {
    const deck = new Deck();
    deck.deal(50);
    expect(() => deck.deal(5)).toThrow();
  });

  it('should reset to a full shuffled deck', () => {
    const deck = new Deck();
    deck.deal(30);
    expect(deck.remaining()).toBe(22);
    deck.reset();
    expect(deck.remaining()).toBe(52);
  });
});
