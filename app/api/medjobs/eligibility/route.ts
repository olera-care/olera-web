/**
 * POST /api/medjobs/eligibility — Phase B.
 *
 * Persists the provider's eligibility-screener result onto their linked
 * business_profiles.metadata:
 *   - medjobs_eligibility_completed_at (the access gate — see lib/medjobs/eligibility.ts)
 *   - medjobs_demand_profile (Q1–Q3: demand shape, PRN openness, coverage buckets)
 *   - platform_terms_accepted_at (sign-in-wrap, set once)
 *
 * The magic-link landing already links account ↔ business_profile, so this
 * writes to the already-linked provider profile — no re-claim. Service-role
 * write, gated to a profile the caller's account owns.
 */

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  ELIGIBILITY_COMPLETED_KEY,
  DEMAND_PROFILE_KEY,
  PLATFORM_TERMS_KEY,
  type DemandProfile,
} from "@/lib/medjobs/eligibility";

export async function POST(request: Request) {
  const supabaseUser = await createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { profile_id?: string; demand_profile?: DemandProfile } = {};
  try {
    body = (await request.json()) as { profile_id?: string; demand_profile?: DemandProfile };
  } catch {
    /* empty body tolerated */
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }
  const supabase = createServiceClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve the caller's account.
  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: "No account" }, { status: 404 });
  const accountId = (account as { id: string }).id;

  // Resolve the provider profile: an explicit profile_id (verified owned) or
  // the account's provider profile.
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

  // Merge eligibility metadata.
  const { data: cur } = await supabase
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .single();
  const meta = ((cur?.metadata as Record<string, unknown>) ?? {});
  const nowIso = new Date().toISOString();
  meta[ELIGIBILITY_COMPLETED_KEY] = nowIso;
  if (body.demand_profile) meta[DEMAND_PROFILE_KEY] = body.demand_profile;
  if (!meta[PLATFORM_TERMS_KEY]) meta[PLATFORM_TERMS_KEY] = nowIso;

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
