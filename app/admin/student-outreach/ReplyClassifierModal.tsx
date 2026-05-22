"use client";

/**
 * v9.0 Phase 7 Commit G: ReplyClassifierModal.
 *
 * Single triage modal shared by Replies-tab "They replied" and "Got
 * callback" actions. Five classifications drive different downstream
 * actions:
 *   keep_emailing   → log_email_replied (engaged, cadence continues)
 *   wants_meeting   → flag_wants_meeting (note_added meeting_in_flight)
 *   already_booked  → mark_meeting_scheduled with optional date input
 *   committed       → expands inline with PartnerEvidencePanel; submit
 *                     fires classify_reply(committed) AND mark_partner
 *                     in one user action.
 *   not_interested  → close row + stop cadence
 *
 * For "already_booked" the modal grows a datetime input. For
 * "committed" the partner-evidence panel inlines below the choices —
 * one modal, one submit. The previous chained MarkPartnerModal flow
 * is gone.
 */

import { useState } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";
import {
  PartnerEvidencePanel,
  DEFAULT_PARTNER_EVIDENCE,
  type PartnerEvidence,
} from "@/components/admin/medjobs/PartnerEvidencePanel";
import type { DistributionEvidence } from "@/lib/student-outreach/types";

// v8.10.8: added "not_interested" — admin's "they said no thanks" path.
// P3: added "became_client" — provider-only direct conversion path
// when a reply commits them to the caregiver-hiring pilot. UI-level
// only; dispatches existing make_client action.
// P4: added "redirected" — they're sending us to a different decision-
// maker. UI-level only; dispatches add_contact for the new contact
// plus classify_reply(keep_emailing) so the original cadence stops
// and admin continues the thread (now with the new contact in the
// snapshot list).
export type ReplyClassification =
  | "keep_emailing"
  | "wants_meeting"
  | "already_booked"
  | "committed"
  | "became_client"
  | "redirected"
  | "not_interested";

export interface RedirectContact {
  first_name: string;
  last_name: string;
  email: string;
}

interface Props {
  organizationName: string;
  /** Banner copy varies between email-reply and got-callback contexts. */
  source: "email_reply" | "callback";
  /**
   * v9.0 Phase 2 Tier 3.6: row kind. When 'provider', the "Mark as
   * Partner" outcome is hidden — providers convert to Clients via
   * T&C/Stripe signal, not via admin classification. Defaults to
   * stakeholder.
   */
  rowKind?: "provider" | "stakeholder";
  onCancel: () => void;
  /**
   * Called on submit. When the admin picked the partner outcome,
   * `partner` carries the evidence payload — parent should fire
   * mark_partner immediately after classify_reply so both lands in
   * one user-facing action.
   */
  onSubmit: (
    classification: ReplyClassification,
    payload: { notes: string; meeting_at?: string | null },
    partner?: PartnerEvidence,
    /**
     * P4: when admin picks "Redirected to another contact", carries
     * the new-contact details. Parent dispatches add_contact with
     * this payload + classify_reply(keep_emailing).
     */
    redirect?: RedirectContact,
  ) => Promise<void>;
}

export function ReplyClassifierModal({
  organizationName,
  source,
  rowKind = "stakeholder",
  onCancel,
  onSubmit,
}: Props) {
  const isProvider = rowKind === "provider";
  const [choice, setChoice] = useState<ReplyClassification | null>(null);
  const [notes, setNotes] = useState("");
  const [meetingAt, setMeetingAt] = useState("");
  const [evidence, setEvidence] = useState<DistributionEvidence>(DEFAULT_PARTNER_EVIDENCE);
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // P4: inline new-contact fields revealed when "redirected" picked.
  const [redirectFirstName, setRedirectFirstName] = useState("");
  const [redirectLastName, setRedirectLastName] = useState("");
  const [redirectEmail, setRedirectEmail] = useState("");

  // v8.10.7: title is universal — "Log reply" is the single verb across
  // email replies, voicemails, and callbacks. The source param still
  // distinguishes touchpoint type on the server, but admins see one
  // consistent prompt.
  const sourceLabel = "What did they say?";
  void source;

  const isPartner = choice === "committed";
  const isRedirect = choice === "redirected";

  const submit = async () => {
    if (!choice) {
      setError("Pick what they said.");
      return;
    }
    if (isRedirect) {
      // P4: the new-contact form needs at least one piece of identifying
      // info — name or email — for the add_contact to make sense.
      const trimmedFirst = redirectFirstName.trim();
      const trimmedLast = redirectLastName.trim();
      const trimmedEmail = redirectEmail.trim();
      if (!trimmedFirst && !trimmedLast && !trimmedEmail) {
        setError("Add the new contact's name or email so we know who to follow up with.");
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(
        choice,
        {
          notes: notes.trim(),
          meeting_at:
            choice === "already_booked" && meetingAt
              ? new Date(meetingAt).toISOString()
              : null,
        },
        isPartner
          ? { evidence, evidence_notes: evidenceNotes.trim() }
          : undefined,
        isRedirect
          ? {
              first_name: redirectFirstName.trim(),
              last_name: redirectLastName.trim(),
              email: redirectEmail.trim(),
            }
          : undefined,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LogModalShell
      title={sourceLabel}
      subtitle={organizationName}
      error={error}
      onCancel={onCancel}
      footer={
        <>
          <button
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !choice}
            className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 ${
              isPartner
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-gray-900 hover:bg-gray-700"
            }`}
          >
            {submitting ? "Saving…" : isPartner ? "Mark as Partner" : "Save"}
          </button>
        </>
      }
    >
      {/* v8.10.7: short reminder before the radio options. Reinforces
          the inbox-triage workflow — admin checks Gmail and voicemail
          first, then comes here to pick what happened. */}
      <p className="rounded-md bg-blue-50/60 px-3 py-2 text-xs text-blue-900">
        Check Gmail and voicemail first, then pick what happened below.
      </p>

      <div className="space-y-1.5">
            <ChoiceCard
              active={choice === "keep_emailing"}
              onSelect={() => setChoice("keep_emailing")}
              label="They replied"
              blurb="Generic reply or question. The auto-cadence continues; respond through Gmail and log updates here."
              tone="neutral"
            />
            <ChoiceCard
              active={choice === "wants_meeting"}
              onSelect={() => setChoice("wants_meeting")}
              label="They want to meet"
              blurb="Reply with Dr. DuBose's Calendly link (already in his email signature) so they can book directly. Row moves to Meetings."
              tone="warn"
            />
            <ChoiceCard
              active={choice === "already_booked"}
              onSelect={() => setChoice("already_booked")}
              label="Meeting is booked"
              blurb="Calendly auto-booked it, or you already added it to your calendar. Row moves to Meetings."
              tone="ok"
            />
            {!isProvider && (
              <ChoiceCard
                active={choice === "committed"}
                onSelect={() => setChoice("committed")}
                label="Mark as Partner ★"
                blurb="They committed to sharing with students. Capture the evidence below."
                tone="ok"
              />
            )}
            {isProvider && (
              <ChoiceCard
                active={choice === "became_client"}
                onSelect={() => setChoice("became_client")}
                label="Became a Client ✓"
                blurb="They committed to the caregiver-hiring pilot. Marks the provider as a Client and unlocks Partner Prospects for catchment Sites."
                tone="ok"
              />
            )}
            <ChoiceCard
              active={choice === "redirected"}
              onSelect={() => setChoice("redirected")}
              label="Redirected to another contact"
              blurb="They pointed us to someone else. Add the new contact below; cadence to the original recipient stops."
              tone="neutral"
            />
            <ChoiceCard
              active={choice === "not_interested"}
              onSelect={() => setChoice("not_interested")}
              label="Not interested"
              blurb="Polite decline. Row closes as Not interested; cadence stops and they leave the active workflow."
              tone="danger"
            />
          </div>

          {isRedirect && (
            <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/30 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                New contact
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={redirectFirstName}
                  onChange={(e) => setRedirectFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={redirectLastName}
                  onChange={(e) => setRedirectLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
              <input
                type="email"
                value={redirectEmail}
                onChange={(e) => setRedirectEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
              />
              <p className="text-[11px] text-gray-500">
                We&rsquo;ll add this person to the contact list and stop the cadence to the original recipient.
              </p>
            </div>
          )}

          {choice === "already_booked" && (
            <label className="block pt-2">
              <span className="mb-1 block text-xs font-medium text-gray-600">
                Meeting date (optional)
              </span>
              <input
                type="datetime-local"
                value={meetingAt}
                onChange={(e) => setMeetingAt(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
              />
              <span className="mt-1 block text-[11px] text-gray-500">
                You can leave blank — we&rsquo;ll just mark it scheduled.
              </span>
            </label>
          )}

          <label className="block pt-2">
            <span className="mb-1 block text-xs font-medium text-gray-600">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional. Anything the next admin (or future-you) should know — what they said, why you logged this, the next step."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
            />
          </label>

          {isPartner && (
            <PartnerEvidencePanel
              evidence={evidence}
              notes={evidenceNotes}
              onEvidenceChange={setEvidence}
              onNotesChange={setEvidenceNotes}
            />
          )}
    </LogModalShell>
  );
}

function ChoiceCard({
  active,
  onSelect,
  label,
  blurb,
  tone,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  blurb: string;
  tone: "ok" | "neutral" | "warn" | "danger";
}) {
  const toneClass =
    tone === "ok"
      ? active
        ? "border-emerald-500 bg-emerald-50"
        : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
      : tone === "warn"
      ? active
        ? "border-amber-500 bg-amber-50"
        : "border-gray-200 hover:border-amber-300 hover:bg-amber-50/30"
      : tone === "danger"
      ? active
        ? "border-red-400 bg-red-50"
        : "border-gray-200 hover:border-red-300 hover:bg-red-50/30"
      : active
      ? "border-gray-700 bg-gray-50"
      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${toneClass}`}
    >
      <span
        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-gray-900 bg-gray-900" : "border-gray-300"
        }`}
        aria-hidden
      >
        {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-600">{blurb}</span>
      </span>
    </button>
  );
}
