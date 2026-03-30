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
  const HUB_ROUTES = ["/provider", "/provider/connections", "/provider/inbox", "/provider/reviews", "/provider/matches", "/provider/pro", "/provider/qna", "/provider/medjobs", "/provider/verification"];

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

  return <>{children}</>;
}
