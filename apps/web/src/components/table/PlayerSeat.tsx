"use client";

import type { PublicPlayerState, Card } from "@poker/shared";
import PlayingCard from "./PlayingCard";
import AvatarDisplay from "@/components/AvatarDisplay";

interface PlayerSeatProps {
  player: PublicPlayerState | null;
  isCurrentUser: boolean;
  holeCards: Card[] | null;
  seatNumber: number;
  /** Whether this seat position is at the bottom of the table (for card placement) */
  isBottom?: boolean;
}

function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

const ACTION_LABELS: Record<string, string> = {
  fold: "Fold",
  check: "Check",
  call: "Call",
  bet: "Bet",
  raise: "Raise",
  "all-in": "ALL-IN",
};

export default function PlayerSeat({
  player,
  isCurrentUser,
  holeCards,
  seatNumber,
  isBottom = false,
}: PlayerSeatProps) {
  // Empty seat - person silhouette
  if (!player) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-dashed border-white/10 bg-white/[0.03]">
          {/* Person silhouette SVG */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            className="text-white/15"
          >
            <circle cx="12" cy="8" r="4" fill="currentColor" />
            <path
              d="M4 21c0-4.418 3.582-8 8-8s8 3.582 8 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        <span className="text-[10px] font-medium text-white/15">Open</span>
      </div>
    );
  }

  const isFolded = player.isFolded;
  const isAllIn = player.isAllIn;
  const isTurn = player.isTurn;

  // Cards to show
  const showFaceUp = isCurrentUser && holeCards && holeCards.length === 2;
  const showFaceDown = !isFolded && !showFaceUp;
  const cardSize = isCurrentUser ? "sm" : "xs";

  return (
    <div
      className={`relative flex flex-col items-center transition-all duration-300 ${
        isFolded ? "opacity-35 grayscale-[40%]" : "opacity-100"
      }`}
    >
      {/* Current bet (chip stack + amount, positioned toward table center) */}
      {player.currentBet > 0 && (
        <div
          className={`absolute left-1/2 z-10 -translate-x-1/2 ${
            isBottom ? "-top-10" : "-bottom-10"
          }`}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 shadow-lg backdrop-blur-sm">
            {/* Mini chip stack: 2-3 overlapping colored circles */}
            <div className="relative h-5 w-4 flex-shrink-0">
              <div className="absolute bottom-0 left-0 h-4 w-4 rounded-full bg-gradient-to-br from-chip-red to-red-800 ring-1 ring-black/30" />
              <div className="absolute bottom-1 left-0 h-4 w-4 rounded-full bg-gradient-to-br from-chip-blue to-blue-800 ring-1 ring-black/30" />
              <div className="absolute bottom-2 left-0 h-4 w-4 rounded-full bg-gradient-to-br from-chip-gold to-yellow-700 ring-1 ring-black/30" />
            </div>
            <span className="text-sm font-bold text-chip-gold">
              {formatChips(player.currentBet)}
            </span>
          </div>
        </div>
      )}

      {/* Hole cards - shown above avatar for current user, below for others */}
      {isCurrentUser && showFaceUp && (
        <div className="mb-1 flex gap-1">
          <PlayingCard card={holeCards![0]} size={cardSize} />
          <PlayingCard card={holeCards![1]} size={cardSize} />
        </div>
      )}

      {/* Main player container */}
      <div className="relative">
        {/* Turn glow effect */}
        {isTurn && (
          <>
            <div className="absolute -inset-3 animate-pulse rounded-full bg-chip-gold/30 blur-md" />
            <div className="absolute -inset-1.5 rounded-full bg-chip-gold/20 blur-sm" />
          </>
        )}

        {/* Avatar circle - 72px */}
        <div
          className={`relative overflow-hidden rounded-full border-[2.5px] shadow-lg transition-all duration-300 ${
            isTurn
              ? "border-chip-gold shadow-chip-gold/40"
              : isAllIn
                ? "border-chip-red shadow-chip-red/30"
                : isCurrentUser
                  ? "border-felt-400/60"
                  : "border-white/15"
          }`}
        >
          <AvatarDisplay
            avatarUrl={player.avatarUrl}
            displayName={player.displayName}
            size="seat"
          />

          {/* Folded overlay */}
          {isFolded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                Fold
              </span>
            </div>
          )}
        </div>

        {/* Dealer button - 28px */}
        {player.isDealer && (
          <div className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white font-mono text-[11px] font-black text-black shadow-md ring-2 ring-black/10">
            D
          </div>
        )}

        {/* SB badge - 28px */}
        {player.isSB && !player.isDealer && (
          <div className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-chip-blue text-[9px] font-bold text-white shadow-md">
            SB
          </div>
        )}

        {/* BB badge - 28px */}
        {player.isBB && (
          <div className="absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-chip-gold text-[9px] font-bold text-black shadow-md">
            BB
          </div>
        )}

        {/* All-in badge */}
        {isAllIn && !isFolded && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-chip-red px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white shadow-lg ring-1 ring-chip-red/50">
            ALL-IN
          </div>
        )}
      </div>

      {/* Name plate */}
      <div
        className={`mt-1.5 max-w-[100px] truncate text-center text-[13px] font-bold ${
          isCurrentUser ? "text-chip-gold" : "text-white/90"
        }`}
      >
        {isCurrentUser ? "You" : player.displayName}
      </div>

      {/* Stack */}
      <div className="flex items-center gap-1 text-sm font-bold text-felt-300">
        <span>🪙</span>
        {formatChips(player.stack)}
      </div>

      {/* Face-down cards for other players */}
      {!isCurrentUser && showFaceDown && (
        <div className="mt-1 flex gap-0.5">
          <PlayingCard card={null} faceDown size="xs" />
          <PlayingCard card={null} faceDown size="xs" />
        </div>
      )}

      {/* Last action bubble */}
      {player.lastAction && !isFolded && (
        <div className="mt-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-white/80 shadow backdrop-blur-sm">
          {ACTION_LABELS[player.lastAction] ?? player.lastAction}
          {(player.lastAction === "bet" || player.lastAction === "raise") &&
          player.currentBet > 0
            ? ` ${formatChips(player.currentBet)}`
            : ""}
        </div>
      )}
    </div>
  );
}
