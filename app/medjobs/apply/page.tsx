"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import type { IntendedProfessionalSchool } from "@/lib/types";
import { createBrowserClient } from "@supabase/ssr";

/* ─── Constants ────────────────────────────────────────────── */

const INTENDED_SCHOOLS: { value: IntendedProfessionalSchool; label: string }[] = [
  { value: "medicine", label: "Medicine" },
  { value: "nursing", label: "Nursing" },
  { value: "pa", label: "Physician Assistant (PA)" },
  { value: "pt", label: "Physical Therapy (PT)" },
  { value: "public_health", label: "Public Health" },
  { value: "undecided", label: "Undecided" },
];

const MAJORS = [
  "Biology", "Kinesiology", "Nursing", "Public Health", "Chemistry",
  "Psychology", "Health Sciences", "Pre-Med", "Other",
];

const CERTIFICATIONS = [
  "CNA", "BLS", "CPR / First Aid", "HHA", "Medication Aide", "Phlebotomy",
];

const CARE_EXPERIENCE_TYPES = [
  "Dementia / Alzheimer's", "Post-Surgical Care", "Mobility Assistance",
  "Medication Management", "Personal Care", "Companionship",
  "Meal Preparation", "Hospice / End-of-Life", "Family member care",
];

const LANGUAGES = [
  "English", "Spanish", "Mandarin", "Vietnamese", "Hindi",
  "Tagalog", "Arabic", "Korean", "French", "Other",
];

const AVAILABILITY_TYPES = [
  { value: "in_between_classes", label: "Between classes" },
  { value: "evenings", label: "Evenings" },
  { value: "weekends", label: "Weekends" },
  { value: "overnights", label: "Overnights" },
];

const SEASONAL_OPTIONS = [
  { value: "summer", label: "Summer" },
  { value: "winter_break", label: "Winter break" },
  { value: "fall_semester", label: "Fall semester" },
  { value: "spring_semester", label: "Spring semester" },
];

const DURATION_OPTIONS = [
  { value: "1_semester", label: "1 semester" },
  { value: "multiple_semesters", label: "Multiple semesters" },
  { value: "1_plus_year", label: "1+ year" },
];

const HOURS_OPTIONS = [
  { value: "5-10", label: "5-10 hours" },
  { value: "10-15", label: "10-15 hours" },
  { value: "15-20", label: "15-20 hours" },
  { value: "20+", label: "20+ hours" },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

type Step = 0 | 1 | 2 | 3 | 4; // about_you, experience, availability, confirm, success
const TOTAL_STEPS = 4;

const STEP_TITLES = [
  "Let\u2019s get to know you",
  "Your caregiving background",
  "When can you work?",
  "One last thing",
];

const STEP_SUBTITLES = [
  "We\u2019ll use this to set up your profile",
  "No experience? No worries \u2014 we\u2019ll match you",
  "Providers need to know your schedule",
  "Confirm and you\u2019re done",
];

/* ─── Reusable Components ──────────────────────────────────── */

function BottomLine({ value, onChange, placeholder, type = "text", onKeyDown, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  type?: string; onKeyDown?: (e: React.KeyboardEvent) => void; autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full border-0 border-b-2 border-gray-200 focus:border-gray-900 outline-none text-lg text-gray-900 placeholder:text-gray-300 py-2 bg-transparent transition-colors"
    />
  );
}

function SearchDropdown({ options, value, onSelect, placeholder = "Type or select an option" }: {
  options: { value: string; label: string }[];
  value: string; onSelect: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 border-0 border-b-2 border-gray-200 focus:border-gray-900 outline-none py-2 text-left transition-colors">
        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className={`text-lg ${value ? "text-gray-900" : "text-gray-300"}`}>
          {selectedLabel || placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto animate-in">
          <div className="p-2 border-b border-gray-100">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..." autoFocus
              className="w-full px-3 py-2 text-sm outline-none bg-gray-50 rounded" />
          </div>
          {filtered.map((opt) => (
            <button key={opt.value} type="button"
              onClick={() => { onSelect(opt.value); setOpen(false); setSearch(""); }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                value === opt.value ? "border-l-2 border-gray-900 font-medium text-gray-900 bg-gray-50" : "text-gray-700"
              }`}>
              {opt.label}
            </button>
          ))}
          {filtered.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">No results</p>}
        </div>
      )}
    </div>
  );
}

function MultiSelectCards({ options, selected, onToggle, hint = "Choose as many as you like" }: {
  options: { value: string; label: string }[];
  selected: string[]; onToggle: (value: string) => void; hint?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">{hint}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selected.includes(opt.value);
          return (
            <button key={opt.value} type="button" onClick={() => onToggle(opt.value)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all ${
                isSelected ? "border-2 border-gray-900 bg-gray-50" : "border border-gray-200 hover:border-gray-300"
              }`}>
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-semibold shrink-0 ${
                isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
              }`}>
                {letter}
              </span>
              <span className="text-sm text-gray-700">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────── */

export default function MedJobsApplyPage() {
  const [step, setStep] = useState<Step>(0);
  const [animClass, setAnimClass] = useState("tf-visible");
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultSlug, setResultSlug] = useState("");
  const [resultProfileId, setResultProfileId] = useState("");
  const [isExisting, setIsExisting] = useState(false);

  // About You
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [university, setUniversity] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universitySearch, setUniversitySearch] = useState("");
  const [universityOptions, setUniversityOptions] = useState<{ id: string; name: string }[]>([]);
  const [universityOther, setUniversityOther] = useState(false);
  const [major, setMajor] = useState("");
  const [majorOther, setMajorOther] = useState("");
  const [intendedSchool, setIntendedSchool] = useState<IntendedProfessionalSchool | "">("");

  // Experience
  const [certifications, setCertifications] = useState<string[]>([]);
  const [yearsCaregiving, setYearsCaregiving] = useState("");
  const [careExperienceTypes, setCareExperienceTypes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);

  // Availability
  const [availabilityTypes, setAvailabilityTypes] = useState<string[]>([]);
  const [seasonalAvailability, setSeasonalAvailability] = useState<string[]>([]);
  const [durationCommitment, setDurationCommitment] = useState("");
  const [hoursPerWeekRange, setHoursPerWeekRange] = useState("");

  // Confirm
  const [acknowledged, setAcknowledged] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch universities
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.from("medjobs_universities").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setUniversityOptions(data); });
  }, []);

  const toggleItem = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  }, []);

  /* ─── Navigation ─────────────────────────────────────────── */

  const goTo = useCallback((target: Step) => {
    if (animating || target === step) return;
    setAnimating(true);
    setAnimClass("tf-out");
    setTimeout(() => {
      setStep(target);
      containerRef.current?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
      setAnimClass("tf-in");
      setTimeout(() => { setAnimClass("tf-visible"); setAnimating(false); }, 350);
    }, 200);
  }, [animating, step]);

  // Track partial creation state
  const [partialProfileId, setPartialProfileId] = useState("");
  const [partialSlug, setPartialSlug] = useState("");
  const [partialExisting, setPartialExisting] = useState(false);
  const partialFiredRef = useRef(false);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      // Fire partial creation after step 0 (about_you) completes
      if (step === 0 && !partialFiredRef.current) {
        partialFiredRef.current = true;
        fetch("/api/medjobs/apply-partial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName, email, phone, city, state,
            website: honeypot,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.profileId && data.profileId !== "ok") {
              setPartialProfileId(data.profileId);
              setPartialSlug(data.slug || "");
              if (data.existing) setPartialExisting(true);
            }
          })
          .catch(() => {
            // Non-blocking — don't interrupt the user
          });
      }
      goTo((step + 1) as Step);
    }
  }, [step, goTo, displayName, email, phone, city, state, honeypot]);

  const goBack = useCallback(() => {
    if (step > 0) goTo((step - 1) as Step);
  }, [step, goTo]);

  const canAdvance = useCallback((): boolean => {
    if (step === 0) return !!displayName.trim() && !!email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (step === 3) return acknowledged;
    return true;
  }, [step, displayName, email, acknowledged]);

  /* ─── Submit ─────────────────────────────────────────────── */

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resolvedMajor = major === "Other" ? majorOther : major;
      const resolvedUniversity = universityOther ? universitySearch : university;
      const res = await fetch("/api/medjobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName, email, phone,
          university: resolvedUniversity,
          universityId: universityOther ? undefined : universityId,
          major: resolvedMajor,
          intendedSchool: intendedSchool || undefined,
          city, state, certifications,
          yearsCaregiving: yearsCaregiving || undefined,
          careExperienceTypes, languages, availabilityTypes, seasonalAvailability,
          durationCommitment: durationCommitment || undefined,
          hoursPerWeekRange: hoursPerWeekRange || undefined,
          acknowledgmentsCompleted: true,
          website: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setResultSlug(data.slug);
      setResultProfileId(data.profileId);
      setIsExisting(!!data.existing);
      setStep(4 as Step);
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  }, [
    displayName, email, phone, university, universityId, universityOther, universitySearch,
    major, majorOther, intendedSchool, city, state, certifications, yearsCaregiving,
    careExperienceTypes, languages, availabilityTypes, seasonalAvailability,
    durationCommitment, hoursPerWeekRange, honeypot,
  ]);

  /* ─── Success ────────────────────────────────────────────── */

  if (step === 4) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ animation: "scale-in 0.4s ease-out" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {isExisting ? (
            <>
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">Welcome back!</h1>
              <p className="text-gray-500 text-lg mb-8">Looks like you already have a profile. Pick up where you left off.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">You&apos;re in, {displayName.split(" ")[0]}!</h1>
              <p className="text-gray-500 text-lg mb-8">Your application has been submitted. Complete a few more steps to go live.</p>
            </>
          )}
          <div className="text-left space-y-3 mb-10">
            {[
              { label: "Record a short intro video", desc: "2-3 min \u2014 helps providers get to know you" },
              { label: "Upload driver\u2019s license", desc: "Required before your first assignment" },
              { label: "Upload car insurance", desc: "Proof of coverage for transportation" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-gray-200 text-xs font-semibold text-gray-400 shrink-0">{i + 1}</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href={`/medjobs/submit-video?slug=${resultSlug}&profileId=${resultProfileId}`}
            className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors">
            Continue setup
          </Link>
          <p className="mt-4 text-sm text-gray-400">Check your email for a sign-in link</p>
          <style>{`@keyframes scale-in { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }`}</style>
        </div>
      </main>
    );
  }

  /* ─── Progress + Layout ──────────────────────────────────── */

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  // University dropdown (special — fetched from Supabase)
  const filteredUniversities = (universityOther ? universitySearch : "").trim()
    ? universityOptions.filter((u) => u.name.toLowerCase().includes(universitySearch.toLowerCase()))
    : universityOptions;

  const UniDropdown = () => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filtered = search.trim()
      ? universityOptions.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
      : universityOptions;

    if (universityOther) {
      return (
        <div>
          <BottomLine value={universitySearch} onChange={setUniversitySearch} placeholder="Enter your university name" autoFocus />
          <button type="button" onClick={() => { setUniversityOther(false); setUniversitySearch(""); }}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600">
            Search from list instead
          </button>
        </div>
      );
    }

    return (
      <div ref={ref} className="relative">
        <button type="button" onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 border-0 border-b-2 border-gray-200 focus:border-gray-900 outline-none py-2 text-left transition-colors">
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className={`text-lg ${university ? "text-gray-900" : "text-gray-300"}`}>
            {university || "Search your university"}
          </span>
        </button>
        {open && (
          <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto animate-in">
            <div className="p-2 border-b border-gray-100">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..." autoFocus className="w-full px-3 py-2 text-sm outline-none bg-gray-50 rounded" />
            </div>
            {(search.trim() ? filtered : universityOptions).map((u) => (
              <button key={u.id} type="button"
                onClick={() => { setUniversity(u.name); setUniversityId(u.id); setOpen(false); }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                  university === u.name ? "border-l-2 border-gray-900 font-medium text-gray-900 bg-gray-50" : "text-gray-700"
                }`}>
                {u.name}
              </button>
            ))}
            <button type="button" onClick={() => { setUniversityOther(true); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-500 font-medium hover:bg-gray-50 border-t border-gray-100">
              My school isn&apos;t listed
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <div className="h-1 bg-gray-100">
          <div className="h-full bg-gray-900 rounded-r-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
      </div>

      <div ref={containerRef} className="max-w-xl mx-auto px-4 sm:px-6 pt-14 pb-40">
        {/* Header */}
        <div className="mb-2">
          <Link href="/medjobs" className="text-sm text-gray-300 hover:text-gray-500 transition-colors">
            &larr; MedJobs
          </Link>
        </div>

        {/* Animated content */}
        <div className={`tf-container ${animClass}`}>
          {/* Section header */}
          <div className="mb-8 pt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                Step {step + 1} of {TOTAL_STEPS}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">{STEP_TITLES[step]}</h1>
            <p className="text-sm text-gray-400 mt-1">{STEP_SUBTITLES[step]}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* ── Step 0: About You ── */}
          {step === 0 && (
            <div className="space-y-7">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Full name *</label>
                <BottomLine value={displayName} onChange={setDisplayName} placeholder="Sarah Kim" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Email *</label>
                <BottomLine value={email} onChange={setEmail} placeholder="sarah@university.edu" type="email" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Phone <span className="normal-case tracking-normal text-gray-300">(optional)</span></label>
                <BottomLine value={phone} onChange={setPhone} placeholder="(555) 123-4567" type="tel" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">City</label>
                  <BottomLine value={city} onChange={setCity} placeholder="Austin" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">State</label>
                  <SearchDropdown
                    options={US_STATES.map((s) => ({ value: s, label: s }))}
                    value={state} onSelect={setState} placeholder="Select" />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-7">
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">University</label>
                <UniDropdown />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Major</label>
                  <SearchDropdown
                    options={MAJORS.map((m) => ({ value: m, label: m }))}
                    value={major} onSelect={setMajor} placeholder="Select" />
                  {major === "Other" && (
                    <div className="mt-3">
                      <BottomLine value={majorOther} onChange={setMajorOther} placeholder="Enter your major" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Career path</label>
                  <SearchDropdown
                    options={INTENDED_SCHOOLS.map((s) => ({ value: s.value, label: s.label }))}
                    value={intendedSchool} onSelect={(v) => setIntendedSchool(v as IntendedProfessionalSchool)} placeholder="Select" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Experience ── */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Years of experience</label>
                <SearchDropdown
                  options={[
                    { value: "0", label: "No prior experience" },
                    { value: "family", label: "Experience with family members" },
                    { value: "1", label: "Less than 1 year" },
                    { value: "2", label: "1-2 years" },
                    { value: "3", label: "3+ years" },
                  ]}
                  value={yearsCaregiving} onSelect={setYearsCaregiving} placeholder="Select" />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Certifications</label>
                <MultiSelectCards
                  options={CERTIFICATIONS.map((c) => ({ value: c, label: c }))}
                  selected={certifications}
                  onToggle={(v) => toggleItem(setCertifications, v)} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Types of care provided</label>
                <MultiSelectCards
                  options={CARE_EXPERIENCE_TYPES.map((c) => ({ value: c, label: c }))}
                  selected={careExperienceTypes}
                  onToggle={(v) => toggleItem(setCareExperienceTypes, v)} />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Languages</label>
                <MultiSelectCards
                  options={LANGUAGES.map((l) => ({ value: l, label: l }))}
                  selected={languages}
                  onToggle={(v) => toggleItem(setLanguages, v)} />
              </div>
            </div>
          )}

          {/* ── Step 2: Availability ── */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">When are you available?</label>
                <MultiSelectCards
                  options={AVAILABILITY_TYPES}
                  selected={availabilityTypes}
                  onToggle={(v) => toggleItem(setAvailabilityTypes, v)}
                  hint="Select all that fit your schedule" />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">Seasonal availability</label>
                <MultiSelectCards
                  options={SEASONAL_OPTIONS}
                  selected={seasonalAvailability}
                  onToggle={(v) => toggleItem(setSeasonalAvailability, v)}
                  hint="Which semesters or breaks work?" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">How long can you commit?</label>
                  <SearchDropdown options={DURATION_OPTIONS} value={durationCommitment} onSelect={setDurationCommitment} placeholder="Select" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Hours per week</label>
                  <SearchDropdown options={HOURS_OPTIONS} value={hoursPerWeekRange} onSelect={setHoursPerWeekRange} placeholder="Select" />
                </div>
              </div>

              {hoursPerWeekRange && ["5-10", "10-15"].includes(hoursPerWeekRange) && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50/60">
                  <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-amber-700">
                    Most providers prefer 15+ hours/week. Consider applying during a break or lighter semester for more opportunities.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                {[
                  "I\u2019ll be on time, professional, and communicate schedule changes 24+ hours in advance",
                  "I understand caregiving duties include personal care, meals, mobility, and companionship",
                  "I have reliable transportation and accept responsibility for my transport costs",
                  "I consent to background checks and will respond to interview requests within 48 hours",
                  "All information in this application is accurate and Olera is not the employer of record",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                    <p className="text-sm text-gray-500 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              <button type="button" onClick={() => setAcknowledged(!acknowledged)}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-lg text-left transition-all ${
                  acknowledged ? "border-2 border-gray-900 bg-gray-50" : "border border-gray-200 hover:border-gray-300"
                }`}>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-semibold shrink-0 ${
                  acknowledged ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {acknowledged ? "\u2713" : "Y"}
                </span>
                <span className="text-sm font-medium text-gray-900">I&apos;ve read and agree to all of the above</span>
              </button>
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="mt-10 flex items-center justify-between">
            {step > 0 ? (
              <button type="button" onClick={goBack} className="text-sm text-gray-300 hover:text-gray-500 transition-colors">
                &larr; Back
              </button>
            ) : <div />}

            {step === 3 ? (
              <button type="button" onClick={handleSubmit}
                disabled={loading || !acknowledged}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors">
                {loading ? "Submitting..." : "Submit application"}
              </button>
            ) : (
              <button type="button" onClick={goNext}
                disabled={!canAdvance() || animating}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors">
                OK
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom nav arrows */}
      <div className="fixed bottom-6 right-6 flex items-center gap-1 z-30">
        <button type="button" onClick={goBack} disabled={step === 0}
          className="p-2 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-50 disabled:opacity-30 transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button type="button" onClick={goNext} disabled={step >= TOTAL_STEPS - 1 || !canAdvance()}
          className="p-2 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-50 disabled:opacity-30 transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <style>{`
        .tf-container { transition: opacity 0.2s ease, transform 0.3s ease; }
        .tf-visible { opacity: 1; transform: translateY(0); }
        .tf-out { opacity: 0; transform: translateY(-12px); }
        .tf-in { opacity: 0; transform: translateY(16px); animation: tf-slide-in 0.35s ease forwards; }
        @keyframes tf-slide-in { to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: tf-slide-in 0.2s ease forwards; opacity: 0; transform: translateY(8px); }
      `}</style>
    </main>
  );
}
