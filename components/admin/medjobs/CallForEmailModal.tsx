"use client";

/**
 * CallForEmailModal — v9 Phase 4.
 *
 * Used when admin clicks "Call to obtain information" on a Provider
 * Prospect during pre-flight. Logs a call attempt as a touchpoint and,
 * if a new email was obtained on the call, threads the contact into
 * the SnapshotCard via add_contact.
 *
 * Pre-flight as operational interaction stage (commit 5): when admin
 * reaches someone, the modal also offers an optional engagement
 * follow-on (Interested / Promised callback / Became a Client / Not
 * interested) that reuses the existing log_call_outcome action. This
 * lets a research call short-circuit the campaign when the call
 * itself produces a meaningful outcome — admin doesn't have to
 * pretend the conversation didn't happen and queue Day 0 anyway.
 *
 * C4: uses LogModalShell + StatusCard pattern for visual consistency
 * with LogCallOutcomeModal, ReplyClassifierModal, and LogMeetingModal.
 * Phone link moves to the subtitle slot. Engagement panel and
 * contact-add form remain conditional under "Reached someone".
 *
 * Four outcomes match the existing call_* touchpoint vocabulary so
 * the timeline narrates consistently:
 *   - No answer        →   call_no_answer       (log_research_call)
 *   - Voicemail        →   call_voicemail       (log_research_call;
 *                          state-derivation auto-flips replies_state
 *                          to awaiting_callback)
 *   - Reached someone  →   call_connected       (log_research_call by
 *                          default; log_call_outcome when an
 *                          engagement follow-on is selected — one
 *                          touchpoint per real phone call)
 *   - Wrong number     →   call_wrong_number    (log_research_call)
 *
 * Reached-someone is the only branch that surfaces the new-contact
 * form AND the engagement follow-on. The contact-add flow runs
 * independently of the dispatch path so admin can capture both a new
 * contact and a meaningful outcome from the same call.
 */

import { useState } from "react";
import { LogModalShell } from "@/components/admin/medjobs/LogModalShell";
import type { DrawerContext } from "@/lib/student-outreach/types";
import { OTHER, PROVIDER_CONTACT_ROLES } from "@/lib/student-outreach/presets";
import Select from "@/components/ui/Select";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

type Outcome = "no_answer" | "voicemail" | "connected" | "wrong_number";

interface OutcomeChoice {
  key: Outcome;
  label: string;
  blurb: string;
}

const OUTCOME_CHOICES: OutcomeChoice[] = [
  {
    key: "no_answer",
    label: "No answer",
    blurb: "Marks this call complete. Future call days still fire on schedule.",
  },
  {
    key: "voicemail",
    label: "Voicemail / message left",
    blurb:
      "Row moves to Replies as awaiting callback. Future call days still fire on schedule.",
  },
  {
    key: "connected",
    label: "Reached someone",
    blurb: "Pick what happened on the call below — and add a new contact if useful.",
  },
  {
    key: "wrong_number",
    label: "Wrong number",
    blurb: "Marks the contact unreachable on this number. Closes the row.",
  },
];

// Engagement follow-on options for the `connected` outcome. Reuses the
// existing log_call_outcome vocabulary verbatim — no new enum values.
// Provider-only because this modal is provider-only (convert_to_partner
// is stakeholder-only and intentionally omitted). "none" preserves the
// existing research-call dispatch path.
type Engagement =
  | "none"
  | "promised_callback"
  | "connected_engaged"
  | "convert_to_client"
  | "connected_not_interested";

const ENGAGEMENT_OPTIONS: Array<{ key: Engagement; label: string; blurb: string }> = [
  {
    key: "none",
    label: "Just got info",
    blurb: "No operational outcome — research call only. Day 0 outreach still launches when ready.",
  },
  {
    key: "promised_callback",
    label: "Promised to call back",
    blurb: "Row moves to Replies as awaiting callback.",
  },
  {
    key: "connected_engaged",
    label: "Interested",
    blurb: "Stops the email and call cadence. Skips the Day 0 launch.",
  },
  {
    key: "convert_to_client",
    label: "Became a Client ✓",
    blurb: "Marks the provider as a Client and unlocks Partner Prospects for catchment Sites.",
  },
  {
    key: "connected_not_interested",
    label: "Not interested",
    blurb: "Closes the row. Cancels remaining email and call tasks.",
  },
];

interface Props {
  organizationName: string;
  phone: string | null;
  action: ActionFn;
  onCancel: () => void;
  onDone: () => void;
  setError: (msg: string | null) => void;
}

export function CallForEmailModal({
  organizationName,
  phone,
  action,
  onCancel,
  onDone,
  setError,
}: Props) {
  const [outcome, setOutcome] = useState<Outcome>("no_answer");
  const [engagement, setEngagement] = useState<Engagement>("none");
  const [notes, setNotes] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [roleOther, setRoleOther] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Engagement only applies when the admin actually reached someone.
  // If they switch outcome away from connected, drop any selection so
  // we don't dispatch a stale engagement on submit.
  const handleOutcomeChange = (next: Outcome) => {
    setOutcome(next);
    if (next !== "connected") setEngagement("none");
  };

  const submit = async () => {
    setSaving(true);
    setLocalError(null);
    setError(null);
    try {
      // One real phone call = one timeline entry. When engagement is
      // selected, dispatch the existing log_call_outcome path so the
      // touchpoint carries the operational outcome (and triggers
      // status transitions / cadence supersession / make_client). The
      // research-call dispatch path is preserved verbatim for every
      // other case so prior behavior is unchanged.
      if (outcome === "connected" && engagement !== "none") {
        await action("log_call_outcome", {
          outcome: engagement,
          notes: notes.trim() || null,
        });
      } else {
        await action("log_research_call", { outcome, notes: notes.trim() || null });
      }

      // If admin obtained a new contact during the call, add it. The
      // contact lands in the snapshot's Outreach Contacts list and
      // (if email present) enables the launch gate. Independent of
      // the engagement dispatch — admin may capture a new contact
      // AND log a meaningful outcome from the same call.
      const trimmedEmail = newEmail.trim();
      const trimmedPhone = newPhone.trim();
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const resolvedRole =
        role === OTHER ? roleOther.trim() || null : role || null;
      const hasContactData =
        outcome === "connected" &&
        (trimmedEmail || trimmedPhone || trimmedFirst || trimmedLast);
      if (hasContactData) {
        const derivedName =
          [trimmedFirst, trimmedLast].filter(Boolean).join(" ").trim() ||
          resolvedRole ||
          organizationName;
        await action("add_contact", {
          name: derivedName,
          first_name: trimmedFirst || null,
          last_name: trimmedLast || null,
          role: resolvedRole,
          email: trimmedEmail || null,
          phone: trimmedPhone || null,
        });
      }
      onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to log call";
      setLocalError(msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const subtitle = (
    <>
      {organizationName}
      {phone && (
        <>
          {" · "}
          <a href={`tel:${phone}`} className="text-primary-700 hover:underline">
            📞 {phone}
          </a>
        </>
      )}
    </>
  );

  const submitLabel = outcome === "connected" && engagement !== "none" ? "Log outcome" : "Log call";

  return (
    <LogModalShell
      title="Log pre-flight call"
      subtitle={subtitle}
      error={localError}
      onCancel={onCancel}
      footer={
        <>
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Logging…" : submitLabel}
          </button>
        </>
      }
    >
      <div className="space-y-1.5">
        {OUTCOME_CHOICES.map((opt) => (
          <StatusCard
            key={opt.key}
            active={outcome === opt.key}
            onSelect={() => handleOutcomeChange(opt.key)}
            label={opt.label}
            blurb={opt.blurb}
          />
        ))}
      </div>

      {outcome === "connected" && (
        <div className="space-y-3 rounded-md border border-primary-200 bg-primary-50/30 px-3 py-3">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
              What happened on the call?
            </p>
            <div className="space-y-1.5">
              {ENGAGEMENT_OPTIONS.map((opt) => (
                <StatusCard
                  key={opt.key}
                  active={engagement === opt.key}
                  onSelect={() => setEngagement(opt.key)}
                  label={opt.label}
                  blurb={opt.blurb}
                  compact
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-700">
              New contact (optional)
            </p>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
                />
              </div>
              <Select
                value={role}
                onChange={(val) => setRole(val)}
                placeholder="(no role)"
                size="sm"
                options={[
                  { value: "", label: "(no role)" },
                  ...PROVIDER_CONTACT_ROLES.map((r) => ({ value: r, label: r })),
                ]}
              />
              {role === OTHER && (
                <input
                  type="text"
                  value={roleOther}
                  onChange={(e) => setRoleOther(e.target.value)}
                  placeholder="Custom role"
                  className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
                />
              )}
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email (if obtained)"
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
              />
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Direct phone / extension (optional)"
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <label className="block pt-1">
        <span className="mb-1 block text-xs font-medium text-gray-600">
          Notes (optional)
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            outcome === "voicemail"
              ? "Voicemail or front-desk message? What did they say or when to try again?"
              : outcome === "connected"
                ? "Anything they said that's useful for future outreach?"
                : "Context for this call attempt."
          }
          rows={3}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
        />
      </label>
    </LogModalShell>
  );
}

// Locally-defined StatusCard mirroring the pattern used by
// LogMeetingModal and ReplyClassifierModal. The `compact` variant
// matches the engagement sub-panel's tighter visual rhythm.
function StatusCard({
  active,
  onSelect,
  label,
  blurb,
  compact = false,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  blurb: string;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      type="button"
      className={`flex w-full items-start gap-3 rounded-lg border-2 ${compact ? "p-2.5" : "p-3"} text-left transition-colors ${
        active
          ? "border-primary-500 bg-primary-50"
          : "border-gray-200 hover:border-primary-300 hover:bg-primary-50/30"
      }`}
    >
      <span
        className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
          active ? "border-primary-600 bg-primary-600" : "border-gray-300 bg-white"
        }`}
        aria-hidden
      >
        {active && (
          <span className="block h-full w-full rounded-full border-2 border-white bg-primary-600" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block ${compact ? "text-xs" : "text-sm"} font-medium text-gray-900`}>
          {label}
        </span>
        <span className={`mt-0.5 block ${compact ? "text-[11px]" : "text-xs"} text-gray-600`}>
          {blurb}
        </span>
      </span>
    </button>
  );
}
