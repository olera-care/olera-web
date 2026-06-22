/**
 * POST /api/medjobs/opportunity — persist the optional "Your ideal caregiver"
 * fields onto the caller's provider business_profiles.metadata, under
 * OPPORTUNITY_PROFILE_KEY. Everything is optional; this only sharpens matches
 * and enriches the student-facing opportunity. Mirrors the eligibility route's
 * auth + profile-resolution pattern (service-role write, gated to a profile the
 * caller's account owns). No localStorage, no migration (JSONB metadata).
 */

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { OPPORTUNITY_PROFILE_KEY, type OpportunityProfile } from "@/lib/medjobs/opportunity";

export async function POST(request: Request) {
  const supabaseUser = await createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { profile_id?: string; opportunity?: OpportunityProfile } = {};
  try {
    body = (await request.json()) as { profile_id?: string; opportunity?: OpportunityProfile };
  } catch {
    /* empty body tolerated */
  }
  if (!body.opportunity) {
    return NextResponse.json({ error: "Missing opportunity" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: "No account" }, { status: 404 });
  const accountId = (account as { id: string }).id;

  // Resolve the provider profile: an explicit owned profile_id, else the
  // account's provider profile.
  let profileId = body.profile_id;
  if (profileId) {
    const { data: owned } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("id", profileId)
      .eq("account_id", accountId)
      .maybeSingle();
    if (!owned) profileId = undefined;
  }
  if (!profileId) {
    const { data: bp } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("account_id", accountId)
      .in("type", ["organization", "caregiver"])
      .limit(1)
      .maybeSingle();
    if (!bp) return NextResponse.json({ error: "No linked provider profile" }, { status: 404 });
    profileId = (bp as { id: string }).id;
  }

  // Merge — keep existing fields, overwrite only what was sent.
  const { data: cur } = await supabase
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .single();
  const meta = ((cur?.metadata as Record<string, unknown>) ?? {});
  const existing = (meta[OPPORTUNITY_PROFILE_KEY] as OpportunityProfile) ?? {};
  meta[OPPORTUNITY_PROFILE_KEY] = { ...existing, ...body.opportunity };
  const nowIso = new Date().toISOString();

  const { error } = await supabase
    .from("business_profiles")
    .update({ metadata: meta, updated_at: nowIso })
    .eq("id", profileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, profile_id: profileId });
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
