"use client";

import { useState } from "react";
import Link from "next/link";
import { INTERNSHIP_FEE_USD, GUARANTEE_LINE } from "@/lib/medjobs/placements";

/**
 * InternshipAgreementModal — Phase D. The provider's offer-to-host step: the
 * plain-language Olera Internship Agreement + the fee + guarantee, ending in
 * "Send offer" (POST /api/medjobs/placements). Payment is STUBBED for now
 * (Stripe deferred); sending the offer notifies the student to accept.
 */
export default function InternshipAgreementModal({
  studentProfileId,
  studentName,
  interviewId,
  onClose,
  onOffered,
}: {
  studentProfileId: string;
  studentName?: string;
  interviewId?: string;
  onClose: () => void;
  onOffered: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = studentName ? studentName.split(" ")[0] : "this student";

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/medjobs/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_profile_id: studentProfileId, interview_id: interviewId }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || "Could not send the offer");
      }
      onOffered();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send the offer");
    } finally {
      setSubmitting(false);
    }
  };

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
          <h3 className="font-serif text-xl text-gray-900">Offer to host {first}</h3>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5 text-sm text-gray-700">
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <p className="text-gray-600">The Olera Student Caregiver Agreement, in plain language:</p>
          <Bullet>You&apos;re the employer: schedule, pay, supervision, and your own background check.</Bullet>
          <Bullet>
            The student logs their own hours and drives their recommendation-letter request; you
            confirm hours and give a reference if they meet your standards.
          </Bullet>
          <Bullet>Run the program in good faith and keep the agreed availability, barring emergencies.</Bullet>
          <div className="rounded-xl bg-gray-50 px-4 py-3">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Program fee: ${INTERNSHIP_FEE_USD}</span> each, one time.
            </p>
            <p className="mt-1 text-sm text-gray-600">{GUARANTEE_LINE}</p>
            <p className="mt-1 text-xs text-gray-400">
              {first} earns verified hours and a recommendation through Olera.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <Link
              href="/medjobs/hosting-agreement.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-700 hover:underline"
            >
              Read the agreement →
            </Link>
            <Link href="/medjobs/hosting-faq" className="font-medium text-primary-700 hover:underline">
              FAQ →
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            Payment isn&apos;t collected in this preview. Sending the offer notifies {first} to accept.
          </p>
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send offer"}
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
