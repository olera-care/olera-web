"use client";

/**
 * BulkResearchModal — v8.4 multi-row stakeholder entry, scoped to one
 * campus.
 *
 * Three tabs:
 *   - Advisors:    Name | Role | Email | Phone   (one row = one stakeholder)
 *   - Dept Heads:  Department | Head name | Email | Phone
 *                  (Department implies organization_name = "[Department] Department")
 *   - Student Orgs: org card with org name + programs + officers (Name | Role | Email | Phone, repeating)
 *
 * Save behavior: explicit Save button at the bottom. Validates each row,
 * skips empty rows, batches the rest. Each stakeholder is created via
 * the existing POST /api/admin/student-outreach/stakeholders endpoint.
 */

import { useEffect, useState, type ReactNode } from "react";
import {
  DEPARTMENTS,
  OTHER,
  PROGRAMS,
  ROLES_BY_TYPE,
} from "@/lib/student-outreach/presets";
import type { ResearchCampusCard } from "@/lib/student-outreach/types";

interface AdvisorRow {
  name: string;
  role: string;
  email: string;
  phone: string;
}

interface DeptHeadRow {
  department: string;
  headName: string;
  email: string;
  phone: string;
}

interface OrgOfficer {
  name: string;
  role: string;
  email: string;
  phone: string;
}

interface OrgDraft {
  orgName: string;
  programs: string[];
  officers: OrgOfficer[];
}

const blankAdvisor = (): AdvisorRow => ({ name: "", role: "Pre-Health Advisor", email: "", phone: "" });
const blankDeptHead = (): DeptHeadRow => ({ department: "", headName: "", email: "", phone: "" });
const blankOfficer = (): OrgOfficer => ({ name: "", role: "President", email: "", phone: "" });
const blankOrg = (): OrgDraft => ({
  orgName: "",
  programs: ["Pre-Med"],
  officers: [blankOfficer()],
});

type TabKey = "advisors" | "dept_heads" | "student_orgs";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "advisors", label: "Advisors" },
  { key: "dept_heads", label: "Dept Heads" },
  { key: "student_orgs", label: "Student Orgs" },
];

interface Props {
  campus: ResearchCampusCard;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function BulkResearchModal({ campus, onClose, onSaved }: Props) {
  const [tab, setTab] = useState<TabKey>("advisors");
  const [advisors, setAdvisors] = useState<AdvisorRow[]>([blankAdvisor(), blankAdvisor()]);
  const [deptHeads, setDeptHeads] = useState<DeptHeadRow[]>([blankDeptHead(), blankDeptHead()]);
  const [orgs, setOrgs] = useState<OrgDraft[]>([blankOrg()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  // ── Save ────────────────────────────────────────────────────────────

  const validAdvisors = advisors.filter((a) => a.name.trim());
  const validDeptHeads = deptHeads.filter((d) => d.department.trim() && d.headName.trim());
  const validOrgs = orgs
    .filter((o) => o.orgName.trim() && o.officers.some((off) => off.name.trim()))
    .map((o) => ({
      ...o,
      officers: o.officers.filter((off) => off.name.trim()),
    }));

  const totalToSave = validAdvisors.length + validDeptHeads.length + validOrgs.length;

  async function save() {
    if (totalToSave === 0) {
      setError("Add at least one stakeholder before saving.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setProgress({ done: 0, total: totalToSave });

    let done = 0;
    try {
      for (const a of validAdvisors) {
        await createAdvisor(campus.slug, a);
        done++;
        setProgress({ done, total: totalToSave });
      }
      for (const d of validDeptHeads) {
        await createDeptHead(campus.slug, d);
        done++;
        setProgress({ done, total: totalToSave });
      }
      for (const o of validOrgs) {
        await createOrg(campus.slug, o);
        done++;
        setProgress({ done, total: totalToSave });
      }
      await onSaved();
    } catch (e) {
      setError(
        `${e instanceof Error ? e.message : "Save failed"} (saved ${done} of ${totalToSave})`,
      );
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">
            Add stakeholders to {campus.name}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Fill rows for advisors, dept heads, or student orgs. Empty rows are ignored.
          </p>
        </header>

        <div className="flex gap-1 border-b border-gray-100 px-6 pt-3">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          {tab === "advisors" && (
            <AdvisorsTab rows={advisors} setRows={setAdvisors} />
          )}
          {tab === "dept_heads" && (
            <DeptHeadsTab rows={deptHeads} setRows={setDeptHeads} />
          )}
          {tab === "student_orgs" && (
            <StudentOrgsTab orgs={orgs} setOrgs={setOrgs} />
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            {progress
              ? `Saving ${progress.done} of ${progress.total}…`
              : totalToSave === 0
              ? "No stakeholders ready yet"
              : `${totalToSave} stakeholder${totalToSave === 1 ? "" : "s"} ready to save`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={submitting || totalToSave === 0}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting
                ? "Saving…"
                : totalToSave === 0
                ? "Save"
                : `Save ${totalToSave}`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Advisors tab ─────────────────────────────────────────────────────────

function AdvisorsTab({
  rows,
  setRows,
}: {
  rows: AdvisorRow[];
  setRows: (r: AdvisorRow[]) => void;
}) {
  return (
    <div className="space-y-2">
      <RowGridHeader columns={["Name", "Role", "Email", "Phone"]} />
      {rows.map((row, i) => (
        <RowGrid key={i} onRemove={rows.length > 1 ? () => setRows(rows.filter((_, j) => j !== i)) : undefined}>
          <Cell value={row.name} onChange={(v) => updateRow(rows, setRows, i, { ...row, name: v })} placeholder="Marcus Reyes" />
          <SelectCell
            value={row.role}
            onChange={(v) => updateRow(rows, setRows, i, { ...row, role: v })}
            options={ROLES_BY_TYPE.advisor}
          />
          <Cell type="email" value={row.email} onChange={(v) => updateRow(rows, setRows, i, { ...row, email: v })} placeholder="mreyes@uh.edu" />
          <Cell value={row.phone} onChange={(v) => updateRow(rows, setRows, i, { ...row, phone: v })} placeholder="+1 832 467 2621" />
        </RowGrid>
      ))}
      <button
        onClick={() => setRows([...rows, blankAdvisor()])}
        className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        + Add row
      </button>
    </div>
  );
}

// ── Dept Heads tab ───────────────────────────────────────────────────────

function DeptHeadsTab({
  rows,
  setRows,
}: {
  rows: DeptHeadRow[];
  setRows: (r: DeptHeadRow[]) => void;
}) {
  return (
    <div className="space-y-2">
      <RowGridHeader columns={["Department", "Head name", "Email", "Phone"]} />
      {rows.map((row, i) => (
        <RowGrid key={i} onRemove={rows.length > 1 ? () => setRows(rows.filter((_, j) => j !== i)) : undefined}>
          <SelectCell
            value={row.department}
            onChange={(v) => updateRow(rows, setRows, i, { ...row, department: v })}
            options={DEPARTMENTS.filter((d) => d !== OTHER)}
            placeholder="— Pick department —"
          />
          <Cell value={row.headName} onChange={(v) => updateRow(rows, setRows, i, { ...row, headName: v })} placeholder="Dr. Sarah Chen" />
          <Cell type="email" value={row.email} onChange={(v) => updateRow(rows, setRows, i, { ...row, email: v })} placeholder="schen@bio.tamu.edu" />
          <Cell value={row.phone} onChange={(v) => updateRow(rows, setRows, i, { ...row, phone: v })} placeholder="+1 979 845 2721" />
        </RowGrid>
      ))}
      <button
        onClick={() => setRows([...rows, blankDeptHead()])}
        className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        + Add row
      </button>
    </div>
  );
}

// ── Student Orgs tab ─────────────────────────────────────────────────────

function StudentOrgsTab({
  orgs,
  setOrgs,
}: {
  orgs: OrgDraft[];
  setOrgs: (o: OrgDraft[]) => void;
}) {
  const updateOrg = (i: number, next: OrgDraft) => {
    setOrgs(orgs.map((o, idx) => (idx === i ? next : o)));
  };
  return (
    <div className="space-y-3">
      {orgs.map((org, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              <input
                value={org.orgName}
                onChange={(e) => updateOrg(i, { ...org, orgName: e.target.value })}
                placeholder="Aggie Pre-Med Society"
                className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium focus:border-gray-400 focus:outline-none"
              />
              <ProgramPicker
                values={org.programs}
                onToggle={(p) => {
                  const next = org.programs.includes(p)
                    ? org.programs.filter((x) => x !== p)
                    : [...org.programs, p];
                  updateOrg(i, { ...org, programs: next });
                }}
              />
            </div>
            {orgs.length > 1 && (
              <button
                onClick={() => setOrgs(orgs.filter((_, j) => j !== i))}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="Remove this org"
                aria-label="Remove org"
              >
                ✕
              </button>
            )}
          </div>

          <RowGridHeader columns={["Name", "Role", "Email", "Phone"]} />
          {org.officers.map((off, j) => (
            <RowGrid
              key={j}
              onRemove={
                org.officers.length > 1
                  ? () => updateOrg(i, { ...org, officers: org.officers.filter((_, k) => k !== j) })
                  : undefined
              }
            >
              <Cell
                value={off.name}
                onChange={(v) =>
                  updateOrg(i, { ...org, officers: org.officers.map((o, k) => (k === j ? { ...o, name: v } : o)) })
                }
                placeholder="Sofia Martinez"
              />
              <SelectCell
                value={off.role}
                onChange={(v) =>
                  updateOrg(i, { ...org, officers: org.officers.map((o, k) => (k === j ? { ...o, role: v } : o)) })
                }
                options={ROLES_BY_TYPE.student_org}
              />
              <Cell
                type="email"
                value={off.email}
                onChange={(v) =>
                  updateOrg(i, { ...org, officers: org.officers.map((o, k) => (k === j ? { ...o, email: v } : o)) })
                }
                placeholder="smartinez@tamu.edu"
              />
              <Cell
                value={off.phone}
                onChange={(v) =>
                  updateOrg(i, { ...org, officers: org.officers.map((o, k) => (k === j ? { ...o, phone: v } : o)) })
                }
                placeholder="+1 …"
              />
            </RowGrid>
          ))}
          <button
            onClick={() => updateOrg(i, { ...org, officers: [...org.officers, blankOfficer()] })}
            className="mt-1 rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            + Officer
          </button>
        </div>
      ))}
      <button
        onClick={() => setOrgs([...orgs, blankOrg()])}
        className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
      >
        + Add another org
      </button>
    </div>
  );
}

function ProgramPicker({
  values,
  onToggle,
}: {
  values: string[];
  onToggle: (p: string) => void;
}) {
  const options = PROGRAMS.filter((p) => p !== OTHER);
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((p) => {
        const active = values.includes(p);
        return (
          <button
            key={p}
            type="button"
            onClick={() => onToggle(p)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
              active
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {p}
          </button>
        );
      })}
    </div>
  );
}

// ── Row primitives ───────────────────────────────────────────────────────

function RowGridHeader({ columns }: { columns: string[] }) {
  return (
    <div className="grid grid-cols-4 gap-2 px-1 pb-1">
      {columns.map((c) => (
        <p key={c} className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          {c}
        </p>
      ))}
    </div>
  );
}

function RowGrid({
  children,
  onRemove,
}: {
  children: ReactNode;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid flex-1 grid-cols-4 gap-2">{children}</div>
      <button
        onClick={onRemove}
        disabled={!onRemove}
        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-0"
        title="Remove row"
        aria-label="Remove row"
      >
        ✕
      </button>
    </div>
  );
}

function Cell({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
    />
  );
}

function SelectCell({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function updateRow<T>(rows: T[], setRows: (r: T[]) => void, i: number, next: T) {
  setRows(rows.map((r, idx) => (idx === i ? next : r)));
}

// ── API helpers ──────────────────────────────────────────────────────────

async function createAdvisor(campusSlug: string, a: AdvisorRow): Promise<void> {
  const initialContact =
    a.email.trim() || a.phone.trim()
      ? {
          name: a.name.trim(),
          role: a.role || null,
          email: a.email.trim() || null,
          phone: a.phone.trim() || null,
          is_primary: true,
        }
      : { name: a.name.trim(), role: a.role || null, is_primary: true };

  await postStakeholder({
    campus_slug: campusSlug,
    stakeholder_type: "advisor",
    organization_name: a.name.trim(),
    department: null,
    programs: ["Pre-Med"],
    notes: null,
    research_data: {},
    initial_contact: initialContact,
  });
}

async function createDeptHead(campusSlug: string, d: DeptHeadRow): Promise<void> {
  const dept = d.department.trim();
  const initialContact =
    d.email.trim() || d.phone.trim()
      ? {
          name: d.headName.trim(),
          role: "Department Chair",
          email: d.email.trim() || null,
          phone: d.phone.trim() || null,
          is_primary: true,
        }
      : { name: d.headName.trim(), role: "Department Chair", is_primary: true };

  await postStakeholder({
    campus_slug: campusSlug,
    stakeholder_type: "dept_head",
    organization_name: `${dept} Department`,
    department: dept,
    programs: ["Pre-Med", "Pre-Dental"],
    notes: null,
    research_data: {},
    initial_contact: initialContact,
  });
}

async function createOrg(campusSlug: string, org: OrgDraft): Promise<void> {
  const namedOfficers = org.officers.filter((o) => o.name.trim());
  if (namedOfficers.length === 0) return;
  const first = namedOfficers[0];
  const rest = namedOfficers.slice(1);

  const firstContact = {
    name: first.name.trim(),
    role: first.role || null,
    email: first.email.trim() || null,
    phone: first.phone.trim() || null,
    is_primary: true,
  };

  const created = await postStakeholder({
    campus_slug: campusSlug,
    stakeholder_type: "student_org",
    organization_name: org.orgName.trim(),
    department: null,
    programs: org.programs,
    notes: null,
    research_data: {},
    initial_contact: firstContact,
  });

  // Loop additional officers via the per-row add_contact action.
  for (const off of rest) {
    await fetch(`/api/admin/student-outreach/${created.outreach.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_contact",
        name: off.name.trim(),
        role: off.role || null,
        email: off.email.trim() || null,
        phone: off.phone.trim() || null,
        is_primary: false,
      }),
    });
  }
}

async function postStakeholder(body: Record<string, unknown>): Promise<{ outreach: { id: string } }> {
  const res = await fetch("/api/admin/student-outreach/stakeholders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "Create failed");
  }
  return data;
}
