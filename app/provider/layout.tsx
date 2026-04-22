"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import Button from "@/components/ui/Button";
import type { ReactNode } from "react";
import {
  isAccountRestricted,
  isVerificationPending,
  getVerificationStatusMessage,
} from "@/lib/verification-gate";

export default function ProviderLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, account, isLoading, fetchError, refreshAccountData, openAuth } =
    useAuth();
  const providerProfile = useProviderProfile();
  const retriedRef = useRef(false);
  const [retryDone, setRetryDone] = useState(false);

  // Public provider pages that manage their own auth state — skip layout gates
  // Includes: /provider/[slug] (detail), /provider/[slug]/onboard, /provider/welcome
  const PUBLIC_ROUTES = ["/provider/welcome"];
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname) ||
    (pathname.startsWith("/provider/") && !pathname.startsWith("/provider/connections") &&
     !pathname.startsWith("/provider/inbox") && !pathname.startsWith("/provider/reviews") &&
     !pathname.startsWith("/provider/matches") && !pathname.startsWith("/provider/pro") &&
     !pathname.startsWith("/provider/qna") && !pathname.startsWith("/provider/medjobs"));

  // Known hub routes that require authentication
  const HUB_ROUTES = ["/provider", "/provider/connections", "/provider/inbox", "/provider/reviews", "/provider/matches", "/provider/pro", "/provider/qna", "/provider/medjobs"];

  const isHubRoute = HUB_ROUTES.some((route) =>
    route === "/provider" ? pathname === "/provider" : pathname.startsWith(route)
  );

  // Auto-retry once on transient timeout — prevents "Couldn't load" flash
  // Must be before conditional returns to satisfy React hooks rules
  useEffect(() => {
    if (user && !account && fetchError && !retriedRef.current) {
      retriedRef.current = true;
      setRetryDone(false);
      refreshAccountData().finally(() => setRetryDone(true));
    }
    if (account) {
      retriedRef.current = false;
      setRetryDone(false);
    }
  }, [user, account, fetchError, refreshAccountData]);

  if (isPublicRoute || !isHubRoute) {
    return <>{children}</>;
  }

  // Brief spinner while auth resolves
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in required
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Sign in to access your provider hub.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              onClick={() =>
                openAuth({ defaultMode: "sign-in", intent: "provider" })
              }
            >
              Sign in
            </Button>
            <Link
              href="/"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Signed in but account data not yet available
  if (!account) {
    // Show error only AFTER auto-retry has completed and still failed
    if (fetchError && retryDone) {
      return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-base text-gray-600 mb-4">
              Couldn&apos;t load your account data.
            </p>
            <Button size="sm" onClick={() => { retriedRef.current = false; setRetryDone(false); refreshAccountData(); }}>
              Retry
            </Button>
          </div>
        </div>
      );
    }
    // Still loading or auto-retry in progress — show spinner
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Authenticated but no provider profile — redirect to family portal (not onboarding)
  // Users should only reach provider onboarding via explicit "Add profile" action
  if (!providerProfile) {
    router.replace("/portal");
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Check if account is restricted (low-trust claim requiring verification)
  const verificationState = providerProfile.verification_state;
  const restricted = isAccountRestricted(verificationState);
  const pendingReview = isVerificationPending(verificationState);
  const statusMessage = getVerificationStatusMessage(verificationState);

  // Show restriction banner for restricted accounts
  if (restricted || pendingReview) {
    return (
      <>
        {/* Restriction Banner */}
        <div
          className={`sticky top-0 z-50 ${
            restricted
              ? "bg-amber-50 border-b border-amber-200"
              : "bg-blue-50 border-b border-blue-200"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {restricted ? (
                  <svg
                    className="w-5 h-5 text-amber-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-blue-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                )}
                <div>
                  <p
                    className={`font-semibold text-sm ${
                      restricted ? "text-amber-900" : "text-blue-900"
                    }`}
                  >
                    {statusMessage.title}
                  </p>
                  <p
                    className={`text-sm ${
                      restricted ? "text-amber-700" : "text-blue-700"
                    }`}
                  >
                    {statusMessage.description}
                  </p>
                </div>
              </div>
              {statusMessage.showVerificationCTA && (
                <Link
                  href="/provider?verify=true"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition-colors"
                >
                  Complete Verification
                </Link>
              )}
            </div>
          </div>
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}
