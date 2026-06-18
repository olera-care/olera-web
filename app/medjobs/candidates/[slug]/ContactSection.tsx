"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ScheduleInterviewModal, { ScheduleFormData } from "@/components/medjobs/ScheduleInterviewModal";
import QuickScheduleModal from "@/components/medjobs/QuickScheduleModal";
import EligibilityScreenerModal from "@/components/medjobs/EligibilityScreenerModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { isMedjobsEligible } from "@/lib/medjobs/eligibility";
import { CALENDLY_URL } from "@/lib/student-outreach/templates";
import type { StudentMetadata } from "@/lib/types";

const SCHEDULE_STORAGE_KEY = "medjobs_schedule_draft";
const SCHEDULED_CANDIDATES_KEY = "medjobs_scheduled_candidates";
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

export default function ContactSection({
  candidate,
  variant = "sidebar",
  isSample = false,
}: {
  candidate: CandidateData;
  variant?: "sidebar" | "sticky" | "inline";
  /** Sample profile — no live student to schedule. */
  isSample?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profiles, refreshAccountData } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [showQuickScheduleModal, setShowQuickScheduleModal] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [showScreener, setShowScreener] = useState(false);
  const [savedFormData, setSavedFormData] = useState<ScheduleFormData | undefined>();

  // Load scheduled state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCHEDULED_CANDIDATES_KEY);
      if (stored) {
        const scheduledIds = JSON.parse(stored) as string[];
        if (scheduledIds.includes(candidate.id)) setScheduled(true);
      }
    } catch {
      /* ignore */
    }
  }, [candidate.id]);

  // Only organization profiles are providers; eligibility = completed needs quiz.
  const hasProviderProfile = profiles.some((p) => p.type === "organization");
  const providerProfile = profiles.find((p) => p.type === "organization");
  const eligible = isMedjobsEligible(
    (providerProfile?.metadata ?? null) as Record<string, unknown> | null,
  );

  // Caregiver viewing their own profile.
  const isViewingOwnProfile = profiles.some(
    (p) => (p.type === "student" || p.type === "caregiver") && p.slug === candidate.slug,
  );

  // Auto-open the schedule modal after returning from onboarding (?schedule=pending).
  const hasHandledPending = useRef(false);
  useEffect(() => {
    if (hasHandledPending.current) return;
    const schedulePending = searchParams.get("schedule");
    if (schedulePending === "pending" && user && hasProviderProfile) {
      hasHandledPending.current = true;
      const params = new URLSearchParams(searchParams.toString());
      params.delete("schedule");
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
      try {
        const saved = sessionStorage.getItem(SCHEDULE_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ScheduleFormData & { candidateSlug: string };
          if (parsed.candidateSlug === candidate.slug) setSavedFormData(parsed);
          sessionStorage.removeItem(SCHEDULE_STORAGE_KEY);
        }
      } catch {
        /* ignore */
      }
      setShowModal(true);
    }
  }, [searchParams, user, hasProviderProfile, pathname, router, candidate.slug]);

  const firstName = candidate.displayName.split(" ")[0];

  const handleScheduleClick = useCallback(() => setShowModal(true), []);
  const handleModalClose = useCallback(() => {
    setShowModal(false);
    setSavedFormData(undefined);
  }, []);

  const persistScheduled = useCallback(() => {
    try {
      const stored = localStorage.getItem(SCHEDULED_CANDIDATES_KEY);
      const ids = stored ? (JSON.parse(stored) as string[]) : [];
      if (!ids.includes(candidate.id)) {
        ids.push(candidate.id);
        localStorage.setItem(SCHEDULED_CANDIDATES_KEY, JSON.stringify(ids));
      }
    } catch {
      /* ignore */
    }
  }, [candidate.id]);

  const handleScheduled = useCallback(() => {
    setShowModal(false);
    setScheduled(true);
    setSavedFormData(undefined);
    sessionStorage.removeItem(SCHEDULE_STORAGE_KEY);
    persistScheduled();
  }, [persistScheduled]);

  const handleQuickScheduled = useCallback(() => {
    setScheduled(true);
    persistScheduled();
  }, [persistScheduled]);

  const fireInterest = () => {
    try {
      fetch("/api/medjobs/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "sample_profile" }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  };

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

  const screenerModal = showScreener ? (
    <EligibilityScreenerModal
      providerProfileId={providerProfile?.id}
      orgName={providerProfile?.display_name ?? null}
      onClose={() => setShowScreener(false)}
      onComplete={async () => {
        setShowScreener(false);
        await refreshAccountData();
        // After the quiz, real candidates → open the invite; demos stay on the
        // "let's talk recruitment" state (no live student to schedule).
        if (!isSample) setShowModal(true);
      }}
    />
  ) : null;

  // ── Not eligible (anon, or signed-in provider w/o the needs quiz) → push the quiz ──
  if (!eligible) {
    const cta = (
      <button
        onClick={() => setShowScreener(true)}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
      >
        Tell us your hiring needs →
      </button>
    );
    if (variant === "sticky") {
      return (
        <>
          <div className={stickyWrap} style={stickyStyle}>{cta}</div>
          {screenerModal}
        </>
      );
    }
    return (
      <>
        <div className={cardWrap(variant === "inline")}>
          <div className="flex items-start gap-3">
            {duBose}
            <div>
              <p className="text-sm font-semibold text-gray-900">Hiring student caregivers?</p>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                Tell us your hiring needs and we&apos;ll get you set up to interview
                {isSample ? " students like this" : ` ${firstName}`}.
              </p>
            </div>
          </div>
          {cta}
        </div>
        {screenerModal}
      </>
    );
  }

  // ── Eligible + sample → book a recruitment call ──
  if (isSample) {
    const cta = (
      <a
        href={CALENDLY_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={fireInterest}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
      >
        Grab a time with me →
      </a>
    );
    if (variant === "sticky") {
      return (
        <div className={stickyWrap} style={stickyStyle}>{cta}</div>
      );
    }
    return (
      <div className={cardWrap(variant === "inline")}>
        <div className="flex items-start gap-3">
          {duBose}
          <div>
            <p className="text-sm font-semibold text-gray-900">Let&apos;s talk recruitment</p>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              Real caregivers near you are being recruited now. Grab a time and we&apos;ll get you
              set up to interview them.
            </p>
          </div>
        </div>
        {cta}
      </div>
    );
  }

  // ── Eligible + real candidate → invite to interview ──
  const successBanner = scheduled ? (
    <div className="flex items-center gap-2 text-sm text-emerald-700">
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>Invite sent. Check your email.</span>
    </div>
  ) : null;
  const inviteBtn = (
    <button
      onClick={handleScheduleClick}
      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
    >
      <CalendarIcon />
      {scheduled ? "Invite another" : "Invite to a video interview"}
    </button>
  );
  const modals = (
    <>
      {showModal && (
        <ScheduleInterviewModal
          studentProfileId={candidate.id}
          otherName={candidate.displayName}
          onClose={handleModalClose}
          onScheduled={handleScheduled}
          initialValues={savedFormData}
        />
      )}
      <QuickScheduleModal
        isOpen={showQuickScheduleModal}
        onClose={() => setShowQuickScheduleModal(false)}
        onScheduled={handleQuickScheduled}
        candidate={candidate}
      />
    </>
  );

  if (variant === "sticky") {
    return (
      <>
        <div className={`${stickyWrap} space-y-2`} style={stickyStyle}>
          {successBanner}
          {inviteBtn}
        </div>
        {modals}
      </>
    );
  }
  return (
    <>
      <div className={cardWrap(variant === "inline", "space-y-4")}>
        {scheduled && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Invite sent. Check your email.</span>
          </div>
        )}
        {inviteBtn}
      </div>
      {modals}
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
