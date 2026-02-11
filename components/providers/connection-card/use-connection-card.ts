"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDeferredAction, clearDeferredAction } from "@/lib/deferred-action";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import { mapProviderCareTypes } from "./constants";
import type {
  CardState,
  IntentStep,
  IntentData,
  IdentityData,
  CareRecipient,
  CareTypeValue,
  UrgencyValue,
  ContactPreference,
  ConnectionCardProps,
} from "./types";

const CONNECTION_INTENT_KEY = "olera_connection_intent";

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).substring(2, 6);
  return `family-${base}-${suffix}`;
}

const INITIAL_INTENT: IntentData = {
  careRecipient: null,
  careType: null,
  careTypeOtherText: "",
  urgency: null,
  additionalNotes: "",
};

const INITIAL_IDENTITY: IdentityData = {
  email: "",
  firstName: "",
  lastName: "",
  contactPreference: null,
  phone: "",
};

export function useConnectionCard(props: ConnectionCardProps) {
  const {
    providerId,
    providerName,
    providerSlug,
    careTypes: providerCareTypes,
    isActive,
  } = props;

  const { user, account, activeProfile, profiles, openAuth, refreshAccountData } =
    useAuth();
  const savedProviders = useSavedProviders();
  const phoneRevealTriggered = useRef(false);
  const connectionAuthTriggered = useRef(false);

  // ── State machine ──
  const [cardState, setCardState] = useState<CardState>("default");
  const [intentStep, setIntentStep] = useState<IntentStep>(0);
  const [intentData, setIntentData] = useState<IntentData>(INITIAL_INTENT);
  const [identityData, setIdentityData] =
    useState<IdentityData>(INITIAL_IDENTITY);

  // ── UI state ──
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const saved = savedProviders.isSaved(providerId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingRequestDate, setPendingRequestDate] = useState<string | null>(
    null
  );

  // ── Derived ──
  const availableCareTypes = mapProviderCareTypes(providerCareTypes);

  // ── Pre-fill identity from auth data ──
  const prefillIdentityFromAuth = useCallback(() => {
    if (!user || !account) return;

    const displayName = account.display_name || "";
    const nameParts = displayName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    setIdentityData((prev) => ({
      ...prev,
      email: user.email || prev.email,
      firstName: firstName || prev.firstName,
      lastName: lastName || prev.lastName,
      phone: activeProfile?.phone || prev.phone,
    }));
  }, [user, account, activeProfile]);

  // ── Check for inactive provider ──
  useEffect(() => {
    if (!isActive) {
      setCardState("inactive");
    }
  }, [isActive]);

  // ── Check for existing connection (logged-in users) ──
  useEffect(() => {
    if (!user || !profiles.length || !isSupabaseConfigured()) return;

    const checkExisting = async () => {
      const supabase = createClient();
      const profileIds = profiles.map((p) => p.id);
      const { data } = await supabase
        .from("connections")
        .select("id, created_at")
        .in("from_profile_id", profileIds)
        .eq("to_profile_id", providerId)
        .eq("type", "inquiry")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCardState("pending");
        setPendingRequestDate(data.created_at);
      }
    };

    checkExisting();
  }, [user, profiles, providerId]);

  // ── Handle deferred phone reveal after auth ──
  useEffect(() => {
    if (phoneRevealTriggered.current) return;
    if (!user) return;

    const deferred = getDeferredAction();
    if (
      deferred?.action === "phone_reveal" &&
      deferred?.targetProfileId === providerId
    ) {
      phoneRevealTriggered.current = true;
      clearDeferredAction();
      setPhoneRevealed(true);
    }
  }, [user, providerId]);

  // ── Handle deferred connection request after auth ──
  useEffect(() => {
    if (connectionAuthTriggered.current) return;
    if (!user || !account) return;

    const deferred = getDeferredAction();
    if (
      deferred?.action === "connection_request" &&
      deferred?.targetProfileId === providerId
    ) {
      connectionAuthTriggered.current = true;
      clearDeferredAction();

      // Restore intent data from sessionStorage (needed for Google OAuth redirect)
      try {
        const savedIntent = sessionStorage.getItem(CONNECTION_INTENT_KEY);
        if (savedIntent) {
          setIntentData(JSON.parse(savedIntent));
          sessionStorage.removeItem(CONNECTION_INTENT_KEY);
        }
      } catch {
        // Intent data may still be in React state if auth was overlay-based
      }

      // Pre-fill identity from newly authenticated user
      prefillIdentityFromAuth();

      // Advance to contact preference step
      setCardState("identity");
    }
  }, [user, account, providerId, prefillIdentityFromAuth]);

  // ── Navigation helpers ──
  const startFlow = useCallback(() => {
    setCardState("intent");
    setIntentStep(0);
  }, []);

  const resetFlow = useCallback(() => {
    setCardState("default");
    setIntentStep(0);
    setIntentData(INITIAL_INTENT);
    setIdentityData(INITIAL_IDENTITY);
    setError("");
  }, []);

  const goToNextIntentStep = useCallback(() => {
    if (intentStep === 0 && intentData.careRecipient) {
      setIntentStep(1);
    } else if (intentStep === 1 && intentData.careType) {
      setIntentStep(2);
    } else if (intentStep === 2 && intentData.urgency) {
      // "Just researching" → save and go back to default
      if (intentData.urgency === "researching") {
        if (!saved) {
          savedProviders.toggleSave({
            providerId,
            slug: providerSlug,
            name: providerName,
            location: "",
            careTypes: providerCareTypes || [],
            image: null,
          });
        }
        resetFlow();
        return;
      }

      // If user is logged in, pre-fill and go to contact preference
      if (user) {
        prefillIdentityFromAuth();
        setCardState("identity");
      } else {
        // Save intent data for OAuth resilience, then trigger auth
        try {
          sessionStorage.setItem(
            CONNECTION_INTENT_KEY,
            JSON.stringify(intentData)
          );
        } catch {
          // sessionStorage may fail in private browsing — state survives for overlay auth
        }
        openAuth({
          defaultMode: "sign-up",
          intent: "family",
          deferred: {
            action: "connection_request",
            targetProfileId: providerId,
            returnUrl: `/provider/${providerSlug}`,
          },
        });
      }
    }
  }, [
    intentStep,
    intentData,
    availableCareTypes,
    resetFlow,
    user,
    saved,
    savedProviders,
    providerId,
    providerSlug,
    providerName,
    providerCareTypes,
    prefillIdentityFromAuth,
    openAuth,
  ]);

  const goBackIntentStep = useCallback(() => {
    if (intentStep === 0) {
      resetFlow();
    } else {
      setIntentStep((prev) => (prev - 1) as IntentStep);
    }
  }, [intentStep, resetFlow]);

  const editIntentStep = useCallback((step: IntentStep) => {
    setIntentStep(step);
    setCardState("intent");
  }, []);

  const goBackFromIdentity = useCallback(() => {
    setCardState("intent");
    setIntentStep(2);
  }, []);

  // ── Field setters ──
  const setRecipient = useCallback((val: CareRecipient) => {
    setIntentData((prev) => ({ ...prev, careRecipient: val }));
  }, []);

  const setCareType = useCallback((val: CareTypeValue) => {
    setIntentData((prev) => ({ ...prev, careType: val }));
  }, []);

  const setUrgency = useCallback((val: UrgencyValue) => {
    setIntentData((prev) => ({ ...prev, urgency: val }));
  }, []);

  const setNotes = useCallback((val: string) => {
    setIntentData((prev) => ({ ...prev, additionalNotes: val }));
  }, []);

  const setContactPref = useCallback((val: ContactPreference) => {
    setIdentityData((prev) => ({ ...prev, contactPreference: val }));
  }, []);

  const setPhone = useCallback((val: string) => {
    setIdentityData((prev) => ({ ...prev, phone: val }));
  }, []);

  const revealPhone = useCallback(() => {
    if (!user) {
      openAuth({
        defaultMode: "sign-up",
        deferred: {
          action: "phone_reveal",
          targetProfileId: providerId,
          returnUrl: `/provider/${providerSlug}`,
        },
      });
      return;
    }
    setPhoneRevealed(true);
  }, [user, openAuth, providerId, providerSlug]);

  const toggleSave = useCallback(() => {
    savedProviders.toggleSave({
      providerId,
      slug: providerSlug,
      name: providerName,
      location: "",
      careTypes: providerCareTypes || [],
      image: null,
    });
  }, [savedProviders, providerId, providerSlug, providerName, providerCareTypes]);

  // ── Submit connection request ──
  const submitRequest = useCallback(async () => {
    setSubmitting(true);
    setError("");

    try {
      if (!user || !account || !isSupabaseConfigured()) {
        throw new Error("Please sign in to send a connection request.");
      }

      const supabase = createClient();

      // Ensure we have a family profile
      let fromProfileId: string;

      if (activeProfile?.type === "family") {
        fromProfileId = activeProfile.id;
      } else {
        // Check for existing family profile
        const { data: existingFamily } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("account_id", account.id)
          .eq("type", "family")
          .limit(1)
          .single();

        if (existingFamily) {
          fromProfileId = existingFamily.id;
        } else {
          // Create a minimal family profile
          const displayName =
            identityData.firstName && identityData.lastName
              ? `${identityData.firstName} ${identityData.lastName}`
              : account.display_name ||
                user.email?.split("@")[0] ||
                "Family";
          const slug = generateSlug(displayName);

          const { data: newProfile, error: profileError } = await supabase
            .from("business_profiles")
            .insert({
              account_id: account.id,
              slug,
              type: "family",
              category: null,
              display_name: displayName,
              care_types: [],
              claim_state: "claimed",
              verification_state: "unverified",
              source: "user_created",
              metadata: {},
            })
            .select("id")
            .single();

          if (profileError) throw new Error(profileError.message);
          fromProfileId = newProfile.id;

          if (!activeProfile) {
            await supabase
              .from("accounts")
              .update({
                active_profile_id: newProfile.id,
                onboarding_completed: true,
              })
              .eq("id", account.id);
            await refreshAccountData();
          }
        }
      }

      // Insert connection request
      const messagePayload = JSON.stringify({
        care_recipient: intentData.careRecipient,
        care_type: intentData.careType,
        care_type_other: intentData.careTypeOtherText || null,
        urgency: intentData.urgency,
        additional_notes: intentData.additionalNotes || null,
        contact_preference: identityData.contactPreference,
        seeker_phone: identityData.phone || activeProfile?.phone || null,
        seeker_email: identityData.email || user.email || "",
        seeker_first_name: identityData.firstName,
        seeker_last_name: identityData.lastName,
      });

      const { error: insertError } = await supabase
        .from("connections")
        .insert({
          from_profile_id: fromProfileId,
          to_profile_id: providerId,
          type: "inquiry",
          status: "pending",
          message: messagePayload,
        });

      if (insertError) {
        if (
          insertError.code === "23505" ||
          insertError.message.includes("duplicate") ||
          insertError.message.includes("unique")
        ) {
          setCardState("pending");
          setPendingRequestDate(new Date().toISOString());
          return;
        }
        throw new Error(insertError.message);
      }

      // Transition to confirmation
      setCardState("confirmation");
      setPhoneRevealed(true); // Phone revealed as reward after connecting
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("Connection request error:", msg);
      setError(`Something went wrong. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  }, [
    user,
    account,
    activeProfile,
    providerId,
    providerName,
    intentData,
    identityData,
    refreshAccountData,
  ]);

  return {
    // State
    cardState,
    intentStep,
    intentData,
    identityData,
    phoneRevealed,
    saved,
    submitting,
    error,
    pendingRequestDate,
    availableCareTypes,

    // Navigation
    startFlow,
    resetFlow,
    goToNextIntentStep,
    goBackIntentStep,
    editIntentStep,
    goBackFromIdentity,

    // Field setters
    setRecipient,
    setCareType,
    setUrgency,
    setNotes,
    setContactPref,
    setPhone,
    revealPhone,
    toggleSave,

    // Actions
    submitRequest,
  };
}
