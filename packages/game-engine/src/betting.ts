// ============================================================
// Betting Manager — tracks bets, validates actions, round logic
// ============================================================

import type { PlayerAction } from '@poker/shared';

export interface LegalAction {
  action: PlayerAction;
  minAmount?: number;
  maxAmount?: number;
}

export interface BetState {
  /** Current bet amount placed this street by each player. */
  bets: Map<string, number>;
  /** The highest bet on the current street. */
  currentBet: number;
  /** The minimum raise size (last raise increment). */
  lastRaiseSize: number;
  /** Set of player IDs that have acted this street. */
  actedThisStreet: Set<string>;
}

export class BettingManager {
  bets: Map<string, number> = new Map();
  currentBet: number = 0;
  lastRaiseSize: number = 0;
  actedThisStreet: Set<string> = new Set();

  constructor(private bigBlind: number) {}

  reset(bigBlind?: number): void {
    if (bigBlind !== undefined) this.bigBlind = bigBlind;
    this.bets.clear();
    this.currentBet = 0;
    this.lastRaiseSize = this.bigBlind;
    this.actedThisStreet.clear();
  }

  resetForNewStreet(): void {
    this.bets.clear();
    this.currentBet = 0;
    this.lastRaiseSize = this.bigBlind;
    this.actedThisStreet.clear();
  }

  getPlayerBet(playerId: string): number {
    return this.bets.get(playerId) ?? 0;
  }

  /**
   * Get the legal actions for a player.
   */
  getLegalActions(
    playerId: string,
    playerStack: number,
  ): LegalAction[] {
    const actions: LegalAction[] = [];
    const playerBet = this.getPlayerBet(playerId);
    const toCall = this.currentBet - playerBet;

    // Always can fold (except if no bet to face — still allowed for simplicity)
    actions.push({ action: 'fold' });

    if (toCall <= 0) {
      // No bet to call — can check
      actions.push({ action: 'check' });

      // Can open bet (min bet = big blind)
      if (playerStack > 0) {
        const minBet = Math.min(this.bigBlind, playerStack);
        if (playerStack <= minBet) {
          // Can only go all-in
          actions.push({ action: 'all-in', minAmount: playerStack, maxAmount: playerStack });
        } else {
          actions.push({
            action: 'bet',
            minAmount: Math.min(this.bigBlind, playerStack),
            maxAmount: playerStack,
          });
        }
      }
    } else {
      // There's a bet to call
      if (playerStack <= toCall) {
        // Can only fold or go all-in (can't fully call)
        actions.push({
          action: 'all-in',
          minAmount: playerStack,
          maxAmount: playerStack,
        });
      } else {
        // Can call
        actions.push({ action: 'call', minAmount: toCall, maxAmount: toCall });

        // Can raise
        const minRaiseTotal = this.currentBet + Math.max(this.lastRaiseSize, this.bigBlind);
        const minRaiseAmount = minRaiseTotal - playerBet;
        const maxRaiseAmount = playerStack;

        if (maxRaiseAmount <= minRaiseAmount) {
          // Can only all-in as a raise
          actions.push({
            action: 'all-in',
            minAmount: playerStack,
            maxAmount: playerStack,
          });
        } else {
          actions.push({
            action: 'raise',
            minAmount: minRaiseAmount,
            maxAmount: maxRaiseAmount,
          });
        }
      }
    }

    return actions;
  }

  /**
   * Process a player's bet action. Returns the actual chip amount taken from the player.
   * @returns the amount deducted from the player's stack.
   */
  processBet(
    playerId: string,
    action: PlayerAction,
    amount: number,
    playerStack: number,
  ): { valid: boolean; chipsUsed: number; error?: string } {
    const playerBet = this.getPlayerBet(playerId);
    const toCall = this.currentBet - playerBet;

    switch (action) {
      case 'fold': {
        this.actedThisStreet.add(playerId);
        return { valid: true, chipsUsed: 0 };
      }

      case 'check': {
        if (toCall > 0) {
          return {
            valid: false,
            chipsUsed: 0,
            error: `Cannot check — must call ${toCall} or fold`,
          };
        }
        this.actedThisStreet.add(playerId);
        return { valid: true, chipsUsed: 0 };
      }

      case 'call': {
        if (toCall <= 0) {
          return { valid: false, chipsUsed: 0, error: 'Nothing to call' };
        }
        const callAmount = Math.min(toCall, playerStack);
        this.bets.set(playerId, playerBet + callAmount);
        this.actedThisStreet.add(playerId);
        return { valid: true, chipsUsed: callAmount };
      }

      case 'bet': {
        if (this.currentBet > 0) {
          return {
            valid: false,
            chipsUsed: 0,
            error: 'Cannot bet — there is already a bet. Use raise.',
          };
        }
        const betAmount = Math.min(amount, playerStack);
        if (betAmount < this.bigBlind && betAmount < playerStack) {
          return {
            valid: false,
            chipsUsed: 0,
            error: `Minimum bet is ${this.bigBlind}`,
          };
        }
        this.bets.set(playerId, playerBet + betAmount);
        this.currentBet = playerBet + betAmount;
        this.lastRaiseSize = betAmount;
        this.actedThisStreet.add(playerId);
        // Reset acted for other players since the bet reopens action
        this.reopenAction(playerId);
        return { valid: true, chipsUsed: betAmount };
      }

      case 'raise': {
        if (toCall <= 0 && this.currentBet === 0) {
          return {
            valid: false,
            chipsUsed: 0,
            error: 'Cannot raise — no bet to raise. Use bet.',
          };
        }
        const raiseAmount = Math.min(amount, playerStack);
        const newTotal = playerBet + raiseAmount;
        const raiseIncrement = newTotal - this.currentBet;
        const minRaise = Math.max(this.lastRaiseSize, this.bigBlind);

        if (
          raiseIncrement < minRaise &&
          raiseAmount < playerStack // allow all-in for less
        ) {
          return {
            valid: false,
            chipsUsed: 0,
            error: `Minimum raise is ${minRaise} more than current bet`,
          };
        }

        this.lastRaiseSize = raiseIncrement;
        this.bets.set(playerId, newTotal);
        this.currentBet = newTotal;
        this.actedThisStreet.add(playerId);
        this.reopenAction(playerId);
        return { valid: true, chipsUsed: raiseAmount };
      }

      case 'all-in': {
        const allInAmount = playerStack;
        const newTotal = playerBet + allInAmount;
        if (newTotal > this.currentBet) {
          const raiseIncrement = newTotal - this.currentBet;
          // All-in raise: only reopens action if it's a "full raise"
          // (at least min raise). Smaller all-ins don't reopen.
          if (raiseIncrement >= Math.max(this.lastRaiseSize, this.bigBlind)) {
            this.lastRaiseSize = raiseIncrement;
            this.reopenAction(playerId);
          }
          this.currentBet = newTotal;
        }
        this.bets.set(playerId, newTotal);
        this.actedThisStreet.add(playerId);
        return { valid: true, chipsUsed: allInAmount };
      }

      default:
        return { valid: false, chipsUsed: 0, error: `Unknown action: ${action}` };
    }
  }

  /**
   * After a bet or raise, clear acted status for other players
   * so they get a chance to act again.
   */
  private reopenAction(raiserId: string): void {
    const raiser = raiserId;
    for (const id of this.actedThisStreet) {
      if (id !== raiser) {
        this.actedThisStreet.delete(id);
      }
    }
  }

  /**
   * Check if the betting round is complete.
   * @param activePlayerIds - IDs of players still in the hand (not folded).
   * @param allInPlayerIds - IDs of players who are all-in.
   */
  isRoundComplete(
    activePlayerIds: string[],
    allInPlayerIds: string[],
  ): boolean {
    // Players who can still act (active and not all-in)
    const canAct = activePlayerIds.filter((id) => !allInPlayerIds.includes(id));

    if (canAct.length === 0) return true;
    if (canAct.length === 1) {
      // Only one non-all-in player — round complete if they've acted
      // or if there's nobody to act against
      const remaining = activePlayerIds.length;
      if (remaining <= 1) return true;
      // If only one can act, they still need to have acted
      return this.actedThisStreet.has(canAct[0]);
    }

    // All acting players must have acted AND their bets must match currentBet
    for (const id of canAct) {
      if (!this.actedThisStreet.has(id)) return false;
      if (this.getPlayerBet(id) !== this.currentBet) return false;
    }
    return true;
  }

  /**
   * Collect all bets into a total. Returns map of playerId -> amount bet.
   * Clears bets after collection.
   */
  collectBets(): Map<string, number> {
    const collected = new Map(this.bets);
    this.bets.clear();
    this.currentBet = 0;
    return collected;
  }

  getTotalPot(): number {
    let total = 0;
    for (const amount of this.bets.values()) {
      total += amount;
    }
    return total;
  }
}
