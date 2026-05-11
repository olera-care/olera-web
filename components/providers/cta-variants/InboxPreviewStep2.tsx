"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";

interface InboxPreviewStep2Props {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  selectedQuestion: string;
  onBack?: () => void;
  ctaVariant?: string | null;
  ctaSurface?: "desktop" | "mobile";
  ctaPreviewMode?: boolean;
}

export default function InboxPreviewStep2({
  providerId,
  providerName,
  providerSlug,
  providerCategory,
  providerCity,
  providerState,
  selectedQuestion,
  onBack,
  ctaVariant,
  ctaSurface = "desktop",
  ctaPreviewMode = false,
}: InboxPreviewStep2Props) {
  const router = useRouter();
  const { user, activeProfile, openAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);

  // Check if user is a non-family profile (provider/caregiver/student)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");

  // Reset from provider email block
  const resetFromProviderEmailBlock = useCallback(() => {
    setBlockedEmail(null);
    setEmail("");
    setError("");
  }, []);

  // Extract first name and format location
  const providerFirstName = providerName.split(" ")[0];
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");

  const handleSubmit = useCallback(async () => {
    setError("");

    // Honeypot check
    if (honeypot) return;

    // Determine if this is a guest submission or logged-in user
    const isGuest = !user;
    const submissionEmail = isGuest ? email.trim().toLowerCase() : user.email;

    // Only validate email for guests
    if (isGuest) {
      if (!submissionEmail) {
        setError("Please enter your email address.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submissionEmail)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setSubmitting(true);

    try {
      // Submit to the same API as legacy CTA
      const res = await fetch("/api/connections/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          providerName,
          providerSlug,
          intentData: {
            careRecipient: null,
            careType: null,
            urgency: null,
            additionalNotes: selectedQuestion, // Store the question as notes
          },
          // Only set guest flags for non-authenticated users
          ...(isGuest && {
            guest: true,
            guestEmail: submissionEmail,
          }),
          formData: {
            fullName: "",
            phone: "",
            message: selectedQuestion,
          },
          session_id: getOrCreateSessionId(),
          cta_variant: ctaVariant || "inbox_preview",
        }),
      });

      const data = await res.json();

      // Handle provider email block - show dedicated UI
      if (!res.ok && data.code === "PROVIDER_EMAIL") {
        setBlockedEmail(submissionEmail || null);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to send request.");
      }

      // Dispatch event for inbox refresh
      window.dispatchEvent(new CustomEvent("olera:connection-created"));

      // Store pending connection info (for guests)
      if (isGuest) {
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
      }

      // Establish session in background (non-blocking) for guests
      if (data.accessToken && data.refreshToken) {
        const supabase = createClient();
        supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        }).catch((err) => {
          console.error("[inbox-preview] Session error:", err);
        });
      }

      // Navigate to welcome page (same as legacy)
      router.push(
        `/welcome?connection=${data.connectionId}&provider=${providerSlug}`
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("[inbox-preview] Submit error:", msg);
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    email,
    honeypot,
    user,
    providerId,
    providerName,
    providerSlug,
    selectedQuestion,
    ctaVariant,
    router,
  ]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-5 pt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
      )}

      {/* Provider header */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-3">
        {/* Avatar placeholder - using first letter */}
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-primary-700 font-semibold text-sm">
            {providerFirstName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 truncate">
            {providerName}
          </p>
          {(providerCategory || locationStr) && (
            <p className="text-xs text-gray-500 truncate">
              {[providerCategory, locationStr].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {/* Message preview area */}
      <div className="px-5 pb-4">
        {/* User's message bubble */}
        <div className="flex justify-end mb-3">
          <div className="max-w-[85%] bg-primary-600 text-white px-4 py-3 rounded-2xl rounded-br-md">
            <p className="text-[15px] leading-relaxed">{selectedQuestion}</p>
          </div>
        </div>

        {/* Ready to send status */}
        <div className="flex items-center justify-end gap-2 text-amber-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium">Ready to send</span>
        </div>
      </div>

      {/* Non-family profile block */}
      {isNonFamilyProfile ? (
        <div className="px-5 pb-5">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h4 className="text-[15px] font-semibold text-gray-900 mb-1">
              Family account required
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Care inquiries can only be sent from a family account.
            </p>
            <button
              onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create Family Account
            </button>
          </div>
        </div>
      ) : blockedEmail ? (
        /* Provider email block */
        <div className="px-5 pb-5">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h4 className="text-[15px] font-semibold text-gray-900 mb-1">
              Provider email detected
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              The email <span className="font-medium text-gray-800">{blockedEmail}</span> is linked to a provider account. To send care inquiries, please use a different email.
            </p>
            <div className="space-y-2">
              <button
                onClick={resetFromProviderEmailBlock}
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Use Different Email
              </button>
              <button
                onClick={() => openAuth({ defaultMode: "sign-in" })}
                className="w-full py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold border border-gray-300 transition-colors"
              >
                Sign In Instead
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Family accounts require a separate email from provider accounts.
            </p>
          </div>
        </div>
      ) : (
        /* Email capture card */
        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-[15px] font-semibold text-gray-900 mb-1">
              Send your message to {providerFirstName}
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              A real person at {providerName} will reply — straight to your inbox.
            </p>

            <div className="space-y-3">
              {user ? (
                /* Logged-in: show email and one-click send */
                <>
                  <p className="text-sm text-gray-500 text-center">
                    Signed in as <span className="font-medium text-gray-700">{user.email}</span>
                  </p>
                  {error && (
                    <p className="text-xs text-red-600 text-center" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {submitting && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {submitting ? "Sending..." : "Send →"}
                  </button>
                </>
              ) : (
                /* Guest: email input */
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !submitting) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder="Your email address"
                    autoComplete="email"
                    className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all ${
                      error ? "border-red-300" : "border-gray-200"
                    }`}
                  />

                  {/* Honeypot */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ display: "none" }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  {error && (
                    <p className="text-xs text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  {/* Submit button */}
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !email.trim()}
                    className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {submitting ? "Sending..." : "Send →"}
                  </button>
                </>
              )}

              {/* Reassurance text */}
              <p className="text-xs text-gray-500 text-center">
                Your inbox saves here, so you can come back when they reply.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
