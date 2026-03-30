"use client";

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
  variant?: "sidebar" | "sticky";
}) {
  const { user, activeProfile, profiles, openAuth } = useAuth();
  const isProvider = activeProfile?.type === "organization" || activeProfile?.type === "caregiver";
  const hasProviderProfile = profiles.some(
    (p) => p.type === "organization" || p.type === "caregiver"
  );
  const firstName = studentName.split(" ")[0];

  const providerName = activeProfile?.display_name || "";
  const subject = isProvider
    ? `Interview — ${providerName} × ${studentName}`
    : `Interested in hiring — ${studentName}`;
  const body = isProvider
    ? `Hi ${firstName},\n\nWe'd like to schedule a brief interview to learn more about your availability and experience. Are you free this week for a 15-minute call?\n\nBest,\n${providerName}`
    : `Hi ${firstName},\n\nI came across your profile on Olera MedJobs and I'm interested in learning more about your availability. Would you be free for a quick call this week?\n\nBest`;

  const scheduleHref = studentEmail
    ? `mailto:${studentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  const triggerAuth = () =>
    openAuth({
      defaultMode: "sign-in",
      deferred: {
        action: "inquiry",
        returnUrl: `/medjobs/candidates/${studentSlug}`,
      },
    });

  // ── Sticky mobile bar ──
  if (variant === "sticky") {
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

  // ── Sidebar variant (desktop) ──

  // Not signed in — warm gate
  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <p className="text-sm font-semibold text-gray-900">
          Want to connect with {firstName}?
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Create a free account to see contact info and schedule an interview.
        </p>
        <button
          onClick={triggerAuth}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          <CalendarIcon />
          Schedule Interview
        </button>
        <p className="mt-1.5 text-center text-xs text-gray-400">
          Free. Takes 30 seconds.
        </p>
      </div>
    );
  }

  // Signed in (provider or non-provider)
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
      {/* Contact info */}
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
      {(isProvider || hasProviderProfile) && (
        <Link
          href={`/provider/medjobs/candidates/${studentSlug}`}
          className="block w-full text-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors"
        >
          Full Provider View
        </Link>
      )}

      {/* Create provider prompt */}
      {user && !hasProviderProfile && (
        <p className="text-center text-xs text-gray-400">
          <Link href="/for-providers/create" className="text-primary-500 hover:text-primary-600">
            Create a provider profile
          </Link>{" "}
          to appear in our directory.
        </p>
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
