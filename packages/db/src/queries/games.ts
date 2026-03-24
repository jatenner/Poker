import { SupabaseClient } from "@supabase/supabase-js";

export interface CreateGameParams {
  creatorUserId: string;
  title: string;
  smallBlind: number;
  bigBlind: number;
  minBuyIn: number;
  maxBuyIn: number;
  maxSeats?: number;
  chipValue?: number;
}

export async function createGame(
  supabase: SupabaseClient,
  params: CreateGameParams
) {
  const { data, error } = await supabase
    .from("games")
    .insert({
      creator_user_id: params.creatorUserId,
      title: params.title,
      small_blind: params.smallBlind,
      big_blind: params.bigBlind,
      min_buy_in: params.minBuyIn,
      max_buy_in: params.maxBuyIn,
      max_seats: params.maxSeats ?? 8,
      chip_value: params.chipValue ?? 1.0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getGame(supabase: SupabaseClient, gameId: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", gameId)
    .single();

  if (error) throw error;
  return data;
}

export async function listGames(
  supabase: SupabaseClient,
  options?: { status?: string; limit?: number; offset?: number }
) {
  let query = supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit ?? 20) - 1
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function updateGameStatus(
  supabase: SupabaseClient,
  gameId: string,
  status: "lobby" | "active" | "paused" | "completed"
) {
  const updates: Record<string, unknown> = { status };

  if (status === "active") {
    updates.started_at = new Date().toISOString();
  } else if (status === "completed") {
    updates.ended_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("games")
    .update(updates)
    .eq("id", gameId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
