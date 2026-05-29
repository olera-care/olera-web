import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculateProfileCompletenessPercentage } from "@/components/portal/profile/completeness";

/**
 * Lightweight relationship enrichment for the empathic_single arm.
 *
 * The empathic_single flow captures email only on the primary submit
 * (single-step capture). Relationship is asked AFTER as a soft pill row in
 * the ResultsSheet hero. When a pill is tapped, this endpoint backfills the
 * family profile created by /api/benefits/save-results, joined by the
 * anonymous session_id that's threaded through both events.
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
  let payload: { sessionId?: unknown; relationship?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = typeof payload.sessionId === "string" ? payload.sessionId.trim() : "";
  const relationship = payload.relationship;
  if (!sessionId) return NextResponse.json({ ok: true }, { status: 200 });
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

  // Find the most-recent account for this session. Multiple accounts can
  // exist if the user re-submitted (legitimate edge — preserve newest).
  const { data: account, error: acctErr } = await db
    .from("accounts")
    .select("id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (acctErr) {
    console.error("[update-relationship] account lookup failed:", acctErr);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  if (!account) {
    // No account yet — possible race with save-results. Return ok so the UI
    // doesn't show an error; the data point is lost but the lead is intact.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Find the family profile and merge the relationship into metadata.
  const { data: profile, error: profErr } = await db
    .from("business_profiles")
    .select("id, metadata, display_name, image_url, city, phone, description, care_types, email")
    .eq("account_id", account.id)
    .eq("type", "family")
    .maybeSingle();
  if (profErr || !profile) {
    console.error("[update-relationship] profile lookup failed:", profErr);
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const mergedMetadata = {
    ...(profile.metadata || {}),
    relationship_to_recipient: relationshipDisplayName(rel),
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
