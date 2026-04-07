"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCitySearch } from "@/hooks/use-city-search";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Pagination from "@/components/ui/Pagination";
import OtpInput from "@/components/auth/OtpInput";
import VerificationFormModal from "@/components/provider/VerificationFormModal";
import type { VerificationSubmission } from "@/components/provider/VerificationFormModal";
import type { Provider } from "@/lib/types/provider";

type Step = "search" | "verify" | "create" | "potential-matches" | "auth";

// Track what action to perform after successful authentication
type PendingAuthAction =
  | { type: "create-profile" }
  | { type: "claim-listing"; provider: Provider }
  | { type: "sign-in"; redirectTo?: string }
  | { type: "manage-claimed"; profile: BusinessProfileMatch };

const RESULTS_PER_PAGE = 6;

// Business profile match (from business_profiles table - already claimed/created profiles)
interface BusinessProfileMatch {
  id: string;
  display_name: string;
  email: string | null;
  city: string | null;
  state: string | null;
  slug: string;
  image_url: string | null;
  account_id: string;
  source_provider_id: string | null;
  claim_state: string | null;
}

const CARE_TYPES = [
  "Assisted Living",
  "Memory Care",
  "Independent Living",
  "Skilled Nursing",
  "Home Care",
  "Home Health",
  "Hospice",
];

interface WizardData {
  displayName: string;
  email: string;
  city: string;
  state: string;
  careTypes: string[];
}

const EMPTY: WizardData = {
  displayName: "",
  email: "",
  city: "",
  state: "",
  careTypes: [],
};

// Key for persisting form data through auth redirect
const CREATE_FORM_STORAGE_KEY = "olera_provider_create_form";

function getProviderImage(provider: Provider): string | null {
  if (!provider.provider_images) return null;
  const first = provider.provider_images.split("|")[0].trim();
  return first || null;
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
  // Support skipping to search step (from MedJobs hire flow)
  const initialStep = searchParams.get("step");
  const rawNextUrl = searchParams.get("next");
  // Validate nextUrl to prevent open redirect - only allow known safe paths
  const nextUrl = (
    rawNextUrl?.startsWith("/provider/medjobs/candidates/") ||
    rawNextUrl?.startsWith("/medjobs/candidates/")
  ) ? rawNextUrl : null;
  // URL-based search state (for back button preservation)
  const urlSearchQuery = searchParams.get("q") || "";
  const urlLocationQuery = searchParams.get("loc") || "";
  const urlSearched = searchParams.get("searched") === "true";
  const { user, account, profiles, isLoading, refreshAccountData, switchProfile } = useAuth();
  const [step, setStep] = useState<Step>("search");
  const [data, setData] = useState<WizardData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Search state - initialize from URL params for back button support
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  // Potential matches for duplicate detection
  const [potentialMatches, setPotentialMatches] = useState<Provider[]>([]);
  const [businessProfileMatches, setBusinessProfileMatches] = useState<BusinessProfileMatch[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [showAllMatches, setShowAllMatches] = useState(false);

  // Verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [pendingProfileName, setPendingProfileName] = useState<string>("");

  // Location input state (separate from name search) - initialize from URL params
  const [locationQuery, setLocationQuery] = useState(urlLocationQuery);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationQuery);

  // Step 3 city picker state
  const [cityQuery, setCityQuery] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const { results: cityPickerResults, preload: preloadCityPicker } = useCitySearch(cityQuery);

  // Close dropdowns on outside click (blur-before-close prevents scroll-to-footer)
  useClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));
  useClickOutside(cityPickerRef, () => setShowCityPicker(false));

  // Claim verification state
  const [claimingProvider, setClaimingProvider] = useState<Provider | null>(null);
  const [claimSession] = useState(() => crypto.randomUUID());
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

  // Inline auth state (replaces openAuth modal)
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authSending, setAuthSending] = useState(false);
  const [authVerifying, setAuthVerifying] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [authResendCooldown, setAuthResendCooldown] = useState(0);
  const [finalizingProfile, setFinalizingProfile] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<PendingAuthAction | null>(null);
  const [previousStep, setPreviousStep] = useState<Step>("search");

  // Redirect if user already has a provider profile (unless adding another)
  useEffect(() => {
    if (isLoading) return;

    if (user) {
      const hasProviderProfile = (profiles || []).some(
        (p) => p.type === "organization" || p.type === "caregiver"
      );
      if (hasProviderProfile && !isAdding) {
        if (nextUrl) {
          router.replace(nextUrl);
        } else {
          router.replace("/provider");
        }
      }
    }
  }, [user, profiles, isLoading, isAdding, nextUrl, router]);

  // Restore form data after auth redirect (user just completed OTP and came back)
  const formRestored = useRef(false);
  const pendingAutoSubmit = useRef(false);
  useEffect(() => {
    if (formRestored.current) return;

    try {
      const raw = sessionStorage.getItem(CREATE_FORM_STORAGE_KEY);
      if (!raw) return;

      // Only restore if user is now logged in (just completed auth)
      if (!user) return;

      sessionStorage.removeItem(CREATE_FORM_STORAGE_KEY);
      formRestored.current = true;

      const saved = JSON.parse(raw) as WizardData;
      setData(saved);
      setStep("create");

      // Flag for auto-submit — will be picked up by the next effect
      pendingAutoSubmit.current = true;
    } catch {
      // sessionStorage unavailable or corrupt — ignore
    }
  }, [user]);

  // Auto-submit after form data is restored (runs after state updates)
  // Skip duplicate check since user already went through it before auth
  useEffect(() => {
    if (pendingAutoSubmit.current && step === "create" && data.displayName && user) {
      pendingAutoSubmit.current = false;
      handleSubmit(true); // Skip duplicate check
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data, user]);

  // Restore search from URL params (for back button support)
  // This runs when user navigates back from the claim/onboard page
  const urlRestoreApplied = useRef(false);
  useEffect(() => {
    if (urlRestoreApplied.current) return;
    if (!urlSearched || (!urlSearchQuery && !urlLocationQuery)) return;

    urlRestoreApplied.current = true;

    // Execute search with URL params
    const doSearch = async () => {
      setSearching(true);
      setSearchError("");
      setCurrentPage(1);

      try {
        const supabase = createClient();

        // === Query 1: olera-providers (scraped listings) ===
        let providerQuery = supabase
          .from("olera-providers")
          .select("*")
          .not("deleted", "is", true);

        if (urlSearchQuery) {
          providerQuery = providerQuery.ilike("provider_name", `%${urlSearchQuery}%`);
        }
        if (urlLocationQuery) {
          const parts = urlLocationQuery.split(",").map((s: string) => s.trim());
          if (parts.length >= 2 && parts[1].length <= 3) {
            providerQuery = providerQuery.ilike("city", `%${parts[0]}%`);
            providerQuery = providerQuery.ilike("state", `%${parts[1]}%`);
          } else {
            providerQuery = providerQuery.or(`city.ilike.%${urlLocationQuery}%,state.ilike.%${urlLocationQuery}%`);
          }
        }

        // === Query 2: business_profiles (created from scratch) ===
        let bpQuery = supabase
          .from("business_profiles")
          .select("id, display_name, image_url, city, state, slug, account_id, source_provider_id")
          .is("source_provider_id", null);

        if (urlSearchQuery) {
          bpQuery = bpQuery.ilike("display_name", `%${urlSearchQuery}%`);
        }
        if (urlLocationQuery) {
          const parts = urlLocationQuery.split(",").map((s: string) => s.trim());
          if (parts.length >= 2 && parts[1].length <= 3) {
            bpQuery = bpQuery.ilike("city", `%${parts[0]}%`);
            bpQuery = bpQuery.ilike("state", `%${parts[1]}%`);
          } else {
            bpQuery = bpQuery.or(`city.ilike.%${urlLocationQuery}%,state.ilike.%${urlLocationQuery}%`);
          }
        }

        const [providerResult, bpResult] = await Promise.all([
          providerQuery.limit(20),
          bpQuery.limit(10),
        ]);

        if (providerResult.error) {
          setSearchError(`Search failed: ${providerResult.error.message}`);
          setSearchResults([]);
          return;
        }

        // Convert business_profiles to Provider-like shape
        const bpAsProviders: Provider[] = (bpResult.data || []).map((bp) => ({
          provider_id: `bp_${bp.id}`,
          provider_name: bp.display_name,
          provider_images: bp.image_url || "",
          city: bp.city,
          state: bp.state,
          slug: bp.slug,
          address: null,
          zipcode: null,
          provider_category: "Senior Care",
          main_category: null,
          provider_description: null,
          phone: null,
          email: null,
          website: null,
          lat: null,
          lon: null,
          lower_price: null,
          upper_price: null,
          deleted: false,
          _isBusinessProfile: true,
          _accountId: bp.account_id,
        } as Provider & { _isBusinessProfile?: boolean; _accountId?: string }));

        const allResults = [...bpAsProviders, ...(providerResult.data as Provider[] || [])];
        setSearchResults(allResults);

        // Check claimed status
        const oleraProviderIds = (providerResult.data || []).map((p: Provider) => p.provider_id);
        if (oleraProviderIds.length > 0) {
          const { data: claimed } = await supabase
            .from("business_profiles")
            .select("source_provider_id")
            .in("source_provider_id", oleraProviderIds)
            .in("claim_state", ["claimed", "pending"]);

          const claimedSet = new Set<string>(
            (claimed || [])
              .map((r: { source_provider_id: string | null }) => r.source_provider_id)
              .filter((id): id is string => !!id)
          );
          bpAsProviders.forEach((bp) => claimedSet.add(bp.provider_id));
          setClaimedIds(claimedSet);
        } else {
          const claimedSet = new Set<string>(bpAsProviders.map((bp) => bp.provider_id));
          setClaimedIds(claimedSet);
        }
      } catch {
        setSearchError("Search failed. Please try again.");
        setSearchResults([]);
      } finally {
        setHasSearched(true);
        setSearching(false);
      }
    };

    doSearch();
  }, [urlSearched, urlSearchQuery, urlLocationQuery]);

  // Read landing-page prefill from sessionStorage (set by /for-providers CTA buttons)
  // If prefill exists, auto-execute the search
  const prefillApplied = useRef(false);
  useEffect(() => {
    if (prefillApplied.current) return;

    try {
      const raw = sessionStorage.getItem("olera_provider_search_prefill");
      if (!raw) return;

      sessionStorage.removeItem("olera_provider_search_prefill");
      prefillApplied.current = true;

      const { searchQuery: sq, locationQuery: lq } = JSON.parse(raw);
      if (sq) setSearchQuery(sq);
      if (lq) setLocationQuery(lq);

      // Auto-execute search if we have prefill
      if (sq || lq) {
        setTimeout(() => {
          setSearching(true);
          setSearchError("");
          setCurrentPage(1);

          const doSearch = async () => {
            const name = sq || "";
            const loc = lq || "";

            try {
              const supabase = (await import("@/lib/supabase/client")).createClient();

              // === Query 1: olera-providers (scraped listings) ===
              let providerQuery = supabase
                .from("olera-providers")
                .select("*")
                .not("deleted", "is", true);

              if (name) {
                providerQuery = providerQuery.ilike("provider_name", `%${name}%`);
              }
              if (loc) {
                const parts = loc.split(",").map((s: string) => s.trim());
                if (parts.length >= 2 && parts[1].length <= 3) {
                  providerQuery = providerQuery.ilike("city", `%${parts[0]}%`);
                  providerQuery = providerQuery.ilike("state", `%${parts[1]}%`);
                } else {
                  providerQuery = providerQuery.or(`city.ilike.%${loc}%,state.ilike.%${loc}%`);
                }
              }

              // === Query 2: business_profiles (created from scratch) ===
              let bpQuery = supabase
                .from("business_profiles")
                .select("id, display_name, image_url, city, state, slug, account_id, source_provider_id")
                .is("source_provider_id", null);

              if (name) {
                bpQuery = bpQuery.ilike("display_name", `%${name}%`);
              }
              if (loc) {
                const parts = loc.split(",").map((s: string) => s.trim());
                if (parts.length >= 2 && parts[1].length <= 3) {
                  bpQuery = bpQuery.ilike("city", `%${parts[0]}%`);
                  bpQuery = bpQuery.ilike("state", `%${parts[1]}%`);
                } else {
                  bpQuery = bpQuery.or(`city.ilike.%${loc}%,state.ilike.%${loc}%`);
                }
              }

              // Run both queries in parallel
              const [providerResult, bpResult] = await Promise.all([
                providerQuery.limit(20),
                bpQuery.limit(10),
              ]);

              if (providerResult.error) {
                setSearchError(`Search failed: ${providerResult.error.message}`);
                setSearchResults([]);
                return;
              }

              // Convert business_profiles to Provider-like shape
              const bpAsProviders: Provider[] = (bpResult.data || []).map((bp) => ({
                provider_id: `bp_${bp.id}`,
                provider_name: bp.display_name,
                provider_images: bp.image_url || "",
                city: bp.city,
                state: bp.state,
                slug: bp.slug,
                address: null,
                zipcode: null,
                provider_category: "Senior Care",
                main_category: null,
                provider_description: null,
                phone: null,
                email: null,
                website: null,
                lat: null,
                lon: null,
                lower_price: null,
                upper_price: null,
                deleted: false,
                _isBusinessProfile: true,
                _accountId: bp.account_id,
              } as Provider & { _isBusinessProfile?: boolean; _accountId?: string }));

              // Merge results (business_profiles first, then olera-providers)
              const allResults = [...bpAsProviders, ...(providerResult.data as Provider[] || [])];
              setSearchResults(allResults);

              // Check which olera-providers have been claimed
              const oleraProviderIds = (providerResult.data || []).map((p: Provider) => p.provider_id);
              if (oleraProviderIds.length > 0) {
                const { data: claimed } = await supabase
                  .from("business_profiles")
                  .select("source_provider_id")
                  .in("source_provider_id", oleraProviderIds)
                  .in("claim_state", ["claimed", "pending"]);

                const claimedSet = new Set<string>(
                  (claimed || [])
                    .map((r: { source_provider_id: string | null }) => r.source_provider_id)
                    .filter((id): id is string => !!id)
                );
                // Also mark all business_profile results as claimed
                bpAsProviders.forEach((bp) => claimedSet.add(bp.provider_id));
                setClaimedIds(claimedSet);
              } else {
                // Just mark business_profiles as claimed
                const claimedSet = new Set<string>(bpAsProviders.map((bp) => bp.provider_id));
                setClaimedIds(claimedSet);
              }
            } catch {
              setSearchError("Search failed. Please try again.");
              setSearchResults([]);
            } finally {
              setHasSearched(true);
              setSearching(false);
            }
          };

          doSearch();
        }, 0);
      }
    } catch {
      // sessionStorage unavailable or corrupt
    }
  }, []);

  const update = (key: keyof WizardData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCareType = (ct: string) => {
    const next = data.careTypes.includes(ct)
      ? data.careTypes.filter((t) => t !== ct)
      : [...data.careTypes, ct];
    update("careTypes", next);
  };

  // Resend cooldown timer for claim verification
  useEffect(() => {
    if (verifyResendCooldown > 0) {
      const timer = setTimeout(() => setVerifyResendCooldown(verifyResendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [verifyResendCooldown]);

  // Resend cooldown timer for inline auth
  useEffect(() => {
    if (authResendCooldown > 0) {
      const timer = setTimeout(() => setAuthResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [authResendCooldown]);

  // Transition to inline auth step (replaces openAuth)
  const startInlineAuth = (action: PendingAuthAction, email?: string) => {
    setPendingAuthAction(action);
    setPreviousStep(step);
    setAuthEmail(email || data.email || "");
    setAuthCode("");
    setAuthError("");
    setAuthSent(false);
    setAuthSending(false);
    setAuthVerifying(false);
    setFinalizingProfile(false);
    setStep("auth");
  };

  // Send OTP for inline auth
  const handleAuthSendOtp = async () => {
    if (!authEmail || authResendCooldown > 0) return;

    setAuthSending(true);
    setAuthError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthSent(true);
        setAuthResendCooldown(60);
      }
    } catch {
      setAuthError("Failed to send code");
    } finally {
      setAuthSending(false);
    }
  };

  // Verify OTP and execute pending action
  const handleAuthVerifyOtp = async () => {
    if (!authEmail || authCode.length !== 6 || !pendingAuthAction) return;

    setAuthVerifying(true);
    setAuthError("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email: authEmail,
        token: authCode,
        type: "email",
      });

      if (error) {
        setAuthError(error.message);
        setAuthVerifying(false);
        return;
      }

      // Successfully authenticated - execute pending action
      setFinalizingProfile(true);

      switch (pendingAuthAction.type) {
        case "create-profile": {
          // Ensure account exists
          const ensureRes = await fetch("/api/auth/ensure-account", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ display_name: data.displayName }),
          });

          if (!ensureRes.ok) {
            const errorData = await ensureRes.json().catch(() => ({}));
            setAuthError(errorData.error || "Failed to set up account");
            setAuthVerifying(false);
            setFinalizingProfile(false);
            return;
          }

          // Create the profile
          const res = await fetch("/api/auth/create-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intent: "provider",
              providerType: "organization",
              displayName: data.displayName,
              orgName: data.displayName,
              city: data.city || undefined,
              state: data.state || undefined,
              email: data.email || undefined,
              careTypes: data.careTypes.length ? data.careTypes : undefined,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            setAuthError(errorData.error || "Failed to create profile");
            setAuthVerifying(false);
            setFinalizingProfile(false);
            return;
          }

          const result = await res.json();
          await refreshAccountData();

          // Check if verification is needed
          if (result.profile?.id && result.profile?.verification_state !== "verified") {
            setPendingProfileId(result.profile.id);
            setPendingProfileName(data.displayName);
            setShowVerificationModal(true);
            setFinalizingProfile(false);
            return;
          }

          // Redirect to dashboard
          if (nextUrl) {
            router.replace(nextUrl);
          } else {
            router.replace("/provider");
          }
          break;
        }

        case "claim-listing": {
          const provider = pendingAuthAction.provider;
          // Try to claim via deferred action
          try {
            const claimRes = await fetch("/api/claim/deferred", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                providerId: provider.provider_id,
              }),
            });

            if (claimRes.ok) {
              await refreshAccountData();
              if (nextUrl) {
                router.replace(nextUrl);
              } else {
                router.replace("/provider");
              }
            } else {
              // If deferred claim fails, go to verify step
              setClaimingProvider(provider);
              setStep("verify");
              await handleSendVerificationCode(provider);
            }
          } catch {
            // Fall back to verify step
            setClaimingProvider(provider);
            setStep("verify");
            await handleSendVerificationCode(provider);
          }
          break;
        }

        case "sign-in": {
          await refreshAccountData();
          if (pendingAuthAction.redirectTo) {
            router.replace(pendingAuthAction.redirectTo);
          } else if (nextUrl) {
            router.replace(nextUrl);
          } else {
            router.replace("/provider");
          }
          break;
        }

        case "manage-claimed": {
          await refreshAccountData();
          const profile = pendingAuthAction.profile;
          if (profile.source_provider_id) {
            router.push(`/provider/${profile.slug || profile.source_provider_id}/onboard?provider_id=${profile.source_provider_id}&state=already-claimed`);
          } else {
            router.push(`/contact?subject=${encodeURIComponent(`Ownership dispute: ${profile.display_name}`)}&profile_id=${profile.id}`);
          }
          break;
        }
      }
    } catch {
      setAuthError("Verification failed");
      setAuthVerifying(false);
      setFinalizingProfile(false);
    }
  };

  // Auto-send OTP when entering auth step with email pre-filled
  useEffect(() => {
    if (step === "auth" && authEmail && !authSent && !authSending) {
      handleAuthSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, authEmail]);

  const handleSendVerificationCode = async (provider: Provider) => {
    setVerifySending(true);
    setVerifyError("");
    setVerifyCode("");
    setVerifyNoEmail(false);
    try {
      const res = await fetch("/api/claim/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: provider.provider_id, claimSession }),
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
          claimSession,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.verified) {
        setVerifyError(result.error || "Incorrect code. Please try again.");
        return;
      }
      // Verified — redirect to provider dashboard
      await refreshAccountData();
      // If coming from MedJobs hire flow, return to the candidate page
      if (nextUrl) {
        router.replace(nextUrl);
      } else {
        router.replace("/provider");
      }
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
    const name = searchQuery.trim();
    const loc = locationQuery.trim();
    if (!name && !loc) return;
    if (!isSupabaseConfigured()) return;
    setSearching(true);
    setSearchError("");
    setShowLocationDropdown(false);
    setCurrentPage(1);

    // Update URL with search params for back button support
    const params = new URLSearchParams();
    if (name) params.set("q", name);
    if (loc) params.set("loc", loc);
    params.set("searched", "true");
    // Preserve existing params
    if (isAdding) params.set("adding", "true");
    if (nextUrl) params.set("next", nextUrl);
    router.replace(`/provider/onboarding?${params.toString()}`, { scroll: false });

    try {
      const supabase = createClient();

      // === Query 1: olera-providers (scraped listings) ===
      let providerQuery = supabase
        .from("olera-providers")
        .select("*")
        .not("deleted", "is", true);

      if (name) {
        providerQuery = providerQuery.ilike("provider_name", `%${name}%`);
      }
      if (loc) {
        const parts = loc.split(",").map((s: string) => s.trim());
        if (parts.length >= 2 && parts[1].length <= 3) {
          providerQuery = providerQuery.ilike("city", `%${parts[0]}%`);
          providerQuery = providerQuery.ilike("state", `%${parts[1]}%`);
        } else {
          providerQuery = providerQuery.or(`city.ilike.%${loc}%,state.ilike.%${loc}%`);
        }
      }

      // === Query 2: business_profiles (created from scratch, no source_provider_id) ===
      let bpQuery = supabase
        .from("business_profiles")
        .select("id, display_name, image_url, city, state, slug, account_id, source_provider_id")
        .is("source_provider_id", null); // Only profiles created from scratch

      if (name) {
        bpQuery = bpQuery.ilike("display_name", `%${name}%`);
      }
      if (loc) {
        const parts = loc.split(",").map((s: string) => s.trim());
        if (parts.length >= 2 && parts[1].length <= 3) {
          bpQuery = bpQuery.ilike("city", `%${parts[0]}%`);
          bpQuery = bpQuery.ilike("state", `%${parts[1]}%`);
        } else {
          bpQuery = bpQuery.or(`city.ilike.%${loc}%,state.ilike.%${loc}%`);
        }
      }

      // Run both queries in parallel
      const [providerResult, bpResult] = await Promise.all([
        providerQuery.limit(20),
        bpQuery.limit(10),
      ]);

      if (providerResult.error) {
        setSearchError(`Search failed: ${providerResult.error.message}`);
        setSearchResults([]);
        return;
      }

      // Convert business_profiles to Provider-like shape for unified display
      const bpAsProviders: Provider[] = (bpResult.data || []).map((bp) => ({
        provider_id: `bp_${bp.id}`, // Prefix to distinguish from olera-providers
        provider_name: bp.display_name,
        provider_images: bp.image_url || "",
        city: bp.city,
        state: bp.state,
        slug: bp.slug,
        address: null,
        zipcode: null,
        provider_category: "Senior Care",
        main_category: null,
        provider_description: null,
        phone: null,
        email: null,
        website: null,
        lat: null,
        lon: null,
        lower_price: null,
        upper_price: null,
        deleted: false,
        // Mark as claimed since it's already a business_profile
        _isBusinessProfile: true,
        _accountId: bp.account_id,
      } as Provider & { _isBusinessProfile?: boolean; _accountId?: string }));

      // Merge results (business_profiles first, then olera-providers)
      const allResults = [...bpAsProviders, ...(providerResult.data as Provider[] || [])];
      setSearchResults(allResults);

      // Check which olera-providers have been claimed
      const oleraProviderIds = (providerResult.data || []).map((p: Provider) => p.provider_id);
      if (oleraProviderIds.length > 0) {
        const { data: claimed } = await supabase
          .from("business_profiles")
          .select("source_provider_id")
          .in("source_provider_id", oleraProviderIds)
          .in("claim_state", ["claimed", "pending"]);

        const claimedSet = new Set<string>(
          (claimed || [])
            .map((r: { source_provider_id: string | null }) => r.source_provider_id)
            .filter((id): id is string => !!id)
        );
        // Also mark all business_profile results as claimed
        bpAsProviders.forEach((bp) => claimedSet.add(bp.provider_id));
        setClaimedIds(claimedSet);
      } else {
        // Just mark business_profiles as claimed
        const claimedSet = new Set<string>(bpAsProviders.map((bp) => bp.provider_id));
        setClaimedIds(claimedSet);
      }
    } catch {
      setSearchError("Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setHasSearched(true);
      setSearching(false);
    }
  };

  // Check for potential duplicate providers before creating
  // Returns both olera-providers matches and business_profiles matches
  const checkForDuplicates = async (): Promise<{
    providerMatches: Provider[];
    businessMatches: BusinessProfileMatch[];
  }> => {
    if (!isSupabaseConfigured()) return { providerMatches: [], businessMatches: [] };

    const supabase = createClient();
    const name = data.displayName.trim();
    const email = data.email.trim().toLowerCase();
    const city = data.city.trim();

    // Not enough info to check
    if (!email && !(name && city)) return { providerMatches: [], businessMatches: [] };

    const allProviderMatches: Provider[] = [];
    const allBusinessMatches: BusinessProfileMatch[] = [];

    // === Check olera-providers (scraped listings) ===

    // Query 1: Email match (if we have an email)
    if (email) {
      const { data: emailMatches } = await supabase
        .from("olera-providers")
        .select("*")
        .ilike("email", email)
        .not("deleted", "is", true)
        .limit(5);

      if (emailMatches) {
        allProviderMatches.push(...(emailMatches as Provider[]));
      }
    }

    // Query 2: Name + city match (if we have both)
    if (name && city) {
      const { data: nameCityMatches } = await supabase
        .from("olera-providers")
        .select("*")
        .ilike("provider_name", `%${name}%`)
        .ilike("city", `%${city}%`)
        .not("deleted", "is", true)
        .limit(5);

      if (nameCityMatches) {
        allProviderMatches.push(...(nameCityMatches as Provider[]));
      }
    }

    // === Check business_profiles (already created/claimed profiles) ===

    // Query 3: Email match in business_profiles
    if (email) {
      const { data: bpEmailMatches } = await supabase
        .from("business_profiles")
        .select("id, display_name, email, city, state, slug, image_url, account_id, source_provider_id, claim_state")
        .ilike("email", email)
        .limit(5);

      if (bpEmailMatches) {
        allBusinessMatches.push(...(bpEmailMatches as BusinessProfileMatch[]));
      }
    }

    // Query 4: Name + city match in business_profiles
    if (name && city) {
      const { data: bpNameCityMatches } = await supabase
        .from("business_profiles")
        .select("id, display_name, email, city, state, slug, image_url, account_id, source_provider_id, claim_state")
        .ilike("display_name", `%${name}%`)
        .ilike("city", `%${city}%`)
        .limit(5);

      if (bpNameCityMatches) {
        allBusinessMatches.push(...(bpNameCityMatches as BusinessProfileMatch[]));
      }
    }

    // Dedupe provider matches by provider_id
    const seenProviders = new Set<string>();
    const uniqueProviderMatches: Provider[] = [];
    for (const match of allProviderMatches) {
      if (!seenProviders.has(match.provider_id)) {
        seenProviders.add(match.provider_id);
        uniqueProviderMatches.push(match);
      }
    }

    // Dedupe business matches by id
    const seenBusiness = new Set<string>();
    const uniqueBusinessMatches: BusinessProfileMatch[] = [];
    for (const match of allBusinessMatches) {
      if (!seenBusiness.has(match.id)) {
        seenBusiness.add(match.id);
        uniqueBusinessMatches.push(match);
      }
    }

    return {
      providerMatches: uniqueProviderMatches.slice(0, 5),
      businessMatches: uniqueBusinessMatches.slice(0, 5),
    };
  };

  const handleSubmit = async (skipDuplicateCheck = false) => {
    if (!data.displayName.trim()) return;

    // Check for duplicates before proceeding (unless skipped)
    if (!skipDuplicateCheck) {
      setCheckingDuplicates(true);
      try {
        const { providerMatches, businessMatches } = await checkForDuplicates();

        // Check business_profiles first (already created/claimed profiles)
        if (businessMatches.length > 0) {
          // If user is logged in, check if any match belongs to them
          if (user && account?.id) {
            const ownProfile = businessMatches.find((bp) => bp.account_id === account.id);
            if (ownProfile && !isAdding) {
              // They already own this profile and aren't adding another - redirect to dashboard
              setCheckingDuplicates(false);
              router.replace("/provider");
              return;
            }
          }

          // Either logged out OR profile belongs to someone else
          // Show potential matches with verification flow
          setBusinessProfileMatches(businessMatches);
          setPotentialMatches(providerMatches);
          setStep("potential-matches");
          setCheckingDuplicates(false);
          return;
        }

        // Check olera-providers (unclaimed listings)
        if (providerMatches.length > 0) {
          setPotentialMatches(providerMatches);
          setBusinessProfileMatches([]);
          setStep("potential-matches");
          setCheckingDuplicates(false);
          return;
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
        // Continue anyway if check fails
      }
      setCheckingDuplicates(false);
    }

    // Auth check: if not logged in, use inline auth
    if (!user) {
      startInlineAuth({ type: "create-profile" }, data.email || undefined);
      return;
    }

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
          providerType: "organization",
          displayName: data.displayName,
          orgName: data.displayName,
          city: data.city || undefined,
          state: data.state || undefined,
          email: data.email || undefined,
          careTypes: data.careTypes,
          isAddingProfile: isAdding,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.error || "Failed to create profile. Please try again.");
        return;
      }

      const { profileId, verificationState } = result;

      // Clear any saved form data
      try {
        sessionStorage.removeItem(CREATE_FORM_STORAGE_KEY);
      } catch {
        // Ignore
      }

      await refreshAccountData();

      // When adding a new profile, switch to it before navigating
      if (isAdding && profileId) {
        switchProfile(profileId);
      }

      // If not auto-verified, show verification modal before redirecting
      if (verificationState === "unverified") {
        setPendingProfileId(profileId);
        setPendingProfileName(data.displayName);
        setShowVerificationModal(true);
        return;
      }

      // If coming from MedJobs hire flow, return to the candidate page
      if (nextUrl) {
        router.replace(nextUrl);
      } else {
        router.replace("/provider");
      }
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle verification form submission
  const handleVerificationSubmit = async (submission: VerificationSubmission) => {
    if (!pendingProfileId) return;

    const res = await fetch("/api/provider/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: pendingProfileId,
        submission,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to submit verification");
    }

    // Navigate to dashboard after successful submission
    if (nextUrl) {
      router.replace(nextUrl);
    } else {
      router.replace("/provider");
    }
  };

  // Handle verification dismissal (provisional access)
  const handleVerificationDismiss = () => {
    // Navigate to dashboard with provisional access (unverified)
    if (nextUrl) {
      router.replace(nextUrl);
    } else {
      router.replace("/provider");
    }
  };

  // Prevent flash: if logged-in user already has a provider profile and isn't adding another,
  // render nothing while the useEffect redirect fires.
  if (user) {
    const hasProviderProfile = (profiles || []).some(
      (p) => p.type === "organization" || p.type === "caregiver"
    );
    if (hasProviderProfile && !isAdding) {
      return null;
    }
  }

  const showResultsBg = (step === "search" && hasSearched) || step === "potential-matches";
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
            <Image src="/images/olera-logo.png" alt="Olera" width={32} height={32} className="object-contain" />
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

      <div key={String(step)} className={`flex-1 animate-wizard-in ${isResultsGrid ? "" : showResultsBg ? "px-4 py-12" : "px-4 flex items-center justify-center py-16"}`}>

        {/* ── Search step: Find your organization ── */}
        {step === "search" && (
          <>
            {/* ── State A: Initial search form ── */}
            {!hasSearched && (
              <div className="w-full max-w-xl mx-auto pb-24">
                <div className="text-center mb-8 lg:mb-14">
                  <h1 className="text-2xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">
                    Find your organization
                  </h1>
                  <p className="text-gray-500 mt-4 lg:mt-6 text-base lg:text-xl leading-relaxed">
                    Let&apos;s check if we already have a listing for you.
                  </p>
                </div>

                {/* Two-field search: Location + Name */}
                <form onSubmit={handleSearch}>
                  <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-gray-200/80 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Location input with dropdown — first on mobile */}
                    <div ref={locationDropdownRef} className="relative flex-1">
                      <div className={`flex items-center px-4 py-3 bg-gray-50 rounded-xl border transition-colors ${
                        showLocationDropdown ? "border-primary-400 ring-2 ring-primary-100" : "border-gray-200 hover:border-gray-300"
                      }`}>
                        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                          type="text"
                          aria-label="City or state"
                          value={locationQuery}
                          onChange={(e) => {
                            setLocationQuery(e.target.value);
                            setShowLocationDropdown(true);
                          }}
                          onFocus={() => {
                            preloadCities();
                            setShowLocationDropdown(true);
                          }}
                          placeholder="City or state"
                          className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                        />
                      </div>

                      {/* Location suggestions dropdown */}
                      {showLocationDropdown && cityResults.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                          {!locationQuery.trim() && (
                            <div className="px-4 pt-1 pb-2">
                              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Popular cities</span>
                            </div>
                          )}
                          {cityResults.map((loc) => (
                            <button
                              key={loc.full}
                              type="button"
                              onClick={() => {
                                setLocationQuery(loc.full);
                                setShowLocationDropdown(false);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-left text-base hover:bg-gray-50 transition-colors"
                            >
                              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="font-medium text-gray-700">{loc.full}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block w-px h-8 bg-gray-200 shrink-0" />

                    {/* Name input */}
                    <div className="flex items-center flex-1 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-colors">
                      <input
                        type="text"
                        aria-label="Organization name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Organization name"
                        className="w-full bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                      />
                    </div>

                    {/* Search button */}
                    <button
                      type="submit"
                      disabled={searching || (!searchQuery.trim() && !locationQuery.trim())}
                      className="px-7 py-3 text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all sm:shrink-0"
                    >
                      {searching ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>

                  {searchError && (
                    <p className="text-base text-red-600 mt-3">{searchError}</p>
                  )}
                </form>

                <p className="text-center mt-6 text-base text-gray-500">
                  or{" "}
                  <button
                    type="button"
                    onClick={() => setStep("create")}
                    className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
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
                  <div className="max-w-2xl mx-auto py-3">
                    <form onSubmit={handleSearch}>
                      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200/80 p-2.5 flex items-center gap-2.5">
                        {/* Location input with dropdown — first */}
                        <div ref={locationDropdownRef} className="relative flex-1 min-w-0">
                          <div className={`flex items-center px-3.5 py-2.5 bg-gray-50 rounded-lg border transition-colors ${
                            showLocationDropdown ? "border-primary-400 ring-1 ring-primary-100" : "border-gray-200 hover:border-gray-300"
                          }`}>
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <input
                              type="text"
                              aria-label="City or state"
                              value={locationQuery}
                              onChange={(e) => {
                                setLocationQuery(e.target.value);
                                setShowLocationDropdown(true);
                              }}
                              onFocus={() => {
                                preloadCities();
                                setShowLocationDropdown(true);
                              }}
                              placeholder="City or state"
                              className="w-full ml-2.5 bg-transparent border-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                            />
                          </div>

                          {/* Location suggestions dropdown */}
                          {showLocationDropdown && cityResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                              {!locationQuery.trim() && (
                                <div className="px-4 pt-1 pb-2">
                                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Popular cities</span>
                                </div>
                              )}
                              {cityResults.map((loc) => (
                                <button
                                  key={loc.full}
                                  type="button"
                                  onClick={() => {
                                    setLocationQuery(loc.full);
                                    setShowLocationDropdown(false);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                                >
                                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="font-medium text-gray-700">{loc.full}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-7 bg-gray-200 shrink-0" />

                        {/* Name input */}
                        <div className="flex items-center flex-1 min-w-0 px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-100 transition-colors">
                          <input
                            type="text"
                            aria-label="Organization name"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Organization name"
                            className="w-full bg-transparent border-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                          />
                        </div>

                        {/* Search button — icon only to save space */}
                        <button
                          type="submit"
                          disabled={searching || (!searchQuery.trim() && !locationQuery.trim())}
                          className="w-11 h-11 flex items-center justify-center text-white bg-primary-600 rounded-lg hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                          aria-label="Search"
                        >
                          {searching ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </form>
                    <div className="mt-2.5">
                      <p className="text-sm text-gray-500">
                        {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}{searchQuery.trim() || locationQuery.trim() ? <> for {[searchQuery.trim(), locationQuery.trim()].filter(Boolean).join(" in ")}</> : ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Results grid */}
                <div className="max-w-2xl mx-auto px-4 pt-8 pb-12">
                  <div className="space-y-4">
                    {paginatedResults.map((provider) => {
                      const image = getProviderImage(provider);
                      const locationText = [provider.city, provider.state].filter(Boolean).join(", ");
                      const isClaimed = claimedIds.has(provider.provider_id);

                      return (
                        <div
                          key={provider.provider_id}
                          className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                        >
                          <div className="flex">
                            {/* Image */}
                            <div className="w-32 sm:w-40 min-h-[120px] sm:min-h-[140px] shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative">
                              {image ? (
                                <Image
                                  src={image}
                                  alt={provider.provider_name}
                                  fill
                                  className="object-cover"
                                  sizes="160px"
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                    <span className="text-base sm:text-lg font-bold text-primary-400">
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
                            <div className="flex-1 p-4 sm:p-5 min-w-0 flex flex-col">
                              {locationText && (
                                <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{locationText}</p>
                              )}
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1">
                                {provider.provider_name}
                              </h3>

                              {/* Helper text */}
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                {isClaimed ? "Already managed." : "Unclaimed page."}
                              </p>

                              {/* Spacer */}
                              <div className="flex-1 min-h-2" />

                              {/* Actions */}
                              <div className="flex items-center justify-end">
                                {isClaimed ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      router.push(`/provider/${provider.slug || provider.provider_id}/onboard?provider_id=${provider.provider_id}&state=already-claimed`);
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                  >
                                    Dispute →
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Use inline auth for claim flow
                                      startInlineAuth(
                                        { type: "claim-listing", provider },
                                        provider.email || undefined
                                      );
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-primary-600 rounded-lg ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50 transition-all"
                                  >
                                    Manage →
                                  </button>
                                )}
                              </div>
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
                      onClick={() => setStep("create")}
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
              <div className="w-full max-w-md mx-auto text-center flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2">
                  No matches found
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                  We couldn&apos;t find any listings{(searchQuery.trim() || locationQuery.trim()) ? <> for {[searchQuery.trim(), locationQuery.trim()].filter(Boolean).join(" in ")}</> : ""}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHasSearched(false);
                      setSearchResults([]);
                      // Clear URL params when starting a new search
                      const params = new URLSearchParams();
                      if (isAdding) params.set("adding", "true");
                      if (nextUrl) params.set("next", nextUrl);
                      const newUrl = params.toString() ? `/provider/onboarding?${params.toString()}` : "/provider/onboarding";
                      router.replace(newUrl, { scroll: false });
                    }}
                    className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                  >
                    Try a different search
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("create")}
                    className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-500 transition-colors"
                  >
                    Create new listing
                  </button>
                </div>
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
                <h1 className="text-2xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight mb-4">
                  Request submitted
                </h1>
                <p className="text-gray-500 text-base lg:text-lg leading-relaxed max-w-sm mx-auto">
                  We&apos;ve received your request to claim <strong className="text-gray-700">{claimingProvider.provider_name}</strong>.
                  Our team will review it and get back to you within 2–3 business days.
                </p>
              </div>
            ) : (
              /* ── Verification form ── */
              <div>
                {/* Header — icon + title + subtitle */}
                <div className="text-center mb-8 lg:mb-10">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5 lg:mb-6">
                    <svg className="w-7 h-7 lg:w-8 lg:h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">
                    Verify your organization
                  </h1>
                  {verifySending ? (
                    <p className="text-gray-500 mt-3 lg:mt-4 text-base lg:text-lg leading-relaxed">Sending verification code…</p>
                  ) : verifyNoEmail ? (
                    <p className="text-gray-500 mt-3 lg:mt-4 text-base lg:text-lg leading-relaxed">
                      We don&apos;t have an email on file for <strong className="text-gray-600">{claimingProvider.provider_name}</strong>.
                      <br />Please submit a request below.
                    </p>
                  ) : verifyEmailHint ? (
                    <p className="text-gray-500 mt-3 lg:mt-4 text-base lg:text-lg leading-relaxed">
                      We sent a 6-digit code to <strong className="text-gray-600">{verifyEmailHint}</strong>.
                      <br />Enter it below to verify you represent {claimingProvider.provider_name}.
                    </p>
                  ) : verifyError ? (
                    <p className="text-gray-500 mt-3 lg:mt-4 text-base lg:text-lg leading-relaxed">
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

                    <Select
                      label="Your role"
                      options={[
                        { value: "Owner", label: "Owner" },
                        { value: "Administrator", label: "Administrator" },
                        { value: "Executive Director", label: "Executive Director" },
                        { value: "Office Manager", label: "Office Manager" },
                        { value: "Marketing / Communications", label: "Marketing / Communications" },
                        { value: "Staff Member", label: "Staff Member" },
                        { value: "Other", label: "Other" },
                      ]}
                      value={noAccessReason}
                      onChange={setNoAccessReason}
                      placeholder="Select your role..."
                    />

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

                {/* Choose different listing */}
                <div className="mt-8 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setClaimingProvider(null);
                      setVerifyCode("");
                      setVerifyError("");
                      setVerifyEmailHint("");
                      setVerifyNoEmail(false);
                      setShowNoAccess(false);
                      setStep("search");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-4 transition-colors"
                  >
                    Choose a different listing
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ── Simplified Create step: Single-step new account ── */}
        {step === "create" && (
          <>
            {/* Scrollable form content — centered with room for sticky bar */}
            <div className="w-full max-w-lg mx-auto pb-24">
              <div className="mb-8">
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 tracking-tight">
                  Let&apos;s set you up
                </h1>
                <p className="text-gray-500 mt-2 text-base">
                  Create your provider profile in seconds.
                </p>
              </div>

              <form
                id="create-profile-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
                className="space-y-6"
              >
                {/* Organization name */}
                <Input
                  label="Organization name"
                  value={data.displayName}
                  onChange={(e) => update("displayName", (e.target as HTMLInputElement).value)}
                  placeholder="e.g. Sunrise Senior Living"
                  required
                />

                {/* Business email */}
                <Input
                  label="Business email"
                  type="email"
                  value={data.email}
                  onChange={(e) => update("email", (e.target as HTMLInputElement).value)}
                  placeholder="you@yourcompany.com"
                  required
                />

                {/* City picker */}
                <div className="space-y-1.5">
                  <label htmlFor="create-city-picker" className="block text-base font-medium text-gray-700">
                    City
                  </label>
                  <div ref={cityPickerRef} className="relative">
                    <input
                      id="create-city-picker"
                      type="text"
                      role="combobox"
                      aria-expanded={showCityPicker && cityPickerResults.length > 0}
                      aria-autocomplete="list"
                      value={cityQuery || (data.city ? `${data.city}${data.state ? `, ${data.state}` : ""}` : "")}
                      onChange={(e) => {
                        setCityQuery(e.target.value);
                        setShowCityPicker(true);
                        if (data.city) {
                          update("city", "");
                          update("state", "");
                        }
                      }}
                      onFocus={() => {
                        preloadCityPicker();
                        setShowCityPicker(true);
                        if (data.city && !cityQuery) {
                          setCityQuery(`${data.city}${data.state ? `, ${data.state}` : ""}`);
                        }
                      }}
                      placeholder="e.g. Houston"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] placeholder:text-gray-400"
                      autoComplete="off"
                      required
                    />

                    {/* City suggestions dropdown */}
                    {showCityPicker && cityPickerResults.length > 0 && (
                      <div role="listbox" aria-label="City suggestions" className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
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

                {/* Care types */}
                <div className="space-y-3">
                  <label className="block text-base font-medium text-gray-700">
                    Type of care <span className="font-normal text-gray-400">(select at least one)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
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
                            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                            selected
                              ? "bg-primary-50 border-primary-500 text-primary-700"
                              : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
                          ].join(" ")}
                        >
                          {selected && (
                            <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {ct}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
                    {submitError}
                  </div>
                )}
              </form>
            </div>

            {/* Sticky bottom bar — aligned with nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                {/* Back button — styled like Exit */}
                <button
                  type="button"
                  onClick={() => setStep("search")}
                  className="px-4 py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  Back
                </button>

                {/* Submit button */}
                <Button
                  type="submit"
                  form="create-profile-form"
                  disabled={
                    !data.displayName.trim() ||
                    !data.email.trim() ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
                    !data.city.trim() ||
                    data.careTypes.length === 0 ||
                    submitting ||
                    checkingDuplicates
                  }
                  loading={submitting || checkingDuplicates}
                >
                  {checkingDuplicates ? "Checking..." : "Create profile"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── Potential Matches step: Show duplicate candidates ── */}
        {step === "potential-matches" && (potentialMatches.length > 0 || businessProfileMatches.length > 0) && (() => {
          const totalMatches = businessProfileMatches.length + potentialMatches.length;
          const isSingleMatch = totalMatches === 1;

          // Limit visible cards to keep CTA in viewport
          const MAX_VISIBLE = 2;
          const hasMore = totalMatches > MAX_VISIBLE;

          // Calculate how many to show from each list
          const visibleBusinessProfiles = showAllMatches
            ? businessProfileMatches
            : businessProfileMatches.slice(0, MAX_VISIBLE);
          const remainingSlots = showAllMatches
            ? potentialMatches.length
            : Math.max(0, MAX_VISIBLE - visibleBusinessProfiles.length);
          const visibleProviders = potentialMatches.slice(0, remainingSlots);
          const hiddenCount = totalMatches - visibleBusinessProfiles.length - visibleProviders.length;

          return (
            <div className="w-full max-w-lg mx-auto pb-12">
              <div className="mb-6">
                <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 tracking-tight">
                  {isSingleMatch
                    ? "We found a page that might be yours"
                    : "We found pages that might be yours"}
                </h1>
                <p className="text-gray-500 mt-2 text-base">
                  {isSingleMatch
                    ? "Is this your organization?"
                    : "Select yours, or create a new page."}
                </p>
              </div>

              {/* Combined matches list */}
              <div className="space-y-3">
                {/* Business profile matches (already set up) */}
                {visibleBusinessProfiles.map((profile) => {
                  const isOwnedBySomeoneElse = user && account?.id && profile.account_id !== account.id;
                  const locationText = [profile.city, profile.state].filter(Boolean).join(", ");

                  const handleBusinessProfileClick = () => {
                    if (isOwnedBySomeoneElse) {
                      // Use inline auth to sign in then handle dispute
                      startInlineAuth(
                        { type: "manage-claimed", profile },
                        profile.email || data.email || undefined
                      );
                    } else {
                      // Just sign them in — no profile creation
                      // After sign-in, normal routing takes over:
                      // - If they have a provider profile → /provider
                      // - If not → /provider/onboarding
                      startInlineAuth(
                        { type: "sign-in" },
                        profile.email || data.email || undefined
                      );
                    }
                  };

                  return (
                    <div
                      key={profile.id}
                      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                    >
                      <div className="flex">
                        {/* Image - compact on mobile */}
                        <div className="w-28 sm:w-36 min-h-[100px] sm:min-h-[130px] shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative">
                          {profile.image_url ? (
                            <Image
                              src={profile.image_url}
                              alt={profile.display_name}
                              fill
                              className="object-cover"
                              sizes="144px"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                <span className="text-base sm:text-lg font-bold text-primary-400">
                                  {(profile.display_name || "")
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

                        {/* Content - compact padding */}
                        <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col">
                          {locationText && (
                            <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{locationText}</p>
                          )}
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1">
                            {profile.display_name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {isOwnedBySomeoneElse ? "Managed by another account." : "Sign in to manage."}
                          </p>
                          <div className="flex-1 min-h-2" />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={handleBusinessProfileClick}
                              className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                                isOwnedBySomeoneElse
                                  ? "text-amber-600 ring-1 ring-amber-200 hover:ring-amber-300 hover:bg-amber-50"
                                  : "text-primary-600 ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50"
                              }`}
                            >
                              {isOwnedBySomeoneElse ? "Dispute →" : "Sign in →"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Provider matches (unclaimed pages) */}
                {visibleProviders.map((provider) => {
                  const image = getProviderImage(provider);
                  const locationText = [provider.city, provider.state].filter(Boolean).join(", ");

                  return (
                    <div
                      key={provider.provider_id}
                      className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                    >
                      <div className="flex">
                        {/* Image - compact on mobile */}
                        <div className="w-28 sm:w-36 min-h-[100px] sm:min-h-[130px] shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative">
                          {image ? (
                            <Image
                              src={image}
                              alt={provider.provider_name}
                              fill
                              className="object-cover"
                              sizes="144px"
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                <span className="text-base sm:text-lg font-bold text-primary-400">
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

                        {/* Content - compact padding */}
                        <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col">
                          {locationText && (
                            <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{locationText}</p>
                          )}
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1">
                            {provider.provider_name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Unclaimed page.
                          </p>
                          <div className="flex-1 min-h-2" />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                // Use inline auth for claim flow
                                startInlineAuth(
                                  { type: "claim-listing", provider },
                                  provider.email || undefined
                                );
                              }}
                              className="px-3 py-1.5 text-sm font-semibold text-primary-600 rounded-lg ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50 transition-all"
                            >
                              Manage →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show more button */}
              {hasMore && !showAllMatches && (
                <button
                  type="button"
                  onClick={() => setShowAllMatches(true)}
                  className="mt-3 w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Show {hiddenCount} more {hiddenCount === 1 ? "result" : "results"}
                </button>
              )}

              {/* CTA card - matches search results styling */}
              <div className="mt-10 text-center py-8 bg-white rounded-xl border border-gray-200">
                <p className="text-lg font-semibold text-gray-900 mb-1">
                  Not yours?
                </p>
                <p className="text-base text-gray-500 mb-5">
                  Let&apos;s create your page instead.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setStep("create")}
                    className="px-5 py-2.5 text-base font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                    className="px-7 py-3 text-base font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-500 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {submitting ? "Creating..." : "Set up a new page"}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Inline Auth Step */}
        {step === "auth" && pendingAuthAction && (
          <div className="max-w-lg mx-auto px-4 sm:px-0">
            {/* Header */}
            <div className="text-center mb-8 lg:mb-10">
              <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-5 lg:mb-6">
                <svg className="w-7 h-7 lg:w-8 lg:h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">
                {pendingAuthAction.type === "sign-in" ? "Sign in to continue" : "Verify your email"}
              </h1>
              <p className="text-gray-500 mt-3 lg:mt-4 text-base lg:text-lg leading-relaxed">
                {authSent
                  ? <>Enter the 6-digit code sent to <strong className="text-gray-600">{authEmail}</strong></>
                  : pendingAuthAction.type === "create-profile"
                    ? "Enter your business email to create your account"
                    : pendingAuthAction.type === "claim-listing"
                      ? `Enter your business email to claim ${pendingAuthAction.provider.provider_name}`
                      : "Enter your email to sign in"
                }
              </p>
            </div>

            {/* Finalizing profile state */}
            {finalizingProfile ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-lg font-medium text-gray-900 mt-6">Setting up your account...</p>
                <p className="text-sm text-gray-500 mt-2">This will only take a moment</p>
              </div>
            ) : !authSent ? (
              /* Email input step */
              <div className="space-y-6">
                <div>
                  <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Use your work email for faster verification
                  </p>
                </div>

                {authError && (
                  <p className="text-sm text-red-600 text-center" role="alert">{authError}</p>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleAuthSendOtp}
                    disabled={!authEmail || authSending || authResendCooldown > 0}
                    className="w-full py-3.5"
                  >
                    {authSending ? "Sending code..." : authResendCooldown > 0 ? `Resend in ${authResendCooldown}s` : "Continue"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(previousStep);
                      setPendingAuthAction(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Go back
                  </button>
                </div>
              </div>
            ) : (
              /* OTP verification step */
              <div className="space-y-6">
                <fieldset>
                  <legend className="sr-only">Enter your 6-digit verification code</legend>
                  <OtpInput
                    length={6}
                    value={authCode}
                    onChange={setAuthCode}
                    disabled={authVerifying}
                    error={!!authError}
                  />
                </fieldset>

                {authError && (
                  <p className="text-sm text-red-600 text-center" role="alert">{authError}</p>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleAuthVerifyOtp}
                    disabled={authCode.length !== 6 || authVerifying}
                    className="w-full py-3.5"
                  >
                    {authVerifying ? "Verifying..." : "Verify & Continue"}
                  </Button>

                  {/* Resend */}
                  <div className="text-center">
                    {authResendCooldown > 0 ? (
                      <p className="text-sm text-gray-500">Resend code in {authResendCooldown}s</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthCode("");
                          handleAuthSendOtp();
                        }}
                        disabled={authSending}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                      >
                        Didn&apos;t receive code? Resend
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthSent(false);
                      setAuthCode("");
                      setAuthError("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    ← Change email
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Verification Modal */}
      <VerificationFormModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationSubmit}
        businessName={pendingProfileName}
        allowDismiss={true}
        onDismiss={handleVerificationDismiss}
      />
    </div>
  );
}
