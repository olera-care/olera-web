import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { StudentMetadata } from "@/lib/types";
import { getTrackLabel, formatAvailability, formatHoursPerWeek, formatDuration, hasVideo, INTENDED_SCHOOL_LABELS } from "@/lib/medjobs-helpers";
import ContactSection from "./ContactSection";

// Lazy initialization to avoid build-time errors when env vars are not available
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

  return (
    <main className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/medjobs/candidates" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          &larr; Back to Candidates
        </Link>

        {/* Profile Header */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600">
                {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                {meta.university && <span>{meta.university}</span>}
                {trackLabel && (
                  <>
                    <span className="text-gray-300">&middot;</span>
                    <span>{trackLabel}</span>
                  </>
                )}
                {profile.city && profile.state && (
                  <>
                    <span className="text-gray-300">&middot;</span>
                    <span>{profile.city}, {profile.state}</span>
                  </>
                )}
              </div>
              {meta.seeking_status === "actively_looking" && (
                <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Actively Looking
                </span>
              )}
            </div>
          </div>

          {/* Intro Video — above fold */}
          {videoAvailable && (
            <div className="mt-6">
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
                  <p className="text-xs text-primary-600 mt-0.5">Hear directly from {profile.display_name.split(" ")[0]}</p>
                </div>
                <svg className="w-5 h-5 text-primary-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {profile.description && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.description}</p>
          )}

          {/* Contact — auth-aware */}
          <ContactSection
            studentName={profile.display_name}
            studentEmail={profile.email}
            studentPhone={profile.phone}
            studentSlug={profile.slug}
          />
        </div>

        {/* Details Grid */}
        <div className="mt-6 grid sm:grid-cols-2 gap-6">
          {/* Education */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Education</h2>
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
            <h2 className="text-base font-semibold text-gray-900 mb-4">Availability</h2>
            <dl className="space-y-3">
              {availLabel && (
                <div>
                  <dt className="text-xs text-gray-500 uppercase tracking-wide">Schedule</dt>
                  <dd className="text-sm text-gray-900">{availLabel}</dd>
                </div>
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
            <h2 className="text-base font-semibold text-gray-900 mb-4">Experience</h2>
            {(meta.certifications?.length ?? 0) > 0 && (
              <div className="mb-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Certifications</dt>
                <div className="flex flex-wrap gap-1.5">
                  {meta.certifications!.map((cert) => (
                    <span key={cert} className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {(meta.care_experience_types?.length ?? 0) > 0 && (
              <div className="mb-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Care Types</dt>
                <div className="flex flex-wrap gap-1.5">
                  {meta.care_experience_types!.map((type) => (
                    <span key={type} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {meta.years_caregiving !== undefined && (
              <div>
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Experience</dt>
                <dd className="text-sm text-gray-900">
                  {meta.years_caregiving === 0 ? "No prior experience" : `${meta.years_caregiving}+ years`}
                </dd>
              </div>
            )}
            {(meta.languages?.length ?? 0) > 0 && (
              <div className="mt-3">
                <dt className="text-xs text-gray-500 uppercase tracking-wide">Languages</dt>
                <dd className="text-sm text-gray-900">{meta.languages!.join(", ")}</dd>
              </div>
            )}
          </div>

          {/* Reliability Signals */}
          {(meta.acknowledgments_completed || durationLabel || videoAvailable) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Reliability</h2>
              <div className="space-y-2.5">
                {videoAvailable && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">Intro video submitted</span>
                  </div>
                )}
                {meta.acknowledgments_completed && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">All acknowledgments completed</span>
                  </div>
                )}
                {durationLabel && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">Committed for {durationLabel.toLowerCase()}</span>
                  </div>
                )}
                {meta.hours_per_week_range && ["15-20", "20+"].includes(meta.hours_per_week_range) && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-700">15+ hours/week</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verified Hours */}
          {(meta.total_verified_hours ?? 0) > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Verified Experience</h2>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-primary-600">{meta.total_verified_hours}</p>
                <p className="text-sm text-gray-500 mt-1">Healthcare Hours</p>
              </div>
              {(meta.verified_care_types?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                  {meta.verified_care_types!.map((type) => (
                    <span key={type} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
