"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import PortalSidebar from "@/components/portal/PortalSidebar";
import Button from "@/components/ui/Button";
import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, account, activeProfile, isLoading, refreshAccountData } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  // Not signed in at all
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

  // Signed in but account data couldn't be loaded (DB timeout, race condition)
  if (!account) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Loading your account
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            We&apos;re having trouble loading your account data. This usually
            resolves on its own.
          </p>
          <Button size="lg" onClick={() => refreshAccountData()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

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
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Sidebar - hidden on mobile, shown on md+ */}
      <PortalSidebar profile={activeProfile} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile role indicator — hidden on desktop where sidebar shows it */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2">
          <span
            className={[
              "inline-block w-2 h-2 rounded-full",
              activeProfile.type === "organization"
                ? "bg-primary-500"
                : activeProfile.type === "caregiver"
                ? "bg-secondary-500"
                : "bg-warm-500",
            ].join(" ")}
          />
          <span className="text-sm font-medium text-gray-600">
            {activeProfile.type === "organization"
              ? "Organization"
              : activeProfile.type === "caregiver"
              ? "Private Caregiver"
              : "Family"}
          </span>
          <span className="text-sm text-gray-400 mx-1">&middot;</span>
          <span className="text-sm font-medium text-gray-900 truncate">
            {activeProfile.display_name}
          </span>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
