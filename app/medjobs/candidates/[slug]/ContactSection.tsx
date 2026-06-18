"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import PostJobComingSoonModal from "@/components/medjobs/PostJobComingSoonModal";
import { useAuth } from "@/components/auth/AuthProvider";
import type { StudentMetadata } from "@/lib/types";

const DUBOSE_AVATAR = "/images/for-providers/team/logan.jpg";

interface CandidateData {
  id: string;
  slug: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  imageUrl: string | null;
  city: string | null;
  state: string | null;
  metadata: StudentMetadata;
}

/**
 * ContactSection — the provider-facing CTA on a candidate detail page.
 *
 * The action is unified to "Post a Job" (coming soon) across every provider
 * state — anonymous, guest, not-eligible, eligible, sample, or real candidate —
 * until the real post-job flow ships (see PostJobComingSoonModal's HANDOFF).
 * The only other state is a student/caregiver previewing their own profile.
 */
export default function ContactSection({
  candidate,
  variant = "sidebar",
  isSample = false,
}: {
  candidate: CandidateData;
  variant?: "sidebar" | "sticky" | "inline";
  /** Sample profile — no live student behind it. */
  isSample?: boolean;
}) {
  const { profiles } = useAuth();
  const [showPostJob, setShowPostJob] = useState(false);

  const firstName = candidate.displayName.split(" ")[0];

  // Caregiver/student viewing their own profile.
  const isViewingOwnProfile = profiles.some(
    (p) => (p.type === "student" || p.type === "caregiver") && p.slug === candidate.slug,
  );

  const stickyWrap =
    "fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3";
  const stickyStyle = { paddingBottom: "max(12px, env(safe-area-inset-bottom, 12px))" } as const;
  const cardWrap = (inline: boolean, extra = "space-y-3") =>
    inline ? extra : `bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${extra}`;
  const duBose = (
    <Image
      src={DUBOSE_AVATAR}
      alt="Dr. Logan DuBose"
      width={40}
      height={40}
      className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm"
    />
  );

  // ── Own profile preview ──
  if (isViewingOwnProfile) {
    const editLink = (
      <Link
        href="/portal/medjobs"
        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium text-white transition-colors"
      >
        Edit Profile
      </Link>
    );
    if (variant === "sticky") {
      return (
        <div className={stickyWrap} style={stickyStyle}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">Provider preview</span>
            {editLink}
          </div>
        </div>
      );
    }
    return (
      <div className={cardWrap(variant === "inline", "space-y-4")}>
        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Provider preview</div>
        <div
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-200 rounded-xl text-sm font-semibold text-gray-400 cursor-not-allowed"
          aria-disabled="true"
        >
          <CalendarIcon />
          Invite to a video interview
        </div>
        <p className="text-xs text-gray-400 text-center">This is how providers see your profile</p>
      </div>
    );
  }

  // ── Everyone else (provider-facing) → Post a Job (coming soon) ──
  const postJobModal = showPostJob ? (
    <PostJobComingSoonModal onClose={() => setShowPostJob(false)} />
  ) : null;
  const cta = (
    <button
      type="button"
      onClick={() => setShowPostJob(true)}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
    >
      Post a Job →
    </button>
  );

  if (variant === "sticky") {
    return (
      <>
        <div className={stickyWrap} style={stickyStyle}>{cta}</div>
        {postJobModal}
      </>
    );
  }
  return (
    <>
      <div className={cardWrap(variant === "inline")}>
        <div className="flex items-start gap-3">
          {duBose}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Want to hire {isSample ? "a caregiver like this" : firstName}?
            </p>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              Post a job to start interviewing student caregivers.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tell us the shifts you need covered and we&apos;ll match you.
            </p>
          </div>
        </div>
        {cta}
      </div>
      {postJobModal}
    </>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
