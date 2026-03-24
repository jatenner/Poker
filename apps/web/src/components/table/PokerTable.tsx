"use client";

import { useEffect, useState } from "react";
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
  // Left side — pushed further out
  { top: "44%", left: "-4%", isBottom: false },
  // Top-left — more spread
  { top: "-2%", left: "14%", isBottom: false },
  // Top-center
  { top: "-6%", left: "50%", isBottom: false },
  // Top-right — more spread
  { top: "-2%", left: "86%", isBottom: false },
  // Right side — pushed further out
  { top: "44%", left: "104%", isBottom: false },
  // Bottom-right — more spread
  { top: "90%", left: "82%", isBottom: true },
  // Bottom-center
  { top: "96%", left: "50%", isBottom: true },
  // Bottom-left — more spread
  { top: "90%", left: "18%", isBottom: true },
];

/** Dealer character seated at the table */
function DealerAvatar({ isDealing }: { isDealing: boolean }) {
  // A fixed DiceBear dealer avatar — dark hair, bow tie, serious face
  const dealerUrl = "https://api.dicebear.com/9.x/avataaars/svg?top=shortFlat&hairColor=2c1b18&clothing=blazerAndShirt&clothesColor=262626&eyes=default&eyebrows=default&mouth=serious&skinColor=edb98a&backgroundColor=transparent&accessories=prescription01";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${isDealing ? "animate-pulse" : ""}`}>
        {/* Glow */}
        <div className="absolute -inset-2 rounded-full bg-chip-gold/10 blur-lg" />
        {/* Dealer avatar */}
        <div className="relative overflow-hidden rounded-full border-2 border-chip-gold/40 shadow-lg"
          style={{ width: "56px", height: "56px" }}
        >
          <img
            src={dealerUrl}
            alt="Dealer"
            className="h-full w-full object-cover"
          />
        </div>
        {/* DEALER badge */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-chip-gold to-yellow-600 px-2 py-0.5 shadow-md">
          <span className="text-[8px] font-black uppercase tracking-wider text-black">
            Dealer
          </span>
        </div>
      </div>
    </div>
  );
}

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

  // Track street changes for dealer dealing animation
  const [prevStreet, setPrevStreet] = useState(tableState.street);
  const [isDealing, setIsDealing] = useState(false);

  useEffect(() => {
    if (tableState.street !== prevStreet) {
      setPrevStreet(tableState.street);
      setIsDealing(true);
      const timer = setTimeout(() => setIsDealing(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [tableState.street, prevStreet]);

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
            {/* Chip stack icon in top bar */}
            <div className="relative h-4 w-3.5 flex-shrink-0">
              <div className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-gradient-to-br from-chip-red to-red-800 ring-1 ring-black/20" />
              <div className="absolute bottom-0.5 left-0.5 h-3 w-3 rounded-full bg-gradient-to-br from-chip-gold to-yellow-700 ring-1 ring-black/20" />
            </div>
            <span className="text-base font-black text-chip-gold">
              ${formatChips(tableState.pot)}
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
        <div className="relative aspect-[16/9] w-full max-w-[1000px]">
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
              {/* Dealer avatar - above community cards */}
              <DealerAvatar isDealing={isDealing} />

              {/* Community cards */}
              <CommunityCards
                cards={tableState.communityCards}
                street={tableState.street}
              />

              {/* Pot display on felt */}
              {tableState.pot > 0 && (
                <div className="mt-1 flex items-center gap-2.5 rounded-full bg-black/40 px-5 py-2 shadow-lg backdrop-blur-sm">
                  {/* Chip stack visual: 3 overlapping colored circles */}
                  <div className="relative h-6 w-5 flex-shrink-0">
                    <div className="absolute bottom-0 left-0 h-5 w-5 rounded-full bg-gradient-to-br from-chip-red to-red-800 ring-1 ring-black/30" />
                    <div className="absolute bottom-1 left-0 h-5 w-5 rounded-full bg-gradient-to-br from-chip-blue to-blue-800 ring-1 ring-black/30" />
                    <div className="absolute bottom-2 left-0 h-5 w-5 rounded-full bg-gradient-to-br from-chip-gold to-yellow-700 ring-1 ring-black/30" />
                  </div>
                  <span className="text-lg font-black text-chip-gold drop-shadow">
                    ${formatChips(tableState.pot)}
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
