"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ContactSection({
  studentName,
  studentEmail,
  studentPhone,
  studentSlug,
}: {
  studentName: string;
  studentEmail: string | null;
  studentPhone: string | null;
  studentSlug: string;
}) {
  const { activeProfile } = useAuth();
  const isProvider = activeProfile?.type === "organization" || activeProfile?.type === "caregiver";

  if (isProvider) {
    return (
      <div className="mt-6 space-y-4">
        {/* Contact info */}
        <div className="p-4 bg-primary-50 rounded-xl">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Contact Information</h3>
          <div className="space-y-2">
            {studentEmail && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <a href={`mailto:${studentEmail}`} className="text-primary-600 hover:text-primary-700">{studentEmail}</a>
              </div>
            )}
            {studentPhone && (
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <a href={`tel:${studentPhone}`} className="text-primary-600 hover:text-primary-700">{studentPhone}</a>
              </div>
            )}
          </div>
        </div>

        {/* Schedule Interview */}
        {studentEmail && (
          <a
            href={`mailto:${studentEmail}?subject=${encodeURIComponent(`Interview — ${activeProfile.display_name} × ${studentName}`)}&body=${encodeURIComponent(`Hi ${studentName.split(" ")[0]},\n\nWe'd like to schedule a brief interview to learn more about your availability and experience. Are you free this week for a 15-minute call?\n\nBest,\n${activeProfile.display_name}`)}`}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            Schedule Interview
          </a>
        )}

        {/* Link to full provider view */}
        <Link
          href={`/provider/medjobs/candidates/${studentSlug}`}
          className="block w-full text-center px-6 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-sm font-semibold transition-colors"
        >
          View Full Provider Profile
        </Link>
      </div>
    );
  }

  // Not signed in as provider — show gate
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
      <p className="text-sm text-gray-500">
        <span className="font-medium text-gray-700">Want to connect with {studentName}?</span>
        {" "}Sign in as a provider to view contact information and reach out directly.
      </p>
      <Link
        href="/medjobs/providers"
        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-semibold text-white transition-colors"
      >
        Learn More
      </Link>
    </div>
  );
}
