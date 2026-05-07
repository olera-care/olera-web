"use client";

/**
 * v9.0 Phase 5: CompletedTaskCard — one row in the Completed Tasks
 * touchpoint feed. Standard MedjobsCard chrome. The title is a
 * human-readable action verb + target ("Sent email · Acme Univ.
 * Pre-Med Society"); subtitle carries campus + kind; footnote shows
 * relative timestamp + channel. Click opens the source row's drawer.
 */

import type { ReactNode } from "react";
import { formatRelative } from "@/lib/student-outreach/formatters";
import { KIND_LABELS } from "@/lib/student-outreach/types";
import { MedjobsCard } from "./MedjobsCard";
import { Pill } from "./StakeholderCard";

export interface CompletedTaskRow {
  id: string;
  /** Stakeholder source: outreach_id. For entity-task sources
   *  (client/candidate/site), this is "" — use source_kind +
   *  source_id for routing. */
  outreach_id: string;
  touchpoint_type: string;
  channel: string | null;
  outcome: string | null;
  notes: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  organization_name: string;
  kind: string;
  stakeholder_type: string | null;
  campus_name: string | null;
  /** v9.0 Phase 7 Commit O: Logs feed unification. Identifies which
   *  surface logged this completion so the Logs page can route the
   *  drawer click to the right mode. Defaults to "stakeholder" for
   *  legacy touchpoint rows. */
  source_kind?: "stakeholder" | "client" | "candidate" | "site";
  /** Entity id for drawer routing (matches source_kind). Stakeholder
   *  rows fall back to outreach_id. */
  source_id?: string;
}

export function CompletedTaskCard({
  row,
  onOpenDrawer,
}: {
  row: CompletedTaskRow;
  onOpenDrawer: () => void;
}) {
  const { verb, pillText } = describeTouchpoint(row);

  const subtitle = [
    row.campus_name,
    KIND_LABELS[(row.kind as keyof typeof KIND_LABELS) ?? "student_org"] ?? null,
  ]
    .filter(Boolean)
    .join(" · ");

  const footnote = [
    formatRelative(row.created_at),
    row.channel ? humanChannel(row.channel) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const pill: ReactNode = pillText ? <Pill>{pillText}</Pill> : null;

  return (
    <MedjobsCard
      title={`${verb} · ${row.organization_name}`}
      subtitle={subtitle || null}
      footnote={footnote}
      pill={pill}
      onClick={onOpenDrawer}
      hoverTitle="Open the source row's drawer."
    />
  );
}

/**
 * Map a touchpoint type to a verb and an optional pill label. The
 * verb leads the card title so admin can scan the feed and read
 * "what we did".
 */
function describeTouchpoint(row: CompletedTaskRow): {
  verb: string;
  pillText: string | null;
} {
  switch (row.touchpoint_type) {
    case "email_sent":
      return { verb: "Sent email", pillText: null };
    case "email_replied":
      return { verb: "Reply logged", pillText: row.outcome ?? null };
    case "ig_dm_sent":
      return { verb: "Sent IG DM", pillText: null };
    case "ig_dm_replied":
      return { verb: "IG reply logged", pillText: null };
    case "contact_form_submitted":
      return { verb: "Contact form sent", pillText: null };
    case "call_no_answer":
      return { verb: "Call · no answer", pillText: null };
    case "call_voicemail":
      return { verb: "Voicemail left", pillText: null };
    case "call_connected":
      return { verb: "Connected on call", pillText: row.outcome ?? null };
    case "call_wrong_number":
      return { verb: "Wrong number", pillText: null };
    case "meeting_scheduled":
      return { verb: "Meeting scheduled", pillText: null };
    case "meeting_held":
      return { verb: "Meeting held", pillText: null };
    case "meeting_no_show":
      return { verb: "Meeting no-show", pillText: null };
    case "meeting_rescheduled":
      return { verb: "Meeting rescheduled", pillText: null };
    case "approval_granted":
      return { verb: "Approval granted", pillText: null };
    case "distribution_confirmed":
      return { verb: "Marked Partner ★", pillText: null };
    case "stage_change": {
      const to =
        row.payload && typeof row.payload === "object" && "to" in row.payload
          ? (row.payload as { to?: string }).to
          : null;
      const fromStage =
        row.payload && typeof row.payload === "object" && "from" in row.payload
          ? (row.payload as { from?: string }).from
          : null;
      const verb = to ? `Stage → ${prettyStatus(to)}` : "Stage change";
      const pill = fromStage ? `from ${prettyStatus(fromStage)}` : null;
      return { verb, pillText: pill };
    }
    case "note_added":
      return { verb: "Note added", pillText: null };
    // v9.0 Phase 7 Commit O: synthetic types for entity-task completions
    // (business_profile_tasks + site_tasks). Surfaced in the unified
    // Logs feed alongside stakeholder touchpoints.
    case "task_completed_client":
      return { verb: "Client step logged", pillText: null };
    case "task_completed_candidate":
      return { verb: "Candidate step logged", pillText: null };
    case "task_completed_site":
      return { verb: "Site step logged", pillText: null };
    default:
      return { verb: row.touchpoint_type.replace(/_/g, " "), pillText: null };
  }
}

function prettyStatus(s: string): string {
  return s.replace(/_/g, " ");
}

function humanChannel(channel: string): string {
  switch (channel) {
    case "email":
      return "email";
    case "phone":
      return "phone";
    case "ig_dm":
      return "IG DM";
    case "contact_form":
      return "contact form";
    case "meeting":
      return "meeting";
    case "system":
      return "system";
    default:
      return channel;
  }
}
