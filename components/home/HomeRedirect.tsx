"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Redirects logged-in providers and caregivers away from the family homepage
 * to their respective dashboards.
 */
export default function HomeRedirect() {
  const router = useRouter();
  const { activeProfile, isLoading } = useAuth();

  useEffect(() => {
    console.log("[nav-debug] HomeRedirect effect", {
      isLoading,
      profileType: activeProfile?.type ?? "none",
      path: typeof window !== "undefined" ? window.location.pathname : "ssr",
    });

    if (isLoading) return;

    // Provider → redirect to provider dashboard
    if (activeProfile?.type === "organization") {
      console.warn("[nav-debug] HomeRedirect REPLACING to /provider", {
        historyLength: window.history.length,
      });
      router.replace("/provider");
      return;
    }

    // MedJobs caregiver (student or legacy caregiver type) → redirect to MedJobs portal
    if (activeProfile?.type === "student" || activeProfile?.type === "caregiver") {
      console.warn("[nav-debug] HomeRedirect REPLACING to /portal/medjobs", {
        historyLength: window.history.length,
      });
      router.replace("/portal/medjobs");
      return;
    }

    // Family or logged out → stay on homepage
  }, [activeProfile, isLoading, router]);

  // This component renders nothing - it just handles redirects
  return null;
}
