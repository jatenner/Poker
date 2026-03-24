"use client";

import { useState } from "react";

export interface PlayerResult {
  user_id: string;
  total_buy_in: number;
  final_chips: number;
  cashout_value: number;
  net_result: number;
  profiles: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ResultsTableProps {
  results: PlayerResult[];
  chipValue: number;
}

type SortKey = "net_result" | "total_buy_in" | "cashout_value" | "final_chips";

function formatCurrency(amount: number): string {
  return (
    (amount >= 0 ? "+$" : "-$") +
    Math.abs(amount)
      .toFixed(2)
      .replace(/\.00$/, "")
  );
}

export default function ResultsTable({ results, chipValue }: ResultsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("net_result");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...results].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const maxAbsNet = Math.max(...results.map((r) => Math.abs(r.net_result)), 1);

  const SortArrow = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return <span className="ml-1">{sortAsc ? "\u25B2" : "\u25BC"}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-[var(--color-text-secondary)]">
            <th className="pb-3 pr-4 font-medium">#</th>
            <th className="pb-3 pr-4 font-medium">Player</th>
            <th
              className="cursor-pointer pb-3 pr-4 text-right font-medium hover:text-[var(--color-text-primary)]"
              onClick={() => handleSort("total_buy_in")}
            >
              Buy-in
              <SortArrow column="total_buy_in" />
            </th>
            <th
              className="cursor-pointer pb-3 pr-4 text-right font-medium hover:text-[var(--color-text-primary)]"
              onClick={() => handleSort("final_chips")}
            >
              Final Chips
              <SortArrow column="final_chips" />
            </th>
            <th
              className="cursor-pointer pb-3 pr-4 text-right font-medium hover:text-[var(--color-text-primary)]"
              onClick={() => handleSort("cashout_value")}
            >
              Cashout
              <SortArrow column="cashout_value" />
            </th>
            <th
              className="cursor-pointer pb-3 text-right font-medium hover:text-[var(--color-text-primary)]"
              onClick={() => handleSort("net_result")}
            >
              Net Result
              <SortArrow column="net_result" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => {
            const isPositive = r.net_result > 0;
            const isNegative = r.net_result < 0;
            const barWidth = Math.abs(r.net_result) / maxAbsNet;

            return (
              <tr
                key={r.user_id}
                className="border-b border-white/5 last:border-b-0"
              >
                <td className="py-3 pr-4 text-[var(--color-text-secondary)]">
                  {i + 1}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {r.profiles?.avatar_url ? (
                      <img
                        src={r.profiles.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-felt-700 text-xs font-bold text-felt-300">
                        {(r.profiles?.display_name ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {r.profiles?.display_name ?? "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4 text-right font-mono text-[var(--color-text-primary)]">
                  ${r.total_buy_in.toFixed(2).replace(/\.00$/, "")}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-[var(--color-text-secondary)]">
                  {r.final_chips.toLocaleString()}
                </td>
                <td className="py-3 pr-4 text-right font-mono text-[var(--color-text-primary)]">
                  ${r.cashout_value.toFixed(2).replace(/\.00$/, "")}
                </td>
                <td className="py-3 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`font-mono font-semibold ${
                        isPositive
                          ? "text-green-400"
                          : isNegative
                            ? "text-red-400"
                            : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {formatCurrency(r.net_result)}
                    </span>
                    {/* Profit/loss bar */}
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${
                          isPositive ? "bg-green-500" : isNegative ? "bg-red-500" : "bg-white/10"
                        }`}
                        style={{ width: `${barWidth * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
