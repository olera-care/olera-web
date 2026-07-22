"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /admin/provider-outreach — redirects to the In Basket (the default
 * daily-use surface), matching the MedJobs pattern.
 */
export default function ProviderOutreachPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/provider-outreach/in-basket");
  }, [router]);
  return null;
}
