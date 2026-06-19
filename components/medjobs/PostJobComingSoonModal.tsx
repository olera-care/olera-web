"use client";

/**
 * PostJobComingSoonModal — placeholder for the not-yet-built "Post a Job" flow.
 *
 * HANDOFF (Post a Job): this modal is a stub. The real build replaces it with
 * the post-job form and, on submit, writes a `MedJobsJobPost` (type already in
 * lib/types.ts — note there's no API/table for it yet, so that's part of the
 * work). Call sites open it via their own `showPostJob` state:
 *   - components/medjobs/HireCaregiversBoard.tsx  (welcome banner CTA)
 *   - app/medjobs/candidates/[slug]/ContactSection.tsx  (candidate detail CTA)
 * Swap this component for the form and keep the same open/close wiring.
 */
export default function PostJobComingSoonModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="font-serif text-xl text-gray-900">Post a Job</h3>
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">
          Coming soon. You&apos;ll be able to post a job, then interview and hire a
          caregiver right here.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
