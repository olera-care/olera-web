"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Provider Inbox Redirect
 * Redirects to the unified inbox at /portal/inbox with role=provider
 * This ensures old links and bookmarks continue to work.
 */
function ProviderInboxRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any existing query params (like ?id=xxx)
    const params = new URLSearchParams(searchParams.toString());
    params.set("role", "provider");
    router.replace(`/portal/inbox?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

import { Suspense } from "react";

export default function ProviderInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProviderInboxRedirect />
    </Suspense>
  );
}
