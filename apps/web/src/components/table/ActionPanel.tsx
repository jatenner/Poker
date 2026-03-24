"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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

  // Reset bet amount when minBet changes
  useEffect(() => {
    setBetAmount(minBet);
  }, [minBet]);

  // Quick bet presets
  const presets = useMemo(() => {
    const list: { label: string; value: number }[] = [];
    if (minBet <= maxBet) {
      list.push({ label: "Min", value: minBet });
    }
    const halfPot = Math.max(Math.floor(pot * 0.5), minBet);
    const threeFourPot = Math.max(Math.floor(pot * 0.75), minBet);
    const fullPot = Math.max(pot, minBet);
    const twoPot = Math.max(pot * 2, minBet);

    if (halfPot <= maxBet && halfPot > minBet)
      list.push({ label: "1/2 Pot", value: halfPot });
    if (threeFourPot <= maxBet && threeFourPot !== halfPot && threeFourPot > minBet)
      list.push({ label: "3/4 Pot", value: threeFourPot });
    if (fullPot <= maxBet && fullPot !== threeFourPot && fullPot > minBet)
      list.push({ label: "Pot", value: fullPot });
    if (twoPot <= maxBet && twoPot > fullPot)
      list.push({ label: "2x Pot", value: twoPot });

    return list;
  }, [pot, minBet, maxBet]);

  const handleBetChange = useCallback(
    (value: number) => {
      setBetAmount(Math.max(sliderMin, Math.min(sliderMax, value)));
    },
    [sliderMin, sliderMax]
  );

  const handleBetSubmit = useCallback(() => {
    if (betAmount >= maxBet) {
      onAction("all-in", maxBet);
    } else if (canRaise) {
      onAction("raise", betAmount);
    } else {
      onAction("bet", betAmount);
    }
  }, [betAmount, maxBet, canRaise, onAction]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Glowing top edge to draw attention */}
      <div className="h-px bg-gradient-to-r from-transparent via-chip-gold/60 to-transparent" />

      <div className="border-t border-white/10 bg-[#111111]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-4 sm:px-6">
          {/* YOUR TURN indicator */}
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-chip-gold shadow-[0_0_8px] shadow-chip-gold/50" />
            <span className="text-sm font-bold uppercase tracking-widest text-chip-gold">
              Your Turn
            </span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-chip-gold shadow-[0_0_8px] shadow-chip-gold/50" />
          </div>

          {/* Bet slider row */}
          {showSlider && (
            <div className="flex flex-col gap-2">
              {/* Presets */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleBetChange(p.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      betAmount === p.value
                        ? "bg-chip-gold/25 text-chip-gold ring-1 ring-chip-gold/40"
                        : "bg-white/8 text-white/70 hover:bg-white/15 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={() => handleBetChange(maxBet)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    betAmount >= maxBet
                      ? "bg-chip-red/25 text-chip-red ring-1 ring-chip-red/40"
                      : "bg-chip-red/10 text-chip-red/80 hover:bg-chip-red/20 hover:text-chip-red"
                  }`}
                >
                  All-In
                </button>
              </div>

              {/* Slider + Input */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleBetChange(betAmount - (minBet || 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-lg font-bold text-white/60 transition hover:bg-white/15 hover:text-white"
                >
                  -
                </button>

                <div className="relative flex-1">
                  <input
                    type="range"
                    min={sliderMin}
                    max={sliderMax}
                    step={Math.max(1, Math.floor((sliderMax - sliderMin) / 100))}
                    value={betAmount}
                    onChange={(e) => handleBetChange(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-chip-gold"
                  />
                </div>

                <button
                  onClick={() => handleBetChange(betAmount + (minBet || 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-lg font-bold text-white/60 transition hover:bg-white/15 hover:text-white"
                >
                  +
                </button>

                {/* Amount display */}
                <input
                  type="number"
                  min={sliderMin}
                  max={sliderMax}
                  value={betAmount}
                  onChange={(e) => handleBetChange(Number(e.target.value))}
                  className="w-24 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-center text-sm font-bold text-white outline-none transition focus:border-chip-gold focus:ring-1 focus:ring-chip-gold/30"
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Fold */}
            {canFold && (
              <button
                onClick={() => onAction("fold")}
                className="flex-1 rounded-xl bg-gradient-to-b from-red-600 to-red-800 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all hover:from-red-500 hover:to-red-700 active:scale-[0.97]"
              >
                Fold
              </button>
            )}

            {/* Check */}
            {canCheck && (
              <button
                onClick={() => onAction("check")}
                className="flex-1 rounded-xl bg-gradient-to-b from-blue-600 to-blue-800 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all hover:from-blue-500 hover:to-blue-700 active:scale-[0.97]"
              >
                Check
              </button>
            )}

            {/* Call */}
            {canCall && (
              <button
                onClick={() => onAction("call", currentBet)}
                className="flex-1 rounded-xl bg-gradient-to-b from-felt-500 to-felt-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all hover:from-felt-400 hover:to-felt-600 active:scale-[0.97]"
              >
                Call {formatChips(currentBet)}
              </button>
            )}

            {/* Bet / Raise */}
            {showSlider && (
              <button
                onClick={handleBetSubmit}
                className="flex-1 rounded-xl bg-gradient-to-b from-yellow-500 to-yellow-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-black shadow-lg transition-all hover:from-yellow-400 hover:to-yellow-600 active:scale-[0.97]"
              >
                {betAmount >= maxBet
                  ? `All-In ${formatChips(maxBet)}`
                  : canRaise
                    ? `Raise ${formatChips(betAmount)}`
                    : `Bet ${formatChips(betAmount)}`}
              </button>
            )}

            {/* All-in (standalone when no slider) */}
            {canAllIn && !showSlider && (
              <button
                onClick={() => onAction("all-in", maxBet)}
                className="flex-1 rounded-xl bg-gradient-to-b from-red-500 to-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all hover:from-red-400 hover:to-red-600 active:scale-[0.97]"
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
