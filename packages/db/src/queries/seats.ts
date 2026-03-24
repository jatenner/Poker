import { SupabaseClient } from "@supabase/supabase-js";

export async function takeSeat(
  supabase: SupabaseClient,
  gameId: string,
  seatNumber: number,
  userId: string
) {
  // Upsert: if the seat row exists (open), claim it; otherwise insert a new one
  const { data, error } = await supabase
    .from("game_seats")
    .upsert(
      {
        game_id: gameId,
        seat_number: seatNumber,
        user_id: userId,
        status: "occupied",
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "game_id,seat_number" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function leaveSeat(
  supabase: SupabaseClient,
  gameId: string,
  seatNumber: number
) {
  const { data, error } = await supabase
    .from("game_seats")
    .update({
      user_id: null,
      status: "open",
      joined_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("game_id", gameId)
    .eq("seat_number", seatNumber)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSeats(supabase: SupabaseClient, gameId: string) {
  const { data, error } = await supabase
    .from("game_seats")
    .select("*, profiles:user_id(id, display_name, avatar_url)")
    .eq("game_id", gameId)
    .order("seat_number", { ascending: true });

  if (error) throw error;
  return data;
}
