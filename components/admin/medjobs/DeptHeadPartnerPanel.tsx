"use client";

/**
 * Department-Head partnership documentation panel.
 *
 * Dept heads don't get the portal hand-off other partners get. Their terminal
 * step is a documented decision about PROFESSOR OUTREACH — whether we may
 * contact the department's faculty, and the agreed next step. This panel
 * replaces PartnerEvidencePanel in the conversion flow when the row is a
 * department head, and rides through the same `partner` payload (its value is
 * forwarded to mark_partner as `dept_head`).
 *
 * Controlled via a single value/onChange so the host modal needs only one
 * extra state field.
 */

import type { DeptHeadPartnership } from "@/lib/student-outreach/types";
import Input from "@/components/ui/Input";

export const DEFAULT_DEPT_HEAD_PARTNERSHIP: DeptHeadPartnership = {
  confirmed_via: "meeting",
  professor_permission: "not_yet",
  next_step: "need_followup",
  notes: "",
};

const CONFIRMED_VIA: Array<{ value: DeptHeadPartnership["confirmed_via"]; label: string }> = [
  { value: "meeting", label: "Meeting" },
  { value: "verbal", label: "Verbal" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other" },
];

const PERMISSION: Array<{ value: DeptHeadPartnership["professor_permission"]; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_yet", label: "Not yet" },
  { value: "unclear", label: "Unclear" },
];

const NEXT_STEP: Array<{ value: DeptHeadPartnership["next_step"]; label: string }> = [
  { value: "email_professors", label: "We may email professors directly" },
  { value: "will_forward", label: "Dept head will forward the flyer" },
  { value: "will_introduce", label: "Dept head will introduce us" },
  { value: "need_followup", label: "Need a follow-up to decide" },
  { value: "do_not_contact_yet", label: "Do not contact professors yet" },
  { value: "other", label: "Other (see notes)" },
];

export function DeptHeadPartnerPanel({
  value,
  onChange,
}: {
  value: DeptHeadPartnership;
  onChange: (next: DeptHeadPartnership) => void;
}) {
  const set = <K extends keyof DeptHeadPartnership>(key: K, v: DeptHeadPartnership[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-3 rounded-md border border-primary-200 bg-primary-50/40 p-3">
      <p className="text-xs font-medium text-primary-900">
        Document this partnership — the key terminal step for a department head.
      </p>

      <Field label="How was the partnership confirmed?">
        <ChipRow
          options={CONFIRMED_VIA}
          selected={value.confirmed_via}
          onSelect={(v) => set("confirmed_via", v)}
        />
      </Field>

      <Field label="May we contact professors in this department?">
        <ChipRow
          options={PERMISSION}
          selected={value.professor_permission}
          onSelect={(v) => set("professor_permission", v)}
        />
      </Field>

      <Field label="Next step for professor outreach">
        <div className="space-y-1.5">
          {NEXT_STEP.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm ${
                value.next_step === opt.value
                  ? "border-primary-600 bg-white"
                  : "border-gray-200 bg-white hover:bg-primary-50/30"
              }`}
            >
              <input
                type="radio"
                name="dept-head-next-step"
                className="mt-0.5"
                checked={value.next_step === opt.value}
                onChange={() => set("next_step", opt.value)}
              />
              <span className="text-gray-900">{opt.label}</span>
            </label>
          ))}
        </div>
      </Field>

      <Input
        as="textarea"
        label="Scope / notes"
        value={value.notes}
        onChange={(e) => set("notes", e.target.value)}
        rows={2}
        placeholder="e.g. 'OK to email the 3 intro-bio professors; check back in fall for the rest.'"
        size="sm"
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-700">{label}</p>
      {children}
    </div>
  );
}

function ChipRow<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ value: T; label: string }>;
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            selected === opt.value
              ? "border-primary-600 bg-primary-600 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
