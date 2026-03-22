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
  "Biology",
  "Kinesiology",
  "Nursing",
  "Public Health",
  "Chemistry",
  "Psychology",
  "Health Sciences",
  "Pre-Med",
  "Other",
];

const CERTIFICATIONS = [
  "CNA (Certified Nursing Assistant)",
  "BLS (Basic Life Support)",
  "CPR / First Aid",
  "HHA (Home Health Aide)",
  "Medication Aide",
  "Phlebotomy",
];

const CARE_EXPERIENCE_TYPES = [
  "Dementia / Alzheimer's",
  "Post-Surgical Care",
  "Mobility Assistance",
  "Medication Management",
  "Personal Care (bathing, dressing)",
  "Companionship",
  "Meal Preparation",
  "Hospice / End-of-Life",
  "Experience with family members",
];

const LANGUAGES = [
  "English", "Spanish", "Mandarin", "Vietnamese", "Hindi",
  "Tagalog", "Arabic", "Korean", "French", "Other",
];

const AVAILABILITY_TYPES = [
  { value: "in_between_classes", label: "In between classes" },
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

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: "about_you", label: "About You", number: 1 },
  { key: "experience", label: "Experience", number: 2 },
  { key: "availability", label: "Availability", number: 3 },
  { key: "acknowledgments", label: "Acknowledgments", number: 4 },
];

// Acknowledgment groups
const ACKNOWLEDGMENT_GROUPS = [
  {
    title: "Reliability & Professionalism",
    items: [
      { key: "reliable_ontime", label: "I understand that being on time and reliable is critical when caring for vulnerable populations." },
      { key: "reliable_communicate", label: "I will communicate any schedule changes or conflicts at least 24 hours in advance." },
      { key: "reliable_professional", label: "I will maintain a professional demeanor at all times while on assignment." },
      { key: "reliable_noshow", label: "I understand that no-shows or last-minute cancellations may result in removal from the platform." },
    ],
  },
  {
    title: "Work Expectations",
    items: [
      { key: "work_duties", label: "I understand caregiving duties may include personal care, meal prep, mobility assistance, and companionship." },
      { key: "work_physical", label: "I am physically able to perform the duties required of the role." },
      { key: "work_supervision", label: "I will follow the care plan and instructions provided by the supervising provider." },
    ],
  },
  {
    title: "Availability Expectations",
    items: [
      { key: "avail_accurate", label: "The availability I provided is accurate and I will keep it updated." },
      { key: "avail_commit", label: "I understand that accepting a shift is a commitment and I am expected to complete it." },
    ],
  },
  {
    title: "Transportation",
    items: [
      { key: "transport_own", label: "I have reliable transportation to get to and from assignments." },
      { key: "transport_responsible", label: "I understand I am responsible for my own transportation costs." },
    ],
  },
  {
    title: "Compliance",
    items: [
      { key: "compliance_background", label: "I consent to a background check if required by the care provider." },
    ],
  },
  {
    title: "Interviews",
    items: [
      { key: "interview_available", label: "I am willing to participate in interviews with care providers." },
      { key: "interview_responsive", label: "I will respond to interview requests within 48 hours." },
    ],
  },
  {
    title: "Program Participation",
    items: [
      { key: "program_feedback", label: "I agree to provide feedback on my experience to help improve the program." },
      { key: "program_represent", label: "I will represent Olera MedJobs professionally in all interactions with providers." },
      { key: "program_accurate", label: "All information I have provided in this application is accurate and truthful." },
      { key: "program_terms", label: "I understand that Olera MedJobs connects students with providers and is not the employer of record." },
    ],
  },
];

const ALL_ACKNOWLEDGMENT_KEYS = ACKNOWLEDGMENT_GROUPS.flatMap((g) => g.items.map((i) => i.key));

export default function MedJobsApplyPage() {
  const [step, setStep] = useState<Step>("about_you");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultSlug, setResultSlug] = useState("");

  // About You (merged old Steps 1+2)
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

  // Acknowledgments
  const [acknowledgments, setAcknowledgments] = useState<Record<string, boolean>>({});

  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  // Fetch universities from Supabase
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

  const toggleAcknowledgment = useCallback((key: string) => {
    setAcknowledgments((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const allAcknowledged = ALL_ACKNOWLEDGMENT_KEYS.every((k) => acknowledgments[k]);

  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case "about_you":
        return !!displayName.trim() && !!email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case "experience":
        return true;
      case "availability":
        return true;
      case "acknowledgments":
        return allAcknowledged;
      default:
        return false;
    }
  }, [step, displayName, email, allAcknowledged]);

  const stepOrder: Step[] = ["about_you", "experience", "availability", "acknowledgments"];

  const handleNext = useCallback(() => {
    setError("");
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) {
      setStep(stepOrder[idx + 1]);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    const idx = stepOrder.indexOf(step);
    if (idx > 0) {
      setStep(stepOrder[idx - 1]);
    }
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
          displayName,
          email,
          phone,
          university: resolvedUniversity,
          universityId: universityOther ? undefined : universityId,
          major: resolvedMajor,
          intendedSchool: intendedSchool || undefined,
          city,
          state,
          certifications,
          yearsCaregiving: yearsCaregiving || undefined,
          careExperienceTypes,
          languages,
          availabilityTypes,
          seasonalAvailability,
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

  // Post-submission screen
  if (step === "success") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-4 mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Account Created</h1>
          <p className="text-gray-500 mb-6 text-center">
            Your profile is <strong className="text-gray-700">NOT yet visible</strong> to providers.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Required steps:</p>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Submit intro video</p>
                <p className="text-xs text-gray-500">Required to activate your profile</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded border-2 border-primary-500 bg-primary-50 flex-shrink-0 mt-0.5 flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">All acknowledgments completed</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mb-6">
            Your profile will not be visible to providers until the required steps are completed.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href={`/medjobs/submit-video?slug=${resultSlug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              Submit Intro Video
            </Link>
            <Link
              href="/medjobs"
              className="text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              Back to MedJobs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  const inputClass = "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none";
  const selectClass = `${inputClass} bg-white`;

  const ToggleButton = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        selected
          ? "bg-primary-100 text-primary-700 border border-primary-300"
          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-gray-50 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/medjobs" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            &larr; Back to MedJobs
          </Link>
          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
            Apply to MedJobs
          </h1>
          <p className="mt-1 text-gray-500">
            Create your student caregiver profile.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  i <= currentStepIdx
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s.number}
              </div>
              <span className="hidden sm:block text-sm text-gray-500">{s.label}</span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < currentStepIdx ? "bg-primary-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Honeypot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
          </div>

          {/* Step 1: About You */}
          {step === "about_you" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">About You</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} placeholder="Sarah Kim" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="sarah@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 123-4567" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} placeholder="Austin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
                    <option value="">Select</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* University dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University / College</label>
                {universityOther ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={universitySearch}
                      onChange={(e) => setUniversitySearch(e.target.value)}
                      className={inputClass}
                      placeholder="Enter your university name"
                    />
                    <button type="button" onClick={() => { setUniversityOther(false); setUniversitySearch(""); }} className="text-xs text-primary-600 hover:text-primary-700">
                      Search from list instead
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={universitySearch || university}
                      onChange={(e) => {
                        setUniversitySearch(e.target.value);
                        setUniversity("");
                        setUniversityId("");
                        setShowUniversityDropdown(true);
                      }}
                      onFocus={() => setShowUniversityDropdown(true)}
                      className={inputClass}
                      placeholder="Search universities..."
                    />
                    {showUniversityDropdown && (universitySearch || !university) && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredUniversities.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setUniversity(u.name);
                              setUniversityId(u.id);
                              setUniversitySearch("");
                              setShowUniversityDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                          >
                            {u.name}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setUniversityOther(true);
                            setShowUniversityDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-primary-600 font-medium hover:bg-primary-50 border-t border-gray-100"
                        >
                          Other (enter manually)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Major dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major / Field of Study</label>
                <select value={major} onChange={(e) => setMajor(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {MAJORS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {major === "Other" && (
                  <input
                    type="text"
                    value={majorOther}
                    onChange={(e) => setMajorOther(e.target.value)}
                    className={`${inputClass} mt-2`}
                    placeholder="Enter your major"
                  />
                )}
              </div>

              {/* Intended Professional School */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intended Professional School</label>
                <select value={intendedSchool} onChange={(e) => setIntendedSchool(e.target.value as IntendedProfessionalSchool)} className={selectClass}>
                  <option value="">Select</option>
                  {INTENDED_SCHOOLS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Experience */}
          {step === "experience" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Caregiving Experience</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map((cert) => (
                    <ToggleButton
                      key={cert}
                      selected={certifications.includes(cert)}
                      label={cert}
                      onClick={() => toggleItem(setCertifications, cert)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Care Experience Types</label>
                <div className="flex flex-wrap gap-2">
                  {CARE_EXPERIENCE_TYPES.map((type) => (
                    <ToggleButton
                      key={type}
                      selected={careExperienceTypes.includes(type)}
                      label={type}
                      onClick={() => toggleItem(setCareExperienceTypes, type)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <ToggleButton
                      key={lang}
                      selected={languages.includes(lang)}
                      label={lang}
                      onClick={() => toggleItem(setLanguages, lang)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === "availability" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Availability</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">When are you available?</label>
                <div className="space-y-2">
                  {AVAILABILITY_TYPES.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={availabilityTypes.includes(opt.value)}
                        onChange={() => toggleItem(setAvailabilityTypes, opt.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Seasonal availability</label>
                <div className="space-y-2">
                  {SEASONAL_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={seasonalAvailability.includes(opt.value)}
                        onChange={() => toggleItem(setSeasonalAvailability, opt.value)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration commitment</label>
                <select value={durationCommitment} onChange={(e) => setDurationCommitment(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours per week</label>
                <select value={hoursPerWeekRange} onChange={(e) => setHoursPerWeekRange(e.target.value)} className={selectClass}>
                  <option value="">Select</option>
                  {HOURS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {hoursPerWeekRange && ["5-10", "10-15"].includes(hoursPerWeekRange) && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      Most providers prefer students who can commit 15+ hours per week. Consider applying during a break or a lighter semester for more opportunities.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Acknowledgments */}
          {step === "acknowledgments" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Acknowledgments</h2>
                <p className="text-sm text-gray-500 mt-1">Please read and check each item to continue.</p>
              </div>
              {ACKNOWLEDGMENT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">{group.title}</h3>
                  <div className="space-y-2.5">
                    {group.items.map((item) => (
                      <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!acknowledgments[item.key]}
                          onChange={() => toggleAcknowledgment(item.key)}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-gray-600 leading-snug">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step !== "about_you" ? (
              <button
                type="button"
                onClick={handleBack}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                &larr; Back
              </button>
            ) : (
              <div />
            )}

            {step === "acknowledgments" ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !allAcknowledged}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canAdvance()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-colors"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
