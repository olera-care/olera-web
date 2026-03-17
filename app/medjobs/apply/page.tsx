"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { StudentProgramTrack } from "@/lib/types";

type Step = "personal" | "education" | "experience" | "availability" | "success";

const PROGRAM_TRACKS: { value: StudentProgramTrack; label: string }[] = [
  { value: "pre_nursing", label: "Pre-Nursing" },
  { value: "nursing", label: "Nursing" },
  { value: "pre_med", label: "Pre-Med" },
  { value: "pre_pa", label: "Pre-PA" },
  { value: "pre_health", label: "Pre-Health / Allied Health" },
  { value: "other", label: "Other" },
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
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: "personal", label: "About You", number: 1 },
  { key: "education", label: "Education", number: 2 },
  { key: "experience", label: "Experience", number: 3 },
  { key: "availability", label: "Availability", number: 4 },
];

export default function MedJobsApplyPage() {
  const [step, setStep] = useState<Step>("personal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultSlug, setResultSlug] = useState("");

  // Personal
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Education
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [programTrack, setProgramTrack] = useState<StudentProgramTrack | "">("");

  // Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Experience
  const [certifications, setCertifications] = useState<string[]>([]);
  const [yearsCaregiving, setYearsCaregiving] = useState("");
  const [careExperienceTypes, setCareExperienceTypes] = useState<string[]>([]);
  const [languages, setLanguages] = useState("");

  // Availability
  const [availabilityType, setAvailabilityType] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [transportation, setTransportation] = useState(false);
  const [maxCommuteMiles, setMaxCommuteMiles] = useState("");

  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  const toggleCertification = useCallback((cert: string) => {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  }, []);

  const toggleCareType = useCallback((type: string) => {
    setCareExperienceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case "personal":
        return !!displayName.trim() && !!email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case "education":
        return !!university.trim();
      case "experience":
        return true; // All optional
      case "availability":
        return true; // All optional
      default:
        return false;
    }
  }, [step, displayName, email, university]);

  const handleNext = useCallback(() => {
    setError("");
    const stepOrder: Step[] = ["personal", "education", "experience", "availability"];
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) {
      setStep(stepOrder[idx + 1]);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    const stepOrder: Step[] = ["personal", "education", "experience", "availability"];
    const idx = stepOrder.indexOf(step);
    if (idx > 0) {
      setStep(stepOrder[idx - 1]);
    }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/medjobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          phone,
          description,
          university,
          major,
          graduationYear: graduationYear || undefined,
          programTrack: programTrack || undefined,
          city,
          state,
          certifications,
          yearsCaregiving: yearsCaregiving || undefined,
          careExperienceTypes,
          languages: languages ? languages.split(",").map((l) => l.trim()).filter(Boolean) : [],
          availabilityType: availabilityType || undefined,
          hoursPerWeek: hoursPerWeek || undefined,
          transportation,
          maxCommuteMiles: maxCommuteMiles || undefined,
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
    displayName, email, phone, description, university, major, graduationYear,
    programTrack, city, state, certifications, yearsCaregiving, careExperienceTypes,
    languages, availabilityType, hoursPerWeek, transportation, maxCommuteMiles, honeypot,
  ]);

  if (step === "success") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re in!</h1>
          <p className="text-gray-500 mb-6">
            Your MedJobs profile has been created. Providers in your area can now discover you.
            Check your email for next steps.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={`/medjobs/candidates/${resultSlug}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
            >
              View Your Profile
            </Link>
            <Link
              href="/medjobs"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to MedJobs
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

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
            Create your student caregiver profile. Takes about 3 minutes.
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

          {/* Step: Personal */}
          {step === "personal" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">About You</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Sarah Kim" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="sarah@university.edu" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="(555) 123-4567" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Austin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                    <option value="">Select</option>
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About You</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" placeholder="Tell providers why you're interested in caregiving..." />
              </div>
            </div>
          )}

          {/* Step: Education */}
          {step === "education" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Education</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University / College *</label>
                <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="University of Texas at Austin" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Major / Field of Study</label>
                <input type="text" value={major} onChange={(e) => setMajor(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Biology, Kinesiology, Nursing, etc." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <input type="number" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="2027" min="2024" max="2032" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program Track</label>
                  <select value={programTrack} onChange={(e) => setProgramTrack(e.target.value as StudentProgramTrack)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                    <option value="">Select</option>
                    {PROGRAM_TRACKS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step: Experience */}
          {step === "experience" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Experience</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map((cert) => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => toggleCertification(cert)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        certifications.includes(cert)
                          ? "bg-primary-100 text-primary-700 border border-primary-300"
                          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {cert}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Caregiving Experience</label>
                <select value={yearsCaregiving} onChange={(e) => setYearsCaregiving(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                  <option value="">Select</option>
                  <option value="0">No prior experience</option>
                  <option value="1">Less than 1 year</option>
                  <option value="2">1-2 years</option>
                  <option value="3">3+ years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Care Experience Types</label>
                <div className="flex flex-wrap gap-2">
                  {CARE_EXPERIENCE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleCareType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        careExperienceTypes.includes(type)
                          ? "bg-primary-100 text-primary-700 border border-primary-300"
                          : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken</label>
                <input type="text" value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="English, Spanish, etc." />
              </div>
            </div>
          )}

          {/* Step: Availability */}
          {step === "availability" && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Availability</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select value={availabilityType} onChange={(e) => setAvailabilityType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                  <option value="">Select</option>
                  <option value="part_time">Part-Time</option>
                  <option value="full_time">Full-Time</option>
                  <option value="flexible">Flexible</option>
                  <option value="summer_only">Summer Only</option>
                  <option value="weekends">Weekends Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours Per Week</label>
                <input type="number" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="15" min="1" max="60" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Commute (miles)</label>
                <input type="number" value={maxCommuteMiles} onChange={(e) => setMaxCommuteMiles(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="25" min="1" max="100" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="transportation" checked={transportation} onChange={(e) => setTransportation(e.target.checked)} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <label htmlFor="transportation" className="text-sm text-gray-700">I have my own transportation</label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            {step !== "personal" ? (
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

            {step === "availability" ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors"
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
