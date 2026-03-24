"use client";

import { useState, useEffect, useCallback } from "react";

interface BuyInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  minBuyIn: number;
  maxBuyIn: number;
  chipValue: number;
  seatNumber?: number;
}

export default function BuyInModal({
  isOpen,
  onClose,
  onConfirm,
  minBuyIn,
  maxBuyIn,
  chipValue,
  seatNumber,
}: BuyInModalProps) {
  const [amount, setAmount] = useState(minBuyIn);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(minBuyIn);
      setError(null);
    }
  }, [isOpen, minBuyIn]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const stepValue = chipValue || 0.01;
  const chipsAmount = chipValue > 0 ? Math.floor(amount / chipValue) : 0;
  const halfMax = Math.round(((minBuyIn + maxBuyIn) / 2) / stepValue) * stepValue;

  const setPreset = useCallback(
    (val: number) => {
      setAmount(val);
      setError(null);
    },
    []
  );

  const handleConfirm = () => {
    if (amount < minBuyIn) {
      setError(`Minimum buy-in is $${minBuyIn.toFixed(2)}`);
      return;
    }
    if (amount > maxBuyIn) {
      setError(`Maximum buy-in is $${maxBuyIn.toFixed(2)}`);
      return;
    }
    onConfirm(amount);
  };

  if (!isOpen) return null;

  const pct = maxBuyIn > minBuyIn ? ((amount - minBuyIn) / (maxBuyIn - minBuyIn)) * 100 : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-felt-700/40">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-felt-400">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Buy In{seatNumber !== undefined ? ` - Seat ${seatNumber}` : ""}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Choose your buy-in amount
          </p>
        </div>

        {/* Amount display */}
        <div className="mb-5 rounded-xl bg-[var(--color-bg)] p-4 text-center">
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">
            ${amount.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center justify-center gap-1.5 text-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-chip-gold">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.3" />
              <circle cx="12" cy="12" r="7" fill="currentColor" />
            </svg>
            <span className="font-semibold text-chip-gold">
              {chipsAmount.toLocaleString()}
            </span>
            <span className="text-[var(--color-text-secondary)]">chips</span>
          </div>
        </div>

        {/* Slider */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="range"
              min={minBuyIn}
              max={maxBuyIn}
              step={stepValue}
              value={amount}
              onChange={(e) => {
                setAmount(parseFloat(e.target.value));
                setError(null);
              }}
              className="w-full appearance-none bg-transparent cursor-pointer
                [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-felt-400
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:mt-[-6px]
                [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/10
                [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-felt-400 [&::-moz-range-thumb]:border-2
                [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg"
              style={{
                background: `linear-gradient(to right, #2e7d32 0%, #2e7d32 ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`,
                borderRadius: "9999px",
                height: "8px",
              }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>${minBuyIn.toFixed(2)}</span>
            <span>${maxBuyIn.toFixed(2)}</span>
          </div>
        </div>

        {/* Preset buttons */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <button
            onClick={() => setPreset(minBuyIn)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition
              ${amount === minBuyIn
                ? "bg-felt-700 text-white ring-1 ring-felt-400"
                : "bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]"
              }`}
          >
            Min
          </button>
          <button
            onClick={() => setPreset(halfMax)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition
              ${amount === halfMax
                ? "bg-felt-700 text-white ring-1 ring-felt-400"
                : "bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]"
              }`}
          >
            Half
          </button>
          <button
            onClick={() => setPreset(maxBuyIn)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition
              ${amount === maxBuyIn
                ? "bg-felt-700 text-white ring-1 ring-felt-400"
                : "bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-[var(--color-text-primary)]"
              }`}
          >
            Max
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 rounded-lg bg-chip-red/10 px-4 py-2 text-sm text-chip-red text-center">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-felt-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-felt-500 active:scale-[0.98]"
          >
            Sit Down
          </button>
        </div>
      </div>
    </div>
  );
}
