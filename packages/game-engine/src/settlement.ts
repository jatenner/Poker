// ============================================================
// Settlement — debt simplification for end-of-game payouts
// ============================================================

import type { GameResult, Settlement } from '@poker/shared';

interface PlayerBalance {
  userId: string;
  displayName: string;
  amount: number; // positive = owed money, negative = owes money
}

/**
 * Calculate settlements that minimize the number of transfers.
 * Uses a greedy algorithm: repeatedly pair the largest debtor with the largest creditor.
 *
 * @param results - Array of game results with netResult (positive = won, negative = lost).
 * @returns Array of settlements (transfers from losers to winners).
 */
export function calculateSettlements(results: GameResult[]): Settlement[] {
  // Build balance list, filtering out zero balances
  const balances: PlayerBalance[] = results
    .filter((r) => Math.abs(r.netResult) > 0.001)
    .map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      amount: r.netResult,
    }));

  const settlements: Settlement[] = [];

  // Greedy: pair largest creditor with largest debtor
  while (true) {
    // Separate into creditors (positive) and debtors (negative)
    const creditors = balances
      .filter((b) => b.amount > 0.001)
      .sort((a, b) => b.amount - a.amount);
    const debtors = balances
      .filter((b) => b.amount < -0.001)
      .sort((a, b) => a.amount - b.amount); // most negative first

    if (creditors.length === 0 || debtors.length === 0) break;

    const creditor = creditors[0];
    const debtor = debtors[0];

    const transferAmount = Math.min(creditor.amount, Math.abs(debtor.amount));

    // Round to avoid floating-point artifacts
    const rounded = Math.round(transferAmount * 100) / 100;

    if (rounded <= 0) break;

    settlements.push({
      fromUserId: debtor.userId,
      fromDisplayName: debtor.displayName,
      toUserId: creditor.userId,
      toDisplayName: creditor.displayName,
      amount: rounded,
    });

    // Adjust balances
    creditor.amount -= rounded;
    debtor.amount += rounded;
  }

  return settlements;
}
