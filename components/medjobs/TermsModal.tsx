"use client";

import { useState } from "react";
import { EMPLOYER_AGREEMENT_URL } from "@/lib/medjobs/eligibility";
import { CALENDLY_URL } from "@/lib/student-outreach/templates";

/**
 * TermsModal — the one real commitment in the MVP funnel.
 *
 * Shows a plain-English TL;DR of the student-placement terms ($200 per hire,
 * charged only at first shift, refundable under 15 hours, provider is the
 * employer), with a full-PDF link and a "Book a call with Dr. DuBose" escape
 * hatch beneath the Agree button. Agreeing records interview_terms_accepted_at —
 * the scheduling gate + CRM "Client" signal.
 */
export default function TermsModal({
  profileId,
  onClose,
  onAgreed,
}: {
  profileId?: string;
  onClose: () => void;
  onAgreed: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const agree = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/medjobs/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || "Could not record your agreement");
      }
      await onAgreed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record your agreement");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <h3 className="font-serif text-xl text-gray-900">Olera Student Placement — Terms</h3>

          {/* TL;DR */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">TL;DR — what you&apos;re agreeing to</p>
            <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
              <li>• Free to browse, interview, and connect — no upfront cost.</li>
              <li>• <b>$200 one-time, per student, only if you hire them.</b></li>
              <li>• Invoiced after the hire (we reconcile monthly; one invoice per student).</li>
              <li>• 100% refunded if that student works under 15 hours.</li>
              <li>• You are the employer — Olera matches &amp; verifies hours.</li>
            </ul>
          </div>

          <Section title="How & when you pay">
            You only owe a fee if you hire a student you met here. Each month we reconcile
            hires (students report who hired them) and invoice you once per hired student.
          </Section>
          <Section title="The 15-hour guarantee">
            At typical home-care rates, about 15 worked hours covers your onboarding cost plus
            a fair placement fee. If the student works fewer than 15 hours, you risked only
            onboarding time — so we refund the $200 in full.
          </Section>
          <Section title="What the student commits to">
            Consents to background checks and no no-call/no-shows (or they&apos;re removed from
            Olera). In return they get verified hours, credentialing support, and help turning
            your feedback into a recommendation letter they may ask you to sign.
          </Section>
          <Section title="What Olera does / does not do">
            We match you, vet and verify students, confirm hours, and guarantee the 15-hour
            refund. We do <b>not</b> employ or pay the student, run payroll or taxes, act as a
            staffing agency, or guarantee performance beyond the refund.
          </Section>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button
            type="button"
            disabled={saving}
            onClick={agree}
            className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
          >
            {saving ? "Recording…" : "Agree to Terms & Conditions"}
          </button>

          {/* Escape hatches: re-read the full terms, or talk to Dr. DuBose. */}
          <div className="flex items-center justify-center gap-4 text-sm">
            <a href={EMPLOYER_AGREEMENT_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-700 hover:underline">
              Review full terms
            </a>
            <span className="text-gray-300">·</span>
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-700 hover:underline">
              Book a call with Dr. DuBose
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{children}</p>
    </div>
  );
}
