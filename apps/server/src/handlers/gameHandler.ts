// ============================================================
// Game Handler – Socket.IO event listeners for game actions
// ============================================================

import type { Server, Socket } from 'socket.io';
import { ClientEvents, ServerEvents } from '@poker/shared';
import type { ActionRequest } from '@poker/shared';
import { GameRoom } from '../rooms/GameRoom.js';
import { fetchGameConfig } from '../services/gameService.js';

/** Active game rooms keyed by gameId */
const rooms = new Map<string, GameRoom>();

/** Track which room each socket is in: socketId -> gameId */
const socketRooms = new Map<string, string>();

/**
 * Extracts the authenticated userId from the socket handshake.
 */
function getUserId(socket: Socket): string {
  const userId = socket.data.userId as string | undefined;
  if (!userId) {
    throw new Error('Unauthenticated socket – userId not found on socket.data');
  }
  return userId;
}

/**
 * Emit an error event back to the socket.
 */
function emitError(socket: Socket, message: string): void {
  socket.emit(ServerEvents.ERROR, { message });
}

/**
 * Get or create a GameRoom for the given gameId.
 */
async function getOrCreateRoom(
  io: Server,
  gameId: string,
): Promise<GameRoom> {
  let room = rooms.get(gameId);
  if (room) return room;

  // Fetch game config from DB
  const { config, creatorUserId } = await fetchGameConfig(gameId);

  room = new GameRoom(io, gameId, config, creatorUserId);
  rooms.set(gameId, room);
  console.log(`[gameHandler] Created room for game ${gameId}`);

  return room;
}

/**
 * Registers all game-related event listeners on the given socket.
 */
export function gameHandler(io: Server, socket: Socket): void {
  const userId = getUserId(socket);

  // --- JOIN_GAME_ROOM ---
  socket.on(
    ClientEvents.JOIN_GAME_ROOM,
    async (payload: { gameId: string }) => {
      try {
        const { gameId } = payload;
        const room = await getOrCreateRoom(io, gameId);
        room.join(socket, userId);
        socketRooms.set(socket.id, gameId);
        console.log(`[gameHandler] ${userId} joined game ${gameId}`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to join game room';
        console.error(`[gameHandler] JOIN_GAME_ROOM error:`, message);
        emitError(socket, message);
      }
    },
  );

  // --- TAKE_SEAT ---
  socket.on(
    ClientEvents.TAKE_SEAT,
    async (payload: {
      gameId: string;
      seatNumber: number;
      buyInAmount?: number;
    }) => {
      try {
        const { gameId, seatNumber, buyInAmount } = payload;
        const room = rooms.get(gameId);
        if (!room) {
          return emitError(socket, 'Game room not found');
        }

        // Default buy-in to minimum if not specified
        const amount = buyInAmount ?? room.config.buyInConfig.minBuyIn;
        await room.takeSeat(userId, seatNumber, amount);
        console.log(
          `[gameHandler] ${userId} took seat ${seatNumber} in game ${gameId}`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to take seat';
        console.error(`[gameHandler] TAKE_SEAT error:`, message);
        emitError(socket, message);
      }
    },
  );

  // --- LEAVE_SEAT ---
  socket.on(
    ClientEvents.LEAVE_SEAT,
    async (payload: { gameId: string }) => {
      try {
        const { gameId } = payload;
        const room = rooms.get(gameId);
        if (!room) {
          return emitError(socket, 'Game room not found');
        }

        await room.leaveSeat(userId);
        console.log(
          `[gameHandler] ${userId} left seat in game ${gameId}`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to leave seat';
        console.error(`[gameHandler] LEAVE_SEAT error:`, message);
        emitError(socket, message);
      }
    },
  );

  // --- START_GAME ---
  socket.on(
    ClientEvents.START_GAME,
    async (payload: { gameId: string }) => {
      try {
        const { gameId } = payload;
        const room = rooms.get(gameId);
        if (!room) {
          return emitError(socket, 'Game room not found');
        }

        await room.startGame(userId);
        console.log(
          `[gameHandler] ${userId} started game ${gameId}`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to start game';
        console.error(`[gameHandler] START_GAME error:`, message);
        emitError(socket, message);
      }
    },
  );

  // --- PLAYER_ACTION ---
  socket.on(
    ClientEvents.PLAYER_ACTION,
    (payload: { gameId: string; action: ActionRequest }) => {
      try {
        const { gameId, action } = payload;
        const room = rooms.get(gameId);
        if (!room) {
          return emitError(socket, 'Game room not found');
        }

        room.handleAction(userId, action);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to process action';
        console.error(`[gameHandler] PLAYER_ACTION error:`, message);
        emitError(socket, message);
      }
    },
  );

  // --- END_GAME ---
  socket.on(
    ClientEvents.END_GAME,
    async (payload: { gameId: string }) => {
      try {
        const { gameId } = payload;
        const room = rooms.get(gameId);
        if (!room) {
          return emitError(socket, 'Game room not found');
        }

        await room.endGame(userId);

        // Clean up the room
        room.destroy();
        rooms.delete(gameId);
        console.log(
          `[gameHandler] ${userId} ended game ${gameId}, room cleaned up`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to end game';
        console.error(`[gameHandler] END_GAME error:`, message);
        emitError(socket, message);
      }
    },
  );

  // --- DISCONNECT ---
  socket.on('disconnect', async () => {
    const gameId = socketRooms.get(socket.id);
    if (!gameId) return;

    const room = rooms.get(gameId);
    if (room) {
      room.leave(socket, userId);

      // If the room has no connected users, schedule cleanup
      // (give a grace period for reconnection)
      if (!room.hasConnectedUsers()) {
        setTimeout(() => {
          const currentRoom = rooms.get(gameId);
          if (currentRoom && !currentRoom.hasConnectedUsers()) {
            console.log(
              `[gameHandler] Room ${gameId} empty after grace period, cleaning up`,
            );
            currentRoom.destroy();
            rooms.delete(gameId);
          }
        }, 60000); // 1-minute grace period
      }
    }

    socketRooms.delete(socket.id);
    console.log(
      `[gameHandler] ${userId} disconnected from game ${gameId ?? 'unknown'}`,
    );
  });
}
