"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import type { IntendedProfessionalSchool } from "@/lib/types";
import type { CoverageBucket } from "@/lib/medjobs/student-eligibility";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";
import Select from "@/components/ui/Select";
import OtpInput from "@/components/auth/OtpInput";

/**
 * StudentEligibilityModal — the student funnel front door (mirror of the
 * provider EligibilityScreenerModal).
 *
 * Q1 aspiration → Q2 availability → email → silent sign-in (one modal, no
 * redirect). Two baby-step questions, both self-affirming; the email lands as
 * the reward. Writes eligibility + creates the account via
 * /api/medjobs/student-eligibility, then verifyOtp establishes the session so
 * AuthProvider's listener fires and the board re-renders authed in place.
 */

type Step = "q1" | "q2" | "email" | "loading" | "verify-otp";

const Q1: { value: IntendedProfessionalSchool; label: string; reassure: string }[] = [
  { value: "medicine", label: "Med school", reassure: "Perfect — paid caregiving hours are exactly what med schools want to see." },
  { value: "nursing", label: "Nursing", reassure: "Perfect — nursing programs love real bedside hours." },
  { value: "pa", label: "PA", reassure: "Perfect — PA programs want direct patient-care hours, and this counts." },
  { value: "pt", label: "PT / OT", reassure: "Great — hands-on care hours strengthen PT/OT applications." },
  { value: "public_health", label: "Public health", reassure: "Great — frontline care experience grounds a public-health path." },
  { value: "undecided", label: "Still exploring", reassure: "Love it — this is the best way to find out if healthcare's for you." },
];

const Q2: { value: CoverageBucket; label: string }[] = [
  { value: "day", label: "Days" },
  { value: "evening", label: "Evenings" },
  { value: "overnight", label: "Overnights" },
  { value: "weekend", label: "Weekends" },
];

const btnPrimary =
  "mt-2 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40";
const optionClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-800 hover:border-primary-300 hover:bg-primary-50/40";
const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-base placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent";

const EMAIL_RE = /\S+@\S+\.\S+/;

export interface StudentEligibilityContext {
  campusName?: string | null;
  campusSlug?: string | null;
  universityName?: string | null;
  universityId?: string | null;
  city?: string | null;
  state?: string | null;
  /** Live catchment count for the demand line; honest floor applied below. */
  demandCount?: number | null;
  referral?: unknown;
}

export default function StudentEligibilityModal({
  context,
  onClose,
  onComplete,
  onExistingUser,
}: {
  context: StudentEligibilityContext;
  onClose: () => void;
  onComplete: () => void | Promise<void>;
  /** Called when the user already has an account — parent should open auth flow */
  onExistingUser?: (email: string) => void;
}) {
  const router = useRouter();
  const { refreshAccountData } = useAuth();
  const [step, setStep] = useState<Step>("q1");
  const [track, setTrack] = useState<IntendedProfessionalSchool | null>(null);
  const [buckets, setBuckets] = useState<CoverageBucket[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState<string>(context.campusSlug ?? "");
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  // OTP verification state (for returning users)
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  // Lock body scroll when modal is open to prevent background "shaking" on mobile
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const reassurance = Q1.find((q) => q.value === track)?.reassure;

  // Convert partner universities to Select options format
  const universityOptions = useMemo(
    () => PARTNER_UNIVERSITIES.map((u) => ({ value: u.slug, label: u.name })),
    []
  );

  const toggleBucket = (b: CoverageBucket) =>
    setBuckets((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]));

  // OTP verification for returning users
  const handleVerifyOtp = async () => {
    if (otpCode.length !== 8) {
      setError("Please enter the 8-digit code.");
      return;
    }
    setError(null);
    setOtpLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode,
        type: "email",
      });
      if (verifyError) {
        if (verifyError.message.includes("expired")) {
          setError("This code has expired. Please request a new one.");
        } else if (verifyError.message.includes("invalid")) {
          setError("Invalid code. Please check and try again.");
        } else {
          setError(verifyError.message);
        }
        setOtpLoading(false);
        return;
      }
      // Success — refresh auth and redirect to portal
      await refreshAccountData();
      router.replace("/portal/medjobs");
    } catch {
      setError("Something went wrong. Please try again.");
      setOtpLoading(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setOtpLoading(true);
    try {
      const supabase = createClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
      });
      if (otpError) {
        setError("Failed to resend code. Please try again.");
        setOtpLoading(false);
        return;
      }
      setResendCooldown(30);
      setOtpCode("");
      setOtpLoading(false);
    } catch {
      setError("Failed to resend code. Please try again.");
      setOtpLoading(false);
    }
  };

  async function submit() {
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!university) {
      setError("Please select your university.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    setStep("loading");
    try {
      const selectedUni = PARTNER_UNIVERSITIES.find((u) => u.slug === university);
      const res = await fetch("/api/medjobs/student-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          careerPath: track,
          coverageBuckets: buckets,
          university: selectedUni?.name ?? context.universityName ?? undefined,
          universityId: context.universityId ?? undefined,
          campus: university,
          // Auto-fill city/state from selected university if not in context
          city: context.city ?? selectedUni?.city ?? undefined,
          state: context.state ?? selectedUni?.state ?? undefined,
          referral: context.referral,
          website: honeypot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setStep("email");
        return;
      }

      if (data.existing) {
        // Returning student — send OTP code and show verification input
        setExisting(true);
        const supabase = createClient();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: false },
        });
        if (otpError) {
          console.error("[student-eligibility] OTP send error:", otpError.message);
          // Handle specific error cases
          if (otpError.message.includes("not found") || otpError.message.includes("not registered")) {
            setError("We couldn't find your account. Please contact support@olera.care for help.");
          } else if (otpError.message.includes("rate limit") || otpError.message.includes("too many")) {
            setError("Too many attempts. Please wait a few minutes and try again.");
          } else {
            setError("Failed to send sign-in code. Please try again.");
          }
          setStep("email");
          return;
        }
        setResendCooldown(30);
        setStep("verify-otp");
        return;
      }

      if (data.tokenHash) {
        const supabase = createClient();
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: data.tokenHash,
          type: "magiclink",
        });
        if (otpError) {
          console.warn("[student-eligibility] auto-sign-in failed:", otpError.message);
          // Fallback: still try to complete in case session exists
          await refreshAccountData();
          await onComplete();
          return;
        }
        // Auth succeeded — redirect instantly, refresh in background
        // Use replace so back button doesn't return to landing page
        refreshAccountData();
        router.replace("/portal/medjobs");
        return;
      }
      // No tokenHash (shouldn't happen for new users) — fallback
      await refreshAccountData();
      await onComplete();
    } catch {
      setError("Network error. Please try again.");
      setStep("email");
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="relative w-full max-w-md max-h-[90vh] rounded-t-2xl bg-white shadow-xl sm:max-h-[85vh] sm:rounded-2xl">
        {/* Close button - fixed position relative to modal, not scrollable content */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* Scrollable content area */}
        <div className="overflow-y-auto overscroll-contain max-h-[90vh] p-6 pt-12 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-h-[85vh] sm:pb-6">
        {context.campusName ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-600">
            {context.campusName} · Student Caregiver Program
          </p>
        ) : null}

        {/* Honeypot */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />

        {step === "verify-otp" ? (
          <div>
            {/* Email icon */}
            <div className="flex justify-center mb-4">
              <div className="w-11 h-11 rounded-full bg-primary-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {existing ? "Welcome back!" : "Check your email"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter the code sent to <span className="font-medium text-gray-700">{email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm" role="alert">
                {error}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (otpCode.length === 8) handleVerifyOtp();
              }}
              className="space-y-4"
            >
              <OtpInput
                value={otpCode}
                onChange={(val) => {
                  setOtpCode(val);
                  if (error) setError(null);
                }}
                disabled={otpLoading}
                length={8}
              />

              <button
                type="submit"
                disabled={otpCode.length !== 8 || otpLoading}
                className={btnPrimary + " disabled:opacity-50"}
              >
                {otpLoading ? "Verifying..." : "Verify"}
              </button>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-sm text-gray-400">Resend in {resendCooldown}s</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Didn&apos;t get a code?{" "}
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpLoading}
                      className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        ) : step === "q1" ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-600">
              Eligibility check · 2 quick questions
            </p>
            <p className="font-serif text-lg text-gray-900">Where are you headed?</p>
            <p className="mt-1 text-sm text-gray-500">A quick check to match you to the right families and agencies for your hours.</p>
            <div className="mt-4 grid gap-2">
              {Q1.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  className={optionClass}
                  onClick={() => {
                    setTrack(q.value);
                    setStep("q2");
                  }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        ) : step === "q2" ? (
          <div>
            {reassurance ? (
              <p className="mb-3 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
                {reassurance}
              </p>
            ) : null}
            <p className="font-serif text-lg text-gray-900">When are you usually free?</p>
            <p className="mt-1 text-sm text-gray-500">Pick all that apply — we build shifts around your classes.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Q2.map((b) => {
                const on = buckets.includes(b.value);
                return (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => toggleBucket(b.value)}
                    className={
                      "rounded-xl border px-4 py-3 text-sm font-medium " +
                      (on
                        ? "border-primary-500 bg-primary-50 text-primary-800"
                        : "border-gray-200 bg-white text-gray-800 hover:border-primary-300")
                    }
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={buckets.length === 0}
              className={btnPrimary}
              onClick={() => setStep("email")}
            >
              Continue →
            </button>
          </div>
        ) : step === "email" ? (
          <div>
            <div className="flex items-start gap-3">
              <Image
                src="/images/for-providers/team/logan.jpg"
                alt="Dr. Logan DuBose"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm"
              />
              <div>
                <p className="font-serif text-lg text-gray-900">You&apos;re a good fit!</p>
                <p className="mt-1 text-sm text-gray-700">
                  Complete the full application to get hired for caregiving jobs near campus.
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-800">Your full name:</p>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="First and last name"
              className={fieldClass + " mt-2"}
              autoComplete="name"
            />
            <p className="mt-3 text-sm font-medium text-gray-800">Your university:</p>
            <div className="mt-2">
              <Select
                options={universityOptions}
                value={university}
                onChange={(val) => {
                  setUniversity(val);
                  if (error) setError(null);
                }}
                placeholder="Select your university"
                searchable
                searchPlaceholder="Search universities..."
                size="lg"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-800">Your phone number:</p>
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
              placeholder="(555) 123-4567"
              className={fieldClass + " mt-2"}
              autoComplete="tel"
            />
            <p className="mt-3 text-sm font-medium text-gray-800">Your email:</p>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@email.com"
              className={fieldClass + " mt-2"}
            />
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={!name.trim() || !university || !phone.trim() || !email.trim() || !EMAIL_RE.test(email)}
              className={btnPrimary + " disabled:opacity-50"}
              onClick={submit}
            >
              Go to full application →
            </button>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-500">Setting up your account…</div>
        )}
        </div>
      </div>
    </div>
  );
}
