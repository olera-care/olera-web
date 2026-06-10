"use client";

/**
 * PartnerManualAdd — add a partner contact BY HAND, no AI required.
 *
 * The trust model: AI accelerates, the admin verifies — and sometimes the admin
 * just knows a contact the AI will never surface (a name from a phone call, a
 * business card, a page behind a login). This is the manual fallback that makes
 * the drawer the source of truth, available in both the AI review step
 * (PartnerSourcingModal) and the required manual-audit gate (PartnerAuditModal).
 *
 * Office-shaped model (advisor subtype, the only one live today):
 *   - A person is added UNDER the Site's advising office as a member
 *     (research_data.office_members via /api/admin/medjobs/office-member —
 *     find-or-create), NOT as a standalone prospect card, and NOT as an
 *     outreach contact (so cold fan-out never hits them).
 *   - office_name lets the admin name/seed the office if none exists yet.
 *
 * student_org / dept_head reuse the existing stakeholders write path
 * (stakeholderBodyFromCandidate) so behavior matches AI-accepted records.
 */

import { useState } from "react";
import {
  stakeholderBodyFromCandidate,
  type PartnerCandidate,
  type PartnerSubtype,
} from "@/lib/medjobs/partner-sourcing";

function bodyError(body: unknown, fallback: string): string {
  const e = (body as { error?: unknown } | null)?.error;
  if (typeof e === "string" && e.trim()) return e;
  if (e && typeof e === "object") {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return fallback;
}

interface Props {
  campusSlug: string;
  subtype: PartnerSubtype;
  /** Called after a successful add so the parent can refetch / advance steps. */
  onAdded: () => void;
}

export function PartnerManualAdd({ campusSlug, subtype, onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Shared fields.
  const [name, setName] = useState("");
  const [role, setRole] = useState(""); // advisor role / dept-head title
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  // Advisor-only: name the office if one doesn't exist yet.
  const [officeName, setOfficeName] = useState("");
  // dept_head-only.
  const [department, setDepartment] = useState("");

  const isOffice = subtype === "advisor";
  const canSubmit =
    !busy &&
    (isOffice
      ? Boolean(name.trim() || email.trim())
      : Boolean(name.trim() || email.trim()));

  function reset() {
    setName("");
    setRole("");
    setEmail("");
    setPhone("");
    setSourceUrl("");
    setNotes("");
    setOfficeName("");
    setDepartment("");
  }

  async function submit() {
    setBusy(true);
    setError(null);
    setOkMsg(null);
    try {
      let res: Response;
      if (isOffice) {
        // Attach as a member under the Site's advising office (find-or-create).
        res = await fetch("/api/admin/medjobs/office-member", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campus_slug: campusSlug,
            office_name: officeName.trim() || undefined,
            members: [
              {
                name: name.trim() || null,
                role: role.trim() || null,
                email: email.trim() || null,
                phone: phone.trim() || null,
                source_url: sourceUrl.trim() || null,
              },
            ],
          }),
        });
      } else {
        const candidate: PartnerCandidate = {
          subtype,
          name: name.trim() || null,
          title: subtype === "dept_head" ? role.trim() || null : null,
          department: subtype === "dept_head" ? department.trim() || null : null,
          email: email.trim() || null,
          org_email: subtype === "student_org" ? email.trim() || null : null,
          phone: phone.trim() || null,
          source_url: sourceUrl.trim() || null,
          notes: notes.trim() || null,
          confidence: null,
        };
        res = await fetch("/api/admin/student-outreach/stakeholders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stakeholderBodyFromCandidate(campusSlug, candidate)),
        });
      }
      if (!res.ok) throw new Error(bodyError(await res.json().catch(() => null), "Add failed"));
      setOkMsg(
        isOffice
          ? `Added ${name.trim() || email.trim()} to the office.`
          : `Added ${name.trim() || email.trim()}.`,
      );
      reset();
      onAdded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="text-[11px]">
        {okMsg && <p className="mb-1 text-emerald-700">{okMsg}</p>}
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setOkMsg(null);
          }}
          className="font-medium text-primary-600 hover:underline"
        >
          + Add {isOffice ? "a person by hand" : subtype === "student_org" ? "an organization by hand" : "a contact by hand"}
        </button>
      </div>
    );
  }

  const input =
    "w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none";

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3">
      <p className="mb-2 text-[11px] font-medium text-gray-700">
        {isOffice
          ? "Add a person to the advising office"
          : subtype === "student_org"
            ? "Add a student organization"
            : "Add a department head"}
      </p>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={subtype === "student_org" ? "Organization name" : "Name"}
          className={input}
        />
        {subtype === "dept_head" ? (
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department"
            className={input}
          />
        ) : (
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder={isOffice ? "Role (e.g. Pre-Health Advisor)" : "Title"}
            className={input}
          />
        )}
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={input}
        />
        {subtype !== "student_org" && (
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className={input}
          />
        )}
        {isOffice && (
          <input
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            placeholder="Office name (only if creating it)"
            className={`${input} col-span-2`}
          />
        )}
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="Source URL (where you found this)"
          className={`${input} col-span-2`}
        />
        {!isOffice && (
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={`${input} col-span-2`}
          />
        )}
      </div>
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            reset();
          }}
          className="text-xs text-gray-500 hover:underline"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
      <p className="mt-1 text-[10px] text-gray-400">
        {isOffice
          ? "Added under the office as a member — not blasted with cold outreach."
          : "Saved as a prospect you can verify in the drawer."}
      </p>
    </div>
  );
}
