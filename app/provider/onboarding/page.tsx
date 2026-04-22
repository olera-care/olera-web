"use client";

import { Suspense, useState, useRef, useCallback, useEffect, useMemo, Component, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useCitySearch } from "@/hooks/use-city-search";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createAuthClient } from "@/lib/supabase/auth-client";
import Button from "@/components/ui/Button";
import OrganizationSearch, { type SelectedOrg } from "@/components/shared/OrganizationSearch";
import OnboardingBottomNav from "@/components/provider/OnboardingBottomNav";
import OtpInput from "@/components/auth/OtpInput";
import { ReactiveHint } from "@/components/medjobs/Tooltip";
// Note: We don't import the full Provider type - search only selects specific columns
// to avoid JSONB fields that can cause React rendering errors
import { useAuth } from "@/components/auth/AuthProvider";

// Error boundary to catch and display rendering errors
class OnboardingErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[OnboardingErrorBoundary] Caught error:", error);
    console.error("[OnboardingErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-4 text-sm">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <pre className="text-left text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-40 mb-4 text-red-600">
              {this.state.error?.stack?.slice(0, 500)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// Types
// ============================================================

type Screen = "search" | "results" | "preview" | "confirm-claim" | "dispute";

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

// Consumer email domains (personal emails)
// Used to show ReactiveHint encouraging business email use
const CONSUMER_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
  "icloud.com", "aol.com", "protonmail.com", "live.com",
  "msn.com", "me.com", "mail.com", "ymail.com", "googlemail.com",
  "comcast.net", "att.net", "verizon.net", "sbcglobal.net",
  "cox.net", "earthlink.net", "juno.com", "netzero.com",
  "zoho.com", "fastmail.com", "tutanota.com", "hey.com",
  "pm.me", "proton.me", "yahoo.co.uk", "hotmail.co.uk",
  "outlook.co.uk", "btinternet.com", "virginmedia.com",
]);

// Check if email is a business email (not a consumer/personal email)
function isBusinessEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return !CONSUMER_EMAIL_DOMAINS.has(domain);
}

// Search result from olera-providers (only includes columns we select in search query)
interface ProviderMatch {
  provider_id: string;
  provider_name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  email: string | null;
  provider_images: string | null;
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
    <OnboardingErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ProviderOnboardingContent />
      </Suspense>
    </OnboardingErrorBoundary>
  );
}

function ProviderOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAuth, user, profiles } = useAuth();

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
  // Track when user explicitly clicks "Create new" from autocomplete
  const [createNewSelected, setCreateNewSelected] = useState(false);
  // Track if org was pre-filled from URL (provider details page) - these should stay read-only
  const [isPrefilledFromUrl, setIsPrefilledFromUrl] = useState(false);

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

  // Claim sign-in state (for when user signs in on a claimed listing)
  const [claimSignInMismatch, setClaimSignInMismatch] = useState<{
    userEmail: string;
    listingName: string;
  } | null>(null);

  // OTP verification state
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpVerifying, setOtpVerifying] = useState(false);
  const otpSentForScreen = useRef<string | null>(null); // Track which screen OTP was sent for

  // Helper to reset all OTP state
  const resetOtpState = useCallback(() => {
    setOtpCode("");
    setOtpSent(false);
    setOtpSending(false);
    setOtpError("");
    setOtpVerifying(false);
    setResendCooldown(0);
    otpSentForScreen.current = null;
  }, []);

  // Exit URL - read from ?returnTo param, fallback to /for-providers
  const exitUrl = useMemo(() => {
    const returnTo = searchParams.get("returnTo");
    // Only allow relative paths starting with single "/" (not protocol-relative "//")
    if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
      return returnTo;
    }
    return "/for-providers";
  }, [searchParams]);

  const handleExit = useCallback(() => {
    router.push(exitUrl);
  }, [exitUrl, router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-send OTP when entering confirm-claim screen
  useEffect(() => {
    // Prevent double-send: only send if we haven't sent for this screen yet
    if (screen === "confirm-claim" && otpSentForScreen.current !== "confirm-claim" && !otpSending && formData.email) {
      otpSentForScreen.current = "confirm-claim";
      handleSendOtp();
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Send OTP verification code
  const handleSendOtp = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!email) return;

    if (!isSupabaseConfigured()) {
      setOtpError("Authentication is not configured. Please contact support.");
      return;
    }

    setOtpSending(true);
    setOtpError("");

    try {
      // 1. Check if email is already used for a different account type
      const checkRes = await fetch("/api/auth/check-email-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, intendedType: "organization" }),
      });

      const checkResult = await checkRes.json();

      if (!checkResult.available) {
        if (checkResult.alreadyHasProfile) {
          setOtpError("This email is already associated with a provider account. Please sign in instead.");
        } else {
          setOtpError(
            `This email is linked to a ${checkResult.existingType} account. Please use a different email for your provider account.`
          );
        }
        setOtpSending(false);
        return;
      }

      // 2. Send OTP
      const authClient = createAuthClient();
      const { error } = await authClient.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (error) {
        // Provide user-friendly error messages
        if (error.message.includes("rate limit") || error.message.includes("too many")) {
          setOtpError("Too many attempts. Please wait a few minutes and try again.");
        } else if (error.message.includes("not allowed") || error.message.includes("disabled")) {
          setOtpError("Email verification is temporarily unavailable. Please try again later.");
        } else if (error.message.includes("invalid") && error.message.includes("email")) {
          setOtpError("Please enter a valid email address.");
        } else {
          setOtpError(error.message);
        }
        setOtpSending(false);
        return;
      }

      setOtpSent(true);
      setOtpSending(false);
      setResendCooldown(60);
    } catch (err) {
      console.error("[handleSendOtp] Error:", err);
      setOtpError("Failed to send verification code. Please check your connection and try again.");
      setOtpSending(false);
    }
  };

  // Verify OTP and claim existing listing
  const handleVerifyAndClaim = async () => {
    if (otpCode.length !== 8) return;
    if (!selectedResult) return;

    const email = formData.email.trim().toLowerCase();
    const isOleraProvider = selectedResult._source === "olera-providers";
    const providerId = isOleraProvider
      ? selectedResult.provider_id
      : selectedResult.source_provider_id || selectedResult.id;
    const providerName = isOleraProvider
      ? selectedResult.provider_name
      : selectedResult.display_name;
    const providerSlug = isOleraProvider
      ? (selectedResult.slug || selectedResult.provider_id)
      : selectedResult.slug;

    setOtpVerifying(true);
    setOtpError("");

    try {
      const authClient = createAuthClient();

      // DEMO: Magic code bypass - use demo sign-in flow
      if (otpCode === "12345678") {
        // Get a real session via demo endpoint
        const demoRes = await fetch("/api/dev/demo-signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const demoData = await demoRes.json();

        if (!demoRes.ok || !demoData.tokenHash) {
          setOtpError(demoData.error || "Demo sign-in failed");
          setOtpVerifying(false);
          return;
        }

        // Verify the magic link token to establish session
        const { error: verifyError } = await authClient.auth.verifyOtp({
          token_hash: demoData.tokenHash,
          type: "magiclink",
        });

        if (verifyError) {
          setOtpError("Demo session failed: " + verifyError.message);
          setOtpVerifying(false);
          return;
        }
      } else {
        // Normal OTP verification
        const { error: verifyError } = await authClient.auth.verifyOtp({
          email,
          token: otpCode,
          type: "email",
        });

        if (verifyError) {
          if (verifyError.message.includes("expired")) {
            setOtpError("This code has expired. Please request a new one.");
          } else if (verifyError.message.includes("invalid") || verifyError.message.includes("incorrect")) {
            setOtpError("Invalid code. Please check and try again.");
          } else if (verifyError.message.includes("too many") || verifyError.message.includes("rate limit")) {
            setOtpError("Too many attempts. Please wait a few minutes and request a new code.");
          } else {
            setOtpError(verifyError.message);
          }
          setOtpVerifying(false);
          return;
        }
      }

      // 2. Call claim-listing API
      const res = await fetch("/api/provider/claim-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          providerName,
          providerSlug,
          providerEmail: selectedResult.email,
          city: selectedResult.city || formData.city,
          state: selectedResult.state || formData.state,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setOtpError(result.error || "Failed to claim page. Please try again.");
        setOtpVerifying(false);
        return;
      }

      // 3. Redirect to provider dashboard
      setOtpVerifying(false);
      router.push("/provider");
    } catch (err) {
      console.error("[handleVerifyAndClaim] Error:", err);
      setOtpError("Something went wrong. Please try again.");
      setOtpVerifying(false);
    }
  };

  // Verify OTP and create new listing
  const handleVerifyAndCreate = async () => {
    if (otpCode.length !== 8) return;

    const email = formData.email.trim().toLowerCase();

    setOtpVerifying(true);
    setOtpError("");

    try {
      // 1. Verify OTP with Supabase
      const authClient = createAuthClient();
      const { error: verifyError } = await authClient.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });

      if (verifyError) {
        if (verifyError.message.includes("expired")) {
          setOtpError("This code has expired. Please request a new one.");
        } else if (verifyError.message.includes("invalid") || verifyError.message.includes("incorrect")) {
          setOtpError("Invalid code. Please check and try again.");
        } else if (verifyError.message.includes("too many") || verifyError.message.includes("rate limit")) {
          setOtpError("Too many attempts. Please wait a few minutes and request a new code.");
        } else {
          setOtpError(verifyError.message);
        }
        setOtpVerifying(false);
        return;
      }

      // 2. Call create-listing API
      const res = await fetch("/api/provider/create-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          orgName: formData.orgName.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          phone: formData.phone.trim() || null,
          careTypes: formData.careTypes,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setOtpError(result.error || "Failed to create page. Please try again.");
        setOtpVerifying(false);
        return;
      }

      // 3. Redirect to provider dashboard
      setOtpVerifying(false);
      router.push("/provider");
    } catch (err) {
      console.error("[handleVerifyAndCreate] Error:", err);
      setOtpError("Something went wrong. Please try again.");
      setOtpVerifying(false);
    }
  };

  // Handle "Sign in" click on a claimed listing
  // Store listing context and open auth with return URL
  const handleClaimSignIn = useCallback((result: SearchResult) => {
    const name = result._source === "olera-providers" ? result.provider_name : result.display_name;
    const listingEmail = result.email?.toLowerCase() || null;

    // If user is already signed in, validate immediately instead of opening auth
    if (user) {
      const userEmail = user.email?.toLowerCase();
      if (listingEmail && userEmail !== listingEmail) {
        // Already signed in with wrong email
        setClaimSignInMismatch({
          userEmail: user.email || "",
          listingName: name,
        });
        return; // Don't open auth modal
      } else if (!listingEmail || userEmail === listingEmail) {
        // Already signed in with correct email (or no email to validate)
        router.push("/portal/inbox");
        return;
      }
    }

    // Not signed in - store context for validation after auth completes
    try {
      sessionStorage.setItem("olera_claim_signin_pending", JSON.stringify({
        listingEmail,
        listingName: name,
        createdAt: Date.now(), // TTL tracking
      }));
    } catch {
      // sessionStorage unavailable
    }

    // Open auth modal - after sign-in, user returns to this page
    openAuth({
      defaultMode: "sign-in",
      deferred: {
        action: "claim-listing",
        returnUrl: "/provider/onboarding",
      },
    });
  }, [openAuth, user, router]);

  // Validate claim sign-in after user signs in
  // Check if the signed-in user's email matches the claimed listing's email
  useEffect(() => {
    if (!user) return;

    try {
      const pending = sessionStorage.getItem("olera_claim_signin_pending");
      if (!pending) return;

      const parsed = JSON.parse(pending) as {
        listingEmail: string | null;
        listingName: string;
        createdAt?: number;
      };

      // Clear the pending state immediately
      sessionStorage.removeItem("olera_claim_signin_pending");

      // Check TTL - ignore if older than 5 minutes (stale from abandoned flow)
      const MAX_PENDING_AGE_MS = 5 * 60 * 1000;
      if (parsed.createdAt && Date.now() - parsed.createdAt > MAX_PENDING_AGE_MS) {
        return; // Stale, ignore
      }

      const { listingEmail, listingName } = parsed;

      // If listing has no email on file, we can't validate - redirect to portal
      if (!listingEmail) {
        router.push("/portal/inbox");
        return;
      }

      // Check if emails match (case-insensitive)
      const userEmail = user.email?.toLowerCase();
      if (userEmail !== listingEmail) {
        // Mismatch - show error (don't force screen change, show on current screen)
        setClaimSignInMismatch({
          userEmail: user.email || "",
          listingName,
        });
      } else {
        // Match - redirect to portal
        router.push("/portal/inbox");
      }
    } catch {
      // Parse error or sessionStorage unavailable
    }
  }, [user, router]);

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
        createNewSelected?: boolean; // User explicitly clicked "Create new"
      };

      // Clear after reading so it doesn't persist across sessions
      sessionStorage.removeItem(prefillKey);

      // New format: selectedOrg from OrganizationSearch
      if (parsed.selectedOrg) {
        // Defensive: sanitize all fields to prevent React Error #310
        // SessionStorage data might have unexpected object types from API
        const org: SelectedOrg = {
          name: String(parsed.selectedOrg.name || ""),
          slug: String(parsed.selectedOrg.slug || ""),
          city: parsed.selectedOrg.city ? String(parsed.selectedOrg.city) : null,
          state: parsed.selectedOrg.state ? String(parsed.selectedOrg.state) : null,
          email: parsed.selectedOrg.email ? String(parsed.selectedOrg.email) : null,
          claimState: parsed.selectedOrg.claimState || null,
          source: parsed.selectedOrg.source || "olera-providers",
          providerId: parsed.selectedOrg.providerId ? String(parsed.selectedOrg.providerId) : undefined,
          imageUrl: parsed.selectedOrg.imageUrl ? String(parsed.selectedOrg.imageUrl) : null,
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
      } else if (parsed.searchQuery?.trim()) {
        // User typed org name but didn't select from dropdown
        setFormData(prev => ({ ...prev, orgName: parsed.searchQuery!.trim() }));
        // Check if user explicitly clicked "Create new" on marketing page
        if (parsed.createNewSelected) {
          setCreateNewSelected(true);
          // Go directly to Create Your Page screen (skip search)
          setScreen("preview");
        }
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
          setIsPrefilledFromUrl(true); // Mark as prefilled from URL - should stay read-only
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
          setIsPrefilledFromUrl(true); // Mark as prefilled from URL - should stay read-only
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
  }, [searchParams, selectedOrg, isPrefilledFromUrl]);

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
      // Existing org selected - clear "create new" flag
      setCreateNewSelected(false);
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
      // "Create new" explicitly selected from autocomplete
      setCreateNewSelected(true);
      // Keep existing city/state - user already entered it, no need to clear
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

    // If user explicitly selected "Create new" from autocomplete, go directly to preview
    if (createNewSelected && formData.orgName.trim()) {
      // They clicked "Create [name] as new organization" - skip search, go to create screen
      setScreen("preview");
      return;
    }

    // If user selected an existing org from autocomplete, create result directly
    if (selectedOrg) {
      const normalizedEmail = email.trim().toLowerCase();
      const emailMatch = selectedOrg.email?.toLowerCase() === normalizedEmail;
      const isClaimed = selectedOrg.claimState === "claimed";

      // Defensive: ensure all fields are proper primitives to prevent React Error #310
      // Data from sessionStorage/API might have unexpected object types
      const safeProviderId = String(selectedOrg.providerId || selectedOrg.slug || "");
      const safeName = String(selectedOrg.name || "");
      const safeSlug = String(selectedOrg.slug || "");
      const safeCity = selectedOrg.city ? String(selectedOrg.city) : null;
      const safeState = selectedOrg.state ? String(selectedOrg.state) : null;
      const safeEmail = selectedOrg.email ? String(selectedOrg.email) : null;
      const safeImageUrl = selectedOrg.imageUrl ? String(selectedOrg.imageUrl) : null;
      const safeClaimState = selectedOrg.claimState || null; // Already a string literal type, but ensure it's not an object
      const safeSource = selectedOrg.source || "olera-providers";

      // Create a search result from the selected org
      const result: SearchResult = safeSource === "olera-providers"
        ? {
            provider_id: safeProviderId,
            provider_name: safeName,
            slug: safeSlug,
            city: safeCity,
            state: safeState,
            email: safeEmail,
            provider_images: safeImageUrl || undefined, // For getProviderImage()
            _source: "olera-providers" as const,
            _claimed: isClaimed,
            _emailMatch: emailMatch,
          } as ProviderMatch
        : {
            id: safeProviderId,
            display_name: safeName,
            slug: safeSlug,
            city: safeCity,
            state: safeState,
            email: safeEmail,
            image_url: safeImageUrl,
            account_id: isClaimed ? "claimed" : null, // Simplified - just need to know if claimed
            source_provider_id: safeProviderId || null,
            claim_state: safeClaimState,
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
      // Note: Only select columns we need - avoid JSONB columns (google_reviews_data, cms_data, ai_trust_signals)
      // which can cause React rendering errors if accidentally spread into JSX
      // ═══════════════════════════════════════════════════════
      const providerColumns = "provider_id, provider_name, slug, city, state, email, provider_images";
      const [nameMatchResult, emailMatchResult] = await Promise.all([
        // Name match
        supabase
          .from("olera-providers")
          .select(providerColumns)
          .not("deleted", "is", true)
          .ilike("provider_name", `%${escapedName}%`)
          .limit(15),
        // Email match
        supabase
          .from("olera-providers")
          .select(providerColumns)
          .not("deleted", "is", true)
          .eq("email", normalizedEmail)
          .limit(5),
      ]);

      // Merge and dedupe providers
      type PartialProvider = {
        provider_id: string;
        provider_name: string;
        slug: string | null;
        city: string | null;
        state: string | null;
        email: string | null;
        provider_images: string | null;
      };
      const providerMap = new Map<string, PartialProvider>();
      for (const p of [...(emailMatchResult.data || []), ...(nameMatchResult.data || [])]) {
        if (!providerMap.has(p.provider_id)) {
          providerMap.set(p.provider_id, p as PartialProvider);
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

  // Handle Flow B: sign in to claim (for personal email users)
  // Opens auth modal with deferred claim-listing action
  const handleSignInToClaim = useCallback(() => {
    if (!selectedResult) return;

    // Extract provider data based on source type
    const isOleraProvider = selectedResult._source === "olera-providers";

    // Cache provider data for post-auth claim processing
    const providerData = {
      provider_id: isOleraProvider
        ? selectedResult.provider_id
        : selectedResult.source_provider_id || selectedResult.id,
      provider_name: isOleraProvider
        ? selectedResult.provider_name
        : selectedResult.display_name,
      slug: isOleraProvider
        ? (selectedResult.slug || selectedResult.provider_id)
        : selectedResult.slug,
      email: selectedResult.email,
      city: selectedResult.city || formData.city,
      state: selectedResult.state || formData.state,
      source_type: selectedResult._source,
      // For business_profiles, include the actual ID (for updating vs creating)
      business_profile_id: !isOleraProvider ? selectedResult.id : undefined,
    };

    try {
      sessionStorage.setItem("olera_claim_provider_cache", JSON.stringify(providerData));
    } catch {
      console.warn("[handleSignInToClaim] sessionStorage not available");
    }

    // Open auth modal with provider intent and claim-listing deferred action
    // Pre-fill their email so they don't have to re-enter it
    openAuth({
      intent: "provider",
      initialEmail: formData.email.trim(),
      deferred: {
        action: "claim-listing",
        returnUrl: "/provider",
      },
    });
  }, [selectedResult, formData.city, formData.state, formData.email, openAuth]);

  // Handle sign-in to create NEW organization (personal email - requires auth)
  const handleSignInToCreateNewOrg = useCallback(() => {
    // Validation first
    if (!formData.orgName.trim()) {
      setActionError("Organization name is required.");
      return;
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      setActionError("City and state are required.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setActionError("A valid email is required.");
      return;
    }
    if (formData.careTypes.length === 0) {
      setActionError("Please select at least one care type.");
      return;
    }
    if (formData.phone.trim()) {
      const digitsOnly = formData.phone.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        setActionError("Please enter a valid phone number (10-15 digits).");
        return;
      }
    }

    // Cache new org data for post-auth processing
    const newOrgData = {
      isNewOrg: true,
      orgName: formData.orgName,
      email: formData.email.trim().toLowerCase(),
      city: formData.city,
      state: formData.state,
      phone: formData.phone || undefined,
      careTypes: formData.careTypes,
    };

    try {
      sessionStorage.setItem("olera_new_org_cache", JSON.stringify(newOrgData));
    } catch {
      console.warn("[handleSignInToCreateNewOrg] sessionStorage not available");
    }

    // Open auth modal with provider intent and deferred action
    // Note: Using "claim-listing" action - after auth, user will be redirected to complete listing creation
    openAuth({
      intent: "provider",
      providerType: "organization",
      initialEmail: formData.email.trim(),
      deferred: {
        action: "claim-listing",
        returnUrl: "/provider",
      },
    });
  }, [formData, openAuth]);

  // ──────────────────────────────────────────────────────────
  // Screen 1: Search Form
  // ──────────────────────────────────────────────────────────

  if (screen === "search") {
    return (
      <div className="min-h-screen flex flex-col bg-vanilla-100">
        {/* Minimal sticky nav */}
        <nav className="sticky top-0 z-50 border-b border-vanilla-200 bg-vanilla-100/95 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/olera-logo.png" alt="Olera" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>
            <button
              onClick={handleExit}
              className="px-4 py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              Exit
            </button>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 pt-12 md:pt-16 pb-24">
          <div className="w-full max-w-xl animate-fade-in">
            {/* Header - changes based on state */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
                Confirm your organization
              </h1>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Enter your email to continue.
              </p>
            </div>

            {/* Search Form Card */}
            <form ref={searchFormRef} onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-5">
              {/* Organization Name - read-only only if prefilled from URL (provider details page) */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Organization name
                </label>
                {selectedOrg && !createNewSelected && isPrefilledFromUrl ? (
                  // Read-only display for claiming from provider details page
                  <div className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-xl border-2 border-primary-500 text-gray-900">
                    <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="flex-1 font-medium">{selectedOrg.name}</span>
                    <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  // Editable autocomplete for searching/creating
                  <OrganizationSearch
                    value={formData.orgName}
                    onChange={(value) => {
                      setFormData(prev => ({ ...prev, orgName: value }));
                      // Clear selected org when user types something different
                      if (selectedOrg && value !== selectedOrg.name) {
                        setSelectedOrg(null);
                      }
                      // Note: We do NOT clear createNewSelected here.
                      // User may be editing their org name, still intending to create new.
                      // createNewSelected is only cleared when they SELECT an existing org from dropdown.
                    }}
                    onSelect={handleOrgSelect}
                    placeholder="e.g., Sunrise Senior Living"
                    selected={!!selectedOrg && selectedOrg.claimState !== "claimed"}
                  />
                )}
                {selectedOrg?.claimState === "claimed" && (
                  <p className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    This page has already been claimed
                  </p>
                )}
                {createNewSelected && formData.orgName.trim() && (
                  <p className="text-sm text-primary-600 font-medium flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Creating new page for &quot;{formData.orgName.trim()}&quot;
                  </p>
                )}
              </div>

              {/* City, State - read-only only if prefilled from URL (provider details page) */}
              <div className="space-y-2">
                <label htmlFor="city" className="block text-base font-semibold text-gray-900">
                  City, State
                </label>
                {selectedOrg && !createNewSelected && isPrefilledFromUrl && selectedOrg.city && selectedOrg.state ? (
                  // Read-only display for claiming from provider details page
                  <div className="flex items-center gap-2 px-4 py-3 bg-primary-50/50 rounded-xl border-2 border-primary-500 text-gray-900">
                    <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="flex-1 font-medium">{selectedOrg.city}, {selectedOrg.state}</span>
                    <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  // Editable city input
                  (() => {
                    const cityCompleted = !!(formData.city && formData.state);
                    return (
                      <div className="relative" ref={cityDropdownRef}>
                        <div className={`flex items-center px-4 py-3 rounded-xl border transition-colors ${
                          cityCompleted
                            ? "border-primary-300 bg-primary-50/30"
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
                  })()
                )}
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
                <p className="text-sm text-gray-500 ml-1">We&apos;ll send a verification code to this email</p>
                <ReactiveHint show={!isBusinessEmail(formData.email) && formData.email.includes("@")}>
                  Using your business email (e.g., you@yourcompany.com) speeds up verification.
                </ReactiveHint>
                {/* Warning: logged-in user with family/caregiver account using same email */}
                {user &&
                 formData.email.trim().toLowerCase() === user.email?.toLowerCase() &&
                 profiles?.length > 0 &&
                 !profiles.some(p => p.type === "organization") && (
                  <div className="flex items-start gap-2 mt-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-amber-800">
                      This email is linked to your personal account. Use a different email to claim a provider page, or <button type="button" onClick={() => openAuth({ defaultMode: "sign-in" })} className="font-medium underline hover:no-underline">sign in</button> with your organization&apos;s email.
                    </p>
                  </div>
                )}
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

              {/* Claim sign-in mismatch error (can appear on search screen if user navigated here) */}
              {claimSignInMismatch && (
                <div className="px-4 py-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">Wrong account</p>
                      <p className="text-sm text-amber-700 mt-1">
                        You&apos;re signed in as <span className="font-medium">{claimSignInMismatch.userEmail}</span>, but &quot;{claimSignInMismatch.listingName}&quot; was claimed with a different email. Please sign in with the correct email or search for the page and click &quot;Dispute&quot;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setClaimSignInMismatch(null)}
                      className="shrink-0 p-1 text-amber-600 hover:text-amber-800 rounded transition-colors"
                      aria-label="Dismiss"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={searching || !formData.email.trim() || !formData.email.includes("@")}
                className="w-full py-3.5 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {searching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>

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

  // Handle "Create New Page" button - navigate to preview screen
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

    // Send OTP for verification
    setActionLoading(null);
    await handleSendOtp();
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

  if (screen === "results") {
    // Separate email matches (priority) from other matches
    const emailMatches = searchResults.filter(r => r._emailMatch);
    const otherMatches = searchResults.filter(r => !r._emailMatch);

    return (
      <div className="min-h-screen flex flex-col bg-vanilla-100">
        {/* Minimal sticky nav */}
        <nav className="sticky top-0 z-50 border-b border-vanilla-200 bg-vanilla-100/95 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/olera-logo.png" alt="Olera" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>
            <button
              onClick={handleExit}
              className="px-4 py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors bg-white"
            >
              Exit
            </button>
          </div>
        </nav>

        <div className="flex-1 px-4 py-8 md:py-12 pb-24">
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
                {searchResults.length === 0
                  ? "Create your page"
                  : selectedOrg && selectedOrg.claimState === "claimed"
                    ? "This page is claimed"
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

            {/* Claim sign-in email mismatch error */}
            {claimSignInMismatch && (
              <div className="mb-4 px-4 py-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Wrong account
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      You&apos;re signed in as <span className="font-medium">{claimSignInMismatch.userEmail}</span>, but &quot;{claimSignInMismatch.listingName}&quot; was claimed with a different email.
                    </p>
                    <p className="text-sm text-amber-700 mt-2">
                      {(() => {
                        const claimedResult = searchResults.find(r => r._claimed);
                        if (claimedResult) {
                          return (
                            <>
                              Please sign in with the email you used to claim this page, or{" "}
                              <button
                                type="button"
                                onClick={() => {
                                  setClaimSignInMismatch(null);
                                  handleResultAction(claimedResult, "dispute");
                                }}
                                className="font-medium underline hover:no-underline"
                              >
                                file a dispute
                              </button>{" "}
                              if you believe you should have access.
                            </>
                          );
                        }
                        // No search results available (page was refreshed) - give generic guidance
                        return "Please sign in with the email you used to claim this page, or search for it again and click \"Dispute\" if you believe you should have access.";
                      })()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClaimSignInMismatch(null)}
                    className="shrink-0 p-1 text-amber-600 hover:text-amber-800 rounded transition-colors"
                    aria-label="Dismiss"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    We don&apos;t have a page for your organization yet. Create one to start connecting with families.
                  </p>
                  {actionError && (
                    <p className="text-sm text-red-600 mb-4">{actionError}</p>
                  )}
                  <Button
                    size="lg"
                    onClick={handleCreateNew}
                    loading={actionLoading === "create-new"}
                  >
                    Create Your Page
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
                          // Defensive: ensure all rendered values are strings to prevent React Error #310
                          const name = String(result._source === "olera-providers" ? result.provider_name : result.display_name || "");
                          const location = [result.city, result.state].filter(Boolean).map(String).join(", ");
                          const slug = String(result._source === "olera-providers" ? (result.slug || result.provider_id) : result.slug || "");
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
                                    {result._claimed ? "This page is claimed." : "Verify to claim."}
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
                                          onClick={() => handleClaimSignIn(result)}
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
                          // Defensive: ensure all rendered values are strings to prevent React Error #310
                          const name = String(result._source === "olera-providers" ? result.provider_name : result.display_name || "");
                          const location = [result.city, result.state].filter(Boolean).map(String).join(", ");
                          const slug = String(result._source === "olera-providers" ? (result.slug || result.provider_id) : result.slug || "");
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
                                    {result._claimed ? "This page is claimed." : "Unclaimed page."}
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
                                          onClick={() => handleClaimSignIn(result)}
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
                      <p className="text-sm text-gray-500 mb-4">Create a new page to get started on Olera</p>
                      <Button
                        variant="secondary"
                        onClick={handleCreateNew}
                        loading={actionLoading === "create-new"}
                      >
                        Create New Page
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
      <div className="min-h-screen flex flex-col bg-vanilla-100">
        {/* Minimal sticky nav */}
        <nav className="sticky top-0 z-50 border-b border-vanilla-200 bg-vanilla-100/95 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/olera-logo.png" alt="Olera" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>
            <button
              onClick={handleExit}
              className="px-4 py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              Exit
            </button>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12 pb-24 md:pb-12">
          <div className="w-full max-w-xl animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-display font-bold text-gray-900 tracking-tight">
                Create your page
              </h1>
              <p className="text-gray-500 mt-1.5">
                Add your details to start connecting with families.
              </p>
            </div>

            {/* Preview Form */}
            <form id="preview-form" onSubmit={handlePreviewSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-5">
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

              {/* Location - always editable */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Location
                </label>
                <div className="relative" ref={cityDropdownRef}>
                  <div className={`flex items-center px-4 py-3 rounded-xl border transition-colors ${
                    showCityDropdown
                      ? "border-primary-400 ring-2 ring-primary-100 bg-gray-50"
                      : formData.city && formData.state
                        ? "border-primary-300 bg-primary-50/30"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50"
                  }`}>
                    <svg className={`w-5 h-5 shrink-0 ${formData.city && formData.state ? "text-primary-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      ref={cityInputRef}
                      type="text"
                      value={cityQuery}
                      onChange={(e) => {
                        setCityQuery(e.target.value);
                        setShowCityDropdown(true);
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
                    {formData.city && formData.state && (
                      <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          key={`preview-${city.city}-${city.state}-${idx}`}
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

              {/* Email - always editable */}
              <div className="space-y-2">
                <label className="block text-base font-semibold text-gray-900">
                  Business email
                </label>
                <div className={`flex items-center px-4 py-3 rounded-xl border transition-colors ${
                  formData.email && formData.email.includes("@")
                    ? "border-primary-300 bg-primary-50/30"
                    : "border-gray-200 hover:border-gray-300 bg-gray-50"
                } focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100`}>
                  <svg className={`w-5 h-5 shrink-0 ${formData.email && formData.email.includes("@") ? "text-primary-600" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@yourorganization.com"
                    autoComplete="email"
                    className="w-full ml-3 bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
                    required
                  />
                  {formData.email && formData.email.includes("@") && (
                    <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500 ml-1">We&apos;ll send a verification code to this email</p>
                <ReactiveHint show={!isBusinessEmail(formData.email) && formData.email.includes("@")}>
                  Using your business email (e.g., you@yourcompany.com) speeds up verification.
                </ReactiveHint>
              </div>

              {/* Care Types (multi-select) - hide when OTP sent */}
              {!otpSent && (
                <div className="space-y-2">
                  <label className="block text-base font-semibold text-gray-900">
                    Services <span className="text-gray-400 font-normal">(select all that apply)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CARE_TYPE_OPTIONS.map((type) => {
                      const isSelected = formData.careTypes.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => toggleCareType(type.id)}
                          className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                            isSelected
                              ? "bg-primary-50 border-primary-300 text-primary-700"
                              : "bg-white border-warm-100 text-gray-900 hover:border-warm-200"
                          }`}
                        >
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* OTP Verification Section */}
              {otpSent && (
                <div className="space-y-4 pt-2">
                  <div className="text-center">
                    <p className="text-gray-500">
                      We sent an 8-digit code to{" "}
                      <span className="font-semibold text-gray-700">
                        {(() => {
                          const [local, domain] = formData.email.split("@");
                          if (!domain) return "***@***.com";
                          if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
                          return `${local.slice(0, 2)}${"*".repeat(Math.min(local.length - 2, 5))}@${domain}`;
                        })()}
                      </span>
                    </p>
                  </div>

                  <div className="py-2">
                    <OtpInput
                      length={8}
                      value={otpCode}
                      onChange={setOtpCode}
                      disabled={otpVerifying}
                      error={!!otpError}
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Didn&apos;t get the code?{" "}
                      {resendCooldown > 0 ? (
                        <span className="text-gray-400">Resend in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpCode("");
                            setOtpError("");
                            handleSendOtp();
                          }}
                          disabled={otpSending}
                          className="text-primary-600 hover:text-primary-700 font-medium underline hover:no-underline"
                        >
                          Resend code
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              )}

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
                By creating a page, you agree to our{" "}
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline">
                  Terms of Service
                </Link>
              </p>

              {/* Action buttons - Desktop only (inline) */}
              <div className="hidden md:flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionError("");
                    resetOtpState();
                    setScreen(createNewSelected ? "search" : "results");
                  }}
                  className="text-base font-medium text-gray-500 hover:text-gray-700 transition-colors py-2"
                >
                  ← Back
                </button>
                {otpSent ? (
                  <button
                    type="button"
                    onClick={handleVerifyAndCreate}
                    disabled={otpCode.length !== 8 || otpVerifying}
                    className="px-6 py-3 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {otpVerifying ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create page"
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => (document.getElementById("preview-form") as HTMLFormElement)?.requestSubmit()}
                    disabled={
                      actionLoading === "preview-submit" ||
                      otpSending ||
                      !formData.orgName.trim() ||
                      !formData.city.trim() ||
                      !formData.state.trim() ||
                      !formData.email.trim() ||
                      !formData.email.includes("@") ||
                      formData.careTypes.length === 0
                    }
                    className="px-6 py-3 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {(actionLoading === "preview-submit" || otpSending) ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {otpSending ? "Sending code..." : "Processing..."}
                      </>
                    ) : (
                      "Create page"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Mobile sticky bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-vanilla-100 border-t border-vanilla-200 px-4 py-4 safe-area-inset-bottom">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActionError("");
                resetOtpState();
                setScreen(createNewSelected ? "search" : "results");
              }}
              className="px-4 py-3 text-base font-medium text-gray-600 border border-gray-300 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              Back
            </button>
            {otpSent ? (
              <button
                type="button"
                onClick={handleVerifyAndCreate}
                disabled={otpCode.length !== 8 || otpVerifying}
                className="flex-1 py-3 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {otpVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create page"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (document.getElementById("preview-form") as HTMLFormElement)?.requestSubmit()}
                disabled={
                  actionLoading === "preview-submit" ||
                  otpSending ||
                  !formData.orgName.trim() ||
                  !formData.city.trim() ||
                  !formData.state.trim() ||
                  !formData.email.trim() ||
                  !formData.email.includes("@") ||
                  formData.careTypes.length === 0
                }
                className="flex-1 py-3 bg-primary-600 text-white text-base font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {(actionLoading === "preview-submit" || otpSending) ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {otpSending ? "Sending code..." : "Processing..."}
                  </>
                ) : (
                  "Create page"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Screen 2.75: Confirm Claim (for "Manage" flow)
  // ──────────────────────────────────────────────────────────

  if (screen === "confirm-claim" && selectedResult) {
    // Defensive: ensure all rendered values are strings to prevent React Error #310
    const providerName = String(selectedResult._source === "olera-providers"
      ? selectedResult.provider_name
      : selectedResult.display_name || "");
    const location = [selectedResult.city, selectedResult.state].filter(Boolean).map(String).join(", ");
    const providerImage = selectedResult._source === "olera-providers"
      ? selectedResult.provider_images?.split("|")[0]?.trim() || null
      : selectedResult.image_url;

    // Email to send OTP to
    const userEmail = formData.email;

    return (
      <div className="min-h-screen flex flex-col bg-vanilla-100">
        {/* Minimal sticky nav */}
        <nav className="sticky top-0 z-50 border-b border-vanilla-200 bg-vanilla-100/95 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/images/olera-logo.png" alt="Olera" width={32} height={32} className="object-contain" />
              <span className="text-xl font-bold text-gray-900">Olera</span>
            </Link>
            <button
              onClick={handleExit}
              className="px-4 py-2 text-base font-medium text-gray-600 border border-gray-300 rounded-lg hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              Exit
            </button>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
          <div className="max-w-lg w-full animate-fade-in">
            {/* Provider Card Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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

              {/* Claim verification */}
              <div className="p-5 space-y-4">
                {/* Heading */}
                <div className="text-center">
                  <h3 className="text-xl font-display font-bold text-gray-900 tracking-tight">Claim this page</h3>
                  {otpSending ? (
                    <p className="text-gray-500 mt-1.5">Sending verification code...</p>
                  ) : otpSent ? (
                    <p className="text-gray-500 mt-1.5">
                      We sent an 8-digit code to{" "}
                      <span className="font-semibold text-gray-700">
                        {(() => {
                          const [local, domain] = userEmail.split("@");
                          if (!domain) return "***@***.com";
                          if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
                          return `${local.slice(0, 2)}${"*".repeat(Math.min(local.length - 2, 5))}@${domain}`;
                        })()}
                      </span>
                    </p>
                  ) : (
                    <p className="text-gray-500 mt-1.5">
                      We&apos;ll send a verification code to your email.
                    </p>
                  )}
                </div>

                {/* OTP Input */}
                {otpSent && (
                  <div className="py-2">
                    <OtpInput
                      length={8}
                      value={otpCode}
                      onChange={setOtpCode}
                      disabled={otpVerifying}
                      error={!!otpError}
                    />
                  </div>
                )}

                {/* Error */}
                {(otpError || actionError) && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                    <p className="text-sm text-red-700">{otpError || actionError}</p>
                  </div>
                )}

                {/* Resend link */}
                {otpSent && (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      Didn&apos;t get the code?{" "}
                      {resendCooldown > 0 ? (
                        <span className="text-gray-400">Resend in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpCode("");
                            setOtpError("");
                            handleSendOtp();
                          }}
                          disabled={otpSending}
                          className="text-primary-600 hover:text-primary-700 font-medium underline hover:no-underline"
                        >
                          Resend code
                        </button>
                      )}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleVerifyAndClaim}
                    disabled={otpCode.length !== 8 || !otpSent || otpVerifying}
                    className="w-full"
                  >
                    {otpVerifying ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Claiming...
                      </span>
                    ) : (
                      "Claim this page"
                    )}
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionError("");
                      resetOtpState();
                      // For pre-selected unclaimed orgs, go back to search (they skipped results)
                      setScreen(selectedOrg && selectedOrg.claimState !== "claimed" ? "search" : "results");
                    }}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors py-2"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // Screen: Dispute (inline dispute form with amber styling)
  // ──────────────────────────────────────────────────────────

  if (screen === "dispute" && disputingResult) {
    // Defensive: ensure all rendered values are strings to prevent React Error #310
    const disputeProviderName = String(disputingResult._source === "olera-providers"
      ? disputingResult.provider_name
      : disputingResult.display_name || "");

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
                onClick={handleExit}
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
              onClick={handleExit}
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
                  Dispute this page
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
                    Why should you manage this page? <span className="text-red-500">*</span>
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
