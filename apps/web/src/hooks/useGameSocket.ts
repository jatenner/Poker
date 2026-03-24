"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Socket } from "socket.io-client";
import {
  ClientEvents,
  ServerEvents,
  type PublicTableState,
  type PublicPlayerState,
  type Card,
  type ActionRequest,
  type HandResult,
  type GameResult,
} from "@poker/shared";
import { connectToGame } from "@/lib/socket";
import { createBrowserClient } from "@/lib/supabase/client";
import type { ActionLogEntry } from "@/components/table/ActionLog";

export interface GameSocketState {
  tableState: PublicTableState | null;
  players: PublicPlayerState[];
  holeCards: [Card, Card] | null;
  actionLog: ActionLogEntry[];
  handResult: HandResult | null;
  gameResults: GameResult[] | null;
  error: string | null;
  connected: boolean;
  serverLegalActions: string[];
}

export interface GameSocketActions {
  takeSeat: (seatNumber: number, buyIn: number) => void;
  leaveSeat: () => void;
  startGame: () => void;
  playerAction: (action: ActionRequest) => void;
  endGame: () => void;
}

export type UseGameSocketReturn = GameSocketState & GameSocketActions;

const supabase = createBrowserClient();

export function useGameSocket(gameId: string): UseGameSocketReturn {
  const socketRef = useRef<Socket | null>(null);

  const [tableState, setTableState] = useState<PublicTableState | null>(null);
  const [players, setPlayers] = useState<PublicPlayerState[]>([]);
  const [holeCards, setHoleCards] = useState<[Card, Card] | null>(null);
  const [actionLog, setActionLog] = useState<ActionLogEntry[]>([]);
  const [handResult, setHandResult] = useState<HandResult | null>(null);
  const [gameResults, setGameResults] = useState<GameResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [serverLegalActions, setServerLegalActions] = useState<string[]>([]);

  // Helper to append to action log
  const appendLog = useCallback((entry: ActionLogEntry) => {
    setActionLog((prev) => [...prev.slice(-49), entry]);
  }, []);

  // Connect on mount
  useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    async function init() {
      // Get the current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (!session?.access_token) {
        setError("Not authenticated. Please log in.");
        return;
      }

      socket = connectToGame(gameId, session.access_token);
      socketRef.current = socket;

      // --- Connection lifecycle ---
      socket.on("connect", () => {
        if (cancelled) return;
        setConnected(true);
        setError(null);
        // Join the game room
        socket!.emit(ClientEvents.JOIN_GAME_ROOM, { gameId });
      });

      socket.on("disconnect", () => {
        if (cancelled) return;
        setConnected(false);
      });

      socket.on("connect_error", (err) => {
        if (cancelled) return;
        setError(`Connection error: ${err.message}`);
        setConnected(false);
      });

      // --- Server events ---

      // Full game state (sent on join and on major updates)
      socket.on(
        ServerEvents.GAME_STATE,
        (data: {
          tableState: PublicTableState;
          players: PublicPlayerState[];
        }) => {
          if (cancelled) return;
          setTableState(data.tableState);
          if (data.players) {
            setPlayers(data.players);
          }
          // Clear stale hand result when new state arrives
          setHandResult(null);
        }
      );

      // Seat changes
      socket.on(
        ServerEvents.SEAT_UPDATED,
        (data: {
          tableState?: PublicTableState;
          players?: PublicPlayerState[];
        }) => {
          if (cancelled) return;
          if (data.tableState) setTableState(data.tableState);
          if (data.players) setPlayers(data.players);
        }
      );

      // Hand started
      socket.on(
        ServerEvents.HAND_STARTED,
        (data: {
          tableState: PublicTableState;
          players: PublicPlayerState[];
          holeCards?: [Card, Card];
        }) => {
          if (cancelled) return;
          setTableState(data.tableState);
          setPlayers(data.players);
          if (data.holeCards) {
            setHoleCards(data.holeCards);
          }
          setHandResult(null);
          setActionLog([]);
          appendLog({
            playerName: "Dealer",
            action: `Hand #${data.tableState.handNumber} started`,
            timestamp: Date.now(),
          });
        }
      );

      // Private hole cards (sent individually to each player)
      socket.on(
        "game:privateCards",
        (data: { holeCards: [Card, Card] }) => {
          if (cancelled) return;
          if (data.holeCards) {
            setHoleCards(data.holeCards);
          }
        }
      );

      // Action required (tells us whose turn it is + legal actions)
      socket.on(
        ServerEvents.ACTION_REQUIRED,
        (data: {
          userId?: string;
          seatNumber?: number;
          legalActions?: { type: string; minAmount?: number; maxAmount?: number }[];
          tableState?: PublicTableState;
          players?: PublicPlayerState[];
        }) => {
          if (cancelled) return;
          if (data.tableState) setTableState(data.tableState);
          if (data.players) setPlayers(data.players);
          if (data.legalActions) {
            setServerLegalActions(data.legalActions.map((a: any) => a.action ?? a.type ?? a));
          }
        }
      );

      // Action performed by a player
      socket.on(
        ServerEvents.ACTION_PERFORMED,
        (data: {
          tableState: PublicTableState;
          players: PublicPlayerState[];
          action: {
            userId: string;
            displayName: string;
            type: string;
            amount?: number;
          };
        }) => {
          if (cancelled) return;
          setTableState(data.tableState);
          setPlayers(data.players);

          const actionMap: Record<string, string> = {
            fold: "folds",
            check: "checks",
            call: "calls",
            bet: "bets",
            raise: "raises to",
            "all-in": "goes all-in",
          };

          appendLog({
            playerName: data.action.displayName,
            action: actionMap[data.action.type] ?? data.action.type,
            amount: data.action.amount,
            timestamp: Date.now(),
          });
        }
      );

      // Hand result
      socket.on(
        ServerEvents.HAND_RESULT,
        (data: any) => {
          if (cancelled) return;
          console.log("[useGameSocket] HAND_RESULT received:", JSON.stringify(data).slice(0, 500));
          // Server sends { winners, potResults, showdownCards, tableState, players }
          const result: HandResult = data.result ?? {
            winners: data.winners ?? [],
            potResults: data.potResults ?? [],
          };
          console.log("[useGameSocket] Parsed winners:", result.winners?.length);
          setHandResult(result);
          if (data.tableState) setTableState(data.tableState);
          if (data.players) setPlayers(data.players);
        }
      );

      // Game ended
      socket.on(
        ServerEvents.GAME_ENDED,
        (data: {
          results?: GameResult[];
          tableState?: PublicTableState;
        }) => {
          if (cancelled) return;
          if (data.results) setGameResults(data.results);
          if (data.tableState) setTableState(data.tableState);
        }
      );

      // Errors
      socket.on(
        ServerEvents.ERROR,
        (data: { message: string }) => {
          if (cancelled) return;
          setError(data.message);
          // Auto-clear error after 5 seconds
          setTimeout(() => {
            setError((prev) =>
              prev === data.message ? null : prev
            );
          }, 5_000);
        }
      );
    }

    init();

    return () => {
      cancelled = true;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [gameId, appendLog]);

  // --- Actions ---

  const takeSeat = useCallback(
    (seatNumber: number, buyIn: number) => {
      socketRef.current?.emit(ClientEvents.TAKE_SEAT, {
        gameId,
        seatNumber,
        buyIn,
      });
    },
    [gameId]
  );

  const leaveSeat = useCallback(() => {
    socketRef.current?.emit(ClientEvents.LEAVE_SEAT, { gameId });
  }, [gameId]);

  const startGame = useCallback(() => {
    socketRef.current?.emit(ClientEvents.START_GAME, { gameId });
  }, [gameId]);

  const playerAction = useCallback(
    (action: ActionRequest) => {
      socketRef.current?.emit(ClientEvents.PLAYER_ACTION, {
        gameId,
        action,
      });
    },
    [gameId]
  );

  const endGame = useCallback(() => {
    socketRef.current?.emit(ClientEvents.END_GAME, { gameId });
  }, [gameId]);

  return {
    tableState,
    players,
    holeCards,
    actionLog,
    handResult,
    gameResults,
    error,
    connected,
    serverLegalActions,
    takeSeat,
    leaveSeat,
    startGame,
    playerAction,
    endGame,
  };
}
