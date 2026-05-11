"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";

// ════════════════════════════════════════════════════════════════════════════
// Inbox Preview Page
// Shows the inbox layout with message "ready to send" before email capture.
// Matches the exact styling of /portal/inbox for seamless transition.
// ════════════════════════════════════════════════════════════════════════════

/** Deterministic gradient for fallback avatars - matches ConversationList */
function avatarGradient(name: string): string {
  const gradients = [
    "linear-gradient(135deg, #0ea5e9, #6366f1)",
    "linear-gradient(135deg, #14b8a6, #0ea5e9)",
    "linear-gradient(135deg, #8b5cf6, #ec4899)",
    "linear-gradient(135deg, #f59e0b, #ef4444)",
    "linear-gradient(135deg, #10b981, #14b8a6)",
    "linear-gradient(135deg, #6366f1, #a855f7)",
    "linear-gradient(135deg, #ec4899, #f43f5e)",
    "linear-gradient(135deg, #0891b2, #2dd4bf)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function InboxPreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, activeProfile, openAuth } = useAuth();

  // Extract params from URL
  const providerId = searchParams.get("provider_id") || "";
  const providerSlug = searchParams.get("provider") || "";
  const providerName = searchParams.get("provider_name") || "Provider";
  const providerCategory = searchParams.get("category") || null;
  const providerCity = searchParams.get("city") || null;
  const providerState = searchParams.get("state") || null;
  const providerPhone = searchParams.get("phone") || null;
  const providerImage = searchParams.get("image") || null;
  const question = searchParams.get("question") || "Hello, I have a question.";
  const ctaVariant = searchParams.get("cta_variant") || "inbox_preview";

  // State
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(true);

  // Check if user is a non-family profile (provider/caregiver/student)
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");

  // Reset from provider email block
  const resetFromProviderEmailBlock = useCallback(() => {
    setBlockedEmail(null);
    setEmail("");
    setError("");
  }, []);

  // Derived values
  const providerInitial = providerName.charAt(0).toUpperCase();
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");

  // Handle form submission
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
            additionalNotes: question,
          },
          ...(isGuest && {
            guest: true,
            guestEmail: submissionEmail,
          }),
          formData: {
            fullName: "",
            phone: "",
            message: question,
          },
          session_id: getOrCreateSessionId(),
          cta_variant: ctaVariant,
        }),
      });

      const data = await res.json();

      // Handle provider email block
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

      // Navigate directly to portal inbox (skip welcome page for seamless experience)
      router.push(`/portal/inbox?id=${data.connectionId}`);
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
    question,
    ctaVariant,
    router,
  ]);

  // Format time for display
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="h-[calc(100dvh-64px)] bg-white">
      <div className="h-full flex">
        {/* ════════════════════════════════════════════════════════════════════
            Left Panel — Conversation List (matches ConversationList.tsx)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex flex-col w-[360px] shrink-0 border-r border-gray-200">
          {/* Header - matches ConversationList */}
          <div className="h-[68px] px-6 flex items-center border-b border-gray-200">
            <h1 className="text-xl font-display font-semibold text-gray-900">Messages</h1>
          </div>

          {/* Conversation item - selected state */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-primary-50 rounded-xl cursor-default">
                {/* Avatar */}
                {providerImage ? (
                  <Image
                    src={providerImage}
                    alt={providerName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                    style={{ background: avatarGradient(providerName) }}
                  >
                    {providerInitial}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold text-gray-900 truncate">
                      {providerName}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">Now</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {question.length > 40 ? question.slice(0, 40) + "..." : question}
                  </p>
                </div>

                {/* Unread indicator */}
                <div className="w-2.5 h-2.5 bg-primary-600 rounded-full shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            Middle Panel — Conversation (matches ConversationPanel.tsx)
            ════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - exact match to ConversationPanel */}
          <div className={`shrink-0 pl-4 sm:pl-6 ${detailOpen ? "pr-4 sm:pr-6" : "pr-4 sm:pr-[44px]"} h-[68px] border-b border-gray-200 flex items-center gap-3`}>
            {/* Back button (mobile) */}
            <Link
              href={`/provider/${providerSlug}`}
              className="lg:hidden -ml-2 mr-1 w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Back to provider"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            {/* Avatar */}
            <div className="shrink-0">
              {providerImage ? (
                <Image
                  src={providerImage}
                  alt={providerName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: avatarGradient(providerName) }}
                >
                  {providerInitial}
                </div>
              )}
            </div>

            {/* Name + location */}
            <div className="flex-1 min-w-0">
              <span className="text-lg font-display font-semibold text-gray-900 truncate block">
                {providerName}
              </span>
              {locationStr && (
                <p className="text-sm text-gray-500 truncate">{locationStr}</p>
              )}
            </div>

            {/* Show Details toggle - hidden on mobile, hidden when panel open */}
            {!detailOpen && (
              <button
                onClick={() => setDetailOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Show Details
              </button>
            )}
          </div>

          {/* Conversation thread - exact match to ConversationPanel */}
          <div className={`flex-1 min-h-0 overflow-y-auto px-4 sm:pl-6 ${detailOpen ? "sm:pr-6" : "sm:pr-[44px]"} py-6 bg-white`}>
            <div className="space-y-4">
              {/* Date separator */}
              <div className="flex justify-center py-3">
                <span className="text-sm font-medium text-gray-400">
                  {now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              {/* User's outgoing message - exact match to ConversationPanel outgoing style */}
              <div className="flex justify-end">
                <div className="max-w-[70%]">
                  <div className="bg-primary-600 rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                    <p className="text-base leading-relaxed text-white">{question}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 text-right mr-1">{timeStr}</p>
                </div>
              </div>

              {/* Ready to send indicator */}
              <div className="flex justify-center py-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 bg-amber-50 px-4 py-2 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Ready to send
                </span>
              </div>
            </div>
          </div>

          {/* Email capture footer - replaces message input */}
          <div className="shrink-0 border-t border-gray-200 bg-white">
            <div className={`px-4 sm:pl-6 ${detailOpen ? "sm:pr-6" : "sm:pr-[44px]"} py-4`} style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}>
              {/* Non-family profile block */}
              {isNonFamilyProfile ? (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600 mb-3">
                    Care inquiries can only be sent from a family account.
                  </p>
                  <button
                    onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Create Family Account
                  </button>
                </div>
              ) : blockedEmail ? (
                /* Provider email block */
                <div className="text-center py-2">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-gray-800">{blockedEmail}</span> is linked to a provider account.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={resetFromProviderEmailBlock}
                      className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Use Different Email
                    </button>
                    <button
                      onClick={() => openAuth({ defaultMode: "sign-in" })}
                      className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold border border-gray-300 transition-colors"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              ) : user ? (
                /* Logged-in user — one-click send */
                <div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600">
                        Send as <span className="font-medium text-gray-900">{user.email}</span>
                      </p>
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                      {submitting && (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {submitting ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                  {error && (
                    <p className="text-xs text-red-600 mt-2" role="alert">{error}</p>
                  )}
                </div>
              ) : (
                /* Guest — email capture styled like ConversationPanel input */
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Enter your email to send this message
                  </p>
                  <div className="border border-gray-300 rounded-2xl focus-within:border-gray-400 focus-within:shadow-sm transition-all overflow-hidden">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !submitting && email.trim()) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Your email address"
                      autoComplete="email"
                      autoFocus
                      className={`w-full px-4 pt-3.5 pb-3 text-base text-gray-900 placeholder:text-gray-400 outline-none resize-none disabled:opacity-50 leading-relaxed bg-transparent ${
                        error ? "border-red-300" : ""
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
                    <div className="flex items-center justify-between px-3 pb-3">
                      <p className="text-xs text-gray-400 pl-1">
                        Your inbox saves here
                      </p>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !email.trim()}
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                          email.trim()
                            ? "bg-primary-600 text-white hover:bg-primary-700"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {submitting ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p className="text-xs text-red-600 mt-2 pl-1" role="alert">{error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            Right Panel — Provider Details (matches ProviderDetailPanel.tsx)
            ════════════════════════════════════════════════════════════════════ */}
        <div
          className={`hidden lg:flex shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out ${
            detailOpen ? "w-[360px]" : "w-0"
          }`}
        >
          <div className="flex flex-col w-[360px] h-full border-l border-gray-200 bg-gray-50/50">
            {/* Header */}
            <div className="h-[68px] px-6 flex items-center justify-between border-b border-gray-200 bg-white">
              <h2 className="text-[15px] font-semibold text-gray-900">Details</h2>
              <button
                onClick={() => setDetailOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close details"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Provider card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                  <div className="flex items-start gap-4">
                    {providerImage ? (
                      <Image
                        src={providerImage}
                        alt={providerName}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xl"
                        style={{ background: avatarGradient(providerName) }}
                      >
                        {providerInitial}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-display font-semibold text-gray-900 mb-0.5">
                        {providerName}
                      </h3>
                      {providerCategory && (
                        <p className="text-sm text-gray-500 mb-1">{providerCategory}</p>
                      )}
                      {locationStr && (
                        <p className="text-sm text-gray-500">{locationStr}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                {providerPhone && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contact</p>
                    <a
                      href={`tel:${providerPhone}`}
                      className="flex items-center gap-2 text-[15px] text-primary-600 hover:text-primary-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {providerPhone}
                    </a>
                  </div>
                )}

                {/* View full profile link */}
                <Link
                  href={`/provider/${providerSlug}`}
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm font-medium text-primary-600 hover:text-primary-700 bg-white rounded-xl border border-gray-200 transition-colors"
                >
                  View full profile
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InboxPreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InboxPreviewContent />
    </Suspense>
  );
}
