"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
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
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Olera Student Placement — Terms"
      size="lg"
      footer={
        <div className="space-y-3">
          <button
            type="button"
            disabled={saving}
            onClick={agree}
            className="w-full rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
          >
            {saving ? "Recording…" : "Agree to Terms & Conditions"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Questions?{" "}
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-700 hover:underline">
              Book a call with Dr. DuBose
            </a>
          </p>
          <p className="text-center text-xs">
            <a href={EMPLOYER_AGREEMENT_URL} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:underline">
              Review full terms
            </a>
          </p>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        {/* TL;DR */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">What you&apos;re agreeing to</p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
            <li>• Free to browse, interview, and connect.</li>
            <li>• <b>$200 one-time per student — only if you hire them.</b></li>
            <li>• Invoiced after the hire; <b>fully refunded</b> if they work under 15 hours.</li>
            <li>• You are the employer; Olera matches &amp; verifies hours.</li>
          </ul>
        </div>

        <Section title="The 15-hour guarantee">
          About 15 worked hours covers your onboarding cost plus a fair placement fee. If the
          student works fewer, we refund the $200 in full.
        </Section>
        <Section title="What the student commits to">
          Background checks and no no-call/no-shows (or they&apos;re removed from Olera). In
          return: verified hours, credentialing support, and a recommendation letter.
        </Section>
        <Section title="What Olera does &amp; doesn't do">
          We match, vet, and verify students and confirm hours. We do <b>not</b> employ or pay
          the student, run payroll, or act as a staffing agency.
        </Section>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
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
