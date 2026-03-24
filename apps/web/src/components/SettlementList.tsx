"use client";

export interface SettlementRow {
  id: string;
  amount: number;
  status: string;
  from_profile: { id: string; display_name: string | null } | null;
  to_profile: { id: string; display_name: string | null } | null;
}

interface SettlementListProps {
  settlements: SettlementRow[];
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    pending: { bg: "bg-chip-gold/20", text: "text-chip-gold" },
    confirmed: { bg: "bg-chip-blue/20", text: "text-chip-blue" },
    settled: { bg: "bg-green-500/20", text: "text-green-400" },
  };
  const c = config[status] ?? config.pending;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function SettlementList({ settlements }: SettlementListProps) {
  if (settlements.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-secondary)]">
        No settlements needed -- everyone broke even!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {settlements.map((s) => {
        const fromName = s.from_profile?.display_name ?? "Unknown";
        const toName = s.to_profile?.display_name ?? "Unknown";

        return (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            {/* Debtor */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400">
                {fromName[0].toUpperCase()}
              </div>
              <span className="font-medium text-red-400">{fromName}</span>
            </div>

            {/* Arrow and amount */}
            <div className="flex flex-1 items-center justify-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-red-500/40 to-transparent" />
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="text-xs text-[var(--color-text-secondary)]">owes</span>
                <span className="font-mono font-semibold text-chip-gold">
                  ${s.amount.toFixed(2).replace(/\.00$/, "")}
                </span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-l from-green-500/40 to-transparent" />
            </div>

            {/* Creditor */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-400">{toName}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-xs font-bold text-green-400">
                {toName[0].toUpperCase()}
              </div>
            </div>

            {/* Status */}
            <StatusBadge status={s.status} />
          </div>
        );
      })}
    </div>
  );
}
