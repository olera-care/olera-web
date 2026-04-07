"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import OtpInput from "@/components/auth/OtpInput";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";
import type { Provider } from "@/lib/types/provider";

type Step = "search" | "verify" | "create" | "auth";

const RESULTS_PER_PAGE = 6;

const CARE_TYPES = [
  "Assisted Living",
  "Memory Care",
  "Independent Living",
  "Skilled Nursing",
  "Home Care",
  "Home Health",
  "Hospice",
];

// Track what action to perform after successful authentication
// (Copied from onboarding page)
type PendingAuthAction =
  | { type: "create-profile" }
  | { type: "claim-listing"; result: SearchResult }
  | { type: "sign-in"; result: SearchResult };

interface ProviderOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateSlug: string;
  candidateName: string;
}

// Represent both olera-providers and business_profiles in search results
interface SearchResult {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  imageUrl: string | null;
  source: "olera-providers" | "business_profiles";
  providerId?: string; // For olera-providers
  profileId?: string;  // For business_profiles
  claimState?: "claimed" | "pending" | "unclaimed";
  ownerEmail?: string; // Email hint for sign-in
}

function getProviderImage(provider: Provider): string | null {
  if (!provider.provider_images) return null;
  const first = provider.provider_images.split("|")[0].trim();
  return first || null;
}

export default function ProviderOnboardingModal({
  isOpen,
  onClose,
  candidateSlug,
  candidateName,
}: ProviderOnboardingModalProps) {
  const router = useRouter();
  const { user, refreshAccountData } = useAuth();

  // Step state
  const [step, setStep] = useState<Step>("search");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Location dropdown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults } = useCitySearch(locationQuery);
  useClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));

  // Claim state
  const [claimingProvider, setClaimingProvider] = useState<SearchResult | null>(null);
  const [claimSession] = useState(() => crypto.randomUUID());
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyEmailHint, setVerifyEmailHint] = useState("");
  const [verifyNoEmail, setVerifyNoEmail] = useState(false);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Create account state
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createCity, setCreateCity] = useState("");
  const [createState, setCreateState] = useState("");
  const [createCareTypes, setCreateCareTypes] = useState<string[]>([]);
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Auth state (after creating account)
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authSending, setAuthSending] = useState(false);
  const [authVerifying, setAuthVerifying] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSent, setAuthSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [finalizingProfile, setFinalizingProfile] = useState(false);

  // Pending auth action (copied from onboarding page)
  const [pendingAuthAction, setPendingAuthAction] = useState<PendingAuthAction | null>(null);

  // City picker for create form
  const [showCityPicker, setShowCityPicker] = useState(false);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const { results: cityPickerResults } = useCitySearch(createCity);
  useClickOutside(cityPickerRef, () => setShowCityPicker(false));

  const firstName = candidateName.split(" ")[0];

  // Toggle care type selection (matches onboarding)
  const toggleCareType = (ct: string) => {
    setCreateCareTypes((prev) =>
      prev.includes(ct) ? prev.filter((t) => t !== ct) : [...prev, ct]
    );
  };

  // Reset all state when modal closes (Bug fix #4)
  useEffect(() => {
    if (!isOpen) {
      // Small delay to let close animation finish
      const timer = setTimeout(() => {
        setStep("search");
        setSearchQuery("");
        setLocationQuery("");
        setSearchResults([]);
        setSearching(false);
        setHasSearched(false);
        setSearchError("");
        setCurrentPage(1);
        setClaimingProvider(null);
        setVerifyCode("");
        setVerifyEmailHint("");
        setVerifyNoEmail(false);
        setVerifySending(false);
        setVerifyChecking(false);
        setVerifyError("");
        setCreateEmail("");
        setCreateName("");
        setCreateCity("");
        setCreateState("");
        setCreateCareTypes([]);
        setCreateError("");
        setCreateSubmitting(false);
        setAuthEmail("");
        setAuthCode("");
        setAuthSending(false);
        setAuthVerifying(false);
        setAuthError("");
        setAuthSent(false);
        setResendCooldown(0);
        setFinalizingProfile(false);
        setPendingAuthAction(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Resend cooldown timer (Bug fix #5)
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle search (Bug fix #2: search both olera-providers AND business_profiles)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = searchQuery.trim();
    const loc = locationQuery.trim();
    if (!name && !loc) return;
    if (!isSupabaseConfigured()) return;

    setSearching(true);
    setSearchError("");
    setShowLocationDropdown(false);

    try {
      const supabase = createClient();
      const results: SearchResult[] = [];

      // 1. Search olera-providers (unclaimed listings)
      let providerQuery = supabase
        .from("olera-providers")
        .select("*")
        .not("deleted", "is", true);

      if (name) {
        providerQuery = providerQuery.ilike("provider_name", `%${name}%`);
      }
      if (loc) {
        const parts = loc.split(",").map((s) => s.trim());
        if (parts.length >= 2 && parts[1].length <= 3) {
          providerQuery = providerQuery.ilike("city", `%${parts[0]}%`);
          providerQuery = providerQuery.ilike("state", `%${parts[1]}%`);
        } else {
          providerQuery = providerQuery.or(`city.ilike.%${loc}%,state.ilike.%${loc}%`);
        }
      }

      const { data: providers, error: providerError } = await providerQuery.limit(20);

      if (providerError) {
        setSearchError("Search failed. Please try again.");
        setSearchResults([]);
        return;
      }

      // Get claim states for these providers
      const providerIds = (providers || []).map((p: Provider) => p.provider_id);
      let claimMap = new Map<string, { state: "claimed" | "pending"; email?: string }>();

      if (providerIds.length > 0) {
        const { data: claimedData } = await supabase
          .from("business_profiles")
          .select("source_provider_id, claim_state, account_id")
          .in("source_provider_id", providerIds)
          .in("claim_state", ["claimed", "pending"]);

        // Get owner emails for claimed listings (business_profiles → accounts → users)
        if (claimedData && claimedData.length > 0) {
          const accountIds = claimedData.map((c: { account_id: string }) => c.account_id).filter(Boolean);

          // Get user_ids from accounts
          const { data: accounts } = await supabase
            .from("accounts")
            .select("id, user_id")
            .in("id", accountIds);

          const accountUserMap = new Map((accounts || []).map((a: { id: string; user_id: string }) => [a.id, a.user_id]));
          const userIds = (accounts || []).map((a: { user_id: string }) => a.user_id).filter(Boolean);

          // Get emails from users
          const { data: users } = await supabase
            .from("users")
            .select("id, email")
            .in("id", userIds);

          const userEmailMap = new Map((users || []).map((u: { id: string; email: string }) => [u.id, u.email]));

          for (const claim of claimedData) {
            if (claim.source_provider_id) {
              const userId = accountUserMap.get(claim.account_id);
              const email = userId ? userEmailMap.get(userId) : undefined;
              claimMap.set(claim.source_provider_id, {
                state: claim.claim_state as "claimed" | "pending",
                email: email ? `${email.slice(0, 2)}***@${email.split("@")[1]}` : undefined,
              });
            }
          }
        }
      }

      // Convert providers to SearchResult
      for (const p of (providers as Provider[]) || []) {
        const claimInfo = claimMap.get(p.provider_id);
        results.push({
          id: p.provider_id,
          name: p.provider_name,
          city: p.city,
          state: p.state,
          imageUrl: getProviderImage(p),
          source: "olera-providers",
          providerId: p.provider_id,
          claimState: claimInfo?.state || "unclaimed",
          ownerEmail: claimInfo?.email,
        });
      }

      // 2. Search business_profiles (both from scratch AND auto-linked)
      // We include all profiles and dedupe against olera-providers by source_provider_id
      let profileQuery = supabase
        .from("business_profiles")
        .select("id, display_name, city, state, avatar_url, slug, account_id, source_provider_id")
        .eq("type", "organization") // Only provider organizations
        .eq("is_active", true); // Only active profiles

      if (name) {
        profileQuery = profileQuery.ilike("display_name", `%${name}%`);
      }
      if (loc) {
        const parts = loc.split(",").map((s) => s.trim());
        if (parts.length >= 2 && parts[1].length <= 3) {
          profileQuery = profileQuery.ilike("city", `%${parts[0]}%`);
          profileQuery = profileQuery.ilike("state", `%${parts[1]}%`);
        } else {
          profileQuery = profileQuery.or(`city.ilike.%${loc}%,state.ilike.%${loc}%`);
        }
      }

      const { data: profiles } = await profileQuery.limit(10);

      // Get owner emails for these profiles (business_profiles → accounts → users)
      if (profiles && profiles.length > 0) {
        const accountIds = profiles.map((p: { account_id: string }) => p.account_id).filter(Boolean);

        // Get user_ids from accounts
        const { data: accounts } = await supabase
          .from("accounts")
          .select("id, user_id")
          .in("id", accountIds);

        const accountUserMap = new Map((accounts || []).map((a: { id: string; user_id: string }) => [a.id, a.user_id]));
        const userIds = (accounts || []).map((a: { user_id: string }) => a.user_id).filter(Boolean);

        // Get emails from users
        const { data: users } = await supabase
          .from("users")
          .select("id, email")
          .in("id", userIds);

        const userEmailMap = new Map((users || []).map((u: { id: string; email: string }) => [u.id, u.email]));

        // Collect provider IDs already in results to avoid duplicates
        const existingProviderIds = new Set(
          results.filter((r) => r.source === "olera-providers").map((r) => r.providerId)
        );

        for (const p of profiles) {
          // Skip if this profile is linked to an olera-provider already in results
          if (p.source_provider_id && existingProviderIds.has(p.source_provider_id)) {
            continue;
          }

          const userId = accountUserMap.get(p.account_id);
          const email = userId ? userEmailMap.get(userId) : undefined;
          results.push({
            id: p.id,
            name: p.display_name,
            city: p.city,
            state: p.state,
            imageUrl: p.avatar_url,
            source: "business_profiles",
            profileId: p.id,
            claimState: "claimed", // business_profiles are always "owned"
            ownerEmail: email ? `${email.slice(0, 2)}***@${email.split("@")[1]}` : undefined,
          });
        }
      }

      // Dedupe by name (prefer olera-providers, then first occurrence)
      const seen = new Set<string>();
      const dedupedResults = results.filter((r) => {
        const key = r.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSearchResults(dedupedResults);
      setCurrentPage(1); // Reset to first page on new search
    } catch {
      setSearchError("Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setHasSearched(true);
      setSearching(false);
    }
  };

  // Transition to inline auth step (copied from onboarding page)
  const startInlineAuth = (action: PendingAuthAction, email?: string) => {
    setPendingAuthAction(action);
    setAuthEmail(email || "");
    setAuthCode("");
    setAuthError("");
    setAuthSent(false);
    setAuthSending(false);
    setAuthVerifying(false);
    setFinalizingProfile(false);
    setStep("auth");
  };

  // Send verification code to business email (fallback after deferred claim fails)
  const handleSendVerificationCode = async (result: SearchResult) => {
    if (!result.providerId) return;

    setVerifySending(true);
    setVerifyError("");
    setVerifyCode("");
    setVerifyNoEmail(false);

    try {
      const res = await fetch("/api/claim/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: result.providerId,
          sessionId: claimSession,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.noEmail || res.status === 422) {
          setVerifyNoEmail(true);
        } else {
          setVerifyError(data.error || "Failed to send code");
        }
      } else {
        setVerifyEmailHint(data.emailHint || "");
      }
    } catch {
      setVerifyError("Failed to send verification code");
    } finally {
      setVerifySending(false);
    }
  };

  // Verify claim code (business email verification)
  const handleVerifyCode = async () => {
    if (!claimingProvider?.providerId || verifyCode.length !== 6) return;

    setVerifyChecking(true);
    setVerifyError("");

    try {
      const res = await fetch("/api/claim/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: claimingProvider.providerId,
          sessionId: claimSession,
          code: verifyCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.verified) {
        setVerifyError(data.error || "Incorrect code. Please try again.");
        setVerifyChecking(false);
        return;
      }

      // Code verified — now finalize the claim
      const finalizeRes = await fetch("/api/claim/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: claimingProvider.providerId,
          claimSession,
        }),
      });

      if (!finalizeRes.ok) {
        const finalizeData = await finalizeRes.json();
        setVerifyError(finalizeData.error || "Failed to claim listing");
        setVerifyChecking(false);
        return;
      }

      // Claimed successfully — refresh and redirect
      await refreshAccountData();
      router.push(`/provider/medjobs/candidates/${candidateSlug}?schedule=true`);
    } catch {
      setVerifyError("Verification failed");
      setVerifyChecking(false);
    }
  };

  // Handle create account submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createName.trim()) return;

    setCreateSubmitting(true);
    setCreateError("");

    // Go to auth flow with create-profile action
    startInlineAuth({ type: "create-profile" }, createEmail.trim());
    setCreateSubmitting(false);
  };

  // Send OTP (with cooldown - Bug fix #5)
  const handleSendOtp = async () => {
    if (!authEmail || resendCooldown > 0) return;

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
        setResendCooldown(60); // 60 second cooldown
      }
    } catch {
      setAuthError("Failed to send code");
    } finally {
      setAuthSending(false);
    }
  };

  // Verify OTP and execute pending action (copied from onboarding page)
  const handleVerifyOtp = async () => {
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
          // Create the profile
          const res = await fetch("/api/auth/create-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "organization",
              displayName: createName.trim(),
              city: createCity || undefined,
              state: createState || undefined,
              careTypes: createCareTypes.length ? createCareTypes : undefined,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            setAuthError(data.error || "Failed to create profile");
            setAuthVerifying(false);
            setFinalizingProfile(false);
            return;
          }

          await refreshAccountData();
          router.push(`/provider/medjobs/candidates/${candidateSlug}?schedule=true`);
          break;
        }

        case "claim-listing": {
          const result = pendingAuthAction.result;
          // Try to claim via deferred action (checks if user's email domain matches)
          try {
            const claimRes = await fetch("/api/claim/deferred", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                providerId: result.providerId,
              }),
            });

            if (claimRes.ok) {
              await refreshAccountData();
              router.push(`/provider/medjobs/candidates/${candidateSlug}?schedule=true`);
            } else {
              // If deferred claim fails, go to verify step (send code to business email)
              setClaimingProvider(result);
              setStep("verify");
              setFinalizingProfile(false);
              await handleSendVerificationCode(result);
            }
          } catch {
            // Fall back to verify step
            setClaimingProvider(result);
            setStep("verify");
            setFinalizingProfile(false);
            await handleSendVerificationCode(result);
          }
          break;
        }

        case "sign-in": {
          await refreshAccountData();
          router.push(`/provider/medjobs/candidates/${candidateSlug}?schedule=true`);
          break;
        }
      }
    } catch {
      setAuthError("Verification failed");
      setAuthVerifying(false);
      setFinalizingProfile(false);
    }
  };

  // Auto-send OTP when entering auth step
  useEffect(() => {
    if (step === "auth" && authEmail && !authSent && !authSending) {
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, authEmail]);

  // Bug fix #1: REMOVED the problematic useEffect that redirected on user change
  // This was causing a race condition where redirect happened before profile creation completed.
  // The redirect now happens at the END of handleVerifyOtp/handleFinalizeClaim.

  const renderStep = () => {
    switch (step) {
      case "search":
        return (
          <div className="h-full flex flex-col">
            {/* ── State A: Initial search form ── */}
            {!hasSearched && (
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-xl">
                  <div className="text-center mb-8 lg:mb-14">
                    <h1 className="text-2xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">
                      Schedule an interview with {firstName}
                    </h1>
                    <p className="text-gray-500 mt-4 lg:mt-6 text-base lg:text-xl leading-relaxed">
                      Find your business or create an account to get started
                    </p>
                  </div>

                  {/* Pill-style search form */}
                  <form onSubmit={handleSearch}>
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-gray-200/80 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Location input with dropdown */}
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
                            onFocus={() => setShowLocationDropdown(true)}
                            placeholder="City or state"
                            className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                          />
                        </div>

                        {/* Location suggestions dropdown */}
                        {showLocationDropdown && cityResults.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                            {cityResults.map((c) => (
                              <button
                                key={`${c.city}-${c.state}`}
                                type="button"
                                onClick={() => {
                                  setLocationQuery(`${c.city}, ${c.state}`);
                                  setShowLocationDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left text-base hover:bg-gray-50 transition-colors"
                              >
                                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="font-medium text-gray-700">{c.city}, {c.state}</span>
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
                      <p className="text-base text-red-600 mt-3 text-center">{searchError}</p>
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
              </div>
            )}

            {/* ── State B: Results found ── */}
            {hasSearched && searchResults.length > 0 && (() => {
              const totalPages = Math.ceil(searchResults.length / RESULTS_PER_PAGE);
              const paginatedResults = searchResults.slice(
                (currentPage - 1) * RESULTS_PER_PAGE,
                currentPage * RESULTS_PER_PAGE
              );

              return (
              <div className="flex-1 flex flex-col overflow-hidden bg-white">
                {/* Sticky search bar - matches onboarding */}
                <div className="shrink-0 bg-white/95 backdrop-blur-sm border-b border-gray-200/60 px-4">
                  <div className="max-w-2xl mx-auto py-3">
                    <form onSubmit={handleSearch}>
                      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200/80 p-2.5 flex items-center gap-2.5">
                        {/* Location input with dropdown */}
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
                              onFocus={() => setShowLocationDropdown(true)}
                              placeholder="City or state"
                              className="w-full ml-2.5 bg-transparent border-none text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
                            />
                          </div>

                          {/* Location suggestions dropdown */}
                          {showLocationDropdown && cityResults.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                              {cityResults.map((c) => (
                                <button
                                  key={`${c.city}-${c.state}`}
                                  type="button"
                                  onClick={() => {
                                    setLocationQuery(`${c.city}, ${c.state}`);
                                    setShowLocationDropdown(false);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                                >
                                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="font-medium text-gray-700">{c.city}, {c.state}</span>
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

                {/* Results grid - scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="max-w-2xl mx-auto space-y-4">
                    {paginatedResults.map((result) => {
                      const isBusinessProfile = result.source === "business_profiles";
                      const isClaimed = result.claimState === "claimed" || result.claimState === "pending";
                      const locationText = [result.city, result.state].filter(Boolean).join(", ");

                      // Determine helper text and button based on source/state
                      // - business_profiles: "Sign in to manage." + "Sign in →"
                      // - olera-providers claimed: "Already managed." + "Dispute →"
                      // - olera-providers unclaimed: "Unclaimed page." + "Manage →"
                      const helperText = isBusinessProfile
                        ? "Sign in to manage."
                        : isClaimed
                          ? "Already managed."
                          : "Unclaimed page.";

                      return (
                        <div
                          key={result.id}
                          className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                        >
                          <div className="flex">
                            {/* Image */}
                            <div className="w-32 sm:w-40 min-h-[120px] sm:min-h-[140px] shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative">
                              {result.imageUrl ? (
                                <Image
                                  src={result.imageUrl}
                                  alt={result.name}
                                  fill
                                  className="object-cover"
                                  sizes="160px"
                                />
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                    <span className="text-base sm:text-lg font-bold text-primary-400">
                                      {(result.name || "")
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
                                {result.name}
                              </h3>

                              {/* Helper text */}
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                {helperText}
                              </p>

                              {/* Spacer */}
                              <div className="flex-1 min-h-2" />

                              {/* Actions */}
                              <div className="flex items-center justify-end">
                                {isBusinessProfile ? (
                                  // Business profiles: user might be the owner, show "Sign in →"
                                  <button
                                    type="button"
                                    onClick={() => startInlineAuth({ type: "sign-in", result })}
                                    className="px-4 py-2 text-sm font-semibold text-primary-600 rounded-lg ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50 transition-all"
                                  >
                                    Sign in →
                                  </button>
                                ) : isClaimed ? (
                                  // olera-providers claimed by someone else
                                  <button
                                    type="button"
                                    onClick={() => startInlineAuth({ type: "sign-in", result })}
                                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                  >
                                    Dispute →
                                  </button>
                                ) : (
                                  // olera-providers unclaimed
                                  <button
                                    type="button"
                                    onClick={() => startInlineAuth({ type: "claim-listing", result })}
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

                    {/* CTA: Don't see your organization? */}
                    <div className="mt-6 text-center py-8 bg-white rounded-xl border border-gray-200">
                      <p className="text-lg font-semibold text-gray-900 mb-1">
                        Don&apos;t see your organization?
                      </p>
                      <p className="text-base text-gray-500 mb-5">
                        Create a new listing from scratch
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCreateName(searchQuery);
                          setStep("create");
                        }}
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
                        // Scroll to top of results
                        const scrollContainer = document.querySelector('[data-modal-scroll]');
                        if (scrollContainer) {
                          scrollContainer.scrollTop = 0;
                        }
                      }}
                      itemLabel="listings"
                      showItemCount={false}
                      className="justify-center"
                    />
                  </div>
                </div>
              </div>
              );
            })()}

            {/* ── State C: No results ── */}
            {hasSearched && searchResults.length === 0 && (
              <div className="flex-1 flex items-center justify-center px-4 bg-white">
                <div className="w-full max-w-md text-center">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2">
                    No matches found
                  </h2>
                  <p className="text-gray-500 text-base leading-relaxed mb-8">
                    We couldn&apos;t find any listings matching your search
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setHasSearched(false);
                        setSearchResults([]);
                      }}
                      className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                    >
                      Try a different search
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreateName(searchQuery);
                        setStep("create");
                      }}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-500 transition-colors"
                    >
                      Create new listing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "verify":
        // Show finalizing state when creating profile
        if (finalizingProfile) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
                Claiming your business...
              </h1>
              <p className="text-gray-500 mt-3 text-base sm:text-lg">This will only take a moment</p>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {/* Back button */}
            <button
              type="button"
              onClick={() => {
                setStep("search");
                setClaimingProvider(null);
              }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to search
            </button>

            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 tracking-tight">
                Verify your business
              </h1>
              {claimingProvider && (
                <p className="text-gray-500 mt-3 text-base sm:text-lg">
                  Claiming <strong className="text-gray-700">{claimingProvider.name}</strong>
                </p>
              )}
            </div>

            {verifySending ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 mt-4 text-base">Sending verification code...</p>
              </div>
            ) : verifyNoEmail ? (
              <div className="text-center py-6 px-4 bg-amber-50 rounded-xl border border-amber-100">
                <svg className="w-10 h-10 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-amber-800 font-medium">
                  We don&apos;t have an email on file for this business.
                </p>
                <p className="text-amber-700 mt-2">
                  Please contact us at{" "}
                  <a href="mailto:hello@olera.care" className="font-medium underline hover:no-underline">
                    hello@olera.care
                  </a>{" "}
                  to verify your ownership.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-500 text-center text-base">
                  We sent a 6-digit code to{" "}
                  <strong className="text-gray-700">{verifyEmailHint || "your email"}</strong>
                </p>

                <div className="flex justify-center">
                  <OtpInput
                    length={6}
                    value={verifyCode}
                    onChange={setVerifyCode}
                    disabled={verifyChecking}
                  />
                </div>

                {verifyError && (
                  <p className="text-sm text-red-600 text-center">{verifyError}</p>
                )}

                <Button
                  onClick={handleVerifyCode}
                  disabled={verifyCode.length !== 6 || verifyChecking}
                  className="w-full py-3.5 text-base"
                >
                  {verifyChecking ? "Verifying..." : "Verify & Continue"}
                </Button>
              </div>
            )}
          </div>
        );

      case "create":
        return (
          <div className="space-y-6">
            {/* Header - matches onboarding */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 tracking-tight">
                Let&apos;s set you up
              </h1>
              <p className="text-gray-500 mt-2 text-base">
                Create your provider profile in seconds.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6">
              {/* Organization name - first, like onboarding */}
              <div className="space-y-1.5">
                <label className="block text-base font-medium text-gray-700">
                  Organization name
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Sunrise Senior Living"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] placeholder:text-gray-400"
                  autoFocus
                />
              </div>

              {/* Business email */}
              <div className="space-y-1.5">
                <label className="block text-base font-medium text-gray-700">
                  Business email
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="you@yourcompany.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] placeholder:text-gray-400"
                />
              </div>

              {/* City picker - matches onboarding style */}
              <div className="space-y-1.5">
                <label className="block text-base font-medium text-gray-700">
                  City
                </label>
                <div ref={cityPickerRef} className="relative">
                  <input
                    type="text"
                    value={createCity}
                    onChange={(e) => {
                      setCreateCity(e.target.value);
                      setShowCityPicker(true);
                    }}
                    onFocus={() => setShowCityPicker(true)}
                    placeholder="e.g. Houston"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px] placeholder:text-gray-400"
                  />
                  {showCityPicker && cityPickerResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                      {cityPickerResults.map((c) => (
                        <button
                          key={`${c.city}-${c.state}`}
                          type="button"
                          onClick={() => {
                            setCreateCity(c.city);
                            setCreateState(c.state);
                            setShowCityPicker(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-base hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium text-gray-700">{c.city}, {c.state}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Type of care - matches onboarding exactly */}
              <div className="space-y-3">
                <label className="block text-base font-medium text-gray-700">
                  Type of care <span className="font-normal text-gray-400">(select at least one)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARE_TYPES.map((ct) => {
                    const selected = createCareTypes.includes(ct);
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

              {createError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm" role="alert">
                  {createError}
                </div>
              )}

              {/* Action buttons - matches onboarding style */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep("search")}
                  className="px-4 py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  Back
                </button>
                <Button
                  type="submit"
                  disabled={!createEmail.trim() || !createName.trim() || !createCity.trim() || createCareTypes.length === 0 || createSubmitting}
                >
                  {createSubmitting ? "Creating..." : "Create profile"}
                </Button>
              </div>
            </form>
          </div>
        );

      case "auth":
        // Show better loading state during profile setup
        if (finalizingProfile) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
                Setting up your account...
              </h1>
              <p className="text-gray-500 mt-3 text-base sm:text-lg">This will only take a moment</p>
            </div>
          );
        }

        // Helper to get result from pending action (for sign-in or claim-listing)
        const actionResult = pendingAuthAction?.type === "sign-in" || pendingAuthAction?.type === "claim-listing"
          ? pendingAuthAction.result
          : null;
        const isSignIn = pendingAuthAction?.type === "sign-in";

        return (
          <div className="space-y-8">
            {/* Back button - always show */}
            <button
              type="button"
              onClick={() => {
                setPendingAuthAction(null);
                // Go back to create step if coming from create flow, otherwise search
                setStep(pendingAuthAction?.type === "create-profile" ? "create" : "search");
                setAuthSent(false);
                setAuthCode("");
                setAuthEmail("");
              }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {pendingAuthAction?.type === "create-profile" ? "Back to form" : "Back to search"}
            </button>

            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 tracking-tight">
                {isSignIn ? "Sign in to continue" : "Verify your email"}
              </h1>
              {actionResult && (
                <p className="text-gray-600 mt-2 font-medium">
                  {actionResult.name}
                </p>
              )}
              <p className="text-gray-500 mt-3 text-base sm:text-lg">
                {authSent
                  ? <>Enter the 6-digit code sent to <strong className="text-gray-700">{authEmail}</strong></>
                  : pendingAuthAction?.type === "create-profile"
                    ? "Enter your business email to create your account"
                    : pendingAuthAction?.type === "claim-listing"
                      ? actionResult?.ownerEmail
                        ? <>Sign in with <strong className="text-gray-700">{actionResult.ownerEmail}</strong> for instant verification</>
                        : "Sign in with your business email for instant verification"
                      : actionResult?.ownerEmail
                        ? <>Sign in with <strong className="text-gray-700">{actionResult.ownerEmail}</strong> for instant verification</>
                        : "Sign in with your business email for instant verification"}
              </p>
            </div>

            {!authSent ? (
              <div className="space-y-5">
                {/* Email input - always shown so user can enter/change email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <input
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

                {authSending ? (
                  <div className="text-center py-8">
                    <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-500 mt-4 text-base">Sending verification code...</p>
                  </div>
                ) : (
                  <>
                    {authError && (
                      <p className="text-sm text-red-600 text-center">{authError}</p>
                    )}
                    <Button
                      onClick={handleSendOtp}
                      className="w-full py-3.5 text-base"
                      disabled={!authEmail || resendCooldown > 0}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Send verification code"}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <OtpInput
                    length={6}
                    value={authCode}
                    onChange={setAuthCode}
                    disabled={authVerifying}
                  />
                </div>

                {authError && (
                  <p className="text-sm text-red-600 text-center">{authError}</p>
                )}

                <Button
                  onClick={handleVerifyOtp}
                  disabled={authCode.length !== 6 || authVerifying}
                  className="w-full py-3.5 text-base"
                >
                  {authVerifying ? "Verifying..." : "Verify & Continue"}
                </Button>

                {/* Resend with cooldown */}
                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-sm text-gray-400">Resend code in {resendCooldown}s</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthSent(false);
                        setAuthCode("");
                        handleSendOtp();
                      }}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      Didn&apos;t receive code? Send again
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  // Determine if we're showing results (needs full height layout)
  const showingResults = step === "search" && hasSearched && searchResults.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="fullscreen"
      hideHeader
    >
      {step === "search" ? (
        // Search step handles its own layout (initial search vs results)
        <div className="h-full">
          {renderStep()}
        </div>
      ) : (
        // Other steps: centered content
        <div className="h-full flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg">
            {renderStep()}
          </div>
        </div>
      )}
    </Modal>
  );
}
