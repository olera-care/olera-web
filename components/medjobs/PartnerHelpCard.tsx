"use client";

import { useState } from "react";
import Image from "next/image";
import { CALENDLY_URL } from "@/lib/student-outreach/templates";

/**
 * PartnerHelpCard — the "For advisors, faculty & student orgs" actions on the
 * converged /medjobs/families page (#help). Three even cards, one CTA each:
 * download the flyer, copy the application link, and book time with Dr. DuBose
 * (whose headshot anchors that card). The student agreement link lives in the
 * section's left column.
 */

const APPLY_URL = "https://olera.care/medjobs/apply";
// Real, generated asset (campus-agnostic "generic" config). Per-campus versions
// flow through the partner portal + outreach emails, which know the slug.
const FLYER_PDF_URL = "/api/medjobs/program-pdf?university=generic&audience=student";

export default function PartnerHelpCard() {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(APPLY_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const card =
    "flex h-full flex-col items-start rounded-2xl border border-gray-200 bg-white p-5";
  const chip =
    "w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-3";
  const cta =
    "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="grid items-stretch gap-4 sm:grid-cols-3">
      {/* Share the flyer */}
      <div className={card}>
        <span className={chip}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </span>
        <p className="text-[15px] font-semibold text-gray-900">Share the flyer</p>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          Print it, or post it to a group chat, story, or newsletter.
        </p>
        <a
          href={FLYER_PDF_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${cta} mt-auto pt-4 border border-gray-200 text-gray-700 hover:border-gray-300`}
        >
          Download flyer →
        </a>
      </div>

      {/* Application link */}
      <div className={card}>
        <span className={chip}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        </span>
        <p className="text-[15px] font-semibold text-gray-900">Application link</p>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          Drop it in an email, newsletter, or group chat.
        </p>
        <button
          type="button"
          onClick={copyLink}
          className={`${cta} mt-auto pt-4 border border-gray-200 text-gray-700 hover:border-gray-300`}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      {/* Book a call with Dr. DuBose */}
      <div className={card}>
        <Image
          src="/images/for-providers/team/logan.jpg"
          alt="Dr. Logan DuBose"
          width={40}
          height={40}
          className="mb-3 h-10 w-10 rounded-full object-cover shadow-sm"
        />
        <p className="text-[15px] font-semibold text-gray-900">Book a Call</p>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          Have Dr. Logan DuBose speak to your students, or set up an ongoing relationship.
        </p>
        <a
          href={CALENDLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${cta} mt-auto pt-4 bg-primary-600 text-white hover:bg-primary-700`}
        >
          Book a time →
        </a>
      </div>
    </div>
  );
}
