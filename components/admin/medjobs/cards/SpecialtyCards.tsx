"use client";

/**
 * MedJobs specialty card variants — same chrome as StakeholderCard
 * (white bg, gray-200 border, rounded-lg) but different content because
 * the underlying unit isn't a stakeholder row.
 *
 *   EmailSentCard    — Emails Sent menu view; click opens stakeholder drawer.
 *   SignupCard       — Signups menu view; passive (no CTA, no overflow).
 *   CandidateCard    — Candidates tab; click opens admin medjobs profile editor.
 *   OutboundCard     — Outbound menu view; replied-thread emerald accent.
 *
 * Extracted from app/admin/student-outreach/page.tsx as part of the
 * v9.0 MedJobs reorg (Phase 0). Behavior is unchanged from v8.10.X.
 */

import type { ReactNode } from "react";
import { STAKEHOLDER_TYPE_LABELS } from "@/lib/student-outreach/types";
import { formatRelative, humanChannel } from "@/lib/student-outreach/formatters";
import type {
  CandidateRow,
  EmailSentRow,
  OutboundRow,
  SignupRow,
} from "@/lib/student-outreach/tab-config";
import { MedjobsCard } from "./MedjobsCard";
import { Pill } from "./StakeholderCard";

/**
 * v8.10.39: row card for the Emails Sent menu view.
 *
 * Pill rules:
 *   - Replied   → emerald, "Replied" (any subsequent email_replied)
 *   - Failed    → amber, "Send failed"
 *   - else      → no pill (sent, awaiting reply or not applicable)
 */
export function EmailSentCard({
  row,
  onOpenDrawer,
}: {
  row: EmailSentRow;
  onOpenDrawer: () => void;
}) {
  const headline = row.recipient_name
    ? row.recipient_name
    : row.recipient_email ?? row.primary_contact_name ?? row.organization_name;
  const subtitleParts: string[] = [
    row.organization_name,
    row.campus_name,
    STAKEHOLDER_TYPE_LABELS[row.stakeholder_type],
  ];
  if (row.recipient_email && row.recipient_name) subtitleParts.push(row.recipient_email);
  const templateLabel = row.template
    ? row.template.replace(/_/g, " ")
    : null;
  const dayLabel = row.cadence_day !== null ? `Day ${row.cadence_day}` : null;
  const footnoteParts: string[] = [];
  if (templateLabel) footnoteParts.push(templateLabel);
  if (dayLabel) footnoteParts.push(dayLabel);
  footnoteParts.push(`Sent ${formatRelative(row.sent_at)}`);

  let pill: ReactNode = null;
  if (row.has_reply) {
    pill = (
      <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-900">
        Replied
      </span>
    );
  } else if (!row.success) {
    pill = (
      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
        Send failed
      </span>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDrawer}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDrawer();
        }
      }}
      title="Open the stakeholder drawer for full context."
      className="cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <div className="flex items-stretch justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{headline}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {subtitleParts.join(" · ")}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            {footnoteParts.join(" · ")}
          </p>
          {pill && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{pill}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * v8.10.39: row card for the Signups menu view. Passive informational
 * row — no CTA, no overflow. Lists raw student business_profiles with
 * the university they associated themselves with at signup time.
 */
export function SignupCard({ row }: { row: SignupRow }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-stretch justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{row.full_name}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {row.university ?? "(no university listed)"}
            {row.email && ` · ${row.email}`}
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Signed up {formatRelative(row.signed_up_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * v9.0 Phase 3: row card for the Candidates tab — LIVE provider-facing
 * student profiles (Candidates ⊂ Signups). Standard MedjobsCard chrome
 * with single-tone slate pills for readiness signals (no per-signal
 * color drift).
 *
 * v9.0 Phase 7 Commit B: card opens the CandidateDrawer (Step Board +
 * link to the full profile editor) when onOpen is provided. Without
 * onOpen it falls back to navigating to the profile editor (used by
 * surfaces that don't yet host a drawer mount).
 */
export function CandidateCard({
  row,
  onOpen,
  overflowMenu,
}: {
  row: CandidateRow;
  onOpen?: () => void;
  overflowMenu?: React.ReactNode;
}) {
  const subtitle = [
    row.university,
    [row.city, row.state].filter(Boolean).join(", ") || null,
    row.program_track,
  ]
    .filter(Boolean)
    .join(" · ");

  const pillBits: string[] = [];
  if (typeof row.profile_completeness === "number") {
    pillBits.push(`${row.profile_completeness}% complete`);
  }
  if (row.has_video) pillBits.push("Video");
  if (row.certifications_count > 0) {
    pillBits.push(`${row.certifications_count} cert${row.certifications_count === 1 ? "" : "s"}`);
  }
  const pill =
    pillBits.length > 0 ? (
      <>
        {pillBits.map((b) => (
          <Pill key={b}>{b}</Pill>
        ))}
      </>
    ) : null;

  // v9 final: no footnote. "Live since X" was tenure data that
  // didn't tell admin anything they need to act on — completeness +
  // video + cert pills already carry the operational signals.
  // Adding a footnote when there's nothing useful to say crowds the
  // card without informing.
  return (
    <MedjobsCard
      title={row.display_name}
      subtitle={subtitle}
      pill={pill}
      overflowMenu={overflowMenu}
      href={onOpen ? undefined : `/admin/medjobs/${row.id}`}
      onClick={onOpen}
      hoverTitle={onOpen ? "Open candidate drawer." : "Open candidate profile."}
      unread={row.unread === true}
    />
  );
}

/**
 * v8.10.40: row card for the Outbound menu view. Gmail-inbox feel —
 * threads with a pending reply float to the top (sorted server-side)
 * and get a strong "Reply" pill.
 */
export function OutboundCard({
  row,
  onOpenDrawer,
}: {
  row: OutboundRow;
  onOpenDrawer: () => void;
}) {
  const headline = row.primary_contact_name || row.organization_name;
  const subtitle = [
    row.organization_name !== headline ? row.organization_name : null,
    row.campus_name,
    STAKEHOLDER_TYPE_LABELS[row.stakeholder_type],
  ]
    .filter(Boolean)
    .join(" · ");

  const channelLabel = humanChannel(row.latest_outbound_channel);
  const sendCountLabel =
    row.outbound_count === 1 ? "1 message" : `${row.outbound_count} messages`;

  const footnote = row.has_pending_reply
    ? `Reply ${formatRelative(row.latest_reply_at!)} · last ${channelLabel} ${formatRelative(row.latest_outbound_at)}`
    : `Last ${channelLabel} ${formatRelative(row.latest_outbound_at)} · ${sendCountLabel}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDrawer}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDrawer();
        }
      }}
      title="Open the stakeholder drawer for full thread + Log reply."
      className={`cursor-pointer rounded-lg border bg-white px-4 py-3 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        row.has_pending_reply ? "border-primary-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-stretch justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm ${
              row.has_pending_reply ? "font-semibold text-gray-900" : "font-medium text-gray-900"
            }`}
          >
            {headline}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">{footnote}</p>
          {row.has_pending_reply && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-900">
                Reply waiting
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
