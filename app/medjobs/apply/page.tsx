"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { IntendedProfessionalSchool } from "@/lib/types";
import { createBrowserClient } from "@supabase/ssr";

type Step = "about_you" | "experience" | "availability" | "acknowledgments" | "success";

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
  "CNA (Certified Nursing Assistant)", "BLS (Basic Life Support)",
  "CPR / First Aid", "HHA (Home Health Aide)", "Medication Aide", "Phlebotomy",
];

const CARE_EXPERIENCE_TYPES = [
  "Dementia / Alzheimer's", "Post-Surgical Care", "Mobility Assistance",
  "Medication Management", "Personal Care (bathing, dressing)", "Companionship",
  "Meal Preparation", "Hospice / End-of-Life", "Experience with family members",
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

const STEP_ORDER: Step[] = ["about_you", "experience", "availability", "acknowledgments"];
const STEP_LABELS: Record<string, string> = {
  about_you: "Let's get to know you",
  experience: "Your caregiving background",
  availability: "When can you work?",
  acknowledgments: "Almost there",
};

// Consolidated acknowledgment text — replaces 15 individual checkboxes
const ACKNOWLEDGMENT_SUMMARY_ITEMS = [
  "I will be on time, professional, and communicate schedule changes 24+ hours in advance",
  "I understand caregiving duties include personal care, meals, mobility, and companionship",
  "I have reliable transportation and accept responsibility for my transport costs",
  "I consent to background checks and will respond to interview requests within 48 hours",
  "All information in this application is accurate and I understand Olera is not the employer of record",
];

export default function MedJobsApplyPage() {
  const [step, setStep] = useState<Step>("about_you");
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
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
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

  // Acknowledgments — single toggle
  const [acknowledged, setAcknowledged] = useState(false);

  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  // Fetch universities
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase
      .from("medjobs_universities")
      .select("id, name")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setUniversityOptions(data);
      });
  }, []);

  const filteredUniversities = universitySearch.trim()
    ? universityOptions.filter((u) =>
        u.name.toLowerCase().includes(universitySearch.toLowerCase())
      )
    : universityOptions;

  const toggleItem = useCallback((setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setter((prev) => prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]);
  }, []);

  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case "about_you":
        return !!displayName.trim() && !!email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case "experience":
      case "availability":
        return true;
      case "acknowledgments":
        return acknowledged;
      default:
        return false;
    }
  }, [step, displayName, email, acknowledged]);

  const handleNext = useCallback(() => {
    setError("");
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }, [step]);

  const handleBack = useCallback(() => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }, [step]);

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
          city, state,
          certifications, yearsCaregiving: yearsCaregiving || undefined,
          careExperienceTypes, languages,
          availabilityTypes, seasonalAvailability,
          durationCommitment: durationCommitment || undefined,
          hoursPerWeekRange: hoursPerWeekRange || undefined,
          acknowledgmentsCompleted: true,
          website: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResultSlug(data.slug);
      setResultProfileId(data.profileId);
      setIsExisting(!!data.existing);
      setStep("success");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    displayName, email, phone, university, universityId, universityOther, universitySearch,
    major, majorOther, intendedSchool, city, state, certifications, yearsCaregiving,
    careExperienceTypes, languages, availabilityTypes, seasonalAvailability,
    durationCommitment, hoursPerWeekRange, honeypot,
  ]);

  // ─── Success Screen ──────────────────────────────────────────
  if (step === "success") {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {/* Animated checkmark */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ animation: "scale-in 0.4s ease-out" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {isExisting ? (
            <>
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">Welcome back!</h1>
              <p className="text-gray-500 text-lg mb-8">
                Looks like you already have a profile. Pick up where you left off.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">
                You&apos;re in, {displayName.split(" ")[0]}!
              </h1>
              <p className="text-gray-500 text-lg mb-8">
                Your application has been submitted. Complete a few more steps to go live.
              </p>
            </>
          )}

          {/* Next steps */}
          <div className="text-left space-y-4 mb-10">
            {[
              { label: "Record a short intro video", desc: "2-3 minutes — helps providers get to know you", done: false },
              { label: "Upload driver's license", desc: "Required before your first assignment", done: false },
              { label: "Upload car insurance", desc: "Proof of coverage for transportation", done: false },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-sm font-semibold text-gray-400 shrink-0">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/medjobs/submit-video?slug=${resultSlug}&profileId=${resultProfileId}`}
            className="inline-flex items-center justify-center w-full px-6 py-3.5 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            Continue setup
          </Link>
          <p className="mt-4 text-sm text-gray-400">
            Check your email for a sign-in link
          </p>

          <style>{`
            @keyframes scale-in {
              0% { transform: scale(0); opacity: 0; }
              60% { transform: scale(1.15); }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      </main>
    );
  }

  // ─── Progress ────────────────────────────────────────────────
  const currentStepIdx = STEP_ORDER.indexOf(step);
  const progress = ((currentStepIdx + 1) / STEP_ORDER.length) * 100;

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition-colors";
  const selectClass = `${inputClass} bg-white`;

  const Pill = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
        selected
          ? "bg-gray-900 text-white shadow-sm"
          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="sticky top-0 z-20 bg-white">
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gray-900 rounded-r-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/medjobs" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            &larr; Back to MedJobs
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">
            {STEP_LABELS[step] || "Apply"}
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Step {currentStepIdx + 1} of {STEP_ORDER.length}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Honeypot */}
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
        </div>

        {/* ── Step 1: About You ── */}
        {step === "about_you" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name *</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="Sarah Kim" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="sarah@university.edu" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 123-4567" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Austin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">University / College</label>
              {universityOther ? (
                <div className="space-y-2">
                  <input type="text" value={universitySearch} onChange={(e) => setUniversitySearch(e.target.value)} className={inputClass} placeholder="Enter your university name" />
                  <button type="button" onClick={() => { setUniversityOther(false); setUniversitySearch(""); }} className="text-xs text-gray-500 hover:text-gray-700">
                    Search from list instead
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={universitySearch || university}
                    onChange={(e) => { setUniversitySearch(e.target.value); setUniversity(""); setUniversityId(""); setShowUniversityDropdown(true); }}
                    onFocus={() => setShowUniversityDropdown(true)}
                    className={inputClass}
                    placeholder="Search universities..."
                  />
                  {showUniversityDropdown && (universitySearch || !university) && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredUniversities.map((u) => (
                        <button
                          key={u.id} type="button"
                          onClick={() => { setUniversity(u.name); setUniversityId(u.id); setUniversitySearch(""); setShowUniversityDropdown(false); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                        >
                          {u.name}
                        </button>
                      ))}
                      <button type="button" onClick={() => { setUniversityOther(true); setShowUniversityDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-500 font-medium hover:bg-gray-50 border-t border-gray-100">
                        My school isn&apos;t listed
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Major</label>
              <select value={major} onChange={(e) => setMajor(e.target.value)} className={selectClass}>
                <option value="">Select</option>
                {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {major === "Other" && (
                <input type="text" value={majorOther} onChange={(e) => setMajorOther(e.target.value)} className={`${inputClass} mt-2`} placeholder="Enter your major" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Career direction</label>
              <select value={intendedSchool} onChange={(e) => setIntendedSchool(e.target.value as IntendedProfessionalSchool)} className={selectClass}>
                <option value="">Select</option>
                {INTENDED_SCHOOLS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Step 2: Experience ── */}
        {step === "experience" && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of caregiving experience</label>
              <select value={yearsCaregiving} onChange={(e) => setYearsCaregiving(e.target.value)} className={selectClass}>
                <option value="">Select</option>
                <option value="0">No prior experience</option>
                <option value="family">Experience with family members</option>
                <option value="1">Less than 1 year</option>
                <option value="2">1-2 years</option>
                <option value="3">3+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Certifications</label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATIONS.map((cert) => (
                  <Pill key={cert} selected={certifications.includes(cert)} label={cert} onClick={() => toggleItem(setCertifications, cert)} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Types of care you&apos;ve provided</label>
              <div className="flex flex-wrap gap-2">
                {CARE_EXPERIENCE_TYPES.map((type) => (
                  <Pill key={type} selected={careExperienceTypes.includes(type)} label={type} onClick={() => toggleItem(setCareExperienceTypes, type)} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <Pill key={lang} selected={languages.includes(lang)} label={lang} onClick={() => toggleItem(setLanguages, lang)} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Availability ── */}
        {step === "availability" && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">When are you available?</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABILITY_TYPES.map((opt) => (
                  <Pill key={opt.value} selected={availabilityTypes.includes(opt.value)} label={opt.label} onClick={() => toggleItem(setAvailabilityTypes, opt.value)} />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Seasonal availability</label>
              <div className="flex flex-wrap gap-2">
                {SEASONAL_OPTIONS.map((opt) => (
                  <Pill key={opt.value} selected={seasonalAvailability.includes(opt.value)} label={opt.label} onClick={() => toggleItem(setSeasonalAvailability, opt.value)} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration</label>
                <select value={durationCommitment} onChange={(e) => setDurationCommitment(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {DURATION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Hours per week</label>
                <select value={hoursPerWeekRange} onChange={(e) => setHoursPerWeekRange(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {HOURS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Acknowledgments (collapsed) ── */}
        {step === "acknowledgments" && (
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              By submitting, you agree to the following:
            </p>

            <div className="space-y-3">
              {ACKNOWLEDGMENT_SUMMARY_ITEMS.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                  <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={() => setAcknowledged(!acknowledged)}
                className="w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
              />
              <span className="text-sm font-medium text-gray-900">
                I&apos;ve read and agree to all of the above
              </span>
            </label>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="mt-10 flex items-center justify-between">
          {step !== "about_you" ? (
            <button type="button" onClick={handleBack} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              &larr; Back
            </button>
          ) : (
            <div />
          )}

          {step === "acknowledgments" ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !acknowledged}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors"
            >
              {loading ? "Submitting..." : "Submit application"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canAdvance()}
              className="px-8 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-semibold text-white transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
