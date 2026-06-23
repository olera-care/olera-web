import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { candidateReadyEmail } from "@/lib/medjobs-email-templates";
import { PARTNER_UNIVERSITIES, type PartnerUniversity } from "@/lib/staffing-outreach/partner-universities";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** staffing_outreach statuses that represent a provider we're actively working
 * (we have an email + a live relationship). Excludes terminal/dead rows. */
const ACTIVE_OUTREACH_STATUSES = ["queued", "sequencing", "needs_call", "consented", "activated", "enrolled"];

/** Don't blast the entire catchment from a single go-live. The cold lane
 * verifies + suppresses per address; this is a belt-and-suspenders ceiling. */
const MAX_CATCHMENT_NOTIFY = 150;

/** Resolve a student's stored campus (a university DISPLAY NAME, occasionally a
 * slug) to its PartnerUniversity. Matched by name first, then slug. */
function resolvePartnerUniversity(campus: string): PartnerUniversity | null {
  const c = campus.trim().toLowerCase();
  return (
    PARTNER_UNIVERSITIES.find((u) => u.name.toLowerCase() === c) ??
    PARTNER_UNIVERSITIES.find((u) => u.slug.toLowerCase() === c) ??
    null
  );
}

/**
 * POST /api/medjobs/go-live
 *
 * Server-authoritative "go live" for a student caregiver. Sets is_active +
 * application_completed (replacing the old client-side metadata write), and —
 * on the FIRST time the student goes live — notifies providers being worked in
 * the student's campus catchment that a new candidate is ready to interview.
 *
 * The catchment notification is fully isolated: any failure there never blocks
 * the go-live itself.
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = getAdminClient();

    const { data: account } = await admin
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!account) return NextResponse.json({ error: "No account" }, { status: 403 });

    const { data: student } = await admin
      .from("business_profiles")
      .select("id, slug, display_name, is_active, metadata")
      .eq("account_id", account.id)
      .eq("type", "student")
      .single();
    if (!student) return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

    const wasLive = !!student.is_active;
    const meta = (student.metadata ?? {}) as Record<string, unknown>;

    // Idempotent write — is_active + application_completed.
    const { error: updateError } = await admin
      .from("business_profiles")
      .update({
        is_active: true,
        metadata: { ...meta, application_completed: true },
        updated_at: new Date().toISOString(),
      })
      .eq("id", student.id);
    if (updateError) {
      console.error("[medjobs/go-live] update error:", updateError);
      return NextResponse.json({ error: "Failed to go live" }, { status: 500 });
    }

    // First-time only: notify catchment providers. Isolated from the response.
    const firstTime = !wasLive;
    if (firstTime) {
      try {
        await notifyCatchmentProviders(admin, {
          slug: student.slug,
          campus: typeof meta.campus === "string" ? meta.campus : null,
        });
      } catch (err) {
        console.error("[medjobs/go-live] catchment notify error:", err);
      }
    }

    return NextResponse.json({ ok: true, firstTime });
  } catch (err) {
    console.error("[medjobs/go-live] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function notifyCatchmentProviders(
  admin: ReturnType<typeof getAdminClient>,
  student: { slug: string | null; campus: string | null },
) {
  if (!student.campus || !student.slug) return;
  const uni = resolvePartnerUniversity(student.campus);
  if (!uni) {
    console.log(`[medjobs/go-live] no PartnerUniversity for campus "${student.campus}" — skipping notify`);
    return;
  }

  // The campus's outreach batch(es).
  const { data: batches } = await admin
    .from("staffing_batches")
    .select("id")
    .eq("university_slug", uni.slug)
    .neq("status", "completed");
  const batchIds = (batches ?? []).map((b: { id: string }) => b.id);
  if (!batchIds.length) return;

  // Providers being actively worked in those batches.
  const { data: outreach } = await admin
    .from("staffing_outreach")
    .select("provider_id, sequence_email, research_data")
    .in("batch_id", batchIds)
    .in("status", ACTIVE_OUTREACH_STATUSES);
  if (!outreach?.length) return;

  // Hydrate provider names + fallback emails from the directory.
  const providerIds = Array.from(new Set(outreach.map((o: { provider_id: string }) => o.provider_id)));
  const { data: providers } = await admin
    .from("olera-providers")
    .select("provider_id, provider_name, email")
    .in("provider_id", providerIds);
  const providerMap = new Map<string, { provider_name: string | null; email: string | null }>(
    (providers ?? []).map((p: { provider_id: string; provider_name: string | null; email: string | null }) => [
      p.provider_id,
      { provider_name: p.provider_name, email: p.email },
    ]),
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const viewUrl = `${siteUrl}/medjobs/candidates/${student.slug}`;

  // Build a de-duplicated recipient list (one email per address).
  const seen = new Set<string>();
  const recipients: Array<{ email: string; providerName: string | null }> = [];
  for (const o of outreach as Array<{ provider_id: string; sequence_email: string | null; research_data: Record<string, unknown> | null }>) {
    const dir = providerMap.get(o.provider_id);
    const email =
      o.sequence_email ||
      (o.research_data?.general_email as string | undefined) ||
      dir?.email ||
      null;
    if (!email) continue;
    const key = email.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recipients.push({ email, providerName: dir?.provider_name ?? null });
    if (recipients.length >= MAX_CATCHMENT_NOTIFY) break;
  }

  for (const r of recipients) {
    try {
      await sendEmail({
        to: r.email,
        subject: `Ready for interview: a student caregiver near ${uni.name}`,
        html: candidateReadyEmail({
          providerName: r.providerName,
          campus: uni.name,
          candidateName: null,
          viewUrl,
        }),
        emailType: "medjobs_candidate_ready",
        recipientType: "provider",
      });
    } catch (err) {
      console.error(`[medjobs/go-live] send failed for ${r.email}:`, err);
    }
  }
  console.log(`[medjobs/go-live] notified ${recipients.length} catchment providers for ${uni.name}`);
}
