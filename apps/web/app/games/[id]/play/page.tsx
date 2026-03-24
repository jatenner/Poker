"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { PlayerAction } from "@poker/shared";
import PokerTable from "@/components/table/PokerTable";
import AvatarDisplay from "@/components/AvatarDisplay";
import { useAuthContext } from "@/contexts/AuthContext";
import { useGameSocket } from "@/hooks/useGameSocket";

function formatCurrency(amount: number): string {
  return amount < 0
    ? `-$${Math.abs(amount).toLocaleString()}`
    : `$${amount.toLocaleString()}`;
}

function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gameId = params.id as string;
  const shouldStart = searchParams.get("start") === "1";
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
    serverLegalActions,
    playerAction,
    startGame,
  } = useGameSocket(gameId);

  const currentUserId = user?.id ?? "";

  // Track if we've ever seen active state — never go back to lobby screen
  const hasBeenActive = useRef(false);
  if (tableState && tableState.status === "active") {
    hasBeenActive.current = true;
  }

  // Auto-start game if creator arrived with ?start=1
  const startedRef = useRef(false);
  useEffect(() => {
    if (shouldStart && connected && tableState && !startedRef.current) {
      startedRef.current = true;
      startGame();
    }
  }, [shouldStart, connected, tableState, startGame]);

  // Use server-provided legal actions (authoritative)
  const legalActions = useMemo<PlayerAction[]>(() => {
    if (!tableState || !currentUserId) return [];
    const currentPlayer = players.find((p) => p.userId === currentUserId);
    if (!currentPlayer?.isTurn) return [];
    // Use server-sent legal actions if available
    if (serverLegalActions.length > 0) {
      return serverLegalActions as PlayerAction[];
    }
    // Fallback: basic guess
    return ["fold", "check", "call", "raise", "all-in"];
  }, [tableState, players, currentUserId, serverLegalActions]);

  const handleAction = useCallback(
    (action: PlayerAction, amount?: number) => {
      playerAction({ type: action, amount });
    },
    [playerAction]
  );

  // Auto-dismiss hand result after 4 seconds
  const handResultRef = useRef(handResult);
  handResultRef.current = handResult;
  const [showHandResult, setShowHandResult] = useState(false);

  useEffect(() => {
    if (handResult && handResult.winners && handResult.winners.length > 0) {
      setShowHandResult(true);
      const timer = setTimeout(() => setShowHandResult(false), 4000);
      return () => clearTimeout(timer);
    } else {
      setShowHandResult(false);
    }
  }, [handResult]);

  // --- Loading / auth states ---

  if (authLoading) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-felt-500 border-t-transparent" />
          <span className="text-sm text-white/40">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[#0a0a0a]">
        <div className="text-4xl">&#x1F0CF;</div>
        <p className="text-lg text-white/60">Please log in to play.</p>
        <Link
          href="/login"
          className="rounded-xl bg-gradient-to-b from-felt-500 to-felt-700 px-8 py-3 text-base font-bold text-white shadow-lg transition hover:from-felt-400 hover:to-felt-600"
        >
          Log In
        </Link>
      </div>
    );
  }

  // Connecting state
  if (!connected && !error) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-felt-500 border-t-transparent" />
        <p className="text-sm font-medium text-white/50">
          Connecting to game...
        </p>
      </div>
    );
  }

  // Connection error with no table state
  if (error && !tableState) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[#0a0a0a]">
        <div className="rounded-xl border border-chip-red/20 bg-chip-red/10 px-6 py-4">
          <p className="text-base font-medium text-chip-red">{error}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-gradient-to-b from-felt-500 to-felt-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-felt-400 hover:to-felt-600"
          >
            Retry
          </button>
          <Link
            href={`/games/${gameId}`}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white/80"
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
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-felt-500 border-t-transparent" />
        <p className="text-sm font-medium text-white/50">
          Loading game state...
        </p>
      </div>
    );
  }

  // ===== LOBBY STATE (only show if we've never been active) =====
  if (tableState.status === "lobby" && !hasBeenActive.current) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-[#0a0a0a]">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(27,94,32,0.1),transparent)]" />

        {/* Logo area */}
        <div className="relative flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-felt-600 to-felt-800 text-3xl shadow-xl">
            &#x1F0CF;
          </div>
          <h1 className="text-2xl font-bold text-white/90">
            {shouldStart ? "Starting Game..." : "Waiting for Game"}
          </h1>
          <p className="text-sm text-white/40">
            {shouldStart
              ? "Setting up the table..."
              : "The game will begin when the host starts it."}
          </p>
        </div>

        {/* Player count */}
        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-6 py-3">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: tableState.seats.length }).map((_, i) => {
              const occupied = tableState.seats[i]?.status === "occupied";
              return (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    occupied
                      ? "bg-felt-400 shadow-[0_0_4px] shadow-felt-400/50"
                      : "bg-white/10"
                  }`}
                />
              );
            })}
          </div>
          <span className="text-sm text-white/50">
            {tableState.seats.filter((s) => s.status === "occupied").length} /{" "}
            {tableState.seats.length} seated
          </span>
        </div>

        {/* Actions */}
        {!shouldStart && (
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => startGame()}
              className="rounded-xl bg-gradient-to-b from-felt-400 to-felt-700 px-10 py-4 text-lg font-black uppercase tracking-wider text-white shadow-xl transition-all hover:from-felt-300 hover:to-felt-600 hover:shadow-felt-500/20 active:scale-[0.98]"
            >
              Start Game
            </button>
            <Link
              href={`/games/${gameId}`}
              className="text-sm text-white/40 underline underline-offset-4 transition hover:text-white/60"
            >
              Back to Lobby
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ===== ACTIVE / PLAYING STATE =====
  return (
    <div className="fixed inset-0 z-40 bg-[#0a0a0a]">
      {/* Error toast */}
      {error && (
        <div className="absolute left-1/2 top-16 z-[60] -translate-x-1/2 animate-[fadeIn_0.3s_ease-out]">
          <div className="rounded-xl border border-chip-red/20 bg-chip-red/90 px-5 py-2.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-sm">
            {error}
          </div>
        </div>
      )}

      {/* Hand result overlay — table stays visible behind */}
      {showHandResult && handResult && handResult.winners && handResult.winners.length > 0 && (
        <div className="absolute inset-0 z-[55] flex items-center justify-center pointer-events-none animate-[fadeIn_0.2s_ease-out]">
          <div className="pointer-events-auto mx-4 w-full max-w-md">
            {/* Main winner card */}
            {(() => {
              const mainWinner = handResult.winners[0];
              const winnerPlayer = players.find((p) => p.userId === mainWinner.userId);
              const isYou = mainWinner.userId === currentUserId;
              return (
                <div className="flex flex-col items-center gap-3">
                  {/* Big avatar with glow */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-chip-gold/20 blur-xl scale-150" />
                    <div className="relative rounded-full border-4 border-chip-gold shadow-[0_0_30px_rgba(249,168,37,0.4)]">
                      <AvatarDisplay
                        avatarUrl={winnerPlayer?.avatarUrl}
                        displayName={winnerPlayer?.displayName ?? "Winner"}
                        size="xl"
                      />
                    </div>
                    <div className="absolute -top-2 -right-2 text-3xl animate-bounce">🏆</div>
                  </div>

                  {/* Winner name + chips */}
                  <div className="rounded-2xl border border-chip-gold/30 bg-[#151515]/95 backdrop-blur-md px-8 py-4 text-center shadow-2xl">
                    <div className="text-lg font-black text-white mb-1">
                      {isYou ? "You Win!" : `${winnerPlayer?.displayName ?? "Player"} Wins!`}
                    </div>
                    {mainWinner.hand && (
                      <div className="text-sm text-chip-gold/90 font-semibold mb-2">
                        {mainWinner.hand}
                      </div>
                    )}
                    <div className="text-2xl font-black text-chip-gold">
                      +{formatChips(mainWinner.amount)} chips
                    </div>

                    {/* Additional winners (split pot) */}
                    {handResult.winners.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                        {handResult.winners.slice(1).map((w, i) => {
                          const p = players.find((pl) => pl.userId === w.userId);
                          return (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-white/70">{p?.displayName ?? "Player"}</span>
                              <span className="text-chip-gold font-bold">+{formatChips(w.amount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-3 text-[11px] text-white/30 font-medium">
                      Next hand dealing...
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Game ended overlay */}
      {gameResults && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="mx-4 max-w-lg animate-[fadeIn_0.3s_ease-out] rounded-2xl border border-white/10 bg-[#151515] p-8 shadow-2xl">
            {/* Trophy */}
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chip-gold/15 text-3xl">
                &#x1F3C6;
              </div>
            </div>
            <h2 className="mb-6 text-center text-2xl font-black text-white/90">
              Game Over
            </h2>
            <div className="space-y-2">
              {gameResults
                .sort((a, b) => b.netResult - a.netResult)
                .map((r, i) => (
                  <div
                    key={r.userId}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {/* Position */}
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                          i === 0
                            ? "bg-chip-gold/20 text-chip-gold"
                            : i === 1
                              ? "bg-white/10 text-white/50"
                              : "bg-white/5 text-white/30"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-base font-bold text-white/90">
                        {r.displayName}
                        {r.userId === currentUserId && (
                          <span className="ml-1.5 text-xs font-medium text-white/40">
                            (You)
                          </span>
                        )}
                      </span>
                    </div>
                    <span
                      className={`text-lg font-black ${
                        r.netResult >= 0 ? "text-felt-400" : "text-chip-red"
                      }`}
                    >
                      {formatCurrency(r.netResult)}
                    </span>
                  </div>
                ))}
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href={`/games/${gameId}`}
                className="rounded-xl bg-gradient-to-b from-felt-500 to-felt-700 px-8 py-3 text-base font-bold text-white shadow-lg transition hover:from-felt-400 hover:to-felt-600"
              >
                Back to Lobby
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main poker table */}
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
