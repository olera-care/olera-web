import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import SaveButton from "@/components/providers/SaveButton";

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
  const lastUpdated = profile.updated_at ? formatLastUpdated(profile.updated_at) : null;

  // Build quick facts
  const quickFacts: string[] = [];
  if (hoursLabel) quickFacts.push(hoursLabel);
  if (durationLabel) quickFacts.push(durationLabel);
  if ((meta.certifications?.length ?? 0) > 0) quickFacts.push(meta.certifications!.join(", "));
  if ((meta.languages?.length ?? 0) > 1) quickFacts.push(`${meta.languages!.length} languages`);
  if (meta.years_caregiving && meta.years_caregiving > 0) quickFacts.push(`${meta.years_caregiving}+ yr experience`);

  // Save button data
  const saveData = {
    providerId: profile.id,
    slug: profile.slug,
    name: profile.display_name,
    location: [profile.city, profile.state].filter(Boolean).join(", "),
    careTypes: profile.care_types || [],
    image: profile.image_url || null,
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] pb-28 sm:pb-12">
      <div className="max-w-4xl mx-auto px-4 pt-6 sm:pt-10">
        <Link
          href="/medjobs/candidates"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Candidates
        </Link>

        {/* ── Identity Bar ── */}
        <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.image_url ? (
                <Image
                  src={profile.image_url}
                  alt={profile.display_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                  {profile.display_name}
                </h1>
                {meta.seeking_status === "actively_looking" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Actively Looking
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500">
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

              {lastUpdated && (
                <p className="mt-1 text-xs text-gray-400">{lastUpdated}</p>
              )}
            </div>

            {/* Save button (desktop) */}
            <div className="hidden sm:block flex-shrink-0">
              <SaveButton provider={saveData} variant="pill" />
            </div>
          </div>

          {/* Quick Facts */}
          {quickFacts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {quickFacts.map((fact) => (
                <span
                  key={fact}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100"
                >
                  {fact}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Video Hero + Sidebar ── */}
        <div className="mt-5 grid lg:grid-cols-[1fr_280px] gap-5">
          {/* Video / Primary visual */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {videoAvailable && youtubeId ? (
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                  title={`${firstName}'s intro video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : videoAvailable ? (
              <a
                href={meta.video_intro_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 p-8 sm:p-12 hover:bg-gray-50 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">Watch Intro Video</p>
                  <p className="text-sm text-gray-500 mt-0.5">Hear directly from {firstName}</p>
                </div>
              </a>
            ) : (
              /* No video — show a larger avatar as the primary visual */
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                {profile.image_url ? (
                  <Image
                    src={profile.image_url}
                    alt={profile.display_name}
                    width={160}
                    height={160}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-primary-100 flex items-center justify-center shadow-md">
                    <span className="text-6xl sm:text-7xl font-bold text-primary-600">
                      {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <p className="mt-4 text-lg font-semibold text-gray-900">{firstName}</p>
                {trackLabel && <p className="text-sm text-gray-500">{trackLabel} Student</p>}
              </div>
            )}
          </div>

          {/* Sidebar — links, bio, CTA */}
          <div className="space-y-4">
            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                {meta.resume_url && (
                  <a
                    href={meta.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Download Resume
                  </a>
                )}
                {meta.linkedin_url && (
                  <a
                    href={meta.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    LinkedIn Profile
                  </a>
                )}
                {!meta.resume_url && !meta.linkedin_url && (
                  <p className="text-sm text-gray-400 italic">No links uploaded yet</p>
                )}
              </div>
            </div>

            {/* About / Personal Statement */}
            {profile.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">About {firstName}</h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-[8] whitespace-pre-line">
                  {profile.description}
                </p>
              </div>
            )}

            {/* Desktop CTA */}
            <div className="hidden sm:block">
              <ContactSection
                studentName={profile.display_name}
                studentEmail={profile.email}
                studentPhone={profile.phone}
                studentSlug={profile.slug}
                variant="sidebar"
              />
            </div>
          </div>
        </div>

        {/* ── Below the fold: scrollable while video plays ── */}
        <div className="mt-6 grid sm:grid-cols-2 gap-5">

          {/* Availability */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Availability
            </h2>
            <dl className="space-y-2.5">
              {availLabel ? (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Schedule</dt>
                  <dd className="text-sm text-gray-900">{availLabel}</dd>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">Schedule not specified</p>
              )}
              {hoursLabel && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Hours/Week</dt>
                  <dd className="text-sm text-gray-900">{hoursLabel}</dd>
                </div>
              )}
              {durationLabel && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Commitment</dt>
                  <dd className="text-sm text-gray-900">{durationLabel}</dd>
                </div>
              )}
              {meta.seasonal_availability && meta.seasonal_availability.length > 0 && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Seasonal</dt>
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

          {/* Qualifications & Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Qualifications & Documents
            </h2>
            <div className="space-y-2">
              <QualItem checked={!!meta.drivers_license_url} label="Driver&rsquo;s license on file" />
              <QualItem checked={!!meta.car_insurance_url} label="Car insurance on file" />
              <QualItem checked={!!meta.transportation} label="Own transportation" />
              <QualItem checked={!!meta.acknowledgments_completed} label="Background check consent" />
              {(meta.certifications?.length ?? 0) > 0 && (
                <div className="pt-1.5 flex flex-wrap gap-1.5">
                  {meta.certifications!.map((cert) => (
                    <span key={cert} className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reliability Signals */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              Reliability
            </h2>
            <div className="space-y-2">
              {videoAvailable && <QualItem checked label="Intro video submitted" />}
              {meta.acknowledgments_completed && <QualItem checked label="All acknowledgments completed" />}
              {durationLabel && <QualItem checked label={`Committed for ${durationLabel.toLowerCase()}`} />}
              {meta.hours_per_week_range && ["15-20", "20+"].includes(meta.hours_per_week_range) && (
                <QualItem checked label="15+ hours/week availability" />
              )}
              {!videoAvailable && !meta.acknowledgments_completed && !durationLabel && (
                <p className="text-sm text-gray-400 italic">Signals appear as {firstName} completes profile steps.</p>
              )}
            </div>
          </div>

          {/* Experience & Education */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
              </svg>
              Experience & Education
            </h2>
            <dl className="space-y-2.5">
              {meta.university && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">University</dt>
                  <dd className="text-sm text-gray-900 font-medium">{meta.university}</dd>
                </div>
              )}
              {meta.major && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Major</dt>
                  <dd className="text-sm text-gray-900">{meta.major}</dd>
                </div>
              )}
              {meta.gpa && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">GPA</dt>
                  <dd className="text-sm text-gray-900 font-medium">{meta.gpa.toFixed(1)}</dd>
                </div>
              )}
              {meta.graduation_year && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Graduation</dt>
                  <dd className="text-sm text-gray-900">{meta.graduation_year}</dd>
                </div>
              )}
              {meta.intended_professional_school && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Intended School</dt>
                  <dd className="text-sm text-gray-900">{INTENDED_SCHOOL_LABELS[meta.intended_professional_school]}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">Prior Caregiving</dt>
                <dd className="text-sm text-gray-900">
                  {meta.years_caregiving && meta.years_caregiving > 0
                    ? `${meta.years_caregiving}+ years`
                    : <span className="text-gray-400 italic">New to caregiving — eager to learn</span>}
                </dd>
              </div>
              {(meta.care_experience_types?.length ?? 0) > 0 && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Care Types</dt>
                  <dd className="flex flex-wrap gap-1.5 mt-1">
                    {meta.care_experience_types!.map((type) => (
                      <span key={type} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {type}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {(meta.languages?.length ?? 0) > 0 && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Languages</dt>
                  <dd className="text-sm text-gray-900">{meta.languages!.join(", ")}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Verified Hours (full-width if present) */}
          {(meta.total_verified_hours ?? 0) > 0 && (
            <div className="sm:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
                Verified Experience
              </h2>
              <div className="text-center py-3">
                <p className="text-3xl font-bold text-primary-600">{meta.total_verified_hours}</p>
                <p className="text-sm text-gray-500 mt-0.5">Healthcare Hours</p>
              </div>
              {(meta.verified_care_types?.length ?? 0) > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
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

/* ── Qualification / reliability check item ── */
function QualItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      <span className={`text-sm ${checked ? "text-gray-700" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}
