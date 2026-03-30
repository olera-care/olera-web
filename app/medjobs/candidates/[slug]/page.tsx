import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { StudentMetadata } from "@/lib/types";
import {
  getTrackLabel,
  formatAvailability,
  formatHoursPerWeek,
  formatDuration,
  hasVideo,
  getYouTubeId,
  INTENDED_SCHOOL_LABELS,
} from "@/lib/medjobs-helpers";
import ContactSection from "./ContactSection";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

  if (!data) return { title: "Candidate Not Found | Olera MedJobs" };

  const meta = data.metadata as StudentMetadata;
  const trackLabel = getTrackLabel(meta);
  return {
    title: `${data.display_name} — Student Caregiver | Olera MedJobs`,
    description: `${data.display_name} is a ${trackLabel || "healthcare"} student${meta.university ? ` at ${meta.university}` : ""} seeking healthcare experience${data.city ? ` in ${data.city}, ${data.state}` : ""}.`,
  };
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = getSupabase();
  const { data: profile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("type", "student")
    .eq("is_active", true)
    .single();

  if (!profile) notFound();

  const meta = (profile.metadata || {}) as StudentMetadata;
  const trackLabel = getTrackLabel(meta);
  const availLabel = formatAvailability(meta);
  const hoursLabel = formatHoursPerWeek(meta);
  const durationLabel = formatDuration(meta);
  const videoAvailable = hasVideo(meta);
  const youtubeId = videoAvailable ? getYouTubeId(meta.video_intro_url!) : null;
  const firstName = profile.display_name?.split(" ")[0] || "This candidate";

  // Build quick facts for the at-a-glance strip
  const quickFacts: { label: string; icon: string }[] = [];
  if (hoursLabel) quickFacts.push({ label: hoursLabel, icon: "clock" });
  if (durationLabel) quickFacts.push({ label: durationLabel, icon: "calendar" });
  if ((meta.certifications?.length ?? 0) > 0)
    quickFacts.push({ label: meta.certifications!.join(", "), icon: "badge" });
  if ((meta.languages?.length ?? 0) > 1)
    quickFacts.push({ label: `${meta.languages!.length} languages`, icon: "globe" });
  if (meta.years_caregiving && meta.years_caregiving > 0)
    quickFacts.push({ label: `${meta.years_caregiving}+ yr experience`, icon: "star" });

  return (
    <main className="min-h-screen bg-[#FAFAF8] pb-28 sm:pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8 sm:pt-12">
        <Link
          href="/medjobs/candidates"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Candidates
        </Link>

        {/* ── Hero Header ── */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Gradient banner */}
          <div className="h-28 sm:h-32 bg-gradient-to-br from-primary-300 via-primary-200 to-primary-50" />

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-12">
            {/* Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-white bg-primary-100 flex items-center justify-center shadow-md">
              <span className="text-3xl sm:text-4xl font-bold text-primary-600">
                {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>

            {/* Name & meta */}
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {profile.display_name}
                </h1>
                {meta.seeking_status === "actively_looking" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Actively Looking
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                {meta.university && (
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                    </svg>
                    {meta.university}
                  </span>
                )}
                {meta.major && (
                  <>
                    <span className="text-gray-300 hidden sm:inline">&middot;</span>
                    <span>{meta.major}</span>
                  </>
                )}
                {trackLabel && (
                  <>
                    <span className="text-gray-300 hidden sm:inline">&middot;</span>
                    <span>{trackLabel}</span>
                  </>
                )}
                {profile.city && profile.state && (
                  <>
                    <span className="text-gray-300 hidden sm:inline">&middot;</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      {profile.city}, {profile.state}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── Quick Facts Strip ── */}
            {quickFacts.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {quickFacts.map((fact) => (
                  <span
                    key={fact.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100"
                  >
                    <QuickFactIcon type={fact.icon} />
                    {fact.label}
                  </span>
                ))}
              </div>
            )}

            {/* Desktop-only contact CTA */}
            <div className="hidden sm:block">
              <ContactSection
                studentName={profile.display_name}
                studentEmail={profile.email}
                studentPhone={profile.phone}
                studentSlug={profile.slug}
                variant="inline"
              />
            </div>
          </div>
        </div>

        {/* ── About / Bio ── */}
        {profile.description && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h2 className="text-base font-semibold text-gray-900 mb-3">About {firstName}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {profile.description}
            </p>
          </div>
        )}

        {/* ── Intro Video ── */}
        {videoAvailable && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8 pb-0 sm:pb-0">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Meet {firstName}
              </h2>
            </div>
            {youtubeId ? (
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                    title={`${firstName}'s intro video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                <a
                  href={meta.video_intro_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-700">Watch Intro Video</p>
                    <p className="text-xs text-primary-600 mt-0.5">Hear directly from {firstName}</p>
                  </div>
                  <svg className="w-5 h-5 text-primary-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── Details Grid ── */}
        <div className="mt-6 grid sm:grid-cols-2 gap-6">
          {/* Education */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
              Education
            </h2>
            <dl className="space-y-3">
              {meta.university && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">University</dt>
                  <dd className="text-sm text-gray-900 font-medium">{meta.university}</dd>
                </div>
              )}
              {meta.major && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Major</dt>
                  <dd className="text-sm text-gray-900">{meta.major}</dd>
                </div>
              )}
              {meta.gpa && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">GPA</dt>
                  <dd className="text-sm text-gray-900 font-medium">{meta.gpa.toFixed(1)}</dd>
                </div>
              )}
              {meta.graduation_year && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Graduation</dt>
                  <dd className="text-sm text-gray-900">{meta.graduation_year}</dd>
                </div>
              )}
              {meta.intended_professional_school && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Intended School</dt>
                  <dd className="text-sm text-gray-900">{INTENDED_SCHOOL_LABELS[meta.intended_professional_school]}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Availability
            </h2>
            <dl className="space-y-3">
              {availLabel ? (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Schedule</dt>
                  <dd className="text-sm text-gray-900">{availLabel}</dd>
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">Schedule not specified</div>
              )}
              {hoursLabel && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Hours/Week</dt>
                  <dd className="text-sm text-gray-900">{hoursLabel}</dd>
                </div>
              )}
              {durationLabel && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Commitment</dt>
                  <dd className="text-sm text-gray-900">{durationLabel}</dd>
                </div>
              )}
              {meta.seasonal_availability && meta.seasonal_availability.length > 0 && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Seasonal</dt>
                  <dd className="flex flex-wrap gap-1.5 mt-1">
                    {meta.seasonal_availability.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Experience
            </h2>
            {(meta.certifications?.length ?? 0) > 0 ? (
              <div className="mb-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Certifications</dt>
                <div className="flex flex-wrap gap-1.5">
                  {meta.certifications!.map((cert) => (
                    <span key={cert} className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Certifications</dt>
                <dd className="text-sm text-gray-400 italic">None yet</dd>
              </div>
            )}
            {(meta.care_experience_types?.length ?? 0) > 0 && (
              <div className="mb-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Care Types</dt>
                <div className="flex flex-wrap gap-1.5">
                  {meta.care_experience_types!.map((type) => (
                    <span key={type} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-3">
              <dt className="text-xs text-gray-500 uppercase tracking-wide">Prior Experience</dt>
              <dd className="text-sm text-gray-900">
                {meta.years_caregiving === undefined || meta.years_caregiving === 0 ? (
                  <span className="text-gray-400 italic">New to caregiving — eager to learn</span>
                ) : (
                  `${meta.years_caregiving}+ years`
                )}
              </dd>
            </div>
            {(meta.languages?.length ?? 0) > 0 && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Languages</dt>
                <dd className="text-sm text-gray-900">{meta.languages!.join(", ")}</dd>
              </div>
            )}
          </div>

          {/* Reliability Signals */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Reliability
            </h2>
            <div className="space-y-2.5">
              {videoAvailable && (
                <ReliabilityItem checked label="Intro video submitted" />
              )}
              {meta.acknowledgments_completed && (
                <ReliabilityItem checked label="All acknowledgments completed" />
              )}
              {durationLabel && (
                <ReliabilityItem checked label={`Committed for ${durationLabel.toLowerCase()}`} />
              )}
              {meta.hours_per_week_range && ["15-20", "20+"].includes(meta.hours_per_week_range) && (
                <ReliabilityItem checked label="15+ hours/week availability" />
              )}
              {!videoAvailable && !meta.acknowledgments_completed && !durationLabel && (
                <p className="text-sm text-gray-400 italic">Reliability signals will appear as {firstName} completes profile steps.</p>
              )}
            </div>
          </div>

          {/* Verified Hours */}
          {(meta.total_verified_hours ?? 0) > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:col-span-2">
              <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-4">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                Verified Experience
              </h2>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary-600">{meta.total_verified_hours}</p>
                <p className="text-sm text-gray-500 mt-1">Healthcare Hours</p>
              </div>
              {(meta.verified_care_types?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                  {meta.verified_care_types!.map((type) => (
                    <span key={type} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Sticky CTA ── */}
      <div className="sm:hidden">
        <ContactSection
          studentName={profile.display_name}
          studentEmail={profile.email}
          studentPhone={profile.phone}
          studentSlug={profile.slug}
          variant="sticky"
        />
      </div>
    </main>
  );
}

/* ── Small helper components ── */

function QuickFactIcon({ type }: { type: string }) {
  const cls = "w-3.5 h-3.5 text-gray-400";
  switch (type) {
    case "clock":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
      );
    case "badge":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      );
    case "globe":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
      );
    case "star":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    default:
      return null;
  }
}

function ReliabilityItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      {checked ? (
        <svg className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4.5 h-4.5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
        </svg>
      )}
      <span className={`text-sm ${checked ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}
