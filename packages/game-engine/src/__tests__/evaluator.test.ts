import { describe, it, expect } from 'vitest';
import { evaluateHand, compareHands, HandRank } from '../evaluator';
import { createCard } from '../cards';
import type { Card, Suit, Rank } from '@poker/shared';

// Helper to make cards quickly: "As" = Ace of spades, "Td" = 10 of diamonds
function c(rank: string, suit: string): Card {
  const suitMap: Record<string, Suit> = {
    h: 'hearts',
    d: 'diamonds',
    c: 'clubs',
    s: 'spades',
  };
  const rankMap: Record<string, Rank> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
    '7': '7', '8': '8', '9': '9', 'T': '10',
    'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
  };
  return createCard(suitMap[suit], rankMap[rank]);
}

describe('Hand Evaluator', () => {
  describe('Hand Rankings', () => {
    it('should detect high card', () => {
      const cards = [c('2', 'h'), c('5', 'd'), c('7', 'c'), c('9', 's'), c('J', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.HIGH_CARD);
      expect(result.description).toBe('High Card');
    });

    it('should detect a pair', () => {
      const cards = [c('5', 'h'), c('5', 'd'), c('7', 'c'), c('9', 's'), c('J', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.PAIR);
    });

    it('should detect two pair', () => {
      const cards = [c('5', 'h'), c('5', 'd'), c('9', 'c'), c('9', 's'), c('J', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.TWO_PAIR);
    });

    it('should detect three of a kind', () => {
      const cards = [c('7', 'h'), c('7', 'd'), c('7', 'c'), c('9', 's'), c('J', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.THREE_OF_A_KIND);
    });

    it('should detect a straight', () => {
      const cards = [c('5', 'h'), c('6', 'd'), c('7', 'c'), c('8', 's'), c('9', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.STRAIGHT);
    });

    it('should detect a flush', () => {
      const cards = [c('2', 'h'), c('5', 'h'), c('7', 'h'), c('9', 'h'), c('J', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.FLUSH);
    });

    it('should detect a full house', () => {
      const cards = [c('7', 'h'), c('7', 'd'), c('7', 'c'), c('J', 's'), c('J', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.FULL_HOUSE);
    });

    it('should detect four of a kind', () => {
      const cards = [c('7', 'h'), c('7', 'd'), c('7', 'c'), c('7', 's'), c('J', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.FOUR_OF_A_KIND);
    });

    it('should detect a straight flush', () => {
      const cards = [c('5', 'h'), c('6', 'h'), c('7', 'h'), c('8', 'h'), c('9', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH);
    });

    it('should detect a royal flush', () => {
      const cards = [c('T', 's'), c('J', 's'), c('Q', 's'), c('K', 's'), c('A', 's')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.ROYAL_FLUSH);
    });
  });

  describe('Ace-low straight', () => {
    it('should detect A-2-3-4-5 as a straight', () => {
      const cards = [c('A', 'h'), c('2', 'd'), c('3', 'c'), c('4', 's'), c('5', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.STRAIGHT);
    });

    it('should rank A-5 straight lower than 6-high straight', () => {
      const aceLow = [c('A', 'h'), c('2', 'd'), c('3', 'c'), c('4', 's'), c('5', 'h')];
      const sixHigh = [c('2', 'h'), c('3', 'd'), c('4', 'c'), c('5', 's'), c('6', 'h')];
      const aResult = evaluateHand(aceLow);
      const bResult = evaluateHand(sixHigh);
      expect(compareHands(bResult, aResult)).toBe(1);
    });

    it('should detect ace-low straight flush', () => {
      const cards = [c('A', 'h'), c('2', 'h'), c('3', 'h'), c('4', 'h'), c('5', 'h')];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.STRAIGHT_FLUSH);
    });
  });

  describe('Kicker comparison', () => {
    it('should compare high cards by kicker', () => {
      const handA = [c('A', 'h'), c('K', 'd'), c('Q', 'c'), c('J', 's'), c('9', 'h')];
      const handB = [c('A', 'h'), c('K', 'd'), c('Q', 'c'), c('J', 's'), c('8', 'h')];
      const a = evaluateHand(handA);
      const b = evaluateHand(handB);
      expect(compareHands(a, b)).toBe(1);
    });

    it('should compare pairs with different kickers', () => {
      const handA = [c('K', 'h'), c('K', 'd'), c('A', 'c'), c('J', 's'), c('9', 'h')];
      const handB = [c('K', 'c'), c('K', 's'), c('A', 'h'), c('J', 'd'), c('8', 'h')];
      const a = evaluateHand(handA);
      const b = evaluateHand(handB);
      expect(compareHands(a, b)).toBe(1);
    });

    it('should detect tied hands', () => {
      const handA = [c('A', 'h'), c('K', 'd'), c('Q', 'c'), c('J', 's'), c('9', 'h')];
      const handB = [c('A', 's'), c('K', 'c'), c('Q', 'd'), c('J', 'h'), c('9', 's')];
      const a = evaluateHand(handA);
      const b = evaluateHand(handB);
      expect(compareHands(a, b)).toBe(0);
    });

    it('should compare two pair by high pair first', () => {
      const handA = [c('A', 'h'), c('A', 'd'), c('3', 'c'), c('3', 's'), c('9', 'h')];
      const handB = [c('K', 'c'), c('K', 's'), c('Q', 'h'), c('Q', 'd'), c('A', 'h')];
      const a = evaluateHand(handA);
      const b = evaluateHand(handB);
      expect(compareHands(a, b)).toBe(1); // Aces up beats Kings up
    });
  });

  describe('Best 5 from 7', () => {
    it('should find the best hand from 7 cards', () => {
      // Hole: A♠ K♠, Community: Q♠ J♠ T♠ 2♥ 3♦
      // Best hand: Royal Flush (A-K-Q-J-T all spades)
      const cards = [
        c('A', 's'), c('K', 's'),
        c('Q', 's'), c('J', 's'), c('T', 's'),
        c('2', 'h'), c('3', 'd'),
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.ROYAL_FLUSH);
    });

    it('should pick the best hand when multiple options exist', () => {
      // Hole: 7♥ 7♦, Community: 7♣ 7♠ A♥ K♦ Q♣
      // Best hand: Four of a Kind (7s) with A kicker
      const cards = [
        c('7', 'h'), c('7', 'd'),
        c('7', 'c'), c('7', 's'), c('A', 'h'),
        c('K', 'd'), c('Q', 'c'),
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.FOUR_OF_A_KIND);
    });

    it('should find a flush among 7 cards', () => {
      // 5 hearts + 2 non-hearts
      const cards = [
        c('2', 'h'), c('5', 'h'), c('8', 'h'), c('J', 'h'), c('A', 'h'),
        c('K', 'd'), c('Q', 'c'),
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.FLUSH);
    });

    it('should find the best straight from 7 cards', () => {
      // Cards contain both a pair and a straight — straight wins
      const cards = [
        c('5', 'h'), c('6', 'd'), c('7', 'c'), c('8', 's'), c('9', 'h'),
        c('9', 'd'), c('2', 'c'),
      ];
      const result = evaluateHand(cards);
      expect(result.rank).toBe(HandRank.STRAIGHT);
    });
  });

  describe('compareHands', () => {
    it('should rank flush higher than straight', () => {
      const flush = evaluateHand([
        c('2', 'h'), c('5', 'h'), c('7', 'h'), c('9', 'h'), c('J', 'h'),
      ]);
      const straight = evaluateHand([
        c('5', 'h'), c('6', 'd'), c('7', 'c'), c('8', 's'), c('9', 'h'),
      ]);
      expect(compareHands(flush, straight)).toBe(1);
    });

    it('should rank full house higher than flush', () => {
      const fullHouse = evaluateHand([
        c('7', 'h'), c('7', 'd'), c('7', 'c'), c('J', 's'), c('J', 'h'),
      ]);
      const flush = evaluateHand([
        c('A', 'h'), c('K', 'h'), c('Q', 'h'), c('J', 'h'), c('9', 'h'),
      ]);
      expect(compareHands(fullHouse, flush)).toBe(1);
    });

    it('should rank higher pair above lower pair', () => {
      const aces = evaluateHand([
        c('A', 'h'), c('A', 'd'), c('7', 'c'), c('5', 's'), c('3', 'h'),
      ]);
      const kings = evaluateHand([
        c('K', 'h'), c('K', 'd'), c('A', 'c'), c('Q', 's'), c('J', 'h'),
      ]);
      expect(compareHands(aces, kings)).toBe(1);
    });
  });
});
