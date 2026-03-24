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

  // Hand result display — show for 6 seconds then dismiss
  const handResultRef = useRef(handResult);
  handResultRef.current = handResult;
  const [showHandResult, setShowHandResult] = useState(false);
  const [betweenHands, setBetweenHands] = useState(false);

  useEffect(() => {
    if (handResult && handResult.winners && handResult.winners.length > 0) {
      console.log("[PlayPage] Showing hand result:", handResult.winners.length, "winners");
      setShowHandResult(true);
      setBetweenHands(false);
      const hideTimer = setTimeout(() => {
        setShowHandResult(false);
        setBetweenHands(true);
      }, 6000);
      return () => clearTimeout(hideTimer);
    } else {
      setShowHandResult(false);
    }
  }, [handResult]);

  // Clear "between hands" when a new hand starts
  useEffect(() => {
    if (tableState?.handNumber) {
      setBetweenHands(false);
    }
  }, [tableState?.handNumber]);

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

      {/* ===== WINNER CELEBRATION OVERLAY ===== */}
      {showHandResult && handResult && handResult.winners && handResult.winners.length > 0 && (() => {
        const mainWinner = handResult.winners[0];
        const winnerPlayer = players.find((p) => p.userId === mainWinner.userId);
        const isYou = mainWinner.userId === currentUserId;
        const winnerName = isYou ? "You" : (winnerPlayer?.displayName ?? "Player");

        return (
          <div className="absolute inset-0 z-[55] flex items-center justify-center pointer-events-none">
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.3s_ease-out]" />

            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti"
                  style={{
                    left: `${5 + Math.random() * 90}%`,
                    top: "-5%",
                    width: `${6 + Math.random() * 8}px`,
                    height: `${6 + Math.random() * 8}px`,
                    backgroundColor: ["#f9a825", "#e53935", "#1e88e5", "#43a047", "#ab47bc", "#ff7043", "#ffffff"][i % 7],
                    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    animationDelay: `${Math.random() * 1.5}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* Winner card */}
            <div className="pointer-events-auto relative animate-scale-pop">
              <div className="flex flex-col items-center gap-4">
                {/* Pulsing rings behind avatar */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-winner-ring bg-chip-gold/30" style={{ width: 120, height: 120, margin: "auto", top: 0, left: 0, right: 0, bottom: 0 }} />
                  <div className="absolute inset-0 rounded-full animate-winner-ring bg-chip-gold/20" style={{ width: 120, height: 120, margin: "auto", top: 0, left: 0, right: 0, bottom: 0, animationDelay: "0.5s" }} />

                  {/* Avatar with gold ring */}
                  <div className="relative">
                    <div className="absolute -inset-3 rounded-full bg-chip-gold/25 blur-xl" />
                    <div className="relative overflow-hidden rounded-full border-4 border-chip-gold shadow-[0_0_40px_rgba(249,168,37,0.5)]" style={{ width: 100, height: 100 }}>
                      <AvatarDisplay
                        avatarUrl={winnerPlayer?.avatarUrl}
                        displayName={winnerName}
                        size="xl"
                      />
                    </div>
                    {/* Trophy */}
                    <div className="absolute -top-3 -right-3 text-4xl animate-bounce drop-shadow-lg">🏆</div>
                    {/* Stars */}
                    <div className="absolute -top-1 -left-3 text-2xl animate-pulse">⭐</div>
                    <div className="absolute -bottom-2 -right-1 text-xl animate-pulse" style={{ animationDelay: "0.3s" }}>✨</div>
                  </div>
                </div>

                {/* Info card */}
                <div className="animate-slide-up rounded-2xl border border-chip-gold/40 bg-[#111]/95 backdrop-blur-lg px-10 py-5 text-center shadow-[0_0_60px_rgba(249,168,37,0.15)]">
                  {/* Winner name */}
                  <div className="text-2xl font-black text-white mb-1">
                    {isYou ? "🎉 You Win! 🎉" : `${winnerName} Wins!`}
                  </div>

                  {/* Winning hand */}
                  {mainWinner.hand && (
                    <div className="inline-block rounded-full bg-chip-gold/15 px-4 py-1 text-sm font-bold text-chip-gold mb-3">
                      🃏 {mainWinner.hand}
                    </div>
                  )}

                  {/* Chips won */}
                  <div className="text-3xl font-black text-chip-gold mt-1">
                    💰 +{formatChips(mainWinner.amount)}
                  </div>
                  <div className="text-xs text-white/40 mt-1">chips won</div>

                  {/* Split pot */}
                  {handResult.winners.length > 1 && (
                    <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                      <div className="text-xs font-bold text-white/50 uppercase">Split Pot</div>
                      {handResult.winners.slice(1).map((w, i) => {
                        const p = players.find((pl) => pl.userId === w.userId);
                        return (
                          <div key={i} className="flex items-center justify-between text-sm px-2">
                            <span className="text-white/70">{w.userId === currentUserId ? "You" : (p?.displayName ?? "Player")}</span>
                            <span className="text-chip-gold font-black">+{formatChips(w.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Next hand */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-felt-400" />
                    <span className="text-xs text-white/30 font-medium">Next hand dealing...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Between hands indicator */}
      {betweenHands && !showHandResult && (
        <div className="absolute inset-x-0 top-20 z-[50] flex justify-center pointer-events-none animate-[fadeIn_0.3s_ease-out]">
          <div className="rounded-2xl border border-felt-500/30 bg-[#111]/90 px-8 py-4 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-felt-400 border-t-transparent" />
              <span className="text-base font-bold text-felt-300">
                Dealing next hand...
              </span>
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
