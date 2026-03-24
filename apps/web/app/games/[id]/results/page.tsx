"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import ResultsTable, { type PlayerResult } from "@/components/ResultsTable";
import SettlementList, { type SettlementRow } from "@/components/SettlementList";

interface GameInfo {
  id: string;
  title: string;
  chip_value: number;
  small_blind: number;
  big_blind: number;
  ended_at: string | null;
  created_at: string;
}

interface HandRow {
  id: string;
  pot_total: number;
}

export default function GameResultsPage() {
  const params = useParams();
  const gameId = params.id as string;
  const supabase = createBrowserClient();

  const [game, setGame] = useState<GameInfo | null>(null);
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [hands, setHands] = useState<HandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch game info
        const { data: gameData, error: gameError } = await supabase
          .from("games")
          .select("id, title, chip_value, small_blind, big_blind, ended_at, created_at")
          .eq("id", gameId)
          .single();

        if (gameError || !gameData) {
          setError("Game not found.");
          setLoading(false);
          return;
        }
        setGame(gameData as GameInfo);

        // Fetch results, settlements, and hands in parallel
        const [resultsRes, settlementsRes, handsRes] = await Promise.all([
          supabase
            .from("game_results")
            .select("*, profiles:user_id(id, display_name, avatar_url)")
            .eq("game_id", gameId)
            .order("net_result", { ascending: false }),
          supabase
            .from("settlements")
            .select(
              "*, from_profile:from_user_id(id, display_name), to_profile:to_user_id(id, display_name)"
            )
            .eq("game_id", gameId)
            .order("created_at", { ascending: true }),
          supabase
            .from("hands")
            .select("id, pot_total")
            .eq("game_id", gameId),
        ]);

        if (resultsRes.error) throw resultsRes.error;
        if (settlementsRes.error) throw settlementsRes.error;

        // Normalize joined profile data (Supabase may return array or object)
        const normalizedResults = (resultsRes.data ?? []).map(
          (r: Record<string, unknown>) => ({
            ...r,
            profiles: Array.isArray(r.profiles) ? r.profiles[0] : r.profiles,
          })
        ) as PlayerResult[];

        const normalizedSettlements = (settlementsRes.data ?? []).map(
          (s: Record<string, unknown>) => ({
            ...s,
            from_profile: Array.isArray(s.from_profile)
              ? s.from_profile[0]
              : s.from_profile,
            to_profile: Array.isArray(s.to_profile)
              ? s.to_profile[0]
              : s.to_profile,
          })
        ) as SettlementRow[];

        setResults(normalizedResults);
        setSettlements(normalizedSettlements);
        setHands((handsRes.data as HandRow[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [gameId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-felt-500 border-t-transparent" />
      </div>
    );
  }

  // Error state
  if (error || !game) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card-surface text-center">
          <p className="mb-4 text-[var(--color-text-secondary)]">
            {error ?? "Game not found."}
          </p>
          <Link href="/games" className="btn-primary">
            Back to Games
          </Link>
        </div>
      </div>
    );
  }

  // Compute summary stats
  const totalHands = hands.length;
  const biggestPot = hands.reduce(
    (max, h) => Math.max(max, h.pot_total ?? 0),
    0
  );
  const totalMoneyOnTable = results.reduce(
    (sum, r) => sum + r.total_buy_in,
    0
  );

  const gameDate = game.ended_at
    ? new Date(game.ended_at).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(game.created_at).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="mx-auto max-w-4xl px-4 pt-20 pb-12">
      {/* Back link */}
      <Link
        href="/games"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
      >
        &larr; Back to Games
      </Link>

      {/* Game header */}
      <div className="card-surface mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {game.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {gameDate}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
            Completed
          </span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card-surface text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
            Hands Played
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
            {totalHands}
          </p>
        </div>
        <div className="card-surface text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
            Biggest Pot
          </p>
          <p className="mt-1 text-2xl font-bold text-chip-gold">
            {biggestPot > 0
              ? `$${(biggestPot * game.chip_value).toFixed(2).replace(/\.00$/, "")}`
              : "--"}
          </p>
        </div>
        <div className="card-surface text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
            Total Buy-ins
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
            ${totalMoneyOnTable.toFixed(2).replace(/\.00$/, "")}
          </p>
        </div>
      </div>

      {/* Results table */}
      <div className="card-surface mb-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Final Standings
        </h2>
        {results.length > 0 ? (
          <ResultsTable results={results} chipValue={game.chip_value} />
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">
            No results recorded for this game.
          </p>
        )}
      </div>

      {/* Settlements */}
      <div className="card-surface mb-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Who Owes Who
        </h2>
        <SettlementList settlements={settlements} />
      </div>

      {/* Footer link */}
      <div className="text-center">
        <Link href="/games" className="btn-secondary">
          Back to Games List
        </Link>
      </div>
    </div>
  );
}
