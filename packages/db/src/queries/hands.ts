import { SupabaseClient } from "@supabase/supabase-js";

// ---------- Input types ----------

export interface HandInput {
  gameId: string;
  handNumber: number;
  dealerSeat: number;
  communityCards?: string; // JSON stringified array of Card[]
  potTotal: number;
  winnersJson?: string; // JSON stringified WinnerInfo[]
}

export interface HandPlayerInput {
  handId: string;
  userId: string;
  seatNumber: number;
  holeCards?: string; // JSON stringified [Card, Card]
  finalHand?: string; // e.g. "Two Pair, Aces and Kings"
  netChips: number; // chips won/lost this hand
}

export interface HandActionInput {
  handId: string;
  userId: string;
  street: string;
  actionType: string;
  amount?: number;
  sequenceNumber: number;
}

// ---------- Save functions ----------

export async function saveHand(supabase: SupabaseClient, hand: HandInput) {
  const { data, error } = await supabase
    .from("hands")
    .insert({
      game_id: hand.gameId,
      hand_number: hand.handNumber,
      dealer_seat: hand.dealerSeat,
      community_cards: hand.communityCards ?? null,
      pot_total: hand.potTotal,
      winners_json: hand.winnersJson ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveHandPlayers(
  supabase: SupabaseClient,
  players: HandPlayerInput[]
) {
  const rows = players.map((p) => ({
    hand_id: p.handId,
    user_id: p.userId,
    seat_number: p.seatNumber,
    hole_cards: p.holeCards ?? null,
    final_hand: p.finalHand ?? null,
    net_chips: p.netChips,
  }));

  const { data, error } = await supabase
    .from("hand_players")
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

export async function saveHandActions(
  supabase: SupabaseClient,
  actions: HandActionInput[]
) {
  const rows = actions.map((a) => ({
    hand_id: a.handId,
    user_id: a.userId,
    street: a.street,
    action_type: a.actionType,
    amount: a.amount ?? null,
    sequence_number: a.sequenceNumber,
  }));

  const { data, error } = await supabase
    .from("hand_actions")
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}

// ---------- Query functions ----------

export async function getGameHands(supabase: SupabaseClient, gameId: string) {
  const { data, error } = await supabase
    .from("hands")
    .select("*")
    .eq("game_id", gameId)
    .order("hand_number", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getHandDetails(
  supabase: SupabaseClient,
  handId: string
) {
  const [handResult, playersResult, actionsResult] = await Promise.all([
    supabase.from("hands").select("*").eq("id", handId).single(),
    supabase
      .from("hand_players")
      .select("*, profiles:user_id(id, display_name, avatar_url)")
      .eq("hand_id", handId)
      .order("seat_number"),
    supabase
      .from("hand_actions")
      .select("*, profiles:user_id(id, display_name)")
      .eq("hand_id", handId)
      .order("sequence_number"),
  ]);

  if (handResult.error) throw handResult.error;
  if (playersResult.error) throw playersResult.error;
  if (actionsResult.error) throw actionsResult.error;

  return {
    hand: handResult.data,
    players: playersResult.data,
    actions: actionsResult.data,
  };
}
