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
  sm: { card: "w-10 h-14 text-xs", rank: "text-[10px]", suit: "text-[10px]", center: "text-lg" },
  md: { card: "w-14 h-20 text-sm", rank: "text-xs", suit: "text-xs", center: "text-2xl" },
  lg: { card: "w-20 h-28 text-base", rank: "text-sm", suit: "text-sm", center: "text-3xl" },
};

interface PlayingCardProps {
  card: Card | null;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function PlayingCard({
  card,
  faceDown = false,
  size = "md",
  className = "",
}: PlayingCardProps) {
  const s = SIZE_CLASSES[size];

  if (!card || faceDown) {
    return (
      <div
        className={`${s.card} relative flex-shrink-0 rounded-lg shadow-lg overflow-hidden ${className}`}
      >
        {/* Card back */}
        <div className="absolute inset-0 bg-gradient-to-br from-chip-blue via-blue-800 to-chip-blue" />
        <div className="absolute inset-[3px] rounded-md border border-white/20 bg-gradient-to-br from-blue-900 to-blue-950" />
        <div
          className="absolute inset-[6px] rounded-sm opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.08) 3px, rgba(255,255,255,0.08) 4px)",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border border-white/20 bg-white/10" />
        </div>
      </div>
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit] ?? "?";
  const suitColor = SUIT_COLORS[card.suit] ?? "";

  return (
    <div
      className={`${s.card} relative flex-shrink-0 rounded-lg bg-card-white shadow-lg overflow-hidden transition-transform duration-300 ${className}`}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

      {/* Top-left rank and suit */}
      <div className={`absolute top-[2px] left-[3px] flex flex-col items-center leading-none ${suitColor}`}>
        <span className={`${s.rank} font-bold`}>{card.rank}</span>
        <span className={s.suit}>{suitSymbol}</span>
      </div>

      {/* Center suit */}
      <div className={`absolute inset-0 flex items-center justify-center ${suitColor}`}>
        <span className={s.center}>{suitSymbol}</span>
      </div>

      {/* Bottom-right rank and suit (inverted) */}
      <div className={`absolute bottom-[2px] right-[3px] flex flex-col items-center leading-none rotate-180 ${suitColor}`}>
        <span className={`${s.rank} font-bold`}>{card.rank}</span>
        <span className={s.suit}>{suitSymbol}</span>
      </div>
    </div>
  );
}
