"use client";

import { useState, useMemo, useCallback } from "react";
import type { PlayerAction } from "@poker/shared";

interface ActionPanelProps {
  legalActions: PlayerAction[];
  minBet: number;
  maxBet: number;
  pot: number;
  currentBet: number;
  onAction: (action: PlayerAction, amount?: number) => void;
}

function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

export default function ActionPanel({
  legalActions,
  minBet,
  maxBet,
  pot,
  currentBet,
  onAction,
}: ActionPanelProps) {
  const canFold = legalActions.includes("fold");
  const canCheck = legalActions.includes("check");
  const canCall = legalActions.includes("call");
  const canBet = legalActions.includes("bet");
  const canRaise = legalActions.includes("raise");
  const canAllIn = legalActions.includes("all-in");

  const showSlider = canBet || canRaise;
  const sliderMin = minBet;
  const sliderMax = maxBet;

  const [betAmount, setBetAmount] = useState(minBet);

  // Quick bet presets
  const presets = useMemo(() => {
    const list: { label: string; value: number }[] = [];
    const halfPot = Math.max(Math.floor(pot * 0.5), minBet);
    const threeFourPot = Math.max(Math.floor(pot * 0.75), minBet);
    const fullPot = Math.max(pot, minBet);

    if (halfPot <= maxBet) list.push({ label: "1/2", value: halfPot });
    if (threeFourPot <= maxBet && threeFourPot !== halfPot)
      list.push({ label: "3/4", value: threeFourPot });
    if (fullPot <= maxBet && fullPot !== threeFourPot)
      list.push({ label: "Pot", value: fullPot });

    return list;
  }, [pot, minBet, maxBet]);

  const handleBetChange = useCallback((value: number) => {
    setBetAmount(Math.max(sliderMin, Math.min(sliderMax, value)));
  }, [sliderMin, sliderMax]);

  const handleBetSubmit = useCallback(() => {
    if (betAmount >= maxBet) {
      onAction("all-in", maxBet);
    } else if (canRaise) {
      onAction("raise", betAmount);
    } else {
      onAction("bet", betAmount);
    }
  }, [betAmount, maxBet, canRaise, onAction]);

  // Timer bar (cosmetic)
  const timerWidth = 75; // percentage, cosmetic for now

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Timer bar */}
      <div className="h-1 bg-black/40">
        <div
          className="h-full bg-gradient-to-r from-chip-gold to-chip-red transition-all duration-1000"
          style={{ width: `${timerWidth}%` }}
        />
      </div>

      <div className="border-t border-white/10 bg-bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3">
          {/* Bet slider row */}
          {showSlider && (
            <div className="flex items-center gap-3">
              {/* Quick presets */}
              <div className="flex gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleBetChange(p.value)}
                    className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/20"
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={() => handleBetChange(maxBet)}
                  className="rounded-md bg-chip-red/20 px-2.5 py-1 text-[11px] font-semibold text-chip-red transition hover:bg-chip-red/30"
                >
                  All-In
                </button>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={sliderMin}
                max={sliderMax}
                value={betAmount}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-chip-gold"
              />

              {/* Amount input */}
              <input
                type="number"
                min={sliderMin}
                max={sliderMax}
                value={betAmount}
                onChange={(e) => handleBetChange(Number(e.target.value))}
                className="w-20 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-center text-sm font-bold text-white outline-none focus:border-chip-gold"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Fold */}
            {canFold && (
              <button
                onClick={() => onAction("fold")}
                className="flex-1 rounded-lg bg-chip-red/90 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-chip-red active:scale-[0.97]"
              >
                Fold
              </button>
            )}

            {/* Check */}
            {canCheck && (
              <button
                onClick={() => onAction("check")}
                className="flex-1 rounded-lg bg-chip-blue/90 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-chip-blue active:scale-[0.97]"
              >
                Check
              </button>
            )}

            {/* Call */}
            {canCall && (
              <button
                onClick={() => onAction("call", currentBet)}
                className="flex-1 rounded-lg bg-felt-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-felt-400 active:scale-[0.97]"
              >
                Call {formatChips(currentBet)}
              </button>
            )}

            {/* Bet / Raise */}
            {showSlider && (
              <button
                onClick={handleBetSubmit}
                className="flex-1 rounded-lg bg-chip-gold px-4 py-2.5 text-sm font-black text-black shadow-md transition hover:brightness-110 active:scale-[0.97]"
              >
                {betAmount >= maxBet
                  ? "All-In"
                  : canRaise
                    ? `Raise ${formatChips(betAmount)}`
                    : `Bet ${formatChips(betAmount)}`}
              </button>
            )}

            {/* All-in (if no slider but all-in is legal) */}
            {canAllIn && !showSlider && (
              <button
                onClick={() => onAction("all-in", maxBet)}
                className="flex-1 rounded-lg bg-chip-red px-4 py-2.5 text-sm font-black text-white shadow-md transition hover:brightness-110 active:scale-[0.97]"
              >
                All-In {formatChips(maxBet)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
