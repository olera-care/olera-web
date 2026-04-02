"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ContactSection({
  studentName,
  studentEmail,
  studentPhone,
  studentSlug,
  variant = "sidebar",
}: {
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  studentSlug: string;
  variant?: "sidebar" | "sticky" | "inline";
}) {
  const router = useRouter();
  const { user, activeProfile, profiles, openAuth } = useAuth();

  // Only organization profiles are providers (caregivers are job-seekers)
  const isProvider = activeProfile?.type === "organization";
  const hasProviderProfile = profiles.some((p) => p.type === "organization");

  // Identify non-provider user types
  const isCaregiver = activeProfile?.type === "student" || activeProfile?.type === "caregiver";
  const isFamily = activeProfile?.type === "family";

  // Check if caregiver is viewing their own profile
  const ownCaregiverProfile = profiles.find(
    (p) => (p.type === "student" || p.type === "caregiver") && p.slug === studentSlug
  );
  const isViewingOwnProfile = !!ownCaregiverProfile;

  // Redirect logged-in non-providers away from this page (edge case)
  // Exception: caregivers can view their own public profile
  useEffect(() => {
    if (!user || hasProviderProfile || isViewingOwnProfile) return;

    if (isFamily) {
      router.replace("/");
    } else if (isCaregiver) {
      router.replace("/portal/medjobs");
    }
  }, [user, hasProviderProfile, isFamily, isCaregiver, isViewingOwnProfile, router]);

  // Don't render anything while redirecting non-providers (except when viewing own profile)
  if (user && !hasProviderProfile && !isViewingOwnProfile) {
    return null;
  }

  const firstName = studentName.split(" ")[0];

  const providerName = activeProfile?.display_name || "";
  const subject = isProvider
    ? `Interview — ${providerName} × ${studentName}`
    : `Interested in hiring — ${studentName}`;
  const body = isProvider
    ? `Hi ${firstName},\n\nWe'd like to schedule a brief interview to learn more about your availability and experience. Are you free this week for a 15-minute call?\n\nBest,\n${providerName}`
    : `Hi ${firstName},\n\nI came across your profile on Olera MedJobs and I'm interested in learning more about your availability. Would you be free for a quick call this week?\n\nBest`;

  // Only show contact info to providers
  const scheduleHref = isProvider && studentEmail
    ? `mailto:${studentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  // Guest: auth modal with provider intent
  // Existing providers will be sent to the provider candidate page after sign-in
  // New signups go to provider onboarding step 2 (search) then back to this candidate
  const triggerAuth = () =>
    openAuth({
      intent: "provider",
      defaultMode: "sign-in",
      deferred: {
        action: "hire-candidate",
        returnUrl: `/provider/medjobs/candidates/${studentSlug}`,
      },
    });

  // ── Own profile preview mode ──
  // Show a disabled preview of what providers see
  if (isViewingOwnProfile) {
    if (variant === "sticky") {
      return (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-area-pb">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Provider preview
            </div>
            <Link
              href="/portal/medjobs"
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      );
    }

    // Sidebar/inline preview
    const isInline = variant === "inline";
    return (
      <div className={isInline ? "space-y-4" : "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"}>
        {/* Preview badge */}
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Provider Preview
        </div>

        {/* Disabled CTA button */}
        <div
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-200 rounded-xl text-sm font-semibold text-gray-400 cursor-not-allowed"
          aria-disabled="true"
        >
          <CalendarIcon />
          Schedule Interview
        </div>

        <p className="text-xs text-gray-400 text-center">
          This is how providers see your profile
        </p>

        {/* Edit profile link */}
        <Link
          href="/portal/medjobs"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-primary-200 text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
          </svg>
          Edit your profile
        </Link>
      </div>
    );
  }

  // ── Sticky mobile bar ──
  if (variant === "sticky") {
    // Guest: prompt to sign in as provider
    if (!user) {
      return (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-area-pb">
          <button
            onClick={triggerAuth}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <CalendarIcon />
            Schedule Interview
          </button>
        </div>
      );
    }

    // Provider: show contact options
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 safe-area-pb">
        {scheduleHref ? (
          <a
            href={scheduleHref}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <CalendarIcon />
            Schedule Interview
          </a>
        ) : (
          <Link
            href={`/provider/medjobs/candidates/${studentSlug}`}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            View Full Profile
          </Link>
        )}
      </div>
    );
  }

  // ── Sidebar/Inline variant (desktop) ──
  const isInline = variant === "inline";
  const wrapperClass = isInline
    ? "space-y-3"
    : "bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3";

  // Guest: warm gate prompting sign-in as provider
  if (!user) {
    return (
      <div className={isInline ? "" : "bg-white rounded-2xl shadow-sm border border-gray-100 p-5"}>
        <p className="text-sm font-semibold text-gray-900">
          Want to connect with {firstName}?
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Sign in as a provider to see contact info and schedule an interview.
        </p>
        <button
          onClick={triggerAuth}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          <CalendarIcon />
          Schedule Interview
        </button>
        {!isInline && (
          <p className="mt-2 text-center text-xs text-gray-400">
            New to Olera?{" "}
            <Link href="/provider/onboarding" className="text-primary-500 hover:text-primary-600 font-medium">
              Get started →
            </Link>
          </p>
        )}
      </div>
    );
  }

  // Provider: show contact info and schedule options
  return (
    <div className={wrapperClass}>
      {/* Contact info — only for providers */}
      {(studentEmail || studentPhone) && (
        <div className="space-y-1.5">
          {studentEmail && (
            <a href={`mailto:${studentEmail}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="truncate">{studentEmail}</span>
            </a>
          )}
          {studentPhone && (
            <a href={`tel:${studentPhone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              {studentPhone}
            </a>
          )}
        </div>
      )}

      {/* Primary CTA */}
      {scheduleHref ? (
        <a
          href={scheduleHref}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          <CalendarIcon />
          Schedule Interview
        </a>
      ) : (
        <Link
          href={`/provider/medjobs/candidates/${studentSlug}`}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          View Full Profile
        </Link>
      )}

      {/* Provider view link */}
      {hasProviderProfile && (
        <Link
          href={`/provider/medjobs/candidates/${studentSlug}`}
          className="block w-full text-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
        >
          Full Provider View
        </Link>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
