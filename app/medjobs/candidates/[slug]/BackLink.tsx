"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function BackLink({ studentSlug }: { studentSlug: string }) {
  const { profiles } = useAuth();

  // Check if user is viewing their own caregiver profile
  const isViewingOwnProfile = profiles.some(
    (p) => (p.type === "student" || p.type === "caregiver") && p.slug === studentSlug
  );

  // Hide breadcrumb for caregivers viewing their own profile
  if (isViewingOwnProfile) {
    return null;
  }

  return (
    <Link
      href="/medjobs/candidates"
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to Candidates
    </Link>
  );
}
