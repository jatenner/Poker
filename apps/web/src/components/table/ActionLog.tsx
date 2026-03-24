"use client";

import { useEffect, useRef } from "react";

export interface ActionLogEntry {
  playerName: string;
  action: string;
  amount?: number;
  timestamp: number;
}

interface ActionLogProps {
  actions: ActionLogEntry[];
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatAmount(amount: number): string {
  return amount.toLocaleString();
}

export default function ActionLog({ actions }: ActionLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions.length]);

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="border-b border-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
        Action Log
      </div>
      <div
        ref={scrollRef}
        className="max-h-36 overflow-y-auto px-3 py-1.5 scrollbar-thin"
      >
        {actions.map((entry, i) => (
          <div
            key={i}
            className="flex items-baseline gap-2 py-0.5 text-[11px] leading-relaxed"
          >
            <span className="shrink-0 text-white/25">{formatTime(entry.timestamp)}</span>
            <span className="font-medium text-white/70">{entry.playerName}</span>
            <span className="text-white/50">
              {entry.action}
              {entry.amount != null && entry.amount > 0 && (
                <span className="ml-1 font-semibold text-chip-gold">
                  {formatAmount(entry.amount)}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
