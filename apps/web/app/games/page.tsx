import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import type { GameStatus } from "@poker/shared";
import GamesTabs from "./GamesTabs";

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

interface CompletedGameRow {
  id: string;
  title: string;
  status: GameStatus;
  max_seats: number;
  small_blind: number;
  big_blind: number;
  created_at: string;
  ended_at: string | null;
  creator: {
    display_name: string | null;
  } | null;
  player_count: number;
  userNetResult: number | null;
}

export default async function GamesPage() {
  const supabase = await createServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch open games (lobby + active)
  const { data: openGames, error: openError } = await supabase
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

  // Fetch seat counts for open games
  let openGamesWithCounts: GameRow[] = [];
  if (openGames && openGames.length > 0) {
    const gameIds = openGames.map((g: { id: string }) => g.id);
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

    openGamesWithCounts = openGames.map((g: Record<string, unknown>) => ({
      ...g,
      creator: Array.isArray(g.creator) ? g.creator[0] : g.creator,
      seat_count: countMap[g.id as string] || 0,
    })) as GameRow[];
  }

  // Fetch completed games
  const { data: completedGames } = await supabase
    .from("games")
    .select(
      `
      id,
      title,
      status,
      max_seats,
      small_blind,
      big_blind,
      created_at,
      ended_at,
      creator:profiles!games_creator_user_id_fkey(display_name)
    `
    )
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(50);

  // Get player counts + user's result for completed games
  let completedGamesWithData: CompletedGameRow[] = [];
  if (completedGames && completedGames.length > 0) {
    const completedIds = completedGames.map((g: { id: string }) => g.id);

    // Get results for all completed games
    const { data: allResults } = await supabase
      .from("game_results")
      .select("game_id, user_id, net_result")
      .in("game_id", completedIds);

    const playerCountMap: Record<string, number> = {};
    const userResultMap: Record<string, number> = {};
    if (allResults) {
      for (const r of allResults) {
        playerCountMap[r.game_id] = (playerCountMap[r.game_id] || 0) + 1;
        if (user && r.user_id === user.id) {
          userResultMap[r.game_id] = r.net_result;
        }
      }
    }

    completedGamesWithData = completedGames.map(
      (g: Record<string, unknown>) => ({
        ...g,
        creator: Array.isArray(g.creator) ? g.creator[0] : g.creator,
        player_count: playerCountMap[g.id as string] || 0,
        userNetResult: userResultMap[g.id as string] ?? null,
      })
    ) as CompletedGameRow[];
  }

  // Fetch "My Games" — games user participated in (has results or is seated)
  let myGames: (GameRow | CompletedGameRow)[] = [];
  if (user) {
    // Games user has results in
    const { data: myResults } = await supabase
      .from("game_results")
      .select("game_id, net_result")
      .eq("user_id", user.id);

    // Games user is currently seated in
    const { data: mySeats } = await supabase
      .from("game_seats")
      .select("game_id")
      .eq("user_id", user.id)
      .in("status", ["occupied", "sitting-out"]);

    const myGameIds = new Set<string>();
    const myResultMap: Record<string, number> = {};
    if (myResults) {
      for (const r of myResults) {
        myGameIds.add(r.game_id);
        myResultMap[r.game_id] = r.net_result;
      }
    }
    if (mySeats) {
      for (const s of mySeats) {
        myGameIds.add(s.game_id);
      }
    }

    // Combine from open + completed
    for (const g of openGamesWithCounts) {
      if (myGameIds.has(g.id)) {
        myGames.push(g);
      }
    }
    for (const g of completedGamesWithData) {
      if (myGameIds.has(g.id)) {
        myGames.push(g);
      }
    }
  }

  const error = openError;

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

      {!error && (
        <GamesTabs
          openGames={openGamesWithCounts}
          myGames={myGames}
          completedGames={completedGamesWithData}
          isLoggedIn={!!user}
        />
      )}
    </div>
  );
}
