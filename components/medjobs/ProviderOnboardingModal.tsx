"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/auth/OtpInput";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";
import type { Provider } from "@/lib/types/provider";

type Step = "search" | "claim-verify" | "create" | "auth";

interface ProviderOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateSlug: string;
  candidateName: string;
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
  const [searchResults, setSearchResults] = useState<Provider[]>([]);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Location dropdown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults } = useCitySearch(locationQuery);
  useClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));

  // Claim state
  const [claimingProvider, setClaimingProvider] = useState<Provider | null>(null);
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
  const [createError, setCreateError] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Auth state (after creating account)
  const [authEmail, setAuthEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authSending, setAuthSending] = useState(false);
  const [authVerifying, setAuthVerifying] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSent, setAuthSent] = useState(false);

  // City picker for create form
  const [showCityPicker, setShowCityPicker] = useState(false);
  const cityPickerRef = useRef<HTMLDivElement>(null);
  const { results: cityPickerResults } = useCitySearch(createCity);
  useClickOutside(cityPickerRef, () => setShowCityPicker(false));

  const firstName = candidateName.split(" ")[0];

  // Handle search
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

      let query = supabase
        .from("olera-providers")
        .select("*")
        .not("deleted", "is", true);

      if (name) {
        query = query.ilike("provider_name", `%${name}%`);
      }
      if (loc) {
        const parts = loc.split(",").map((s) => s.trim());
        if (parts.length >= 2 && parts[1].length <= 3) {
          query = query.ilike("city", `%${parts[0]}%`);
          query = query.ilike("state", `%${parts[1]}%`);
        } else {
          query = query.or(`city.ilike.%${loc}%,state.ilike.%${loc}%`);
        }
      }

      const { data, error } = await query.limit(10);

      if (error) {
        setSearchError("Search failed. Please try again.");
        setSearchResults([]);
        return;
      }

      setSearchResults((data as Provider[]) || []);

      // Check which are already claimed
      const providerIds = (data || []).map((p: Provider) => p.provider_id);
      if (providerIds.length > 0) {
        const { data: claimed } = await supabase
          .from("business_profiles")
          .select("source_provider_id")
          .in("source_provider_id", providerIds)
          .in("claim_state", ["claimed", "pending"]);

        setClaimedIds(
          new Set(
            (claimed || [])
              .map((r: { source_provider_id: string | null }) => r.source_provider_id)
              .filter((id): id is string => !!id)
          )
        );
      }
    } catch {
      setSearchError("Search failed. Please try again.");
      setSearchResults([]);
    } finally {
      setHasSearched(true);
      setSearching(false);
    }
  };

  // Start claim flow
  const handleStartClaim = async (provider: Provider) => {
    setClaimingProvider(provider);
    setVerifyCode("");
    setVerifyError("");
    setVerifyNoEmail(false);
    setVerifySending(true);

    try {
      const res = await fetch("/api/claim/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.provider_id,
          sessionId: claimSession,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.noEmail) {
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
      setStep("claim-verify");
    }
  };

  // Verify claim code
  const handleVerifyCode = async () => {
    if (!claimingProvider || verifyCode.length !== 6) return;

    setVerifyChecking(true);
    setVerifyError("");

    try {
      const res = await fetch("/api/claim/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: claimingProvider.provider_id,
          sessionId: claimSession,
          code: verifyCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error || "Invalid code");
        setVerifyChecking(false);
        return;
      }

      // Code verified - now finalize claim
      await handleFinalizeClaim();
    } catch {
      setVerifyError("Verification failed");
      setVerifyChecking(false);
    }
  };

  // Finalize claim after code verification
  const handleFinalizeClaim = async () => {
    if (!claimingProvider) return;

    try {
      const res = await fetch("/api/claim/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: claimingProvider.provider_id,
          sessionId: claimSession,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // User needs to authenticate
        if (data.requiresAuth) {
          setAuthEmail(data.email || "");
          setStep("auth");
          return;
        }
        setVerifyError(data.error || "Failed to complete claim");
        setVerifyChecking(false);
        return;
      }

      // Successfully claimed - refresh and redirect to portal
      await refreshAccountData();
      router.push(`/provider/medjobs/candidates/${candidateSlug}?schedule=true`);
    } catch {
      setVerifyError("Failed to complete claim");
      setVerifyChecking(false);
    }
  };

  // Handle create account submission
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createName.trim()) return;

    setCreateSubmitting(true);
    setCreateError("");

    // Save to auth flow
    setAuthEmail(createEmail.trim());
    setStep("auth");
    setCreateSubmitting(false);
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!authEmail) return;

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
      }
    } catch {
      setAuthError("Failed to send code");
    } finally {
      setAuthSending(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!authEmail || authCode.length !== 6) return;

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

      // Successfully authenticated
      // If we were claiming, finalize claim
      if (claimingProvider) {
        await handleFinalizeClaim();
      } else {
        // Creating new account - call create profile API
        const res = await fetch("/api/auth/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "organization",
            displayName: createName.trim(),
            city: createCity || undefined,
            state: createState || undefined,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setAuthError(data.error || "Failed to create profile");
          setAuthVerifying(false);
          return;
        }

        await refreshAccountData();
        router.push(`/provider/medjobs/candidates/${candidateSlug}?schedule=true`);
      }
    } catch {
      setAuthError("Verification failed");
      setAuthVerifying(false);
    }
  };

  // Auto-send OTP when entering auth step
  useEffect(() => {
    if (step === "auth" && authEmail && !authSent && !authSending) {
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, authEmail]);

  // If user is already authenticated during the flow, redirect
  useEffect(() => {
    if (user && isOpen) {
      // User authenticated mid-flow, redirect to portal
      router.push(`/provider/medjobs/candidates/${candidateSlug}?schedule=true`);
    }
  }, [user, isOpen, router, candidateSlug]);

  const renderStep = () => {
    switch (step) {
      case "search":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Schedule an interview with {firstName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Find your business or create an account to get started
              </p>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business name
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Sunrise Senior Living"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="relative" ref={locationDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City or state <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={locationQuery}
                  onChange={(e) => {
                    setLocationQuery(e.target.value);
                    setShowLocationDropdown(true);
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  placeholder="e.g., Dallas, TX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
                {showLocationDropdown && cityResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
                    {cityResults.map((c) => (
                      <button
                        key={`${c.city}-${c.state}`}
                        type="button"
                        onClick={() => {
                          setLocationQuery(`${c.city}, ${c.state}`);
                          setShowLocationDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        {c.city}, {c.state}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={searching || (!searchQuery.trim() && !locationQuery.trim())}
              >
                {searching ? "Searching..." : "Search"}
              </Button>
            </form>

            {/* Search results */}
            {hasSearched && (
              <div className="space-y-3">
                {searchError && (
                  <p className="text-sm text-red-600">{searchError}</p>
                )}

                {searchResults.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-500">
                      {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} found
                    </p>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((provider) => {
                        const isClaimed = claimedIds.has(provider.provider_id);
                        const imgUrl = getProviderImage(provider);
                        return (
                          <div
                            key={provider.provider_id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                          >
                            <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                              {imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={provider.provider_name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-medium">
                                  {provider.provider_name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {provider.provider_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {[provider.city, provider.state].filter(Boolean).join(", ")}
                              </p>
                            </div>
                            {isClaimed ? (
                              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                                Claimed
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartClaim(provider)}
                                className="px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                              >
                                This is me
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No businesses found.</p>
                )}

                {/* Create new option */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateName(searchQuery);
                      setStep("create");
                    }}
                    className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    Don&apos;t see your business? Create a new account →
                  </button>
                </div>
              </div>
            )}

            {/* Direct create option */}
            {!hasSearched && (
              <div className="pt-4 border-t border-gray-200 text-center">
                <button
                  type="button"
                  onClick={() => setStep("create")}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Skip search and create account →
                </button>
              </div>
            )}
          </div>
        );

      case "claim-verify":
        return (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => {
                setStep("search");
                setClaimingProvider(null);
              }}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Verify your business
              </h2>
              {claimingProvider && (
                <p className="text-sm text-gray-500 mt-1">
                  Claiming: {claimingProvider.provider_name}
                </p>
              )}
            </div>

            {verifySending ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-3">Sending verification code...</p>
              </div>
            ) : verifyNoEmail ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  We don&apos;t have an email on file for this business.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Please contact us at{" "}
                  <a href="mailto:hello@olera.care" className="text-primary-600 hover:underline">
                    hello@olera.care
                  </a>{" "}
                  to verify your ownership.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium">{verifyEmailHint || "your email"}</span>
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
                  className="w-full"
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
            <button
              type="button"
              onClick={() => setStep("search")}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Create your account
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Set up a provider account to schedule interviews
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business email
                </label>
                <input
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use your work email for faster verification
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Business name
                </label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Your company name"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
              </div>

              <div className="relative" ref={cityPickerRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={createCity}
                  onChange={(e) => {
                    setCreateCity(e.target.value);
                    setShowCityPicker(true);
                  }}
                  onFocus={() => setShowCityPicker(true)}
                  placeholder="e.g., Dallas"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                />
                {showCityPicker && cityPickerResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
                    {cityPickerResults.map((c) => (
                      <button
                        key={`${c.city}-${c.state}`}
                        type="button"
                        onClick={() => {
                          setCreateCity(c.city);
                          setCreateState(c.state);
                          setShowCityPicker(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors"
                      >
                        {c.city}, {c.state}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={!createEmail.trim() || !createName.trim() || createSubmitting}
              >
                {createSubmitting ? "Creating..." : "Continue"}
              </Button>
            </form>
          </div>
        );

      case "auth":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Verify your email
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {authSent
                  ? `Enter the code sent to ${authEmail}`
                  : `We'll send a code to ${authEmail}`}
              </p>
            </div>

            {!authSent ? (
              <div className="space-y-4">
                {authSending ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500 mt-3">Sending code...</p>
                  </div>
                ) : (
                  <>
                    {authError && (
                      <p className="text-sm text-red-600 text-center">{authError}</p>
                    )}
                    <Button onClick={handleSendOtp} className="w-full">
                      Send verification code
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
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
                  className="w-full"
                >
                  {authVerifying ? "Verifying..." : "Verify & Continue"}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthSent(false);
                    setAuthCode("");
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700"
                >
                  Didn&apos;t receive code? Send again
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="lg"
    >
      <div className="py-2">
        {renderStep()}
      </div>
    </Modal>
  );
}
