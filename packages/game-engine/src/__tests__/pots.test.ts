import { describe, it, expect } from 'vitest';
import { PotManager } from '../pots';

describe('PotManager', () => {
  describe('single pot (no all-in)', () => {
    it('should create a single pot when all players bet equally', () => {
      const pm = new PotManager();
      pm.addToPots(
        [
          { playerId: 'p1', amount: 100 },
          { playerId: 'p2', amount: 100 },
          { playerId: 'p3', amount: 100 },
        ],
        [],
      );

      const pots = pm.getPots();
      expect(pots.length).toBe(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayerIds).toEqual(
        expect.arrayContaining(['p1', 'p2', 'p3']),
      );
    });

    it('should accumulate pots across streets', () => {
      const pm = new PotManager();
      // Preflop
      pm.addToPots(
        [
          { playerId: 'p1', amount: 20 },
          { playerId: 'p2', amount: 20 },
        ],
        [],
      );
      // Flop
      pm.addToPots(
        [
          { playerId: 'p1', amount: 50 },
          { playerId: 'p2', amount: 50 },
        ],
        [],
      );

      expect(pm.getTotal()).toBe(140);
    });
  });

  describe('side pot with one all-in', () => {
    it('should create main pot and side pot', () => {
      const pm = new PotManager();
      // p1 goes all-in for 50, p2 and p3 call/bet 100
      pm.addToPots(
        [
          { playerId: 'p1', amount: 50 },
          { playerId: 'p2', amount: 100 },
          { playerId: 'p3', amount: 100 },
        ],
        ['p1'],
      );

      const pots = pm.getPots();
      expect(pots.length).toBe(2);

      // Main pot: 50 * 3 = 150, eligible: p1, p2, p3
      const mainPot = pots[0];
      expect(mainPot.amount).toBe(150);
      expect(mainPot.eligiblePlayerIds).toEqual(
        expect.arrayContaining(['p1', 'p2', 'p3']),
      );

      // Side pot: 50 * 2 = 100, eligible: p2, p3
      const sidePot = pots[1];
      expect(sidePot.amount).toBe(100);
      expect(sidePot.eligiblePlayerIds).toEqual(
        expect.arrayContaining(['p2', 'p3']),
      );
      expect(sidePot.eligiblePlayerIds).not.toContain('p1');
    });

    it('should calculate total correctly with side pots', () => {
      const pm = new PotManager();
      pm.addToPots(
        [
          { playerId: 'p1', amount: 50 },
          { playerId: 'p2', amount: 100 },
          { playerId: 'p3', amount: 100 },
        ],
        ['p1'],
      );

      expect(pm.getTotal()).toBe(250);
    });
  });

  describe('multiple side pots', () => {
    it('should handle three different all-in amounts', () => {
      const pm = new PotManager();
      // p1 all-in 30, p2 all-in 60, p3 bets 100
      pm.addToPots(
        [
          { playerId: 'p1', amount: 30 },
          { playerId: 'p2', amount: 60 },
          { playerId: 'p3', amount: 100 },
        ],
        ['p1', 'p2'],
      );

      const pots = pm.getPots();
      expect(pots.length).toBe(3);

      // Main pot: 30 * 3 = 90, eligible: p1, p2, p3
      expect(pots[0].amount).toBe(90);
      expect(pots[0].eligiblePlayerIds).toEqual(
        expect.arrayContaining(['p1', 'p2', 'p3']),
      );

      // Side pot 1: 30 * 2 = 60, eligible: p2, p3
      expect(pots[1].amount).toBe(60);
      expect(pots[1].eligiblePlayerIds).toEqual(
        expect.arrayContaining(['p2', 'p3']),
      );
      expect(pots[1].eligiblePlayerIds).not.toContain('p1');

      // Side pot 2: 40 * 1 = 40, eligible: p3 only
      expect(pots[2].amount).toBe(40);
      expect(pots[2].eligiblePlayerIds).toEqual(['p3']);
    });

    it('should handle folded player dead money', () => {
      const pm = new PotManager();
      pm.addToPots(
        [
          { playerId: 'p1', amount: 100 },
          { playerId: 'p2', amount: 100 },
        ],
        [],
        [{ playerId: 'p3', amount: 50 }], // p3 folded after putting in 50
      );

      const pots = pm.getPots();
      // Main pot should include folded player's dead money
      const totalInPots = pots.reduce((s, p) => s + p.amount, 0);
      expect(totalInPots).toBe(250);

      // p3 should not be eligible
      for (const pot of pots) {
        expect(pot.eligiblePlayerIds).not.toContain('p3');
      }
    });
  });

  describe('calculatePots', () => {
    it('should return empty array for empty contributions', () => {
      const pm = new PotManager();
      const pots = pm.calculatePots([]);
      expect(pots).toEqual([]);
    });

    it('should handle equal contributions', () => {
      const pm = new PotManager();
      const pots = pm.calculatePots([
        { playerId: 'p1', amount: 50 },
        { playerId: 'p2', amount: 50 },
      ]);
      expect(pots.length).toBe(1);
      expect(pots[0].amount).toBe(100);
    });
  });
});
