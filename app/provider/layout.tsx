"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import Button from "@/components/ui/Button";
import type { ReactNode } from "react";

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
     !pathname.startsWith("/provider/qna") && !pathname.startsWith("/provider/medjobs") &&
     !pathname.startsWith("/provider/verification"));

  // Known hub routes that require authentication
  const HUB_ROUTES = ["/provider", "/provider/connections", "/provider/inbox", "/provider/reviews", "/provider/matches", "/provider/pro", "/provider/qna", "/provider/medjobs", "/provider/verification", "/provider/caregivers"];

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

  const isPending = providerProfile?.claim_state === "pending";

  // Leads/connections contain full PII (emails, phones, messages) — blur entirely
  const isLeadsRoute = isPending && pathname.startsWith("/provider/connections");

  return (
    <>
      {isPending && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Identity verification pending.</span>{" "}
              Your account is under review. Some information is blurred until your identity is verified.
            </p>
          </div>
        </div>
      )}
      {isLeadsRoute ? (
        <div className="relative">
          <div className="blur-[6px] select-none pointer-events-none" aria-hidden="true">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-sm text-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p className="text-sm font-semibold text-gray-900">Identity verification required</p>
              <p className="text-xs text-gray-500">
                Lead information is protected until your identity is verified. We&apos;ll review your request within 2-3 business days.
              </p>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </>
  );
}
