"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Profile, ProfileCategory } from "@/lib/types";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import OtpInput from "@/components/auth/OtpInput";

// ============================================================
// Types
// ============================================================

type ProviderType = "caregiver" | "organization";

type Step =
  | "type-select"
  | "basic-info"
  | "org-search"
  | "visibility"
  | "create-account"
  | "verify-code";

interface ProviderData {
  providerType: ProviderType | null;
  displayName: string;
  city: string;
  state: string;
  zip: string;
  careTypes: string[];
  category: ProfileCategory | null;
  description: string;
  phone: string;
  claimedProfileId: string | null;
  claimedProfile: Profile | null;
  visibleToFamilies: boolean;
  visibleToProviders: boolean; // orgs see caregivers; caregivers see orgs
}

const INITIAL_DATA: ProviderData = {
  providerType: null,
  displayName: "",
  city: "",
  state: "",
  zip: "",
  careTypes: [],
  category: null,
  description: "",
  phone: "",
  claimedProfileId: null,
  claimedProfile: null,
  visibleToFamilies: true,
  visibleToProviders: true,
};

interface ProviderOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
// Component
// ============================================================

export default function ProviderOnboardingModal({
  isOpen,
  onClose,
}: ProviderOnboardingModalProps) {
  const { user, account, refreshAccountData } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("type-select");
  const [data, setData] = useState<ProviderData>(INITIAL_DATA);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auth form state (embedded in create-account step)
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // OTP verification state
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Org search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("type-select");
      setData(INITIAL_DATA);
      setError("");
      setSubmitting(false);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthError("");
      setSearchQuery("");
      setSearchResults([]);
      setSearching(false);
      setHasSearched(false);
      setSelectedOrgId(null);
      setOtpCode("");
      setResendCooldown(0);
    }
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const update = (partial: Partial<ProviderData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  };

  // ----------------------------------------------------------
  // Step navigation
  // ----------------------------------------------------------

  const totalSteps = data.providerType === "organization" ? 5 : 4;
  const stepIndex: Record<Step, number> = {
    "type-select": 1,
    "basic-info": 2,
    "org-search": 3,
    visibility: data.providerType === "organization" ? 4 : 3,
    "create-account": data.providerType === "organization" ? 5 : 4,
    "verify-code": data.providerType === "organization" ? 5 : 4, // Same step as create-account
  };

  const goBack = () => {
    setError("");
    setAuthError("");
    if (step === "basic-info") setStep("type-select");
    else if (step === "org-search") setStep("basic-info");
    else if (step === "visibility") {
      setStep(data.providerType === "organization" ? "org-search" : "basic-info");
    } else if (step === "create-account") setStep("visibility");
    else if (step === "verify-code") {
      setStep("create-account");
      setOtpCode("");
    }
  };

  // ----------------------------------------------------------
  // Step 1: Type selection
  // ----------------------------------------------------------

  const handleTypeSelect = (type: ProviderType) => {
    update({ providerType: type });
    setStep("basic-info");
  };

  // ----------------------------------------------------------
  // Step 2: Basic info → next
  // ----------------------------------------------------------

  const handleBasicInfoNext = () => {
    if (data.providerType === "organization") {
      // Pre-fill org search with the name they entered
      setSearchQuery(data.displayName);
      setStep("org-search");
    } else {
      setStep("visibility");
    }
  };

  const basicInfoValid =
    data.displayName.trim().length > 0 &&
    (data.city.trim().length > 0 || data.state.trim().length > 0) &&
    data.careTypes.length > 0;

  // ----------------------------------------------------------
  // Step 3: Org search
  // ----------------------------------------------------------

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
    if (step === "org-search" && data.displayName && !hasSearched) {
      searchOrgs(data.displayName);
    }
  }, [step, data.displayName, hasSearched, searchOrgs]);

  const handleOrgSearchNext = () => {
    if (selectedOrgId) {
      const profile = searchResults.find((p) => p.id === selectedOrgId);
      if (profile) {
        update({
          claimedProfileId: selectedOrgId,
          claimedProfile: profile,
        });
      }
    }
    setStep("visibility");
  };

  // ----------------------------------------------------------
  // Step 5: Account creation + profile persist
  // ----------------------------------------------------------

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (authPassword.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        setAuthError("Backend not configured.");
        setSubmitting(false);
        return;
      }

      const supabase = createClient();

      // --- Create auth account ---
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: authEmail,
          password: authPassword,
          options: { data: { display_name: authName || undefined } },
        }
      );

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setAuthError("This email is already registered. Try signing in instead.");
        } else {
          setAuthError(signUpError.message);
        }
        setSubmitting(false);
        return;
      }

      // Email confirmation required
      if (!authData.session) {
        if (
          authData.user &&
          authData.user.identities &&
          authData.user.identities.length === 0
        ) {
          setAuthError("This email is already registered. Try signing in instead.");
          setSubmitting(false);
          return;
        }
        // Email confirmation required — show OTP verification screen
        setResendCooldown(30); // Initial cooldown before allowing resend
        setSubmitting(false);
        setStep("verify-code");
        return;
      }

      // --- User is signed in. Now wait for account row to exist ---
      // The auth trigger creates the account row; we need to poll briefly.
      let accountRow = account;
      if (!accountRow) {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const { data: acct } = await supabase
            .from("accounts")
            .select("*")
            .eq("user_id", authData.user!.id)
            .single();
          if (acct) {
            accountRow = acct;
            break;
          }
        }
      }

      if (!accountRow) {
        setAuthError("Account setup timed out. Please try again.");
        setSubmitting(false);
        return;
      }

      // --- Create or claim profile ---
      const profileType = data.providerType === "caregiver" ? "caregiver" : "organization";
      let profileId: string;

      if (data.claimedProfileId && data.claimedProfile) {
        // Claiming an existing seeded profile — only fill empty fields
        profileId = data.claimedProfileId;
        const s = data.claimedProfile;
        const claimUpdate: Record<string, unknown> = {
          account_id: accountRow.id,
          claim_state: "claimed",
        };
        if (!s.display_name?.trim() && data.displayName) claimUpdate.display_name = data.displayName;
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
          .eq("id", profileId);
        if (claimErr) throw claimErr;
      } else {
        // Create new profile
        const slug = generateSlug(data.displayName, data.city, data.state);
        const { data: newProfile, error: profileErr } = await supabase
          .from("profiles")
          .insert({
            account_id: accountRow.id,
            slug,
            type: profileType,
            category: data.category,
            display_name: data.displayName,
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
        profileId = newProfile.id;
      }

      // --- Update account ---
      const { error: accountErr } = await supabase
        .from("accounts")
        .update({
          onboarding_completed: true,
          active_profile_id: profileId,
          display_name: accountRow.display_name || data.displayName || authName,
        })
        .eq("id", accountRow.id);
      if (accountErr) throw accountErr;

      // --- Create membership ---
      await supabase.from("memberships").upsert(
        { account_id: accountRow.id, plan: "free", status: "free" },
        { onConflict: "account_id" }
      );

      // --- Done ---
      await refreshAccountData();
      onClose();
      router.push("/portal");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("Provider onboarding error:", message, err);
      setAuthError(`Something went wrong: ${message}`);
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------------
  // OTP Verification (after create-account)
  // ----------------------------------------------------------

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otpCode.length !== 6) {
      setAuthError("Please enter the 6-digit code.");
      return;
    }

    setAuthError("");
    setSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        setAuthError("Backend not configured.");
        setSubmitting(false);
        return;
      }

      const supabase = createClient();
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: authEmail,
        token: otpCode,
        type: "email",
      });

      if (verifyError) {
        if (verifyError.message.includes("expired")) {
          setAuthError("This code has expired. Please request a new one.");
        } else if (verifyError.message.includes("invalid")) {
          setAuthError("Invalid code. Please check and try again.");
        } else {
          setAuthError(verifyError.message);
        }
        setSubmitting(false);
        return;
      }

      // User is now signed in — continue with profile creation
      // Wait for account row to exist (created by auth trigger)
      let accountRow = account;
      if (!accountRow && verifyData.user) {
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 500));
          const { data: acct } = await supabase
            .from("accounts")
            .select("*")
            .eq("user_id", verifyData.user.id)
            .single();
          if (acct) {
            accountRow = acct;
            break;
          }
        }
      }

      if (!accountRow) {
        setAuthError("Account setup timed out. Please try again.");
        setSubmitting(false);
        return;
      }

      // --- Create or claim profile ---
      const profileType = data.providerType === "caregiver" ? "caregiver" : "organization";
      let profileId: string;

      if (data.claimedProfileId && data.claimedProfile) {
        // Claiming an existing seeded profile
        profileId = data.claimedProfileId;
        const s = data.claimedProfile;
        const claimUpdate: Record<string, unknown> = {
          account_id: accountRow.id,
          claim_state: "claimed",
        };
        if (!s.display_name?.trim() && data.displayName) claimUpdate.display_name = data.displayName;
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
          .eq("id", profileId);
        if (claimErr) throw claimErr;
      } else {
        // Create new profile
        const slug = generateSlug(data.displayName, data.city, data.state);
        const { data: newProfile, error: profileErr } = await supabase
          .from("profiles")
          .insert({
            account_id: accountRow.id,
            slug,
            type: profileType,
            category: data.category,
            display_name: data.displayName,
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
        profileId = newProfile.id;
      }

      // --- Update account ---
      const { error: accountErr } = await supabase
        .from("accounts")
        .update({
          onboarding_completed: true,
          active_profile_id: profileId,
          display_name: accountRow.display_name || data.displayName || authName,
        })
        .eq("id", accountRow.id);
      if (accountErr) throw accountErr;

      // --- Create membership ---
      await supabase.from("memberships").upsert(
        { account_id: accountRow.id, plan: "free", status: "free" },
        { onConflict: "account_id" }
      );

      // --- Done ---
      await refreshAccountData();
      onClose();
      router.push("/portal");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("OTP verification error:", message, err);
      setAuthError(`Something went wrong: ${message}`);
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setAuthError("");
    setSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        setAuthError("Backend not configured.");
        setSubmitting(false);
        return;
      }

      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: authEmail,
      });

      if (resendError) {
        setAuthError(resendError.message);
        setSubmitting(false);
        return;
      }

      setResendCooldown(60); // 60 second cooldown
      setOtpCode(""); // Clear any partial input
      setSubmitting(false);
    } catch (err) {
      console.error("Resend code error:", err);
      setAuthError("Failed to resend code. Please try again.");
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------------
  // If user is already authenticated, skip account creation
  // ----------------------------------------------------------

  const handleSubmitAuthenticated = async () => {
    if (!user || !account || !isSupabaseConfigured()) return;
    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const profileType = data.providerType === "caregiver" ? "caregiver" : "organization";
      let profileId: string;

      if (data.claimedProfileId && data.claimedProfile) {
        profileId = data.claimedProfileId;
        const s = data.claimedProfile;
        const claimUpdate: Record<string, unknown> = {
          account_id: account.id,
          claim_state: "claimed",
        };
        if (!s.display_name?.trim() && data.displayName) claimUpdate.display_name = data.displayName;
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
          .eq("id", profileId);
        if (claimErr) throw claimErr;
      } else {
        const slug = generateSlug(data.displayName, data.city, data.state);
        const { data: newProfile, error: profileErr } = await supabase
          .from("profiles")
          .insert({
            account_id: account.id,
            slug,
            type: profileType,
            category: data.category,
            display_name: data.displayName,
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
        profileId = newProfile.id;
      }

      const accountUpdate: Record<string, unknown> = {
        onboarding_completed: true,
      };
      if (!account.display_name) accountUpdate.display_name = data.displayName;
      if (!account.active_profile_id) accountUpdate.active_profile_id = profileId;

      const { error: accountErr } = await supabase
        .from("accounts")
        .update(accountUpdate)
        .eq("id", account.id);
      if (accountErr) throw accountErr;

      await supabase.from("memberships").upsert(
        { account_id: account.id, plan: "free", status: "free" },
        { onConflict: "account_id" }
      );

      await refreshAccountData();
      onClose();
      router.push("/portal");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("Provider onboarding error:", message, err);
      setError(`Something went wrong: ${message}`);
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  const currentStepNum = stepIndex[step] ?? 1;

  // Title varies by step
  const titles: Record<Step, string> = {
    "type-select": "Get started on Olera",
    "basic-info":
      data.providerType === "organization"
        ? "About your organization"
        : "About you",
    "org-search": "Is your organization listed?",
    visibility: "Who can find you?",
    "create-account": "Create your account",
    "verify-code": "Verify your email",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={titles[step]} size="lg">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-gray-500">
            Step {currentStepNum} of {totalSteps}
          </span>
          {step !== "type-select" && (
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
            style={{ width: `${(currentStepNum / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}

      {/* ---- Step 1: Provider type ---- */}
      {step === "type-select" && (
        <div className="space-y-3">
          <p className="text-gray-600 mb-4">
            Tell us which best describes you so we can tailor your experience.
          </p>
          <button
            type="button"
            onClick={() => handleTypeSelect("organization")}
            className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">Organization</h3>
            <p className="text-sm text-gray-500 mt-1">
              Assisted living, home care, hospice, or other care facility
            </p>
          </button>
          <button
            type="button"
            onClick={() => handleTypeSelect("caregiver")}
            className="w-full text-left p-5 rounded-xl border-2 border-gray-200 hover:border-secondary-400 hover:bg-secondary-50/50 transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">
              Private caregiver
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Independent caregiver looking to connect with families or organizations
            </p>
          </button>
        </div>
      )}

      {/* ---- Step 2: Basic info ---- */}
      {step === "basic-info" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleBasicInfoNext();
          }}
          className="space-y-5"
        >
          <Input
            label={
              data.providerType === "organization"
                ? "Organization name"
                : "Your name"
            }
            name="displayName"
            value={data.displayName}
            onChange={(e) =>
              update({ displayName: (e.target as HTMLInputElement).value })
            }
            placeholder={
              data.providerType === "organization"
                ? "e.g., Sunrise Senior Living"
                : "First and last name"
            }
            required
          />

          {data.providerType === "organization" && (
            <div className="space-y-1.5">
              <label
                htmlFor="ob-category"
                className="block text-base font-medium text-gray-700"
              >
                Type of organization
              </label>
              <select
                id="ob-category"
                value={data.category || ""}
                onChange={(e) =>
                  update({
                    category: (e.target.value as ProfileCategory) || null,
                  })
                }
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
              >
                <option value="">Select a category</option>
                {ORG_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              name="city"
              value={data.city}
              onChange={(e) =>
                update({ city: (e.target as HTMLInputElement).value })
              }
              placeholder="City"
            />
            <Input
              label="State"
              name="state"
              value={data.state}
              onChange={(e) =>
                update({ state: (e.target as HTMLInputElement).value })
              }
              placeholder="e.g., TX"
            />
          </div>

          {/* Care types */}
          <div className="space-y-2">
            <label className="block text-base font-medium text-gray-700">
              {data.providerType === "organization"
                ? "Care types offered"
                : "Services you provide"}
            </label>
            <div className="flex flex-wrap gap-2">
              {CARE_TYPES.map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => {
                    const current = data.careTypes;
                    update({
                      careTypes: current.includes(ct)
                        ? current.filter((c) => c !== ct)
                        : [...current, ct],
                    });
                  }}
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border min-h-[36px]",
                    data.careTypes.includes(ct)
                      ? "bg-primary-50 border-primary-500 text-primary-700"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
                  ].join(" ")}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={!basicInfoValid}
          >
            Continue
          </Button>
        </form>
      )}

      {/* ---- Step 3: Org search (organization only) ---- */}
      {step === "org-search" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            We may already have a listing for your organization.
            Claim it to take control, or create a new one.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchOrgs(searchQuery);
            }}
            className="flex gap-3"
          >
            <div className="flex-1">
              <Input
                label="Search by name"
                name="orgSearch"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery((e.target as HTMLInputElement).value)
                }
                placeholder="e.g., Sunrise Senior Living"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="secondary" loading={searching}>
                Search
              </Button>
            </div>
          </form>

          {hasSearched && (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600">
                    No matching listings found. We&apos;ll create a new one for you.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-500">
                    {searchResults.length} result
                    {searchResults.length !== 1 ? "s" : ""} found
                  </p>
                  {searchResults.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() =>
                        setSelectedOrgId(
                          selectedOrgId === profile.id ? null : profile.id
                        )
                      }
                      className={[
                        "w-full text-left p-3 rounded-xl border-2 transition-all",
                        selectedOrgId === profile.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 bg-white hover:border-gray-300",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 text-sm">
                              {profile.display_name}
                            </span>
                            <Badge variant="unclaimed">Unclaimed</Badge>
                          </div>
                          {(profile.city || profile.state) && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {[profile.city, profile.state]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                        </div>
                        {selectedOrgId === profile.id && (
                          <span className="text-primary-600 font-medium text-xs">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          <Button fullWidth size="lg" onClick={handleOrgSearchNext}>
            {selectedOrgId
              ? "Claim and continue"
              : hasSearched && searchResults.length === 0
              ? "Create new listing"
              : "Skip — create new listing"}
          </Button>
        </div>
      )}

      {/* ---- Step 4: Visibility preferences ---- */}
      {step === "visibility" && (
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            Choose who can discover your profile on Olera.
            You can change this anytime in settings.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={data.visibleToFamilies}
                onChange={(e) =>
                  update({ visibleToFamilies: e.target.checked })
                }
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-gray-900">Families</span>
                <p className="text-sm text-gray-500">
                  Families searching for care can find and contact you
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 cursor-pointer hover:border-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={data.visibleToProviders}
                onChange={(e) =>
                  update({ visibleToProviders: e.target.checked })
                }
                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-gray-900">
                  {data.providerType === "organization"
                    ? "Caregivers"
                    : "Organizations"}
                </span>
                <p className="text-sm text-gray-500">
                  {data.providerType === "organization"
                    ? "Caregivers looking for employment can find you"
                    : "Organizations hiring caregivers can find you"}
                </p>
              </div>
            </label>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={() => {
              if (user && account) {
                handleSubmitAuthenticated();
              } else {
                setStep("create-account");
              }
            }}
            loading={submitting}
          >
            {user ? "Complete setup" : "Continue"}
          </Button>
        </div>
      )}

      {/* ---- Step 5: Account creation ---- */}
      {step === "create-account" && (
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <p className="text-sm text-gray-600">
            Create an account to save your profile and start connecting.
          </p>

          <Input
            label="Your name"
            type="text"
            name="authName"
            value={authName}
            onChange={(e) =>
              setAuthName((e.target as HTMLInputElement).value)
            }
            placeholder="First and last name"
            autoComplete="name"
          />

          <Input
            label="Email"
            type="email"
            name="authEmail"
            value={authEmail}
            onChange={(e) =>
              setAuthEmail((e.target as HTMLInputElement).value)
            }
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type="password"
            name="authPassword"
            value={authPassword}
            onChange={(e) =>
              setAuthPassword((e.target as HTMLInputElement).value)
            }
            placeholder="At least 8 characters"
            required
            autoComplete="new-password"
            helpText="Must be at least 8 characters"
          />

          {authError && (
            <div
              className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm"
              role="alert"
            >
              {authError}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={submitting}
          >
            Create account &amp; finish
          </Button>

          <p className="text-center text-xs text-gray-500">
            By creating an account you agree to Olera&apos;s Terms of Service
            and Privacy Policy.
          </p>
        </form>
      )}

      {/* ---- Step 5b: OTP Verification ---- */}
      {step === "verify-code" && (
        <div className="py-2">
          <div className="text-center mb-6">
            <div className="mb-4">
              <svg className="w-14 h-14 text-primary-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-base text-gray-600">
              We sent a verification code to
            </p>
            <p className="font-semibold text-gray-900 mt-1">{authEmail}</p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 text-center mb-3">
                Enter 6-digit code
              </label>
              <OtpInput
                value={otpCode}
                onChange={setOtpCode}
                disabled={submitting}
                error={!!authError}
              />
            </div>

            {authError && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-base text-center" role="alert">
                {authError}
              </div>
            )}

            <Button
              type="submit"
              loading={submitting}
              fullWidth
              size="lg"
              disabled={otpCode.length !== 6}
            >
              Verify &amp; complete setup
            </Button>

            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">
                Didn&apos;t receive the code?
              </p>
              {resendCooldown > 0 ? (
                <p className="text-sm text-gray-400">
                  Resend available in {resendCooldown}s
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={submitting}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm focus:outline-none focus:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("create-account");
                    setOtpCode("");
                    setAuthError("");
                  }}
                  className="text-gray-500 hover:text-gray-700 text-sm focus:outline-none focus:underline"
                >
                  Use a different email
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </Modal>
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
