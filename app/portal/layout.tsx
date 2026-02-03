"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import PortalSidebar from "@/components/portal/PortalSidebar";
import type { ReactNode } from "react";

export default function PortalLayout({ children }: { children: ReactNode }) {
  const { user, account, activeProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user || !account) {
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

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Sidebar - hidden on mobile, shown on md+ */}
      <PortalSidebar profile={activeProfile} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
