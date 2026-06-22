/**
 * POST /api/medjobs/accept-terms — record the provider's acceptance of the
 * student-placement Terms. Sets business_profiles.metadata.interview_terms_accepted_at,
 * which is the MVP gate to schedule an interview AND the flag the CRM reads as
 * "this provider is a real Client" (lib/medjobs/partner-prospect-gate.ts). One
 * checkbox, triple duty: pricing consent + scheduling gate + CRM signal.
 *
 * Mirrors the eligibility/opportunity routes' auth + profile-resolution.
 */

import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const TERMS_KEY = "interview_terms_accepted_at";

export async function POST(request: Request) {
  const supabaseUser = await createServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { profile_id?: string } = {};
  try {
    body = (await request.json()) as { profile_id?: string };
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

  const { data: account } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!account) return NextResponse.json({ error: "No account" }, { status: 404 });
  const accountId = (account as { id: string }).id;

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

  const { data: cur } = await supabase
    .from("business_profiles")
    .select("metadata")
    .eq("id", profileId)
    .single();
  const meta = ((cur?.metadata as Record<string, unknown>) ?? {});
  const nowIso = new Date().toISOString();
  // Set once — preserve the original acceptance timestamp on re-submit.
  if (!meta[TERMS_KEY]) meta[TERMS_KEY] = nowIso;

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
