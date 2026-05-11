"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateSessionId } from "@/lib/analytics/session";
import { useAuth } from "@/components/auth/AuthProvider";
import { getQuestionsForCategory, splitQuestions } from "@/lib/cta-questions";

interface InboxPreviewCardProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerCategory?: string | null;
  providerCity?: string | null;
  providerState?: string | null;
  providerPhone?: string | null;
  providerImage?: string | null;
  acceptedPayments: string[];
  ctaVariant?: string | null;
  ctaSurface?: "desktop" | "mobile";
  ctaPreviewMode?: boolean;
  onQuestionSelected?: (questionText: string) => void;
}

type Step = "initial" | "questions" | "inbox";

export default function InboxPreviewCard({
  providerId,
  providerName,
  providerSlug,
  providerCategory,
  providerCity,
  providerState,
  providerPhone,
  providerImage,
  acceptedPayments,
  ctaVariant,
  ctaSurface = "desktop",
  ctaPreviewMode = false,
  onQuestionSelected,
}: InboxPreviewCardProps) {
  const router = useRouter();
  const { user, activeProfile, openAuth } = useAuth();

  // Step state
  const [step, setStep] = useState<Step>("initial");
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");

  // Form state (for inbox step)
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [blockedEmail, setBlockedEmail] = useState<string | null>(null);

  // Get category-specific questions
  const questions = getQuestionsForCategory(providerCategory);
  const { initial: initialQuestions, expanded: expandedQuestions } = splitQuestions(questions);

  // Derived values
  const providerFirstName = providerName.split(" ")[0];
  const providerInitial = providerFirstName.charAt(0).toUpperCase();
  const locationStr = [providerCity, providerState].filter(Boolean).join(", ");
  const categoryLocationStr = [providerCategory, locationStr].filter(Boolean).join(" · ");

  // Check if user is a non-family profile
  const isNonFamilyProfile = activeProfile &&
    (activeProfile.type === "organization" || activeProfile.type === "caregiver" || activeProfile.type === "student");

  // Fire analytics event when "Start a message" is clicked
  const handleStartMessage = useCallback(() => {
    // Fire cta_variant_clicked event (matches mobile's sheet_opened)
    if (ctaVariant && !ctaPreviewMode) {
      fetch("/api/activity/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actor_type: "anonymous",
          related_provider_id: providerSlug,
          event_type: "cta_variant_clicked",
          session_id: getOrCreateSessionId(),
          metadata: {
            variant: ctaVariant,
            surface: "desktop",
            action: "cta_started",
          },
        }),
      }).catch(() => {});
    }
    setStep("questions");
  }, [ctaVariant, ctaPreviewMode, providerSlug]);

  // Reset from provider email block
  const resetFromProviderEmailBlock = useCallback(() => {
    setBlockedEmail(null);
    setEmail("");
    setError("");
  }, []);

  // Handle question selection
  const handleQuestionClick = useCallback(
    (questionText: string) => {
      onQuestionSelected?.(questionText);
      setSelectedQuestion(questionText);
      setStep("inbox");
    },
    [onQuestionSelected]
  );

  const handleCustomSubmit = useCallback(() => {
    const trimmed = customQuestion.trim();
    if (trimmed) {
      onQuestionSelected?.(trimmed);
      setSelectedQuestion(trimmed);
      setStep("inbox");
    }
  }, [customQuestion, onQuestionSelected]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (step === "inbox") {
      setStep("questions");
      setSelectedQuestion(null);
      setError("");
      setBlockedEmail(null);
    } else if (step === "questions") {
      setStep("initial");
      setExpanded(false);
      setCustomQuestion("");
    }
  }, [step]);

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
            additionalNotes: selectedQuestion,
          },
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
          console.error("[inbox-preview-card] Session error:", err);
        });
      }

      // Navigate to welcome page
      router.push(
        `/welcome?connection=${data.connectionId}&provider=${providerSlug}`
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      console.error("[inbox-preview-card] Submit error:", msg);
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

  // ════════════════════════════════════════════════════════════════════════════
  // Step 1: Initial - "Start a message" button
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "initial") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Direct Line Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Direct Line — No Agents
            </span>
          </div>

          {/* Headline */}
          <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1 truncate">
            Message {providerName}
          </h3>

          {/* Category + Location */}
          {categoryLocationStr && (
            <p className="text-sm text-gray-500 mb-5 truncate">{categoryLocationStr}</p>
          )}

          {/* Start a message button */}
          <button
            onClick={handleStartMessage}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-[15px] font-semibold transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Start a message
          </button>
        </div>

        {/* Accepted payments */}
        {acceptedPayments.length > 0 && (
          <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-400 mb-2">
              Accepted payments
            </p>
            <div className="flex flex-wrap gap-1.5">
              {acceptedPayments.map((payment) => (
                <span
                  key={payment}
                  className="text-xs text-gray-600 bg-white px-2.5 py-1 rounded border border-gray-200"
                >
                  {payment}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Step 2: Question Selection
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "questions") {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="px-5 pt-5 pb-5">
          {/* Direct Line Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Direct Line — No Agents
            </span>
          </div>

          {/* Headline */}
          <h3 className="text-xl font-bold text-gray-900 leading-snug mb-1 truncate">
            Message {providerName}
          </h3>

          {/* Category + Location */}
          {categoryLocationStr && (
            <p className="text-sm text-gray-500 mb-4 truncate">{categoryLocationStr}</p>
          )}

          {/* Tap to send instruction */}
          <p className="text-sm text-gray-500 mb-3">Tap to send</p>

          {/* Questions */}
          <div className="space-y-2">
            {initialQuestions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuestionClick(q.text)}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-left transition-colors group"
              >
                <span className="text-[15px] text-gray-800">
                  {q.text}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}

            {/* Expanded questions */}
            {expanded && (
              <>
                {expandedQuestions.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleQuestionClick(q.text)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl text-left transition-colors group animate-step-in"
                  >
                    <span className="text-[15px] text-gray-800">
                      {q.text}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ))}

                {/* Custom question input */}
                <div className="pt-2 animate-step-in">
                  <div className="relative">
                    <input
                      type="text"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCustomSubmit();
                        }
                      }}
                      placeholder="Or type your own question..."
                      className="w-full px-4 py-3.5 pr-12 bg-white border border-gray-200 rounded-xl text-[15px] text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:border-primary-600 transition-all"
                    />
                    {customQuestion.trim() && (
                      <button
                        onClick={handleCustomSubmit}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 hover:text-primary-700 transition-colors"
                        aria-label="Send question"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* More questions toggle */}
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full text-center py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                More questions{" "}
                <span className="inline-block ml-0.5">↓</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Step 3: Inbox Preview with Email Capture
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Back button */}
      <button
        onClick={handleBack}
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

      {/* Provider header */}
      <div className="px-5 pt-3 pb-4 flex items-center gap-3">
        {providerImage ? (
          <Image
            src={providerImage}
            alt={providerName}
            width={44}
            height={44}
            className="w-11 h-11 rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary-700 font-semibold text-sm">
              {providerInitial}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 truncate">
            {providerName}
          </p>
          {categoryLocationStr && (
            <p className="text-xs text-gray-500 truncate">{categoryLocationStr}</p>
          )}
        </div>
      </div>

      {/* Message preview */}
      <div className="px-5 pb-4">
        <div className="flex justify-end mb-2">
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

      {/* Email capture section */}
      <div className="px-5 pb-5">
        {/* Non-family profile block */}
        {isNonFamilyProfile ? (
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Family account required
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Care inquiries can only be sent from a family account.
            </p>
            <button
              onClick={() => openAuth({ defaultMode: "sign-up", intent: "family" })}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Create Family Account
            </button>
          </div>
        ) : blockedEmail ? (
          /* Provider email block */
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              Provider email detected
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              <span className="font-medium text-gray-800">{blockedEmail}</span> is linked to a provider account.
            </p>
            <div className="space-y-2">
              <button
                onClick={resetFromProviderEmailBlock}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Use Different Email
              </button>
              <button
                onClick={() => openAuth({ defaultMode: "sign-in" })}
                className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold border border-gray-300 transition-colors"
              >
                Sign In Instead
              </button>
            </div>
          </div>
        ) : (
          /* Email capture form */
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-[15px] font-semibold text-gray-900 mb-1">
              Send your message
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              A real person at {providerName} will reply — straight to your inbox.
            </p>

            <div className="space-y-3">
              {user ? (
                /* Logged-in: one-click send */
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
                    className="w-full py-3 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
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

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !email.trim()}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white rounded-xl text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
        )}
      </div>
    </div>
  );
}
