"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import Button from "@/components/ui/Button";
import type { ReactNode } from "react";

export default function ProviderLayout({ children }: { children: ReactNode }) {
  const { user, account, isLoading, fetchError, refreshAccountData, openAuth } =
    useAuth();
  const providerProfile = useProviderProfile();

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
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Set up your provider profile
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            List your organization or join as a caregiver to start connecting
            with families.
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

  return <>{children}</>;
}
