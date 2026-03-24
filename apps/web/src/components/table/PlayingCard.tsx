"use client";

import type { Card } from "@poker/shared";

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};

const SUIT_COLORS: Record<string, string> = {
  hearts: "text-suit-hearts",
  diamonds: "text-suit-diamonds",
  clubs: "text-suit-clubs",
  spades: "text-suit-spades",
};

const SIZE_CLASSES = {
  xs: {
    card: "w-9 h-[50px] rounded-md",
    rank: "text-[10px] leading-none",
    suit: "text-[9px] leading-none",
    center: "text-base",
    padding: "p-[2px]",
  },
  sm: {
    card: "w-[52px] h-[72px] rounded-lg",
    rank: "text-xs leading-none",
    suit: "text-[11px] leading-none",
    center: "text-2xl",
    padding: "p-[3px]",
  },
  md: {
    card: "w-[72px] h-[100px] rounded-lg",
    rank: "text-sm leading-none",
    suit: "text-sm leading-none",
    center: "text-4xl",
    padding: "p-1",
  },
  lg: {
    card: "w-[88px] h-[120px] rounded-xl",
    rank: "text-base leading-none",
    suit: "text-base leading-none",
    center: "text-5xl",
    padding: "p-1.5",
  },
};

interface PlayingCardProps {
  card: Card | null;
  faceDown?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Apply a glow effect for newly dealt cards */
  glow?: boolean;
}

export default function PlayingCard({
  card,
  faceDown = false,
  size = "md",
  className = "",
  glow = false,
}: PlayingCardProps) {
  const s = SIZE_CLASSES[size];

  // Face-down or missing card
  if (!card || faceDown) {
    return (
      <div
        className={`${s.card} relative flex-shrink-0 overflow-hidden shadow-card ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-chip-blue via-blue-800 to-chip-blue" />
        <div className="absolute inset-[2px] rounded-[inherit] border border-white/20 bg-gradient-to-br from-blue-900 to-blue-950" />
        {/* Detailed cross-hatch pattern */}
        <div
          className="absolute inset-[4px] rounded-[inherit] opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px), repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.06) 3px, rgba(255,255,255,0.06) 4px)",
          }}
        />
        {/* Diamond pattern overlay */}
        <div
          className="absolute inset-[6px] rounded-[inherit] opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 7px), repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 7px)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-white/25 bg-white/10 shadow-inner" />
        </div>
      </div>
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? "?";
  const suitColor = SUIT_COLORS[card.suit] ?? "";

  return (
    <div className={`relative ${glow ? "animate-card-glow" : ""}`}>
      {/* Glow effect behind newly dealt cards */}
      {glow && (
        <div className="absolute -inset-1 rounded-lg bg-chip-gold/20 blur-md animate-pulse" />
      )}
      <div
        className={`${s.card} relative flex-shrink-0 overflow-hidden bg-card-white shadow-card transition-transform duration-200 hover:scale-105 ring-1 ring-yellow-600/20 ${className}`}
      >
        {/* Subtle sheen */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-black/5" />

        {/* Inner shadow for premium feel */}
        <div className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_1px_3px_rgba(0,0,0,0.1),inset_0_-1px_2px_rgba(0,0,0,0.05)]" />

        {/* Top-left rank + suit */}
        <div
          className={`absolute left-[3px] top-[2px] flex flex-col items-center ${suitColor} ${s.padding}`}
        >
          <span className={`${s.rank} font-extrabold`}>{card.rank}</span>
          <span className={`${s.suit} font-bold`}>{suitSymbol}</span>
        </div>

        {/* Large center suit */}
        <div
          className={`absolute inset-0 flex items-center justify-center ${suitColor}`}
        >
          <span className={`${s.center} font-bold drop-shadow-sm`}>{suitSymbol}</span>
        </div>

        {/* Bottom-right rank + suit (inverted) */}
        <div
          className={`absolute bottom-[2px] right-[3px] flex rotate-180 flex-col items-center ${suitColor} ${s.padding}`}
        >
          <span className={`${s.rank} font-extrabold`}>{card.rank}</span>
          <span className={`${s.suit} font-bold`}>{suitSymbol}</span>
        </div>
      </div>
    </div>
  );
}
