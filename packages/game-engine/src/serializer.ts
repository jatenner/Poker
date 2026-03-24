// ============================================================
// Serializer — convert GameState to public/private views
// ============================================================

import type {
  PublicTableState,
  PrivatePlayerState,
  PublicPlayerState,
} from '@poker/shared';
import { GameState } from './state';

/**
 * Create the public table state (no hole cards).
 */
export function toPublicTableState(gameState: GameState): PublicTableState {
  return gameState.getPublicState();
}

/**
 * Create public player state for all players at the table.
 */
export function toPublicPlayerStates(
  gameState: GameState,
  avatarUrls?: Map<string, string>,
): PublicPlayerState[] {
  const players: PublicPlayerState[] = [];

  for (let i = 0; i < gameState.config.maxSeats; i++) {
    const player = gameState.seats.getPlayer(i);
    if (!player) continue;

    players.push({
      userId: player.userId,
      seatNumber: i,
      displayName: player.displayName,
      avatarUrl: avatarUrls?.get(player.userId),
      stack: player.stack,
      isFolded: player.isFolded,
      isAllIn: player.isAllIn,
      isTurn: i === gameState.currentTurnSeat,
      isDealer: i === gameState.dealerSeat,
      isSB: i === gameState.sbSeat,
      isBB: i === gameState.bbSeat,
      currentBet: gameState.betting.getPlayerBet(player.userId),
    });
  }

  return players;
}

/**
 * Create private player state for a specific player.
 * Ensures only the requesting player can see their hole cards.
 */
export function toPrivatePlayerState(
  gameState: GameState,
  userId: string,
): PrivatePlayerState | null {
  return gameState.getPrivateState(userId);
}
