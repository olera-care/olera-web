"use client";

import { useState } from "react";
import { CALENDLY_URL } from "@/lib/student-outreach/templates";

/**
 * PartnerHelpCard — the "For advisors, faculty & student orgs" actions on the
 * public /medjobs program page (#help). Non-auth, no portal: download/share the
 * flyer, copy the application link + ready-to-share text, read the sample
 * internship agreement, and book time with Dr. DuBose.
 */

const APPLY_URL = "https://olera.care/medjobs/apply";
const FLYER_URL = "/docs/flyer-sample.pdf";
const AGREEMENT_URL = "/docs/internship-agreement-sample.pdf";

const SHARE_TEXT =
  "Paid caregiving internship for pre-health students through Olera: real " +
  "patient-care hours, a credential, and references for med, PA, and nursing " +
  `school. Apply: ${APPLY_URL}`;

export default function PartnerHelpCard() {
  const [copied, setCopied] = useState<"link" | "text" | null>(null);

  const copy = async (value: string, which: "link" | "text") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const card =
    "flex flex-col items-start gap-2 rounded-2xl border border-gray-200 bg-white p-5";
  const btn =
    "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Share the flyer */}
      <div className={card}>
        <span className="text-2xl">📄</span>
        <p className="text-[15px] font-semibold text-gray-900">Share the flyer</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          A one-pager your students can act on.
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <a
            href={FLYER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-gray-900 text-white hover:bg-gray-800`}
          >
            Download
          </a>
          <button
            type="button"
            onClick={() => copy(SHARE_TEXT, "text")}
            className={`${btn} border border-gray-200 text-gray-700 hover:border-gray-300`}
          >
            {copied === "text" ? "Copied!" : "Copy share text"}
          </button>
        </div>
      </div>

      {/* Copy application link */}
      <div className={card}>
        <span className="text-2xl">🔗</span>
        <p className="text-[15px] font-semibold text-gray-900">Application link</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Drop it in an email, newsletter, or group chat.
        </p>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => copy(APPLY_URL, "link")}
            className={`${btn} bg-gray-900 text-white hover:bg-gray-800`}
          >
            {copied === "link" ? "Copied!" : "Copy link"}
          </button>
          <a
            href={AGREEMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} border border-gray-200 text-gray-700 hover:border-gray-300`}
          >
            Sample agreement ↗
          </a>
        </div>
      </div>

      {/* Talk with Dr. DuBose */}
      <div className={card}>
        <span className="text-2xl">☕</span>
        <p className="text-[15px] font-semibold text-gray-900">Talk with Dr. DuBose</p>
        <p className="text-sm text-gray-500 leading-relaxed">
          Have him speak to your students, or set up an ongoing relationship.
        </p>
        <div className="mt-auto pt-2">
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} bg-primary-600 text-white hover:bg-primary-700`}
          >
            Book a time with Dr. DuBose →
          </a>
        </div>
      </div>
    </div>
  );
}
