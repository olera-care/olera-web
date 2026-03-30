"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import type { StudentMetadata } from "@/lib/types";
import { getTrackLabel, INTENDED_SCHOOL_LABELS } from "@/lib/medjobs-helpers";
import { ScheduleBuilder, parseSchedule, serializeSchedule } from "@/components/medjobs/ScheduleBuilder";

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

function getVerificationItems(meta: StudentMetadata) {
  return [
    { key: "video", label: "Intro video", desc: "2\u20133 min — providers want to see who they\u2019re hiring", done: !!meta.video_intro_url },
    { key: "drivers_license", label: "Driver\u2019s license", desc: "Verifies your identity", done: !!meta.drivers_license_url },
    { key: "car_insurance", label: "Car insurance", desc: "Confirms you can get to assignments safely", done: !!meta.car_insurance_url },
  ];
}

const SCENARIO_QUESTIONS = [
  {
    key: "scenario_reliability",
    question: "You have an exam tomorrow but your client's family is counting on you for a shift tonight. What do you do?",
  },
  {
    key: "scenario_judgement",
    question: "You arrive at a client's home and notice they seem confused and have a bruise they can't explain. What steps do you take?",
  },
  {
    key: "scenario_commitment",
    question: "Why do you want to commit to caregiving for multiple semesters, and how will this experience help your career in healthcare?",
  },
];

function getProfileSections(meta: StudentMetadata, profile: StudentProfile) {
  const scenarios = meta.scenario_responses || [];
  return [
    { key: "schedule", label: "Semester schedule", done: !!meta.course_schedule_grid },
    { key: "resume", label: "Resume", done: !!meta.resume_url },
    { key: "linkedin", label: "LinkedIn", done: !!meta.linkedin_url },
    { key: "why", label: "Why I want to be a caregiver", done: !!(meta.why_caregiving && meta.why_caregiving.length >= 100) },
    { key: "scenarios", label: "Screening questions", done: scenarios.length >= SCENARIO_QUESTIONS.length && scenarios.every((s) => s.answer?.length >= 50) },
    { key: "basic", label: "Basic info", done: true },
    { key: "background", label: "Background", done: true },
    { key: "availability", label: "Availability & commitment", done: !!(meta.hours_per_week_range && meta.commitment_statement) },
  ];
}

/* ─── Inline Upload ────────────────────────────────────────── */

function InlineUpload({ profileId, documentType, onComplete, accept, label }: {
  profileId: string;
  documentType: "drivers_license" | "car_insurance" | "photo" | "resume";
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
        formData.append("documentType", documentType); // drivers_license, car_insurance, or resume
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
        accept={accept || "image/*,application/pdf"}
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

/* ─── Schedule Section ─────────────────────────────────────── */

function ScheduleSection({ profileId, meta, currentSemester, onSave }: {
  profileId: string; meta: StudentMetadata; currentSemester: string; onSave: () => void;
}) {
  const [grid, setGrid] = useState(() => parseSchedule(meta.course_schedule_grid));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m.course_schedule_grid = serializeSchedule(grid);
      m.course_schedule_semester = currentSemester;
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const stale = meta.course_schedule_semester && meta.course_schedule_semester !== currentSemester;

  return (
    <SectionCard label="Semester schedule" done={!!meta.course_schedule_grid} defaultOpen={!meta.course_schedule_grid}>
      <div>
        {stale && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50/60 mb-3">
            <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-700">Your schedule is from {meta.course_schedule_semester}. Please update it for {currentSemester}.</p>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-3">Tap to mark when you have class. Everything else = available for shifts. Update each semester.</p>
        <ScheduleBuilder value={grid} onChange={setGrid} />
        <div className="mt-4">
          <button type="button" disabled={saving} onClick={handleSave}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
            {saving ? "Saving..." : "Save schedule"}
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── Why Caregiving Section ──────────────────────────────── */

function WhyCaregivingSection({ profileId, value, onSave }: {
  profileId: string; value: string; onSave: () => void;
}) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const charCount = text.length;
  const isValid = charCount >= 100 && charCount <= 500;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m.why_caregiving = text.trim();
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">
        This is one of the first things providers read. Be genuine — think of it like a personal statement.
      </p>
      <div className="text-xs text-gray-400 mb-2 space-y-1">
        <p><strong>Strong answers include:</strong></p>
        <ul className="ml-3 list-disc space-y-0.5">
          <li>What personally draws you to caregiving</li>
          <li>How this connects to your career path (med school, nursing, PA, etc.)</li>
          <li>A specific experience that motivated you (family care, volunteer work, etc.)</li>
        </ul>
        <p className="mt-2 text-gray-300 italic">AI tools are fine for brainstorming, but write the final version in your own voice. Providers can tell when answers feel generic — your real story is what makes you stand out.</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="I want to be a caregiver because..."
        rows={5}
        maxLength={500}
        className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
      />
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs ${charCount < 100 ? "text-amber-500" : charCount > 500 ? "text-red-500" : "text-gray-400"}`}>
          {charCount}/500 {charCount < 100 && `(${100 - charCount} more needed)`}
        </span>
        <button type="button" disabled={saving || !isValid} onClick={handleSave}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ─── Scenario Questions Section ──────────────────────────── */

function ScenarioSection({ profileId, responses, onSave }: {
  profileId: string; responses: Array<{ question: string; answer: string }>; onSave: () => void;
}) {
  const [answers, setAnswers] = useState<string[]>(() =>
    SCENARIO_QUESTIONS.map((q) => {
      const existing = responses.find((r) => r.question === q.question);
      return existing?.answer || "";
    })
  );
  const [saving, setSaving] = useState(false);
  const allValid = answers.every((a) => a.length >= 50);

  const handleSave = async () => {
    setSaving(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m.scenario_responses = SCENARIO_QUESTIONS.map((q, i) => ({
        question: q.question,
        answer: answers[i].trim(),
      }));
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-2">
        Providers use these answers to assess reliability, judgement, and commitment. Thoughtful, honest responses make you stand out.
      </p>
      <p className="text-xs text-gray-300 italic mb-4">
        You can use AI to organize your thoughts, but make sure the final answers reflect how you would actually respond. Providers may ask follow-up questions in interviews.
      </p>
      <div className="space-y-5">
        {SCENARIO_QUESTIONS.map((q, i) => (
          <div key={q.key}>
            <p className="text-sm font-medium text-gray-900 mb-2">{q.question}</p>
            <textarea
              value={answers[i]}
              onChange={(e) => { const next = [...answers]; next[i] = e.target.value; setAnswers(next); }}
              placeholder="Your answer (minimum 50 characters)..."
              rows={3}
              className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
            />
            <span className={`text-xs ${answers[i].length < 50 ? "text-amber-500" : "text-gray-400"}`}>
              {answers[i].length}/50 min
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button type="button" disabled={saving || !allValid} onClick={handleSave}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
          {saving ? "Saving..." : "Save all answers"}
        </button>
        {!allValid && <p className="text-xs text-amber-500 mt-2">All questions require at least 50 characters.</p>}
      </div>
    </div>
  );
}

/* ─── Commitment Statement Section ────────────────────────── */

const COMMITMENT_SUGGESTIONS = [
  "I am committed to working caregiving shifts around my class schedule for at least 6 months. Outside of class and exam periods, I am available for shifts including evenings, weekends, and overnights.",
  "I plan to work as a caregiver for multiple semesters. I will keep my schedule updated and give at least 2 weeks notice before any changes. I understand reliability is critical for the families I serve.",
  "Caregiving is part of my professional development plan. I am committed to 6-12 months of consistent availability, working all hours outside of my coursework, and communicating proactively about schedule changes.",
];

function CommitmentStatementSection({ profileId, value, onSave }: {
  profileId: string; value: string; onSave: () => void;
}) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const isValid = text.trim().length >= 50;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m.commitment_statement = text.trim();
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
        Commitment statement <span className="text-red-400">*</span>
      </label>
      <p className="text-xs text-gray-400 mb-2">
        Describe your commitment to taking caregiving shifts around your coursework for 6+ months. This is required and visible to providers.
      </p>
      {!text && (
        <div className="mb-3 space-y-2">
          <p className="text-xs text-gray-400">Use a suggestion as a starting point:</p>
          {COMMITMENT_SUGGESTIONS.map((s, i) => (
            <button key={i} type="button" onClick={() => setText(s)}
              className="w-full text-left px-3 py-2 border border-gray-200 hover:border-gray-400 rounded-lg text-xs text-gray-600 transition-colors leading-relaxed">
              {s.slice(0, 80)}...
            </button>
          ))}
        </div>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe your commitment to taking shifts, your availability outside of class, and how long you plan to work..."
        rows={4}
        className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
      />
      <div className="flex items-center justify-between mt-1">
        <span className={`text-xs ${text.trim().length < 50 ? "text-amber-500" : "text-gray-400"}`}>
          {text.trim().length} chars {text.trim().length < 50 && `(${50 - text.trim().length} more needed)`}
        </span>
        <button type="button" disabled={saving || !isValid} onClick={handleSave}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────── */

export default function StudentPortalPage() {
  const { user, account, profiles, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const retryRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    const studentProfile = profiles?.find((p) => p.type === "student");
    if (studentProfile) { fetchFullProfile(studentProfile.id); return; }
    if (account?.id) { fetchByAccount(account.id); return; }
    // Fallback: if auth loaded but no account/profiles yet, try by email
    if (user?.email) { fetchByEmail(user.email); return; }
    // If nothing found and we haven't retried yet, wait and retry
    // (handles race condition where auth session established but profiles not yet loaded)
    if (!retryRef.current && user) {
      retryRef.current = true;
      setTimeout(() => setRefreshKey((k) => k + 1), 1500);
      return;
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, account?.id, profiles, refreshKey, user?.email]);

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

  const fetchByEmail = useCallback(async (email: string) => {
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data } = await sb.from("business_profiles").select("id, slug, display_name, email, phone, is_active, image_url, city, state, metadata").eq("email", email).eq("type", "student").limit(1).maybeSingle();
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
    <main className="min-h-screen bg-gradient-to-b from-vanilla-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Grid: Main + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* ── Main Column (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card — with photo upload */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 relative group">
                  {profile.image_url ? (
                    <img src={profile.image_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-600">
                        {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1">
                    <InlineUpload profileId={profile.id} documentType="photo" onComplete={refresh}
                      accept="image/*" label={profile.image_url ? "\u270E" : "+"} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl font-semibold text-gray-900 truncate">{profile.display_name}</h1>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      profile.is_active ? "bg-emerald-50 text-emerald-700" : verificationDone ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        profile.is_active ? "bg-emerald-500" : verificationDone ? "bg-amber-500" : "bg-gray-300"
                      }`} />
                      {profile.is_active ? "Live" : verificationDone ? "Under review" : "Not verified"}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
                    {meta.university && <span>{meta.university}</span>}
                    {trackLabel && <><span className="text-gray-300">&middot;</span><span>{trackLabel}</span></>}
                    {profile.city && profile.state && <><span className="text-gray-300">&middot;</span><span>{profile.city}, {profile.state}</span></>}
                  </div>
                  {profile.is_active && (
                    <Link href={`/medjobs/candidates/${profile.slug}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View public profile
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* ── 100% Complete — Celebration + Next Steps ── */}
            {completeness === 100 && profile.is_active && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200/80 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-emerald-900">You&apos;re live, {firstName}!</h2>
                    <p className="text-sm text-emerald-700 mt-1 mb-4">
                      Your profile is complete and visible to providers. Start applying to open positions — students who reach out directly get interviewed faster.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link href="/portal/medjobs/jobs"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 rounded-lg text-sm font-medium text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
                        </svg>
                        Browse open jobs
                      </Link>
                      <Link href={`/medjobs/candidates/${profile.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-sm font-medium text-emerald-800 transition-colors">
                        View your public profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Verification Card — always visible */}
              <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Verification</h2>
                <p className="text-sm text-gray-500 mb-5">
                  {verificationDone ? "All verification documents submitted." : "We verify every student to protect the families you\u2019ll care for. Complete these to go live."}
                </p>
                <div className="space-y-3">
                  {verificationItems.map((item) => (
                    <SectionCard key={item.key} label={item.label} done={item.done} defaultOpen={!item.done && nextVerification?.key === item.key}>
                      {item.key === "video" ? (
                        <div>
                          {item.done && <p className="text-sm text-emerald-600 mb-3">Video submitted</p>}
                          <p className="text-sm text-gray-500 mb-3">{item.done ? "Update your intro video:" : item.desc}</p>
                          <VideoSubmit slug={profile.slug} onComplete={refresh} />
                        </div>
                      ) : (
                        <div>
                          {item.done && <p className="text-sm text-emerald-600 mb-3">Document uploaded</p>}
                          <p className="text-sm text-gray-500 mb-3">{item.done ? "Upload a new version:" : item.desc}</p>
                          <div className="mb-3">
                            <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Expiration date</label>
                            <MetadataEditor
                              profileId={profile.id}
                              field={item.key === "drivers_license" ? "drivers_license_expiration" : "car_insurance_expiration"}
                              value={(item.key === "drivers_license" ? meta.drivers_license_expiration : meta.car_insurance_expiration) || ""}
                              onSave={refresh}
                              placeholder="MM/DD/YYYY"
                            />
                          </div>
                          <InlineUpload profileId={profile.id} documentType={item.key as "drivers_license" | "car_insurance"} onComplete={refresh} />
                        </div>
                      )}
                    </SectionCard>
                  ))}
                </div>
              </div>

            {/* Profile Sections Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Your profile</h2>
              <p className="text-sm text-gray-500 mb-5">
                This is what providers see. Every section is required before your profile goes live.
              </p>

              <div className="space-y-3">
                {/* Semester Schedule — visual builder */}
                <ScheduleSection profileId={profile.id} meta={meta} currentSemester={currentSemester} onSave={refresh} />

                {/* Resume */}
                <SectionCard label="Resume" done={!!meta.resume_url}>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Upload a PDF of your resume. A strong caregiver resume includes:</p>
                    <ul className="text-sm text-gray-500 mb-3 space-y-1 ml-4 list-disc">
                      <li>Any caregiving, volunteer, or clinical experience</li>
                      <li>Relevant coursework and certifications (CNA, BLS, CPR)</li>
                      <li>Soft skills: communication, empathy, reliability</li>
                      <li>References from professors, coaches, or supervisors</li>
                    </ul>
                    {meta.resume_url ? (
                      <p className="text-sm text-emerald-600 mb-2">Resume uploaded</p>
                    ) : null}
                    <InlineUpload profileId={profile.id} documentType="resume" onComplete={refresh}
                      accept="application/pdf" label={meta.resume_url ? "Replace resume" : "Upload resume (PDF)"} />
                  </div>
                </SectionCard>

                {/* LinkedIn */}
                <SectionCard label="LinkedIn" done={!!meta.linkedin_url}>
                  <div>
                    <p className="text-sm text-gray-500 mb-3">Add your LinkedIn profile so providers can learn more about your background.</p>
                    <MetadataEditor
                      profileId={profile.id}
                      field="linkedin_url"
                      value={meta.linkedin_url || ""}
                      onSave={refresh}
                      placeholder="https://linkedin.com/in/yourname"
                    />
                  </div>
                </SectionCard>

                {/* Why Caregiving — dating-app style */}
                <SectionCard label="Why I want to be a caregiver" done={!!(meta.why_caregiving && meta.why_caregiving.length >= 100)}>
                  <WhyCaregivingSection profileId={profile.id} value={meta.why_caregiving || ""} onSave={refresh} />
                </SectionCard>

                {/* Scenario Questions */}
                <SectionCard label="Screening questions" done={
                  (meta.scenario_responses || []).length >= SCENARIO_QUESTIONS.length &&
                  (meta.scenario_responses || []).every((s) => s.answer?.length >= 50)
                }>
                  <ScenarioSection profileId={profile.id} responses={meta.scenario_responses || []} onSave={refresh} />
                </SectionCard>

                {/* Basic Info */}
                <SectionCard label="Basic info" done={true}>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="text-gray-900">{profile.display_name}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="text-gray-900">{profile.email}</dd></div>
                    {profile.phone && <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="text-gray-900">{profile.phone}</dd></div>}
                    {profile.city && profile.state && <div className="flex justify-between"><dt className="text-gray-500">Location</dt><dd className="text-gray-900">{profile.city}, {profile.state}</dd></div>}
                    {meta.university && <div className="flex justify-between"><dt className="text-gray-500">University</dt><dd className="text-gray-900">{meta.university}</dd></div>}
                    {meta.major && <div className="flex justify-between"><dt className="text-gray-500">Major</dt><dd className="text-gray-900">{meta.major}</dd></div>}
                    {meta.intended_professional_school && <div className="flex justify-between"><dt className="text-gray-500">Career path</dt><dd className="text-gray-900">{INTENDED_SCHOOL_LABELS[meta.intended_professional_school]}</dd></div>}
                  </dl>
                </SectionCard>

                {/* Background */}
                <SectionCard label="Background" done={true}>
                  <dl className="space-y-2 text-sm">
                    {meta.years_caregiving != null && <div className="flex justify-between"><dt className="text-gray-500">Experience</dt><dd className="text-gray-900">{meta.years_caregiving}</dd></div>}
                    {(meta.certifications?.length ?? 0) > 0 && (
                      <div>
                        <dt className="text-gray-500 mb-1">Certifications</dt>
                        <dd className="flex flex-wrap gap-1.5">{meta.certifications!.map((c) => <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{c}</span>)}</dd>
                      </div>
                    )}
                    {(meta.care_experience_types?.length ?? 0) > 0 && (
                      <div>
                        <dt className="text-gray-500 mb-1">Care types</dt>
                        <dd className="flex flex-wrap gap-1.5">{meta.care_experience_types!.map((c) => <span key={c} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">{c}</span>)}</dd>
                      </div>
                    )}
                    {(meta.languages?.length ?? 0) > 0 && <div className="flex justify-between"><dt className="text-gray-500">Languages</dt><dd className="text-gray-900">{meta.languages!.join(", ")}</dd></div>}
                  </dl>
                </SectionCard>

                {/* Availability & Commitment */}
                <SectionCard label="Availability & commitment" done={!!(meta.hours_per_week_range && meta.commitment_statement)}>
                  <div className="space-y-5">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60">
                      <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-blue-700 leading-relaxed">
                        This is the #1 thing providers look at. They need to know you&apos;re committed to taking shifts around coursework for 6+ months. Be specific and honest — we&apos;ll message you regularly to keep this updated.
                      </p>
                    </div>

                    <dl className="space-y-2 text-sm">
                      {meta.hours_per_week_range && <div className="flex justify-between"><dt className="text-gray-500">Hours/week</dt><dd className="text-gray-900">{meta.hours_per_week_range} hrs</dd></div>}
                      {meta.duration_commitment && <div className="flex justify-between"><dt className="text-gray-500">Length of commitment</dt><dd className="text-gray-900">{meta.duration_commitment.replace(/_/g, " ")}</dd></div>}
                    </dl>

                    {/* Commitment statement — required */}
                    <CommitmentStatementSection profileId={profile.id} value={meta.commitment_statement || ""} onSave={refresh} />

                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Summer availability</label>
                      <MetadataEditor profileId={profile.id} field="summer_availability" value={meta.summer_availability || ""} onSave={refresh}
                        placeholder="E.g. Full-time available, traveling June 1-15" />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Winter availability</label>
                      <MetadataEditor profileId={profile.id} field="winter_availability" value={meta.winter_availability || ""} onSave={refresh}
                        placeholder="E.g. Available full-time Dec 15 - Jan 10" />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Schedule update date</label>
                      <p className="text-xs text-gray-400 mb-2">When does your current schedule end? We&apos;ll remind you to update it.</p>
                      <MetadataEditor profileId={profile.id} field="schedule_update_date" value={meta.schedule_update_date || ""} onSave={refresh}
                        placeholder="E.g. May 15, 2026" />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Availability notes</label>
                      <p className="text-xs text-gray-400 mb-2">Finals weeks, spring break, known travel — anything providers should know. The more accurate and wide your availability, the more likely you get hired.</p>
                      <MetadataEditor profileId={profile.id} field="availability_notes" value={meta.availability_notes || ""} onSave={refresh}
                        placeholder="E.g. Finals week May 5-12 (limited hours). Spring break Mar 10-17 (fully available). No travel planned." multiline />
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>

          {/* ── Sidebar (1/3) ── */}
          <div className="lg:col-span-1 space-y-6">
            {/* Completeness */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Profile completeness</h3>
              <div className="flex justify-center mb-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={completeness >= 80 ? "#10b981" : completeness >= 50 ? "#f59e0b" : "#d1d5db"}
                      strokeWidth="8" strokeDasharray={`${completeness * 2.64} 264`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{completeness}%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {verificationItems.map((v) => (
                  <div key={v.key} className="flex items-center gap-2">
                    {v.done ? (
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                    )}
                    <span className={`text-sm ${v.done ? "text-gray-400" : "text-gray-700"}`}>{v.label}</span>
                  </div>
                ))}
                {profileSections.map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    {s.done ? (
                      <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                    )}
                    <span className={`text-sm ${s.done ? "text-gray-400" : "text-gray-700"}`}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick links</h3>
              <div className="space-y-1">
                <Link href="/portal/medjobs/jobs" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
                  </svg>
                  Browse open jobs
                </Link>
                <Link href="/portal/medjobs/interviews" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Interviews
                </Link>
                <Link href="/medjobs" className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  About MedJobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
