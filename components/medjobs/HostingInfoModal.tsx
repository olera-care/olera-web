"use client";

import Link from "next/link";

/**
 * HostingInfoModal — "Learn more about hosting" (Phase B). Informational only;
 * the actual signing happens later (Loop 3). Mirrors the PilotTermsModal shell.
 */
export default function HostingInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-gray-100 px-6 py-5">
          <h3 className="font-serif text-xl text-gray-900">Hosting a student caregiver</h3>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5 text-sm text-gray-700">
          <Bullet>You&apos;re the employer. You set the schedule, pay, and supervision.</Bullet>
          <Bullet>
            Flexible and predictable. Students keep set hours for the term, for
            regular recurring shifts or PRN.
          </Bullet>
          <Bullet>
            Interview students with no commitment. You only sign to host when you
            both agree it&apos;s a fit.
          </Bullet>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs">
            <Link
              href="/medjobs/hosting-agreement.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-700 hover:underline"
            >
              Sample Hosting Agreement →
            </Link>
            <Link href="/medjobs/hosting-faq" className="font-medium text-primary-700 hover:underline">
              Hosting FAQ →
            </Link>
          </div>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Interview students
          </button>
        </footer>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2">
      <span className="mt-0.5 text-primary-600" aria-hidden>
        •
      </span>
      <span className="leading-relaxed">{children}</span>
    </p>
  );
}
