"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Provider } from "@/lib/types/provider";
import Link from "next/link";

// ============================================================
// Types
// ============================================================

export type ActionCardState =
  | "verify-form"
  | "verify-code"
  | "pre-verified"
  | "no-access"
  | "no-access-success"
  | "already-claimed"
  | "dispute-submitted";

interface ActionCardProps {
  provider: Provider;
  claimSession: string;
  initialState?: ActionCardState;
  onVerificationComplete: () => void;
  /** Pre-verified email hint from token validation */
  preVerifiedEmail?: string;
  /** Whether to highlight the card (attention state) */
  highlighted?: boolean;
}

// ============================================================
// Constants
// ============================================================

const ROLE_OPTIONS = [
  { value: "Owner", label: "Owner" },
  { value: "Administrator", label: "Administrator" },
  { value: "Executive Director", label: "Executive Director" },
  { value: "Office Manager", label: "Office Manager" },
  { value: "Marketing / Communications", label: "Marketing / Communications" },
  { value: "Staff Member", label: "Staff Member" },
  { value: "Other", label: "Other" },
];

// Shared input classes matching dashboard design system
const inputClasses =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-[15px] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent focus:bg-white transition-all min-h-[48px]";
const selectClasses =
  "w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-gray-50/50 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent focus:bg-white appearance-none transition-all min-h-[48px] cursor-pointer";
const labelClasses = "block text-[13px] font-semibold text-gray-700 mb-1.5";

// ============================================================
// Helper Functions
// ============================================================

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***@***.com";
  const maskedLocal =
    local.length <= 2
      ? "*".repeat(local.length)
      : local[0] + "***" + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

// ============================================================
// Main Component
// ============================================================

export default function ActionCard({
  provider,
  claimSession,
  initialState = "verify-form",
  onVerificationComplete,
  preVerifiedEmail,
  highlighted = false,
}: ActionCardProps) {
  // Current state
  const [state, setState] = useState<ActionCardState>(initialState);

  // Verify form state
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Code verification state
  const [code, setCode] = useState("");
  const [emailHint, setEmailHint] = useState(preVerifiedEmail || "");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // No-access form state
  const [noAccessName, setNoAccessName] = useState("");
  const [noAccessRole, setNoAccessRole] = useState("");
  const [noAccessEmail, setNoAccessEmail] = useState("");
  const [noAccessNotes, setNoAccessNotes] = useState("");
  const [noAccessSubmitting, setNoAccessSubmitting] = useState(false);

  // Dispute form state
  const [disputeName, setDisputeName] = useState("");
  const [disputeRole, setDisputeRole] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  // Refs for auto-submit
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoSubmitRef = useRef(false);

  // Sync initial state
  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((c) => Math.max(0, c - 1)),
      1000
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ────────────────────────────────────────────────────────────
  // Verify Form Handlers
  // ────────────────────────────────────────────────────────────

  const handleSubmitVerifyForm = async () => {
    if (!email.trim() || !phone.trim()) {
      setError("Please enter both email and phone number.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/claim/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.provider_id,
          claimSession,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (res.status === 422) {
          // No email on file
          setNoAccessEmail(email);
          setState("no-access");
        } else {
          setError(result.error || "Failed to send verification code.");
        }
        return;
      }

      setEmailHint(result.emailHint);
      setResendCooldown(60);
      setState("verify-code");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  // Code Verification Handlers
  // ────────────────────────────────────────────────────────────

  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) return;

    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/claim/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.provider_id,
          code,
          claimSession,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.verified) {
        setError(result.error || "Incorrect code. Please try again.");
        setCode("");
        codeInputRefs.current[0]?.focus();
        return;
      }

      // Code verified!
      onVerificationComplete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  }, [code, provider.provider_id, claimSession, onVerificationComplete]);

  // Auto-submit code when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !verifying && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      handleVerifyCode();
    }
    if (code.length < 6) {
      autoSubmitRef.current = false;
    }
  }, [code, verifying, handleVerifyCode]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setCode("");

    try {
      const res = await fetch("/api/claim/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.provider_id,
          claimSession,
        }),
      });

      if (res.ok) {
        setResendCooldown(60);
      } else {
        const result = await res.json();
        setError(result.error || "Failed to resend code.");
      }
    } catch {
      setError("Failed to resend code.");
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = code.split("");
    newCode[index] = value.slice(-1);
    const joined = newCode.join("").slice(0, 6);
    setCode(joined);

    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    setCode(pasted);
    if (pasted.length === 6) {
      codeInputRefs.current[5]?.focus();
    } else {
      codeInputRefs.current[pasted.length]?.focus();
    }
  };

  // ────────────────────────────────────────────────────────────
  // No-Access Form Handlers
  // ────────────────────────────────────────────────────────────

  const handleNoAccessSubmit = async () => {
    if (!noAccessName.trim() || !noAccessRole || !noAccessEmail.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setNoAccessSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/claim/no-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.provider_id,
          providerName: provider.provider_name,
          contactName: noAccessName,
          reason: noAccessNotes
            ? `${noAccessRole} — ${noAccessNotes}`
            : noAccessRole,
          alternativeEmail: noAccessEmail,
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        setError(result.error || "Failed to submit request.");
        return;
      }

      setState("no-access-success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setNoAccessSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  // Dispute Form Handlers
  // ────────────────────────────────────────────────────────────

  const handleDisputeSubmit = async () => {
    if (!disputeName.trim() || !disputeRole || !disputeReason.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setDisputeSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: provider.provider_id,
          provider_name: provider.provider_name,
          claimant_name: disputeName.trim(),
          claimant_role: disputeRole,
          reason: disputeReason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to submit dispute.");
        return;
      }

      setState("dispute-submitted");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  // Card Styling
  // ────────────────────────────────────────────────────────────

  const baseCardClass =
    "bg-white rounded-2xl border-2 shadow-sm p-6 md:p-8 transition-all duration-300";
  // Default: blue border to draw attention. Highlighted: orange/coral ring for urgent attention
  const cardClass = highlighted
    ? `${baseCardClass} border-orange-400 ring-4 ring-orange-200 shadow-lg shadow-orange-100/50 animate-pulse-subtle`
    : `${baseCardClass} border-primary-300 shadow-md shadow-primary-50`;

  // ════════════════════════════════════════════════════════════
  // RENDER: Pre-verified State (from email campaign token)
  // ════════════════════════════════════════════════════════════

  if (state === "pre-verified") {
    return (
      <div className={cardClass} style={{ animation: "card-enter 0.25s ease-out both" }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/10 border border-primary-100/60">
            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                Verified
              </span>
            </div>
            <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
              Email verified
            </h3>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Your email <span className="font-semibold text-gray-700">{emailHint || preVerifiedEmail}</span> has been verified. Sign in to access your dashboard.
            </p>
          </div>

          {/* Action */}
          <div className="sm:shrink-0">
            <button
              onClick={onVerificationComplete}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] transition-all min-h-[48px] shadow-sm"
            >
              Continue to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: No-Access Success State
  // ════════════════════════════════════════════════════════════

  if (state === "no-access-success") {
    return (
      <div className={cardClass} style={{ animation: "card-enter 0.25s ease-out both" }}>
        <div className="text-center py-4">
          <div className="relative inline-block mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm shadow-primary-500/10 border border-primary-100/60">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-white">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900 mb-1.5">
            Request submitted
          </h3>
          <p className="text-[15px] text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
            Our team will review your request and get back to you within 2–3 business days.
          </p>
          <Link
            href={`/provider/${provider.slug || provider.provider_id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Return to listing
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Dispute Submitted State
  // ════════════════════════════════════════════════════════════

  if (state === "dispute-submitted") {
    return (
      <div className={cardClass} style={{ animation: "card-enter 0.25s ease-out both" }}>
        <div className="text-center py-4">
          <div className="relative inline-block mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm shadow-primary-500/10 border border-primary-100/60">
              <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-white">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900 mb-1.5">
            Dispute submitted
          </h3>
          <p className="text-[15px] text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
            Our team will review your dispute and get back to you within 2–3 business days.
          </p>
          <Link
            href={`/provider/${provider.slug || provider.provider_id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
          >
            Return to listing
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: No-Access Form State
  // ════════════════════════════════════════════════════════════

  if (state === "no-access") {
    return (
      <div className={cardClass} style={{ animation: "card-enter 0.25s ease-out both" }}>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shrink-0 border border-amber-200/60">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
              We couldn&apos;t find an email on file
            </h3>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Please provide your details so we can verify your connection to this listing.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelClasses}>
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={noAccessName}
              onChange={(e) => setNoAccessName(e.target.value)}
              placeholder="Your full name"
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>
              Your role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={noAccessRole}
                onChange={(e) => setNoAccessRole(e.target.value)}
                className={`${selectClasses} ${!noAccessRole ? "text-gray-400" : "text-gray-900"}`}
              >
                <option value="" disabled>Select your role...</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>
              Your email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={noAccessEmail}
              onChange={(e) => setNoAccessEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>
              Additional notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={noAccessNotes}
              onChange={(e) => setNoAccessNotes(e.target.value)}
              placeholder="Anything else we should know?"
              rows={3}
              className={`${inputClasses} resize-none`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-700" role="alert">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => { setState("verify-form"); setError(""); }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button
              onClick={handleNoAccessSubmit}
              disabled={!noAccessName.trim() || !noAccessRole || !noAccessEmail.trim() || noAccessSubmitting}
              className="px-6 py-3 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
            >
              {noAccessSubmitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Already Claimed State (Dispute Form)
  // ════════════════════════════════════════════════════════════

  if (state === "already-claimed") {
    return (
      <div className={cardClass} style={{ animation: "card-enter 0.25s ease-out both" }}>
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center shrink-0 border border-amber-200/60">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
              This listing has been claimed
            </h3>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              If you believe you should manage <strong className="text-gray-700">{provider.provider_name}</strong>, please tell us why.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className={labelClasses}>
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={disputeName}
              onChange={(e) => setDisputeName(e.target.value)}
              placeholder="Your full name"
              className={inputClasses}
            />
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>
              Your role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={disputeRole}
                onChange={(e) => setDisputeRole(e.target.value)}
                className={`${selectClasses} ${!disputeRole ? "text-gray-400" : "text-gray-900"}`}
              >
                <option value="" disabled>Select your role...</option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelClasses}>
              Why should you manage this listing? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain your connection to this organization..."
              rows={4}
              className={`${inputClasses} resize-none`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              <p className="text-sm text-red-700" role="alert">{error}</p>
            </div>
          )}

          <div className="pt-3">
            <button
              onClick={handleDisputeSubmit}
              disabled={!disputeName.trim() || !disputeRole || !disputeReason.trim() || disputeSubmitting}
              className="w-full py-3.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px]"
            >
              {disputeSubmitting ? "Submitting..." : "Submit dispute"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Verify Code State
  // ════════════════════════════════════════════════════════════

  if (state === "verify-code") {
    return (
      <div className={cardClass} style={{ animation: "card-enter 0.25s ease-out both" }}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center mx-auto mb-4 shadow-sm shadow-primary-500/10 border border-primary-100/60">
            <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-display font-bold text-gray-900 mb-1.5">
            Check your email
          </h3>
          <p className="text-[15px] text-gray-500">
            We sent a 6-digit code to <span className="font-semibold text-gray-700">{emailHint}</span>
          </p>
        </div>

        {/* Code input */}
        <div className="flex justify-center gap-2.5 mb-6" onPaste={handleCodePaste}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <input
              key={i}
              ref={(el) => { codeInputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[i] || ""}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleCodeKeyDown(i, e)}
              disabled={verifying}
              className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold border border-gray-200 bg-gray-50/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent focus:bg-white disabled:opacity-50 transition-all"
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg mb-4">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-700" role="alert">{error}</p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
          </button>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={() => setState("no-access")}
            className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 text-center transition-colors min-h-[44px]"
          >
            I don&apos;t have access to this email
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // RENDER: Verify Form State (Default)
  // ════════════════════════════════════════════════════════════

  return (
    <div className={cardClass} style={{ animation: "card-enter 0.25s ease-out both" }}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/10 border border-primary-100/60">
          <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-gray-900 mb-1">
            Verify your business email
          </h3>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            We&apos;ll send a verification code to the <strong className="text-gray-700">email on file</strong> for this business.
          </p>
        </div>
      </div>

      {/* Info banner about email on file */}
      {provider.email && (
        <div className="mb-5 px-4 py-3 bg-vanilla-50 border border-warm-100/60 rounded-xl">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-primary-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600">
              Code will be sent to: <span className="font-semibold text-gray-800">{maskEmail(provider.email)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelClasses}>
              Your email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClasses}
            />
            <p className="text-xs text-gray-400">For our records</p>
          </div>
          <div className="space-y-1.5">
            <label className={labelClasses}>
              Phone number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className={inputClasses}
            />
            <p className="text-xs text-gray-400">For our records</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-lg">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-red-700" role="alert">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 leading-relaxed">
          You will not be charged to confirm your account. By confirming, you agree to our{" "}
          <Link href="/terms" className="text-primary-600 hover:underline font-medium">Provider TOS</Link>
          {" & "}
          <Link href="/privacy" className="text-primary-600 hover:underline font-medium">Privacy Notice</Link>.
        </p>

        <button
          onClick={handleSubmitVerifyForm}
          disabled={!email.trim() || !phone.trim() || submitting}
          className="w-full py-3.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[48px] shadow-sm"
        >
          {submitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Sending code...
            </span>
          ) : (
            "Send verification code"
          )}
        </button>

        {/* No access link */}
        <button
          type="button"
          onClick={() => setState("no-access")}
          className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors pt-2 min-h-[44px]"
        >
          I don&apos;t have access to the business email
        </button>
      </div>
    </div>
  );
}
