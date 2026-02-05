"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile, ProfileCategory } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/auth/OtpInput";

// ============================================================
// Types
// ============================================================

/** User intent: looking for care (family) or providing care (provider) */
export type UserIntent = "family" | "provider";

/** Provider subtype */
export type ProviderType = "organization" | "caregiver";

/** All possible steps in the auth flow */
export type AuthFlowStep =
  // Auth steps
  | "auth"           // Email, password, name entry
  | "verify-code"    // OTP verification
  // Intent step (skipped if intent is known)
  | "intent"         // Family vs Provider selection
  // Provider path
  | "provider-type"  // Organization vs Caregiver
  | "provider-info"  // Name, location, care types
  | "org-search"     // Search/claim existing organization
  | "visibility"     // Who can see the profile
  // Family path (future)
  | "family-info"    // Care recipient details
  | "family-needs";  // Care needs and preferences

/** Props for AuthFlowModal */
export interface AuthFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-set intent to skip the intent question. null = ask user */
  intent?: UserIntent | null;
  /** Pre-set provider type to skip that question (provider path only) */
  providerType?: ProviderType | null;
  /** Profile to claim (for claim flow) */
  claimProfile?: Profile | null;
  /** Default to sign-in instead of sign-up */
  defaultToSignIn?: boolean;
}

/** Collected data throughout the flow */
interface FlowData {
  // Auth data
  email: string;
  password: string;
  displayName: string;
  // Intent
  intent: UserIntent | null;
  // Provider data
  providerType: ProviderType | null;
  orgName: string;
  city: string;
  state: string;
  zip: string;
  careTypes: string[];
  category: ProfileCategory | null;
  description: string;
  phone: string;
  visibleToFamilies: boolean;
  visibleToProviders: boolean;
  // Claim data
  claimedProfileId: string | null;
  claimedProfile: Profile | null;
  // Family data (future)
  careRecipientName: string;
  careRecipientRelation: string;
  careNeeds: string[];
}

const INITIAL_DATA: FlowData = {
  email: "",
  password: "",
  displayName: "",
  intent: null,
  providerType: null,
  orgName: "",
  city: "",
  state: "",
  zip: "",
  careTypes: [],
  category: null,
  description: "",
  phone: "",
  visibleToFamilies: true,
  visibleToProviders: true,
  claimedProfileId: null,
  claimedProfile: null,
  careRecipientName: "",
  careRecipientRelation: "",
  careNeeds: [],
};

// ============================================================
// Constants
// ============================================================

const ORG_CATEGORIES: { value: ProfileCategory; label: string }[] = [
  { value: "assisted_living", label: "Assisted Living" },
  { value: "independent_living", label: "Independent Living" },
  { value: "memory_care", label: "Memory Care" },
  { value: "nursing_home", label: "Nursing Home / Skilled Nursing" },
  { value: "home_care_agency", label: "Home Care Agency" },
  { value: "home_health_agency", label: "Home Health Agency" },
  { value: "hospice_agency", label: "Hospice" },
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

// ============================================================
// Step Configuration
// ============================================================

interface StepConfig {
  title: string;
  /** Step number for progress indicator (null = don't show progress) */
  stepNumber: number | null;
}

function getStepConfig(step: AuthFlowStep, data: FlowData): StepConfig {
  const configs: Record<AuthFlowStep, StepConfig> = {
    "auth": { title: "Create your account", stepNumber: null },
    "verify-code": { title: "Verify your email", stepNumber: null },
    "intent": { title: "Welcome to Olera", stepNumber: 1 },
    "provider-type": { title: "Tell us about yourself", stepNumber: 2 },
    "provider-info": {
      title: data.providerType === "organization"
        ? "About your organization"
        : "About you",
      stepNumber: 3,
    },
    "org-search": { title: "Is your organization listed?", stepNumber: 4 },
    "visibility": { title: "Who can find you?", stepNumber: data.providerType === "organization" ? 5 : 4 },
    "family-info": { title: "Who needs care?", stepNumber: 2 },
    "family-needs": { title: "Care preferences", stepNumber: 3 },
  };
  return configs[step];
}

function getTotalSteps(data: FlowData): number {
  if (data.intent === "provider") {
    return data.providerType === "organization" ? 5 : 4;
  }
  if (data.intent === "family") {
    return 3;
  }
  return 1; // Just intent selection
}

// ============================================================
// Component
// ============================================================

export default function AuthFlowModal({
  isOpen,
  onClose,
  intent: initialIntent = null,
  providerType: initialProviderType = null,
  claimProfile = null,
  defaultToSignIn = false,
}: AuthFlowModalProps) {
  const router = useRouter();
  const { user, account, refreshAccountData } = useAuth();

  // Core state
  const [step, setStep] = useState<AuthFlowStep>("auth");
  const [data, setData] = useState<FlowData>({
    ...INITIAL_DATA,
    intent: initialIntent,
    providerType: initialProviderType,
    claimedProfileId: claimProfile?.id ?? null,
    claimedProfile: claimProfile ?? null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auth-specific state
  const [authMode, setAuthMode] = useState<"sign-up" | "sign-in">(
    defaultToSignIn ? "sign-in" : "sign-up"
  );
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Org search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────
  // Reset and Initialization
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      // Reset all state when modal closes
      setStep("auth");
      setData({
        ...INITIAL_DATA,
        intent: initialIntent,
        providerType: initialProviderType,
        claimedProfileId: claimProfile?.id ?? null,
        claimedProfile: claimProfile ?? null,
      });
      setError("");
      setLoading(false);
      setAuthMode(defaultToSignIn ? "sign-in" : "sign-up");
      setOtpCode("");
      setResendCooldown(0);
      setSearchQuery("");
      setSearchResults([]);
      setSearching(false);
      setHasSearched(false);
      setSelectedOrgId(null);
    }
  }, [isOpen, initialIntent, initialProviderType, claimProfile, defaultToSignIn]);

  // If user is already authenticated, skip to appropriate step
  useEffect(() => {
    if (isOpen && user && step === "auth") {
      // User already signed in - skip auth steps
      if (initialIntent) {
        // Intent is known - go to appropriate path
        if (initialIntent === "provider") {
          if (initialProviderType) {
            setStep("provider-info");
          } else {
            setStep("provider-type");
          }
        } else {
          setStep("family-info");
        }
      } else {
        // Intent unknown - ask
        setStep("intent");
      }
    }
  }, [isOpen, user, step, initialIntent, initialProviderType]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ──────────────────────────────────────────────────────────
  // Data Update Helper
  // ──────────────────────────────────────────────────────────

  const updateData = useCallback((partial: Partial<FlowData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  // ──────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────

  const goBack = () => {
    setError("");

    switch (step) {
      case "verify-code":
        setStep("auth");
        setOtpCode("");
        break;
      case "intent":
        // Can't go back from intent (would go to auth which user completed)
        break;
      case "provider-type":
        if (initialIntent === null) {
          setStep("intent");
        }
        break;
      case "provider-info":
        if (initialProviderType) {
          // Provider type was preset, can't go back to it
          if (initialIntent === null) {
            setStep("intent");
          }
        } else {
          setStep("provider-type");
        }
        break;
      case "org-search":
        setStep("provider-info");
        break;
      case "visibility":
        if (data.providerType === "organization") {
          setStep("org-search");
        } else {
          setStep("provider-info");
        }
        break;
      case "family-info":
        if (initialIntent === null) {
          setStep("intent");
        }
        break;
      case "family-needs":
        setStep("family-info");
        break;
    }
  };

  const canGoBack = (): boolean => {
    // Auth steps: can't go back
    if (step === "auth") return false;
    if (step === "verify-code") return true;
    // Intent: can't go back (user already authenticated)
    if (step === "intent") return false;
    // First onboarding step after auth: depends on whether intent was preset
    if (step === "provider-type" && initialIntent !== null) return false;
    if (step === "family-info" && initialIntent !== null) return false;
    // All other steps: can go back
    return true;
  };

  // ──────────────────────────────────────────────────────────
  // Auth Handlers
  // ──────────────────────────────────────────────────────────

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (data.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { display_name: data.displayName || undefined },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("This email is already registered. Try signing in instead.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (!authData.session) {
        if (authData.user?.identities?.length === 0) {
          setError("This email is already registered. Try signing in instead.");
          setLoading(false);
          return;
        }

        // Email confirmation required - show OTP screen
        setResendCooldown(30);
        setLoading(false);
        setStep("verify-code");
        return;
      }

      // No email confirmation - proceed to next step
      setLoading(false);
      proceedAfterAuth();
    } catch (err) {
      console.error("Sign up error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Wrong email or password. Please try again."
            : authError.message
        );
        setLoading(false);
        return;
      }

      setLoading(false);
      proceedAfterAuth();
    } catch (err) {
      console.error("Sign in error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otpCode.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: otpCode,
        type: "signup",
      });

      if (verifyError) {
        if (verifyError.message.includes("expired")) {
          setError("This code has expired. Please request a new one.");
        } else if (verifyError.message.includes("invalid")) {
          setError("Invalid code. Please check and try again.");
        } else {
          setError(verifyError.message);
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      proceedAfterAuth();
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: data.email,
      });

      if (resendError) {
        setError(resendError.message);
        setLoading(false);
        return;
      }

      setResendCooldown(60);
      setOtpCode("");
      setLoading(false);
    } catch (err) {
      console.error("Resend code error:", err);
      setError("Failed to resend code. Please try again.");
      setLoading(false);
    }
  };

  /** Determine next step after authentication completes */
  const proceedAfterAuth = () => {
    if (initialIntent) {
      // Intent is known
      if (initialIntent === "provider") {
        if (initialProviderType) {
          setStep("provider-info");
        } else {
          setStep("provider-type");
        }
      } else {
        setStep("family-info");
      }
    } else {
      // Intent unknown - ask user
      setStep("intent");
    }
  };

  // ──────────────────────────────────────────────────────────
  // Intent Selection
  // ──────────────────────────────────────────────────────────

  const handleIntentSelect = (intent: UserIntent) => {
    updateData({ intent });
    if (intent === "provider") {
      setStep("provider-type");
    } else {
      setStep("family-info");
    }
  };

  // ──────────────────────────────────────────────────────────
  // Provider Path Handlers
  // ──────────────────────────────────────────────────────────

  const handleProviderTypeSelect = (type: ProviderType) => {
    updateData({ providerType: type });
    setStep("provider-info");
  };

  const handleProviderInfoNext = () => {
    if (data.providerType === "organization") {
      setSearchQuery(data.orgName);
      setStep("org-search");
    } else {
      setStep("visibility");
    }
  };

  const isProviderInfoValid = (): boolean => {
    const name = data.providerType === "organization" ? data.orgName : data.displayName;
    return (
      name.trim().length > 0 &&
      (data.city.trim().length > 0 || data.state.trim().length > 0) &&
      data.careTypes.length > 0
    );
  };

  // Org search
  const searchOrgs = useCallback(async (query: string) => {
    if (!query.trim() || !isSupabaseConfigured()) return;
    setSearching(true);

    try {
      const supabase = createClient();
      const { data: profiles, error: searchErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("type", "organization")
        .eq("claim_state", "unclaimed")
        .ilike("display_name", `%${query.trim()}%`)
        .limit(10);

      if (searchErr) {
        setSearchResults([]);
      } else {
        setSearchResults((profiles as Profile[]) || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setHasSearched(true);
      setSearching(false);
    }
  }, []);

  // Auto-search when entering org-search step
  useEffect(() => {
    if (step === "org-search" && data.orgName && !hasSearched) {
      searchOrgs(data.orgName);
    }
  }, [step, data.orgName, hasSearched, searchOrgs]);

  const handleOrgSearchNext = () => {
    if (selectedOrgId) {
      const profile = searchResults.find((p) => p.id === selectedOrgId);
      if (profile) {
        updateData({
          claimedProfileId: selectedOrgId,
          claimedProfile: profile,
        });
      }
    }
    setStep("visibility");
  };

  // ──────────────────────────────────────────────────────────
  // Final Submission
  // ──────────────────────────────────────────────────────────

  const handleComplete = async () => {
    setLoading(true);
    setError("");

    try {
      if (!isSupabaseConfigured()) {
        setError("Backend not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setError("Not authenticated. Please try again.");
        setLoading(false);
        return;
      }

      // Wait for account row to exist (created by auth trigger)
      let accountRow = account;
      if (!accountRow) {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const { data: acct } = await supabase
            .from("accounts")
            .select("*")
            .eq("user_id", currentUser.id)
            .single();
          if (acct) {
            accountRow = acct;
            break;
          }
        }
      }

      if (!accountRow) {
        setError("Account setup timed out. Please try again.");
        setLoading(false);
        return;
      }

      // Create profile based on intent
      let profileId: string;

      if (data.intent === "provider") {
        profileId = await createProviderProfile(supabase, accountRow.id);
      } else {
        profileId = await createFamilyProfile(supabase, accountRow.id);
      }

      // Update account
      const { error: accountErr } = await supabase
        .from("accounts")
        .update({
          onboarding_completed: true,
          active_profile_id: profileId,
          display_name: accountRow.display_name || data.displayName || data.orgName,
        })
        .eq("id", accountRow.id);
      if (accountErr) throw accountErr;

      // Create membership
      await supabase.from("memberships").upsert(
        { account_id: accountRow.id, plan: "free", status: "free" },
        { onConflict: "account_id" }
      );

      // Refresh auth state and redirect
      await refreshAccountData();
      onClose();
      router.push("/portal");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("Complete flow error:", message, err);
      setError(`Something went wrong: ${message}`);
      setLoading(false);
    }
  };

  const createProviderProfile = async (
    supabase: ReturnType<typeof createClient>,
    accountId: string
  ): Promise<string> => {
    const profileType = data.providerType === "caregiver" ? "caregiver" : "organization";

    if (data.claimedProfileId && data.claimedProfile) {
      // Claiming an existing seeded profile
      const s = data.claimedProfile;
      const claimUpdate: Record<string, unknown> = {
        account_id: accountId,
        claim_state: "claimed",
      };

      if (!s.display_name?.trim() && data.orgName) claimUpdate.display_name = data.orgName;
      if (!s.city && data.city) claimUpdate.city = data.city;
      if (!s.state && data.state) claimUpdate.state = data.state;
      if (!s.zip && data.zip) claimUpdate.zip = data.zip;
      if ((!s.care_types || s.care_types.length === 0) && data.careTypes.length > 0) {
        claimUpdate.care_types = data.careTypes;
      }
      if (!s.description?.trim() && data.description) claimUpdate.description = data.description;
      if (!s.phone && data.phone) claimUpdate.phone = data.phone;

      const { error: claimErr } = await supabase
        .from("profiles")
        .update(claimUpdate)
        .eq("id", data.claimedProfileId);
      if (claimErr) throw claimErr;

      return data.claimedProfileId;
    }

    // Create new profile
    const displayName = data.providerType === "organization" ? data.orgName : data.displayName;
    const slug = generateSlug(displayName, data.city, data.state);

    const { data: newProfile, error: profileErr } = await supabase
      .from("profiles")
      .insert({
        account_id: accountId,
        slug,
        type: profileType,
        category: data.category,
        display_name: displayName,
        description: data.description || null,
        phone: data.phone || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        care_types: data.careTypes,
        claim_state: "claimed",
        verification_state: "unverified",
        source: "user_created",
        is_active: true,
        metadata: {
          visible_to_families: data.visibleToFamilies,
          visible_to_providers: data.visibleToProviders,
        },
      })
      .select("id")
      .single();

    if (profileErr) throw profileErr;
    return newProfile.id;
  };

  const createFamilyProfile = async (
    supabase: ReturnType<typeof createClient>,
    accountId: string
  ): Promise<string> => {
    const slug = generateSlug(data.displayName, data.city, data.state);

    const { data: newProfile, error: profileErr } = await supabase
      .from("profiles")
      .insert({
        account_id: accountId,
        slug,
        type: "family",
        display_name: data.displayName,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        care_types: data.careNeeds,
        claim_state: "claimed",
        verification_state: "unverified",
        source: "user_created",
        is_active: true,
        metadata: {
          care_recipient_name: data.careRecipientName || null,
          care_recipient_relation: data.careRecipientRelation || null,
        },
      })
      .select("id")
      .single();

    if (profileErr) throw profileErr;
    return newProfile.id;
  };

  // ──────────────────────────────────────────────────────────
  // Render Helpers
  // ──────────────────────────────────────────────────────────

  const stepConfig = getStepConfig(step, data);
  const totalSteps = getTotalSteps(data);
  const showProgress = stepConfig.stepNumber !== null && data.intent !== null;

  // ──────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={stepConfig.title}
      size={step === "auth" || step === "verify-code" ? "sm" : "lg"}
    >
      {/* Progress bar (only for onboarding steps) */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-500">
              Step {stepConfig.stepNumber} of {totalSteps}
            </span>
            {canGoBack() && (
              <button
                type="button"
                onClick={goBack}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Back
              </button>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((stepConfig.stepNumber ?? 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Step: Auth */}
      {step === "auth" && (
        <AuthStep
          mode={authMode}
          setMode={setAuthMode}
          data={data}
          updateData={updateData}
          loading={loading}
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
        />
      )}

      {/* Step: Verify Code */}
      {step === "verify-code" && (
        <VerifyCodeStep
          email={data.email}
          otpCode={otpCode}
          setOtpCode={setOtpCode}
          loading={loading}
          resendCooldown={resendCooldown}
          onVerify={handleVerifyOtp}
          onResend={handleResendCode}
          onBack={() => {
            setStep("auth");
            setOtpCode("");
            setError("");
          }}
        />
      )}

      {/* Step: Intent Selection */}
      {step === "intent" && (
        <IntentStep onSelect={handleIntentSelect} />
      )}

      {/* Step: Provider Type */}
      {step === "provider-type" && (
        <ProviderTypeStep onSelect={handleProviderTypeSelect} />
      )}

      {/* Step: Provider Info */}
      {step === "provider-info" && (
        <ProviderInfoStep
          data={data}
          updateData={updateData}
          loading={loading}
          isValid={isProviderInfoValid()}
          onNext={handleProviderInfoNext}
          careTypes={CARE_TYPES}
          categories={ORG_CATEGORIES}
        />
      )}

      {/* Step: Org Search */}
      {step === "org-search" && (
        <OrgSearchStep
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          searching={searching}
          hasSearched={hasSearched}
          selectedOrgId={selectedOrgId}
          setSelectedOrgId={setSelectedOrgId}
          onSearch={() => {
            setHasSearched(false);
            searchOrgs(searchQuery);
          }}
          onNext={handleOrgSearchNext}
        />
      )}

      {/* Step: Visibility */}
      {step === "visibility" && (
        <VisibilityStep
          data={data}
          updateData={updateData}
          loading={loading}
          onComplete={handleComplete}
        />
      )}

      {/* Step: Family Info (future - basic placeholder) */}
      {step === "family-info" && (
        <FamilyInfoStep
          data={data}
          updateData={updateData}
          onNext={() => setStep("family-needs")}
        />
      )}

      {/* Step: Family Needs (future - basic placeholder) */}
      {step === "family-needs" && (
        <FamilyNeedsStep
          data={data}
          updateData={updateData}
          loading={loading}
          careTypes={CARE_TYPES}
          onComplete={handleComplete}
        />
      )}
    </Modal>
  );
}

// ============================================================
// Step Components
// ============================================================

function AuthStep({
  mode,
  setMode,
  data,
  updateData,
  loading,
  onSignUp,
  onSignIn,
}: {
  mode: "sign-up" | "sign-in";
  setMode: (mode: "sign-up" | "sign-in") => void;
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  loading: boolean;
  onSignUp: (e: React.FormEvent) => void;
  onSignIn: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={mode === "sign-up" ? onSignUp : onSignIn} className="space-y-4">
      {mode === "sign-up" && (
        <Input
          label="Your name"
          type="text"
          name="displayName"
          value={data.displayName}
          onChange={(e) => updateData({ displayName: (e.target as HTMLInputElement).value })}
          placeholder="First and last name"
          autoComplete="name"
        />
      )}

      <Input
        label="Email"
        type="email"
        name="email"
        value={data.email}
        onChange={(e) => updateData({ email: (e.target as HTMLInputElement).value })}
        placeholder="you@example.com"
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        name="password"
        value={data.password}
        onChange={(e) => updateData({ password: (e.target as HTMLInputElement).value })}
        placeholder={mode === "sign-up" ? "At least 8 characters" : "Your password"}
        required
        autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        helpText={mode === "sign-up" ? "Must be at least 8 characters" : undefined}
      />

      <Button type="submit" loading={loading} fullWidth size="md">
        {mode === "sign-up" ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-base text-gray-500 pt-2">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("sign-in")}
              className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            New to Olera?{" "}
            <button
              type="button"
              onClick={() => setMode("sign-up")}
              className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            >
              Create an account
            </button>
          </>
        )}
      </p>
    </form>
  );
}

function VerifyCodeStep({
  email,
  otpCode,
  setOtpCode,
  loading,
  resendCooldown,
  onVerify,
  onResend,
  onBack,
}: {
  email: string;
  otpCode: string;
  setOtpCode: (code: string) => void;
  loading: boolean;
  resendCooldown: number;
  onVerify: (e?: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  return (
    <div className="py-2">
      <div className="text-center mb-6">
        <div className="mb-4">
          <svg className="w-14 h-14 text-primary-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-base text-gray-600">We sent a verification code to</p>
        <p className="font-semibold text-gray-900 mt-1">{email}</p>
      </div>

      <form onSubmit={onVerify} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 text-center mb-3">
            Enter 6-digit code
          </label>
          <OtpInput value={otpCode} onChange={setOtpCode} disabled={loading} />
        </div>

        <Button type="submit" loading={loading} fullWidth size="md" disabled={otpCode.length !== 6}>
          Verify code
        </Button>

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">Didn&apos;t receive the code?</p>
          {resendCooldown > 0 ? (
            <p className="text-sm text-gray-400">Resend available in {resendCooldown}s</p>
          ) : (
            <button
              type="button"
              onClick={onResend}
              disabled={loading}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm focus:outline-none focus:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
          <div className="pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700 text-sm focus:outline-none focus:underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function IntentStep({ onSelect }: { onSelect: (intent: UserIntent) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-6">
        Tell us what brings you to Olera so we can personalize your experience.
      </p>

      <button
        type="button"
        onClick={() => onSelect("family")}
        className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">I&apos;m looking for care</h3>
            <p className="text-sm text-gray-500 mt-1">
              Find care providers for yourself or a loved one
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect("provider")}
        className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">I&apos;m a care provider</h3>
            <p className="text-sm text-gray-500 mt-1">
              List your services and connect with families
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}

function ProviderTypeStep({ onSelect }: { onSelect: (type: ProviderType) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-6">
        Which best describes you?
      </p>

      <button
        type="button"
        onClick={() => onSelect("organization")}
        className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
      >
        <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
        <p className="text-sm text-gray-500 mt-1">
          Assisted living, home care agency, hospice, or other care facility
        </p>
      </button>

      <button
        type="button"
        onClick={() => onSelect("caregiver")}
        className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
      >
        <h3 className="text-lg font-semibold text-gray-900">Private Caregiver</h3>
        <p className="text-sm text-gray-500 mt-1">
          Independent caregiver offering personal care services
        </p>
      </button>
    </div>
  );
}

function ProviderInfoStep({
  data,
  updateData,
  loading,
  isValid,
  onNext,
  careTypes,
  categories,
}: {
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  loading: boolean;
  isValid: boolean;
  onNext: () => void;
  careTypes: string[];
  categories: { value: ProfileCategory; label: string }[];
}) {
  const isOrg = data.providerType === "organization";

  return (
    <div className="space-y-4">
      {isOrg ? (
        <Input
          label="Organization name"
          type="text"
          value={data.orgName}
          onChange={(e) => updateData({ orgName: (e.target as HTMLInputElement).value })}
          placeholder="e.g., Sunrise Senior Living"
          required
        />
      ) : (
        <Input
          label="Your name"
          type="text"
          value={data.displayName}
          onChange={(e) => updateData({ displayName: (e.target as HTMLInputElement).value })}
          placeholder="First and last name"
          required
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="City"
          type="text"
          value={data.city}
          onChange={(e) => updateData({ city: (e.target as HTMLInputElement).value })}
          placeholder="City"
        />
        <Input
          label="State"
          type="text"
          value={data.state}
          onChange={(e) => updateData({ state: (e.target as HTMLInputElement).value })}
          placeholder="State"
        />
      </div>

      {isOrg && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Organization type
          </label>
          <select
            value={data.category || ""}
            onChange={(e) => updateData({ category: e.target.value as ProfileCategory || null })}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a type...</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Care types offered
        </label>
        <div className="flex flex-wrap gap-2">
          {careTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                const current = data.careTypes;
                if (current.includes(type)) {
                  updateData({ careTypes: current.filter((t) => t !== type) });
                } else {
                  updateData({ careTypes: [...current, type] });
                }
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                data.careTypes.includes(type)
                  ? "bg-primary-100 text-primary-700 border-2 border-primary-300"
                  : "bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        onClick={onNext}
        disabled={!isValid || loading}
        loading={loading}
        fullWidth
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}

function OrgSearchStep({
  searchQuery,
  setSearchQuery,
  searchResults,
  searching,
  hasSearched,
  selectedOrgId,
  setSelectedOrgId,
  onSearch,
  onNext,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Profile[];
  searching: boolean;
  hasSearched: boolean;
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  onSearch: () => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        We may already have your organization listed. Search to claim your existing profile, or skip to create a new one.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by organization name..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
        />
        <Button type="button" onClick={onSearch} loading={searching} variant="secondary">
          Search
        </Button>
      </div>

      {hasSearched && (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No matching organizations found. You can create a new profile.
            </p>
          ) : (
            searchResults.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => setSelectedOrgId(selectedOrgId === org.id ? null : org.id)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                  selectedOrgId === org.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="font-medium text-gray-900">{org.display_name}</p>
                {(org.city || org.state) && (
                  <p className="text-sm text-gray-500">
                    {[org.city, org.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {org.care_types && org.care_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {org.care_types.slice(0, 3).map((type) => (
                      <span
                        key={type}
                        className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}

      <Button type="button" onClick={onNext} fullWidth size="lg">
        {selectedOrgId ? "Claim this organization" : "Create new profile"}
      </Button>
    </div>
  );
}

function VisibilityStep({
  data,
  updateData,
  loading,
  onComplete,
}: {
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  loading: boolean;
  onComplete: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Control who can discover your profile on Olera.
      </p>

      <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          checked={data.visibleToFamilies}
          onChange={(e) => updateData({ visibleToFamilies: e.target.checked })}
          className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <p className="font-medium text-gray-900">Visible to families</p>
          <p className="text-sm text-gray-500">
            Families searching for care can find and contact you
          </p>
        </div>
      </label>

      <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          checked={data.visibleToProviders}
          onChange={(e) => updateData({ visibleToProviders: e.target.checked })}
          className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <div>
          <p className="font-medium text-gray-900">
            {data.providerType === "organization" ? "Visible to caregivers" : "Visible to organizations"}
          </p>
          <p className="text-sm text-gray-500">
            {data.providerType === "organization"
              ? "Caregivers can find you for employment opportunities"
              : "Organizations can find you for job opportunities"}
          </p>
        </div>
      </label>

      <Button type="button" onClick={onComplete} loading={loading} fullWidth size="lg">
        Complete setup
      </Button>
    </div>
  );
}

function FamilyInfoStep({
  data,
  updateData,
  onNext,
}: {
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  onNext: () => void;
}) {
  const isValid = data.displayName.trim().length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Tell us a bit about who needs care so we can help you find the right providers.
      </p>

      <Input
        label="Your name"
        type="text"
        value={data.displayName}
        onChange={(e) => updateData({ displayName: (e.target as HTMLInputElement).value })}
        placeholder="First and last name"
        required
      />

      <Input
        label="Care recipient's name (optional)"
        type="text"
        value={data.careRecipientName}
        onChange={(e) => updateData({ careRecipientName: (e.target as HTMLInputElement).value })}
        placeholder="Who will be receiving care?"
      />

      <Input
        label="Your relationship (optional)"
        type="text"
        value={data.careRecipientRelation}
        onChange={(e) => updateData({ careRecipientRelation: (e.target as HTMLInputElement).value })}
        placeholder="e.g., Parent, Spouse, Self"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="City"
          type="text"
          value={data.city}
          onChange={(e) => updateData({ city: (e.target as HTMLInputElement).value })}
          placeholder="City"
        />
        <Input
          label="State"
          type="text"
          value={data.state}
          onChange={(e) => updateData({ state: (e.target as HTMLInputElement).value })}
          placeholder="State"
        />
      </div>

      <Button type="button" onClick={onNext} disabled={!isValid} fullWidth size="lg">
        Continue
      </Button>
    </div>
  );
}

function FamilyNeedsStep({
  data,
  updateData,
  loading,
  careTypes,
  onComplete,
}: {
  data: FlowData;
  updateData: (partial: Partial<FlowData>) => void;
  loading: boolean;
  careTypes: string[];
  onComplete: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        What types of care are you looking for? Select all that apply.
      </p>

      <div className="flex flex-wrap gap-2">
        {careTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              const current = data.careNeeds;
              if (current.includes(type)) {
                updateData({ careNeeds: current.filter((t) => t !== type) });
              } else {
                updateData({ careNeeds: [...current, type] });
              }
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              data.careNeeds.includes(type)
                ? "bg-primary-100 text-primary-700 border-2 border-primary-300"
                : "bg-gray-100 text-gray-600 border-2 border-transparent hover:border-gray-300"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <Button type="button" onClick={onComplete} loading={loading} fullWidth size="lg">
        Complete setup
      </Button>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function generateSlug(name: string, city: string, state: string): string {
  const parts = [name, city, state].filter(Boolean);
  const slug = parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}
