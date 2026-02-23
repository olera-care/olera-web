import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key for admin operations.
 * Returns null if environment variables are not configured.
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}
