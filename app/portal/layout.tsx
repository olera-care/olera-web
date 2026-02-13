"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Mobile: header + horizontal tabs */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6 lg:hidden">Profile</h1>
      <div className="lg:hidden mb-6 flex gap-2 overflow-x-auto scrollbar-hide">
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

      <div className="flex gap-8 lg:gap-10">
        {/* Desktop nav card — sticky white card */}
        <div className="hidden lg:block w-[270px] shrink-0">
          <div className="sticky top-[88px] bg-white rounded-2xl border border-gray-200 p-5 h-[calc(100vh-112px)] flex flex-col">
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

            {/* Bottom link — pushed down */}
            <div className="mt-auto pt-4 border-t border-gray-100">
              <Link
                href={activeProfile?.type === "organization" || activeProfile?.type === "caregiver" ? "/portal/discover/families" : "/browse"}
                className="flex items-center gap-2 px-3 py-2.5 text-base font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                {activeProfile?.type === "organization" || activeProfile?.type === "caregiver"
                  ? "Browse families seeking care"
                  : "Browse more providers"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
