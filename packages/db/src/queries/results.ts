import { SupabaseClient } from "@supabase/supabase-js";

export interface GameResultInput {
  gameId: string;
  userId: string;
  totalBuyIn: number;
  finalChips: number;
  cashoutValue: number;
  netResult: number;
}

export async function saveGameResults(
  supabase: SupabaseClient,
  gameId: string,
  results: GameResultInput[]
) {
  const rows = results.map((r) => ({
    game_id: gameId,
    user_id: r.userId,
    total_buy_in: r.totalBuyIn,
    final_chips: r.finalChips,
    cashout_value: r.cashoutValue,
    net_result: r.netResult,
  }));

  const { data, error } = await supabase
    .from("game_results")
    .upsert(rows, { onConflict: "game_id,user_id" })
    .select();

  if (error) throw error;
  return data;
}

export interface SettlementInput {
  gameId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export async function saveSettlements(
  supabase: SupabaseClient,
  gameId: string,
  settlements: SettlementInput[]
) {
  const rows = settlements.map((s) => ({
    game_id: gameId,
    from_user_id: s.fromUserId,
    to_user_id: s.toUserId,
    amount: s.amount,
  }));

  const { data, error } = await supabase
    .from("settlements")
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

export async function getGameResults(
  supabase: SupabaseClient,
  gameId: string
) {
  const { data, error } = await supabase
    .from("game_results")
    .select("*, profiles:user_id(id, display_name, avatar_url)")
    .eq("game_id", gameId)
    .order("net_result", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getSettlements(
  supabase: SupabaseClient,
  gameId: string
) {
  const { data, error } = await supabase
    .from("settlements")
    .select(
      "*, from_profile:from_user_id(id, display_name), to_profile:to_user_id(id, display_name)"
    )
    .eq("game_id", gameId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}
