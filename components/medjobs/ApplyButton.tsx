"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Apply CTA used inside the static marketing sections of the converged
 * /medjobs/families page. Anon → opens the eligibility screener via
 * ?screener=1 (the board reacts to the param). Signed-in student → their
 * application. Lives as a small client leaf inside the server sections.
 */
export default function ApplyButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { profiles, activeProfile } = useAuth();
  const isStudent = !!profiles?.find((p) => p.type === "student");
  const isProvider = activeProfile?.type === "organization" || activeProfile?.type === "caregiver";
  const target = isStudent
    ? "/portal/medjobs"
    : isProvider
      ? "/medjobs/providers"
      : "/medjobs/families?screener=1";
  return (
    <button
      type="button"
      onClick={() => router.push(target)}
      className={className}
    >
      {children}
    </button>
  );
}
