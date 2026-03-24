"use client";

import type {
  PublicTableState,
  PublicPlayerState,
  Card,
  PlayerAction,
} from "@poker/shared";
import PlayerSeat from "./PlayerSeat";
import CommunityCards from "./CommunityCards";
import ActionPanel from "./ActionPanel";
import ActionLog, { type ActionLogEntry } from "./ActionLog";

interface PokerTableProps {
  tableState: PublicTableState;
  players: PublicPlayerState[];
  currentUserId: string;
  holeCards: Card[] | null;
  onAction: (action: PlayerAction, amount?: number) => void;
  legalActions: PlayerAction[];
  actionLog?: ActionLogEntry[];
}

function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

/**
 * 8 seat positions arranged around an oval table.
 * Positions are expressed as percentages of the table container.
 * Layout:
 *   Seats 0-2: top row (left-to-right)
 *   Seat 3: right side
 *   Seats 4-6: bottom row (right-to-left)
 *   Seat 7: left side
 */
const SEAT_POSITIONS: { top: string; left: string }[] = [
  // Top row
  { top: "2%", left: "20%" },
  { top: "0%", left: "50%" },
  { top: "2%", left: "80%" },
  // Right
  { top: "45%", left: "96%" },
  // Bottom row (reversed)
  { top: "88%", left: "80%" },
  { top: "90%", left: "50%" },
  { top: "88%", left: "20%" },
  // Left
  { top: "45%", left: "4%" },
];

export default function PokerTable({
  tableState,
  players,
  currentUserId,
  holeCards,
  onAction,
  legalActions,
  actionLog = [],
}: PokerTableProps) {
  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const isMyTurn = currentPlayer?.isTurn ?? false;

  // Build a seat-number -> player map
  const seatMap = new Map<number, PublicPlayerState>();
  for (const p of players) {
    seatMap.set(p.seatNumber, p);
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-bg">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_45%,rgba(27,94,32,0.15),transparent)]" />

      {/* Hand info */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-3">
        <div className="rounded-md bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/50 backdrop-blur-sm">
          Hand #{tableState.handNumber}
        </div>
      </div>

      {/* Pot display */}
      <div className="absolute right-4 top-4 z-10">
        <div className="rounded-md bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white/50 backdrop-blur-sm">
          Pot: <span className="text-chip-gold">{formatChips(tableState.pot)}</span>
          {tableState.pots.length > 1 && (
            <span className="ml-1 text-white/30">
              ({tableState.pots.length} pots)
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="relative w-full max-w-[800px] aspect-[16/10]">
        {/* Outer rail */}
        <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-table-border to-table-rail shadow-2xl" />

        {/* Inner rail bevel */}
        <div className="absolute inset-2 rounded-[50%] bg-gradient-to-b from-table-rail to-table-border shadow-inner" />

        {/* Felt surface */}
        <div className="absolute inset-4 overflow-hidden rounded-[50%] bg-gradient-to-br from-felt-600 via-table-surface to-felt-700 shadow-inner">
          {/* Felt texture pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.15) 2px, rgba(255,255,255,0.15) 3px)",
            }}
          />

          {/* Oval line decoration on felt */}
          <div className="absolute inset-10 rounded-[50%] border border-white/[0.06]" />

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            {/* Community cards */}
            <CommunityCards
              cards={tableState.communityCards}
              street={tableState.street}
            />

            {/* Pot in center */}
            {tableState.pot > 0 && (
              <div className="mt-1 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 shadow">
                <div className="h-3 w-3 rounded-full bg-gradient-to-br from-chip-gold to-yellow-700 shadow-sm" />
                <span className="text-xs font-bold text-chip-gold">
                  {formatChips(tableState.pot)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Player seats */}
        {SEAT_POSITIONS.map((pos, seatIndex) => {
          const player = seatMap.get(seatIndex) ?? null;
          const isCurrentUser = player?.userId === currentUserId;

          return (
            <div
              key={seatIndex}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: pos.top, left: pos.left }}
            >
              <PlayerSeat
                player={player}
                isCurrentUser={isCurrentUser}
                holeCards={isCurrentUser ? holeCards : null}
                seatNumber={seatIndex}
              />
            </div>
          );
        })}
      </div>

      {/* Action log */}
      {actionLog.length > 0 && (
        <div className="absolute bottom-24 right-4 z-10 w-64">
          <ActionLog actions={actionLog} />
        </div>
      )}

      {/* Action panel (only when it's our turn) */}
      {isMyTurn && currentPlayer && (
        <ActionPanel
          legalActions={legalActions}
          minBet={tableState.minBet ?? 0}
          maxBet={currentPlayer.stack}
          pot={tableState.pot}
          currentBet={tableState.minBet ?? 0}
          onAction={onAction}
        />
      )}
    </div>
  );
}
