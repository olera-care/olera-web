"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCitySearch } from "@/hooks/use-city-search";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import WizardNav from "@/components/ui/WizardNav";
import Pagination from "@/components/ui/Pagination";
import OtpInput from "@/components/auth/OtpInput";
import type { Provider } from "@/lib/types/provider";

type ProviderType = "organization" | "caregiver";
type Step = "resume" | 1 | "search" | "verify" | 2 | 3 | 4 | 5 | "success";

const TYPE_KEY = "olera_onboarding_provider_type";
const DATA_KEY = "olera_provider_wizard_data";
const STEP_KEY = "olera_onboarding_step";
const SEARCH_KEY = "olera_onboarding_search";
const CLAIM_KEY = "olera_onboarding_claim";
const RESULTS_PER_PAGE = 6;

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

function getProviderImage(provider: Provider): string | null {
  if (!provider.provider_images) return null;
  const first = provider.provider_images.split("|")[0].trim();
  return first || null;
}

function formatAddress(provider: Provider): string {
  return [provider.address, provider.city, provider.state, provider.zipcode]
    .filter(Boolean)
    .join(", ");
}

const ONBOARDING_HIGHLIGHTS: Record<string, string[]> = {
  "Home Care (Non-medical)": ["In-Home Care", "Certified Caregivers", "Companionship"],
  "Home Health Care": ["Skilled Nursing", "Health Monitoring", "In-Home Care"],
  "Hospice": ["Nursing Care", "Wellness Support", "Community Resources"],
  "Assisted Living": ["Licensed Community", "Social Activities", "Health Services"],
  "Memory Care": ["Licensed Community", "Certified Staff", "Health Monitoring"],
  "Independent Living": ["Community Living", "Social Activities", "Wellness Programs"],
  "Nursing Home": ["Skilled Nursing", "Licensed Facility", "Medical Care"],
};

function getProviderHighlights(provider: Provider): string[] {
  return ONBOARDING_HIGHLIGHTS[provider.provider_category] ?? ["Senior Care", "Professional Staff", "Quality Services"];
}

export default function ProviderOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProviderOnboardingContent />
    </Suspense>
  );
}

function ProviderOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdding = searchParams.get("adding") === "true";
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
  const [currentPage, setCurrentPage] = useState(1);

  // Location dropdown state (single input drives both name + city search)
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(searchQuery);

  // Step 3 city picker state
  const [cityQuery, setCityQuery] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const { results: cityPickerResults, preload: preloadCityPicker } = useCitySearch(cityQuery);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
      if (
        cityPickerRef.current &&
        !cityPickerRef.current.contains(e.target as Node)
      ) {
        setShowCityPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Persist step + search query so resume works properly
  useEffect(() => {
    if (step === "resume" || step === 1 || step === "success") return; // don't overwrite during init
    try {
      localStorage.setItem(STEP_KEY, String(step));
    } catch {
      // localStorage unavailable
    }
  }, [step]);

  useEffect(() => {
    try {
      if (searchQuery) {
        localStorage.setItem(SEARCH_KEY, searchQuery);
      }
    } catch {
      // localStorage unavailable
    }
  }, [searchQuery]);

  // Dispute state
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeName, setDisputeName] = useState("");
  const [disputeRole, setDisputeRole] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState("");

  // Claim verification state
  const [claimingProvider, setClaimingProvider] = useState<Provider | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyEmailHint, setVerifyEmailHint] = useState("");
  const [verifyNoEmail, setVerifyNoEmail] = useState(false);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifyResendCooldown, setVerifyResendCooldown] = useState(0);
  const [showNoAccess, setShowNoAccess] = useState(false);
  const [noAccessName, setNoAccessName] = useState("");
  const [noAccessReason, setNoAccessReason] = useState("");
  const [noAccessNotes, setNoAccessNotes] = useState("");
  const [noAccessEmail, setNoAccessEmail] = useState("");
  const [noAccessSubmitting, setNoAccessSubmitting] = useState(false);
  const [noAccessSuccess, setNoAccessSuccess] = useState(false);

  // Auth guard + resume detection
  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/");
      return;
    }

    // If they already have a provider profile, redirect to hub
    // (unless they're explicitly adding another profile via ?adding=true)
    const hasProviderProfile = (profiles || []).some(
      (p) => p.type === "organization" || p.type === "caregiver"
    );
    if (hasProviderProfile && !isAdding) {
      router.replace("/provider");
      return;
    }

    // When adding a new profile, clear stale wizard data so we start fresh
    if (isAdding) {
      try {
        localStorage.removeItem(TYPE_KEY);
        localStorage.removeItem(DATA_KEY);
        localStorage.removeItem(STEP_KEY);
        localStorage.removeItem(SEARCH_KEY);
        localStorage.removeItem(CLAIM_KEY);
      } catch {
        // localStorage unavailable
      }
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
        // Restore search query so it's visible when resuming
        try {
          const savedSearch = localStorage.getItem(SEARCH_KEY);
          if (savedSearch) setSearchQuery(savedSearch);
        } catch {
          // ignore
        }
        // Restore claimed provider so verify step can resume
        try {
          const savedClaim = localStorage.getItem(CLAIM_KEY);
          if (savedClaim) {
            const parsed = JSON.parse(savedClaim);
            if (parsed?.provider_id && parsed?.provider_name) {
              setClaimingProvider(parsed as Provider);
            }
          }
        } catch {
          // ignore corrupt data
        }
        setStep("resume");
      }
    } catch {
      // localStorage unavailable
    }
  }, [user, profiles, isLoading, isAdding, router]);

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
  };

  const handleStep1Next = () => {
    if (!providerType) return;
    setStep(providerType === "organization" ? "search" : 2);
  };

  const handleResume = () => {
    let savedStep: Step | null = null;
    try {
      const raw = localStorage.getItem(STEP_KEY);
      if (raw === "2" || raw === "3" || raw === "4" || raw === "5") savedStep = Number(raw) as 2 | 3 | 4 | 5;
      else if (raw === "search" || raw === "verify") savedStep = raw;
    } catch {
      // localStorage unavailable
    }

    if (providerType === "organization") {
      // For org flow: if they were on step 2-5, go there directly.
      if (savedStep === 2 || savedStep === 3 || savedStep === 4 || savedStep === 5) {
        setStep(savedStep);
      } else if (savedStep === "verify" && claimingProvider) {
        // Resume directly to verify — the claimed provider was restored from localStorage.
        // OTP code is NOT persisted (time-sensitive), so user will need to request a new code.
        setStep("verify");
      } else {
        // Default: go to search. If there's a saved query, auto-search.
        setStep("search");
        if (searchQuery.trim()) {
          // Auto-trigger search after a tick so the step renders first
          setTimeout(() => {
            handleSearch({ preventDefault: () => {} } as React.FormEvent);
          }, 0);
        }
      }
    } else {
      // Caregiver flow: go to saved step or default to step 2
      if (savedStep === 2 || savedStep === 3 || savedStep === 4 || savedStep === 5) {
        setStep(savedStep);
      } else {
        setStep(2);
      }
    }
  };

  const handleStartFresh = () => {
    try {
      localStorage.removeItem(TYPE_KEY);
      localStorage.removeItem(DATA_KEY);
      localStorage.removeItem(STEP_KEY);
      localStorage.removeItem(SEARCH_KEY);
      localStorage.removeItem(CLAIM_KEY);
    } catch {
      // localStorage unavailable
    }
    setProviderType(null);
    setData(EMPTY);
    setClaimingProvider(null);
    setStep(1);
  };

  // Resend cooldown timer for claim verification
  useEffect(() => {
    if (verifyResendCooldown > 0) {
      const timer = setTimeout(() => setVerifyResendCooldown(verifyResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [verifyResendCooldown]);

  const handleSendVerificationCode = async (provider: Provider) => {
    setVerifySending(true);
    setVerifyError("");
    setVerifyCode("");
    setVerifyNoEmail(false);
    try {
      const res = await fetch("/api/claim/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: provider.provider_id }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (res.status === 422) {
          // No email on file — show no-access form directly
          setVerifyNoEmail(true);
        } else {
          setVerifyError(result.error || "Failed to send code.");
        }
        return;
      }
      setVerifyEmailHint(result.emailHint);
      setVerifyResendCooldown(60);
    } catch {
      setVerifyError("Something went wrong. Please try again.");
    } finally {
      setVerifySending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verifyCode.length !== 6 || !claimingProvider) return;
    setVerifyChecking(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/claim/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: claimingProvider.provider_id,
          code: verifyCode,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.verified) {
        setVerifyError(result.error || "Incorrect code. Please try again.");
        return;
      }
      // Verified — proceed to step 2
      setStep(2);
    } catch {
      setVerifyError("Something went wrong. Please try again.");
    } finally {
      setVerifyChecking(false);
    }
  };

  const handleNoAccessSubmit = async () => {
    if (!claimingProvider || !noAccessName.trim() || !noAccessReason.trim() || !noAccessEmail.trim()) return;
    setNoAccessSubmitting(true);
    try {
      const res = await fetch("/api/claim/no-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: claimingProvider.provider_id,
          providerName: claimingProvider.provider_name,
          contactName: noAccessName,
          reason: noAccessNotes ? `${noAccessReason} — ${noAccessNotes}` : noAccessReason,
          alternativeEmail: noAccessEmail,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setVerifyError(err.error || "Failed to submit request.");
        return;
      }
      setNoAccessSuccess(true);
    } catch {
      setVerifyError("Something went wrong. Please try again.");
    } finally {
      setNoAccessSubmitting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q || !isSupabaseConfigured()) return;
    setSearching(true);
    setSearchError("");
    setShowLocationDropdown(false);
    setCurrentPage(1);

    try {
      const supabase = createClient();

      let query = supabase
        .from("olera-providers")
        .select("*")
        .eq("deleted", false);

      // Detect "City, ST" format (e.g. "Houston, TX")
      const parts = q.split(",").map((s: string) => s.trim());
      if (parts.length >= 2 && parts[1].length <= 3) {
        query = query.ilike("city", `%${parts[0]}%`);
        query = query.ilike("state", `%${parts[1]}%`);
      } else {
        // General search: match name, city, or state
        query = query.or(
          `provider_name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%`
        );
      }

      const { data: providers, error: providerErr } = await query.limit(20);

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
      // Ensure account exists (handles edge case where DB trigger didn't fire on signup)
      if (!account?.id) {
        const ensureRes = await fetch("/api/auth/ensure-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: data.displayName }),
        });

        if (!ensureRes.ok) {
          const errorData = await ensureRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to set up account");
        }
      }

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
          isAddingProfile: isAdding,
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
        localStorage.removeItem(STEP_KEY);
        localStorage.removeItem(SEARCH_KEY);
        localStorage.removeItem(CLAIM_KEY);
      } catch {
        // localStorage unavailable (SSR or private mode)
      }

      await refreshAccountData();
      setStep("success");
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayName =
    account?.display_name || user?.email?.split("@")[0] || "back";

  // WizardNav step mapping — org: 6 steps, caregiver: 5 steps
  const isOrg = providerType === "organization";
  const wizardTotal = isOrg ? 6 : 5;
  const wizardCurrentMap: Record<string, number> = isOrg
    ? { "1": 1, search: 2, verify: 2, "2": 3, "3": 4, "4": 5, "5": 6 }
    : { "1": 1, "2": 2, "3": 3, "4": 4, "5": 5 };
  const wizardCurrentStep = wizardCurrentMap[String(step)] ?? 1;
  const showWizardNav = step !== "resume" && step !== "success";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showResultsBg = step === "search" && hasSearched;
  const isResultsGrid = showResultsBg && searchResults.length > 0;
  const totalPages = Math.ceil(searchResults.length / RESULTS_PER_PAGE);
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * RESULTS_PER_PAGE,
    currentPage * RESULTS_PER_PAGE
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${showResultsBg ? "bg-vanilla-100" : "bg-white"}`}>
      {/* Minimal nav — sticky */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
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
            Save & exit
          </Link>
        </div>
      </nav>

      <div key={String(step)} className={`flex-1 animate-wizard-in ${isResultsGrid ? "" : showResultsBg ? "px-4 py-12" : "px-4 flex items-center justify-center py-16"}`}>

        {/* ── Resume screen ── */}
        {step === "resume" && (
          <div className="w-full max-w-lg">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
                Welcome back, {displayName}
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                Pick up where you left off.
              </p>
            </div>

            <div className="space-y-3">
              {/* Continue card — primary action */}
              <button
                type="button"
                onClick={handleResume}
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
          <div className="w-full max-w-2xl pb-24">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
                How would you describe yourself?
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Organization */}
              <button
                type="button"
                onClick={() => handleSelectType("organization")}
                className={`group flex flex-col items-center text-center p-10 rounded-2xl border-2 transition-all duration-200 cursor-pointer bg-white ${
                  providerType === "organization"
                    ? "border-primary-500 ring-2 ring-primary-100 shadow-md"
                    : "border-gray-200 hover:border-primary-400 hover:shadow-md"
                }`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-200 ${
                  providerType === "organization" ? "bg-primary-100" : "bg-primary-50 group-hover:bg-primary-100"
                }`}>
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
                className={`group flex flex-col items-center text-center p-10 rounded-2xl border-2 transition-all duration-200 cursor-pointer bg-white ${
                  providerType === "caregiver"
                    ? "border-primary-500 ring-2 ring-primary-100 shadow-md"
                    : "border-gray-200 hover:border-primary-400 hover:shadow-md"
                }`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-200 ${
                  providerType === "caregiver" ? "bg-primary-100" : "bg-primary-50 group-hover:bg-primary-100"
                }`}>
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
              <div className="w-full max-w-xl mx-auto pb-24">
                <div className="text-center mb-14">
                  <h1 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 tracking-tight">
                    Find your organization
                  </h1>
                  <p className="text-gray-500 mt-6 text-xl leading-relaxed">
                    Let&apos;s check if we already have a listing for you.
                  </p>
                </div>

                {/* Single search bar with location dropdown on focus */}
                <form onSubmit={handleSearch}>
                  <div ref={locationDropdownRef} className="relative">
                    <div className="flex items-center rounded-2xl shadow-sm ring-1 ring-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:shadow-md transition-all">
                      <div className="pl-5 flex items-center pointer-events-none shrink-0">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        aria-label="Search by name or location"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowLocationDropdown(true);
                        }}
                        onFocus={() => {
                          preloadCities();
                          setShowLocationDropdown(true);
                        }}
                        placeholder="Search by name or location…"
                        className="w-full px-4 text-lg bg-transparent border-none outline-none placeholder-gray-400"
                        style={{ paddingTop: '20px', paddingBottom: '20px' }}
                      />
                      <div className="pr-3 shrink-0">
                        <button
                          type="submit"
                          disabled={searching || !searchQuery.trim()}
                          className="px-7 py-3.5 text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {searching ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Search"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Location suggestions dropdown */}
                    {showLocationDropdown && cityResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                        {!searchQuery.trim() && (
                          <div className="px-4 pt-1 pb-2">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Popular cities</span>
                          </div>
                        )}
                        {cityResults.map((loc) => (
                          <button
                            key={loc.full}
                            type="button"
                            onClick={() => {
                              setSearchQuery(loc.full);
                              setShowLocationDropdown(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left text-base hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium text-gray-700">{loc.full}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {searchError && (
                    <p className="text-base text-red-600 mt-3">{searchError}</p>
                  )}
                </form>

                <p className="text-center mt-4 text-[15px] text-gray-400">
                  or{" "}
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    create a new account
                  </button>
                </p>

              </div>
            )}

            {/* ── State B: Results found ── */}
            {hasSearched && searchResults.length > 0 && (
              <div className="w-full pb-24">
                {/* Sticky search bar */}
                <div className="sticky top-[65px] z-40 bg-vanilla-100/95 backdrop-blur-sm border-b border-gray-200/60 px-4">
                  <div className="max-w-2xl mx-auto py-4">
                    <form onSubmit={handleSearch}>
                      <div ref={locationDropdownRef} className="relative">
                        <div className="flex items-center rounded-xl bg-white ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-primary-500 transition-all shadow-sm">
                          <div className="pl-4 flex items-center pointer-events-none shrink-0">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            aria-label="Search by name or location"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowLocationDropdown(true);
                            }}
                            onFocus={() => {
                              preloadCities();
                              setShowLocationDropdown(true);
                            }}
                            placeholder="Search by name or location…"
                            className="flex-1 px-3 py-3 text-base bg-transparent border-none outline-none placeholder-gray-400"
                          />
                          <div className="pr-1.5 shrink-0">
                            <button
                              type="submit"
                              disabled={searching || !searchQuery.trim()}
                              className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                              {searching ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                "Search"
                              )}
                            </button>
                          </div>
                        </div>
                        {/* Location suggestions dropdown */}
                        {showLocationDropdown && cityResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                            {!searchQuery.trim() && (
                              <div className="px-4 pt-1 pb-2">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Popular cities</span>
                              </div>
                            )}
                            {cityResults.map((loc) => (
                              <button
                                key={loc.full}
                                type="button"
                                onClick={() => {
                                  setSearchQuery(loc.full);
                                  setShowLocationDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-base hover:bg-gray-50 transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">{loc.full}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </form>
                    <div className="mt-3">
                      <p className="text-sm text-gray-500">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results grid */}
                <div className="max-w-2xl mx-auto px-4 pt-8 pb-12">
                  <div className="space-y-4">
                    {paginatedResults.map((provider) => {
                      const image = getProviderImage(provider);
                      const address = formatAddress(provider);
                      const highlights = getProviderHighlights(provider);
                      const isClaimed = claimedIds.has(provider.provider_id);
                      const isDisputing = disputingId === provider.provider_id;
                      const isDisputeSuccess = disputeSuccess === provider.provider_id;

                      return (
                        <div
                          key={provider.provider_id}
                          className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                        >
                          <div className="flex">
                            {/* Image */}
                            <div className="w-40 min-h-[160px] shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative">
                              {image ? (
                                <img
                                  src={image}
                                  alt={provider.provider_name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                    <span className="text-lg font-bold text-primary-400">
                                      {(provider.provider_name || "")
                                        .split(/\s+/)
                                        .map((w) => w[0])
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-5 min-w-0">
                              {address && (
                                <p className="text-sm text-gray-500 mb-1 tracking-wide">{address}</p>
                              )}
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-1">
                                  {provider.provider_name}
                                </h3>
                                {isClaimed && (
                                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 ring-1 ring-gray-200">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Claimed
                                  </span>
                                )}
                              </div>

                              {/* Checkmark highlights */}
                              {highlights.length > 0 && (
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
                                  {highlights.slice(0, 3).map((h) => (
                                    <span key={h} className="flex items-center gap-1 text-sm text-gray-600">
                                      <svg className="w-3 h-3 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                      {h}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Action — unclaimed */}
                              {!isClaimed && (
                                <div className="flex justify-end mt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setClaimingProvider(provider);
                                      try {
                                        localStorage.setItem(CLAIM_KEY, JSON.stringify({
                                          provider_id: provider.provider_id,
                                          provider_name: provider.provider_name,
                                        }));
                                      } catch { /* localStorage unavailable */ }
                                      setStep("verify");
                                      handleSendVerificationCode(provider);
                                    }}
                                    className="px-5 py-2.5 text-base font-semibold text-primary-600 rounded-xl ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50 transition-all"
                                  >
                                    Claim this page &rarr;
                                  </button>
                                </div>
                              )}

                              {/* Action — claimed (dispute) */}
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
                                        className="text-base font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                      >
                                        Dispute ownership
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="mt-3 pt-4 border-t border-gray-100 space-y-3">
                                      <p className="text-base font-semibold text-gray-700">Tell us about your claim</p>
                                      <input
                                        type="text"
                                        value={disputeName}
                                        onChange={(e) => setDisputeName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full px-4 py-3 text-base rounded-xl ring-1 ring-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400 transition-all"
                                      />
                                      <input
                                        type="text"
                                        value={disputeRole}
                                        onChange={(e) => setDisputeRole(e.target.value)}
                                        placeholder="Your role (e.g. Owner, Administrator)"
                                        className="w-full px-4 py-3 text-base rounded-xl ring-1 ring-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400 transition-all"
                                      />
                                      <textarea
                                        value={disputeReason}
                                        onChange={(e) => setDisputeReason(e.target.value)}
                                        placeholder="Why do you believe you are the owner of this listing?"
                                        rows={3}
                                        className="w-full px-4 py-3 text-base rounded-xl ring-1 ring-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-400 resize-none transition-all"
                                      />
                                      {disputeError && (
                                        <p className="text-sm text-red-600">{disputeError}</p>
                                      )}
                                      <div className="flex items-center justify-between gap-3">
                                        <button
                                          type="button"
                                          onClick={() => setDisputingId(null)}
                                          className="text-base text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDisputeSubmit(provider)}
                                          disabled={disputeSubmitting || !disputeName.trim() || !disputeRole.trim() || !disputeReason.trim()}
                                          className="px-5 py-2.5 text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                                <div className="mt-3 pt-4 border-t border-gray-100 flex items-start gap-2.5">
                                  <div className="w-5 h-5 rounded-full bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                  <p className="text-base text-gray-500 leading-relaxed">
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

                  {/* CTA: Don't see your organization? */}
                  <div className="mt-10 mb-8 text-center py-8 bg-white rounded-xl border border-gray-200">
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      Don&apos;t see your organization?
                    </p>
                    <p className="text-base text-gray-500 mb-5">
                      Create a new listing from scratch
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-7 py-3 text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 transition-all shadow-sm"
                    >
                      Set up a new page
                    </button>
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={searchResults.length}
                    itemsPerPage={RESULTS_PER_PAGE}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    itemLabel="listings"
                    showItemCount={false}
                    className="justify-center"
                  />
                </div>
              </div>
            )}

            {/* ── State C: No results ── */}
            {hasSearched && searchResults.length === 0 && (
              <div className="w-full max-w-xl mx-auto text-center pb-24">
                <div className="w-16 h-16 rounded-full bg-vanilla-100 ring-1 ring-gray-200 flex items-center justify-center mx-auto mb-8">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <h2 className="text-4xl sm:text-5xl font-display font-bold text-gray-900 tracking-tight mb-4">
                  No matches found
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed mb-6">
                  We couldn&apos;t find any listings for &ldquo;{searchQuery}&rdquo;
                </p>

                <button
                  type="button"
                  onClick={() => setHasSearched(false)}
                  className="text-[15px] font-medium text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors"
                >
                  Try a different search
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Verify step: Email verification for claiming ── */}
        {step === "verify" && claimingProvider && (
          <div className="w-full max-w-lg pb-24">
            {noAccessSuccess ? (
              /* ── Success state after no-access form submission ── */
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-8">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
                  Request submitted
                </h1>
                <p className="text-gray-500 text-lg leading-relaxed max-w-sm mx-auto">
                  We&apos;ve received your request to claim <strong className="text-gray-700">{claimingProvider.provider_name}</strong>.
                  Our team will review it and get back to you within 2–3 business days.
                </p>
              </div>
            ) : (
              /* ── Verification form ── */
              <div>
                {/* Header — icon + title + subtitle */}
                <div className="text-center mb-10">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
                    Verify your organization
                  </h1>
                  {verifySending ? (
                    <p className="text-gray-500 mt-4 text-lg leading-relaxed">Sending verification code…</p>
                  ) : verifyNoEmail ? (
                    <p className="text-gray-500 mt-4 text-lg leading-relaxed">
                      We don&apos;t have an email on file for <strong className="text-gray-600">{claimingProvider.provider_name}</strong>.
                      <br />Please submit a request below.
                    </p>
                  ) : verifyEmailHint ? (
                    <p className="text-gray-500 mt-4 text-lg leading-relaxed">
                      We sent a 6-digit code to <strong className="text-gray-600">{verifyEmailHint}</strong>.
                      <br />Enter it below to verify you represent {claimingProvider.provider_name}.
                    </p>
                  ) : verifyError ? (
                    <p className="text-gray-500 mt-4 text-lg leading-relaxed">
                      There was an issue sending the code. Please try again.
                    </p>
                  ) : null}
                </div>

                {/* Code input — only show when email was sent */}
                {!verifyNoEmail && verifyEmailHint && (
                  <div className="space-y-6">
                    {/* OTP input with accessible label */}
                    <fieldset>
                      <legend className="sr-only">Enter your 6-digit verification code</legend>
                      <OtpInput
                        length={6}
                        value={verifyCode}
                        onChange={setVerifyCode}
                        disabled={verifyChecking}
                        error={!!verifyError}
                      />
                    </fieldset>

                    {verifyError && (
                      <p className="text-base text-red-600 text-center" role="alert">{verifyError}</p>
                    )}

                    {/* Resend */}
                    <div className="text-center">
                      {verifyResendCooldown > 0 ? (
                        <p className="text-sm text-gray-500">Resend code in {verifyResendCooldown}s</p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendVerificationCode(claimingProvider)}
                          disabled={verifySending}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                        >
                          Resend code
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Error state — code sending failed (not no-email) */}
                {!verifyNoEmail && !verifyEmailHint && verifyError && !verifySending && (
                  <div className="text-center space-y-4">
                    <p className="text-base text-red-600" role="alert">{verifyError}</p>
                    <button
                      type="button"
                      onClick={() => handleSendVerificationCode(claimingProvider)}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {/* Divider */}
                <div className="my-8 border-t border-gray-200" />

                {/* No access to email */}
                {!showNoAccess ? (
                  <button
                    type="button"
                    onClick={() => setShowNoAccess(true)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                        No access to this email?
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Request a manual review instead
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div className="space-y-5">
                    <div className="mb-1">
                      <h2 className="text-lg font-semibold text-gray-900">Request manual review</h2>
                      <p className="text-base text-gray-500 mt-1">
                        Tell us a bit about yourself so we can verify your access.
                      </p>
                    </div>

                    <Input
                      label="Full name"
                      value={noAccessName}
                      onChange={(e) => setNoAccessName((e.target as HTMLInputElement).value)}
                      placeholder="e.g. Jane Smith"
                      required
                    />

                    <div className="space-y-1.5">
                      <label htmlFor="no-access-role" className="block text-base font-medium text-gray-700">
                        Your role
                      </label>
                      <div className="relative">
                        <select
                          id="no-access-role"
                          value={noAccessReason}
                          onChange={(e) => setNoAccessReason(e.target.value)}
                          className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                        >
                          <option value="">Select your role…</option>
                          <option value="Owner">Owner</option>
                          <option value="Administrator">Administrator</option>
                          <option value="Executive Director">Executive Director</option>
                          <option value="Office Manager">Office Manager</option>
                          <option value="Marketing / Communications">Marketing / Communications</option>
                          <option value="Staff Member">Staff Member</option>
                          <option value="Other">Other</option>
                        </select>
                        <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    <Input
                      label="Organization email"
                      type="email"
                      value={noAccessEmail}
                      onChange={(e) => setNoAccessEmail((e.target as HTMLInputElement).value)}
                      placeholder="contact@yourorganization.com"
                      required
                    />

                    <Input
                      label="Anything else we should know?"
                      as="textarea"
                      value={noAccessNotes}
                      onChange={(e) => setNoAccessNotes((e.target as HTMLTextAreaElement).value)}
                      placeholder="Optional — add any additional context"
                      rows={2}
                    />

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNoAccess(false)}
                        className="text-[15px] font-medium text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors"
                      >
                        Cancel
                      </button>
                      <Button
                        onClick={handleNoAccessSubmit}
                        disabled={!noAccessName.trim() || !noAccessReason || !noAccessEmail.trim()}
                        loading={noAccessSubmitting}
                      >
                        Submit request
                      </Button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* ── Step 2: About ── */}
        {step === 2 && (
          <div className="w-full max-w-lg pb-24">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
                {providerType === "organization"
                  ? "Tell us about your organization"
                  : "What\u2019s your name?"}
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                {providerType === "organization"
                  ? "This is what families will see on your public profile."
                  : "This is how families will find you on Olera."}
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

              {providerType === "organization" && (
                <div className="space-y-1.5">
                  <label htmlFor="org-type" className="block text-base font-medium text-gray-700">
                    Organization type
                  </label>
                  <div className="relative">
                    <select
                      id="org-type"
                      value={data.category}
                      onChange={(e) => update("category", e.target.value)}
                      className="w-full appearance-none px-4 py-3 pr-10 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                    >
                      <option value="">Select a type</option>
                      {ORG_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── Step 3: Location ── */}
        {step === 3 && (
          <div className="w-full max-w-lg pb-24">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
                Where are you located?
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                Families search by location — this helps them find you.
              </p>
            </div>

            <div className="space-y-5">
              {/* City search picker */}
              <div className="space-y-1.5">
                <label htmlFor="city-picker" className="block text-base font-medium text-gray-700">
                  City
                </label>
                <div ref={cityPickerRef} className="relative">
                  <input
                    id="city-picker"
                    type="text"
                    role="combobox"
                    aria-expanded={showCityPicker && cityPickerResults.length > 0}
                    aria-autocomplete="list"
                    aria-controls="city-picker-listbox"
                    value={cityQuery || (data.city ? `${data.city}${data.state ? `, ${data.state}` : ""}` : "")}
                    onChange={(e) => {
                      setCityQuery(e.target.value);
                      setShowCityPicker(true);
                      // Clear selected city when user types
                      if (data.city) {
                        update("city", "");
                        update("state", "");
                      }
                    }}
                    onFocus={() => {
                      preloadCityPicker();
                      setShowCityPicker(true);
                      // If showing a selected city, put it into query for editing
                      if (data.city && !cityQuery) {
                        setCityQuery(`${data.city}${data.state ? `, ${data.state}` : ""}`);
                      }
                    }}
                    placeholder="Search for a city…"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] placeholder:text-gray-400"
                    autoComplete="off"
                  />

                  {/* City suggestions dropdown */}
                  {showCityPicker && cityPickerResults.length > 0 && (
                    <div id="city-picker-listbox" role="listbox" aria-label="City suggestions" className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                      {!cityQuery.trim() && (
                        <div className="px-4 pt-1 pb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Popular cities</span>
                        </div>
                      )}
                      {cityPickerResults.map((loc) => (
                        <button
                          key={loc.full}
                          type="button"
                          role="option"
                          aria-selected={data.city === loc.city && data.state === loc.state}
                          onClick={() => {
                            update("city", loc.city);
                            update("state", loc.state);
                            setCityQuery("");
                            setShowCityPicker(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-base hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium text-gray-700">{loc.full}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Input
                label="ZIP code (Optional)"
                value={data.zip}
                onChange={(e) =>
                  update("zip", (e.target as HTMLInputElement).value)
                }
                placeholder="e.g. 94102"
              />
            </div>
          </div>
        )}

        {/* ── Step 4: Contact ── */}
        {step === 4 && (
          <div className="w-full max-w-lg pb-24">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
                How can families reach you?
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                Give families a way to connect with you.
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Phone"
                type="tel"
                value={data.phone}
                onChange={(e) =>
                  update("phone", (e.target as HTMLInputElement).value)
                }
                placeholder="(555) 123-4567"
                required
              />

              <Input
                label="Email"
                type="email"
                value={data.email}
                onChange={(e) =>
                  update("email", (e.target as HTMLInputElement).value)
                }
                placeholder="contact@example.com"
                required
              />

              <Input
                label="Website (Optional)"
                type="url"
                value={data.website}
                onChange={(e) =>
                  update("website", (e.target as HTMLInputElement).value)
                }
                placeholder="https://example.com"
              />
            </div>
          </div>
        )}

        {/* ── Step 5: Services + Review + Submit ── */}
        {step === 5 && (
          <div className="w-full max-w-lg pb-24">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
                Services offered
              </h1>
              <p className="text-gray-500 mt-3 text-base">
                Select the care types you provide. You can always update these later.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-10">
              {CARE_TYPES.map((ct) => {
                const selected = data.careTypes.includes(ct);
                return (
                  <button
                    key={ct}
                    type="button"
                    role="switch"
                    aria-checked={selected}
                    onClick={() => toggleCareType(ct)}
                    className={[
                      "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[15px] font-medium border transition-all duration-200",
                      selected
                        ? "bg-primary-50 border-primary-500 text-primary-700"
                        : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
                    ].join(" ")}
                  >
                    {selected && (
                      <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {ct}
                  </button>
                );
              })}
            </div>

            {/* Mini listing card preview */}
            <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
              {/* Gradient header with initials */}
              <div className="h-28 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <span className="text-xl font-bold text-primary-500">
                    {(data.displayName || "")
                      .split(/\s+/)
                      .map((w) => w[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "?"}
                  </span>
                </div>
              </div>

              {/* Card content */}
              <div className="p-5">
                {/* Category label */}
                {providerType === "organization" && data.category && (
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
                    {ORG_CATEGORIES.find((c) => c.value === data.category)?.label || data.category}
                  </p>
                )}
                {providerType === "caregiver" && (
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
                    Private Caregiver
                  </p>
                )}

                {/* Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {data.displayName || "Your listing"}
                </h3>

                {/* Location */}
                {(data.city || data.state) && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {[data.city, data.state].filter(Boolean).join(", ")}
                  </div>
                )}

                {/* Service tags */}
                {data.careTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {data.careTypes.slice(0, 3).map((ct) => (
                      <span key={ct} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full">
                        {ct}
                      </span>
                    ))}
                    {data.careTypes.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                        +{data.careTypes.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Contact line */}
                {(data.phone || data.email) && (
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    {data.phone && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {data.phone}
                      </span>
                    )}
                    {data.email && (
                      <span className="flex items-center gap-1 min-w-0">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{data.email}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {submitError && (
              <div
                className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mt-5"
                role="alert"
              >
                {submitError}
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-5">
              You can add more details — photos, certifications, pricing — after setup.
            </p>
          </div>
        )}

        {/* ── Success screen ── */}
        {step === "success" && (
          <div className="w-full max-w-lg">
            {/* Animated checkmark */}
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center animate-success-pop">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight">
                {isAdding ? "New profile created!" : "You\u0027re all set up!"}
              </h1>
              <p className="text-gray-500 mt-3 text-base leading-relaxed max-w-sm mx-auto">
                {isAdding
                  ? "Your new listing has been created. Switch to it from the profile menu to start filling in details."
                  : "You\u0027ve taken the first step. A few more details and families will be able to find you."}
              </p>
            </div>

            {/* Mini listing card — same as Step 5 preview */}
            <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
              <div className="h-28 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                  <span className="text-xl font-bold text-primary-500">
                    {(data.displayName || "")
                      .split(/\s+/)
                      .map((w) => w[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || "?"}
                  </span>
                </div>
              </div>
              <div className="p-5">
                {providerType === "organization" && data.category && (
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
                    {ORG_CATEGORIES.find((c) => c.value === data.category)?.label || data.category}
                  </p>
                )}
                {providerType === "caregiver" && (
                  <p className="text-xs font-medium text-primary-600 uppercase tracking-wide mb-1">
                    Private Caregiver
                  </p>
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {data.displayName || "Your listing"}
                </h3>
                {(data.city || data.state) && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {[data.city, data.state].filter(Boolean).join(", ")}
                  </div>
                )}
                {data.careTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {data.careTypes.slice(0, 3).map((ct) => (
                      <span key={ct} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full">
                        {ct}
                      </span>
                    ))}
                    {data.careTypes.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                        +{data.careTypes.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                {(data.phone || data.email) && (
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    {data.phone && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {data.phone}
                      </span>
                    )}
                    {data.email && (
                      <span className="flex items-center gap-1 min-w-0">
                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{data.email}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick-action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <Link
                href="/provider#gallery"
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
                  <svg className="w-4.5 h-4.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">Add photos</p>
                <p className="text-xs text-gray-500">Listings with photos get more views</p>
                <div className="mt-2">
                  <span className="text-xs font-medium text-primary-600 group-hover:translate-x-0.5 inline-block transition-transform">Complete →</span>
                </div>
              </Link>

              <Link
                href="/provider/verification"
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                  <svg className="w-4.5 h-4.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">Get verified</p>
                <p className="text-xs text-gray-500">Build trust with families</p>
                <div className="mt-2">
                  <span className="text-xs font-medium text-primary-600 group-hover:translate-x-0.5 inline-block transition-transform">Complete →</span>
                </div>
              </Link>

              <Link
                href="/provider/reviews"
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-200 hover:shadow-sm transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                  <svg className="w-4.5 h-4.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-0.5">Collect reviews</p>
                <p className="text-xs text-gray-500">Share your link to get feedback</p>
                <div className="mt-2">
                  <span className="text-xs font-medium text-primary-600 group-hover:translate-x-0.5 inline-block transition-transform">Complete →</span>
                </div>
              </Link>
            </div>

            {/* Dashboard link */}
            <div className="text-center mt-8">
              <Link
                href="/provider"
                className="text-[15px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Go to your dashboard →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom wizard nav — all steps except resume */}
      {showWizardNav && (
        <WizardNav
          currentStep={wizardCurrentStep}
          totalSteps={wizardTotal}
          onBack={
            step === 1
              ? undefined
              : step === "search"
              ? () => setStep(1)
              : step === "verify"
              ? () => {
                  setStep("search");
                  setVerifyCode("");
                  setVerifyError("");
                  setVerifyEmailHint("");
                  setVerifyNoEmail(false);
                  setShowNoAccess(false);
                  setNoAccessSuccess(false);
                }
              : step === 2
              ? () => setStep(isOrg ? "search" : 1)
              : step === 3
              ? () => setStep(2)
              : step === 4
              ? () => setStep(3)
              : step === 5
              ? () => setStep(4)
              : undefined
          }
          onNext={
            step === 1
              ? handleStep1Next
              : step === "search"
              ? () => setStep(2)
              : step === "verify"
              ? handleVerifyCode
              : step === 5
              ? handleSubmit
              : step === 2
              ? () => setStep(3)
              : step === 3
              ? () => setStep(4)
              : () => setStep(5)
          }
          nextLabel={
            step === 1
              ? "Next"
              : step === "search"
              ? "Create new listing"
              : step === "verify"
              ? "Verify"
              : step === 5
              ? "Create profile"
              : "Next"
          }
          nextDisabled={
            step === 1
              ? !providerType
              : step === "verify"
              ? verifyCode.length !== 6 || verifyChecking
              : step === 2
              ? !data.displayName.trim()
              : step === 3
              ? !data.city.trim()
              : step === 4
              ? !data.phone.trim() || !data.email.trim()
              : step === 5
              ? !data.displayName.trim() || submitting
              : false
          }
          nextLoading={
            step === "verify" ? verifyChecking : step === 5 ? submitting : false
          }
        />
      )}
    </div>
  );
}
