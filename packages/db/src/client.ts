import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Create a Supabase client for server-side usage with the service role key.
 * This client bypasses RLS and should only be used in trusted server contexts.
 */
export function createServiceClient(): SupabaseClient {
  const url = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client for browser / anon usage.
 * This client respects RLS policies and uses the anon key.
 */
export function createBrowserClient(): SupabaseClient {
  const url = getEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createClient(url, anonKey);
}
