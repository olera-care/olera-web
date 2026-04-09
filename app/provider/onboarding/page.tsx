"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useCitySearch } from "@/hooks/use-city-search";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import OrganizationSearch, { type SelectedOrg } from "@/components/shared/OrganizationSearch";
import OnboardingBottomNav from "@/components/provider/OnboardingBottomNav";
import type { Provider } from "@/lib/types/provider";
import { useAuth } from "@/components/auth/AuthProvider";

// ============================================================
// Types
// ============================================================

type Screen = "search" | "results" | "preview" | "confirm-claim" | "check-email" | "dispute";

interface FormData {
  orgName: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  careTypes: string[];
}

// Care categories for the preview form (from NavMenuData)
const CARE_TYPE_OPTIONS = [
  { id: "home-health", label: "Home Health" },
  { id: "home-care", label: "Home Care" },
  { id: "assisted-living", label: "Assisted Living" },
  { id: "memory-care", label: "Memory Care" },
  { id: "nursing-homes", label: "Nursing Homes" },
  { id: "independent-living", label: "Independent Living" },
];

// Role options for dispute form
const DISPUTE_ROLE_OPTIONS = [
  { value: "Owner", label: "Owner" },
  { value: "Administrator", label: "Administrator" },
  { value: "Executive Director", label: "Executive Director" },
  { value: "Office Manager", label: "Office Manager" },
  { value: "Marketing / Communications", label: "Marketing / Communications" },
  { value: "Staff Member", label: "Staff Member" },
  { value: "Other", label: "Other" },
];

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
  phone: "",
  careTypes: [],
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
  const searchParams = useSearchParams();
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

  // Organization autocomplete state
  const [selectedOrg, setSelectedOrg] = useState<SelectedOrg | null>(null);

  // City picker state
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const searchFormRef = useRef<HTMLFormElement>(null);
  const [cityQuery, setCityQuery] = useState("");
  const { results: cityResults, preload: preloadCities } = useCitySearch(cityQuery);

  useClickOutside(cityDropdownRef, () => setShowCityDropdown(false));

  // Action/API error state
  const [actionError, setActionError] = useState("");

  // Resend email state
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState("");

  // Dispute form state
  const [disputingResult, setDisputingResult] = useState<SearchResult | null>(null);
  const [disputeName, setDisputeName] = useState("");
  const [disputeEmail, setDisputeEmail] = useState("");
  const [disputePhone, setDisputePhone] = useState("");
  const [disputeRole, setDisputeRole] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const [disputeError, setDisputeError] = useState("");
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);


  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Pre-fill form from marketing page (sessionStorage)
  useEffect(() => {
    try {
      const prefillKey = "olera_provider_search_prefill";
      const stored = sessionStorage.getItem(prefillKey);
      if (!stored) return;

      const parsed = JSON.parse(stored) as {
        searchQuery?: string;
        locationQuery?: string; // Legacy format
        selectedOrg?: SelectedOrg | null;
      };

      // Clear after reading so it doesn't persist across sessions
      sessionStorage.removeItem(prefillKey);

      // New format: selectedOrg from OrganizationSearch
      if (parsed.selectedOrg) {
        const org = parsed.selectedOrg;
        setSelectedOrg(org);
        setFormData(prev => ({
          ...prev,
          orgName: org.name,
          city: org.city || "",
          state: org.state || "",
        }));
        if (org.city && org.state) {
          setCityQuery(`${org.city}, ${org.state}`);
        }
      } else if (parsed.searchQuery?.trim()) {
        // User typed org name but didn't select from dropdown
        setFormData(prev => ({ ...prev, orgName: parsed.searchQuery!.trim() }));
      }

      // Legacy format: locationQuery (for backwards compatibility)
      if (parsed.locationQuery?.trim() && !parsed.selectedOrg) {
        setCityQuery(parsed.locationQuery.trim());
        const parts = parsed.locationQuery.split(",").map(s => s.trim());
        if (parts.length >= 2) {
          setFormData(prev => ({
            ...prev,
            city: parts[0],
            state: parts[1],
          }));
        }
      }
    } catch {
      // sessionStorage unavailable or parse error — ignore
    }
  }, []);

  // Pre-fill from URL param ?org={slug} (from provider details page links)
  useEffect(() => {
    const orgSlug = searchParams.get("org");
    if (!orgSlug) return;

    // Don't override if we already have a selected org from sessionStorage
    if (selectedOrg) return;

    // Fetch provider data by slug
    const fetchProvider = async () => {
      if (!isSupabaseConfigured()) return;

      try {
        const supabase = createClient();

        // Try business_profiles first (may have been claimed/created)
        const { data: bp } = await supabase
          .from("business_profiles")
          .select("id, display_name, slug, city, state, email, image_url, claim_state, account_id")
          .eq("slug", orgSlug)
          .in("type", ["organization", "caregiver"])
          .maybeSingle();

        if (bp) {
          const isClaimed = bp.claim_state === "claimed" && !!bp.account_id;
          const org: SelectedOrg = {
            name: bp.display_name,
            slug: bp.slug,
            city: bp.city,
            state: bp.state,
            email: bp.email,
            imageUrl: bp.image_url,
            claimState: isClaimed ? "claimed" : (bp.claim_state as "unclaimed" | "pending" | null),
            source: "business_profiles",
            providerId: bp.id,
          };
          setSelectedOrg(org);
          setFormData(prev => ({
            ...prev,
            orgName: org.name,
            city: org.city || "",
            state: org.state || "",
          }));
          if (org.city && org.state) {
            setCityQuery(`${org.city}, ${org.state}`);
          }
          return;
        }

        // Try olera-providers
        const { data: op } = await supabase
          .from("olera-providers")
          .select("provider_id, provider_name, slug, city, state, email, provider_images")
          .eq("slug", orgSlug)
          .not("deleted", "is", true)
          .maybeSingle();

        if (op) {
          // Check if this provider has a claimed business_profile
          const { data: claimedBp } = await supabase
            .from("business_profiles")
            .select("claim_state, account_id")
            .eq("source_provider_id", op.provider_id)
            .maybeSingle();

          const isClaimed = claimedBp?.claim_state === "claimed" && !!claimedBp?.account_id;
          const firstImage = op.provider_images?.split("|")[0]?.trim() || null;

          const org: SelectedOrg = {
            name: op.provider_name,
            slug: op.slug || op.provider_id,
            city: op.city,
            state: op.state,
            email: op.email,
            imageUrl: firstImage,
            claimState: isClaimed ? "claimed" : "unclaimed",
            source: "olera-providers",
            providerId: op.provider_id,
          };
          setSelectedOrg(org);
          setFormData(prev => ({
            ...prev,
            orgName: org.name,
            city: org.city || "",
            state: org.state || "",
          }));
          if (org.city && org.state) {
            setCityQuery(`${org.city}, ${org.state}`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch provider by slug:", err);
      }
    };

    fetchProvider();
  }, [searchParams, selectedOrg]);

  // ──────────────────────────────────────────────────────────
  // Form Handlers
  // ──────────────────────────────────────────────────────────

  const handleCitySelect = useCallback((city: string, state: string) => {
    setFormData(prev => ({ ...prev, city, state }));
    setCityQuery(`${city}, ${state}`);
    setShowCityDropdown(false);
  }, []);

  // Handle organization selection from autocomplete
  const handleOrgSelect = useCallback((org: SelectedOrg | null) => {
    setSelectedOrg(org);
    if (org) {
      // Auto-fill city/state from selected org
      if (org.city && org.state) {
        setFormData(prev => ({ ...prev, city: org.city!, state: org.state! }));
        setCityQuery(`${org.city}, ${org.state}`);
      } else {
        // Org doesn't have city/state - clear fields so user knows to fill them
        setFormData(prev => ({ ...prev, city: "", state: "" }));
        setCityQuery("");
      }
    } else {
      // "Create new" selected - clear city/state so user must enter them
      setFormData(prev => ({ ...prev, city: "", state: "" }));
      setCityQuery("");
    }
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

    // If user selected "Create new" from autocomplete, go directly to preview
    if (selectedOrg === null && formData.orgName.trim()) {
      // Check if they actually interacted with autocomplete (typed enough to trigger it)
      // If selectedOrg is explicitly null (from handleOrgSelect), they chose "Create new"
      // We need to distinguish between "never interacted" and "chose create new"
      // For now, continue with search to find matches
    }

    // If user selected an existing org from autocomplete, create result directly
    if (selectedOrg) {
      const normalizedEmail = email.trim().toLowerCase();
      const emailMatch = selectedOrg.email?.toLowerCase() === normalizedEmail;
      const isClaimed = selectedOrg.claimState === "claimed";

      // Create a search result from the selected org
      const result: SearchResult = selectedOrg.source === "olera-providers"
        ? {
            provider_id: selectedOrg.providerId || selectedOrg.slug,
            provider_name: selectedOrg.name,
            slug: selectedOrg.slug,
            city: selectedOrg.city,
            state: selectedOrg.state,
            email: selectedOrg.email,
            provider_images: selectedOrg.imageUrl || undefined, // For getProviderImage()
            _source: "olera-providers" as const,
            _claimed: isClaimed,
            _emailMatch: emailMatch,
          } as ProviderMatch
        : {
            id: selectedOrg.providerId || selectedOrg.slug,
            display_name: selectedOrg.name,
            slug: selectedOrg.slug,
            city: selectedOrg.city,
            state: selectedOrg.state,
            email: selectedOrg.email,
            image_url: selectedOrg.imageUrl || null,
            account_id: isClaimed ? "claimed" : null, // Simplified - just need to know if claimed
            source_provider_id: selectedOrg.providerId || null,
            claim_state: selectedOrg.claimState,
            _source: "business_profiles" as const,
            _claimed: isClaimed,
            _emailMatch: emailMatch,
          } as BusinessProfileMatch;

      setSearchResults([result]);

      // For unclaimed pre-selected orgs, skip results and go directly to confirm-claim
      if (!isClaimed) {
        setSelectedResult(result);
        setScreen("confirm-claim");
      } else {
        // Claimed orgs still go to results (for dispute/sign-in options)
        setScreen("results");
      }
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

        <div className="flex-1 flex items-center justify-center px-4 pt-12 md:pt-16 pb-24">
          <div className="w-full max-w-xl animate-fade-in">
            {/* Header - changes based on whether org is pre-selected */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
                {selectedOrg
                  ? "Confirm your organization"
                  : "Find your organization"}
              </h1>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {selectedOrg
                  ? "Enter your email to continue."
                  : "Search our directory of 50,000+ providers. Claim your listing or create a new one."}
              </p>
            </div>

            {/* Search Form Card */}
            <form ref={searchFormRef} onSubmit={handleSearch} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg ring-1 ring-gray-200/80 p-6 md:p-8 space-y-5">
              {/* Organization Name - Autocomplete */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Organization name
                </label>
                <OrganizationSearch
                  value={formData.orgName}
                  onChange={(value) => {
                    setFormData(prev => ({ ...prev, orgName: value }));
                    // Clear selected org when user types (they're searching again)
                    if (selectedOrg && value !== selectedOrg.name) {
                      setSelectedOrg(null);
                    }
                  }}
                  onSelect={handleOrgSelect}
                  placeholder="e.g., Sunrise Senior Living"
                  selected={!!selectedOrg && selectedOrg.claimState !== "claimed"}
                />
                {selectedOrg?.claimState === "claimed" && (
                  <p className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    This listing has already been claimed
                  </p>
                )}
              </div>

              {/* City, State */}
              <div className="space-y-2">
                <label htmlFor="city" className="block text-base font-semibold text-gray-900">
                  City, State
                </label>
                {/* Track if city is "completed" (pre-filled from selectedOrg) */}
                {(() => {
                  const cityCompleted = !!(formData.city && formData.state);
                  return (
                <div className="relative" ref={cityDropdownRef}>
                  <div className={`flex items-center px-4 py-3 rounded-xl border transition-colors ${
                    cityCompleted
                      ? "border-2 border-primary-500 bg-primary-50/50"
                      : showCityDropdown
                        ? "border-primary-400 ring-2 ring-primary-100 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                  }`}>
                    <svg className={`w-5 h-5 shrink-0 ${cityCompleted ? "text-primary-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {/* Checkmark for completed state */}
                    {cityCompleted && (
                      <svg className="w-5 h-5 text-primary-600 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
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
                  );
                })()}
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
            </form>

          </div>
        </div>

        {/* Bottom Nav */}
        <OnboardingBottomNav
          primary={{
            label: selectedOrg ? "Continue" : "Find Your Organization",
            onClick: () => searchFormRef.current?.requestSubmit(),
            loading: searching,
            disabled: !formData.email.trim() || !formData.email.includes("@"),
          }}
        />
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

  // Determine button action based on claim state
  // Simplified logic per plan: Unclaimed → Manage, Claimed → Dispute
  const getResultAction = (result: SearchResult): {
    label: string;
    variant: "primary" | "secondary" | "ghost";
    action: "manage" | "dispute";
  } => {
    if (result._claimed) {
      // Claimed by someone → Dispute flow
      return { label: "Dispute", variant: "ghost", action: "dispute" };
    }
    // Unclaimed → Manage flow (primary if email matches, secondary otherwise)
    if (result._emailMatch) {
      return { label: "Manage", variant: "primary", action: "manage" };
    }
    return { label: "Manage", variant: "secondary", action: "manage" };
  };

  // Handle result card action
  const handleResultAction = (result: SearchResult, action: "manage" | "dispute") => {
    const slug = result._source === "olera-providers"
      ? (result.slug || result.provider_id)
      : result.slug;

    setActionError("");

    if (action === "manage") {
      // Navigate to claim confirmation screen
      setSelectedResult(result);
      setScreen("confirm-claim");
    } else if (action === "dispute") {
      // Show inline dispute form instead of navigating away
      setDisputingResult(result);
      setDisputeName("");
      setDisputeEmail(formData.email); // Pre-fill with email from search form
      setDisputePhone("");
      setDisputeRole("");
      setDisputeReason("");
      setDisputeError("");
      setDisputeSubmitted(false);
      setScreen("dispute");
    }
  };

  // Handle sending claim verification email (from confirm-claim screen)
  // Always sends to the user's entered email (collected in search form)
  const handleSendClaimEmail = async () => {
    if (!selectedResult) return;

    const slug = selectedResult._source === "olera-providers"
      ? (selectedResult.slug || selectedResult.provider_id)
      : selectedResult.slug;

    // Always send to user's entered email
    const targetEmail = formData.email.trim().toLowerCase();

    // Check if email matches what's on file - determines verification state
    // Verified = email matches what's on file
    // Unverified = no email on file OR email doesn't match (safer default)
    const providerEmailOnFile = selectedResult.email?.toLowerCase();
    const emailsMatch = providerEmailOnFile && providerEmailOnFile === targetEmail;
    // If emails don't match OR there's no email on file, this becomes a pending claim
    const isPendingClaim = !emailsMatch;

    setActionLoading("confirm-claim");
    setActionError("");

    try {
      const res = await fetch("/api/provider/send-claim-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          email: targetEmail,
          pendingClaim: isPendingClaim, // Flag for limited access if email doesn't match
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
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

      // Success - show check email screen
      setActionLoading(null);
      setActionError("");
      setResendCooldown(60);
      setResendError("");
      setScreen("check-email");
    } catch (err) {
      console.error("[handleSendClaimEmail] Error:", err);
      setActionError(err instanceof Error ? err.message : "Failed to send verification email. Please try again.");
      setActionLoading(null);
    }
  };

  // Handle "Create New Listing" button - navigate to preview screen
  const handleCreateNew = () => {
    setSelectedResult(null); // Clear any selected result
    setActionError("");
    setScreen("preview");
  };

  // Handle preview form submission - actually create the listing
  const handlePreviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading("preview-submit");
    setActionError("");

    // Validation
    if (!formData.orgName.trim()) {
      setActionError("Organization name is required.");
      setActionLoading(null);
      return;
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      setActionError("City and state are required.");
      setActionLoading(null);
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setActionError("A valid email is required.");
      setActionLoading(null);
      return;
    }
    if (formData.careTypes.length === 0) {
      setActionError("Please select at least one care type.");
      setActionLoading(null);
      return;
    }
    // Phone validation (optional field, but validate format if provided)
    if (formData.phone.trim()) {
      // Accept: digits, spaces, dashes, parentheses, dots, plus sign
      // Must have at least 10 digits
      const digitsOnly = formData.phone.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        setActionError("Please enter a valid phone number (10-15 digits).");
        setActionLoading(null);
        return;
      }
    }

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
          phone: formData.phone || undefined,
          careTypes: formData.careTypes,
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

      // Success - show check email screen
      setActionLoading(null);
      setActionError("");
      setResendCooldown(60);
      setResendError("");
      setScreen("check-email");
    } catch (err) {
      console.error("[handlePreviewSubmit] Signup email error:", err);
      setActionError(err instanceof Error ? err.message : "Failed to send verification email. Please try again.");
      setActionLoading(null);
    }
  };

  // Toggle care type selection
  const toggleCareType = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      careTypes: prev.careTypes.includes(typeId)
        ? prev.careTypes.filter(t => t !== typeId)
        : [...prev.careTypes, typeId],
    }));
  };

  // Handle dispute form submission
  const handleDisputeSubmit = async () => {
    if (!disputingResult) return;
    if (!disputeName.trim() || !disputeEmail.trim() || !disputeRole || !disputeReason.trim()) {
      setDisputeError("Please fill in all required fields.");
      return;
    }

    const slug = disputingResult._source === "olera-providers"
      ? (disputingResult.slug || disputingResult.provider_id)
      : disputingResult.slug;
    const name = disputingResult._source === "olera-providers"
      ? disputingResult.provider_name
      : disputingResult.display_name;

    setDisputeSubmitting(true);
    setDisputeError("");

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: slug,
          provider_name: name,
          claimant_name: disputeName.trim(),
          claimant_email: disputeEmail.trim().toLowerCase(),
          claimant_phone: disputePhone.trim() || null,
          claimant_role: disputeRole,
          reason: disputeReason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDisputeError(data.error || "Failed to submit dispute.");
        return;
      }

      setDisputeSubmitted(true);
    } catch {
      setDisputeError("Something went wrong. Please try again.");
    } finally {
      setDisputeSubmitting(false);
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
        body.phone = formData.phone || undefined;
        body.careTypes = formData.careTypes;
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

        <div className="flex-1 px-4 py-8 md:py-12 pb-24">
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
                {searchResults.length === 0
                  ? "Create your listing"
                  : selectedOrg && selectedOrg.claimState === "claimed"
                    ? "This listing is claimed"
                    : "Select your organization"}
              </h1>
              <p className="text-gray-500 mt-2">
                {searchResults.length === 0
                  ? "Let's get your organization set up on Olera."
                  : selectedOrg && selectedOrg.claimState === "claimed"
                    ? "Choose how you'd like to proceed."
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
                  <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-5">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
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
                                    {result._claimed ? "This listing is claimed." : "Verify to claim."}
                                  </p>
                                  <div className="flex-1 min-h-2" />
                                  <div className="flex justify-end gap-2">
                                    {result._claimed ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleResultAction(result, "dispute")}
                                          disabled={isLoading}
                                          className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all text-amber-600 ring-1 ring-amber-200 hover:ring-amber-300 hover:bg-amber-50 disabled:opacity-50"
                                        >
                                          Dispute
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openAuth({ defaultMode: "sign-in" })}
                                          className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all text-primary-600 ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50"
                                        >
                                          Sign in
                                        </button>
                                      </>
                                    ) : (
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
                                    )}
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
                                    {result._claimed ? "This listing is claimed." : "Unclaimed page."}
                                  </p>
                                  <div className="flex-1 min-h-2" />
                                  <div className="flex justify-end gap-2">
                                    {result._claimed ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleResultAction(result, "dispute")}
                                          disabled={isLoading}
                                          className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all text-amber-600 ring-1 ring-amber-200 hover:ring-amber-300 hover:bg-amber-50 disabled:opacity-50"
                                        >
                                          Dispute
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openAuth({ defaultMode: "sign-in" })}
                                          className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all text-primary-600 ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50"
                                        >
                                          Sign in
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleResultAction(result, action)}
                                        disabled={isLoading}
                                        className="px-3 py-1.5 text-sm font-semibold rounded-lg transition-all text-primary-600 ring-1 ring-primary-200 hover:ring-primary-300 hover:bg-primary-50 disabled:opacity-50"
                                      >
                                        {isLoading ? "..." : `${label} →`}
                                      </button>
                                    )}
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

        {/* Bottom Nav */}
        <OnboardingBottomNav
          back={{
            label: "Back",
            onClick: () => {
              setActionError("");
              setScreen("search");
            },
          }}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Screen 2.5: Preview / Complete Your Profile
  // ──────────────────────────────────────────────────────────

  if (screen === "preview") {
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

        <div className="flex-1 px-4 py-8 md:py-12 pb-24">
          <div className="max-w-xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
                Create your listing
              </h1>
              <p className="text-gray-500 mt-2">
                Add your details to start connecting with families.
              </p>
            </div>

            {/* Preview Form */}
            <form id="preview-form" onSubmit={handlePreviewSubmit} className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200/80 p-6 md:p-8 space-y-6">
              {/* Organization Name */}
              <div className="space-y-2">
                <label htmlFor="previewOrgName" className="block text-base font-semibold text-gray-900">
                  Organization name
                </label>
                <input
                  id="previewOrgName"
                  type="text"
                  value={formData.orgName}
                  onChange={(e) => setFormData(prev => ({ ...prev, orgName: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-colors"
                  required
                />
              </div>

              {/* Location (read-only display) - green completed state */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Location
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-xl border-2 border-primary-500 text-gray-700">
                  <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="flex-1">{formData.city}, {formData.state}</span>
                  <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Email (read-only display) - green completed state */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Business email
                </label>
                <div className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-xl border-2 border-primary-500 text-gray-700">
                  <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="flex-1">{formData.email}</span>
                  <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">We&apos;ll send a verification link to this email</p>
              </div>

              {/* Phone Number (new field) */}
              <div className="space-y-2">
                <label htmlFor="previewPhone" className="block text-base font-semibold text-gray-900">
                  Business phone <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <input
                    id="previewPhone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                    className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                  />
                </div>
              </div>

              {/* Care Types (multi-select) */}
              <div className="space-y-3">
                <label className="block text-base font-semibold text-gray-900">
                  What services do you provide? <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 -mt-1">Select all that apply</p>
                <div className="grid grid-cols-2 gap-3">
                  {CARE_TYPE_OPTIONS.map((type) => {
                    const isSelected = formData.careTypes.includes(type.id);
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => toggleCareType(type.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary-500 bg-primary-50 text-primary-700"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "border-primary-500 bg-primary-500"
                            : "border-gray-300 bg-white"
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {actionError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-red-700">{actionError}</p>
                </div>
              )}

              <p className="text-center text-sm text-gray-500">
                By creating a listing, you agree to our{" "}
                <Link href="/terms" className="text-primary-600 hover:text-primary-700 underline">
                  Terms of Service
                </Link>
              </p>
            </form>
          </div>
        </div>

        {/* Bottom Nav */}
        <OnboardingBottomNav
          back={{
            label: "Back",
            onClick: () => {
              setActionError("");
              setScreen("results");
            },
          }}
          primary={{
            label: "Create My Listing",
            onClick: () => (document.getElementById("preview-form") as HTMLFormElement)?.requestSubmit(),
            loading: actionLoading === "preview-submit",
          }}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Screen 2.75: Confirm Claim (for "Manage" flow)
  // ──────────────────────────────────────────────────────────

  if (screen === "confirm-claim" && selectedResult) {
    const providerName = selectedResult._source === "olera-providers"
      ? selectedResult.provider_name
      : selectedResult.display_name;
    const location = [selectedResult.city, selectedResult.state].filter(Boolean).join(", ");
    const providerImage = selectedResult._source === "olera-providers"
      ? selectedResult.provider_images?.split("|")[0]?.trim() || null
      : selectedResult.image_url;

    // Simple confirmation: always send to the email the user entered in the search form
    const userEmail = formData.email;

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

        <div className="flex-1 px-4 py-8 md:py-12 pb-24">
          <div className="max-w-lg mx-auto animate-fade-in">
            {/* Provider Card Preview */}
            <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200/80 overflow-hidden">
              {/* Provider header */}
              <div className="flex items-center gap-4 p-5 border-b border-gray-100">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-50 via-gray-50 to-warm-50 relative shrink-0 overflow-hidden">
                  {providerImage ? (
                    <Image
                      src={providerImage}
                      alt={providerName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-400">
                        {(providerName || "")
                          .split(/\s+/)
                          .map((w) => w[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{providerName}</h2>
                  {location && <p className="text-sm text-gray-500">{location}</p>}
                </div>
              </div>

              {/* Claim confirmation */}
              <div className="p-5 space-y-5">
                <div className="text-center">
                  <h3 className="text-xl font-display font-bold text-gray-900 tracking-tight">Claim this listing</h3>
                  <p className="text-gray-500 mt-2">
                    We&apos;ll email you a link to access your dashboard.
                  </p>
                </div>

                {/* Email confirmation display */}
                <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 rounded-xl border border-primary-200">
                  <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-900 font-medium">{userEmail}</span>
                </div>

                {/* Error */}
                {actionError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm text-red-700">{actionError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <OnboardingBottomNav
          back={{
            label: "Back",
            onClick: () => {
              setActionError("");
              // For pre-selected unclaimed orgs, go back to search (they skipped results)
              setScreen(selectedOrg && selectedOrg.claimState !== "claimed" ? "search" : "results");
            },
          }}
          primary={{
            label: "Send Verification Email",
            onClick: handleSendClaimEmail,
            loading: actionLoading === "confirm-claim",
          }}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Screen 3: Check Your Email
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

            <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
              Check your email
            </h1>
            <p className="text-gray-500 mt-2 mb-2">
              We sent a verification link to <span className="font-semibold text-gray-900">{maskedEmail}</span>
            </p>
            {providerName && (
              <p className="text-gray-500 mb-6">
                {isClaim
                  ? <>Click the link to start managing <strong className="text-gray-700">{providerName}</strong>.</>
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
          </div>
        </div>

        {/* Bottom Nav */}
        <OnboardingBottomNav
          back={{
            label: "Back",
            onClick: () => {
              setResendError("");
              // For pre-selected unclaimed orgs claiming, go back to confirm-claim (they skipped results)
              if (selectedOrg && selectedOrg.claimState !== "claimed" && selectedResult) {
                setScreen("confirm-claim");
              } else {
                setScreen(selectedResult ? "results" : "preview");
              }
            },
          }}
        />
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Screen: Dispute (inline dispute form with amber styling)
  // ──────────────────────────────────────────────────────────

  if (screen === "dispute" && disputingResult) {
    const disputeProviderName = disputingResult._source === "olera-providers"
      ? disputingResult.provider_name
      : disputingResult.display_name;

    // Success state after dispute submission
    if (disputeSubmitted) {
      return (
        <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
          <nav className="sticky top-0 z-20 bg-[#FAFAF8] border-b border-gray-200/60">
            <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/images/olera-logo.png" alt="Olera" width={28} height={28} />
                <span className="font-bold text-gray-900">Olera</span>
              </Link>
              <button
                onClick={() => router.push("/")}
                className="text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Exit
              </button>
            </div>
          </nav>

          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold text-gray-900 tracking-tight">Dispute submitted</h2>
              <p className="text-gray-500 mt-2">
                We&apos;ll review and respond within 2–3 business days.
              </p>
            </div>
          </div>

          {/* Bottom Nav */}
          <OnboardingBottomNav
            back={{
              label: "Back to results",
              onClick: () => setScreen("results"),
            }}
          />
        </div>
      );
    }

    // Dispute form
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
        <nav className="sticky top-0 z-20 bg-[#FAFAF8] border-b border-gray-200/60">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/olera-logo.png" alt="Olera" width={28} height={28} />
              <span className="font-bold text-gray-900">Olera</span>
            </Link>
            <button
              onClick={() => router.push("/")}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Exit
            </button>
          </div>
        </nav>

        <div className="flex-1 px-4 py-8 md:py-12 pb-24">
          <div className="max-w-md mx-auto">
            {/* Amber dispute card */}
            <div className="bg-white rounded-2xl shadow-sm border border-amber-200 p-8">
              {/* Header with amber icon */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-200/60">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-display font-bold text-gray-900 tracking-tight">
                  Dispute this listing
                </h2>
                <p className="text-gray-500 mt-2">
                  Tell us why you should manage <strong className="text-gray-700">{disputeProviderName}</strong>.
                </p>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Full name */}
                <div className="space-y-1.5">
                  <label htmlFor="dispute-name" className="block text-[13px] font-semibold text-gray-700">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dispute-name"
                    type="text"
                    value={disputeName}
                    onChange={(e) => setDisputeName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent focus:bg-white transition-all min-h-[48px]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="dispute-email" className="block text-[13px] font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dispute-email"
                    type="email"
                    value={disputeEmail}
                    onChange={(e) => setDisputeEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent focus:bg-white transition-all min-h-[48px]"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label htmlFor="dispute-phone" className="block text-[13px] font-semibold text-gray-700">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="dispute-phone"
                    type="tel"
                    value={disputePhone}
                    onChange={(e) => setDisputePhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent focus:bg-white transition-all min-h-[48px]"
                  />
                </div>

                {/* Role dropdown */}
                <div className="space-y-1.5">
                  <label htmlFor="dispute-role" className="block text-[13px] font-semibold text-gray-700">
                    Your role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="dispute-role"
                    value={disputeRole}
                    onChange={(e) => setDisputeRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent focus:bg-white transition-all min-h-[48px] appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em', paddingRight: '2.5rem' }}
                  >
                    <option value="">Select your role...</option>
                    {DISPUTE_ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label htmlFor="dispute-reason" className="block text-[13px] font-semibold text-gray-700">
                    Why should you manage this listing? <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="dispute-reason"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Explain your connection to this organization..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent focus:bg-white transition-all resize-none"
                  />
                </div>

                {/* Error */}
                {disputeError && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm text-red-700">{disputeError}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav */}
        <OnboardingBottomNav
          back={{
            label: "Back",
            onClick: () => {
              setDisputeError("");
              setScreen("results");
            },
          }}
          primary={{
            label: "Submit Dispute",
            onClick: handleDisputeSubmit,
            loading: disputeSubmitting,
            disabled: !disputeName.trim() || !disputeEmail.trim() || !disputeRole || !disputeReason.trim(),
            variant: "amber",
          }}
        />
      </div>
    );
  }

  return null;
}
