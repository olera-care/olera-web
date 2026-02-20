"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type ProviderType = "organization" | "caregiver";
type Step = "resume" | 1 | 2 | 3 | 4;

const TYPE_KEY = "olera_onboarding_provider_type";
const DATA_KEY = "olera_provider_wizard_data";

const ORG_CATEGORIES: { value: string; label: string }[] = [
  { value: "assisted_living", label: "Assisted Living" },
  { value: "independent_living", label: "Independent Living" },
  { value: "memory_care", label: "Memory Care" },
  { value: "nursing_home", label: "Nursing Home / Skilled Nursing" },
  { value: "home_care_agency", label: "Home Care Agency" },
  { value: "home_health_agency", label: "Home Health Agency" },
  { value: "hospice_agency", label: "Hospice" },
  { value: "inpatient_hospice", label: "Inpatient Hospice" },
  { value: "rehab_facility", label: "Rehabilitation Facility" },
  { value: "adult_day_care", label: "Adult Day Care" },
  { value: "wellness_center", label: "Wellness Center" },
];

const CARE_TYPES = [
  "Assisted Living",
  "Memory Care",
  "Independent Living",
  "Skilled Nursing",
  "Home Care",
  "Home Health",
  "Hospice",
  "Respite Care",
  "Adult Day Care",
  "Rehabilitation",
];

interface WizardData {
  displayName: string;
  description: string;
  category: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  careTypes: string[];
}

const EMPTY: WizardData = {
  displayName: "",
  description: "",
  category: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  email: "",
  website: "",
  careTypes: [],
};

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className={`rounded-full transition-all duration-300 ${
              i < current - 1
                ? "w-2 h-2 bg-primary-600"
                : i === current - 1
                ? "w-2.5 h-2.5 bg-primary-600"
                : "w-2 h-2 bg-gray-200"
            }`}
          />
          {i < total - 1 && (
            <div
              className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${
                i < current - 1 ? "bg-primary-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { user, account, profiles, isLoading, refreshAccountData } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Auth guard + resume detection
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    // If they already have a provider profile, redirect to hub
    const hasProviderProfile = (profiles || []).some(
      (p) => p.type === "organization" || p.type === "caregiver"
    );
    if (hasProviderProfile) {
      router.replace("/provider");
      return;
    }

    // Check for a previously started session
    try {
      const savedType = localStorage.getItem(TYPE_KEY) as ProviderType | null;
      if (savedType === "organization" || savedType === "caregiver") {
        setProviderType(savedType);
        const savedData = localStorage.getItem(DATA_KEY);
        if (savedData) {
          try {
            setData({ ...EMPTY, ...JSON.parse(savedData) });
          } catch {
            // ignore corrupt data
          }
        }
        setStep("resume");
      }
    } catch {
      // localStorage unavailable
    }
  }, [user, profiles, isLoading, router]);

  const update = (key: keyof WizardData, value: string | string[]) => {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable (SSR or private mode)
      }
      return next;
    });
  };

  const toggleCareType = (ct: string) => {
    const next = data.careTypes.includes(ct)
      ? data.careTypes.filter((t) => t !== ct)
      : [...data.careTypes, ct];
    update("careTypes", next);
  };

  const handleSelectType = (type: ProviderType) => {
    setProviderType(type);
    try {
      localStorage.setItem(TYPE_KEY, type);
    } catch {
      // localStorage unavailable
    }
    setStep(2);
  };

  const handleStartFresh = () => {
    try {
      localStorage.removeItem(TYPE_KEY);
      localStorage.removeItem(DATA_KEY);
    } catch {
      // localStorage unavailable
    }
    setProviderType(null);
    setData(EMPTY);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!data.displayName.trim()) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent: "provider",
          providerType,
          displayName: data.displayName,
          orgName:
            providerType === "organization" ? data.displayName : undefined,
          description: data.description || undefined,
          category: data.category || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          website: data.website || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          zip: data.zip || undefined,
          careTypes: data.careTypes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSubmitError(err.error || "Failed to create profile. Please try again.");
        return;
      }

      try {
        localStorage.removeItem(TYPE_KEY);
        localStorage.removeItem(DATA_KEY);
      } catch {
        // localStorage unavailable (SSR or private mode)
      }

      await refreshAccountData();
      router.push("/provider");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayName =
    account?.display_name || user?.email?.split("@")[0] || "back";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal nav */}
      <nav className="border-b border-gray-100">
        <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-600">
            <span className="font-bold text-lg text-white">O</span>
          </div>
          <span className="text-xl font-bold text-gray-900">Olera</span>
        </Link>
        <Link
          href="/"
          className="px-4 py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
        >
          Exit
        </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">

        {/* ── Resume screen ── */}
        {step === "resume" && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                You started setting up a provider profile. What would you like to do?
              </p>
            </div>

            <div className="space-y-4">
              {/* Continue card */}
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 bg-white text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center shrink-0 transition-colors duration-200">
                  {providerType === "organization" ? (
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-400 mb-0.5">Finish setting up your profile</p>
                  <p className="text-base font-semibold text-gray-900">
                    Continue as {providerType === "organization" ? "an Organization" : "a Private Caregiver"}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Start fresh card */}
              <button
                type="button"
                onClick={handleStartFresh}
                className="w-full flex items-center gap-5 p-5 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center shrink-0 transition-colors duration-200">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-400 mb-0.5">Start a new profile</p>
                  <p className="text-base font-semibold text-gray-900">Start from scratch</p>
                </div>
                <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Choose provider type ── */}
        {step === 1 && (
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                How would you describe yourself?
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Organization */}
              <button
                type="button"
                onClick={() => handleSelectType("organization")}
                className="group flex flex-col items-center text-center p-10 rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center mb-6 transition-colors duration-200">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Organization</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Assisted living, home care agency, memory care facility, and more
                </p>
              </button>

              {/* Private Caregiver */}
              <button
                type="button"
                onClick={() => handleSelectType("caregiver")}
                className="group flex flex-col items-center text-center p-10 rounded-2xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer bg-white"
              >
                <div className="w-20 h-20 rounded-2xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center mb-6 transition-colors duration-200">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Private Caregiver</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Individual caregiver offering personal care services to families
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: About ── */}
        {step === 2 && (
          <div className="w-full max-w-lg">
            <StepDots current={1} total={3} />
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                {providerType === "organization"
                  ? "Tell us about your organization"
                  : "Tell us about yourself"}
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                This is what families will see on your public profile.
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label={
                  providerType === "organization"
                    ? "Organization name"
                    : "Your name"
                }
                value={data.displayName}
                onChange={(e) =>
                  update("displayName", (e.target as HTMLInputElement).value)
                }
                required
                placeholder={
                  providerType === "organization"
                    ? "e.g. Sunrise Senior Living"
                    : "e.g. Maria Garcia"
                }
              />

              <Input
                label="Description"
                as="textarea"
                value={data.description}
                onChange={(e) =>
                  update(
                    "description",
                    (e.target as HTMLTextAreaElement).value
                  )
                }
                placeholder={
                  providerType === "organization"
                    ? "What makes your organization unique? What services do you offer?"
                    : "Describe your experience and approach to caregiving."
                }
                rows={4}
              />

              {providerType === "organization" && (
                <div className="space-y-1.5">
                  <label className="block text-base font-medium text-gray-700">
                    Organization type
                  </label>
                  <select
                    value={data.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a type</option>
                    {ORG_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back
                </button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!data.displayName.trim()}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Location & Contact ── */}
        {step === 3 && (
          <div className="w-full max-w-lg">
            <StepDots current={2} total={3} />
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Location &amp; contact
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                Help families find and reach you. All fields are optional.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={data.city}
                  onChange={(e) =>
                    update("city", (e.target as HTMLInputElement).value)
                  }
                  placeholder="e.g. San Francisco"
                />
                <Input
                  label="State"
                  value={data.state}
                  onChange={(e) =>
                    update("state", (e.target as HTMLInputElement).value)
                  }
                  placeholder="e.g. CA"
                />
              </div>

              <Input
                label="ZIP code"
                value={data.zip}
                onChange={(e) =>
                  update("zip", (e.target as HTMLInputElement).value)
                }
                placeholder="e.g. 94102"
              />

              <Input
                label="Phone"
                type="tel"
                value={data.phone}
                onChange={(e) =>
                  update("phone", (e.target as HTMLInputElement).value)
                }
                placeholder="(555) 123-4567"
              />

              <Input
                label="Email"
                type="email"
                value={data.email}
                onChange={(e) =>
                  update("email", (e.target as HTMLInputElement).value)
                }
                placeholder="contact@example.com"
              />

              <Input
                label="Website"
                type="url"
                value={data.website}
                onChange={(e) =>
                  update("website", (e.target as HTMLInputElement).value)
                }
                placeholder="https://example.com"
              />

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back
                </button>
                <Button onClick={() => setStep(4)}>Continue</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Services + Review + Submit ── */}
        {step === 4 && (
          <div className="w-full max-w-lg">
            <StepDots current={3} total={3} />
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Services offered
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                Select the care types you provide. You can always update these later.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {CARE_TYPES.map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => toggleCareType(ct)}
                  className={[
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                    data.careTypes.includes(ct)
                      ? "bg-primary-50 border-primary-500 text-primary-700"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
                  ].join(" ")}
                >
                  {ct}
                </button>
              ))}
            </div>

            {/* Profile preview */}
            <div className="bg-gray-50 rounded-xl p-5 mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Profile preview
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <span className="text-gray-400 w-20 shrink-0">Type</span>
                  <span className="text-gray-900 font-medium">
                    {providerType === "organization"
                      ? "Organization"
                      : "Private Caregiver"}
                  </span>
                </div>
                <div className="flex gap-3">
                  <span className="text-gray-400 w-20 shrink-0">Name</span>
                  <span className="text-gray-900 font-medium">
                    {data.displayName || "—"}
                  </span>
                </div>
                {(data.city || data.state) && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-20 shrink-0">Location</span>
                    <span className="text-gray-900">
                      {[data.city, data.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {data.phone && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-20 shrink-0">Phone</span>
                    <span className="text-gray-900">{data.phone}</span>
                  </div>
                )}
                {data.careTypes.length > 0 && (
                  <div className="flex gap-3">
                    <span className="text-gray-400 w-20 shrink-0">Services</span>
                    <span className="text-gray-900">
                      {data.careTypes.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <div
                className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-5"
                role="alert"
              >
                {submitError}
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!data.displayName.trim() || submitting}
              >
                Create profile
              </Button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              You can add more details — photos, certifications, pricing — after setup.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
