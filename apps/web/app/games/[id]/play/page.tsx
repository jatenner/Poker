"use client";

import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { PlayerAction } from "@poker/shared";
import PokerTable from "@/components/table/PokerTable";
import { useAuthContext } from "@/contexts/AuthContext";
import { useGameSocket } from "@/hooks/useGameSocket";

function formatCurrency(amount: number): string {
  return amount < 0
    ? `-$${Math.abs(amount).toLocaleString()}`
    : `$${amount.toLocaleString()}`;
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { user, loading: authLoading } = useAuthContext();

  const {
    tableState,
    players,
    holeCards,
    actionLog,
    handResult,
    gameResults,
    error,
    connected,
    playerAction,
  } = useGameSocket(gameId);

  const currentUserId = user?.id ?? "";

  // Determine legal actions for the current user
  const legalActions = useMemo<PlayerAction[]>(() => {
    if (!tableState || !currentUserId) return [];
    const currentPlayer = players.find((p) => p.userId === currentUserId);
    if (!currentPlayer?.isTurn) return [];

    // When it's our turn, determine which actions are available
    const actions: PlayerAction[] = ["fold"];

    const hasCurrentBet =
      players.some((p) => p.currentBet > 0 && !p.isFolded && p.userId !== currentUserId);

    if (hasCurrentBet) {
      actions.push("call");
      actions.push("raise");
    } else {
      actions.push("check");
      actions.push("bet");
    }

    // All-in is always available
    actions.push("all-in");

    return actions;
  }, [tableState, players, currentUserId]);

  const handleAction = useCallback(
    (action: PlayerAction, amount?: number) => {
      playerAction({ type: action, amount });
    },
    [playerAction]
  );

  // --- Loading / auth states ---

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-felt-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-bg">
        <p className="text-[var(--color-text-secondary)]">
          Please log in to play.
        </p>
        <Link href="/login" className="btn-primary">
          Log In
        </Link>
      </div>
    );
  }

  // Connecting state
  if (!connected && !error) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-felt-500 border-t-transparent" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Connecting to game...
        </p>
      </div>
    );
  }

  // Connection error with no table state at all
  if (error && !tableState) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-bg">
        <p className="text-chip-red">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
          <Link
            href={`/games/${gameId}`}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-[var(--color-text-secondary)] transition hover:bg-white/5"
          >
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  // Waiting for initial state
  if (!tableState) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-felt-500 border-t-transparent" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Loading game state...
        </p>
      </div>
    );
  }

  // Lobby state - game hasn't started yet
  if (tableState.status === "lobby") {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-bg">
        <div className="rounded-full border border-felt-500/30 bg-felt-900/40 px-6 py-3">
          <p className="text-lg font-medium text-felt-300">
            Waiting for the game to start...
          </p>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">
          The host will start the game when everyone is ready.
        </p>
        <Link
          href={`/games/${gameId}`}
          className="text-sm text-felt-400 underline underline-offset-2 transition hover:text-felt-300"
        >
          Back to Lobby
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-bg">
      {/* Error toast */}
      {error && (
        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg bg-chip-red/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Hand result overlay */}
      {handResult && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-md rounded-xl border border-white/10 bg-bg p-6 shadow-2xl">
            <h2 className="mb-4 text-center text-lg font-bold text-chip-gold">
              Hand Result
            </h2>
            <div className="space-y-2">
              {handResult.winners.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2"
                >
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {w.userId === currentUserId ? "You" : `Seat ${w.seatNumber}`}
                  </span>
                  <span className="text-chip-gold">
                    +{w.amount.toLocaleString()}
                    {w.hand && (
                      <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                        ({w.hand})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game ended overlay */}
      {gameResults && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-w-lg rounded-xl border border-white/10 bg-bg p-6 shadow-2xl">
            <h2 className="mb-4 text-center text-xl font-bold text-[var(--color-text-primary)]">
              Game Over
            </h2>
            <div className="space-y-2">
              {gameResults
                .sort((a, b) => b.netResult - a.netResult)
                .map((r) => (
                  <div
                    key={r.userId}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-2"
                  >
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {r.displayName}
                      {r.userId === currentUserId && (
                        <span className="ml-1 text-xs text-[var(--color-text-secondary)]">
                          (You)
                        </span>
                      )}
                    </span>
                    <span
                      className={
                        r.netResult >= 0 ? "text-felt-400" : "text-chip-red"
                      }
                    >
                      {formatCurrency(r.netResult)}
                    </span>
                  </div>
                ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Link href={`/games/${gameId}`} className="btn-primary">
                Back to Lobby
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main table */}
      <PokerTable
        tableState={tableState}
        players={players}
        currentUserId={currentUserId}
        holeCards={holeCards}
        onAction={handleAction}
        legalActions={legalActions}
        actionLog={actionLog}
      />
    </div>
  );
}
