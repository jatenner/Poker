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

/* ------------------------------------------------------------------
   Seat positions around the oval table (percentage of container).

   Layout with DEALER at top center:

              [DEALER]
        [1]              [2]
   [0]                        [3]
        [7]              [4]
           [6]     [5]
   ------------------------------------------------------------------ */

const SEAT_POSITIONS: { top: string; left: string; isBottom: boolean }[] = [
  { top: "46%", left: "-3%", isBottom: false },   // 0: left
  { top: "2%", left: "16%", isBottom: false },     // 1: top-left
  { top: "2%", left: "84%", isBottom: false },     // 2: top-right
  { top: "46%", left: "103%", isBottom: false },   // 3: right
  { top: "84%", left: "84%", isBottom: true },     // 4: bottom-right
  { top: "94%", left: "60%", isBottom: true },     // 5: bottom-center-right
  { top: "94%", left: "40%", isBottom: true },     // 6: bottom-center-left
  { top: "84%", left: "16%", isBottom: true },     // 7: bottom-left
];

const DEALER_URL =
  "https://api.dicebear.com/9.x/avataaars/svg?top=shortFlat&hairColor=2c1b18&clothing=blazerAndShirt&clothesColor=262626&eyes=default&eyebrows=default&mouth=serious&skinColor=edb98a&accessories=prescription01&backgroundColor=transparent";

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

  // Track street changes for deal animation
  const [prevStreet, setPrevStreet] = useState(tableState.street);
  const [isDealing, setIsDealing] = useState(false);

  useEffect(() => {
    if (tableState.street !== prevStreet) {
      setPrevStreet(tableState.street);
      setIsDealing(true);
      const t = setTimeout(() => setIsDealing(false), 1200);
      return () => clearTimeout(t);
    }
  }, [tableState.street, prevStreet]);

  const seatMap = new Map<number, PublicPlayerState>();
  for (const p of players) seatMap.set(p.seatNumber, p);

  const totalMoney =
    players.reduce((s, p) => s + p.stack + p.currentBet, 0) + tableState.pot;

  // Find SB/BB seats
  const sbPlayer = players.find((p) => p.isSB);
  const bbPlayer = players.find((p) => p.isBB);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0a0a0a]">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_45%,rgba(27,94,32,0.12),transparent)]" />

      {/* ===== TOP INFO BAR ===== */}
      <div className="relative z-20 flex items-center justify-between border-b border-white/8 bg-black/60 px-3 py-2 backdrop-blur-sm sm:px-5">
        {/* Left: Hand + Street + Blinds */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-felt-400 shadow-[0_0_6px] shadow-felt-400/50" />
            <span className="text-xs font-bold text-white/80">
              #{tableState.handNumber}
            </span>
          </div>

          <span className="rounded bg-white/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
            {tableState.street === "preflop" ? "PRE-FLOP" : tableState.street}
          </span>

          <span className="text-[10px] text-white/40">
            Blinds{" "}
            <span className="font-semibold text-chip-blue">
              {sbPlayer ? formatChips(tableState.minBet ?? 1) : "?"}
            </span>
            {" / "}
            <span className="font-semibold text-chip-gold">
              {bbPlayer ? formatChips((tableState.minBet ?? 1) * 2) : "?"}
            </span>
          </span>
        </div>

        {/* Center: POT */}
        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-1 ring-1 ring-chip-gold/20">
          <span className="text-[10px] font-bold uppercase text-white/40">Pot</span>
          <span className="text-sm font-black text-chip-gold">
            ${formatChips(tableState.pot)}
          </span>
        </div>

        {/* Right: Table total */}
        <div className="flex items-center gap-2 text-[10px] text-white/40">
          <span>
            <span className="font-semibold text-white/60">
              {players.filter((p) => !p.isFolded).length}
            </span>
            /{players.length} active
          </span>
          <span className="hidden sm:inline rounded bg-white/5 px-2 py-0.5 font-semibold text-white/50">
            Table ${formatChips(totalMoney)}
          </span>
        </div>
      </div>

      {/* ===== TABLE AREA ===== */}
      <div className="relative flex flex-1 items-center justify-center px-2 py-2">
        <div className="relative aspect-[16/9] w-full max-w-[1000px]">
          {/* Rail */}
          <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-[#6d4c41] via-table-rail to-[#3e2723] shadow-[0_8px_32px_rgba(0,0,0,0.6)]" />
          <div className="absolute inset-[6px] rounded-[50%] bg-gradient-to-b from-table-rail to-table-border shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)]" />

          {/* Felt */}
          <div className="absolute inset-[12px] overflow-hidden rounded-[50%] bg-gradient-to-br from-felt-600 via-table-surface to-felt-700 shadow-[inset_0_4px_16px_rgba(0,0,0,0.3)]">
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.12) 2px,rgba(255,255,255,0.12) 3px),repeating-linear-gradient(90deg,transparent,transparent 2px,rgba(255,255,255,0.12) 2px,rgba(255,255,255,0.12) 3px)",
              }}
            />
            <div className="absolute inset-12 rounded-[50%] border border-white/[0.05]" />

            {/* ===== CENTER CONTENT ===== */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              {/* Community cards */}
              <CommunityCards
                cards={tableState.communityCards}
                street={tableState.street}
              />

              {/* Pot on felt */}
              {tableState.pot > 0 && (
                <div className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 shadow-lg backdrop-blur-sm">
                  <div className="relative h-5 w-4 flex-shrink-0">
                    <div className="absolute bottom-0 left-0 h-4 w-4 rounded-full bg-gradient-to-br from-chip-red to-red-800 ring-1 ring-black/30" />
                    <div className="absolute bottom-1 left-0 h-4 w-4 rounded-full bg-gradient-to-br from-chip-gold to-yellow-700 ring-1 ring-black/30" />
                  </div>
                  <span className="text-base font-black text-chip-gold">
                    ${formatChips(tableState.pot)}
                  </span>
                </div>
              )}

              {tableState.pots.length > 1 && (
                <div className="flex gap-2">
                  {tableState.pots.map((sp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[10px] text-white/60"
                    >
                      <div className="h-2 w-2 rounded-full bg-chip-gold/60" />
                      <span className="font-semibold">
                        Side {i + 1}: {formatChips(sp.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ===== DEALER SEAT (top center) ===== */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ top: "-4%", left: "50%" }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className={`relative ${isDealing ? "animate-pulse" : ""}`}>
                <div className="absolute -inset-1 rounded-full bg-chip-gold/10 blur-md" />
                <div
                  className="relative overflow-hidden rounded-full border-2 border-chip-gold/50 shadow-lg"
                  style={{ width: "52px", height: "52px" }}
                >
                  <img
                    src={DEALER_URL}
                    alt="Dealer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-chip-gold to-yellow-600 px-2 py-px shadow">
                  <span className="text-[7px] font-black uppercase tracking-wider text-black">
                    Dealer
                  </span>
                </div>
              </div>
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
                  seatNumber={seatIndex}
                  isCurrentUser={isCurrentUser}
                  holeCards={isCurrentUser ? holeCards : null}
                  isBottom={pos.isBottom}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== ACTION PANEL (only when it's your turn) ===== */}
      {isMyTurn && legalActions.length > 0 && (
        <ActionPanel
          legalActions={legalActions}
          minBet={tableState.minBet ?? 2}
          maxBet={currentPlayer?.stack ?? 0}
          pot={tableState.pot}
          currentBet={
            Math.max(...players.map((p) => p.currentBet)) -
            (currentPlayer?.currentBet ?? 0)
          }
          onAction={onAction}
        />
      )}

      {/* ===== ACTION LOG ===== */}
      {actionLog.length > 0 && <ActionLog actions={actionLog} />}
    </div>
  );
}
