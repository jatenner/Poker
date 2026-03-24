"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { PlayerAction, LegalAction } from "@poker/shared";

interface ActionPanelProps {
  legalActions: LegalAction[];
  pot: number;
  onAction: (action: PlayerAction, amount?: number) => void;
}

function formatChips(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

export default function ActionPanel({
  legalActions,
  pot,
  onAction,
}: ActionPanelProps) {
  // Derive capabilities from server-authoritative LegalAction objects
  const foldAction = legalActions.find((a) => a.action === "fold");
  const checkAction = legalActions.find((a) => a.action === "check");
  const callAction = legalActions.find((a) => a.action === "call");
  const betAction = legalActions.find((a) => a.action === "bet");
  const raiseAction = legalActions.find((a) => a.action === "raise");
  const allInAction = legalActions.find((a) => a.action === "all-in");

  const canFold = !!foldAction;
  const canCheck = !!checkAction;
  const canCall = !!callAction;
  const canBet = !!betAction;
  const canRaise = !!raiseAction;
  const canAllIn = !!allInAction;

  // Slider for bet or raise
  const showSlider = canBet || canRaise;
  const sliderAction = betAction ?? raiseAction;
  const sliderMin = sliderAction?.minAmount ?? 0;
  const sliderMax = sliderAction?.maxAmount ?? 0;

  // Call amount from server
  const callAmount = callAction?.minAmount ?? 0;

  const [betAmount, setBetAmount] = useState(sliderMin);

  // Reset bet amount when slider bounds change
  useEffect(() => {
    setBetAmount(sliderMin);
  }, [sliderMin]);

  // Quick bet presets
  const presets = useMemo(() => {
    const list: { label: string; value: number }[] = [];
    if (sliderMin <= sliderMax) {
      list.push({ label: "Min", value: sliderMin });
    }
    const halfPot = Math.max(Math.floor(pot * 0.5), sliderMin);
    const threeFourPot = Math.max(Math.floor(pot * 0.75), sliderMin);
    const fullPot = Math.max(pot, sliderMin);
    const twoPot = Math.max(pot * 2, sliderMin);

    if (halfPot <= sliderMax && halfPot > sliderMin)
      list.push({ label: "1/2 Pot", value: halfPot });
    if (threeFourPot <= sliderMax && threeFourPot !== halfPot && threeFourPot > sliderMin)
      list.push({ label: "3/4 Pot", value: threeFourPot });
    if (fullPot <= sliderMax && fullPot !== threeFourPot && fullPot > sliderMin)
      list.push({ label: "Pot", value: fullPot });
    if (twoPot <= sliderMax && twoPot > fullPot)
      list.push({ label: "2x Pot", value: twoPot });

    return list;
  }, [pot, sliderMin, sliderMax]);

  const handleBetChange = useCallback(
    (value: number) => {
      setBetAmount(Math.max(sliderMin, Math.min(sliderMax, value)));
    },
    [sliderMin, sliderMax]
  );

  const handleBetSubmit = useCallback(() => {
    if (betAmount >= sliderMax) {
      onAction("all-in", sliderMax);
    } else if (canRaise) {
      onAction("raise", betAmount);
    } else {
      onAction("bet", betAmount);
    }
  }, [betAmount, sliderMax, canRaise, onAction]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Glowing top edge to draw attention */}
      <div className="h-px bg-gradient-to-r from-transparent via-chip-gold/60 to-transparent" />

      <div className="border-t border-white/10 bg-[#111111]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-3 py-2.5 sm:px-5">

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
                  onClick={() => handleBetChange(sliderMax)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    betAmount >= sliderMax
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
                  onClick={() => handleBetChange(betAmount - (sliderMin || 1))}
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
                  onClick={() => handleBetChange(betAmount + (sliderMin || 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/8 text-lg font-bold text-white/60 transition hover:bg-white/15 hover:text-white"
                >
                  +
                </button>

                {/* Amount display */}
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40">$</span>
                  <input
                    type="number"
                    min={sliderMin}
                    max={sliderMax}
                    value={betAmount}
                    onChange={(e) => handleBetChange(Number(e.target.value))}
                    className="w-28 rounded-lg border border-white/10 bg-black/40 pl-6 pr-3 py-1.5 text-center text-sm font-bold text-white outline-none transition focus:border-chip-gold focus:ring-1 focus:ring-chip-gold/30"
                  />
                </div>
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
                onClick={() => onAction("call", callAmount)}
                className="flex-1 rounded-xl bg-gradient-to-b from-felt-500 to-felt-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all hover:from-felt-400 hover:to-felt-600 active:scale-[0.97]"
              >
                Call ${formatChips(callAmount)}
              </button>
            )}

            {/* Bet / Raise */}
            {showSlider && (
              <button
                onClick={handleBetSubmit}
                className="flex-1 rounded-xl bg-gradient-to-b from-yellow-500 to-yellow-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-black shadow-lg transition-all hover:from-yellow-400 hover:to-yellow-600 active:scale-[0.97]"
              >
                {betAmount >= sliderMax
                  ? `All-In $${formatChips(sliderMax)}`
                  : canRaise
                    ? `Raise $${formatChips(betAmount)}`
                    : `Bet $${formatChips(betAmount)}`}
              </button>
            )}

            {/* All-in (standalone when no slider) */}
            {canAllIn && !showSlider && (
              <button
                onClick={() => onAction("all-in", allInAction!.maxAmount)}
                className="flex-1 rounded-xl bg-gradient-to-b from-red-500 to-red-700 px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg transition-all hover:from-red-400 hover:to-red-600 active:scale-[0.97]"
              >
                All-In ${formatChips(allInAction!.maxAmount ?? 0)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
