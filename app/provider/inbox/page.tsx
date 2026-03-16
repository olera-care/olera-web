"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Provider inbox redirects to the unified inbox with role=provider filter.
 * This follows the Airbnb pattern of one unified inbox with role filters.
 */
export default function ProviderInboxPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any existing params (like ?id=xxx) and add role=provider
    const params = new URLSearchParams(searchParams.toString());
    params.set("role", "provider");
    router.replace(`/portal/inbox?${params.toString()}`);
  }, [router, searchParams]);

  // Show loading spinner while redirecting
  return (
    <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
