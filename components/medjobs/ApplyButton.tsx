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
  const { profiles } = useAuth();
  const isStudent = !!profiles?.find((p) => p.type === "student");
  return (
    <button
      type="button"
      onClick={() => router.push(isStudent ? "/portal/medjobs" : "/medjobs/families?screener=1")}
      className={className}
    >
      {children}
    </button>
  );
}
