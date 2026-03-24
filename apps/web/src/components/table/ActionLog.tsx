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
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
    <div className="flex flex-col overflow-hidden rounded-xl border border-white/8 bg-black/60 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/8 px-4 py-2">
        <div className="h-1.5 w-1.5 rounded-full bg-felt-400 shadow-[0_0_4px] shadow-felt-400/50" />
        <span className="text-xs font-bold uppercase tracking-wider text-white/40">
          Action Log
        </span>
      </div>

      {/* Entries */}
      <div
        ref={scrollRef}
        className="max-h-48 overflow-y-auto px-4 py-2"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
      >
        {actions.map((entry, i) => (
          <div
            key={i}
            className="flex items-baseline gap-2 border-b border-white/[0.03] py-1 text-xs last:border-b-0"
          >
            <span className="shrink-0 font-mono text-[10px] text-white/20">
              {formatTime(entry.timestamp)}
            </span>
            <span className="font-semibold text-white/70">
              {entry.playerName}
            </span>
            <span className="text-white/45">
              {entry.action}
              {entry.amount != null && entry.amount > 0 && (
                <span className="ml-1 font-bold text-chip-gold">
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
