"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import type { LeadCaptureState, LeadCaptureFormData, LeadCaptureEntryPoint } from "./types";

interface UseLeadCaptureOptions {
  providerId: string;
  providerName: string;
  providerSlug: string;
  entryPoint: LeadCaptureEntryPoint;
  providerCity?: string | null;
  providerState?: string | null;
  providerCategory?: string | null;
  onSuccess?: (connectionId: string) => void;
  onClose: () => void;
}

export function useLeadCapture({
  providerId,
  providerName,
  providerSlug,
  entryPoint,
  providerCity,
  providerState,
  providerCategory,
  onSuccess,
  onClose,
}: UseLeadCaptureOptions) {
  const router = useRouter();
  const { user, account, activeProfile, refreshAccountData, openAuth } = useAuth();

  // ── State ──
  const [state, setState] = useState<LeadCaptureState>("form");
  const [error, setError] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const sessionEstablishing = useRef(false);

  // ── Reset state (called when modal opens) ──
  const resetState = useCallback(() => {
    setState("form");
    setError(null);
    setBlockedEmail(null);
  }, []);

  // ── Non-family profile guard ──
  // Provider, caregiver, and student accounts cannot send care inquiries
  const isNonFamilyProfile =
    activeProfile &&
    (activeProfile.type === "organization" ||
      activeProfile.type === "caregiver" ||
      activeProfile.type === "student");

  const accountTypeLabel =
    activeProfile?.type === "organization"
      ? "provider"
      : activeProfile?.type === "caregiver" || activeProfile?.type === "student"
        ? "caregiver"
        : "current";

  // ── Pre-fill data for logged-in users ──
  const userEmail = user?.email || "";
  const userName = account?.display_name || "";
  const userPhone = activeProfile?.phone || "";

  // ── Submit form ──
  const submitForm = useCallback(
    async (formData: LeadCaptureFormData) => {
      setError(null);
      setState("submitting");

      // Bot trap check
      const honeypotField = document.querySelector<HTMLInputElement>(
        'input[name="website"]'
      );
      if (honeypotField?.value) {
        // Silently "succeed" for bots
        setState("success");
        return;
      }

      try {
        const intentData = {
          careRecipient: null,
          careType: null,
          urgency: null,
          additionalNotes: formData.message || null,
        };

        const requestBody: Record<string, unknown> = {
          providerId,
          providerName,
          providerSlug,
          intentData,
          formData: {
            fullName: formData.name,
            phone: formData.phone || "",
            message: formData.message || "",
          },
          session_id: getOrCreateSessionId(),
          entry_point: entryPoint,
        };

        if (user) {
          // Authenticated flow
          const res = await fetch("/api/connections/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to send request.");

          window.dispatchEvent(new CustomEvent("olera:connection-created"));
          setConnectionId(data.connectionId);

          // Sync phone to profile if provided
          if (formData.phone && formData.phone.trim()) {
            fetch("/api/connections/update-intent", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                connectionId: data.connectionId,
                phone: formData.phone,
              }),
            }).catch(() => {});
          }

          // Refresh account data in background
          refreshAccountData().catch(() => {});

          // Handle success
          if (onSuccess) {
            onSuccess(data.connectionId);
          } else {
            // Navigate to inbox
            router.push(`/portal/inbox?id=${data.connectionId}`);
          }
          setState("success");
          onClose();
        } else {
          // Guest flow
          requestBody.guest = true;
          requestBody.guestEmail = formData.email.trim().toLowerCase();

          const res = await fetch("/api/connections/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
          });

          const data = await res.json();

          // Check for provider email block
          if (!res.ok && data.code === "PROVIDER_EMAIL") {
            setBlockedEmail(formData.email);
            setState("provider_block");
            return;
          }

          if (!res.ok) throw new Error(data.error || "Failed to send request.");

          window.dispatchEvent(new CustomEvent("olera:connection-created"));
          setConnectionId(data.connectionId);

          // Store pending connection for welcome page
          try {
            localStorage.setItem(
              "olera_pending_connection",
              JSON.stringify({
                connectionId: data.connectionId,
                providerId,
                providerSlug,
                providerName,
              })
            );
          } catch {
            // localStorage not available
          }

          // Establish session in background
          if (data.accessToken && data.refreshToken && !sessionEstablishing.current) {
            sessionEstablishing.current = true;
            const supabase = createClient();
            supabase.auth
              .setSession({
                access_token: data.accessToken,
                refresh_token: data.refreshToken,
              })
              .then(({ data: sessionData, error: sessionError }: { data: { session: { user?: { id?: string } | null } | null }; error: unknown }) => {
                if (sessionError) {
                  console.error("[lead-capture] Session error:", sessionError);
                } else {
                  const userId = sessionData?.session?.user?.id;
                  if (userId && refreshAccountData) {
                    refreshAccountData(userId).catch(() => {});
                  }
                }
              })
              .catch((err: unknown) => {
                console.error("[lead-capture] Session error:", err);
              })
              .finally(() => {
                sessionEstablishing.current = false;
              });
          }

          // Navigate to inbox (same as logged-in users)
          router.push(`/portal/inbox?id=${data.connectionId}`);
          setState("success");
          onClose();
        }
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? (err as { message: string }).message
            : String(err);
        console.error("Lead capture error:", msg);
        setError(msg || "Something went wrong. Please try again.");
        setState("error");
      }
    },
    [
      user,
      providerId,
      providerName,
      providerSlug,
      entryPoint,
      router,
      refreshAccountData,
      onSuccess,
      onClose,
    ]
  );

  // ── Reset from provider email block ──
  const resetFromProviderBlock = useCallback(() => {
    setBlockedEmail(null);
    setState("form");
    setError(null);
  }, []);

  // ── Open auth for family account ──
  const openFamilyAuth = useCallback(() => {
    onClose();
    openAuth({ defaultMode: "sign-up", intent: "family" });
  }, [onClose, openAuth]);

  return {
    // State
    state,
    error,
    connectionId,
    blockedEmail,

    // Non-family profile guard
    isNonFamilyProfile,
    accountTypeLabel,

    // Pre-fill data
    userEmail,
    userName,
    userPhone,
    isLoggedIn: !!user,

    // Actions
    submitForm,
    resetFromProviderBlock,
    openFamilyAuth,
    resetState,
  };
}
