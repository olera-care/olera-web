"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { Provider } from "@/lib/types/provider";

type ProviderType = "organization" | "caregiver";
type Step = "resume" | 1 | "search" | 2 | 3 | 4;

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

function getProviderImage(provider: Provider): string | null {
  if (!provider.provider_images) return null;
  const first = provider.provider_images.split("|")[0].trim();
  return first || null;
}

function getProviderChips(provider: Provider): string[] {
  const chips: string[] = [];
  if (provider.provider_category) chips.push(provider.provider_category);
  if (provider.main_category && provider.main_category !== provider.provider_category) {
    chips.push(provider.main_category);
  }
  return chips;
}

function formatAddress(provider: Provider): string {
  return [provider.address, provider.city, provider.state, provider.zipcode]
    .filter(Boolean)
    .join(", ");
}

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { user, account, profiles, isLoading, refreshAccountData } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [data, setData] = useState<WizardData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Dispute state
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeName, setDisputeName] = useState("");
  const [disputeRole, setDisputeRole] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState("");

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
    setStep(type === "organization" ? "search" : 2);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !isSupabaseConfigured()) return;
    setSearching(true);
    setSearchError("");

    try {
      const supabase = createClient();

      // Step 1: Search olera-providers by name
      const { data: providers, error: providerErr } = await supabase
        .from("olera-providers")
        .select("*")
        .eq("deleted", false)
        .ilike("provider_name", `%${searchQuery.trim()}%`)
        .limit(20);

      if (providerErr) {
        setSearchError(`Search failed: ${providerErr.message}`);
        setSearchResults([]);
        return;
      }

      const results = (providers as Provider[]) || [];
      setSearchResults(results);

      // Step 2: Check which of these have been claimed in business_profiles
      if (results.length > 0) {
        const ids = results.map((p) => p.provider_id);
        const { data: claimed } = await supabase
          .from("business_profiles")
          .select("source_provider_id")
          .in("source_provider_id", ids)
          .in("claim_state", ["claimed", "pending"]);

        const claimedSet = new Set<string>(
          (claimed || [])
            .map((r: { source_provider_id: string | null }) => r.source_provider_id)
            .filter((id): id is string => !!id)
        );
        setClaimedIds(claimedSet);
      } else {
        setClaimedIds(new Set());
      }
    } catch {
      setSearchError("Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setHasSearched(true);
      setSearching(false);
    }
  };

  const handleDisputeSubmit = async (provider: Provider) => {
    if (!disputeName.trim() || !disputeRole.trim() || !disputeReason.trim()) return;
    setDisputeSubmitting(true);
    setDisputeError("");

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.provider_id,
          provider_name: provider.provider_name,
          claimant_name: disputeName,
          claimant_role: disputeRole,
          reason: disputeReason,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setDisputeError(err.error || "Failed to submit dispute. Please try again.");
        return;
      }

      setDisputeSuccess(provider.provider_id);
      setDisputingId(null);
    } catch {
      setDisputeError("Something went wrong. Please try again.");
    } finally {
      setDisputeSubmitting(false);
    }
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

  // StepDots position helpers
  const orgTotal = 4;
  const careTotal = 3;
  const stepDotTotal = providerType === "organization" ? orgTotal : careTotal;
  const stepDotCurrent = (s: 2 | 3 | 4) =>
    providerType === "organization" ? s : s - 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showResultsBg = step === "search" && hasSearched;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${showResultsBg ? "bg-gray-50" : "bg-white"}`}>
      {/* Minimal nav */}
      <nav className="border-b border-gray-100 bg-white">
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

      <div className={`flex-1 px-4 ${showResultsBg ? "py-12" : "flex items-center justify-center py-16"}`}>

        {/* ── Resume screen ── */}
        {step === "resume" && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-gray-400 mt-3 text-base">
                Pick up where you left off.
              </p>
            </div>

            <div className="space-y-3">
              {/* Continue card — primary action */}
              <button
                type="button"
                onClick={() => setStep(providerType === "organization" ? "search" : 2)}
                className="w-full flex items-center gap-5 p-6 rounded-2xl border-2 border-primary-200 hover:border-primary-400 hover:shadow-md transition-all duration-200 bg-white text-left group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary-100 group-hover:bg-primary-100 flex items-center justify-center shrink-0 transition-colors duration-200">
                  {providerType === "organization" ? (
                    <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">Continue where you left off</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {providerType === "organization" ? "Organization" : "Private Caregiver"}
                  </p>
                </div>
                <svg className="w-5 h-5 text-primary-300 group-hover:text-primary-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Start fresh card — secondary action */}
              <button
                type="button"
                onClick={handleStartFresh}
                className="w-full flex items-center gap-5 p-6 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 bg-white text-left group"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-100 group-hover:bg-gray-100 flex items-center justify-center shrink-0 transition-colors duration-200">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Start over</p>
                  <p className="text-lg font-semibold text-gray-900">Start from scratch</p>
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
                <p className="text-base text-gray-500 leading-relaxed">
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
                <p className="text-base text-gray-500 leading-relaxed">
                  Individual caregiver offering personal care services to families
                </p>
              </button>
            </div>
          </div>
        )}

        {/* ── Search step: Find your organization ── */}
        {step === "search" && (
          <>
            {/* ── State A: Initial search form ── */}
            {!hasSearched && (
              <div className="w-full max-w-lg">
                <StepDots current={1} total={4} />
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                    Find your organization
                  </h1>
                  <p className="text-gray-400 mt-3 text-base">
                    Let&apos;s check if we already have a listing for you.
                  </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or location…"
                      className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400"
                    />
                  </div>

                  {searchError && (
                    <p className="text-sm text-red-600">{searchError}</p>
                  )}

                  <Button type="submit" fullWidth loading={searching} disabled={!searchQuery.trim()}>
                    Search Directory
                  </Button>
                </form>

                <div className="mt-6 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-6 w-full py-3 text-base font-medium text-primary-600 border border-primary-200 rounded-xl hover:bg-primary-50 hover:border-primary-300 transition-colors"
                >
                  Set up a new page
                </button>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* ── State B: Results found ── */}
            {hasSearched && searchResults.length > 0 && (
              <div className="w-full max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    We found a match!
                  </h1>
                  <p className="text-gray-500 mt-2 text-base">
                    We found {searchResults.length} listing{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>

                <div className="space-y-4 mb-10">
                  {searchResults.map((provider) => {
                    const image = getProviderImage(provider);
                    const chips = getProviderChips(provider);
                    const address = formatAddress(provider);
                    const isClaimed = claimedIds.has(provider.provider_id);
                    const isDisputing = disputingId === provider.provider_id;
                    const isDisputeSuccess = disputeSuccess === provider.provider_id;

                    return (
                      <div
                        key={provider.provider_id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                      >
                        <div className="flex">
                          {/* Image */}
                          <div className="w-36 shrink-0 bg-gray-100 relative">
                            {image ? (
                              <img
                                src={image}
                                alt={provider.provider_name}
                                className="w-full h-full object-cover absolute inset-0"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center absolute inset-0">
                                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-5 min-w-0">
                            {address && (
                              <p className="text-xs text-gray-400 mb-1">{address}</p>
                            )}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900 leading-snug">
                                {provider.provider_name}
                              </h3>
                              {isClaimed && (
                                <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                  Claimed
                                </span>
                              )}
                            </div>

                            {chips.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {chips.slice(0, 2).map((chip) => (
                                  <span
                                    key={chip}
                                    className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-600 bg-white"
                                  >
                                    {chip}
                                  </span>
                                ))}
                                {chips.length > 2 && (
                                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 text-gray-400">
                                    +{chips.length - 2} more
                                  </span>
                                )}
                              </div>
                            )}

                            {provider.provider_description && (
                              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                                {provider.provider_description}
                              </p>
                            )}

                            {/* Action */}
                            {!isClaimed && (
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => setStep(2)}
                                  className="px-4 py-2 text-sm font-medium text-primary-600 border border-primary-300 rounded-lg hover:bg-primary-50 hover:border-primary-400 transition-colors"
                                >
                                  Claim this page →
                                </button>
                              </div>
                            )}

                            {isClaimed && !isDisputeSuccess && (
                              <div className="mt-1">
                                {!isDisputing ? (
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDisputingId(provider.provider_id);
                                        setDisputeName("");
                                        setDisputeRole("");
                                        setDisputeReason("");
                                        setDisputeError("");
                                      }}
                                      className="px-4 py-2 text-sm font-medium text-gray-500 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                      Dispute ownership
                                    </button>
                                  </div>
                                ) : (
                                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                                    <p className="text-sm font-medium text-gray-700">Tell us about your claim</p>
                                    <input
                                      type="text"
                                      value={disputeName}
                                      onChange={(e) => setDisputeName(e.target.value)}
                                      placeholder="Your name"
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <input
                                      type="text"
                                      value={disputeRole}
                                      onChange={(e) => setDisputeRole(e.target.value)}
                                      placeholder="Your role (e.g. Owner, Administrator)"
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                    <textarea
                                      value={disputeReason}
                                      onChange={(e) => setDisputeReason(e.target.value)}
                                      placeholder="Why do you believe you are the owner of this listing?"
                                      rows={3}
                                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    />
                                    {disputeError && (
                                      <p className="text-xs text-red-600">{disputeError}</p>
                                    )}
                                    <div className="flex items-center justify-between gap-3">
                                      <button
                                        type="button"
                                        onClick={() => setDisputingId(null)}
                                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDisputeSubmit(provider)}
                                        disabled={disputeSubmitting || !disputeName.trim() || !disputeRole.trim() || !disputeReason.trim()}
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        {disputeSubmitting ? "Submitting…" : "Submit dispute"}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Dispute success */}
                            {isClaimed && isDisputeSuccess && (
                              <div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
                                <svg className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-sm text-gray-600">
                                  We&apos;ve received your dispute. Our team will review it within 2–3 business days.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom: refine search + create new */}
                <div className="border-t border-gray-200 pt-8 pb-4">
                  <p className="text-center text-base font-semibold text-gray-700 mb-4">
                    Not the place you were looking for?
                  </p>
                  <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search again…"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching || !searchQuery.trim()}
                      className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {searching ? "…" : "Search"}
                    </button>
                  </form>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-400">Or</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <Button fullWidth onClick={() => setStep(2)}>
                    Set up a new page
                  </Button>
                </div>
              </div>
            )}

            {/* ── State C: No results ── */}
            {hasSearched && searchResults.length === 0 && (
              <div className="w-full max-w-sm mx-auto text-center">
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-9 h-9 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  We haven&apos;t found any matches
                </h2>
                <p className="text-gray-400 text-sm mb-8">
                  No listings found for &ldquo;{searchQuery}&rdquo;
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setHasSearched(false)}
                    className="px-5 py-2.5 text-sm font-medium text-primary-600 border border-primary-300 rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    Try a different search
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    Create a new page
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step 2: About ── */}
        {step === 2 && (
          <div className="w-full max-w-lg">
            <StepDots current={stepDotCurrent(2)} total={stepDotTotal} />
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
                  onClick={() => setStep(providerType === "organization" ? "search" : 1)}
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
            <StepDots current={stepDotCurrent(3)} total={stepDotTotal} />
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
            <StepDots current={stepDotCurrent(4)} total={stepDotTotal} />
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
