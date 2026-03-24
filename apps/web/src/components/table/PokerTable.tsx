"use client";

import { useEffect, useRef, useState } from "react";
import type {
  PublicTableState,
  PublicPlayerState,
  Card,
  PlayerAction,
  LegalAction,
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
  legalActions: LegalAction[];
  actionLog?: ActionLogEntry[];
}

function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

/* ------------------------------------------------------------------
   Seat positions around the oval table (percentage of container).

   Layout with DEALER centered on felt:

        [1]              [2]
   [0]      [ DEALER ]        [3]
        [7]              [4]
           [6]     [5]
   ------------------------------------------------------------------ */

const SEAT_POSITIONS: { top: string; left: string; isBottom: boolean }[] = [
  { top: "46%", left: "0%", isBottom: false },     // 0: left
  { top: "2%", left: "16%", isBottom: false },      // 1: top-left
  { top: "2%", left: "84%", isBottom: false },      // 2: top-right
  { top: "46%", left: "100%", isBottom: false },    // 3: right
  { top: "84%", left: "84%", isBottom: true },      // 4: bottom-right
  { top: "94%", left: "62%", isBottom: true },      // 5: bottom-center-right
  { top: "94%", left: "38%", isBottom: true },      // 6: bottom-center-left
  { top: "84%", left: "16%", isBottom: true },      // 7: bottom-left
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

  // Track hand number changes for card dealing animation
  const prevHandRef = useRef(tableState.handNumber);
  const [dealingCards, setDealingCards] = useState(false);

  useEffect(() => {
    if (tableState.street !== prevStreet) {
      setPrevStreet(tableState.street);
      setIsDealing(true);
      const t = setTimeout(() => setIsDealing(false), 1200);
      return () => clearTimeout(t);
    }
  }, [tableState.street, prevStreet]);

  // Trigger dealing animation when a new hand starts
  useEffect(() => {
    if (tableState.handNumber > prevHandRef.current) {
      prevHandRef.current = tableState.handNumber;
      setDealingCards(true);
      // Total dealing time: ~2s (8 seats × 150ms × 2 rounds)
      const t = setTimeout(() => setDealingCards(false), 2400);
      return () => clearTimeout(t);
    }
  }, [tableState.handNumber]);

  // Track pot changes for glow animation
  const prevPotRef = useRef(tableState.pot);
  const [potGlow, setPotGlow] = useState(false);
  useEffect(() => {
    if (tableState.pot > prevPotRef.current) {
      setPotGlow(true);
      const t = setTimeout(() => setPotGlow(false), 1000);
      prevPotRef.current = tableState.pot;
      return () => clearTimeout(t);
    }
    prevPotRef.current = tableState.pot;
  }, [tableState.pot]);

  const seatMap = new Map<number, PublicPlayerState>();
  for (const p of players) seatMap.set(p.seatNumber, p);

  const totalMoney =
    players.reduce((s, p) => s + p.stack + p.currentBet, 0) + tableState.pot;

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
              ${formatChips(tableState.smallBlind)}
            </span>
            {" / "}
            <span className="font-semibold text-chip-gold">
              ${formatChips(tableState.bigBlind)}
            </span>
          </span>
        </div>

        {/* Center: POT */}
        <div className={`flex items-center gap-1.5 rounded-full bg-black/50 px-4 py-1 ring-1 transition-all duration-500 ${
          potGlow ? "ring-chip-gold/60 shadow-[0_0_12px_rgba(249,168,37,0.3)]" : "ring-chip-gold/20"
        }`}>
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
        <div className="relative aspect-[16/9] w-full max-w-[1100px]">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              {/* Community cards */}
              <CommunityCards
                cards={tableState.communityCards}
                street={tableState.street}
              />

              {/* Dealer avatar — centered on felt */}
              <div className={`relative ${isDealing || dealingCards ? "animate-pulse" : ""}`}>
                <div className="absolute -inset-1 rounded-full bg-chip-gold/10 blur-md" />
                <div
                  className="relative overflow-hidden rounded-full border-2 border-chip-gold/40 shadow-lg"
                  style={{ width: "40px", height: "40px" }}
                >
                  <img
                    src={DEALER_URL}
                    alt="Dealer"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-chip-gold to-yellow-600 px-1.5 py-px shadow">
                  <span className="text-[6px] font-black uppercase tracking-wider text-black">
                    Dealer
                  </span>
                </div>
              </div>

              {/* Pot on felt — always visible during active hands */}
              <div className={`flex items-center gap-2 rounded-full px-5 py-2 shadow-lg backdrop-blur-sm transition-all duration-500 ${
                tableState.pot > 0
                  ? "bg-black/40"
                  : "bg-black/20"
              } ${potGlow ? "shadow-[0_0_20px_rgba(249,168,37,0.25)]" : ""}`}>
                <div className="relative h-5 w-4 flex-shrink-0">
                  <div className="absolute bottom-0 left-0 h-4 w-4 rounded-full bg-gradient-to-br from-chip-red to-red-800 ring-1 ring-black/30" />
                  <div className="absolute bottom-1 left-0 h-4 w-4 rounded-full bg-gradient-to-br from-chip-gold to-yellow-700 ring-1 ring-black/30" />
                </div>
                <span className={`text-xl font-black transition-colors ${
                  tableState.pot > 0 ? "text-chip-gold" : "text-white/20"
                }`}>
                  ${formatChips(tableState.pot)}
                </span>
              </div>

              {tableState.pots.length > 1 && (
                <div className="flex gap-2">
                  {tableState.pots.map((sp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[10px] text-white/60"
                    >
                      <div className="h-2 w-2 rounded-full bg-chip-gold/60" />
                      <span className="font-semibold">
                        {i === 0 ? "Main" : `Side ${i}`}: ${formatChips(sp.amount)}
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

            // Stagger dealing animation: seat order from dealer
            const dealDelay = dealingCards ? seatIndex * 150 : undefined;

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
                  dealDelay={dealDelay}
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
          pot={tableState.pot}
          onAction={onAction}
        />
      )}

      {/* ===== ACTION LOG ===== */}
      {actionLog.length > 0 && <ActionLog actions={actionLog} />}
    </div>
  );
}
