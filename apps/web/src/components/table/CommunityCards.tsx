"use client";

import type { Card, Street } from "@poker/shared";
import PlayingCard from "./PlayingCard";

interface CommunityCardsProps {
  cards: Card[];
  street: Street;
}

const STREET_LABELS: Record<Street, string> = {
  preflop: "Pre-Flop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
  showdown: "Showdown",
};

export default function CommunityCards({ cards, street }: CommunityCardsProps) {
  const slots = Array.from({ length: 5 }, (_, i) => cards[i] ?? null);
  const hasCards = cards.length > 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Street label */}
      {hasCards && (
        <div className="rounded-full bg-black/25 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-white/50">
          {STREET_LABELS[street]}
        </div>
      )}

      {/* Cards row */}
      <div className="flex items-center gap-2">
        {slots.map((card, i) => {
          const isDealt = card !== null;
          return (
            <div
              key={i}
              className="transition-all duration-500 ease-out"
              style={{
                opacity: isDealt ? 1 : 0.15,
                transform: isDealt
                  ? "translateY(0) scale(1)"
                  : "translateY(6px) scale(0.9)",
                transitionDelay: isDealt ? `${i * 120}ms` : "0ms",
              }}
            >
              {isDealt ? (
                <PlayingCard card={card} size="md" />
              ) : (
                <div className="flex h-[88px] w-16 items-center justify-center rounded-lg border border-white/8 bg-white/5">
                  <div className="h-3 w-3 rounded-full bg-white/8" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
