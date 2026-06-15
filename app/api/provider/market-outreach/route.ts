import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";
import { resolveCanonicalProviderId } from "@/lib/provider-identity";

/**
 * Provider "Your Market" workspace — outreach state on referral targets.
 *
 * GET  → { outreach: { [targetId]: { status, note } } } for the authenticated provider.
 * POST → upsert one target's status/note. Body: { targetId, targetName?, status, note? }.
 *
 * Provider identity is resolved from the session (never trusted from the client).
 * Degrades gracefully if the 097 migration hasn't been applied yet (returns empty /
 * a not_enabled flag) so the UI can fall back to in-session state.
 */

const STATUSES = ["to_contact", "contacted", "responded", "referring", "dismissed"] as const;
type Status = (typeof STATUSES)[number];
const MARKET_OUTREACH_EVENT = "market_outreach_status_updated";

const TABLE_MISSING = (msg: string | undefined) =>
  !!msg && (msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("relation"));

type ProviderIdentity = {
  profileId: string;
  providerActivityId: string;
};

async function resolveProviderIdentity(): Promise<ProviderIdentity | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: account } = await supabase.from("accounts").select("id").eq("user_id", user.id).maybeSingle();
  if (!account) return null;
  const { data: profiles } = await supabase
    .from("business_profiles")
    .select("id, slug, source_provider_id")
    .eq("account_id", account.id)
    .in("type", ["organization", "caregiver"])
    .limit(1);
  const profile = profiles?.[0];
  if (!profile?.id) return null;

  const db = getServiceClient();
  const canonicalProviderId = await resolveCanonicalProviderId(db, {
    sourceProviderId: profile.source_provider_id,
    profileSlug: profile.slug,
  });

  return {
    profileId: profile.id,
    providerActivityId: canonicalProviderId ?? profile.slug ?? profile.source_provider_id ?? profile.id,
  };
}

export async function GET() {
  const identity = await resolveProviderIdentity();
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getServiceClient();
  const { data, error } = await db
    .from("market_referral_outreach")
    .select("target_id, status, note")
    .eq("provider_id", identity.profileId);

  if (error) {
    if (TABLE_MISSING(error.message)) return NextResponse.json({ outreach: {}, enabled: false });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const outreach: Record<string, { status: string; note: string | null }> = {};
  for (const row of data ?? []) outreach[row.target_id] = { status: row.status, note: row.note };
  return NextResponse.json({ outreach, enabled: true });
}

export async function POST(req: NextRequest) {
  const identity = await resolveProviderIdentity();
  if (!identity) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { targetId?: string; targetName?: string; status?: string; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const targetId = (body.targetId || "").trim();
  const status = body.status as Status;
  if (!targetId || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "targetId and a valid status are required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { data: existing, error: existingError } = await db
    .from("market_referral_outreach")
    .select("status")
    .eq("provider_id", identity.profileId)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existingError) {
    if (TABLE_MISSING(existingError.message)) return NextResponse.json({ ok: false, enabled: false });
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const { error } = await db
    .from("market_referral_outreach")
    .upsert(
      {
        provider_id: identity.profileId,
        target_id: targetId,
        target_name: body.targetName ?? null,
        status,
        note: body.note ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider_id,target_id" },
    );

  if (error) {
    if (TABLE_MISSING(error.message)) return NextResponse.json({ ok: false, enabled: false });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: activityError } = await db.from("provider_activity").insert({
    provider_id: identity.providerActivityId,
    profile_id: identity.profileId,
    event_type: MARKET_OUTREACH_EVENT,
    metadata: {
      source: "your_market_referral_call_sheet",
      target_id: targetId,
      target_name: body.targetName ?? null,
      previous_status: existing?.status ?? null,
      status,
    },
  });

  if (activityError) {
    console.error("[market-outreach] provider_activity insert failed:", activityError);
    return NextResponse.json({ ok: true, enabled: true, activityLogged: false });
  }

  return NextResponse.json({ ok: true, enabled: true, activityLogged: true });
}
