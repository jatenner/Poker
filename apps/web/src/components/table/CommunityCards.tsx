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
  // Always render 5 card slots
  const slots = Array.from({ length: 5 }, (_, i) => cards[i] ?? null);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Street label */}
      <div className="text-[10px] font-semibold uppercase tracking-widest text-felt-200/60">
        {STREET_LABELS[street]}
      </div>

      {/* Cards */}
      <div className="flex items-center gap-1.5">
        {slots.map((card, i) => (
          <div
            key={i}
            className="transition-all duration-500"
            style={{
              opacity: card ? 1 : 0.2,
              transform: card ? "translateY(0) scale(1)" : "translateY(4px) scale(0.95)",
              transitionDelay: card ? `${i * 100}ms` : "0ms",
            }}
          >
            {card ? (
              <PlayingCard card={card} size="md" />
            ) : (
              <div className="flex h-20 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <div className="h-3 w-3 rounded-full bg-white/10" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
