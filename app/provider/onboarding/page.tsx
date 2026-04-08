"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useCitySearch } from "@/hooks/use-city-search";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import type { Provider } from "@/lib/types/provider";

// ============================================================
// Types
// ============================================================

type Screen = "search" | "results" | "check-email";

interface FormData {
  orgName: string;
  city: string;
  state: string;
  email: string;
}

// Search result from olera-providers
interface ProviderMatch extends Provider {
  _source: "olera-providers";
  _claimed: boolean;
  _emailMatch: boolean;
}

// Search result from business_profiles
interface BusinessProfileMatch {
  id: string;
  display_name: string;
  slug: string;
  city: string | null;
  state: string | null;
  email: string | null;
  image_url: string | null;
  account_id: string | null;
  source_provider_id: string | null;
  claim_state: string | null;
  _source: "business_profiles";
  _claimed: boolean;
  _emailMatch: boolean;
}

type SearchResult = ProviderMatch | BusinessProfileMatch;

const EMPTY_FORM: FormData = {
  orgName: "",
  city: "",
  state: "",
  email: "",
};

// ============================================================
// Main Component (with Suspense wrapper)
// ============================================================

export default function ProviderOnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProviderOnboardingContent />
    </Suspense>
  );
}

function ProviderOnboardingContent() {
  const router = useRouter();
  const { openAuth } = useAuth();

  // Screen state
  const [screen, setScreen] = useState<Screen>("search");
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track loading by slug

  // Form data (persists across screens)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  // Search state
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // City picker state
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const [cityQuery, setCityQuery] = useState("");
  const { results: cityResults, preload: preloadCities } = useCitySearch(cityQuery);

  useClickOutside(cityDropdownRef, () => setShowCityDropdown(false));

  // Action/API error state
  const [actionError, setActionError] = useState("");

  // Resend email state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState("");

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ──────────────────────────────────────────────────────────
  // Form Handlers
  // ──────────────────────────────────────────────────────────

  const handleCitySelect = useCallback((city: string, state: string) => {
    setFormData(prev => ({ ...prev, city, state }));
    setCityQuery(`${city}, ${state}`);
    setShowCityDropdown(false);
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    let { orgName, city, state, email } = formData;

    // Auto-parse city/state from cityQuery if user typed manually without selecting
    if ((!city || !state) && cityQuery.trim()) {
      const parts = cityQuery.split(",").map(s => s.trim());
      if (parts.length >= 2) {
        city = parts[0];
        state = parts[1];
        // Update formData for consistency
        setFormData(prev => ({ ...prev, city, state }));
      } else if (parts.length === 1 && parts[0].length === 2) {
        // Just a state abbreviation
        state = parts[0].toUpperCase();
        setFormData(prev => ({ ...prev, state }));
      }
    }

    // Validation
    if (!orgName.trim()) {
      setSearchError("Organization name is required.");
      return;
    }
    if (!city.trim() || !state.trim()) {
      setSearchError("Please select a city and state from the dropdown.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setSearchError("A valid email is required.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setSearchError("Database not configured.");
      return;
    }

    setSearching(true);
    setSearchError("");

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = orgName.trim();
      const normalizedCity = city.trim();
      const normalizedState = state.trim();

      // Escape special characters for Postgres LIKE/ILIKE patterns
      const escapeLike = (str: string) => str.replace(/[%_\\]/g, "\\$&");
      const escapedName = escapeLike(normalizedName);

      // ═══════════════════════════════════════════════════════
      // Query 1: olera-providers (scraped listings)
      // Run two separate queries and merge (safer than OR with special chars)
      // ═══════════════════════════════════════════════════════
      const [nameMatchResult, emailMatchResult] = await Promise.all([
        // Name match
        supabase
          .from("olera-providers")
          .select("*")
          .not("deleted", "is", true)
          .ilike("provider_name", `%${escapedName}%`)
          .limit(15),
        // Email match
        supabase
          .from("olera-providers")
          .select("*")
          .not("deleted", "is", true)
          .eq("email", normalizedEmail)
          .limit(5),
      ]);

      // Merge and dedupe providers
      const providerMap = new Map<string, Provider>();
      for (const p of [...(emailMatchResult.data || []), ...(nameMatchResult.data || [])]) {
        if (!providerMap.has(p.provider_id)) {
          providerMap.set(p.provider_id, p as Provider);
        }
      }
      const providers = Array.from(providerMap.values());

      if (nameMatchResult.error) {
        console.error("Provider name search error:", nameMatchResult.error);
      }
      if (emailMatchResult.error) {
        console.error("Provider email search error:", emailMatchResult.error);
      }

      // ═══════════════════════════════════════════════════════
      // Query 2: business_profiles (claimed/created profiles)
      // ═══════════════════════════════════════════════════════
      const [bpNameResult, bpEmailResult] = await Promise.all([
        supabase
          .from("business_profiles")
          .select("id, display_name, slug, city, state, email, image_url, account_id, source_provider_id, claim_state")
          .in("type", ["organization", "caregiver"])
          .ilike("display_name", `%${escapedName}%`)
          .limit(15),
        supabase
          .from("business_profiles")
          .select("id, display_name, slug, city, state, email, image_url, account_id, source_provider_id, claim_state")
          .in("type", ["organization", "caregiver"])
          .eq("email", normalizedEmail)
          .limit(5),
      ]);

      // Merge and dedupe profiles
      const profileMap = new Map<string, typeof bpNameResult.data extends (infer T)[] | null ? T : never>();
      for (const bp of [...(bpEmailResult.data || []), ...(bpNameResult.data || [])]) {
        if (!profileMap.has(bp.id)) {
          profileMap.set(bp.id, bp);
        }
      }
      const profiles = Array.from(profileMap.values());

      if (bpNameResult.error) {
        console.error("Profile name search error:", bpNameResult.error);
      }
      if (bpEmailResult.error) {
        console.error("Profile email search error:", bpEmailResult.error);
      }

      // ═══════════════════════════════════════════════════════
      // Query 3: Check which olera-providers are already claimed
      // ═══════════════════════════════════════════════════════
      const providerIds = (providers || []).map(p => p.provider_id);
      let claimedProviderIds = new Set<string>();

      if (providerIds.length > 0) {
        const { data: claimedProfiles } = await supabase
          .from("business_profiles")
          .select("source_provider_id")
          .in("source_provider_id", providerIds)
          .eq("claim_state", "claimed");

        claimedProviderIds = new Set(
          (claimedProfiles || [])
            .map(p => p.source_provider_id)
            .filter(Boolean) as string[]
        );
      }

      // ═══════════════════════════════════════════════════════
      // Merge & Deduplicate Results
      // ═══════════════════════════════════════════════════════
      const results: SearchResult[] = [];
      const seenSlugs = new Set<string>();

      // Add olera-providers (exclude those with a claimed business_profile)
      for (const p of providers || []) {
        const slug = p.slug || p.provider_id;
        if (seenSlugs.has(slug)) continue;

        // Skip if this provider has a claimed business_profile (we'll show that instead)
        const isClaimed = claimedProviderIds.has(p.provider_id);
        const hasClaimedBP = (profiles || []).some(
          bp => bp.source_provider_id === p.provider_id && bp.claim_state === "claimed"
        );
        if (hasClaimedBP) continue;

        seenSlugs.add(slug);
        results.push({
          ...p,
          _source: "olera-providers",
          _claimed: isClaimed,
          _emailMatch: p.email?.toLowerCase() === normalizedEmail,
        });
      }

      // Add business_profiles
      for (const bp of profiles || []) {
        const slug = bp.slug;
        if (seenSlugs.has(slug)) continue;

        seenSlugs.add(slug);
        results.push({
          ...bp,
          _source: "business_profiles",
          _claimed: bp.claim_state === "claimed" && !!bp.account_id,
          _emailMatch: bp.email?.toLowerCase() === normalizedEmail,
        });
      }

      // ═══════════════════════════════════════════════════════
      // Sort: Email matches first, then by city match, then name
      // ═══════════════════════════════════════════════════════
      results.sort((a, b) => {
        // Email match priority (highest)
        if (a._emailMatch && !b._emailMatch) return -1;
        if (!a._emailMatch && b._emailMatch) return 1;

        // City match priority
        const aCityMatch = a.city?.toLowerCase() === normalizedCity.toLowerCase();
        const bCityMatch = b.city?.toLowerCase() === normalizedCity.toLowerCase();
        if (aCityMatch && !bCityMatch) return -1;
        if (!aCityMatch && bCityMatch) return 1;

        // State match as tiebreaker
        const aStateMatch = a.state?.toLowerCase() === normalizedState.toLowerCase();
        const bStateMatch = b.state?.toLowerCase() === normalizedState.toLowerCase();
        if (aStateMatch && !bStateMatch) return -1;
        if (!aStateMatch && bStateMatch) return 1;

        return 0;
      });

      setSearchResults(results);
      setScreen("results");

    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }, [formData]);

  // ──────────────────────────────────────────────────────────
  // Screen 1: Search Form
  // ──────────────────────────────────────────────────────────

  if (screen === "search") {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Minimal sticky nav */}
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

        <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-16">
          <div className="w-full max-w-xl animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8 lg:mb-12">
              <h1 className="text-2xl lg:text-4xl font-display font-bold text-gray-900 tracking-tight">
                Find your organization
              </h1>
              <p className="text-gray-500 mt-4 lg:mt-6 text-base lg:text-lg leading-relaxed max-w-md mx-auto">
                Search our directory of 50,000+ providers. Claim your listing or create a new one.
              </p>
            </div>

            {/* Search Form Card */}
            <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-gray-200/80 p-6 md:p-8 space-y-5">
              {/* Organization Name */}
              <div className="space-y-2">
                <label htmlFor="orgName" className="block text-base font-semibold text-gray-900">
                  Organization name
                </label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <input
                    id="orgName"
                    type="text"
                    value={formData.orgName}
                    onChange={(e) => setFormData(prev => ({ ...prev, orgName: e.target.value }))}
                    placeholder="e.g., Sunrise Senior Living"
                    autoComplete="organization"
                    className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                    required
                  />
                </div>
              </div>

              {/* City, State */}
              <div className="space-y-2">
                <label htmlFor="city" className="block text-base font-semibold text-gray-900">
                  City, State
                </label>
                <div className="relative" ref={cityDropdownRef}>
                  <div className={`flex items-center px-4 py-3 bg-gray-50 rounded-xl border transition-colors ${
                    showCityDropdown ? "border-primary-400 ring-2 ring-primary-100" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      ref={cityInputRef}
                      id="city"
                      type="text"
                      value={cityQuery}
                      onChange={(e) => {
                        setCityQuery(e.target.value);
                        setShowCityDropdown(true);
                        // Clear structured data if user is typing
                        if (formData.city || formData.state) {
                          setFormData(prev => ({ ...prev, city: "", state: "" }));
                        }
                      }}
                      onFocus={() => {
                        preloadCities();
                        setShowCityDropdown(true);
                      }}
                      placeholder="e.g., Austin, TX"
                      autoComplete="off"
                      className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                      required
                    />
                  </div>

                  {/* City Dropdown */}
                  {showCityDropdown && cityResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 max-h-[280px] overflow-y-auto">
                      {!cityQuery.trim() && (
                        <div className="px-4 pt-1 pb-2">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Popular cities</span>
                        </div>
                      )}
                      {cityResults.map((city, idx) => (
                        <button
                          key={`${city.city}-${city.state}-${idx}`}
                          type="button"
                          onClick={() => handleCitySelect(city.city, city.state)}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left text-base hover:bg-gray-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>
                            <span className="font-medium text-gray-700">{city.city}</span>
                            <span className="text-gray-500">, {city.state}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-base font-semibold text-gray-900">
                  Your business email
                </label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@yourorganization.com"
                    autoComplete="email"
                    className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 ml-1">We&apos;ll send a verification link to this email</p>
              </div>

              {/* Error */}
              {searchError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-red-700">{searchError}</p>
                </div>
              )}

              {/* Submit */}
              <Button type="submit" size="lg" fullWidth loading={searching}>
                Find Your Organization
              </Button>
            </form>

            {/* Or create new link */}
            <p className="text-center mt-6 text-base text-gray-500">
              or{" "}
              <button
                type="button"
                onClick={() => setScreen("check-email")}
                className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                create a new listing
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Screen 2: Search Results
  // ──────────────────────────────────────────────────────────

  // Helper to get provider image
  const getProviderImage = (result: SearchResult): string | null => {
    if (result._source === "business_profiles") {
      return result.image_url || null;
    }
    // olera-providers: images are pipe-separated
    const images = result.provider_images;
    if (!images) return null;
    const first = images.split("|")[0]?.trim();
    return first || null;
  };

  // Determine button action based on email match + claimed status
  const getResultAction = (result: SearchResult): {
    label: string;
    variant: "primary" | "secondary" | "ghost";
    action: "sign-in" | "manage" | "dispute";
  } => {
    if (result._emailMatch && result._claimed) {
      // Email matches AND already claimed = they own it, sign in
      return { label: "Sign In", variant: "primary", action: "sign-in" };
    }
    if (result._emailMatch && !result._claimed) {
      // Email matches but not claimed = high priority manage
      return { label: "Manage", variant: "primary", action: "manage" };
    }
    if (!result._emailMatch && !result._claimed) {
      // Name match, unclaimed = can manage
      return { label: "Manage", variant: "secondary", action: "manage" };
    }
    // Name match but claimed by someone else = dispute
    return { label: "Dispute", variant: "ghost", action: "dispute" };
  };

  // Handle result card action
  const handleResultAction = async (result: SearchResult, action: "sign-in" | "manage" | "dispute") => {
    const slug = result._source === "olera-providers"
      ? (result.slug || result.provider_id)
      : result.slug;

    // Get email - prefer result's email, fallback to search form email
    const email = result.email || formData.email;

    setActionLoading(slug);
    setActionError("");

    if (action === "sign-in") {
      // Open auth modal for sign-in flow
      // After auth, default routing will send them to /provider if they have a provider profile
      openAuth({
        defaultMode: "sign-in",
        initialEmail: email,
      });
      setActionLoading(null);
    } else if (action === "manage") {
      // Send claim verification email via API
      try {
        const res = await fetch("/api/provider/send-claim-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            email: formData.email, // Always use the email they entered in the form
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          // Handle specific error cases
          if (res.status === 409) {
            // Already claimed - redirect to sign in
            setActionError("This listing has already been claimed. Please sign in instead.");
            setActionLoading(null);
            return;
          }
          if (res.status === 429) {
            setActionError("Too many emails sent. Please wait a few minutes and try again.");
            setActionLoading(null);
            return;
          }
          throw new Error(data.error || "Failed to send verification email");
        }

        // Success - store selected provider and show Screen 3
        setSelectedResult(result);
        setActionLoading(null);
        setActionError(""); // Clear any previous action errors
        setResendCooldown(60); // Start cooldown since email was just sent
        setResendError("");
        setScreen("check-email");
      } catch (err) {
        console.error("[handleResultAction] Claim email error:", err);
        setActionError(err instanceof Error ? err.message : "Failed to send verification email. Please try again.");
        setActionLoading(null);
      }
    } else if (action === "dispute") {
      // Redirect to dispute flow
      router.push(`/for-providers/dispute/${slug}`);
      // Don't clear loading - navigating away
    }
  };

  // Handle creating a new listing (no existing result selected)
  const handleCreateNew = async () => {
    setActionLoading("create-new");
    setActionError("");

    try {
      const res = await fetch("/api/provider/send-claim-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: "new",
          email: formData.email,
          orgName: formData.orgName,
          city: formData.city,
          state: formData.state,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setActionError("Too many emails sent. Please wait a few minutes and try again.");
          setActionLoading(null);
          return;
        }
        throw new Error(data.error || "Failed to send verification email");
      }

      // Success - clear selected result (creating new) and show Screen 3
      setSelectedResult(null);
      setActionLoading(null);
      setActionError(""); // Clear any previous action errors
      setResendCooldown(60); // Start cooldown since email was just sent
      setResendError("");
      setScreen("check-email");
    } catch (err) {
      console.error("[handleCreateNew] Signup email error:", err);
      setActionError(err instanceof Error ? err.message : "Failed to send verification email. Please try again.");
      setActionLoading(null);
    }
  };

  // Handle resending verification email (from Screen 3)
  const handleResendEmail = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setResendError("");

    try {
      // Determine if this is a claim (selectedResult) or create new (no selectedResult)
      const isClaim = selectedResult !== null;
      const slug = isClaim
        ? (selectedResult._source === "olera-providers"
            ? (selectedResult.slug || selectedResult.provider_id)
            : selectedResult.slug)
        : "new";

      const body: Record<string, unknown> = {
        slug,
        email: formData.email,
      };

      // For "new" signup, include org details
      if (!isClaim) {
        body.orgName = formData.orgName;
        body.city = formData.city;
        body.state = formData.state;
      }

      const res = await fetch("/api/provider/send-claim-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setResendError("Too many emails sent. Please wait before trying again.");
        } else {
          throw new Error(data.error || "Failed to resend email");
        }
        return;
      }

      // Success - set cooldown
      setResendCooldown(60);
    } catch (err) {
      console.error("[handleResendEmail] Error:", err);
      setResendError(err instanceof Error ? err.message : "Failed to resend email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (screen === "results") {
    // Separate email matches (priority) from other matches
    const emailMatches = searchResults.filter(r => r._emailMatch);
    const otherMatches = searchResults.filter(r => !r._emailMatch);

    return (
      <div className="min-h-screen flex flex-col bg-vanilla-100">
        {/* Minimal sticky nav */}
        <nav className="sticky top-0 z-50 border-b border-gray-200/60 bg-vanilla-100/95 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/olera-logo.png" alt="Olera" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors bg-white"
            >
              Exit
            </Link>
          </div>
        </nav>

        <div className="flex-1 px-4 py-8 md:py-12">
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Back button + Header */}
            <div className="mb-8">
              <button
                onClick={() => setScreen("search")}
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5 mb-4 group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to search
              </button>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-2">
                {searchResults.length === 0 ? "No results found" : "Select your organization"}
              </h1>
              <p className="text-gray-600">
                {searchResults.length === 0
                  ? `We couldn't find "${formData.orgName}" in ${formData.city}, ${formData.state}.`
                  : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""} for "${formData.orgName}" near ${formData.city}, ${formData.state}`
                }
              </p>
            </div>

            {/* Action error display (for Manage failures) */}
            {actionError && searchResults.length > 0 && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-red-700">{actionError}</p>
              </div>
            )}

            {/* Results List */}
            <div className="space-y-4">
              {searchResults.length === 0 ? (
                /* No results - Create new CTA */
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No matching listings</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    We don&apos;t have a listing for your organization yet. Create one to start connecting with families.
                  </p>
                  {actionError && (
                    <p className="text-sm text-red-600 mb-4">{actionError}</p>
                  )}
                  <Button
                    size="lg"
                    onClick={handleCreateNew}
                    loading={actionLoading === "create-new"}
                  >
                    Create Your Listing
                  </Button>
                </div>
              ) : (
                <>
                  {/* Email matches section (if any) */}
                  {emailMatches.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm font-medium text-primary-700 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Matched by email
                      </p>
                      <div className="space-y-3">
                        {emailMatches.map((result) => {
                          const name = result._source === "olera-providers" ? result.provider_name : result.display_name;
                          const location = [result.city, result.state].filter(Boolean).join(", ");
                          const slug = result._source === "olera-providers" ? (result.slug || result.provider_id) : result.slug;
                          const image = getProviderImage(result);
                          const { label, variant, action } = getResultAction(result);
                          const isLoading = actionLoading === slug;

                          return (
                            <div
                              key={slug}
                              className="bg-white rounded-xl overflow-hidden border-2 border-primary-200 ring-2 ring-primary-50 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex">
                                {/* Image - horizontal layout matching old page */}
                                <div className="w-28 sm:w-36 min-h-[100px] sm:min-h-[130px] shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative">
                                  {image ? (
                                    <Image
                                      src={image}
                                      alt={name}
                                      fill
                                      className="object-cover"
                                      sizes="144px"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                        <span className="text-base sm:text-lg font-bold text-primary-400">
                                          {(name || "")
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
                                <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col">
                                  {location && (
                                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{location}</p>
                                  )}
                                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1">
                                    {name}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    {result._claimed ? "Sign in to manage." : "Verify to claim."}
                                  </p>
                                  <div className="flex-1 min-h-2" />
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleResultAction(result, action)}
                                      disabled={isLoading}
                                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                                        variant === "primary"
                                          ? "text-white bg-primary-600 hover:bg-primary-500"
                                          : "text-primary-600 ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50"
                                      } disabled:opacity-50`}
                                    >
                                      {isLoading ? "..." : `${label} →`}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Other matches section */}
                  {otherMatches.length > 0 && (
                    <div>
                      {emailMatches.length > 0 && (
                        <p className="text-sm font-medium text-gray-500 mb-3">Other matches</p>
                      )}
                      <div className="space-y-3">
                        {otherMatches.map((result) => {
                          const name = result._source === "olera-providers" ? result.provider_name : result.display_name;
                          const location = [result.city, result.state].filter(Boolean).join(", ");
                          const slug = result._source === "olera-providers" ? (result.slug || result.provider_id) : result.slug;
                          const image = getProviderImage(result);
                          const { label, variant, action } = getResultAction(result);
                          const isLoading = actionLoading === slug;

                          return (
                            <div
                              key={slug}
                              className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                            >
                              <div className="flex">
                                {/* Image - horizontal layout matching old page */}
                                <div className="w-28 sm:w-36 min-h-[100px] sm:min-h-[130px] shrink-0 bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative">
                                  {image ? (
                                    <Image
                                      src={image}
                                      alt={name}
                                      fill
                                      className="object-cover"
                                      sizes="144px"
                                    />
                                  ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
                                        <span className="text-base sm:text-lg font-bold text-primary-400">
                                          {(name || "")
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
                                <div className="flex-1 p-3 sm:p-4 min-w-0 flex flex-col">
                                  {location && (
                                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5">{location}</p>
                                  )}
                                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-1">
                                    {name}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                    {result._claimed ? "Managed by another account." : "Unclaimed page."}
                                  </p>
                                  <div className="flex-1 min-h-2" />
                                  <div className="flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleResultAction(result, action)}
                                      disabled={isLoading}
                                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                                        action === "dispute"
                                          ? "text-amber-600 ring-1 ring-amber-200 hover:ring-amber-300 hover:bg-amber-50"
                                          : "text-primary-600 ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50"
                                      } disabled:opacity-50`}
                                    >
                                      {isLoading ? "..." : `${label} →`}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Create new option */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-white/60 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:border-gray-400 hover:bg-white/80 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Don&apos;t see your organization?</h4>
                      <p className="text-sm text-gray-500 mb-4">Create a new listing to get started on Olera</p>
                      <Button
                        variant="secondary"
                        onClick={handleCreateNew}
                        loading={actionLoading === "create-new"}
                      >
                        Create New Listing
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Screen 3: Check Your Email (stub for now)
  // ──────────────────────────────────────────────────────────

  if (screen === "check-email") {
    // Mask email: show first 2 chars, mask middle, show domain
    const maskEmail = (email: string): string => {
      const [local, domain] = email.split("@");
      if (!domain) return "***@***.com";
      if (local.length <= 2) {
        return `${local[0] || "*"}***@${domain}`;
      }
      return `${local.slice(0, 2)}${"*".repeat(Math.min(local.length - 2, 5))}@${domain}`;
    };
    const maskedEmail = maskEmail(formData.email);

    // Determine if this is a claim (selectedResult exists) or create (no selectedResult)
    const isClaim = selectedResult !== null;
    const providerName = selectedResult
      ? (selectedResult._source === "olera-providers" ? selectedResult.provider_name : selectedResult.display_name)
      : formData.orgName;

    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
        {/* Minimal sticky nav */}
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

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md mx-auto text-center animate-fade-in">
            {/* Email icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>

            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-3">
              Check your email
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              We sent a verification link to <span className="font-semibold text-gray-900">{maskedEmail}</span>
            </p>
            {providerName && (
              <p className="text-gray-500 mb-6">
                {isClaim
                  ? <>Click the link to verify you manage <strong className="text-gray-700">{providerName}</strong>.</>
                  : <>Click the link to finish setting up <strong className="text-gray-700">{providerName}</strong>.</>
                }
              </p>
            )}
            {!providerName && (
              <p className="text-gray-500 mb-6">
                Click the link in your email to continue setting up your profile.
              </p>
            )}

            {/* Tips */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">Didn&apos;t get the email?</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Check your spam or promotions folder</li>
                <li>• Make sure <span className="font-medium text-gray-600">{formData.email}</span> is correct</li>
              </ul>
            </div>

            {/* Resend button */}
            {resendError && (
              <p className="text-sm text-red-600 mb-4">{resendError}</p>
            )}
            <Button
              variant="secondary"
              onClick={handleResendEmail}
              disabled={resendCooldown > 0 || resending}
            >
              {resending
                ? "Sending..."
                : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend email"
              }
            </Button>

            {/* Back link */}
            <div className="mt-6">
              <button
                onClick={() => setScreen("results")}
                className="text-primary-600 hover:text-primary-700 font-medium text-base"
              >
                &larr; Back to results
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
