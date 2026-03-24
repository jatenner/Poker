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
    card: "w-8 h-11 rounded-md",
    rank: "text-[9px] leading-none",
    suit: "text-[8px] leading-none",
    center: "text-sm",
    padding: "p-[2px]",
  },
  sm: {
    card: "w-11 h-16 rounded-lg",
    rank: "text-[11px] leading-none",
    suit: "text-[10px] leading-none",
    center: "text-xl",
    padding: "p-[3px]",
  },
  md: {
    card: "w-16 h-[88px] rounded-lg",
    rank: "text-sm leading-none",
    suit: "text-xs leading-none",
    center: "text-3xl",
    padding: "p-1",
  },
  lg: {
    card: "w-20 h-28 rounded-xl",
    rank: "text-base leading-none",
    suit: "text-sm leading-none",
    center: "text-4xl",
    padding: "p-1.5",
  },
};

interface PlayingCardProps {
  card: Card | null;
  faceDown?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export default function PlayingCard({
  card,
  faceDown = false,
  size = "md",
  className = "",
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
        <div
          className="absolute inset-[4px] rounded-[inherit] opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3.5 w-3.5 rounded-full border border-white/25 bg-white/10" />
        </div>
      </div>
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? "?";
  const suitColor = SUIT_COLORS[card.suit] ?? "";

  return (
    <div
      className={`${s.card} relative flex-shrink-0 overflow-hidden bg-card-white shadow-card transition-transform duration-200 hover:scale-105 ${className}`}
    >
      {/* Subtle sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-black/5" />

      {/* Top-left rank + suit */}
      <div
        className={`absolute left-[3px] top-[2px] flex flex-col items-center ${suitColor} ${s.padding}`}
      >
        <span className={`${s.rank} font-bold`}>{card.rank}</span>
        <span className={s.suit}>{suitSymbol}</span>
      </div>

      {/* Large center suit */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${suitColor}`}
      >
        <span className={`${s.center} drop-shadow-sm`}>{suitSymbol}</span>
      </div>

      {/* Bottom-right rank + suit (inverted) */}
      <div
        className={`absolute bottom-[2px] right-[3px] flex rotate-180 flex-col items-center ${suitColor} ${s.padding}`}
      >
        <span className={`${s.rank} font-bold`}>{card.rank}</span>
        <span className={s.suit}>{suitSymbol}</span>
      </div>
    </div>
  );
}
