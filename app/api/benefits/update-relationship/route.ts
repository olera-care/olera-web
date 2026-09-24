import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { calculateProfileCompletenessPercentage } from "@/components/portal/profile/completeness";

/**
 * Lightweight relationship enrichment for the empathic_single arm.
 *
 * The empathic_single flow captures email only on the primary submit
 * (single-step capture). Relationship is asked AFTER as a soft pill row in
 * the ResultsSheet hero. When a pill is tapped, this endpoint backfills the
 * family profile created by /api/benefits/save-results.
 *
 * Auth (same as update-enrichment): the benefits results token save-results
 * returned, OR a signed-in user writing their own active profile. The old
 * lookup by anonymous session_id let anyone who knew a session id write to
 * that family's profile, so it is no longer accepted.
 *
 * Best-effort. Returns 200 on most failure modes — the lead is already
 * captured upstream and we don't want to surface a "save failed" error in
 * the success state. Logged for observability.
 */

const VALID_RELATIONSHIPS = ["my-parent", "my-spouse", "myself", "other-family"] as const;
type Relationship = (typeof VALID_RELATIONSHIPS)[number];

function relationshipDisplayName(rel: Relationship): string {
  switch (rel) {
    case "my-parent": return "Parent";
    case "my-spouse": return "Spouse";
    case "myself": return "Self";
    case "other-family": return "Family member";
  }
}

export async function POST(req: Request) {
  let payload: { token?: unknown; relationship?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = typeof payload.token === "string" ? payload.token.trim() : "";
  const relationship = payload.relationship;
  if (typeof relationship !== "string" || !VALID_RELATIONSHIPS.includes(relationship as Relationship)) {
    return NextResponse.json({ error: "Invalid relationship" }, { status: 400 });
  }
  const rel = relationship as Relationship;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("[update-relationship] missing env");
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  const db = createClient(supabaseUrl, serviceKey);

  // Resolve the profile the caller is allowed to write.
  let profileId: string | null = null;
  if (token) {
    const { data: tokenRow } = await db
      .from("benefits_results_tokens")
      .select("profile_id")
      .eq("token", token)
      .maybeSingle();
    profileId = tokenRow?.profile_id ?? null;
  }
  if (!profileId) {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: account } = await db
        .from("accounts")
        .select("active_profile_id")
        .eq("user_id", user.id)
        .maybeSingle();
      profileId = account?.active_profile_id ?? null;
    }
  }
  if (!profileId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // Find the family profile and merge the relationship into metadata.
  const { data: profile, error: profErr } = await db
    .from("business_profiles")
    .select("id, metadata, display_name, image_url, city, phone, description, care_types, email")
    .eq("id", profileId)
    .eq("type", "family")
    .maybeSingle();
  if (profErr || !profile) {
    console.error("[update-relationship] profile lookup failed:", profErr);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const mergedMetadata = {
    ...(profile.metadata || {}),
    relationship_to_recipient: relationshipDisplayName(rel),
    // `relationship` is the enum key save-results writes and readers use
    // (/m/[token], benefits-guidance). relationship_code was a write-only
    // typo; kept so rows written before this fix stay consistent.
    relationship: rel,
    relationship_code: rel,
  };

  // Recalculate profile completeness with new relationship data
  const newCompleteness = calculateProfileCompletenessPercentage(
    {
      display_name: profile.display_name,
      image_url: profile.image_url,
      city: profile.city,
      phone: profile.phone,
      description: profile.description,
      care_types: profile.care_types,
      metadata: mergedMetadata,
    },
    profile.email
  );
  mergedMetadata.profile_completeness = newCompleteness;

  const { error: updateErr } = await db
    .from("business_profiles")
    .update({ metadata: mergedMetadata })
    .eq("id", profile.id);
  if (updateErr) {
    console.error("[update-relationship] update failed:", updateErr);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
