import { SupabaseClient } from "@supabase/supabase-js";

export async function getProfile(supabase: SupabaseClient, profileId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) throw error;
  return data;
}

export async function getProfileByUserId(
  supabase: SupabaseClient,
  userId: string
) {
  // profiles.id is the auth.users id, so this is equivalent to getProfile
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export interface UpdateProfileParams {
  displayName?: string;
  avatarUrl?: string | null;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  params: UpdateProfileParams
) {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (params.displayName !== undefined) {
    updates.display_name = params.displayName;
  }
  if (params.avatarUrl !== undefined) {
    updates.avatar_url = params.avatarUrl;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
