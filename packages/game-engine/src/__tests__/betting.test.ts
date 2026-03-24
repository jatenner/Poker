import { describe, it, expect } from 'vitest';
import { BettingManager } from '../betting';

describe('BettingManager', () => {
  describe('getLegalActions', () => {
    it('should allow check and bet when no current bet', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      const actions = bm.getLegalActions('player1', 1000);
      const actionTypes = actions.map((a) => a.action);
      expect(actionTypes).toContain('fold');
      expect(actionTypes).toContain('check');
      expect(actionTypes).toContain('bet');
      expect(actionTypes).not.toContain('call');
      expect(actionTypes).not.toContain('raise');
    });

    it('should allow fold, call, and raise when there is a bet', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      // Simulate a bet by player2
      bm.processBet('player2', 'bet', 40, 1000);
      const actions = bm.getLegalActions('player1', 1000);
      const actionTypes = actions.map((a) => a.action);
      expect(actionTypes).toContain('fold');
      expect(actionTypes).toContain('call');
      expect(actionTypes).toContain('raise');
      expect(actionTypes).not.toContain('check');
      expect(actionTypes).not.toContain('bet');
    });

    it('should set min raise correctly', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player2', 'bet', 40, 1000);
      const actions = bm.getLegalActions('player1', 1000);
      const raiseAction = actions.find((a) => a.action === 'raise');
      expect(raiseAction).toBeDefined();
      // Min raise: current bet (40) + last raise size (40) = 80 total, minus player's current bet (0) = 80
      expect(raiseAction!.minAmount).toBe(80);
    });

    it('should only allow all-in when stack is less than call amount', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player2', 'bet', 200, 1000);
      // Player1 has only 100 chips — less than the 200 bet
      const actions = bm.getLegalActions('player1', 100);
      const actionTypes = actions.map((a) => a.action);
      expect(actionTypes).toContain('fold');
      expect(actionTypes).toContain('all-in');
      expect(actionTypes).not.toContain('call');
      expect(actionTypes).not.toContain('raise');
    });
  });

  describe('processBet', () => {
    it('should process a fold', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      const result = bm.processBet('player1', 'fold', 0, 1000);
      expect(result.valid).toBe(true);
      expect(result.chipsUsed).toBe(0);
    });

    it('should reject check when there is a bet to call', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player2', 'bet', 40, 1000);
      const result = bm.processBet('player1', 'check', 0, 1000);
      expect(result.valid).toBe(false);
    });

    it('should process a call correctly', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player2', 'bet', 40, 1000);
      const result = bm.processBet('player1', 'call', 0, 1000);
      expect(result.valid).toBe(true);
      expect(result.chipsUsed).toBe(40);
      expect(bm.getPlayerBet('player1')).toBe(40);
    });

    it('should process a raise correctly', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player2', 'bet', 40, 1000);
      // Raise to 100 total (player puts in 100 since their current bet is 0)
      const result = bm.processBet('player1', 'raise', 100, 1000);
      expect(result.valid).toBe(true);
      expect(result.chipsUsed).toBe(100);
      expect(bm.currentBet).toBe(100);
    });

    it('should reject a raise below minimum', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player2', 'bet', 40, 1000);
      // Min raise to 80 (40 bet + 40 raise). Player tries to raise to 50 total.
      const result = bm.processBet('player1', 'raise', 50, 1000);
      expect(result.valid).toBe(false);
    });
  });

  describe('all-in', () => {
    it('should process all-in correctly', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      const result = bm.processBet('player1', 'all-in', 0, 500);
      expect(result.valid).toBe(true);
      expect(result.chipsUsed).toBe(500);
      expect(bm.getPlayerBet('player1')).toBe(500);
      expect(bm.currentBet).toBe(500);
    });

    it('should allow all-in for less than minimum raise', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player2', 'bet', 100, 1000);
      // Player1 only has 120, which is less than min raise (200)
      const result = bm.processBet('player1', 'all-in', 0, 120);
      expect(result.valid).toBe(true);
      expect(result.chipsUsed).toBe(120);
    });
  });

  describe('isRoundComplete', () => {
    it('should be complete when all players have acted and bets match', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player1', 'check', 0, 1000);
      bm.processBet('player2', 'check', 0, 1000);
      expect(bm.isRoundComplete(['player1', 'player2'], [])).toBe(true);
    });

    it('should not be complete when a player has not acted', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player1', 'check', 0, 1000);
      expect(bm.isRoundComplete(['player1', 'player2'], [])).toBe(false);
    });

    it('should be complete when all non-all-in players have acted', () => {
      const bm = new BettingManager(20);
      bm.resetForNewStreet();
      bm.processBet('player1', 'all-in', 0, 500);
      bm.processBet('player2', 'call', 0, 1000);
      expect(
        bm.isRoundComplete(['player1', 'player2'], ['player1']),
      ).toBe(true);
    });
  });
});
