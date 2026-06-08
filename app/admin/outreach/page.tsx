"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirect /admin/outreach → /admin/connections?direction=outbound
 *
 * Outreach functionality has been merged into the Connections page.
 * This redirect preserves any existing bookmarks.
 */
export default function OutreachRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/connections?direction=outbound");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-sm text-gray-500">Redirecting to Connections...</p>
    </div>
  );
}
