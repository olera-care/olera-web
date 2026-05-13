"use client";

/**
 * CallForEmailModal — v9 Phase 4.
 *
 * Used when admin clicks "Call to obtain email" on a Provider Prospect
 * with no email on file. Logs a call attempt as a touchpoint and, if
 * a new email was obtained on the call, threads the contact into the
 * SnapshotCard via add_contact.
 *
 * Pre-flight as operational interaction stage (commit 5): when admin
 * reaches someone, the modal also offers an optional engagement
 * follow-on (Interested / Promised callback / Became a Client / Not
 * interested) that reuses the existing log_call_outcome action. This
 * lets a research call short-circuit the campaign when the call
 * itself produces a meaningful outcome — admin doesn't have to
 * pretend the conversation didn't happen and queue Day 0 anyway.
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
import type { DrawerContext } from "@/lib/student-outreach/types";
import { OTHER, PROVIDER_CONTACT_ROLES } from "@/lib/student-outreach/presets";

type ActionFn = (
  actionName: string,
  payload?: Record<string, unknown>,
) => Promise<DrawerContext>;

type Outcome = "no_answer" | "voicemail" | "connected" | "wrong_number";

const OUTCOME_LABELS: Record<Outcome, string> = {
  no_answer: "No answer",
  voicemail: "Voicemail",
  connected: "Reached someone",
  wrong_number: "Wrong number",
};

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

  // Engagement only applies when the admin actually reached someone.
  // If they switch outcome away from connected, drop any selection so
  // we don't dispatch a stale engagement on submit.
  const handleOutcomeChange = (next: Outcome) => {
    setOutcome(next);
    if (next !== "connected") setEngagement("none");
  };

  const submit = async () => {
    setSaving(true);
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
      setError(e instanceof Error ? e.message : "Failed to log call");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Log call to {organizationName}
          </h3>
          {phone && (
            <p className="mt-0.5 text-xs text-gray-500">
              📞{" "}
              <a href={`tel:${phone}`} className="text-emerald-700 hover:underline">
                {phone}
              </a>
            </p>
          )}
        </header>

        <div className="space-y-3 px-5 py-4">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Outcome
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(OUTCOME_LABELS) as Outcome[]).map((o) => (
                <button
                  key={o}
                  onClick={() => handleOutcomeChange(o)}
                  className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    outcome === o
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {OUTCOME_LABELS[o]}
                </button>
              ))}
            </div>
          </div>

          {outcome === "connected" && (
            <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/30 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                What happened on the call?
              </p>
              <div className="space-y-1.5">
                {ENGAGEMENT_OPTIONS.map((opt) => {
                  const active = engagement === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setEngagement(opt.key)}
                      className={`flex w-full items-start gap-2 rounded-md border px-2.5 py-1.5 text-left transition-colors ${
                        active
                          ? "border-emerald-500 bg-white"
                          : "border-gray-200 bg-white hover:border-emerald-300"
                      }`}
                    >
                      <span
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                          active ? "border-emerald-600 bg-emerald-600" : "border-gray-300"
                        }`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-gray-900">
                          {opt.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-gray-500">
                          {opt.blurb}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                New contact (optional)
              </p>
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
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-sm focus:border-gray-400 focus:outline-none"
              >
                <option value="">(no role)</option>
                {PROVIDER_CONTACT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
          )}

          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Notes
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                outcome === "voicemail"
                  ? "What did the voicemail say? When to try again?"
                  : outcome === "connected"
                    ? "Anything they said that's useful for future outreach?"
                    : "Context for this call attempt."
              }
              rows={3}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
            />
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? "Logging…" : "Log call"}
          </button>
        </footer>
      </div>
    </div>
  );
}
