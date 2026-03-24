import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { GameStatus } from "@poker/shared";

interface GameRow {
  id: string;
  title: string;
  status: GameStatus;
  max_seats: number;
  small_blind: number;
  big_blind: number;
  min_buy_in: number;
  max_buy_in: number;
  created_at: string;
  creator: {
    display_name: string | null;
  } | null;
  seat_count: number;
}

function StatusBadge({ status }: { status: GameStatus }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    lobby: {
      bg: "bg-felt-700/40",
      text: "text-felt-300",
      label: "Lobby",
    },
    active: {
      bg: "bg-chip-gold/20",
      text: "text-chip-gold",
      label: "Active",
    },
    completed: {
      bg: "bg-white/5",
      text: "text-[var(--color-text-secondary)]",
      label: "Completed",
    },
    paused: {
      bg: "bg-chip-blue/20",
      text: "text-chip-blue",
      label: "Paused",
    },
  };

  const c = config[status] ?? config.completed;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

export default async function GamesPage() {
  const supabase = await createServerClient();

  // Fetch games that are in lobby or active state, with creator profile
  const { data: games, error } = await supabase
    .from("games")
    .select(
      `
      id,
      title,
      status,
      max_seats,
      small_blind,
      big_blind,
      min_buy_in,
      max_buy_in,
      created_at,
      creator:profiles!games_creator_user_id_fkey(display_name)
    `
    )
    .in("status", ["lobby", "active"])
    .order("created_at", { ascending: false });

  // Fetch seat counts for each game
  let gamesWithCounts: GameRow[] = [];

  if (games && games.length > 0) {
    const gameIds = games.map((g: { id: string }) => g.id);
    const { data: seatCounts } = await supabase
      .from("game_seats")
      .select("game_id")
      .in("game_id", gameIds)
      .in("status", ["occupied", "sitting-out"]);

    const countMap: Record<string, number> = {};
    if (seatCounts) {
      for (const s of seatCounts) {
        countMap[s.game_id] = (countMap[s.game_id] || 0) + 1;
      }
    }

    gamesWithCounts = games.map((g: Record<string, unknown>) => ({
      ...g,
      creator: Array.isArray(g.creator) ? g.creator[0] : g.creator,
      seat_count: countMap[g.id as string] || 0,
    })) as GameRow[];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-20 pb-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Games
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Join an open table or start your own game
          </p>
        </div>
        <Link href="/games/create" className="btn-primary">
          Create Game
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-chip-red/10 px-4 py-3 text-sm text-chip-red">
          Failed to load games. Please try again.
        </div>
      )}

      {/* Empty state */}
      {!error && gamesWithCounts.length === 0 && (
        <div className="card-surface py-16 text-center">
          <p className="text-lg font-medium text-[var(--color-text-secondary)]">
            No games available
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Be the first to create a game!
          </p>
          <Link href="/games/create" className="btn-primary mt-6 inline-flex">
            Create Game
          </Link>
        </div>
      )}

      {/* Games grid */}
      {gamesWithCounts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gamesWithCounts.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="card-surface transition hover:border-felt-600"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {game.title}
                </h3>
                <StatusBadge status={game.status} />
              </div>

              <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
                Created by{" "}
                <span className="text-[var(--color-text-primary)]">
                  {game.creator?.display_name ?? "Unknown"}
                </span>
              </p>

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <span className="text-[var(--color-text-secondary)]">
                    Seats
                  </span>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {game.seat_count} / {game.max_seats}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--color-text-secondary)]">
                    Blinds
                  </span>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    ${game.small_blind} / ${game.big_blind}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[var(--color-text-secondary)]">
                    Buy-in
                  </span>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    ${game.min_buy_in} &ndash; ${game.max_buy_in}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
