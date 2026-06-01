import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseConfigured() {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project-id.supabase.co"
  );
}

let _client: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Returns a singleton Supabase browser client.
 * All components share the same instance so auth events,
 * session state, and listeners stay in sync.
 */
export function createClient() {
  if (!_client) {
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // Opt in to native WebAuthn passkeys (signInWithPasskey / registerPasskey /
        // auth.passkey.*). Requires @supabase/supabase-js >= 2.105. The ceremony runs
        // on this same SSR client so the resulting session is written to cookies
        // automatically — no manual setSession transfer needed.
        auth: {
          experimental: { passkey: true },
        },
      }
    );
  }
  return _client;
}
