"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfileCompleteness } from "@/components/portal/profile/completeness";
import Button from "@/components/ui/Button";
import type { ReactNode } from "react";

const ALL_NAV_ITEMS = [
  {
    label: "Profile",
    href: "/portal/profile",
    iconSrc: "https://cdn.lordicon.com/dklbhvrt.json",
  },
  {
    label: "My Connections",
    href: "/portal/connections",
    iconSrc: "https://cdn.lordicon.com/uvextprq.json",
  },
  {
    label: "Matches",
    href: "/portal/matches",
    iconSrc: "https://cdn.lordicon.com/jkzgajyr.json",
    familyOnly: true,
  },
  {
    label: "Account Settings",
    href: "/portal/settings",
    iconSrc: "https://cdn.lordicon.com/lecprnjb.json",
  },
];

export default function PortalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, account, activeProfile, isLoading, fetchError, refreshAccountData } = useAuth();
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const completeness = useProfileCompleteness(activeProfile ?? null, user?.email);

  // Brief spinner while getSession() runs (reads local storage — very fast)
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
          <p className="text-lg text-gray-600">
            You need to be signed in to access the portal.
          </p>
        </div>
      </div>
    );
  }

  // Signed in but account data unavailable
  if (!account) {
    // Fetch failed or timed out — show compact error with retry
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
    // Still loading — brief spinner
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Filter nav items based on profile type
  const navItems = ALL_NAV_ITEMS.filter(
    (item) => !("familyOnly" in item && item.familyOnly) || activeProfile?.type === "family"
  );

  // Account exists but no profile yet — direct to onboarding
  if (!activeProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Complete your profile
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Set up your profile to access the portal and start connecting.
          </p>
          <Link href="/onboarding">
            <Button size="lg">Complete setup</Button>
          </Link>
        </div>
      </div>
    );
  }

  const showNudge =
    activeProfile?.type === "family" &&
    completeness.percentage < 60 &&
    !nudgeDismissed;

  return (
    <div className="flex bg-white min-h-[calc(100vh-64px)]">
      {/* ── Desktop sidebar — full-height, edge-to-edge, Airbnb-style ── */}
      <aside className="hidden lg:block w-[270px] shrink-0">
        <div className="sticky top-16 h-[calc(100vh-64px)] border-r border-gray-200 flex flex-col px-8 pt-6 pb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-5 px-1">Profile</h1>
          <nav className="space-y-1">
            {navItems.map((item) => {
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

          {/* Bottom section — pushed down */}
          <div className="mt-auto pt-4 border-t border-gray-100">
            {/* Profile completeness nudge */}
            {showNudge && (
              <div className="mb-3 px-3 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 relative">
                <button
                  onClick={() => setNudgeDismissed(true)}
                  className="absolute top-2 right-2 text-amber-400 hover:text-amber-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="relative w-8 h-8 shrink-0">
                    <svg width="32" height="32" viewBox="0 0 32 32">
                      <circle cx="16" cy="16" r="13" fill="none" stroke="#fcd34d" strokeWidth="2.5" />
                      <circle
                        cx="16"
                        cy="16"
                        r="13"
                        fill="none"
                        stroke="#d97706"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${(completeness.percentage / 100) * 81.68} 81.68`}
                        transform="rotate(-90 16 16)"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-amber-700">
                      {completeness.percentage}%
                    </span>
                  </div>
                  <div className="pr-4">
                    <p className="text-[12px] font-semibold text-amber-900 leading-tight">
                      Your profile is incomplete
                    </p>
                    <p className="text-[11px] text-amber-700/80 leading-snug mt-0.5">
                      Complete profiles get more responses.
                    </p>
                  </div>
                </div>
                <Link
                  href="/portal/profile"
                  className="flex items-center gap-1 mt-2 text-[12px] font-medium text-amber-700 hover:text-amber-900 transition-colors"
                >
                  Complete profile
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
            <Link
              href="/browse"
              className="flex items-center gap-1.5 px-1 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Browse more providers
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Content area ── */}
      <div className="flex-1 min-w-0">
        {/* Mobile: header + horizontal tabs */}
        <div className="lg:hidden px-4 sm:px-6 pt-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
          <div className="mb-6 flex gap-2 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
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
