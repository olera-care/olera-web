"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import Button from "@/components/ui/Button";
import type { ReactNode } from "react";

const PROVIDER_NAV_ITEMS = [
  {
    label: "Inbox",
    href: "/provider/inbox",
    iconSrc: "https://cdn.lordicon.com/dklbhvrt.json",
  },
  {
    label: "Connections",
    href: "/provider/connections",
    iconSrc: "https://cdn.lordicon.com/uvextprq.json",
  },
  {
    label: "Profile",
    href: "/provider/profile",
    iconSrc: "https://cdn.lordicon.com/lecprnjb.json",
  },
  {
    label: "Account Settings",
    href: "/portal/settings",
    iconSrc: "https://cdn.lordicon.com/lecprnjb.json",
  },
];

export default function ProviderLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, account, isLoading, fetchError, refreshAccountData, openAuth } = useAuth();
  const providerProfile = useProviderProfile();
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  // Brief spinner while auth resolves (reads local storage — very fast)
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
            <Button size="sm" onClick={() => openAuth({ defaultMode: "sign-in", intent: "provider" })}>
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

  // Signed in but account data failed to load
  if (!account) {
    if (fetchError) {
      return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-base text-gray-600 mb-4">
              Couldn&apos;t load your account data.
            </p>
            <Button size="sm" onClick={() => refreshAccountData()}>
              Retry
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Authenticated but no provider profile — guide them to create one
  if (!providerProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Set up your provider profile
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            List your organization or join as a caregiver to start connecting with families.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/for-providers">
              <Button size="lg">Get started</Button>
            </Link>
            <Link
              href="/portal"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Go to family portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Profile completeness nudge (< 60% complete for provider)
  const showNudge =
    !nudgeDismissed &&
    !providerProfile.description &&
    !providerProfile.image_url;

  // Full-width routes — no sidebar (inbox, profile pages)
  const isFullWidth =
    pathname.startsWith("/provider/inbox") ||
    pathname.startsWith("/provider/profile") ||
    pathname.startsWith("/provider/connections") ||
    pathname.startsWith("/portal/settings");

  if (isFullWidth) {
    return <>{children}</>;
  }

  return (
    <div className="flex bg-white min-h-[calc(100vh-64px)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[320px] shrink-0">
        <div className="sticky top-16 h-[calc(100vh-64px)] border-r border-gray-200 flex flex-col px-8 pt-6 pb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-5 px-1">Provider Hub</h1>
          <nav className="space-y-1">
            {PROVIDER_NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-gray-100 font-semibold text-gray-900"
                      : "text-gray-600 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <lord-icon
                    src={item.iconSrc}
                    trigger="hover"
                    colors={`primary:${isActive ? "#199087" : "#6b7280"}`}
                    style={{ width: "40px", height: "40px" }}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            {/* Profile completeness nudge */}
            {showNudge && (
              <div className="mb-3 px-3 py-2.5 bg-gradient-to-r from-primary-50 to-teal-50 rounded-lg border border-primary-200 relative">
                <button
                  onClick={() => setNudgeDismissed(true)}
                  className="absolute top-2 right-2 text-primary-400 hover:text-primary-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <p className="text-[12px] font-semibold text-primary-900 leading-tight pr-4">
                  Complete your provider profile
                </p>
                <p className="text-[11px] text-primary-700/80 leading-snug mt-0.5">
                  Profiles with photos and descriptions get more inquiries.
                </p>
                <Link
                  href="/provider/profile"
                  className="flex items-center gap-1 mt-2 text-[12px] font-medium text-primary-700 hover:text-primary-900 transition-colors"
                >
                  Complete profile
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

            {/* View public profile */}
            {providerProfile.slug && (
              <a
                href={`/provider/${providerProfile.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-1 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                View public profile
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Mobile: horizontal tabs */}
        <div className="lg:hidden px-8 pt-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Provider Hub</h1>
          <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide">
            {PROVIDER_NAV_ITEMS.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150",
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
