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

  // Determine which cards are "newly dealt" for glow effect
  const newCardStart =
    street === "flop" ? 0 :
    street === "turn" ? 3 :
    street === "river" ? 4 : -1;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Street label */}
      {hasCards && (
        <div className="rounded-full bg-black/30 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60 shadow-sm backdrop-blur-sm">
          {STREET_LABELS[street]}
        </div>
      )}

      {/* Cards row */}
      <div className="flex items-center gap-3">
        {slots.map((card, i) => {
          const isDealt = card !== null;
          const isNewlyDealt = isDealt && i >= newCardStart && newCardStart >= 0;

          // Add a divider between flop (0-2) and turn (3)
          const showDivider = i === 3 && cards.length >= 4;

          return (
            <div key={i} className="flex items-center gap-3">
              {/* Decorative divider between flop and turn/river */}
              {showDivider && (
                <div className="flex flex-col items-center gap-1 opacity-30">
                  <div className="h-6 w-px bg-gradient-to-b from-transparent via-white/60 to-transparent" />
                </div>
              )}
              <div
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
                  <PlayingCard card={card} size="md" glow={isNewlyDealt} />
                ) : (
                  <div className="flex h-[100px] w-[72px] items-center justify-center rounded-lg border border-white/8 bg-white/5">
                    <div className="h-3 w-3 rounded-full bg-white/8" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
