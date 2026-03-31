"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createBrowserClient } from "@supabase/ssr";
import type { StudentMetadata } from "@/lib/types";
import { getTrackLabel, INTENDED_SCHOOL_LABELS, SEASONAL_STATUS_OPTIONS, SEASON_LABELS, getCurrentSeasonKey, getSeasonalStatusLabel } from "@/lib/medjobs-helpers";
import { ScheduleBuilder, parseSchedule, serializeSchedule } from "@/components/medjobs/ScheduleBuilder";
import {
  SCENARIO_QUESTIONS,
  getVerificationItems,
  getProfileItems,
  calculateCompleteness,
} from "@/lib/medjobs-completeness";

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
  const month = now.getMonth();
  const year = now.getFullYear();
  if (month >= 0 && month <= 4) return `Spring ${year}`;
  if (month >= 5 && month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

/* ─── Save Button with Confirmation ────────────────────────── */

function SaveButton({ saving, onClick, disabled, label = "Save" }: {
  saving: boolean; onClick: () => void; disabled?: boolean; label?: string;
}) {
  const [saved, setSaved] = useState(false);
  const prevSaving = useRef(saving);

  useEffect(() => {
    // Detect transition from saving → not saving = save completed
    if (prevSaving.current && !saving) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(timer);
    }
    prevSaving.current = saving;
  }, [saving]);

  return (
    <button type="button" disabled={saving || disabled} onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        saved
          ? "bg-emerald-600 text-white"
          : "bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white"
      }`}>
      {saving ? (
        "Saving..."
      ) : saved ? (
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </span>
      ) : (
        label
      )}
    </button>
  );
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
      <SaveButton saving={submitting} onClick={handleSubmit} disabled={!url.trim()} label="Submit video" />
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
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSave = useCallback(async (val: string) => {
    setStatus("saving");
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const meta = (current?.metadata || {}) as Record<string, unknown>;
      meta[field] = val.trim() || null;
      if (extraFields) { Object.assign(meta, extraFields); }
      await sb.from("business_profiles").update({ metadata: meta }).eq("id", profileId);
      setStatus("saved");
      onSave();
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }, [profileId, field, extraFields, onSave]);

  const handleChange = (val: string) => {
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSave(val), 1500);
  };

  // Save on blur immediately
  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text !== value) doSave(text);
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={4}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors"
        />
      )}
      {status !== "idle" && (
        <span className={`absolute right-3 top-2.5 text-xs font-medium transition-opacity ${
          status === "saving" ? "text-gray-400" : "text-emerald-500"
        }`}>
          {status === "saving" ? "Saving..." : "Saved"}
        </span>
      )}
    </div>
  );
}

/* ─── Date Field Editor ────────────────────────────────────── */

function DateFieldEditor({ profileId, field, value, onSave, label, hint }: {
  profileId: string; field: string; value: string; onSave: () => void; label: string; hint?: string;
}) {
  const [date, setDate] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async (newDate: string) => {
    setDate(newDate);
    setSaving(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const meta = (current?.metadata || {}) as Record<string, unknown>;
      meta[field] = newDate || null;
      await sb.from("business_profiles").update({ metadata: meta }).eq("id", profileId);
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <input
        type="date"
        value={date}
        onChange={(e) => handleSave(e.target.value)}
        disabled={saving}
        className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 transition-colors disabled:opacity-50"
      />
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
          <SaveButton saving={saving} onClick={handleSave} label="Save schedule" />
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
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const charCount = text.length;
  const isValid = charCount >= 100 && charCount <= 500;

  const doSave = useCallback(async (val: string) => {
    if (val.length < 100 || val.length > 500) return;
    setStatus("saving");
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m.why_caregiving = val.trim();
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      setStatus("saved");
      onSave();
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }, [profileId, onSave]);

  const handleChange = (val: string) => {
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 100 && val.length <= 500) {
      debounceRef.current = setTimeout(() => doSave(val), 1500);
    }
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
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="I want to be a caregiver because..."
          rows={5}
          maxLength={500}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
        />
        {status !== "idle" && (
          <span className={`absolute right-3 top-2.5 text-xs font-medium ${status === "saving" ? "text-gray-400" : "text-emerald-500"}`}>
            {status === "saving" ? "Saving..." : "Saved"}
          </span>
        )}
      </div>
      <span className={`text-xs mt-1 block ${charCount < 100 ? "text-amber-500" : "text-gray-400"}`}>
        {charCount}/500 {charCount < 100 && `(${100 - charCount} more needed)`} {isValid && status === "idle" && "· Auto-saves as you type"}
      </span>
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
        <SaveButton saving={saving} onClick={handleSave} disabled={!allValid} label="Save all answers" />
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
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isValid = text.trim().length >= 50;

  const doSave = useCallback(async (val: string) => {
    if (val.trim().length < 50) return;
    setStatus("saving");
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m.commitment_statement = val.trim();
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      setStatus("saved");
      onSave();
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }, [profileId, onSave]);

  const handleChange = (val: string) => {
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 50) debounceRef.current = setTimeout(() => doSave(val), 1500);
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
        Commitment statement <span className="text-red-400">*</span>
      </label>
      <p className="text-xs text-gray-400 mb-2">
        Describe your commitment to taking caregiving shifts around your coursework for 6+ months. Visible to providers.
      </p>
      {!text && (
        <div className="mb-3 space-y-2">
          <p className="text-xs text-gray-400">Use a suggestion as a starting point:</p>
          {COMMITMENT_SUGGESTIONS.map((s, i) => (
            <button key={i} type="button" onClick={() => { setText(s); setTimeout(() => doSave(s), 100); }}
              className="w-full text-left px-3 py-2 border border-gray-200 hover:border-gray-400 rounded-lg text-xs text-gray-600 transition-colors leading-relaxed">
              {s.slice(0, 80)}...
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Describe your commitment to taking shifts, your availability outside of class, and how long you plan to work..."
          rows={4}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
        />
        {status !== "idle" && (
          <span className={`absolute right-3 top-2.5 text-xs font-medium ${status === "saving" ? "text-gray-400" : "text-emerald-500"}`}>
            {status === "saving" ? "Saving..." : "Saved"}
          </span>
        )}
      </div>
      <span className={`text-xs mt-1 block ${text.trim().length < 50 ? "text-amber-500" : "text-gray-400"}`}>
        {text.trim().length} chars {text.trim().length < 50 && `(${50 - text.trim().length} more needed)`} {isValid && status === "idle" && "· Auto-saves as you type"}
      </span>
    </div>
  );
}

/* ─── Seasonal Availability Editor ─────────────────────────── */

const SEASONS = ["spring", "summer", "fall", "winter"] as const;

function SeasonalAvailabilityEditor({ profileId, meta, onSave }: {
  profileId: string; meta: StudentMetadata; onSave: () => void;
}) {
  const currentSeason = getCurrentSeasonKey();
  const currentYear = new Date().getFullYear();
  const yra = meta.year_round_availability || {};

  const saveSeason = async (season: string, status: string, notes?: string) => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
    const m = (current?.metadata || {}) as Record<string, unknown>;
    const existing = (m.year_round_availability || {}) as Record<string, unknown>;
    existing[season] = { status, year: currentYear, notes: notes || undefined };
    m.year_round_availability = existing;
    await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
    onSave();
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Year-round availability</label>
      <div className="space-y-2">
        {SEASONS.map((season) => {
          const data = yra[season];
          const isCurrent = season === currentSeason;
          return (
            <div key={season} className={`rounded-lg border p-3 ${isCurrent ? "border-primary-200 bg-primary-50/30" : "border-gray-100"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">
                  {SEASON_LABELS[season]} {isCurrent ? currentYear : season === "winter" ? `${currentYear}–${currentYear + 1}` : currentYear}
                  {isCurrent && <span className="ml-2 text-xs text-primary-600 font-normal">(current)</span>}
                </span>
                {isCurrent && meta.course_schedule_grid && (
                  <span className="text-xs text-primary-600">See class schedule above</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SEASONAL_STATUS_OPTIONS
                  .filter((o) => !(isCurrent && meta.course_schedule_grid && o.value !== "classes_see_schedule"))
                  .map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => saveSeason(season, opt.value)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                        data?.status === opt.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
              </div>
              {data?.notes && (
                <p className="text-xs text-gray-500 mt-2">{data.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Availability & Commitment Section ───────────────────── */


function AvailabilityCommitmentSection({ profileId, meta, onSave }: {
  profileId: string; meta: StudentMetadata; onSave: () => void;
}) {
  const [prnWilling, setPrnWilling] = useState(!!meta.prn_willing);
  const [scheduleAttestation, setScheduleAttestation] = useState(!!meta.advance_notice_pledge);
  const [saving, setSaving] = useState(false);

  const saveToggle = async (field: string, value: boolean) => {
    setSaving(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m[field] = value;
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  return (
    <SectionCard label="Availability & commitment" done={!!(meta.hours_per_week_range && meta.commitment_statement)}>
      <div className="space-y-5">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60">
          <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            This is the #1 thing providers look at. They need to know you&apos;re committed to taking shifts around coursework for 6+ months.
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          {meta.hours_per_week_range && <div className="flex justify-between"><dt className="text-gray-500">Hours/week</dt><dd className="text-gray-900">{meta.hours_per_week_range} hrs</dd></div>}
          {meta.duration_commitment && <div className="flex justify-between"><dt className="text-gray-500">Length of commitment</dt><dd className="text-gray-900">{meta.duration_commitment.replace(/_/g, " ").replace(/less_than/, "< ").replace(/to/g, "–")}</dd></div>}
        </dl>

        <CommitmentStatementSection profileId={profileId} value={meta.commitment_statement || ""} onSave={onSave} />

        {/* Flexibility & accountability pledges */}
        <div>
          <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Additional commitments</label>
          <p className="text-xs text-gray-400 mb-3">These show providers you understand the responsibility. Check all that apply.</p>
          <div className="space-y-2">
            <button type="button" disabled={saving}
              onClick={() => { const next = !prnWilling; setPrnWilling(next); saveToggle("prn_willing", next); }}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                prnWilling ? "border-2 border-gray-900 bg-gray-50" : "border border-gray-200 hover:border-gray-300"
              }`}>
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 mt-0.5 transition-colors ${
                prnWilling ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300"
              }`}>
                {prnWilling && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </span>
              <span className="text-sm text-gray-700">I am okay to be on-call / PRN until a client needs shifts that fit my schedule</span>
            </button>

            <button type="button" disabled={saving}
              onClick={() => { const next = !scheduleAttestation; setScheduleAttestation(next); saveToggle("advance_notice_pledge", next); }}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                scheduleAttestation ? "border-2 border-gray-900 bg-gray-50" : "border border-gray-200 hover:border-gray-300"
              }`}>
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 mt-0.5 transition-colors ${
                scheduleAttestation ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300"
              }`}>
                {scheduleAttestation && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </span>
              <span className="text-sm text-gray-700">I commit to keeping my availability and course schedule updated regularly and will work with office staff if anything changes</span>
            </button>
          </div>
        </div>

        {/* Year-round availability */}
        <SeasonalAvailabilityEditor profileId={profileId} meta={meta} onSave={onSave} />

        <DateFieldEditor profileId={profileId} field="schedule_update_date" value={meta.schedule_update_date || ""} onSave={onSave}
          label="Schedule update date" hint="When does your current schedule end? We'll remind you to update." />

        <AvailabilityNotesSection profileId={profileId} value={meta.availability_notes || ""} onSave={onSave} />
      </div>
    </SectionCard>
  );
}

/* ─── Suggested Text Editor (reusable) ─────────────────────── */

function SuggestedTextEditor({ label, profileId, field, value, suggestions, placeholder, onSave }: {
  label: string; profileId: string; field: string; value: string;
  suggestions: string[]; placeholder?: string; onSave: () => void;
}) {
  const [text, setText] = useState(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const doSave = useCallback(async (val: string) => {
    setStatus("saving");
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m[field] = val.trim() || null;
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      setStatus("saved");
      onSave();
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }, [profileId, field, onSave]);

  const handleChange = (val: string) => {
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSave(val), 1500);
  };

  const selectSuggestion = (s: string) => {
    setText(s);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setTimeout(() => doSave(s), 100);
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">{label}</label>
      {!text && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => selectSuggestion(s)}
              className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder || "Or type your own..."}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors"
        />
        {status !== "idle" && (
          <span className={`absolute right-3 top-2.5 text-xs font-medium ${status === "saving" ? "text-gray-400" : "text-emerald-500"}`}>
            {status === "saving" ? "Saving..." : "Saved"}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Availability Notes Section ──────────────────────────── */

const AVAILABILITY_SNIPPETS = [
  "I have no planned travel and am available for shifts anytime outside of class.",
  "I can pick up additional shifts during holidays and semester breaks.",
  "I have reliable transportation and can drive to clients within 30 minutes.",
  "I am flexible with short-notice shift changes and happy to cover for others.",
  "I will update my profile with specific finals and travel dates as they are confirmed.",
];

function AvailabilityNotesSection({ profileId, value, onSave }: {
  profileId: string; value: string; onSave: () => void;
}) {
  const [text, setText] = useState(value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const appendSnippet = (snippet: string) => {
    const newText = text ? `${text}\n${snippet}` : snippet;
    setText(newText);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSave(newText), 500);
  };

  const doSave = useCallback(async (val: string) => {
    setStatus("saving");
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m.availability_notes = val.trim() || null;
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      setStatus("saved");
      onSave();
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }, [profileId, onSave]);

  const handleChange = (val: string) => {
    setText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSave(val), 1500);
  };

  return (
    <div>
      <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Availability notes</label>
      <p className="text-xs text-gray-400 mb-2">Finals, spring break, known travel — the more detail, the better your chances. Tap to add:</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {AVAILABILITY_SNIPPETS.map((s) => (
          <button key={s} type="button" onClick={() => appendSnippet(s)}
            className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-left">
            + {s.length > 45 ? s.slice(0, 45) + "..." : s}
          </button>
        ))}
      </div>
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Build your availability notes using the suggestions above, or type your own..."
          rows={4}
          className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
        />
        {status !== "idle" && (
          <span className={`absolute right-3 top-2.5 text-xs font-medium ${status === "saving" ? "text-gray-400" : "text-emerald-500"}`}>
            {status === "saving" ? "Saving..." : "Saved"}
          </span>
        )}
      </div>
      <span className="text-xs text-gray-400 mt-1 block">Auto-saves as you type</span>
    </div>
  );
}

/* ─── Background Section ──────────────────────────────────── */

const EXPERIENCE_OPTIONS = [
  { value: "0", label: "No experience yet, eager to learn" },
  { value: "family", label: "Experience caring for family or friends" },
  { value: "1", label: "1\u20132 years (paid or volunteer)" },
  { value: "3", label: "3+ years" },
];
const CERTIFICATION_OPTIONS = ["CNA", "BLS", "CPR / First Aid", "HHA", "Medication Aide", "Phlebotomy"];
const CARE_TYPE_OPTIONS = [
  "Dementia / Alzheimer's", "Post-Surgical Care", "Mobility Assistance",
  "Medication Management", "Personal Care", "Companionship",
  "Meal Preparation", "Hospice / End-of-Life", "Family member care",
];
const LANGUAGE_OPTIONS = ["English", "Spanish", "Mandarin", "Vietnamese", "Hindi", "Tagalog", "Arabic", "Korean", "French", "Other"];

function BackgroundSection({ profileId, meta, onSave }: {
  profileId: string; meta: StudentMetadata; onSave: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const saveField = async (field: string, value: unknown) => {
    setSaving(true);
    try {
      const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      const { data: current } = await sb.from("business_profiles").select("metadata").eq("id", profileId).single();
      const m = (current?.metadata || {}) as Record<string, unknown>;
      m[field] = value;
      await sb.from("business_profiles").update({ metadata: m }).eq("id", profileId);
      onSave();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const toggleArrayItem = (field: string, current: string[], item: string) => {
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    saveField(field, next);
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Experience level</label>
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" onClick={() => saveField("years_caregiving", opt.value === "family" ? 0 : Number(opt.value))} disabled={saving}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                String(meta.years_caregiving) === opt.value || (opt.value === "family" && meta.years_caregiving === 0)
                  ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Certifications</label>
        <div className="flex flex-wrap gap-1.5">
          {CERTIFICATION_OPTIONS.map((c) => (
            <button key={c} type="button" onClick={() => toggleArrayItem("certifications", meta.certifications || [], c)} disabled={saving}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                (meta.certifications || []).includes(c) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Types of care you can provide</label>
        <div className="flex flex-wrap gap-1.5">
          {CARE_TYPE_OPTIONS.map((c) => (
            <button key={c} type="button" onClick={() => toggleArrayItem("care_experience_types", meta.care_experience_types || [], c)} disabled={saving}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                (meta.care_experience_types || []).includes(c) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Languages</label>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGE_OPTIONS.map((l) => (
            <button key={l} type="button" onClick={() => toggleArrayItem("languages", meta.languages || [], l)} disabled={saving}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                (meta.languages || []).includes(l) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {l}
            </button>
          ))}
        </div>
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
  const hasPhoto = !!profile.image_url;
  const verificationItems = getVerificationItems(meta);
  const verificationDone = verificationItems.every((v) => v.done);
  const profileSections = getProfileItems(meta, hasPhoto);
  const completeness = calculateCompleteness(meta, hasPhoto);
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
                          <p className="text-sm text-gray-500 mb-3">{item.done ? "Update your intro video:" : "2\u20133 min \u2014 providers want to see who they\u2019re hiring"}</p>
                          <VideoSubmit slug={profile.slug} onComplete={refresh} />
                        </div>
                      ) : (
                        <div>
                          {item.done && <p className="text-sm text-emerald-600 mb-3">Document uploaded</p>}
                          <p className="text-sm text-gray-500 mb-3">{item.done ? "Upload a new version:" : item.key === "drivers_license" ? "Verifies your identity" : "Confirms you can get to assignments safely"}</p>
                          <div className="mb-3">
                            <DateFieldEditor
                              profileId={profile.id}
                              field={item.key === "drivers_license" ? "drivers_license_expiration" : "car_insurance_expiration"}
                              value={(item.key === "drivers_license" ? meta.drivers_license_expiration : meta.car_insurance_expiration) || ""}
                              onSave={refresh}
                              label="Expiration date"
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

                {/* Availability & Commitment — right after schedule */}
                <AvailabilityCommitmentSection profileId={profile.id} meta={meta} onSave={refresh} />

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

                {/* Experience & Background */}
                <SectionCard label="Experience & background" done={meta.years_caregiving != null && (meta.care_experience_types?.length ?? 0) > 0 && (meta.languages?.length ?? 0) > 0}>
                  <BackgroundSection profileId={profile.id} meta={meta} onSave={refresh} />
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
