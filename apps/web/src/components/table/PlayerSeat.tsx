"use client";

import type { PublicPlayerState, Card } from "@poker/shared";
import PlayingCard from "./PlayingCard";

interface PlayerSeatProps {
  player: PublicPlayerState | null;
  isCurrentUser: boolean;
  holeCards: Card[] | null;
  seatNumber: number;
}

function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ACTION_LABELS: Record<string, string> = {
  fold: "Fold",
  check: "Check",
  call: "Call",
  bet: "Bet",
  raise: "Raise",
  "all-in": "All-In",
};

export default function PlayerSeat({
  player,
  isCurrentUser,
  holeCards,
  seatNumber,
}: PlayerSeatProps) {
  // Empty seat
  if (!player) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/15 bg-white/5">
          <span className="text-xs text-white/25">{seatNumber + 1}</span>
        </div>
        <span className="mt-1 text-[10px] text-white/20">Empty</span>
      </div>
    );
  }

  const isFolded = player.isFolded;
  const isAllIn = player.isAllIn;
  const isTurn = player.isTurn;

  return (
    <div className={`relative flex flex-col items-center transition-opacity duration-300 ${isFolded ? "opacity-40" : "opacity-100"}`}>
      {/* Current bet (chips near table) */}
      {player.currentBet > 0 && (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 shadow-md">
            <div className="h-2.5 w-2.5 rounded-full bg-chip-gold shadow-sm" />
            <span className="text-[10px] font-bold text-chip-gold">
              {formatChips(player.currentBet)}
            </span>
          </div>
        </div>
      )}

      {/* Avatar container with turn indicator */}
      <div className="relative">
        {/* Turn glow ring */}
        {isTurn && (
          <div className="absolute -inset-1 rounded-full animate-pulse bg-chip-gold/40 blur-sm" />
        )}
        <div
          className={`
            relative h-12 w-12 overflow-hidden rounded-full border-2 shadow-lg
            ${isTurn ? "border-chip-gold shadow-chip-gold/30" : "border-white/20"}
            ${isAllIn ? "border-chip-red" : ""}
          `}
        >
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-felt-600 to-felt-800 text-sm font-bold text-white">
              {getInitials(player.displayName)}
            </div>
          )}

          {/* Folded overlay */}
          {isFolded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-[9px] font-bold uppercase text-white/70">Out</span>
            </div>
          )}
        </div>

        {/* Dealer button */}
        {player.isDealer && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-black text-black shadow-md ring-1 ring-black/10">
            D
          </div>
        )}

        {/* SB indicator */}
        {player.isSB && !player.isDealer && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-chip-blue text-[8px] font-bold text-white shadow-md">
            SB
          </div>
        )}

        {/* BB indicator */}
        {player.isBB && (
          <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-chip-gold text-[8px] font-bold text-black shadow-md">
            BB
          </div>
        )}

        {/* All-in badge */}
        {isAllIn && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-chip-red px-1.5 py-px text-[8px] font-bold uppercase text-white shadow-md">
            All-In
          </div>
        )}
      </div>

      {/* Name */}
      <div className={`mt-1.5 max-w-[72px] truncate text-center text-[11px] font-medium ${isCurrentUser ? "text-chip-gold" : "text-white/90"}`}>
        {isCurrentUser ? "You" : player.displayName}
      </div>

      {/* Stack */}
      <div className="text-[10px] font-semibold text-felt-300">
        {formatChips(player.stack)}
      </div>

      {/* Hole cards */}
      <div className="mt-1 flex gap-0.5">
        {isCurrentUser && holeCards && holeCards.length === 2 ? (
          <>
            <PlayingCard card={holeCards[0]} size="sm" />
            <PlayingCard card={holeCards[1]} size="sm" />
          </>
        ) : !isFolded ? (
          <>
            <PlayingCard card={null} faceDown size="sm" />
            <PlayingCard card={null} faceDown size="sm" />
          </>
        ) : null}
      </div>

      {/* Last action label */}
      {player.lastAction && !isFolded && (
        <div className="mt-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white/80 shadow">
          {ACTION_LABELS[player.lastAction] ?? player.lastAction}
          {player.lastAction === "bet" || player.lastAction === "raise"
            ? ` ${formatChips(player.currentBet)}`
            : ""}
        </div>
      )}
    </div>
  );
}
