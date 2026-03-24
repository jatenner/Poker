// ============================================================
// Pot Manager — handles main pot and side pot calculations
// ============================================================

import type { SidePot } from '@poker/shared';

export interface PlayerContribution {
  playerId: string;
  amount: number;
}

export class PotManager {
  /** Finalized pots from previous streets. */
  private pots: SidePot[] = [];
  /** Running total of all collected chips. */
  private totalCollected: number = 0;

  getPots(): SidePot[] {
    return [...this.pots];
  }

  getTotal(): number {
    return this.totalCollected;
  }

  reset(): void {
    this.pots = [];
    this.totalCollected = 0;
  }

  /**
   * Add street bets into pot(s). Call this at the end of each street.
   * @param contributions - each active (non-folded) player's total bet for the street.
   * @param allInPlayerIds - players who went all-in (may have bet less than others).
   * @param foldedContributions - bets from players who folded this street (dead money).
   */
  addToPots(
    contributions: PlayerContribution[],
    allInPlayerIds: string[],
    foldedContributions: PlayerContribution[] = [],
  ): void {
    // Combine all contributions
    const all = [...contributions, ...foldedContributions];
    const total = all.reduce((s, c) => s + c.amount, 0);
    this.totalCollected += total;

    // Calculate side pots using the standard algorithm
    const activePlayers = contributions
      .filter((c) => c.amount > 0)
      .sort((a, b) => a.amount - b.amount);

    if (activePlayers.length === 0) {
      // Only folded money — add to existing pot or create one
      if (total > 0) {
        if (this.pots.length > 0) {
          this.pots[0].amount += total;
        }
      }
      return;
    }

    // Calculate pots using the "peel off layers" method
    const newPots = this.calculatePots(contributions);

    // Add dead money (from folded players) to the main pot
    const deadMoney = foldedContributions.reduce((s, c) => s + c.amount, 0);
    if (deadMoney > 0 && newPots.length > 0) {
      newPots[0].amount += deadMoney;
    }

    // Merge new pots into existing pots
    if (this.pots.length === 0) {
      this.pots = newPots;
    } else {
      // Merge: existing pots' eligible players intersect with new pots
      // Simple approach: combine everything
      // The first new pot merges into the last existing pot if eligible players match
      // For simplicity, add new pot amounts to existing structure
      for (const newPot of newPots) {
        // Find matching pot or create new
        const match = this.pots.find(
          (p) =>
            p.eligiblePlayerIds.length === newPot.eligiblePlayerIds.length &&
            p.eligiblePlayerIds.every((id) =>
              newPot.eligiblePlayerIds.includes(id),
            ),
        );
        if (match) {
          match.amount += newPot.amount;
        } else {
          this.pots.push(newPot);
        }
      }
    }
  }

  /**
   * Calculate pots from a set of contributions.
   * Uses the "layer peeling" algorithm for side pots.
   */
  calculatePots(contributions: PlayerContribution[]): SidePot[] {
    const sorted = contributions
      .filter((c) => c.amount > 0)
      .sort((a, b) => a.amount - b.amount);

    if (sorted.length === 0) return [];

    const pots: SidePot[] = [];
    let previousLevel = 0;

    // Get unique bet levels
    const levels = [...new Set(sorted.map((c) => c.amount))].sort(
      (a, b) => a - b,
    );

    for (const level of levels) {
      const layerSize = level - previousLevel;
      if (layerSize <= 0) continue;

      // All players who contributed at least this level
      const eligible = sorted
        .filter((c) => c.amount >= level)
        .map((c) => c.playerId);

      // Everyone who contributed at least previousLevel also pays into this layer
      const paying = sorted.filter((c) => c.amount > previousLevel);
      const potAmount = layerSize * paying.length;

      pots.push({
        amount: potAmount,
        eligiblePlayerIds: eligible,
      });

      previousLevel = level;
    }

    return pots;
  }

  /**
   * Remove a player from all pot eligibility (when they fold).
   */
  removePlayerFromPots(playerId: string): void {
    for (const pot of this.pots) {
      pot.eligiblePlayerIds = pot.eligiblePlayerIds.filter(
        (id) => id !== playerId,
      );
    }
  }
}
