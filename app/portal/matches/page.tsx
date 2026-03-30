"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Portal Matches Redirect
 * Redirects to /portal/profile as the matches functionality has been
 * consolidated into the profile page. This ensures old links and bookmarks
 * continue to work.
 */
function MatchesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Preserve any existing query params (like ?ref=email&eid=xxx)
    const params = new URLSearchParams(searchParams.toString());
    const queryString = params.toString();
    router.replace(`/portal/profile${queryString ? `?${queryString}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100dvh-64px)] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MatchesRedirect />
    </Suspense>
  );
}
