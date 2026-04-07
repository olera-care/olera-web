"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createAuthClient } from "@/lib/supabase/auth-client";
import { useAuth } from "@/components/auth/AuthProvider";

type Step = "loading" | "interview" | "success" | "error";

interface InterviewData {
  id: string;
  type: "video" | "phone" | "in_person";
  proposed_time: string;
  notes: string | null;
  status: string;
  student: {
    id: string;
    display_name: string;
    image_url: string | null;
    slug: string;
  };
  provider: {
    id: string;
    display_name: string;
    email: string;
    account_id: string | null;
  };
}

export default function MedJobsOnboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshAccountData, switchProfile } = useAuth();

  const actionParam = searchParams.get("action"); // "interview"
  const actionIdParam = searchParams.get("actionId"); // interview ID
  const tokenParam = searchParams.get("otk"); // one-time key

  const [step, setStep] = useState<Step>("loading");
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const initRef = useRef(false);

  // Redirect URL for interviews page
  const interviewsUrl = "/portal/medjobs/interviews";

  // Initialize: validate token, show interview immediately, auto-sign-in in background
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!tokenParam || !actionIdParam || actionParam !== "interview") {
      setErrorMsg("Invalid or missing link parameters.");
      setStep("error");
      return;
    }

    (async () => {
      try {
        // Validate token via API
        const tokenRes = await fetch("/api/medjobs/validate-interview-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenParam,
            interviewId: actionIdParam,
          }),
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || !tokenData.valid) {
          setErrorMsg(tokenData.error || "This link has expired or is invalid.");
          setStep("error");
          return;
        }

        const email = tokenData.email;
        const providerProfileId = tokenData.profileId;

        setVerifiedEmail(email);
        setProfileId(providerProfileId);
        setInterview(tokenData.interview);

        // 1. Show interview card IMMEDIATELY (no auth required)
        setStep("interview");

        // 2. Background auto-sign-in — invisible to the provider
        (async () => {
          try {
            // If already signed in, check if they own this profile
            if (user) {
              const supabase = createClient();
              const { data: { user: currentUser } } = await supabase.auth.getUser();

              if (currentUser?.email?.toLowerCase() === email.toLowerCase()) {
                // Already signed in with correct email - link profile if needed
                if (!tokenData.interview.provider.account_id) {
                  await fetch("/api/medjobs/link-provider-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ profileId: providerProfileId }),
                  });
                  await refreshAccountData();
                  switchProfile(providerProfileId);
                }
                setIsSignedIn(true);
                console.log("[MedJobs OneClick] Already signed in as owner");
                return;
              }
            }

            // Auto-sign-in with the verified email
            // Use interview ID as the claim session identifier
            console.log("[MedJobs OneClick] Starting auto-sign-in for", email);
            const signInRes = await fetch("/api/auth/auto-sign-in", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, claimSession: actionIdParam }),
            });
            const signInData = await signInRes.json();

            if (!signInRes.ok || !signInData.tokenHash) {
              console.warn("[MedJobs OneClick] auto-sign-in failed:", signInData.error || signInRes.status);
              return;
            }

            // Establish session (implicit flow — no PKCE)
            const authClient = createAuthClient();
            const { data: otpData, error: otpError } = await authClient.auth.verifyOtp({
              token_hash: signInData.tokenHash,
              type: "magiclink",
            });

            if (otpError || !otpData?.session) {
              console.warn("[MedJobs OneClick] verifyOtp failed:", otpError?.message);
              return;
            }

            // Transfer session to SSR client
            await createClient().auth.setSession({
              access_token: otpData.session.access_token,
              refresh_token: otpData.session.refresh_token,
            });
            console.log("[MedJobs OneClick] Session established");

            // Link profile to account
            const linkRes = await fetch("/api/medjobs/link-provider-profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profileId: providerProfileId }),
            });

            if (linkRes.ok) {
              console.log("[MedJobs OneClick] Profile linked");
              await refreshAccountData();
              switchProfile(providerProfileId);
              setIsSignedIn(true);
            } else {
              const linkData = await linkRes.json();
              console.warn("[MedJobs OneClick] Profile link failed:", linkData.error);
            }

            // Log for observability
            fetch("/api/activity/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider_id: providerProfileId,
                event_type: "one_click_access",
                metadata: { action: "interview", interview_id: actionIdParam, email, source: "email_token" },
              }),
            }).catch(() => {});
          } catch (err) {
            console.warn("[MedJobs OneClick] Background sign-in error:", err);
          }
        })();
      } catch (err) {
        console.error("[MedJobsOnboard] init error:", err);
        setErrorMsg("Something went wrong. Please try again.");
        setStep("error");
      }
    })();
  }, [tokenParam, actionIdParam, actionParam, user, refreshAccountData, switchProfile]);

  // Format date for display
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "video": return "Video";
      case "phone": return "Phone";
      case "in_person": return "In-Person";
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        );
      case "phone":
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
          </svg>
        );
      case "in_person":
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading your interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{errorMsg || "Something went wrong"}</h1>
          <p className="text-gray-500 mb-6">Please check the link and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Success state (after they click "View All Interviews")
  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">You&apos;re all set!</h1>
          <p className="text-gray-500 mb-6">Your account is ready. View your interviews to confirm or manage your schedule.</p>
          <button
            onClick={() => router.push(interviewsUrl)}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            View Interviews
          </button>
        </div>
      </div>
    );
  }

  // Interview view - shown IMMEDIATELY after token validation
  if (!interview) return null;

  const studentFirstName = interview.student.display_name?.split(" ")[0] || "the candidate";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary-600">
            Olera
          </Link>
          {isSignedIn && (
            <Link
              href={interviewsUrl}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all interviews →
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Success banner */}
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">Interview request sent!</p>
            <p className="text-sm text-emerald-700 mt-0.5">
              {studentFirstName} will receive your request and confirm within 24 hours.
            </p>
          </div>
        </div>

        {/* Interview Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Candidate Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              {interview.student.image_url ? (
                <Image
                  src={interview.student.image_url}
                  alt={interview.student.display_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-primary-600">
                    {interview.student.display_name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{interview.student.display_name}</h1>
                <p className="text-sm text-gray-500">Candidate</p>
              </div>
            </div>
          </div>

          {/* Interview Details */}
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                {getTypeIcon(interview.type)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Format</p>
                <p className="text-base text-gray-900">{getTypeLabel(interview.type)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Proposed Time</p>
                <p className="text-base text-gray-900">{formatDateTime(interview.proposed_time)}</p>
              </div>
            </div>

            {interview.notes && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Your Notes</p>
                  <p className="text-base text-gray-900">{interview.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Status + Actions */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-amber-800">
                Waiting for {studentFirstName} to confirm
              </span>
            </div>

            <button
              onClick={() => router.push(interviewsUrl)}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              {isSignedIn ? "View All Interviews" : "View All Interviews"}
            </button>

            {!isSignedIn && (
              <p className="mt-3 text-center text-xs text-gray-500">
                Signing you in automatically...
              </p>
            )}
          </div>
        </div>

        {/* Your info card */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Sent from
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{interview.provider.display_name}</p>
              <p className="text-sm text-gray-500">{verifiedEmail}</p>
            </div>
            {isSignedIn && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                Signed in
              </span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
