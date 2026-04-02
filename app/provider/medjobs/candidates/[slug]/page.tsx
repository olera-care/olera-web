"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { StudentMetadata } from "@/lib/types";
import { getTrackLabel, formatAvailability, formatHoursPerWeek, formatDuration, hasVideo, INTENDED_SCHOOL_LABELS } from "@/lib/medjobs-helpers";

interface StudentProfile {
  id: string;
  slug: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  care_types: string[];
  metadata: StudentMetadata;
  created_at: string;
}

export default function ProviderStudentProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { activeProfile } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [message, setMessage] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [references, setReferences] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await createClient()
        .from("business_profiles")
        .select("id, slug, display_name, email, phone, city, state, description, care_types, metadata, created_at")
        .eq("slug", slug)
        .eq("type", "student")
        .eq("is_active", true)
        .single();

      setProfile(data as StudentProfile | null);

      // Fetch references and reviews
      if (data) {
        Promise.all([
          fetch(`/api/medjobs/references?studentProfileId=${data.id}`).then(r => r.json()).catch(() => ({ references: [] })),
          fetch(`/api/medjobs/student-reviews?studentProfileId=${data.id}`).then(r => r.json()).catch(() => ({ reviews: [] })),
        ]).then(([refsData, reviewsData]) => {
          setReferences(refsData.references || []);
          setReviews(reviewsData.reviews || []);
        });
      }

      // Check if already applied
      if (data && activeProfile) {
        const { data: existing } = await createClient()
          .from("connections")
          .select("id")
          .eq("from_profile_id", activeProfile.id)
          .eq("to_profile_id", data.id)
          .eq("type", "invitation")
          .single();

        const { data: reverseExisting } = await createClient()
          .from("connections")
          .select("id")
          .eq("from_profile_id", data.id)
          .eq("to_profile_id", activeProfile.id)
          .eq("type", "application")
          .single();

        if (existing || reverseExisting) setApplied(true);
      }

      setLoading(false);
    }
    load();
  }, [slug, activeProfile]);

  const handleInvite = useCallback(async () => {
    if (!profile || !activeProfile) return;
    setApplying(true);
    setApplyError("");

    try {
      const res = await fetch("/api/medjobs/apply-to-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerProfileId: profile.id,
          message: message.trim() || `We'd like to invite you to work with us at ${activeProfile.display_name}.`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setApplyError(data.error || "Failed to send invitation");
        return;
      }

      setApplied(true);
    } catch {
      setApplyError("Network error. Please try again.");
    } finally {
      setApplying(false);
    }
  }, [profile, activeProfile, message]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Candidate Not Found</h1>
        <p className="mt-2 text-gray-500">This student profile may no longer be active.</p>
        <Link href="/provider/medjobs/candidates" className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium">
          &larr; Back to Candidates
        </Link>
      </div>
    );
  }

  const meta = profile.metadata || ({} as StudentMetadata);
  const trackLabel = getTrackLabel(meta);
  const availLabel = formatAvailability(meta);
  const hoursLabel = formatHoursPerWeek(meta);
  const durationLabel = formatDuration(meta);
  const videoAvailable = hasVideo(meta);

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12"><div className="max-w-3xl mx-auto px-4">
      <Link href="/provider/medjobs/candidates" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
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

        {/* Intro Video — above fold, immediately playable */}
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

        {/* Contact Info */}
        <div className="mt-6 p-4 bg-primary-50 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h3>
          <div className="space-y-2">
            {profile.email && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <a href={`mailto:${profile.email}`} className="text-primary-600 hover:text-primary-700">{profile.email}</a>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <a href={`tel:${profile.phone}`} className="text-primary-600 hover:text-primary-700">{profile.phone}</a>
              </div>
            )}
            {meta.linkedin_url && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <a href={meta.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">LinkedIn Profile</a>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-4">
          {/* Schedule Interview CTA */}
          {profile.email && (
            <a
              href={`mailto:${profile.email}?subject=${encodeURIComponent(`Interview — ${activeProfile?.display_name || "Provider"} × ${profile.display_name}`)}&body=${encodeURIComponent(`Hi ${profile.display_name.split(" ")[0]},\n\nWe'd like to schedule a brief interview to learn more about your availability and experience. Are you free this week for a 15-minute call?\n\nBest,\n${activeProfile?.display_name || ""}`)}`}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              Schedule Interview
            </a>
          )}

          {/* Invite / Connect */}
          {applied ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700 font-medium text-center">
              Connected! You&apos;ve already reached out to this candidate.
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder={`Hi ${profile.display_name.split(" ")[0]}, we'd love to have you on our team...`}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none text-sm"
              />
              {applyError && (
                <p className="text-sm text-red-600">{applyError}</p>
              )}
              <button
                onClick={handleInvite}
                disabled={applying}
                className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors"
              >
                {applying ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          )}
        </div>
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
            {!videoAvailable && !meta.acknowledgments_completed && !durationLabel && (
              <p className="text-sm text-gray-400">No reliability signals yet</p>
            )}
          </div>
        </div>

        {/* Resume */}
        {meta.resume_url && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Documents</h2>
            <a
              href={meta.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">View Resume</span>
            </a>
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
          </div>
        )}
      </div>

      {/* References */}
      {references.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">References</h2>
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {references.map((ref: any) => (
              <div key={ref.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-gray-900">{ref.referee_name}</p>
                  <span className="text-xs text-gray-400 capitalize">{ref.relationship}</span>
                </div>
                {(ref.referee_title || ref.referee_organization) && (
                  <p className="text-xs text-gray-500">
                    {ref.referee_title && ref.referee_organization
                      ? `${ref.referee_title}, ${ref.referee_organization}`
                      : ref.referee_title || ref.referee_organization}
                  </p>
                )}
                {ref.recommendation && (
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed italic">&ldquo;{ref.recommendation}&rdquo;</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Reviews</h2>
          {(() => {
            const avg = reviews.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / reviews.length;
            return (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <span className="text-2xl font-bold text-gray-900">{avg.toFixed(1)}</span>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-5 h-5 ${star <= Math.round(avg) ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
            );
          })()}
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {reviews.map((review: any) => (
              <div key={review.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{review.relationship}</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                <p className="mt-1.5 text-xs text-gray-400">
                  — {review.reviewer_name}, {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div></div>
  );
}
