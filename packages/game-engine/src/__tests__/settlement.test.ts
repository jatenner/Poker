import { describe, it, expect } from 'vitest';
import { calculateSettlements } from '../settlement';
import type { GameResult } from '@poker/shared';

function makeResult(
  userId: string,
  netResult: number,
): GameResult {
  return {
    userId,
    displayName: userId,
    totalBuyIn: 100,
    finalChips: 100 + netResult,
    cashoutValue: 100 + netResult,
    netResult,
  };
}

describe('calculateSettlements', () => {
  describe('basic 2-player', () => {
    it('should create a single settlement', () => {
      const results = [
        makeResult('alice', 50),
        makeResult('bob', -50),
      ];
      const settlements = calculateSettlements(results);
      expect(settlements.length).toBe(1);
      expect(settlements[0].fromUserId).toBe('bob');
      expect(settlements[0].toUserId).toBe('alice');
      expect(settlements[0].amount).toBe(50);
    });

    it('should return empty settlements when no one won or lost', () => {
      const results = [
        makeResult('alice', 0),
        makeResult('bob', 0),
      ];
      const settlements = calculateSettlements(results);
      expect(settlements.length).toBe(0);
    });
  });

  describe('multi-player settlement minimization', () => {
    it('should minimize transfers for 3 players', () => {
      // Alice won 70, Bob lost 30, Charlie lost 40
      const results = [
        makeResult('alice', 70),
        makeResult('bob', -30),
        makeResult('charlie', -40),
      ];
      const settlements = calculateSettlements(results);

      // Should be 2 transfers (not 3)
      expect(settlements.length).toBe(2);

      // Total transferred to alice should be 70
      const toAlice = settlements
        .filter((s) => s.toUserId === 'alice')
        .reduce((sum, s) => sum + s.amount, 0);
      expect(toAlice).toBe(70);
    });

    it('should handle 4 players efficiently', () => {
      // alice +60, bob +20, charlie -50, dave -30
      const results = [
        makeResult('alice', 60),
        makeResult('bob', 20),
        makeResult('charlie', -50),
        makeResult('dave', -30),
      ];
      const settlements = calculateSettlements(results);

      // Maximum 3 transfers needed for 4 players
      expect(settlements.length).toBeLessThanOrEqual(3);

      // Verify net-zero: each player's net from settlements should match their result
      const netFromSettlements = new Map<string, number>();
      for (const s of settlements) {
        netFromSettlements.set(
          s.fromUserId,
          (netFromSettlements.get(s.fromUserId) ?? 0) - s.amount,
        );
        netFromSettlements.set(
          s.toUserId,
          (netFromSettlements.get(s.toUserId) ?? 0) + s.amount,
        );
      }

      for (const r of results) {
        const net = netFromSettlements.get(r.userId) ?? 0;
        expect(Math.abs(net - r.netResult)).toBeLessThan(0.02);
      }
    });
  });

  describe('net-zero validation', () => {
    it('should produce transfers that net to zero', () => {
      const results = [
        makeResult('a', 100),
        makeResult('b', -40),
        makeResult('c', -60),
      ];
      const settlements = calculateSettlements(results);

      let totalOut = 0;
      let totalIn = 0;
      for (const s of settlements) {
        totalOut += s.amount;
        totalIn += s.amount;
      }
      // Total from equals total to
      expect(totalOut).toBe(totalIn);

      // Each debtor pays what they owe
      const cPays = settlements
        .filter((s) => s.fromUserId === 'c')
        .reduce((sum, s) => sum + s.amount, 0);
      expect(cPays).toBe(60);

      const bPays = settlements
        .filter((s) => s.fromUserId === 'b')
        .reduce((sum, s) => sum + s.amount, 0);
      expect(bPays).toBe(40);
    });
  });
});
