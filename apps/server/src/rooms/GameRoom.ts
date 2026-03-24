// ============================================================
// GameRoom – Manages a single game room's state and players
// ============================================================

import type { Server, Socket } from 'socket.io';
import type {
  GameConfig,
  GameStatus,
  GameResult,
  HandResult,
  ActionRequest,
  PublicTableState,
  Settlement,
} from '@poker/shared';
import { ServerEvents } from '@poker/shared';
import { GameState, toPublicTableState, toPublicPlayerStates, toPrivatePlayerState, calculateSettlements } from '@poker/game-engine';
import {
  saveSeatTaken,
  saveSeatLeft,
  saveBuyIn,
  saveHandRecord,
  saveGameResults,
  updateGameStatus,
  getDisplayName,
  fetchSeatedPlayers,
  type HandRecordData,
  type SeatedPlayer,
} from '../services/gameService.js';

export class GameRoom {
  public readonly gameId: string;
  public readonly config: GameConfig;
  public readonly creatorUserId: string;
  public gameState: GameState;
  public status: GameStatus = 'lobby';

  /** Map of userId -> Socket for connected players */
  private sockets: Map<string, Socket> = new Map();
  /** Track total buy-ins per player for end-of-game settlement */
  private totalBuyIns: Map<string, number> = new Map();
  /** Track hand actions for persistence */
  private currentHandActions: HandRecordData['actions'] = [];
  /** Track pre-hand stacks for hand records */
  private preHandStacks: Map<string, number> = new Map();
  /** Auto-start next hand timer */
  private nextHandTimer: ReturnType<typeof setTimeout> | null = null;
  /** Avatar URLs per userId */
  private avatarUrls: Map<string, string> = new Map();
  /** Results for players who departed mid-game */
  private departedResults: Map<string, GameResult> = new Map();

  private io: Server;
  private roomName: string;

  constructor(
    io: Server,
    gameId: string,
    config: GameConfig,
    creatorUserId: string,
  ) {
    this.io = io;
    this.gameId = gameId;
    this.config = config;
    this.creatorUserId = creatorUserId;
    this.roomName = `game:${gameId}`;
    this.gameState = new GameState(gameId, config);
  }

  /** Whether we've hydrated seats from DB yet */
  private hydrated = false;

  /**
   * Load current seated players from the database into the GameState.
   * Called once when the room is first created.
   */
  async hydrateFromDB(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;

    const seatedPlayers = await fetchSeatedPlayers(
      this.gameId,
      this.config.buyInConfig.chipValue,
    );

    console.log(`[GameRoom ${this.gameId}] Hydrating ${seatedPlayers.length} players:`,
      JSON.stringify(seatedPlayers.map(p => ({ seat: p.seatNumber, name: p.displayName, chips: p.chips, cashBuyIn: p.cashBuyIn }))));

    for (const sp of seatedPlayers) {
      try {
        this.gameState.seats.seatPlayer(
          sp.seatNumber,
          sp.userId,
          sp.chips,
          sp.displayName,
        );
        this.totalBuyIns.set(sp.userId, sp.cashBuyIn);
        if (sp.avatarUrl) {
          this.avatarUrls.set(sp.userId, sp.avatarUrl);
        }
        console.log(
          `[GameRoom ${this.gameId}] Hydrated seat ${sp.seatNumber}: ${sp.displayName} (${sp.chips} chips)`,
        );
      } catch (err) {
        console.error(
          `[GameRoom ${this.gameId}] Failed to hydrate seat ${sp.seatNumber}:`,
          err,
        );
      }
    }
  }

  // ---- Connection Management ----

  join(socket: Socket, userId: string): void {
    this.sockets.set(userId, socket);
    socket.join(this.roomName);
    console.log(`[GameRoom ${this.gameId}] ${userId} joined room`);

    // Send current table state to the joining player
    const tableState = toPublicTableState(this.gameState);
    const players = toPublicPlayerStates(this.gameState, this.avatarUrls);
    socket.emit(ServerEvents.GAME_STATE, { tableState, players });

    // If they have hole cards (reconnecting mid-hand), send them
    this.sendPrivateCards(userId);
  }

  leave(socket: Socket, userId: string): void {
    this.sockets.delete(userId);
    socket.leave(this.roomName);
    console.log(`[GameRoom ${this.gameId}] ${userId} left room`);
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.sockets.keys());
  }

  hasConnectedUsers(): boolean {
    return this.sockets.size > 0;
  }

  // ---- Seat Management ----

  async takeSeat(
    userId: string,
    seatNumber: number,
    buyInAmount: number,
  ): Promise<void> {
    // Validate seat number
    if (seatNumber < 0 || seatNumber >= this.config.maxSeats) {
      throw new Error(`Invalid seat number: ${seatNumber}`);
    }

    // Validate seat is open
    const existingPlayer = this.gameState.seats.getPlayer(seatNumber);
    if (existingPlayer) {
      throw new Error(`Seat ${seatNumber} is already occupied`);
    }

    // Validate player isn't already seated
    const existingSeat = this.gameState.seats.getSeatByUserId(userId);
    if (existingSeat !== -1) {
      throw new Error('You are already seated at this table');
    }

    // Validate buy-in amount
    const { minBuyIn, maxBuyIn, chipValue } = this.config.buyInConfig;
    if (buyInAmount < minBuyIn || buyInAmount > maxBuyIn) {
      throw new Error(
        `Buy-in must be between ${minBuyIn} and ${maxBuyIn}`,
      );
    }

    // Calculate chips from cash buy-in
    const chips = Math.floor(buyInAmount / chipValue);

    // Get display name
    const displayName = await getDisplayName(userId);

    // Seat the player in game state
    this.gameState.seats.seatPlayer(seatNumber, userId, chips, displayName);

    // Track buy-in
    this.totalBuyIns.set(
      userId,
      (this.totalBuyIns.get(userId) ?? 0) + buyInAmount,
    );

    // Persist to DB (fire and forget, don't block gameplay)
    saveSeatTaken(this.gameId, seatNumber, userId).catch((err) =>
      console.error('[GameRoom] Failed to persist seat taken:', err),
    );
    saveBuyIn(this.gameId, userId, buyInAmount, chips).catch((err) =>
      console.error('[GameRoom] Failed to persist buy-in:', err),
    );

    console.log(
      `[GameRoom ${this.gameId}] ${userId} took seat ${seatNumber} (${chips} chips)`,
    );

    // Broadcast updated state
    this.broadcastTableState();
    this.io.to(this.roomName).emit(ServerEvents.SEAT_UPDATED, {
      seatNumber,
      userId,
      displayName,
      status: 'occupied',
      stack: chips,
    });
  }

  async leaveSeat(userId: string): Promise<void> {
    const seatNumber = this.gameState.seats.getSeatByUserId(userId);
    if (seatNumber === -1) {
      throw new Error('You are not seated at this table');
    }

    // Don't allow leaving while hand is in progress
    if (this.gameState.handInProgress) {
      throw new Error('Cannot leave seat during an active hand');
    }

    // If the game is active, record a departed result before removing
    if (this.status === 'active') {
      const player = this.gameState.seats.getPlayer(seatNumber);
      if (player) {
        const chipValue = this.config.buyInConfig.chipValue;
        const totalBuyIn = this.totalBuyIns.get(userId) ?? 0;
        const cashoutValue = player.stack * chipValue;
        const netResult = cashoutValue - totalBuyIn;

        this.departedResults.set(userId, {
          userId,
          displayName: player.displayName,
          totalBuyIn,
          finalChips: player.stack,
          cashoutValue,
          netResult,
        });

        console.log(
          `[GameRoom ${this.gameId}] Recorded departed result for ${userId}: net=${netResult}`,
        );
      }
    }

    // Remove from game state
    this.gameState.seats.unseatPlayer(seatNumber);

    // Persist to DB
    saveSeatLeft(this.gameId, seatNumber).catch((err) =>
      console.error('[GameRoom] Failed to persist seat left:', err),
    );

    console.log(
      `[GameRoom ${this.gameId}] ${userId} left seat ${seatNumber}`,
    );

    // Broadcast updated state
    this.broadcastTableState();
    this.io.to(this.roomName).emit(ServerEvents.SEAT_UPDATED, {
      seatNumber,
      userId: null,
      status: 'open',
      stack: 0,
    });
  }

  // ---- Game Lifecycle ----

  async startGame(userId: string): Promise<void> {
    // Only the creator can start the game
    if (userId !== this.creatorUserId) {
      throw new Error('Only the game creator can start the game');
    }

    // Need at least 2 seated players
    const occupiedSeats = this.gameState.seats.getOccupiedSeats();
    if (occupiedSeats.length < 2) {
      throw new Error('Need at least 2 seated players to start');
    }

    // Update status
    this.status = 'active';

    // Persist status
    updateGameStatus(this.gameId, 'active').catch((err) =>
      console.error('[GameRoom] Failed to update game status:', err),
    );

    console.log(`[GameRoom ${this.gameId}] Game started by ${userId}`);

    // Start the first hand
    this.startNewHand();
  }

  private startNewHand(): void {
    // Clear any pending timer
    if (this.nextHandTimer) {
      clearTimeout(this.nextHandTimer);
      this.nextHandTimer = null;
    }

    // Check we still have enough players
    const occupiedSeats = this.gameState.seats.getOccupiedSeats();
    if (occupiedSeats.length < 2) {
      console.log(
        `[GameRoom ${this.gameId}] Not enough players for next hand, waiting...`,
      );
      this.broadcastTableState();
      return;
    }

    // Record pre-hand stacks
    this.preHandStacks.clear();
    for (const { player } of occupiedSeats) {
      this.preHandStacks.set(player.userId, player.stack);
    }

    // Reset action log
    this.currentHandActions = [];

    // Start the hand in game engine
    this.gameState.startHand();

    console.log(
      `[GameRoom ${this.gameId}] Hand #${this.gameState.handNumber} started`,
    );

    // Broadcast hand started to the room
    const tableState = toPublicTableState(this.gameState);
    const playersState = toPublicPlayerStates(this.gameState, this.avatarUrls);
    this.io.to(this.roomName).emit(ServerEvents.HAND_STARTED, {
      handNumber: this.gameState.handNumber,
      dealerSeat: this.gameState.dealerSeat,
      smallBlindSeat: this.gameState.sbSeat,
      bigBlindSeat: this.gameState.bbSeat,
      tableState,
      players: playersState,
    });

    // Send private hole cards to each player
    for (const { player } of occupiedSeats) {
      this.sendPrivateCards(player.userId);
    }

    // Notify whose turn it is
    this.emitActionRequired();
  }

  handleAction(userId: string, action: ActionRequest): void {
    if (!this.gameState.handInProgress) {
      const socket = this.sockets.get(userId);
      if (socket) socket.emit(ServerEvents.ERROR, { message: 'No hand in progress' });
      return;
    }

    // Validate it's this player's turn
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.userId !== userId) {
      throw new Error('It is not your turn');
    }

    // Record the action for hand history
    this.currentHandActions.push({
      street: this.gameState.street,
      seatNumber: currentPlayer.seatNumber,
      userId,
      action: action.type,
      amount: action.amount ?? 0,
      timestamp: new Date().toISOString(),
    });

    // Process the action in game engine
    const result = this.gameState.processAction(
      userId,
      action.type,
      action.amount ?? 0,
    );

    if (!result.success) {
      throw new Error(result.error ?? 'Invalid action');
    }

    console.log(
      `[GameRoom ${this.gameId}] ${userId} -> ${action.type}${action.amount ? ` ${action.amount}` : ''}`,
    );

    // Broadcast the action + updated state to the room
    const tableState = toPublicTableState(this.gameState);
    const playersState = toPublicPlayerStates(this.gameState, this.avatarUrls);
    this.io.to(this.roomName).emit(ServerEvents.ACTION_PERFORMED, {
      tableState,
      players: playersState,
      action: {
        userId,
        displayName: this.gameState.seats.getPlayer(currentPlayer.seatNumber)?.displayName ?? userId.slice(0, 8),
        type: action.type,
        amount: action.amount ?? 0,
      },
    });

    // Check if the hand is complete
    if (this.gameState.isHandComplete()) {
      this.resolveHand();
    } else {
      // Notify the next player
      this.emitActionRequired();
    }
  }

  private resolveHand(): void {
    let handResult: HandResult;
    try {
      handResult = this.gameState.resolveHand();
      console.log(
        `[GameRoom ${this.gameId}] Hand #${this.gameState.handNumber} resolved: ${handResult.winners.length} winner(s), pot distributed`,
      );
      for (const w of handResult.winners) {
        const p = this.gameState.seats.getPlayer(this.gameState.seats.getSeatByUserId(w.userId));
        console.log(
          `  Winner: ${p?.displayName ?? w.userId} +${w.amount} chips (${w.hand ?? 'fold win'})`,
        );
      }
    } catch (err) {
      console.error(`[GameRoom ${this.gameId}] resolveHand CRASHED:`, err);

      // Build a fallback result — give pot to last active player
      const activePlayers = this.gameState.seats.getActivePlayers();
      const totalPot = this.gameState.potManager?.getTotal() ?? 0;
      if (activePlayers.length > 0) {
        const winner = activePlayers[0];
        winner.player.stack += totalPot;
        handResult = {
          winners: [{
            userId: winner.player.userId,
            seatNumber: winner.seatNumber,
            amount: totalPot,
            hand: undefined,
          }],
          potResults: [{ potIndex: 0, amount: totalPot, winners: [{
            userId: winner.player.userId,
            seatNumber: winner.seatNumber,
            amount: totalPot,
          }] }],
        };
        console.log(`  Fallback winner: ${winner.player.displayName} +${totalPot} chips`);
      } else {
        // Absolute fallback
        handResult = { winners: [], potResults: [] };
      }
    }

    // Broadcast hand result
    this.broadcastHandResult(handResult);

    // Broadcast updated stacks
    this.broadcastTableState();

    // Persist the hand record (async, don't block)
    this.persistHandRecord(handResult);

    // Auto-start next hand after a delay (if game is still active)
    if (this.status === 'active') {
      this.nextHandTimer = setTimeout(() => {
        try {
          this.startNewHand();
        } catch (err) {
          console.error(
            `[GameRoom ${this.gameId}] Error auto-starting next hand:`,
            err,
          );
        }
      }, 5000); // 5-second delay between hands
    }
  }

  private persistHandRecord(handResult: HandResult): void {
    const occupiedSeats = this.gameState.seats.getOccupiedSeats();

    const handData: HandRecordData = {
      handNumber: this.gameState.handNumber,
      dealerSeat: this.gameState.dealerSeat,
      communityCards: this.gameState.communityCards,
      potTotal: handResult.potResults.reduce((sum, p) => sum + p.amount, 0),
      players: occupiedSeats.map(({ seatNumber, player }) => ({
        userId: player.userId,
        seatNumber,
        holeCards: this.gameState.holeCards.get(player.userId) ?? [],
        startStack: this.preHandStacks.get(player.userId) ?? 0,
        endStack: player.stack,
        netChange: player.stack - (this.preHandStacks.get(player.userId) ?? 0),
      })),
      actions: this.currentHandActions,
      winners: handResult.winners.map((w) => ({
        userId: w.userId,
        amount: w.amount,
        hand: w.hand,
      })),
    };

    saveHandRecord(this.gameId, handData).catch((err) =>
      console.error('[GameRoom] Failed to persist hand record:', err),
    );
  }

  async endGame(userId: string): Promise<void> {
    // Only the creator can end the game
    if (userId !== this.creatorUserId) {
      throw new Error('Only the game creator can end the game');
    }

    // Clear any pending timer
    if (this.nextHandTimer) {
      clearTimeout(this.nextHandTimer);
      this.nextHandTimer = null;
    }

    this.status = 'completed';

    // Calculate final results for all players who participated
    const results = this.calculateFinalResults();
    const settlements = calculateSettlements(results);

    console.log(
      `[GameRoom ${this.gameId}] Game ended by ${userId}. ${results.length} players settled.`,
    );

    // Persist to DB
    updateGameStatus(this.gameId, 'completed').catch((err) =>
      console.error('[GameRoom] Failed to update game status:', err),
    );
    saveGameResults(this.gameId, results, settlements).catch((err) =>
      console.error('[GameRoom] Failed to save game results:', err),
    );

    // Broadcast game ended
    this.io.to(this.roomName).emit(ServerEvents.GAME_ENDED, {
      results,
      settlements,
    });
  }

  private calculateFinalResults(): GameResult[] {
    const results: GameResult[] = [];
    const occupiedSeats = this.gameState.seats.getOccupiedSeats();
    const chipValue = this.config.buyInConfig.chipValue;

    // Include departed players first
    for (const [, result] of this.departedResults) {
      results.push(result);
    }

    // Include currently seated players
    for (const { player } of occupiedSeats) {
      // Skip if already recorded as departed (shouldn't happen, but be safe)
      if (this.departedResults.has(player.userId)) continue;

      const totalBuyIn = this.totalBuyIns.get(player.userId) ?? 0;
      const cashoutValue = player.stack * chipValue;
      const netResult = cashoutValue - totalBuyIn;

      results.push({
        userId: player.userId,
        displayName: player.displayName,
        totalBuyIn,
        finalChips: player.stack,
        cashoutValue,
        netResult,
      });
    }

    return results;
  }

  // ---- Broadcasting ----

  broadcastTableState(): void {
    const tableState = toPublicTableState(this.gameState);
    const players = toPublicPlayerStates(this.gameState, this.avatarUrls);
    this.io.to(this.roomName).emit(ServerEvents.GAME_STATE, {
      tableState,
      players,
    });
  }

  sendPrivateCards(userId: string): void {
    const socket = this.sockets.get(userId);
    if (!socket) return;

    const privateState = toPrivatePlayerState(this.gameState, userId);
    if (privateState) {
      socket.emit('game:privateCards', {
        holeCards: privateState.holeCards,
      });
    }
  }

  broadcastHandResult(result: HandResult): void {
    // On showdown, reveal all active players' cards
    const showdownCards: Record<string, unknown> = {};
    if (this.gameState.street === 'showdown') {
      const activePlayers = this.gameState.seats.getActivePlayers();
      for (const { player } of activePlayers) {
        const cards = this.gameState.holeCards.get(player.userId);
        if (cards) {
          showdownCards[player.userId] = cards;
        }
      }
    }

    const tableState = toPublicTableState(this.gameState);
    const playersState = toPublicPlayerStates(this.gameState, this.avatarUrls);
    this.io.to(this.roomName).emit(ServerEvents.HAND_RESULT, {
      ...result,
      showdownCards,
      tableState,
      players: playersState,
    });
  }

  private emitActionRequired(): void {
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!currentPlayer) return;

    const player = this.gameState.seats.getPlayer(currentPlayer.seatNumber);
    if (!player) return;

    const legalActions = this.gameState.betting.getLegalActions(
      currentPlayer.userId,
      player.stack,
    );

    // Notify the room whose turn it is
    this.io.to(this.roomName).emit(ServerEvents.ACTION_REQUIRED, {
      userId: currentPlayer.userId,
      seatNumber: currentPlayer.seatNumber,
      legalActions,
    });
  }

  // ---- Cleanup ----

  destroy(): void {
    if (this.nextHandTimer) {
      clearTimeout(this.nextHandTimer);
      this.nextHandTimer = null;
    }
    this.sockets.clear();
  }
}
