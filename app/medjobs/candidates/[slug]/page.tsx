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

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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

const SCHED_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SCHED_SLOTS = [
  { key: "8am", label: "8-10a" }, { key: "10am", label: "10-12p" },
  { key: "12pm", label: "12-2p" }, { key: "2pm", label: "2-4p" },
  { key: "4pm", label: "4-6p" }, { key: "6pm", label: "6-8p" },
  { key: "8pm", label: "8p+" },
];

function ScheduleBuilderReadOnly({ grid: gridStr }: { grid: string }) {
  let grid: Record<string, boolean> = {};
  try { grid = JSON.parse(gridStr); } catch { return null; }
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[340px]">
        <div className="grid grid-cols-[50px_repeat(5,1fr)] gap-0.5 mb-0.5">
          <div />
          {SCHED_DAYS.map((d) => <div key={d} className="text-center text-[10px] font-medium text-gray-500 py-0.5">{d}</div>)}
        </div>
        {SCHED_SLOTS.map((slot) => (
          <div key={slot.key} className="grid grid-cols-[50px_repeat(5,1fr)] gap-0.5 mb-0.5">
            <div className="flex items-center justify-end pr-1"><span className="text-[10px] text-gray-400">{slot.label}</span></div>
            {SCHED_DAYS.map((day) => {
              const isClass = !!grid[`${day}-${slot.key}`];
              return <div key={day} className={`h-6 rounded text-[9px] font-medium flex items-center justify-center ${isClass ? "bg-gray-800 text-white" : "bg-emerald-50 text-emerald-500"}`}>{isClass ? "Class" : ""}</div>;
            })}
          </div>
        ))}
      </div>
    </div>
  );
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

  // Generate signed URLs for private documents (resume, license, insurance)
  const adminSb = getAdminSupabase();
  async function getSignedUrl(path: string | undefined): Promise<string | null> {
    if (!path || path.startsWith("http")) return path || null;
    const { data } = await adminSb.storage.from("student-documents").createSignedUrl(path, 3600);
    return data?.signedUrl || null;
  }
  const resumeUrl = await getSignedUrl(meta.resume_url);
  const licenseUrl = await getSignedUrl(meta.drivers_license_url);
  const insuranceUrl = await getSignedUrl(meta.car_insurance_url);

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

            {/* Save button */}
            <div className="flex-shrink-0">
              <SaveButton provider={saveData} variant="icon" />
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
        <div className="mt-5 flex flex-col lg:flex-row gap-5">
          {/* Video / Primary visual */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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

          {/* Sidebar — resume, social, bio, CTA */}
          <div className="lg:w-[280px] lg:flex-shrink-0 space-y-4">
            {/* Resume (prominent) */}
            {resumeUrl && (
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:border-primary-200 hover:bg-primary-25 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">View Resume</p>
                  <p className="text-xs text-gray-500">PDF &middot; Opens in new tab</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </a>
            )}

            {/* Social Links */}
            {(meta.linkedin_url || meta.instagram_url || meta.facebook_url || meta.tiktok_url) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
                {meta.linkedin_url && (
                  <a href={meta.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:text-[#0A66C2] transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center flex-shrink-0 transition-colors">
                      <svg className="w-4 h-4 text-gray-500 group-hover:text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-[#0A66C2] truncate">LinkedIn Profile</span>
                  </a>
                )}
                <div className="flex items-center gap-3">
                  {meta.instagram_url && (
                    <a href={meta.instagram_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-pink-50 flex items-center justify-center transition-colors" title="Instagram">
                      <svg className="w-4 h-4 text-gray-500 hover:text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                  )}
                  {meta.facebook_url && (
                    <a href={meta.facebook_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-blue-50 flex items-center justify-center transition-colors" title="Facebook">
                      <svg className="w-4 h-4 text-gray-500 hover:text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {meta.tiktok_url && (
                    <a href={meta.tiktok_url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors" title="TikTok">
                      <svg className="w-4 h-4 text-gray-500 hover:text-black" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* About / Personal Statement */}
            {(profile.description || meta.why_caregiving) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                {meta.why_caregiving ? (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Why I Want to Be a Caregiver</h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-[8] whitespace-pre-line">
                      {meta.why_caregiving}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">About {firstName}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-[8] whitespace-pre-line">
                      {profile.description}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Healthcare career context */}
            {meta.intended_professional_school && (
              <div className="bg-primary-50/50 rounded-2xl border border-primary-100 p-4">
                <p className="text-xs text-primary-700 leading-relaxed">
                  {firstName} is pursuing <strong>{INTENDED_SCHOOL_LABELS[meta.intended_professional_school]}</strong> and is using hands-on caregiving to build clinical empathy, patient communication skills, and real-world healthcare experience — the qualities that make strong hires and strong future clinicians.
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
              {meta.course_schedule_grid && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide mb-2">Class Schedule {meta.course_schedule_semester && `(${meta.course_schedule_semester})`}</dt>
                  <dd><ScheduleBuilderReadOnly grid={meta.course_schedule_grid} /></dd>
                </div>
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
              {meta.summer_availability && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Summer</dt>
                  <dd className="text-sm text-gray-900">{meta.summer_availability}</dd>
                </div>
              )}
              {meta.winter_availability && (
                <div>
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Winter</dt>
                  <dd className="text-sm text-gray-900">{meta.winter_availability}</dd>
                </div>
              )}
              {meta.commitment_statement && (
                <div className="pt-1 border-t border-gray-100">
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Commitment</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-line mt-0.5">{meta.commitment_statement}</dd>
                </div>
              )}
              {meta.availability_notes && (
                <div className="pt-1 border-t border-gray-100">
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Notes</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-line mt-0.5">{meta.availability_notes}</dd>
                </div>
              )}
              {meta.course_schedule_description && (
                <div className="pt-1 border-t border-gray-100">
                  <dt className="text-xs text-gray-400 uppercase tracking-wide">Course Schedule</dt>
                  <dd className="text-sm text-gray-900 whitespace-pre-line mt-0.5">{meta.course_schedule_description}</dd>
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
              <DocItem url={licenseUrl} checked={!!meta.drivers_license_url} label="Driver&rsquo;s license" expiration={meta.drivers_license_expiration} />
              <DocItem url={insuranceUrl} checked={!!meta.car_insurance_url} label="Car insurance" expiration={meta.car_insurance_expiration} />
              <DocItem url={resumeUrl} checked={!!resumeUrl} label="Resume" />
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

          {/* ── Commitments & Pledges (full-width, always shown) ── */}
          <div className="sm:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575a1.575 1.575 0 10-3.15 0v8.175a6.75 6.75 0 006.75 6.75h2.018a5.25 5.25 0 003.712-1.538l1.732-1.732a5.25 5.25 0 001.538-3.712.75.75 0 00-.75-.75 2.25 2.25 0 01-.75-.128" />
              </svg>
              {firstName}&rsquo;s Commitments
            </h2>
            <p className="text-xs text-gray-400 mb-3">Verified commitments this candidate has made</p>
            <div className="space-y-2">
              {/* Core attestations from onboarding */}
              {meta.acknowledgments_completed && (
                <>
                  <PledgeItem label="I will be on time, professional, and communicate schedule changes 24+ hours in advance" />
                  <PledgeItem label="I consent to a background check and drug test upon hire" />
                  <PledgeItem label="I have reliable transportation and accept responsibility for transport costs" />
                </>
              )}
              {/* Portal pledges */}
              {meta.ncns_pledge && (
                <PledgeItem label="I understand that a no-call no-show means a vulnerable person goes without care. I commit to never doing this." />
              )}
              {meta.school_balance_pledge && (
                <PledgeItem label="I will maintain my scheduled shifts even during midterms and finals — I will plan ahead and communicate early if I need coverage." />
              )}
              {meta.advance_notice_pledge && (
                <PledgeItem label="I will keep my availability and schedule updated regularly and work with office staff if anything changes." />
              )}
              {meta.prn_willing && (
                <PledgeItem label="I am open to starting PRN/as-needed until we find the right ongoing fit." />
              )}
              {meta.commitment_statement && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">In their own words</p>
                  <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{meta.commitment_statement}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Scenario Responses ── */}
        {meta.scenario_responses && meta.scenario_responses.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
              How I&rsquo;d Handle It
            </h2>
            <p className="text-xs text-gray-400 mb-4">{firstName}&rsquo;s responses to common care scenarios</p>
            <div className="space-y-4">
              {meta.scenario_responses.map((sr, i) => (
                <div key={i} className="border-l-2 border-primary-200 pl-4">
                  <p className="text-sm font-medium text-gray-700">&ldquo;{sr.question}&rdquo;</p>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{sr.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── References ── */}
        {meta.references && meta.references.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              References
            </h2>
            <div className="space-y-3">
              {meta.references.map((ref, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-gray-500">{ref.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ref.name}</p>
                    <p className="text-xs text-gray-500">{ref.relationship}</p>
                    {ref.note && <p className="text-xs text-gray-400 mt-0.5 italic">{ref.note}</p>}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">Contact details available after scheduling an interview.</p>
          </div>
        )}

        {/* ── Full "Why Caregiving" below fold (if sidebar showed bio instead) ── */}
        {meta.why_caregiving && profile.description && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              About {firstName}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{profile.description}</p>
          </div>
        )}
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

function DocItem({ url, checked, label, expiration }: { url: string | null; checked: boolean; label: string; expiration?: string }) {
  const inner = (
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
      <span className={`text-sm ${checked ? "text-gray-700" : "text-gray-400"}`}>
        {label}{checked ? " on file" : " — not uploaded"}
      </span>
      {url && (
        <svg className="w-3.5 h-3.5 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
        </svg>
      )}
    </div>
  );

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block hover:bg-gray-50 rounded-lg px-1 -mx-1 py-0.5 transition-colors">
        {inner}
        {expiration && <p className="text-[11px] text-gray-400 ml-6 mt-0.5">Expires {expiration}</p>}
      </a>
    );
  }

  return <div>{inner}</div>;
}

/* ── Pledge / commitment item ── */
function PledgeItem({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/50">
      <svg className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
      <p className="text-sm text-gray-700 leading-relaxed">{label}</p>
    </div>
  );
}
