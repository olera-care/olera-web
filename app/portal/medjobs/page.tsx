"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import { LifecycleProgress } from "@/components/medjobs/LifecycleProgress";
import type { StudentMetadata } from "@/lib/types";
import { getTrackLabel, INTENDED_SCHOOL_LABELS } from "@/lib/medjobs-helpers";

/* ─── Types ───────────────────────────────────────────────── */

interface StudentProfile {
  id: string;
  slug: string;
  display_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  image_url: string | null;
  city: string | null;
  state: string | null;
  metadata: StudentMetadata;
}

/* ─── Helpers ─────────────────────────────────────────────── */

function getCurrentSemester(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  if (month >= 0 && month <= 4) return `Spring ${year}`;
  if (month >= 5 && month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

function getLifecyclePhase(meta: StudentMetadata, isActive: boolean): "apply" | "verify" | "interview" | "hired" {
  if (!meta.application_completed) return "apply";
  if (!meta.video_intro_url || !meta.drivers_license_url || !meta.car_insurance_url) return "verify";
  if (isActive) return "interview";
  return "verify";
}

function getVerificationItems(meta: StudentMetadata) {
  return [
    { key: "video", label: "Intro video", desc: "2\u20133 min — providers want to see who they\u2019re hiring", done: !!meta.video_intro_url },
    { key: "license", label: "Driver\u2019s license", desc: "Verifies your identity", done: !!meta.drivers_license_url },
    { key: "insurance", label: "Car insurance", desc: "Confirms you can get to assignments safely", done: !!meta.car_insurance_url },
  ];
}

function getProfileSections(meta: StudentMetadata, profile: StudentProfile) {
  return [
    { key: "photo", label: "Profile photo", done: !!profile.image_url },
    { key: "schedule", label: "Semester schedule", done: !!meta.course_schedule_description },
    { key: "resume", label: "Resume or LinkedIn", done: !!(meta.resume_url || meta.linkedin_url) },
    { key: "why", label: "Why I want to be a caregiver", done: !!meta.why_caregiving },
    { key: "basic", label: "Basic info", done: true },
    { key: "background", label: "Background", done: true },
    { key: "availability", label: "Availability", done: !!(meta.hours_per_week_range || meta.duration_commitment) },
  ];
}

/* ─── Inline Upload ────────────────────────────────────────── */

function InlineUpload({ profileId, documentType, onComplete, accept, label }: {
  profileId: string;
  documentType: "drivers_license" | "car_insurance" | "photo";
  onComplete: () => void;
  accept?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profileId);
      if (documentType === "photo") {
        const res = await fetch("/api/medjobs/upload-photo", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Upload failed."); return; }
      } else {
        formData.append("documentType", documentType);
        const res = await fetch("/api/medjobs/upload-document", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Upload failed."); return; }
      }
      onComplete();
    } catch { setError("Network error."); }
    finally { setUploading(false); }
  };

  return (
    <>
      <input ref={inputRef} type="file"
        accept={accept || "image/jpeg,image/png,image/webp,application/pdf"}
        className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}
        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
        {uploading ? "Uploading..." : (label || "Upload")}
      </button>
    </>
  );
}

/* ─── Video Submit Inline ──────────────────────────────────── */

function VideoSubmit({ slug, onComplete }: { slug: string; onComplete: () => void }) {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/medjobs/submit-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, videoUrl: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to submit."); return; }
      onComplete();
    } catch { setError("Network error."); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-3">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste YouTube or Loom link"
        className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button type="button" disabled={submitting || !url.trim()} onClick={handleSubmit}
        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
        {submitting ? "Submitting..." : "Submit video"}
      </button>
    </div>
  );
}

/* ─── Metadata Editor ──────────────────────────────────────── */

function MetadataEditor({ profileId, field, value, onSave, placeholder, multiline, extraFields }: {
  profileId: string;
  field: string;
  value: string;
  onSave: () => void;
  placeholder?: string;
  multiline?: boolean;
  extraFields?: Record<string, unknown>;
}) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const meta = (current?.metadata || {}) as Record<string, unknown>;
      meta[field] = text.trim() || null;
      if (extraFields) { Object.assign(meta, extraFields); }
      await sb.from("business_profiles").update({ metadata: meta }).eq("id", profileId);
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      {multiline ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors"
        />
      )}
      <button type="button" disabled={saving} onClick={handleSave}
        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

/* ─── Section Card ─────────────────────────────────────────── */

function SectionCard({ label, done, children, defaultOpen }: {
  label: string;
  done: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || false);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {done ? (
            <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
          )}
          <span className={`text-sm font-medium ${done ? "text-gray-600" : "text-gray-900"}`}>{label}</span>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-50">
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function StudentPortalPage() {
  const { account, profiles, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (studentProfile) { fetchFullProfile(studentProfile.id); return; }
    if (account?.id) { fetchByAccount(account.id); return; }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, account?.id, profiles, refreshKey]);

  const fetchFullProfile = useCallback(async (profileId: string) => {
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data } = await sb.from("business_profiles").select("id, slug, display_name, email, phone, is_active, image_url, city, state, metadata").eq("id", profileId).single();
      if (data) setProfile(data as StudentProfile);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchByAccount = useCallback(async (accountId: string) => {
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data } = await sb.from("business_profiles").select("id, slug, display_name, email, phone, is_active, image_url, city, state, metadata").eq("account_id", accountId).eq("type", "student").limit(1).maybeSingle();
      if (data) setProfile(data as StudentProfile);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const refresh = () => setRefreshKey((k) => k + 1);

  /* ── Loading / Empty states ── */

  if (authLoading || loading) {
    return <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center"><div className="text-gray-300 text-sm">Loading...</div></main>;
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">No profile yet</h1>
          <p className="text-gray-400 mb-6">Apply to MedJobs to get started.</p>
          <Link href="/medjobs/apply" className="inline-flex items-center justify-center px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
            Apply now
          </Link>
        </div>
      </main>
    );
  }

  const meta = profile.metadata || {} as StudentMetadata;
  const phase = getLifecyclePhase(meta, profile.is_active);
  const verificationItems = getVerificationItems(meta);
  const verificationDone = verificationItems.every((v) => v.done);
  const profileSections = getProfileSections(meta, profile);
  const profileDoneCount = profileSections.filter((s) => s.done).length;
  const completeness = Math.round(((verificationItems.filter((v) => v.done).length + profileDoneCount) / (verificationItems.length + profileSections.length)) * 100);
  const firstName = profile.display_name?.split(" ")[0] || "there";
  const trackLabel = getTrackLabel(meta);
  const currentSemester = getCurrentSemester();

  // Find the first incomplete verification item to auto-open
  const nextVerification = verificationItems.find((v) => !v.done);

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Lifecycle bar */}
        <LifecycleProgress currentPhase={phase} />

        {/* ── Profile Header ── */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.image_url ? (
                <img src={profile.image_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-400">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-900 truncate">{profile.display_name}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
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
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${completeness}%` }} />
                </div>
                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{completeness}%</span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              profile.is_active ? "bg-emerald-50 text-emerald-700" : verificationDone ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                profile.is_active ? "bg-emerald-500" : verificationDone ? "bg-amber-500" : "bg-gray-300"
              }`} />
              {profile.is_active ? "Live — providers can find you" : verificationDone ? "Under review" : "Verification incomplete"}
            </div>
          </div>

          {profile.is_active && (
            <Link href={`/medjobs/candidates/${profile.slug}`}
              className="mt-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View your public profile
            </Link>
          )}
        </div>

        {/* ── Verification Section ── */}
        {!verificationDone && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Verification</h2>
              <span className="text-xs text-gray-400">{verificationItems.filter((v) => v.done).length}/{verificationItems.length}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              We verify every student to protect the families you&apos;ll care for. Complete these to go live.
            </p>
            <div className="space-y-3">
              {verificationItems.map((item) => (
                <SectionCard key={item.key} label={item.label} done={item.done} defaultOpen={nextVerification?.key === item.key}>
                  {item.done ? (
                    <p className="text-sm text-emerald-600">Submitted</p>
                  ) : item.key === "video" ? (
                    <div>
                      <p className="text-sm text-gray-500 mb-3">{item.desc}</p>
                      <VideoSubmit slug={profile.slug} onComplete={refresh} />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-500 mb-3">{item.desc}</p>
                      <InlineUpload
                        profileId={profile.id}
                        documentType={item.key as "drivers_license" | "car_insurance"}
                        onComplete={refresh}
                      />
                    </div>
                  )}
                </SectionCard>
              ))}
            </div>
          </div>
        )}

        {/* ── Profile Sections ── */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Your profile</h2>
            <span className="text-xs text-gray-400">{profileDoneCount}/{profileSections.length}</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            This is what providers see. A stronger profile means more interview requests.
          </p>

          <div className="space-y-3">
            {/* Profile Photo */}
            <SectionCard label="Profile photo" done={!!profile.image_url}>
              {profile.image_url ? (
                <div className="flex items-center gap-4">
                  <img src={profile.image_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  <InlineUpload profileId={profile.id} documentType="photo" onComplete={refresh}
                    accept="image/jpeg,image/png,image/webp" label="Change photo" />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">Profiles with photos get significantly more interest from providers.</p>
                  <InlineUpload profileId={profile.id} documentType="photo" onComplete={refresh}
                    accept="image/jpeg,image/png,image/webp" label="Upload photo" />
                </div>
              )}
            </SectionCard>

            {/* Semester Schedule */}
            <SectionCard label="Semester schedule" done={!!meta.course_schedule_description}>
              <div>
                {meta.course_schedule_semester && meta.course_schedule_semester !== currentSemester && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/60 mb-3">
                    <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-amber-700">Your schedule is from {meta.course_schedule_semester}. Please update it for {currentSemester}.</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mb-3">Share your class schedule so we can match you with shifts that fit. Update this each semester.</p>
                <MetadataEditor
                  profileId={profile.id}
                  field="course_schedule_description"
                  value={meta.course_schedule_description || ""}
                  onSave={refresh}
                  placeholder={`E.g. "MWF 8am-12pm, TTh 10am-2pm, free afternoons and weekends"`}
                  multiline
                  extraFields={{ course_schedule_semester: currentSemester }}
                />
              </div>
            </SectionCard>

            {/* Resume / LinkedIn */}
            <SectionCard label="Resume or LinkedIn" done={!!(meta.resume_url || meta.linkedin_url)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">LinkedIn URL</label>
                  <MetadataEditor
                    profileId={profile.id}
                    field="linkedin_url"
                    value={meta.linkedin_url || ""}
                    onSave={refresh}
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>
                {meta.resume_url && (
                  <p className="text-sm text-emerald-600">Resume uploaded</p>
                )}
              </div>
            </SectionCard>

            {/* Why Caregiving */}
            <SectionCard label="Why I want to be a caregiver" done={!!meta.why_caregiving}>
              <div>
                <p className="text-sm text-gray-500 mb-3">Tell providers what motivates you. This is one of the first things they read.</p>
                <MetadataEditor
                  profileId={profile.id}
                  field="why_caregiving"
                  value={meta.why_caregiving || ""}
                  onSave={refresh}
                  placeholder="What draws you to caregiving? How does it connect to your career goals?"
                  multiline
                />
              </div>
            </SectionCard>

            {/* Basic Info (read-only summary + edit link) */}
            <SectionCard label="Basic info" done={true}>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Name</dt>
                  <dd className="text-gray-900">{profile.display_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Email</dt>
                  <dd className="text-gray-900">{profile.email}</dd>
                </div>
                {profile.phone && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-900">{profile.phone}</dd>
                  </div>
                )}
                {profile.city && profile.state && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="text-gray-900">{profile.city}, {profile.state}</dd>
                  </div>
                )}
                {meta.university && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">University</dt>
                    <dd className="text-gray-900">{meta.university}</dd>
                  </div>
                )}
                {meta.major && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Major</dt>
                    <dd className="text-gray-900">{meta.major}</dd>
                  </div>
                )}
                {meta.intended_professional_school && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Career path</dt>
                    <dd className="text-gray-900">{INTENDED_SCHOOL_LABELS[meta.intended_professional_school]}</dd>
                  </div>
                )}
              </dl>
            </SectionCard>

            {/* Background */}
            <SectionCard label="Background" done={true}>
              <dl className="space-y-2 text-sm">
                {meta.years_caregiving && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Experience</dt>
                    <dd className="text-gray-900">{meta.years_caregiving}</dd>
                  </div>
                )}
                {(meta.certifications?.length ?? 0) > 0 && (
                  <div>
                    <dt className="text-gray-500 mb-1">Certifications</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {meta.certifications!.map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{c}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {(meta.care_experience_types?.length ?? 0) > 0 && (
                  <div>
                    <dt className="text-gray-500 mb-1">Care types</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {meta.care_experience_types!.map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{c}</span>
                      ))}
                    </dd>
                  </div>
                )}
                {(meta.languages?.length ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Languages</dt>
                    <dd className="text-gray-900">{meta.languages!.join(", ")}</dd>
                  </div>
                )}
              </dl>
            </SectionCard>

            {/* Availability */}
            <SectionCard label="Availability" done={!!(meta.hours_per_week_range || meta.duration_commitment)}>
              <dl className="space-y-2 text-sm">
                {meta.hours_per_week_range && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Hours/week</dt>
                    <dd className="text-gray-900">{meta.hours_per_week_range} hrs</dd>
                  </div>
                )}
                {meta.duration_commitment && (
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Commitment</dt>
                    <dd className="text-gray-900">{meta.duration_commitment.replace(/_/g, " ")}</dd>
                  </div>
                )}
              </dl>
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}
