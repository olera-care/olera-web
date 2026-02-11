"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Button from "@/components/ui/Button";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  {
    label: "Profile",
    href: "/portal/profile",
    iconBg: "bg-primary-100",
    iconColor: "text-primary-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: "My Connections",
    href: "/portal/connections",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    label: "Account Settings",
    href: "/portal/settings",
    iconBg: "bg-gray-200",
    iconColor: "text-gray-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
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
        {NAV_ITEMS.map((item) => {
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
        <div className="hidden lg:block w-[240px] shrink-0">
          <div className="sticky top-[88px] bg-white rounded-2xl border border-gray-200 p-5">
            <h1 className="text-xl font-bold text-gray-900 mb-4 px-1">Profile</h1>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-gray-100 font-semibold text-gray-900"
                        : "text-gray-600 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}>
                      {item.icon}
                    </div>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
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
