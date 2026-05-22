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
import type { OutreachRow, ResearchCampusCard } from "@/lib/student-outreach/types";
import { BulkProfessorImportModal } from "./BulkProfessorImportModal";
import Select from "@/components/ui/Select";

const PROFESSOR_APPROVAL_KEY = "Email professors directly";

interface AdvisorRow {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
}

interface DeptHeadRow {
  department: string;
  headFirstName: string;
  headLastName: string;
  email: string;
  phone: string;
}

interface OrgOfficer {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
}

interface OrgDraft {
  orgName: string;
  programs: string[];
  officers: OrgOfficer[];
}

const blankAdvisor = (): AdvisorRow => ({ firstName: "", lastName: "", role: "Pre-Health Advisor", email: "", phone: "" });
const blankDeptHead = (): DeptHeadRow => ({ department: "", headFirstName: "", headLastName: "", email: "", phone: "" });
const blankOfficer = (): OrgOfficer => ({ firstName: "", lastName: "", role: "President", email: "", phone: "" });
const blankOrg = (): OrgDraft => ({
  orgName: "",
  programs: ["Pre-Med"],
  officers: [blankOfficer()],
});

type TabKey = "advisors" | "dept_heads" | "student_orgs" | "professors";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "advisors", label: "Advisors" },
  { key: "dept_heads", label: "Dept Heads" },
  { key: "student_orgs", label: "Student Orgs" },
  { key: "professors", label: "Professors" },
];

interface ProfessorTabData {
  loaded: boolean;
  deptHeads: OutreachRow[];
  advisors: OutreachRow[];
  grantedDeptHeads: OutreachRow[];
}

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

  // v8.6: Professors tab — needs a permission gate. Lazy-fetch the campus
  // stakeholder list + approvals when the admin first opens the tab.
  const [profData, setProfData] = useState<ProfessorTabData | null>(null);
  const [showProfImport, setShowProfImport] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  useEffect(() => {
    if (tab !== "professors" || profData) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/student-outreach/campuses/${campus.slug}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load campus data");
          return;
        }
        const deptHeads = (data.stakeholders_by_type?.dept_head ?? []) as OutreachRow[];
        const advisors = (data.stakeholders_by_type?.advisor ?? []) as OutreachRow[];
        const approvals = (data.approvals_by_outreach ?? {}) as Record<
          string,
          Array<{ approval_for: string; status: string }>
        >;
        const grantedDeptHeads = deptHeads.filter((d) =>
          (approvals[d.id] ?? []).some(
            (a) => a.approval_for === PROFESSOR_APPROVAL_KEY && a.status === "granted",
          ),
        );
        setProfData({ loaded: true, deptHeads, advisors, grantedDeptHeads });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => { cancelled = true; };
  }, [tab, profData, campus.slug]);

  // ── Save ────────────────────────────────────────────────────────────

  const validAdvisors = advisors.filter((a) => a.firstName.trim());
  const validDeptHeads = deptHeads.filter((d) => d.department.trim() && d.headFirstName.trim());
  const validOrgs = orgs
    .filter((o) => o.orgName.trim() && o.officers.some((off) => off.firstName.trim()))
    .map((o) => ({
      ...o,
      officers: o.officers.filter((off) => off.firstName.trim()),
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
          {tab === "professors" && (
            <ProfessorsTab
              campus={campus}
              data={profData}
              onSwitchToDeptHeads={() => setTab("dept_heads")}
              onLaunchImport={() => setShowProfImport(true)}
            />
          )}
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            {tab === "professors"
              ? "Professors use a permission-gated import below."
              : progress
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
              Close
            </button>
            {tab !== "professors" && (
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
            )}
          </div>
        </footer>
      </div>

      {showProfImport && profData && (
        <BulkProfessorImportModal
          parentCandidates={[...profData.grantedDeptHeads, ...profData.advisors]}
          defaultParentId={profData.grantedDeptHeads[0]?.id}
          onClose={() => setShowProfImport(false)}
          onCreated={async () => {
            setShowProfImport(false);
            await onSaved();
          }}
        />
      )}
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
  const onPaste = (lines: string[][]) => {
    const newRows = lines.map<AdvisorRow>((cols) => ({
      firstName: cols[0]?.trim() ?? "",
      lastName: cols[1]?.trim() ?? "",
      role: cols[2]?.trim() || "Pre-Health Advisor",
      email: cols[3]?.trim() ?? "",
      phone: cols[4]?.trim() ?? "",
    }));
    const filledExisting = rows.filter((r) => r.firstName.trim());
    setRows([...filledExisting, ...newRows, blankAdvisor()]);
  };
  return (
    <div className="space-y-2">
      <RowGridHeader columns={["First", "Last", "Role", "Email", "Phone"]} />
      {rows.map((row, i) => (
        <RowGrid5 key={i} variant="with-role" onRemove={rows.length > 1 ? () => setRows(rows.filter((_, j) => j !== i)) : undefined}>
          <Cell value={row.firstName} onChange={(v) => updateRow(rows, setRows, i, { ...row, firstName: v })} placeholder="Marcus" />
          <Cell value={row.lastName} onChange={(v) => updateRow(rows, setRows, i, { ...row, lastName: v })} placeholder="Reyes" />
          <SelectCell
            value={row.role}
            onChange={(v) => updateRow(rows, setRows, i, { ...row, role: v })}
            options={ROLES_BY_TYPE.advisor}
          />
          <Cell type="email" value={row.email} onChange={(v) => updateRow(rows, setRows, i, { ...row, email: v })} placeholder="mreyes@uh.edu" />
          <Cell value={row.phone} onChange={(v) => updateRow(rows, setRows, i, { ...row, phone: v })} placeholder="+1 832 467 2621" />
        </RowGrid5>
      ))}
      <div className="flex gap-2">
        <button
          onClick={() => setRows([...rows, blankAdvisor()])}
          className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          + Add row
        </button>
        <PasteFromSpreadsheet
          columns={["First", "Last", "Role", "Email", "Phone"]}
          onAddRows={onPaste}
        />
      </div>
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
  const onPaste = (lines: string[][]) => {
    const newRows = lines.map<DeptHeadRow>((cols) => ({
      department: cols[0]?.trim() ?? "",
      headFirstName: cols[1]?.trim() ?? "",
      headLastName: cols[2]?.trim() ?? "",
      email: cols[3]?.trim() ?? "",
      phone: cols[4]?.trim() ?? "",
    }));
    const filledExisting = rows.filter((r) => r.department.trim() || r.headFirstName.trim());
    setRows([...filledExisting, ...newRows, blankDeptHead()]);
  };
  return (
    <div className="space-y-2">
      <RowGridHeader columns={["Department", "First", "Last", "Email", "Phone"]} />
      {rows.map((row, i) => (
        <RowGrid5 key={i} variant="with-department" onRemove={rows.length > 1 ? () => setRows(rows.filter((_, j) => j !== i)) : undefined}>
          <SelectCell
            value={row.department}
            onChange={(v) => updateRow(rows, setRows, i, { ...row, department: v })}
            options={DEPARTMENTS.filter((d) => d !== OTHER)}
            placeholder="— Pick department —"
          />
          <Cell value={row.headFirstName} onChange={(v) => updateRow(rows, setRows, i, { ...row, headFirstName: v })} placeholder="Sarah" />
          <Cell value={row.headLastName} onChange={(v) => updateRow(rows, setRows, i, { ...row, headLastName: v })} placeholder="Chen" />
          <Cell type="email" value={row.email} onChange={(v) => updateRow(rows, setRows, i, { ...row, email: v })} placeholder="schen@bio.tamu.edu" />
          <Cell value={row.phone} onChange={(v) => updateRow(rows, setRows, i, { ...row, phone: v })} placeholder="+1 979 845 2721" />
        </RowGrid5>
      ))}
      <div className="flex gap-2">
        <button
          onClick={() => setRows([...rows, blankDeptHead()])}
          className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          + Add row
        </button>
        <PasteFromSpreadsheet
          columns={["Department", "First", "Last", "Email", "Phone"]}
          onAddRows={onPaste}
        />
      </div>
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

          <RowGridHeader columns={["First", "Last", "Role", "Email", "Phone"]} />
          {org.officers.map((off, j) => (
            <RowGrid5
              key={j}
              variant="with-role"
              onRemove={
                org.officers.length > 1
                  ? () => updateOrg(i, { ...org, officers: org.officers.filter((_, k) => k !== j) })
                  : undefined
              }
            >
              <Cell
                value={off.firstName}
                onChange={(v) =>
                  updateOrg(i, { ...org, officers: org.officers.map((o, k) => (k === j ? { ...o, firstName: v } : o)) })
                }
                placeholder="Sofia"
              />
              <Cell
                value={off.lastName}
                onChange={(v) =>
                  updateOrg(i, { ...org, officers: org.officers.map((o, k) => (k === j ? { ...o, lastName: v } : o)) })
                }
                placeholder="Martinez"
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
            </RowGrid5>
          ))}
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              onClick={() => updateOrg(i, { ...org, officers: [...org.officers, blankOfficer()] })}
              className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              + Officer
            </button>
            <PasteFromSpreadsheet
              columns={["First", "Last", "Role", "Email", "Phone"]}
              onAddRows={(lines) => {
                const newOfficers = lines.map<OrgOfficer>((cols) => ({
                  firstName: cols[0]?.trim() ?? "",
                  lastName: cols[1]?.trim() ?? "",
                  role: cols[2]?.trim() || "Member",
                  email: cols[3]?.trim() ?? "",
                  phone: cols[4]?.trim() ?? "",
                }));
                const filledExisting = org.officers.filter((o) => o.firstName.trim());
                updateOrg(i, {
                  ...org,
                  officers: [...filledExisting, ...newOfficers, blankOfficer()],
                });
              }}
            />
          </div>
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

// ── Professors tab (permission gate + handoff to BulkProfessorImport) ──

function ProfessorsTab({
  campus,
  data,
  onSwitchToDeptHeads,
  onLaunchImport,
}: {
  campus: ResearchCampusCard;
  data: ProfessorTabData | null;
  onSwitchToDeptHeads: () => void;
  onLaunchImport: () => void;
}) {
  if (!data?.loaded) {
    return <p className="py-6 text-center text-sm text-gray-400">Loading approvals…</p>;
  }

  // State 3 — at least one dept head with granted "Email professors directly".
  if (data.grantedDeptHeads.length > 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">✓ You can add professors</p>
          <p className="mt-1 text-xs">
            {data.grantedDeptHeads.length} department head
            {data.grantedDeptHeads.length === 1 ? " has" : "s have"} granted approval to email
            professors at {campus.name}.
          </p>
        </div>

        <div>
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
            Approved dept heads
          </p>
          <ul className="space-y-1">
            {data.grantedDeptHeads.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-gray-900">{d.organization_name}</span>
                  {d.department && <span className="ml-2 text-gray-500">{d.department}</span>}
                </span>
                <span className="text-[11px] font-medium text-emerald-700">Approved</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onLaunchImport}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Open bulk professor import →
        </button>
        <p className="text-center text-[11px] text-gray-500">
          Paste names + emails to bulk-create professor rows linked to the approved dept head.
        </p>
      </div>
    );
  }

  // State 1 — no dept heads at this campus yet.
  if (data.deptHeads.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p className="font-medium">🔒 Permission required</p>
          <p className="mt-1 text-xs leading-relaxed">
            You need department head approval before adding or emailing professors. Add a
            Department Head first, then request &ldquo;Email professors directly&rdquo; permission
            from their drawer.
          </p>
        </div>
        <ol className="space-y-1.5 px-1 text-xs text-gray-700">
          <li><strong>1.</strong> Switch to the Dept Heads tab and add a department head.</li>
          <li><strong>2.</strong> Save and close this modal.</li>
          <li><strong>3.</strong> Open that dept head&apos;s drawer and click &ldquo;Mark as asked&rdquo; on Email professors directly.</li>
          <li><strong>4.</strong> Once granted, come back here to bulk-add professors.</li>
        </ol>
        <button
          onClick={onSwitchToDeptHeads}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Switch to Dept Heads tab →
        </button>
      </div>
    );
  }

  // State 2 — dept heads exist but none have granted approval.
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <p className="font-medium">🔒 Permission required</p>
        <p className="mt-1 text-xs leading-relaxed">
          You have {data.deptHeads.length} dept head
          {data.deptHeads.length === 1 ? "" : "s"} at {campus.name}, but none have granted approval
          to email professors yet.
        </p>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
          Dept heads at this campus
        </p>
        <ul className="space-y-1">
          {data.deptHeads.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-gray-900">{d.organization_name}</span>
                {d.department && <span className="ml-2 text-gray-500">{d.department}</span>}
              </span>
              <span className="text-[11px] font-medium text-gray-500">Not approved</span>
            </li>
          ))}
        </ul>
      </div>

      <ol className="space-y-1.5 px-1 text-xs text-gray-700">
        <li><strong>1.</strong> Close this modal.</li>
        <li><strong>2.</strong> Open a dept head&apos;s drawer from the Stakeholders list.</li>
        <li><strong>3.</strong> In the Permissions section, click &ldquo;Mark as asked&rdquo; on Email professors directly.</li>
        <li><strong>4.</strong> When granted, come back here to bulk-add professors.</li>
      </ol>
    </div>
  );
}

// ── Paste-from-spreadsheet helper ────────────────────────────────────────
//
// Excel and Google Sheets copy ranges as tab-separated values, so a paste
// into this textarea can be split on \n + \t to reconstruct rows. Empty
// lines are dropped.

function PasteFromSpreadsheet({
  columns,
  onAddRows,
}: {
  columns: string[];
  onAddRows: (lines: string[][]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.split("\t"))
    .filter((cols) => cols.some((c) => c.trim()));

  const reset = () => { setText(""); setOpen(false); };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        title="Paste rows copied from Excel or Google Sheets."
      >
        Paste from spreadsheet
      </button>
    );
  }

  return (
    <div className="w-full rounded-md border border-gray-200 bg-gray-50 p-3">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        Paste from Excel or Google Sheets
      </p>
      <p className="mb-2 text-[11px] text-gray-500">
        Columns: <span className="font-medium text-gray-700">{columns.join(" | ")}</span>{" "}
        (tab-separated, one row per line)
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        autoFocus
        placeholder={"Marcus Reyes\tPre-Health Advisor\tmreyes@uh.edu\t+18324672621"}
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs focus:border-gray-400 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-gray-500">
          {lines.length === 0 ? "Paste rows above" : `${lines.length} row${lines.length === 1 ? "" : "s"} ready`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => { onAddRows(lines); reset(); }}
            disabled={lines.length === 0}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Add {lines.length || ""} row{lines.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row primitives ───────────────────────────────────────────────────────

// v8.10.4: native <select> chevrons reserve ~16-20px on the right.
// "Pre-Health Advisor" is wider than the equal-share grid-cols-5 cell,
// so the role text used to truncate AND the chevron got clipped.
// Custom column templates per layout fix it: Role/Department get the
// width they need, Email gets the remaining flex space.
const COLS_WITH_ROLE = "grid-cols-[80px_80px_160px_minmax(0,1fr)_140px]";
const COLS_WITH_DEPT = "grid-cols-[140px_80px_80px_minmax(0,1fr)_140px]";

function pickColsClass(columns: string[]): string {
  if (columns.length !== 5) return "grid-cols-4";
  if (columns.includes("Role")) return COLS_WITH_ROLE;
  if (columns.includes("Department")) return COLS_WITH_DEPT;
  return "grid-cols-5";
}

function RowGridHeader({ columns }: { columns: string[] }) {
  return (
    <div className={`grid gap-2 px-1 pb-1 ${pickColsClass(columns)}`}>
      {columns.map((c) => (
        <p key={c} className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          {c}
        </p>
      ))}
    </div>
  );
}

function RowGrid5({
  children,
  variant,
  onRemove,
}: {
  children: ReactNode;
  /** Drives column widths to match the corresponding RowGridHeader. */
  variant: "with-role" | "with-department";
  onRemove?: () => void;
}) {
  const cols = variant === "with-department" ? COLS_WITH_DEPT : COLS_WITH_ROLE;
  return (
    <div className="flex items-center gap-2">
      <div className={`grid flex-1 gap-2 ${cols}`}>{children}</div>
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
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      size="sm"
      options={
        placeholder
          ? [{ value: "", label: placeholder }, ...options.map((o) => ({ value: o, label: o }))]
          : options.map((o) => ({ value: o, label: o }))
      }
    />
  );
}

function updateRow<T>(rows: T[], setRows: (r: T[]) => void, i: number, next: T) {
  setRows(rows.map((r, idx) => (idx === i ? next : r)));
}

// ── API helpers ──────────────────────────────────────────────────────────

async function createAdvisor(campusSlug: string, a: AdvisorRow): Promise<void> {
  await postStakeholder({
    campus_slug: campusSlug,
    stakeholder_type: "advisor",
    department: null,
    programs: ["Pre-Med"],
    notes: null,
    research_data: {},
    initial_contact: {
      first_name: a.firstName.trim(),
      last_name: a.lastName.trim(),
      role: a.role || null,
      email: a.email.trim() || null,
      phone: a.phone.trim() || null,
      is_primary: true,
    },
  });
}

async function createDeptHead(campusSlug: string, d: DeptHeadRow): Promise<void> {
  const dept = d.department.trim();
  await postStakeholder({
    campus_slug: campusSlug,
    stakeholder_type: "dept_head",
    department: dept,
    programs: ["Pre-Med", "Pre-Dental"],
    notes: null,
    research_data: {},
    initial_contact: {
      first_name: d.headFirstName.trim(),
      last_name: d.headLastName.trim(),
      role: "Department Chair",
      email: d.email.trim() || null,
      phone: d.phone.trim() || null,
      is_primary: true,
    },
  });
}

async function createOrg(campusSlug: string, org: OrgDraft): Promise<void> {
  const namedOfficers = org.officers.filter((o) => o.firstName.trim());
  if (namedOfficers.length === 0) return;
  const first = namedOfficers[0];
  const rest = namedOfficers.slice(1);

  const created = await postStakeholder({
    campus_slug: campusSlug,
    stakeholder_type: "student_org",
    organization_name: org.orgName.trim(),
    department: null,
    programs: org.programs,
    notes: null,
    research_data: {},
    initial_contact: {
      first_name: first.firstName.trim(),
      last_name: first.lastName.trim(),
      role: first.role || null,
      email: first.email.trim() || null,
      phone: first.phone.trim() || null,
      is_primary: true,
    },
  });

  for (const off of rest) {
    await fetch(`/api/admin/student-outreach/${created.outreach.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_contact",
        first_name: off.firstName.trim(),
        last_name: off.lastName.trim(),
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
