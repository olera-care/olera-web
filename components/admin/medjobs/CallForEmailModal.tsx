"use client";

/**
 * CallForEmailModal — v9 Phase 4.
 *
 * Used when admin clicks "Call to obtain email" on a Provider Prospect
 * with no email on file. Logs a call attempt as a touchpoint and, if
 * a new email was obtained on the call, threads the contact into the
 * SnapshotCard via add_contact. No state-machine changes — the row
 * stays in prospect; once the obtained email flows through to the
 * contact list, the NextStepCard's launch gate flips to enabled and
 * admin can proceed to PreFlight.
 *
 * Four outcomes match the existing call_* touchpoint vocabulary so
 * the timeline narrates consistently:
 *   - No answer        →   call_no_answer
 *   - Voicemail        →   call_voicemail
 *   - Reached someone  →   call_connected     (optional new contact)
 *   - Wrong number     →   call_wrong_number
 *
 * Reached-someone is the only branch that surfaces the new-contact
 * form. If the receptionist gave us a hiring contact's email, admin
 * adds it inline; the snapshot picks up the row on next ctx fetch.
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
  const [notes, setNotes] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [roleOther, setRoleOther] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await action("log_research_call", { outcome, notes: notes.trim() || null });

      // If admin obtained a new contact during the call, add it. The
      // contact lands in the snapshot's Outreach Contacts list and
      // (if email present) enables the launch gate.
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
                  onClick={() => setOutcome(o)}
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
