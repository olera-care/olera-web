"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { getDeferredAction, clearDeferredAction } from "@/lib/deferred-action";
import { useSavedProviders } from "@/hooks/use-saved-providers";
import {
  mapProviderCareTypes,
  RECIPIENT_FROM_PROFILE,
  URGENCY_FROM_TIMELINE,
  CARE_TYPE_FROM_DISPLAY,
} from "./constants";
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
  urgency: null,
};

// Module-level cache for iOS provider UUID resolution
const resolvedIdCache = new Map<string, string>();

/** Build intent data from profile metadata when no prior connection intent exists */
function buildIntentFromProfile(profile: {
  metadata?: Record<string, unknown>;
  care_types?: string[];
}): IntentData | null {
  const meta = profile.metadata || {};
  const recipient = meta.relationship_to_recipient as string | undefined;
  const timeline = meta.timeline as string | undefined;
  const careTypes = profile.care_types || [];

  const careRecipient = recipient
    ? RECIPIENT_FROM_PROFILE[recipient] || "other"
    : null;

  const urgency = timeline ? URGENCY_FROM_TIMELINE[timeline] || null : null;

  let careType: IntentData["careType"] = null;
  for (const ct of careTypes) {
    const mapped = CARE_TYPE_FROM_DISPLAY[ct];
    if (mapped) {
      careType = mapped;
      break;
    }
  }

  if (careRecipient && careType && urgency) {
    return { careRecipient, careType, urgency };
  }
  return null;
}

export function useConnectionCard(props: ConnectionCardProps) {
  const {
    providerId,
    providerName,
    providerSlug,
    careTypes: providerCareTypes,
    isActive,
    onConnectionCreated,
  } = props;

  const { user, account, activeProfile, profiles, isLoading: authLoading, openAuth, refreshAccountData } =
    useAuth();
  const savedProviders = useSavedProviders();
  const phoneRevealTriggered = useRef(false);
  const connectionAuthTriggered = useRef(false);

  // ── State machine ──
  // Start at "default" so the CTA is always interactive immediately —
  // no loading skeleton. Effects may upgrade to returning/pending/responded.
  const [cardState, setCardState] = useState<CardState>(
    isActive === false ? "inactive" : "default"
  );
  const [intentStep, setIntentStep] = useState<IntentStep>(0);
  const [intentData, setIntentData] = useState<IntentData>(INITIAL_INTENT);

  // ── UI state ──
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saved = savedProviders.isSaved(providerId);
  const [error, setError] = useState("");
  const [pendingRequestDate, setPendingRequestDate] = useState<string | null>(
    null
  );
  const [previousIntent, setPreviousIntent] = useState<IntentData | null>(null);

  // ── Derived ──
  const availableCareTypes = mapProviderCareTypes();
  const notificationEmail = user?.email || "your email";

  // ── Resolve initial state — upgrade to "returning" if profile has intent data ──
  useEffect(() => {
    if (authLoading || !isActive) return;

    // Logged-in user with profile data — try optimistic "returning" render
    if (user && activeProfile) {
      const profileIntent = buildIntentFromProfile({
        metadata: activeProfile.metadata as Record<string, unknown> | undefined,
        care_types: activeProfile.care_types ?? undefined,
      });
      if (profileIntent) {
        setPreviousIntent(profileIntent);
        setIntentData(profileIntent);
        setCardState("returning");
      }
    }
  }, [authLoading, user, isActive, activeProfile]);

  // ── Check for existing connection + fetch previous intent (logged-in users) ──
  useEffect(() => {
    if (!user || !profiles.length || !isSupabaseConfigured()) return;
    if (!isActive) return; // Already set to inactive

    const checkExisting = async () => {
      const supabase = createClient();
      const profileIds = profiles.map((p) => p.id);

      // Resolve provider ID: if it's not a UUID (iOS provider), look up from cache or DB
      let resolvedId: string | null = providerId;
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(providerId);
      if (!isUUID) {
        const cached = resolvedIdCache.get(providerId);
        if (cached) {
          resolvedId = cached;
        } else {
          const { data: profile } = await supabase
            .from("business_profiles")
            .select("id")
            .eq("source_provider_id", providerId)
            .limit(1)
            .single();
          resolvedId = profile?.id || null;
          if (resolvedId) {
            resolvedIdCache.set(providerId, resolvedId);
          }
        }
      }

      // Fire connection check and previous intent fetch in parallel
      const connectionPromise = resolvedId
        ? supabase
            .from("connections")
            .select("id, status, metadata, created_at")
            .in("from_profile_id", profileIds)
            .eq("to_profile_id", resolvedId)
            .eq("type", "inquiry")
            .order("created_at", { ascending: false })
            .limit(1)
            .single()
        : Promise.resolve({ data: null });

      const previousIntentPromise = supabase
        .from("connections")
        .select("message")
        .in("from_profile_id", profileIds)
        .eq("type", "inquiry")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const [connectionResult, intentResult] = await Promise.all([
        connectionPromise,
        previousIntentPromise,
      ]);

      // Check connection to THIS provider
      if (connectionResult.data) {
        const data = connectionResult.data;
        setPendingRequestDate(data.created_at);

        if (data.status === "accepted") {
          setCardState("responded");
          return;
        }

        if (data.status === "pending") {
          setCardState("pending");
          return;
        }

        // Past/ended connection — show as returning
        // Fall through to check for previous intent data
      }

      // Restore previous intent data (from any connection)
      if (intentResult.data?.message) {
        try {
          const parsed = JSON.parse(intentResult.data.message);
          const restored: IntentData = {
            careRecipient: parsed.care_recipient || null,
            careType: parsed.care_type || null,
            urgency: parsed.urgency || null,
          };
          if (restored.careRecipient && restored.careType && restored.urgency) {
            setPreviousIntent(restored);
            setIntentData(restored);
            setCardState("returning");
            return;
          }
        } catch {
          // Invalid JSON — ignore
        }
      }

      // Fallback: try to build intent from profile metadata
      if (activeProfile) {
        const profileIntent = buildIntentFromProfile({
          metadata: activeProfile.metadata as Record<string, unknown> | undefined,
          care_types: activeProfile.care_types ?? undefined,
        });
        if (profileIntent) {
          setPreviousIntent(profileIntent);
          setIntentData(profileIntent);
          setCardState("returning");
          return;
        }
      }

      // No connection, no previous intent, no profile data → default
      setCardState("default");
    };

    checkExisting();
  }, [user, profiles, providerId, isActive, activeProfile]);

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

      // Handle duplicate connection (user already has pending/accepted)
      if (data.status === "duplicate") {
        if (data.created_at) {
          setPendingRequestDate(data.created_at);
        }
        await refreshAccountData();
        return;
      }

      // If redirect is configured, navigate immediately — skip refresh
      // to prevent checkExisting from flashing the pending state.
      if (data.connectionId && onConnectionCreated) {
        onConnectionCreated(data.connectionId);
        return;
      }

      // Refresh auth data so active profile is up-to-date
      await refreshAccountData();

      // Update date if returned
      if (data.created_at) {
        setPendingRequestDate(data.created_at);
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("Connection request error:", msg);
      setSubmitting(false);
      setError(msg || "Something went wrong. Please try again.");
    }
  }, [
    user,
    providerId,
    providerName,
    providerSlug,
    intentData,
    refreshAccountData,
    onConnectionCreated,
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
        // sessionStorage may fail in private browsing
      }

      // When redirect is configured, show spinner on the Connect button.
      // Otherwise fall back to the pending card state.
      if (onConnectionCreated) {
        setSubmitting(true);
      } else {
        setCardState("pending");
      }
      setPendingRequestDate(new Date().toISOString());
      setPhoneRevealed(true);
      submitRequest(restoredIntent || undefined);
    }
  }, [user, account, providerId, submitRequest, onConnectionCreated]);

  // ── Navigation helpers ──
  const startFlow = useCallback(() => {
    if (user && previousIntent) {
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

  // ── Auto-advancing field setters (for intent steps 1–2) ──
  const selectRecipient = useCallback((val: CareRecipient) => {
    setIntentData((prev) => ({ ...prev, careRecipient: val }));
    // Auto-advance to step 2 after a short delay for visual feedback
    setTimeout(() => setIntentStep(1), 150);
  }, []);

  const selectCareType = useCallback((val: CareTypeValue) => {
    setIntentData((prev) => ({ ...prev, careType: val }));
    // Auto-advance to step 3
    setTimeout(() => setIntentStep(2), 150);
  }, []);

  const selectUrgency = useCallback((val: UrgencyValue) => {
    setIntentData((prev) => ({ ...prev, urgency: val }));
  }, []);

  // ── Connect (submit from intent or returning) ──
  const connect = useCallback(() => {
    if (user) {
      // When redirect is configured, keep the current card content and only
      // show a spinner on the Connect button (submitting). This avoids a
      // jarring content swap before the page navigates away.
      if (onConnectionCreated) {
        setSubmitting(true);
      } else {
        setCardState("pending");
      }
      setPendingRequestDate(new Date().toISOString());
      setPhoneRevealed(true);
      submitRequest();
    } else {
      // Save intent for OAuth resilience, then trigger auth
      try {
        sessionStorage.setItem(
          CONNECTION_INTENT_KEY,
          JSON.stringify(intentData)
        );
      } catch {
        // sessionStorage may fail in private browsing
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
  }, [user, intentData, submitRequest, openAuth, providerId, providerSlug, onConnectionCreated]);

  const signIn = useCallback(() => {
    openAuth({ defaultMode: "sign-in" });
    // No deferred action — after auth, Effect 2 naturally detects
    // existing connections and sets the correct state.
  }, [openAuth]);

  const editFromReturning = useCallback(() => {
    setIntentStep(0);
    setCardState("intent");
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
    submitting,
    saved,
    error,
    pendingRequestDate,
    availableCareTypes,
    notificationEmail,
    isAuthenticated: !!user,

    // Navigation
    startFlow,
    resetFlow,
    editFromReturning,
    connect,
    signIn,

    // Auto-advancing field setters
    selectRecipient,
    selectCareType,
    selectUrgency,
    revealPhone,
    toggleSave,
  };
}
