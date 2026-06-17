"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase/client";

/**
 * SampleFamilyCTA — the one-next-step CTA on a read-only sample (demo) host
 * page. Staged by where the student is in the funnel, so they only ever see
 * the single next action:
 *   not signed in       → Check your eligibility
 *   eligible, not live  → Complete your application
 *   live                → Find a host
 */
export default function SampleFamilyCTA() {
  const { profiles } = useAuth();
  const studentProfile = profiles?.find((p) => p.type === "student");
  const [isLive, setIsLive] = useState<boolean | null>(null);

  useEffect(() => {
    if (!studentProfile?.id) return;
    (async () => {
      try {
        const sb = createClient();
        const { data } = await sb
          .from("business_profiles")
          .select("is_active")
          .eq("id", studentProfile.id)
          .single();
        setIsLive(!!data?.is_active);
      } catch {
        setIsLive(null);
      }
    })();
  }, [studentProfile?.id]);

  const cls =
    "mt-4 block w-full rounded-xl bg-primary-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-700";

  if (!studentProfile?.id) {
    return (
      <Link href="/medjobs/families?screener=1" className={cls}>
        Check your eligibility →
      </Link>
    );
  }
  if (isLive === false) {
    return (
      <Link href="/portal/medjobs" className={cls}>
        Complete your application →
      </Link>
    );
  }
  return (
    <Link href="/medjobs/families" className={cls}>
      Find a host →
    </Link>
  );
}
