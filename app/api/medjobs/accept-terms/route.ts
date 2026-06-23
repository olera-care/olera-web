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
import { createClient as createServiceClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { jobReadyEmail } from "@/lib/medjobs-email-templates";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";

const TERMS_KEY = "interview_terms_accepted_at";

/** Don't blast more than this many students from a single terms acceptance. */
const MAX_CATCHMENT_NOTIFY = 200;

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
    .select("metadata, slug, display_name, city, state")
    .eq("id", profileId)
    .single();
  const meta = ((cur?.metadata as Record<string, unknown>) ?? {});
  const nowIso = new Date().toISOString();
  // First-ever acceptance is the trigger for the "a job near you is open"
  // notification — re-submits preserve the original timestamp and re-send nothing.
  const firstTime = !meta[TERMS_KEY];
  if (firstTime) meta[TERMS_KEY] = nowIso;

  const { error } = await supabase
    .from("business_profiles")
    .update({ metadata: meta, updated_at: nowIso })
    .eq("id", profileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // First-time only: notify live students in this provider's catchment that a
  // caregiver job just opened. Fully isolated — never blocks terms acceptance.
  if (firstTime) {
    try {
      await notifyCatchmentStudents(supabase, {
        slug: (cur?.slug as string | null) ?? null,
        displayName: (cur?.display_name as string | null) ?? null,
        city: (cur?.city as string | null) ?? null,
        state: (cur?.state as string | null) ?? null,
      });
    } catch (err) {
      console.error("[medjobs/accept-terms] catchment notify error:", err);
    }
  }

  return NextResponse.json({ ok: true, profile_id: profileId });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceDb = SupabaseClient<any, any, any>;

/**
 * Notify live student caregivers near a provider that just opened a job. The
 * reverse catchment of go-live: a provider's city/state determines which campus
 * catchments it falls in; live students whose stored campus matches any of
 * those universities get the Graize-signed "a job near {Campus} is open" note
 * with a link to the provider's opportunity page.
 */
async function notifyCatchmentStudents(
  db: ServiceDb,
  provider: { slug: string | null; displayName: string | null; city: string | null; state: string | null },
) {
  if (!provider.city || !provider.state || !provider.slug) return;
  const pcity = provider.city.trim().toLowerCase();
  const pstate = provider.state.trim().toUpperCase();

  // Universities whose catchment includes this provider's city/state.
  const matchingUnis = PARTNER_UNIVERSITIES.filter((u) =>
    u.catchment.some((c) => c.city.toLowerCase() === pcity && c.state.toUpperCase() === pstate),
  );
  if (!matchingUnis.length) return;

  // A student's stored campus may be the university name or slug.
  const campusKeys = new Set<string>();
  for (const u of matchingUnis) {
    campusKeys.add(u.name.toLowerCase());
    campusKeys.add(u.slug.toLowerCase());
  }
  // Display campus for the email copy — prefer the first matching university name.
  const campusLabel = matchingUnis[0].name;

  // Live students. Student volume is small; filter campus membership in JS so we
  // tolerate either the name or slug form stored in metadata.campus.
  const { data: students } = await db
    .from("business_profiles")
    .select("id, slug, display_name, email, metadata")
    .eq("type", "student")
    .eq("is_active", true);
  if (!students?.length) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olera.care";
  const viewUrl = `${siteUrl}/provider/${provider.slug}?ctx=medjobs-student`;

  const seen = new Set<string>();
  let sent = 0;
  for (const s of students as Array<{ id: string; email: string | null; display_name: string | null; metadata: Record<string, unknown> | null }>) {
    if (!s.email) continue;
    const campus = (s.metadata?.campus as string | undefined)?.trim().toLowerCase();
    if (!campus || !campusKeys.has(campus)) continue;
    const key = s.email.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      await sendEmail({
        to: s.email,
        subject: `A caregiver job near ${campusLabel} is open`,
        html: jobReadyEmail({
          studentName: s.display_name,
          campus: campusLabel,
          providerName: provider.displayName,
          viewUrl,
        }),
        emailType: "medjobs_job_ready",
        recipientType: "student",
        recipientProfileId: s.id,
      });
      sent += 1;
    } catch (err) {
      console.error(`[medjobs/accept-terms] send failed for ${s.email}:`, err);
    }
    if (sent >= MAX_CATCHMENT_NOTIFY) break;
  }
  console.log(`[medjobs/accept-terms] notified ${sent} live students near ${campusLabel}`);
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
