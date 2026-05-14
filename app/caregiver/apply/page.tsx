"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { createAuthClient } from "@/lib/supabase/auth-client";
import OtpInput from "@/components/auth/OtpInput";
import { ProfileFormState, INITIAL_PROFILE } from "./Step2Profile";
import Step2About from "./Step2About";
import Step3Experience from "./Step3Experience";
import Step4Verify from "./Step4Verify";
import { IdentityFormState, INITIAL_IDENTITY } from "./Step3Identity";
import Step5Background, { BackgroundFormState, INITIAL_BACKGROUND } from "./Step4Background";
import { StudentFormState, INITIAL_STUDENT } from "./Step5Student";
import Step6Availability, { AvailabilityFormState, INITIAL_AVAILABILITY } from "./Step6Availability";
import Step7Review from "./Step7Review";

/* ─── Constants ────────────────────────────────────────────── */

const TOTAL_STEPS = 7;

const STEP_LABELS = [
  "Account",
  "About",
  "Experience",
  "Verify",
  "Background",
  "Availability",
  "Review",
];

/* ─── Progress Bar Component ──────────────────────────────── */

function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = Math.round((currentStep / TOTAL_STEPS) * 100);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
        {/* Step count + percentage */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-900">
            Step {currentStep} <span className="text-gray-400 font-normal">of {TOTAL_STEPS}</span>
          </p>
          <p className="text-sm text-primary-600 font-medium">{pct}% complete</p>
        </div>
        {/* Bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Step indicators */}
        <div className="flex items-center justify-between mt-3">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isComplete = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isComplete
                      ? "bg-primary-500 text-white"
                      : isCurrent
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isComplete ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium hidden sm:block ${
                    isCurrent ? "text-primary-700" : isComplete ? "text-primary-500" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 1: Create Account (matches existing auth modal flow) ── */

type AuthSubStep = "entry" | "sign-up" | "sign-in" | "verify-otp";

function Step1CreateAccount({
  form,
  setForm,
  onContinue,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onContinue: () => void;
}) {
  const [authStep, setAuthStep] = useState<AuthSubStep>("entry");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpContext, setOtpContext] = useState<"signup" | "signin">("signup");

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /* ── Google OAuth ── */
  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/caregiver/apply")}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (oauthError) setError(oauthError.message);
  };

  /* ── Email-first: check if exists ── */
  const handleEmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    setError("");
    setCheckingEmail(true);

    try {
      const res = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const { exists } = await res.json();
      setAuthStep(exists ? "sign-in" : "sign-up");
    } catch {
      setAuthStep("sign-up");
    } finally {
      setCheckingEmail(false);
    }
  };

  /* ── Sign Up ── */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const displayName = `${form.firstName} ${form.lastName}`.trim();
      const authClient = createAuthClient();
      const { data: authData, error: authError } = await authClient.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { display_name: displayName || undefined } },
      });

      if (authError) {
        setError(
          authError.message.includes("already registered")
            ? "This email is already registered. Try signing in instead."
            : authError.message
        );
        setLoading(false);
        return;
      }

      if (!authData.session) {
        if (authData.user?.identities?.length === 0) {
          try { await authClient.auth.resend({ type: "signup", email: form.email }); } catch {}
        }
        setOtpContext("signup");
        setResendCooldown(60);
        setLoading(false);
        setAuthStep("verify-otp");
        return;
      }

      setLoading(false);
      onContinue();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  /* ── Sign In ── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError(
          authError.message === "Invalid login credentials"
            ? "Wrong email or password. Please try again."
            : authError.message
        );
        setLoading(false);
        return;
      }

      setLoading(false);
      onContinue();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  /* ── OTP Verify ── */
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (otpCode.length !== 8) {
      setError("Please enter the 8-digit code.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        setError("Authentication is not configured.");
        setLoading(false);
        return;
      }

      const authClient = createAuthClient();
      const { data: verifyData, error: verifyError } = await authClient.auth.verifyOtp({
        email: form.email,
        token: otpCode,
        type: otpContext === "signup" ? "signup" : "email",
      });

      if (verifyError) {
        setError(
          verifyError.message.includes("expired")
            ? "This code has expired. Please request a new one."
            : verifyError.message.includes("invalid")
            ? "Invalid code. Please check and try again."
            : verifyError.message
        );
        setLoading(false);
        return;
      }

      if (verifyData.session) {
        try {
          await createClient().auth.setSession({
            access_token: verifyData.session.access_token,
            refresh_token: verifyData.session.refresh_token,
          });
        } catch {}
      }

      setLoading(false);
      onContinue();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendCooldown > 0 || !isSupabaseConfigured()) return;
    try {
      const authClient = createAuthClient();
      if (otpContext === "signup") {
        await authClient.auth.resend({ type: "signup", email: form.email });
      } else {
        await authClient.auth.signInWithOtp({ email: form.email });
      }
      setResendCooldown(60);
    } catch {}
  };

  /* ── Shared UI ── */
  const GoogleButton = () => (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-[15px] font-medium text-gray-700"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
      </svg>
      Continue with Google
    </button>
  );

  const BackButton = ({ onClick }: { onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
  );

  /* ── Screen: Entry (email + Google) ── */
  if (authStep === "entry") {
    return (
      <div className="flex flex-col items-center">
        <Image src="/images/olera-logo.png" alt="Olera" width={48} height={48} className="mb-5" />
        <h1 className="text-xl font-bold text-gray-900 mb-8">Log in or sign up</h1>

        <div className="w-full space-y-5">
          <GoogleButton />

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium uppercase">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleEmailContinue} className="space-y-4">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="you@university.edu"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            {error && <p className="text-sm text-error-500">{error}</p>}
            <button
              type="submit"
              disabled={checkingEmail || !form.email.trim()}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-[15px] font-semibold rounded-2xl transition-colors"
            >
              {checkingEmail ? "Checking..." : "Continue"}
            </button>
          </form>

          <div className="bg-vanilla-50 rounded-xl border border-vanilla-200 p-3.5 mt-2">
            <p className="text-xs text-gray-600 text-center">
              <span className="font-semibold text-gray-900">One-time fee of $34.99</span> covers your background check and identity verification. The platform is free to use.
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-primary-600 font-medium">Terms</Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary-600 font-medium">Privacy Policy</Link>
          </p>
        </div>
      </div>
    );
  }

  /* ── Screen: Sign Up (name + password) ── */
  if (authStep === "sign-up") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <BackButton onClick={() => setAuthStep("entry")} />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-400 mt-1">{form.email}</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="text"
            value={`${form.firstName} ${form.lastName}`.trim() || ""}
            onChange={(e) => {
              const parts = e.target.value.split(" ");
              setForm((f) => ({
                ...f,
                firstName: parts[0] || "",
                lastName: parts.slice(1).join(" ") || "",
              }));
            }}
            placeholder="Full name"
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
          <div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Password"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1.5 ml-1">Must be at least 8 characters</p>
          </div>

          {error && <p className="text-sm text-error-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-[15px] font-semibold rounded-2xl transition-colors"
          >
            {loading ? "Creating..." : "Create account"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <button type="button" onClick={() => setAuthStep("sign-in")} className="text-primary-600 font-medium hover:text-primary-700">
              Sign in
            </button>
          </p>
        </form>
      </div>
    );
  }

  /* ── Screen: Sign In (password) ── */
  if (authStep === "sign-in") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <BackButton onClick={() => setAuthStep("entry")} />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-400 mt-1">{form.email}</p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password"
            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />

          {error && <p className="text-sm text-error-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-[15px] font-semibold rounded-2xl transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <button type="button" onClick={() => setAuthStep("sign-up")} className="text-primary-600 font-medium hover:text-primary-700">
              Sign up
            </button>
          </p>
        </form>
      </div>
    );
  }

  /* ── Screen: Verify OTP ── */
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <BackButton onClick={() => setAuthStep("sign-up")} />
      </div>
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-400 mt-1">
          Enter the code sent to <span className="font-semibold text-gray-700">{form.email}</span>
        </p>
      </div>

      <form onSubmit={handleVerifyOtp} className="space-y-5">
        <OtpInput
          length={8}
          value={otpCode}
          onChange={setOtpCode}
          disabled={loading}
          error={!!error}
        />

        {error && <p className="text-sm text-error-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading || otpCode.length !== 8}
          className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white text-[15px] font-semibold rounded-2xl transition-colors"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <p className="text-center text-sm text-gray-400">
          {resendCooldown > 0 ? (
            <>Resend in {resendCooldown}s</>
          ) : (
            <button type="button" onClick={handleResend} className="text-primary-600 font-medium hover:text-primary-700">
              Resend code
            </button>
          )}
        </p>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <button type="button" onClick={() => setAuthStep("sign-in")} className="text-primary-600 font-medium hover:text-primary-700">
            Sign in instead
          </button>
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors mt-2"
        >
          Skip for now
        </button>
      </form>
    </div>
  );
}

/* ─── Placeholder Steps 2–7 ───────────────────────────────── */

function PlaceholderStep({ step, onBack, onContinue }: { step: number; onBack: () => void; onContinue: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
        {STEP_LABELS[step - 1]}
      </h2>
      <p className="text-gray-500 text-sm mb-8">
        This step will be built in Phase 2.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ─── Form State ──────────────────────────────────────────── */

interface FormState {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

const INITIAL_FORM: FormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
};

/* ─── Main Page ───────────────────────────────────────────── */

export default function CaregiverApplyPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [profile, setProfile] = useState<ProfileFormState>(INITIAL_PROFILE);
  const [identity, setIdentity] = useState<IdentityFormState>(INITIAL_IDENTITY);
  const [background, setBackground] = useState<BackgroundFormState>(INITIAL_BACKGROUND);
  const [student, setStudent] = useState<StudentFormState>(INITIAL_STUDENT);
  const [availability, setAvailability] = useState<AvailabilityFormState>(INITIAL_AVAILABILITY);
  const [animClass, setAnimClass] = useState("opacity-100 translate-y-0");
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (target: number) => {
      setAnimClass("opacity-0 -translate-y-3");
      setTimeout(() => {
        setStep(target);
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        setAnimClass("opacity-0 translate-y-4");
        requestAnimationFrame(() => {
          setAnimClass("opacity-100 translate-y-0");
        });
      }, 200);
    },
    []
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-vanilla-50">
      {/* Header with logo */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/care-shifts/students" className="flex items-center gap-2">
            <Image src="/images/olera-logo.png" alt="Olera" width={24} height={24} />
            <span className="text-lg font-semibold text-gray-900">Olera</span>
          </Link>
          <Link
            href={`/caregiver/dashboard?name=${encodeURIComponent(form.firstName)}&step=${step}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Save & exit
          </Link>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar currentStep={step} />

      {/* Step content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 transition-all duration-300">
        <div className={`transition-all duration-300 ease-out ${animClass}`}>
          {step === 1 && (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 max-w-md mx-auto">
              <Step1CreateAccount form={form} setForm={setForm} onContinue={() => goTo(2)} />
            </div>
          )}

          {step === 2 && (
            <Step2About
              profile={profile}
              setProfile={setProfile}
              onBack={() => goTo(1)}
              onContinue={() => goTo(3)}
            />
          )}

          {step === 3 && (
            <Step3Experience
              profile={profile}
              setProfile={setProfile}
              onBack={() => goTo(2)}
              onContinue={() => goTo(4)}
            />
          )}

          {step === 4 && (
            <Step4Verify
              identity={identity}
              setIdentity={setIdentity}
              student={student}
              setStudent={setStudent}
              onBack={() => goTo(3)}
              onContinue={() => goTo(5)}
            />
          )}

          {step === 5 && (
            <Step5Background
              background={background}
              setBackground={setBackground}
              prefillName={`${form.firstName} ${form.lastName}`.trim()}
              onBack={() => goTo(4)}
              onContinue={() => goTo(6)}
            />
          )}

          {step === 6 && (
            <Step6Availability
              availability={availability}
              setAvailability={setAvailability}
              careSpecialties={profile.careSpecialties}
              onBack={() => goTo(5)}
              onContinue={() => goTo(7)}
            />
          )}

          {step === 7 && (
            <Step7Review
              form={form}
              profile={profile}
              identity={identity}
              background={background}
              student={student}
              availability={availability}
              onGoTo={goTo}
              onBack={() => goTo(6)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
