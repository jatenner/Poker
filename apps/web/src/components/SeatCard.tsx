"use client";

import type { SeatStatus } from "@poker/shared";

export interface SeatData {
  seatNumber: number;
  status: SeatStatus;
  userId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  stack?: number;
}

interface SeatCardProps {
  seat: SeatData;
  isCurrentUser: boolean;
  onTakeSeat: (seatNumber: number) => void;
  onLeaveSeat: (seatNumber: number) => void;
}

export default function SeatCard({
  seat,
  isCurrentUser,
  onTakeSeat,
  onLeaveSeat,
}: SeatCardProps) {
  const isEmpty = seat.status === "open";
  const isSittingOut = seat.status === "sitting-out";

  if (isEmpty) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-[var(--color-bg)]/50 p-3 transition hover:border-felt-600">
        <span className="mb-1 text-xs font-medium text-[var(--color-text-secondary)]">
          Seat {seat.seatNumber}
        </span>
        <button
          onClick={() => onTakeSeat(seat.seatNumber)}
          className="mt-2 rounded-lg bg-felt-700 px-4 py-1.5 text-xs font-semibold text-felt-200 transition hover:bg-felt-600"
        >
          Take Seat
        </button>
      </div>
    );
  }

  const initials =
    seat.displayName?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      className={`flex h-36 flex-col items-center justify-center rounded-xl border-2 p-3 transition ${
        isCurrentUser
          ? "border-felt-400 bg-felt-900/30"
          : isSittingOut
          ? "border-white/5 bg-[var(--color-bg)]/50 opacity-50"
          : "border-white/10 bg-[var(--color-bg-surface)]"
      }`}
    >
      <span className="mb-1 text-[10px] font-medium text-[var(--color-text-secondary)]">
        Seat {seat.seatNumber}
      </span>

      {/* Avatar */}
      {seat.avatarUrl ? (
        <img
          src={seat.avatarUrl}
          alt={seat.displayName ?? "Player"}
          className="mb-1 h-10 w-10 rounded-full object-cover"
        />
      ) : (
        <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-felt-800 text-sm font-bold text-felt-300">
          {initials}
        </span>
      )}

      {/* Name */}
      <span className="max-w-full truncate text-xs font-medium text-[var(--color-text-primary)]">
        {seat.displayName ?? "Player"}
      </span>

      {/* Stack */}
      {seat.stack !== undefined && (
        <span className="text-xs text-chip-gold">
          {seat.stack.toLocaleString()} chips
        </span>
      )}

      {/* Sitting out badge */}
      {isSittingOut && (
        <span className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">
          Sitting Out
        </span>
      )}

      {/* Leave button for current user */}
      {isCurrentUser && (
        <button
          onClick={() => onLeaveSeat(seat.seatNumber)}
          className="mt-1 rounded px-3 py-0.5 text-[10px] font-semibold text-chip-red transition hover:bg-chip-red/10"
        >
          Leave
        </button>
      )}
    </div>
  );
}
