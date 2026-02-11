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
  CareRecipient,
  CareTypeValue,
  UrgencyValue,
  ConnectionCardProps,
} from "./types";

const CONNECTION_INTENT_KEY = "olera_connection_intent";

const INITIAL_INTENT: IntentData = {
  careRecipient: null,
  careType: null,
  careTypeOtherText: "",
  urgency: null,
  additionalNotes: "",
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

  // ── UI state ──
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const saved = savedProviders.isSaved(providerId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingRequestDate, setPendingRequestDate] = useState<string | null>(
    null
  );
  const [previousIntent, setPreviousIntent] = useState<IntentData | null>(null);

  // ── Derived ──
  const availableCareTypes = mapProviderCareTypes(providerCareTypes);
  const notificationEmail = user?.email || "your email";

  // ── Check for inactive provider ──
  useEffect(() => {
    if (!isActive) {
      setCardState("inactive");
    }
  }, [isActive]);

  // ── Check for existing connection + fetch previous intent (logged-in users) ──
  useEffect(() => {
    if (!user || !profiles.length || !isSupabaseConfigured()) return;

    const checkExisting = async () => {
      const supabase = createClient();
      const profileIds = profiles.map((p) => p.id);

      // Resolve provider ID: if it's not a UUID (iOS provider), look up the business_profiles record
      let resolvedId = providerId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId);
      if (!isUUID) {
        const { data: profile } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("source_provider_id", providerId)
          .limit(1)
          .single();
        if (!profile) return; // No business_profiles record = no existing connection
        resolvedId = profile.id;
      }

      // Check if there's an existing connection to THIS provider
      const { data } = await supabase
        .from("connections")
        .select("id, created_at")
        .in("from_profile_id", profileIds)
        .eq("to_profile_id", resolvedId)
        .eq("type", "inquiry")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setCardState("pending");
        setPendingRequestDate(data.created_at);
        return; // Already connected — no need to fetch previous intent
      }

      // No connection to this provider — fetch the most recent connection
      // to ANY provider to pre-fill intent data for returning users
      const { data: recentConn } = await supabase
        .from("connections")
        .select("message")
        .in("from_profile_id", profileIds)
        .eq("type", "inquiry")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (recentConn?.message) {
        try {
          const parsed = JSON.parse(recentConn.message);
          const restored: IntentData = {
            careRecipient: parsed.care_recipient || null,
            careType: parsed.care_type || null,
            careTypeOtherText: "",
            urgency: parsed.urgency || null,
            additionalNotes: "",
          };
          // Only use as previous intent if core fields are present
          if (restored.careRecipient && restored.careType && restored.urgency) {
            setPreviousIntent(restored);
            setIntentData(restored);
            setCardState("returning");
          }
        } catch {
          // Invalid JSON — ignore
        }
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

  // ── Submit connection request via API ──
  const submitRequest = useCallback(async (intentOverride?: IntentData) => {
    const intent = intentOverride || intentData;

    setSubmitting(true);
    setError("");

    try {
      if (!user) {
        throw new Error("Please sign in to send a connection request.");
      }

      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          providerName,
          providerSlug,
          intentData: intent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send request.");
      }

      if (data.status === "duplicate") {
        setCardState("pending");
        setPendingRequestDate(data.created_at);
        return;
      }

      // Refresh auth data so active profile is up-to-date
      await refreshAccountData();

      // Transition to confirmation
      setCardState("confirmation");
      setPhoneRevealed(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("Connection request error:", msg);
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    user,
    providerId,
    providerName,
    providerSlug,
    intentData,
    refreshAccountData,
  ]);

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
      let restoredIntent: IntentData | null = null;
      try {
        const savedIntent = sessionStorage.getItem(CONNECTION_INTENT_KEY);
        if (savedIntent) {
          restoredIntent = JSON.parse(savedIntent);
          sessionStorage.removeItem(CONNECTION_INTENT_KEY);
        }
      } catch {
        // Intent data may still be in React state if auth was overlay-based
      }

      // Auto-submit — pass restored intent directly to avoid async state issue
      setCardState("submitting");
      submitRequest(restoredIntent || undefined);
    }
  }, [user, account, providerId, submitRequest]);

  // ── Navigation helpers ──
  const startFlow = useCallback(() => {
    if (user && previousIntent) {
      // Returning logged-in user — pre-fill and show compact summary
      setIntentData(previousIntent);
      setCardState("returning");
    } else {
      setCardState("intent");
      setIntentStep(0);
    }
  }, [user, previousIntent]);

  const resetFlow = useCallback(() => {
    setCardState("default");
    setIntentStep(0);
    setIntentData(INITIAL_INTENT);
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

      // If user is logged in, auto-submit immediately
      if (user) {
        setCardState("submitting");
        submitRequest();
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
    submitRequest,
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

  const editFromReturning = useCallback(() => {
    setIntentStep(0);
    setCardState("intent");
  }, []);

  const submitFromReturning = useCallback(() => {
    setCardState("submitting");
    submitRequest();
  }, [submitRequest]);

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

  return {
    // State
    cardState,
    intentStep,
    intentData,
    phoneRevealed,
    saved,
    submitting,
    error,
    pendingRequestDate,
    availableCareTypes,
    notificationEmail,

    // Navigation
    startFlow,
    resetFlow,
    goToNextIntentStep,
    goBackIntentStep,
    editIntentStep,
    editFromReturning,
    submitFromReturning,

    // Field setters
    setRecipient,
    setCareType,
    setUrgency,
    setNotes,
    revealPhone,
    toggleSave,

    // Actions
    submitRequest,
  };
}
