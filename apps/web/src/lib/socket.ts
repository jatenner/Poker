import { io, type Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

/**
 * Create a Socket.IO connection to the game server.
 *
 * @param gameId  - The game to join after connecting.
 * @param token   - Supabase JWT for server-side auth.
 * @returns A connected Socket instance.
 */
export function connectToGame(gameId: string, token: string): Socket {
  const socket = io(SOCKET_URL, {
    auth: { token },
    query: { gameId },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
  });

  return socket;
}
