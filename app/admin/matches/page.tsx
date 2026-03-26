"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /admin/matches now redirects to Activity Center (Families tab).
 * The Matches funnel metrics have been replaced by per-person engagement tracking.
 */
export default function AdminMatchesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/activity?actor=families");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-gray-400">Redirecting to Activity Center...</p>
    </div>
  );
}
