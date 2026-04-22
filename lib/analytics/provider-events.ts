import { createClient } from "@supabase/supabase-js";

type ProviderEventType =
  | "lead_received"
  | "review_received"
  | "question_received";

interface RecordProviderEventInput {
  provider_id: string;
  event_type: ProviderEventType;
  profile_id?: string | null;
  metadata?: Record<string, unknown>;
}

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

/**
 * Fire-and-forget write to provider_activity from server-side creation routes.
 * Never throws — analytics failures must not break the user-facing action that
 * triggered them. Callers should `void recordProviderEvent(...)`.
 */
export async function recordProviderEvent(input: RecordProviderEventInput): Promise<void> {
  try {
    const db = getServiceDb();
    if (!db) return;

    const { error } = await db.from("provider_activity").insert({
      provider_id: input.provider_id,
      profile_id: input.profile_id ?? null,
      event_type: input.event_type,
      metadata: input.metadata ?? {},
    });

    if (error) {
      console.error(`[provider-events] ${input.event_type} insert failed:`, error);
    }
  } catch (err) {
    console.error(`[provider-events] ${input.event_type} threw:`, err);
  }
}
