import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { StudentMetadata } from "@/lib/types";
import {
  getTrackLabel,
  formatHoursPerWeek,
  formatDuration,
  SEASON_LABELS,
  getSeasonalStatusLabel,
  hasVideo,
  getYouTubeId,
  INTENDED_SCHOOL_LABELS,
} from "@/lib/medjobs-helpers";
import ContactSection from "./ContactSection";
import BackLink from "./BackLink";
import RefreshAfterCheckout from "@/components/medjobs/RefreshAfterCheckout";
import { getSampleBySlug, isSampleSlug } from "@/lib/medjobs/demo-candidate";

/** The subset of a student business_profiles row this page renders. Sample
 *  profiles are mapped into this same shape so they flow through one layout. */
interface ProfileView {
  id: string;
  slug: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  image_url: string | null;
  metadata: StudentMetadata | null;
  updated_at: string | null;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Check if current user is a provider with full access (paid AND verified) */
async function checkHasFullAccess(): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get the account ID (business_profiles.account_id references accounts.id, not auth.users.id)
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) return false;

    // Check if user has an organization profile with active subscription AND verified status
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("id, metadata, verification_state")
      .eq("account_id", account.id)
      .eq("type", "organization")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!profile) return false;

    // Phase A: any signed-in provider gets full candidate detail (incl.
    // contact). The old pilot + verified blurring is removed. See
    // docs/medjobs/PROVIDER_FUNNEL_BUILD_PLAN.md.
    return true;
  } catch {
    return false;
  }
}

/** Check if current user owns this profile (caregiver viewing own profile) */
async function checkIsOwnProfile(profileSlug: string): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Get the account ID (business_profiles.account_id references accounts.id, not auth.users.id)
    const { data: account } = await supabase
      .from("accounts")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!account) return false;

    // Check if user has a student/caregiver profile with this slug
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("account_id", account.id)
      .in("type", ["student", "caregiver"])
      .eq("slug", profileSlug)
      .limit(1)
      .maybeSingle();

    return !!profile;
  } catch {
    return false;
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabase();
  const { data } = await supabase
    .from("business_profiles")
    .select("display_name, metadata, city, state")
    .eq("slug", slug)
    .eq("type", "student")
    .eq("is_active", true)
    .single();

  if (!data) return { title: "Candidate Not Found | Olera" };

  const meta = data.metadata as StudentMetadata;
  const trackLabel = getTrackLabel(meta);

  // Redact full name in metadata to prevent de-platforming via view-source/SEO.
  const parts = (data.display_name || "").trim().split(/\s+/);
  const redactedName = parts.length <= 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;

  return {
    title: `${redactedName} — Pre-Health Intern | Olera`,
    description: `${redactedName} is a ${trackLabel || "healthcare"} student${meta.university ? ` at ${meta.university}` : ""} seeking healthcare experience${data.city ? ` in ${data.city}, ${data.state}` : ""}.`,
  };
}

/** Format a timestamp into "Updated Mar 28" or "Updated 3 days ago" */
function formatLastUpdated(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 14) return `Updated ${diffDays} days ago`;
  return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { slug } = await params;

  // Sample profile (shown when a campus has no real students yet). Renders the
  // SAME full layout as a real student — read-only, clearly labeled, with the
  // CTA routed to "grab a time" instead of an invite. Client-side data only;
  // never hits the DB.
  const sample = isSampleSlug(slug) ? getSampleBySlug(slug) : null;
  const isSample = !!sample;

  let profile: ProfileView;
  let providerHasFullAccess = false;
  let isOwnProfile = false;

  if (sample) {
    profile = {
      id: sample.id,
      slug: sample.slug,
      display_name: sample.display_name,
      email: null,
      phone: null,
      description: sample.description,
      city: sample.city,
      state: sample.state,
      image_url: sample.image_url ?? null,
      metadata: sample.metadata,
      updated_at: sample.created_at,
    };
  } else {
    // Check if current user is a provider with full access
    providerHasFullAccess = await checkHasFullAccess();
    // Check if caregiver is viewing their own profile
    isOwnProfile = await checkIsOwnProfile(slug);

    const supabase = getSupabase();
    const { data } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("slug", slug)
      .eq("type", "student")
      .eq("is_active", true)
      .single();

    if (!data) notFound();
    profile = data as ProfileView;
  }

  const meta = (profile.metadata || {}) as StudentMetadata;
  const trackLabel = getTrackLabel(meta);
  const hoursLabel = formatHoursPerWeek(meta);
  const durationLabel = formatDuration(meta);
  const videoAvailable = hasVideo(meta);
  const youtubeId = videoAvailable ? getYouTubeId(meta.video_intro_url!) : null;
  // Samples + own profile show the full name; others see first name only.
  const displayName = isOwnProfile || isSample
    ? (profile.display_name || "This candidate")
    : (profile.display_name?.split(" ")[0] || "This candidate");
  const firstName = profile.display_name?.split(" ")[0] || "This candidate";
  const lastUpdated = profile.updated_at ? formatLastUpdated(profile.updated_at) : null;

  // Generate signed URLs for private documents - for providers with full access (paid + verified) OR profile owner
  const canViewFullProfile = providerHasFullAccess || isOwnProfile;
  const adminSb = getAdminSupabase();
  async function getSignedUrl(path: string | undefined): Promise<string | null> {
    if (!canViewFullProfile) return null; // Only paid providers and profile owners can access
    if (!path || path.startsWith("http")) return path || null;
    const { data } = await adminSb.storage.from("student-documents").createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  }
  const resumeUrl = await getSignedUrl(meta.resume_url);

  // Candidate's verification status (driver's license + insurance on file)
  const candidateIsVerified = !!(meta.drivers_license_url && meta.car_insurance_url);

  // Build highlight chips (max 4, most important only)
  const highlights: string[] = [];
  if (hoursLabel) highlights.push(hoursLabel);
  if (durationLabel) highlights.push(durationLabel);
  if (meta.years_caregiving && meta.years_caregiving > 0) highlights.push(`${meta.years_caregiving}+ yr experience`);
  if ((meta.certifications?.length ?? 0) > 0) highlights.push(meta.certifications![0]);
  const displayHighlights = highlights.slice(0, 4);

  // Check if sections have content
  const hasAbout = !!(meta.why_caregiving || profile.description || meta.intended_professional_school);
  const hasCommitments = !!(meta.acknowledgments_completed || meta.ncns_pledge || meta.school_balance_pledge || meta.advance_notice_pledge || meta.prn_willing);
  const hasScenarios = meta.scenario_responses && meta.scenario_responses.length > 0;
  const hasReferences = meta.references && meta.references.length > 0;

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      {/* Refreshes auth state after returning from Stripe checkout.
          Webhook has already set the subscription flag server-side;
          this just pulls the updated DB state into client memory. */}
      <RefreshAfterCheckout />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-32 lg:pb-12">
        {/* Back link - hidden when viewing own profile */}
        <div className="mb-4">
          <BackLink studentSlug={profile.slug} />
        </div>

        {/* Sample-profile tag — small + green; the sticky CTA explains the rest. */}
        {isSample && (
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
              Sample profile
            </span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TWO-COLUMN LAYOUT: Content (left) + Sticky CTA (right)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start">

          {/* ─── LEFT COLUMN: All Content ─── */}
          <div className="space-y-6">

            {/* ─── HERO CARD: Identity Only ─── */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                {/* Photo - always show actual photo */}
                <div className="flex-shrink-0 flex justify-center sm:justify-start">
                  {profile.image_url ? (
                    <Image
                      src={profile.image_url}
                      alt={profile.display_name || "Candidate"}
                      width={120}
                      height={120}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-md ring-4 ring-white"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-md ring-4 ring-white">
                      <span className="text-3xl sm:text-4xl font-bold text-primary-600">
                        {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Identity Info */}
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  {/* Own profile label - subtle indicator */}
                  {isOwnProfile && (
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                      Your Public Profile
                    </p>
                  )}

                  {/* Name + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
                      {displayName}
                    </h1>
                    {meta.seeking_status === "actively_looking" && (
                      <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 w-fit mx-auto sm:mx-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ready to Start
                      </span>
                    )}
                  </div>

                  {/* University + Track + Location */}
                  <div className="mt-2 space-y-0.5">
                    {meta.university && (
                      <p className="text-base text-gray-700 font-medium">{meta.university}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      {[trackLabel, profile.city && profile.state ? `${profile.city}, ${profile.state}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  {/* Trust Signals - show for all users */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    {candidateIsVerified && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verified
                      </span>
                    )}
                    {videoAvailable && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        Video Intro
                      </span>
                    )}
                    {lastUpdated && (
                      <span className="text-xs text-gray-400">{lastUpdated}</span>
                    )}
                  </div>

                  {/* Highlight Chips - show for all users */}
                  {displayHighlights.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                      {displayHighlights.map((fact) => (
                        <span
                          key={fact}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 border border-gray-100"
                        >
                          {fact}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>


            {/* ─── RESUME CARD: All Content Sections with Dividers ─── */}
            {/* Section order optimized for provider screening: practical filters first, personality later */}
            <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">

              {/* ── Video Section ── */}
              {videoAvailable && (
                <div className="py-8 px-6 sm:px-8">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
                    Meet {firstName}
                  </h2>
                  <div className="rounded-xl overflow-hidden border border-gray-100">
                    {youtubeId ? (
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                          title={`${firstName}'s intro video`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <a
                        href={meta.video_intro_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-center gap-4 py-16 bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                      >
                        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                          <svg className="w-7 h-7 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">Watch Intro Video</p>
                          <p className="text-sm text-gray-500 mt-0.5">Hear directly from {firstName}</p>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* ── Availability Section ── */}
              <div className={`py-8 px-6 sm:px-8 ${videoAvailable ? "border-t border-gray-200" : ""}`}>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
                  Availability
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hoursLabel && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">Hours per Week</dt>
                      <dd className="text-lg font-semibold text-gray-900">{hoursLabel}</dd>
                    </div>
                  )}
                  {durationLabel && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">Commitment</dt>
                      <dd className="text-lg font-semibold text-gray-900">{durationLabel}</dd>
                    </div>
                  )}
                  {meta.seeking_status === "actively_looking" && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">Status</dt>
                      <dd className="text-lg font-semibold text-emerald-600">Ready to start</dd>
                    </div>
                  )}
                </div>

                {/* Year-Round Availability */}
                {meta.year_round_availability && Object.keys(meta.year_round_availability).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Year-Round Availability</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(["spring", "summer", "fall", "winter"] as const).map((season) => {
                        const data = meta.year_round_availability?.[season];
                        if (!data) return null;
                        return (
                          <div key={season} className="bg-gray-50 rounded-lg px-4 py-3">
                            <p className="text-xs font-medium text-gray-400 uppercase">{SEASON_LABELS[season]}</p>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5">{getSeasonalStatusLabel(data.status)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Schedule Grid */}
                {meta.course_schedule_grid && (
                  <details open className="mt-6 pt-6 border-t border-gray-100 group">
                    <summary className="flex items-center justify-between cursor-pointer list-none hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        View Class Schedule {meta.course_schedule_semester && `(${meta.course_schedule_semester})`}
                      </span>
                      <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-4">
                      <ScheduleGrid grid={meta.course_schedule_grid} />
                    </div>
                  </details>
                )}

                {/* Commitment Statement */}
                {meta.commitment_statement && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Commitment Statement</h3>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      &ldquo;{meta.commitment_statement}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* ── Qualifications Section ── */}
              <div className="py-8 px-6 sm:px-8 border-t border-gray-200">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
                  Qualifications
                </h2>

                {/* Verification Banner - show candidate's verification status */}
                {candidateIsVerified && (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">Verified Candidate</p>
                      <p className="text-xs text-emerald-600">Driver&apos;s license and car insurance on file</p>
                    </div>
                  </div>
                )}

                {/* Education & Experience Grid */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {meta.university && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">University</dt>
                      <dd className="text-base font-semibold text-gray-900">{meta.university}</dd>
                      {meta.major && <dd className="text-sm text-gray-600 mt-0.5">{meta.major}</dd>}
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">Caregiving Experience</dt>
                    <dd className="text-base font-semibold text-gray-900">
                      {meta.years_caregiving && meta.years_caregiving > 0
                        ? `${meta.years_caregiving}+ years`
                        : "New to caregiving"}
                    </dd>
                  </div>
                  {(meta.languages?.length ?? 0) > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">Languages</dt>
                      <dd className="text-base font-semibold text-gray-900">{meta.languages!.join(", ")}</dd>
                    </div>
                  )}
                  {meta.gpa && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">GPA</dt>
                      <dd className="text-base font-semibold text-gray-900">{meta.gpa.toFixed(1)}</dd>
                    </div>
                  )}
                </div>

                {/* Care Types */}
                {(meta.care_experience_types?.length ?? 0) > 0 && (
                  <div className="mt-6">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Care Experience</dt>
                    <dd className="flex flex-wrap gap-2">
                      {meta.care_experience_types!.map((type) => (
                        <span key={type} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-100">
                          {type}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {/* Certifications */}
                {(meta.certifications?.length ?? 0) > 0 && (
                  <div className="mt-6">
                    <dt className="text-sm font-medium text-gray-500 mb-2">Certifications</dt>
                    <dd className="flex flex-wrap gap-2">
                      {meta.certifications!.map((cert) => (
                        <span key={cert} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-semibold border border-primary-100">
                          {cert}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}

                {/* Verified Hours */}
                {(meta.total_verified_hours ?? 0) > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-primary-600">{meta.total_verified_hours}</p>
                        <p className="text-xs text-gray-500 font-medium uppercase">Verified Hours</p>
                      </div>
                      {(meta.verified_care_types?.length ?? 0) > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {meta.verified_care_types!.map((type) => (
                            <span key={type} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                              {type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Commitments Section ── */}
              {hasCommitments && (
                <div className="py-8 px-6 sm:px-8 border-t border-gray-200">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
                    {firstName}&apos;s Commitments
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Verified commitments this candidate has made</p>
                  <div className="space-y-3">
                    {meta.acknowledgments_completed && (
                      <>
                        <CommitmentItem text="I will be on time, professional, and communicate schedule changes 24+ hours in advance" />
                        <CommitmentItem text="I consent to a background check and drug test upon hire" />
                        <CommitmentItem text="I have reliable transportation and accept responsibility for transport costs" />
                      </>
                    )}
                    {meta.ncns_pledge && (
                      <CommitmentItem text="I understand that a no-call no-show means a vulnerable person goes without care. I commit to never doing this." />
                    )}
                    {meta.school_balance_pledge && (
                      <CommitmentItem text="I will maintain my scheduled shifts even during midterms and finals — I will plan ahead and communicate early if I need coverage." />
                    )}
                    {meta.advance_notice_pledge && (
                      <CommitmentItem text="I will keep my availability and schedule updated regularly and work with office staff if anything changes." />
                    )}
                    {meta.prn_willing && (
                      <CommitmentItem text="I am open to starting PRN/as-needed until we find the right ongoing fit." />
                    )}
                  </div>
                </div>
              )}

              {/* ── Screening Responses Section ── */}
              {hasScenarios && (
                <div className="py-8 px-6 sm:px-8 border-t border-gray-200">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
                    Screening Responses
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">{firstName}&apos;s responses to common care scenarios</p>
                  <div className="space-y-6">
                    {meta.scenario_responses!.map((sr, i) => (
                      <div key={i} className="border-l-4 border-primary-200 pl-5">
                        <p className="text-sm font-semibold text-gray-800 mb-2">&ldquo;{sr.question}&rdquo;</p>
                        <p className="text-sm text-gray-600 leading-relaxed">{sr.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── About Section ── */}
              {hasAbout && (
                <div className="py-8 px-6 sm:px-8 border-t border-gray-200">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
                    About {firstName}
                  </h2>
                  <div className="space-y-4">
                    {meta.why_caregiving && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Why I Want to Be a Caregiver
                        </h3>
                        <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                          {meta.why_caregiving}
                        </p>
                      </div>
                    )}
                    {profile.description && !meta.why_caregiving && (
                      <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                        {profile.description}
                      </p>
                    )}
                    {meta.intended_professional_school && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Career Goal:</span>{" "}
                        {INTENDED_SCHOOL_LABELS[meta.intended_professional_school]}
                        {meta.graduation_year && ` · Graduating ${meta.graduation_year}`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── References Section ── */}
              {hasReferences && (
                <div className="py-8 px-6 sm:px-8 border-t border-gray-200">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
                    References
                  </h2>
                  <div className="space-y-4">
                    {meta.references!.map((ref, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-gray-500">{ref.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{ref.name}</p>
                          <p className="text-xs text-gray-500">{ref.relationship}</p>
                          {ref.note && <p className="text-xs text-gray-400 mt-1 italic">{ref.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                    Contact details available after scheduling an interview.
                  </p>
                </div>
              )}

              {/* ── Documents & Links Section (Profile Owner / Paid Providers Only) ── */}
              {canViewFullProfile && (resumeUrl || meta.linkedin_url) && (
                <div className="py-8 px-6 sm:px-8 border-t border-gray-200">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-5">
                    Documents & Links
                  </h2>
                  <div className="space-y-3">
                    {meta.linkedin_url && (
                      <a
                        href={meta.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#0A66C2] transition-colors">LinkedIn Profile</p>
                          <p className="text-xs text-gray-500 truncate">{meta.linkedin_url}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    )}
                    {resumeUrl && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-red-600 transition-colors">Resume</p>
                          <p className="text-xs text-gray-500">View or download PDF</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </a>
                    )}
                  </div>
                  {isOwnProfile && (
                    <p className="mt-4 text-xs text-gray-400">
                      Only you and verified, subscribed providers can see this section.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ─── RIGHT COLUMN: Sticky CTA Sidebar (Desktop Only) ─── */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6">
                <ContactSection
                  candidate={{
                    id: profile.id,
                    slug: profile.slug,
                    displayName: profile.display_name || "This candidate",
                    email: profile.email,
                    phone: profile.phone,
                    imageUrl: profile.image_url,
                    city: profile.city,
                    state: profile.state,
                    metadata: meta,
                  }}
                  variant="inline"
                  isSample={isSample}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MOBILE STICKY CTA
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <ContactSection
          candidate={{
            id: profile.id,
            slug: profile.slug,
            displayName: profile.display_name || "This candidate",
            email: profile.email,
            phone: profile.phone,
            imageUrl: profile.image_url,
            city: profile.city,
            state: profile.state,
            metadata: meta,
          }}
          variant="sticky"
          isSample={isSample}
        />
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

const SCHED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SCHED_SLOTS = [
  { key: "8am", label: "8-10a" },
  { key: "10am", label: "10-12p" },
  { key: "12pm", label: "12-2p" },
  { key: "2pm", label: "2-4p" },
  { key: "4pm", label: "4-6p" },
  { key: "6pm", label: "6-8p" },
  { key: "8pm", label: "8p+" },
];

function ScheduleGrid({ grid: gridStr }: { grid: string }) {
  let grid: Record<string, boolean> = {};
  try {
    grid = JSON.parse(gridStr);
  } catch {
    return null;
  }
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[340px]">
        <div className="grid grid-cols-[50px_repeat(5,1fr)] gap-1 mb-1">
          <div />
          {SCHED_DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-gray-500 py-1">
              {d}
            </div>
          ))}
        </div>
        {SCHED_SLOTS.map((slot) => (
          <div key={slot.key} className="grid grid-cols-[50px_repeat(5,1fr)] gap-1 mb-1">
            <div className="flex items-center justify-end pr-2">
              <span className="text-[10px] text-gray-400">{slot.label}</span>
            </div>
            {SCHED_DAYS.map((day) => {
              const isClass = !!grid[`${day}-${slot.key}`];
              return (
                <div
                  key={day}
                  className={`h-7 rounded-md text-[10px] font-medium flex items-center justify-center ${
                    isClass ? "bg-gray-800 text-white" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {isClass ? "Class" : "Free"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function CommitmentItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/60">
      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
    </div>
  );
}
