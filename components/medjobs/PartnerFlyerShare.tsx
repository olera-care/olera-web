"use client";

/**
 * PartnerFlyerShare — the portal's central action (Chunk 3.3, S17).
 * Copy-ready email + social text and per-channel share, so a partner can pass
 * the program to students in one tap. Student-facing, R1-safe copy
 * ("Olera's … for {University} students", never "{University}'s program").
 */

import { useState } from "react";

function CopyButton({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard may be blocked; ignore */
        }
      }}
      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function PartnerFlyerShare({
  university,
  applyUrl,
  programUrl,
}: {
  university: string | null;
  applyUrl: string;
  programUrl: string;
}) {
  const uni = university ?? "your campus";
  const emailTemplate = `Subject: Paid, mentored healthcare experience for ${uni} students

Hi everyone,

Sharing an opportunity that may be a great fit for pre-health students:
Olera's Pre-Health Caregiving Internship for ${uni} students. It's a paid,
mentored caregiving role with local seniors — real patient-facing hours,
mentorship, and recommendation letters toward med/PA/nursing school.

Apply in minutes: ${applyUrl}
Program info: ${programUrl}

(Run by Olera with Dr. Logan DuBose — not a university-run program.)`;

  const socialPost = `📣 Pre-health students: get PAID, mentored caregiving experience with local seniors — real hours + recommendation letters toward med/PA/nursing school. Olera's Pre-Health Caregiving Internship for ${uni} students. Apply: ${applyUrl}`;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(socialPost)}`;
  const mailto = `mailto:?subject=${encodeURIComponent(
    `Paid healthcare experience for ${uni} students`,
  )}&body=${encodeURIComponent(emailTemplate)}`;

  return (
    <section className="rounded-xl border border-primary-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900">Share the flyer 📄</h2>
      <p className="mt-1 text-sm text-gray-600">
        The single most helpful thing you can do — pass this to your students.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={programUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
        >
          View / download flyer ↗
        </a>
        <CopyButton label="Copy email template" text={emailTemplate} />
        <CopyButton label="Copy social post" text={socialPost} />
        <CopyButton label="Copy apply link" text={applyUrl} />
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Share to</p>
        <div className="mt-1.5 flex flex-wrap gap-2 text-xs">
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">WhatsApp ↗</a>
          <a href={mailto} className="rounded-md border border-gray-200 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">Email list ↗</a>
          <CopyButton label="Instagram" text={socialPost} />
          <CopyButton label="GroupMe" text={socialPost} />
          <CopyButton label="Discord" text={socialPost} />
          <CopyButton label="Slack" text={socialPost} />
        </div>
        <p className="mt-2 text-[11px] text-gray-400">
          Every link here is unique to you — students who apply through it are counted as yours.
        </p>
      </div>
    </section>
  );
}
