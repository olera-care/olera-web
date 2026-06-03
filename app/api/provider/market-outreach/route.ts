import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/admin";

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

const TABLE_MISSING = (msg: string | undefined) =>
  !!msg && (msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("relation"));

async function resolveProviderId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: account } = await supabase.from("accounts").select("id").eq("user_id", user.id).maybeSingle();
  if (!account) return null;
  const { data: profiles } = await supabase
    .from("business_profiles")
    .select("id")
    .eq("account_id", account.id)
    .in("type", ["organization", "caregiver"])
    .limit(1);
  return profiles?.[0]?.id ?? null;
}

export async function GET() {
  const providerId = await resolveProviderId();
  if (!providerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getServiceClient();
  const { data, error } = await db
    .from("market_referral_outreach")
    .select("target_id, status, note")
    .eq("provider_id", providerId);

  if (error) {
    if (TABLE_MISSING(error.message)) return NextResponse.json({ outreach: {}, enabled: false });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const outreach: Record<string, { status: string; note: string | null }> = {};
  for (const row of data ?? []) outreach[row.target_id] = { status: row.status, note: row.note };
  return NextResponse.json({ outreach, enabled: true });
}

export async function POST(req: NextRequest) {
  const providerId = await resolveProviderId();
  if (!providerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { targetId?: string; targetName?: string; status?: string; note?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const targetId = (body.targetId || "").trim();
  const status = body.status as Status;
  if (!targetId || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "targetId and a valid status are required" }, { status: 400 });
  }

  const db = getServiceClient();
  const { error } = await db
    .from("market_referral_outreach")
    .upsert(
      {
        provider_id: providerId,
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
  return NextResponse.json({ ok: true, enabled: true });
}
