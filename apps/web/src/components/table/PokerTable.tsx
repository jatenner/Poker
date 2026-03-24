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
 * Seat positions around the oval table.
 * Expressed as percentages of the table area.
 *
 * Layout for 8 seats (like PokerStars):
 *
 *        [1]     [2]     [3]
 *   [0]                        [4]
 *        [7]     [6]     [5]
 *
 * Current user (seat 5 or 6) is at the bottom center.
 */
const SEAT_POSITIONS: { top: string; left: string; isBottom: boolean }[] = [
  // Left side
  { top: "42%", left: "1%", isBottom: false },
  // Top-left
  { top: "4%", left: "18%", isBottom: false },
  // Top-center
  { top: "0%", left: "50%", isBottom: false },
  // Top-right
  { top: "4%", left: "82%", isBottom: false },
  // Right side
  { top: "42%", left: "99%", isBottom: false },
  // Bottom-right
  { top: "85%", left: "78%", isBottom: true },
  // Bottom-center
  { top: "92%", left: "50%", isBottom: true },
  // Bottom-left
  { top: "85%", left: "22%", isBottom: true },
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

  // Compute total money on table
  const totalMoney = players.reduce((sum, p) => sum + p.stack + p.currentBet, 0) + tableState.pot;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(27,94,32,0.12),transparent)]" />

      {/* ===== TOP INFO BAR ===== */}
      <div className="relative z-20 flex items-center justify-between border-b border-white/8 bg-black/50 px-4 py-2 backdrop-blur-sm sm:px-6">
        {/* Left: Game info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-felt-400 shadow-[0_0_6px] shadow-felt-400/50" />
            <span className="text-sm font-bold text-white/90">
              Hand #{tableState.handNumber}
            </span>
          </div>
          <div className="hidden text-xs text-white/40 sm:block">
            {tableState.street !== "preflop" && (
              <span className="rounded bg-white/8 px-2 py-0.5 font-semibold uppercase tracking-wider">
                {tableState.street}
              </span>
            )}
          </div>
        </div>

        {/* Center: Pot */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-4 py-1.5 ring-1 ring-white/10">
            <div className="h-3.5 w-3.5 rounded-full bg-gradient-to-br from-chip-gold to-yellow-700 shadow-sm" />
            <span className="text-sm font-black text-chip-gold">
              {formatChips(tableState.pot)}
            </span>
            {tableState.pots.length > 1 && (
              <span className="ml-1 text-xs text-white/30">
                ({tableState.pots.length} pots)
              </span>
            )}
          </div>
        </div>

        {/* Right: Table money */}
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span>
            Players: <span className="font-semibold text-white/60">{players.filter(p => !p.isFolded).length}/{players.length}</span>
          </span>
          <span className="hidden sm:inline">
            Table: <span className="font-semibold text-white/60">${formatChips(totalMoney)}</span>
          </span>
        </div>
      </div>

      {/* ===== MAIN TABLE AREA ===== */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-4">
        {/* Table container - responsive */}
        <div className="relative aspect-[16/9] w-full max-w-[900px]">
          {/* Outer rail - wood brown */}
          <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-[#6d4c41] via-table-rail to-[#3e2723] shadow-[0_8px_32px_rgba(0,0,0,0.6)]" />

          {/* Inner rail bevel */}
          <div className="absolute inset-[6px] rounded-[50%] bg-gradient-to-b from-table-rail to-table-border shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]" />

          {/* Felt surface */}
          <div className="absolute inset-[12px] overflow-hidden rounded-[50%] bg-gradient-to-br from-felt-600 via-table-surface to-felt-700 shadow-[inset_0_4px_16px_rgba(0,0,0,0.3)]">
            {/* Felt texture pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.12) 2px, rgba(255,255,255,0.12) 3px), repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.12) 2px, rgba(255,255,255,0.12) 3px)",
              }}
            />

            {/* Oval line decoration */}
            <div className="absolute inset-12 rounded-[50%] border border-white/[0.05]" />

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              {/* Community cards */}
              <CommunityCards
                cards={tableState.communityCards}
                street={tableState.street}
              />

              {/* Pot display on felt */}
              {tableState.pot > 0 && (
                <div className="mt-1 flex items-center gap-2 rounded-full bg-black/35 px-4 py-1.5 shadow-lg backdrop-blur-sm">
                  <div className="h-4 w-4 rounded-full bg-gradient-to-br from-chip-gold to-yellow-700 shadow-sm ring-1 ring-black/20" />
                  <span className="text-base font-black text-chip-gold drop-shadow">
                    {formatChips(tableState.pot)}
                  </span>
                </div>
              )}

              {/* Side pots */}
              {tableState.pots.length > 1 && (
                <div className="flex gap-2">
                  {tableState.pots.map((sidePot, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-0.5 text-[10px] text-white/60"
                    >
                      <div className="h-2 w-2 rounded-full bg-chip-gold/60" />
                      <span className="font-semibold">
                        Side {i + 1}: {formatChips(sidePot.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ===== PLAYER SEATS ===== */}
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
                  isBottom={pos.isBottom}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== ACTION LOG (right side) ===== */}
      {actionLog.length > 0 && (
        <div className="absolute bottom-28 right-3 z-10 w-72 sm:right-5">
          <ActionLog actions={actionLog} />
        </div>
      )}

      {/* ===== ACTION PANEL (bottom, only when it's our turn) ===== */}
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
