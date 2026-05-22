"use client";

/**
 * Add Stakeholder modal — v2.
 *
 * Two-step:
 *   1. Pick stakeholder type. Picking "Professor" replaces the form
 *      with a redirect-screen explaining the permission-gated workflow.
 *   2. Fill the type-specific form. Structured selects + "Other" → free
 *      text where possible, so we get clean data for filtering/reporting.
 *
 * Per-type form differences:
 *   student_org   multi-officer encouragement, multi programs
 *   advisor       single contact, single program
 *   dept_head     department select, multi programs, "ask for prof
 *                 permission?" checkbox that auto-creates an approval
 *   professor     redirect screen — created via Bulk Import only
 */

import { useEffect, useMemo, useState } from "react";
import {
  STAKEHOLDER_TYPE_LABELS,
  type Campus,
  type StakeholderType,
} from "@/lib/student-outreach/types";
import {
  DEPARTMENTS,
  OTHER,
  PROGRAMS,
  ROLES_BY_TYPE,
  singleProgram,
  supportsMultipleContacts,
} from "@/lib/student-outreach/presets";
import StyledSelect from "@/components/ui/Select";

interface Props {
  campuses: Campus[];
  defaultCampusSlug?: string;
  onClose: () => void;
  onCreated: (outreachId: string) => void;
}

const TYPES: StakeholderType[] = ["student_org", "advisor", "dept_head", "professor"];

const TYPE_SUBHEADS: Record<StakeholderType, string> = {
  student_org: "Pre-health societies, pre-med clubs, etc.",
  advisor: "Pre-health advisor, career advisor, academic advisor",
  dept_head: "Dept chair, dean — gates access to professors",
  professor: "Permission required first",
};

/** Per-type "where to find them" hint. Shown under the type buttons. */
const TYPE_FINDER_HINTS: Record<StakeholderType, string> = {
  student_org: "Where to find: Google '[campus] pre-med society' or 'pre-health club'. Most have a website + Instagram.",
  advisor: "Where to find: Google '[campus] pre-health advising'. The college's pre-health page usually lists names + emails.",
  dept_head: "Where to find: visit the department's faculty page. Look for 'Department Chair' or 'Director of Undergraduate Studies'.",
  professor: "Permission required first. Add a Department Head, request permission, then bulk-import professors.",
};

interface OfficerDraft {
  /** Optional formal title (e.g. "Dr."). Only surfaced for dept_head + professor. */
  title: string;
  firstName: string;
  lastName: string;
  role: string;
  roleOther: string;
  email: string;
  phone: string;
}

const blankOfficer = (): OfficerDraft => ({
  title: "",
  firstName: "",
  lastName: "",
  role: "",
  roleOther: "",
  email: "",
  phone: "",
});

export function AddStakeholderModal({
  campuses,
  defaultCampusSlug,
  onClose,
  onCreated,
}: Props) {
  const [campusSlug, setCampusSlug] = useState(defaultCampusSlug ?? campuses[0]?.slug ?? "");
  const [type, setType] = useState<StakeholderType | null>(null);
  const [orgName, setOrgName] = useState("");
  const [website, setWebsite] = useState("");

  // Department (dept_head + professor)
  const [department, setDepartment] = useState("");
  const [departmentOther, setDepartmentOther] = useState("");

  // Programs
  const [programs, setPrograms] = useState<string[]>([]);
  const [programsOther, setProgramsOther] = useState("");

  // Contacts: orgs use officers[], others use a single contact
  const [singleContact, setSingleContact] = useState<OfficerDraft>(blankOfficer());
  const [officers, setOfficers] = useState<OfficerDraft[]>([blankOfficer()]);

  // Dept head: pre-emptive professor approval
  const [requestProfApproval, setRequestProfApproval] = useState(false);

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // v8.9: prefill "Dr." for dept_head + professor types, but only if the
  // admin hasn't already typed something. Won't clobber a custom value.
  useEffect(() => {
    if (type !== "dept_head" && type !== "professor") return;
    setSingleContact((c) => (c.title.trim() ? c : { ...c, title: "Dr." }));
  }, [type]);

  const programOptions = useMemo(() => PROGRAMS.filter((p) => p !== OTHER), []);

  const submit = async () => {
    setErr(null);
    if (!type) return setErr("Pick a stakeholder type");
    if (type === "professor") return; // shouldn't reach here — redirect screen handles it
    if (!campusSlug) return setErr("Campus required");
    if (!orgName.trim()) return setErr(orgNameLabel(type) + " required");

    const programsValue = programs.includes(OTHER) && programsOther.trim()
      ? [...programs.filter((p) => p !== OTHER), programsOther.trim()]
      : programs.filter((p) => p !== OTHER);

    const departmentValue =
      department === OTHER ? departmentOther.trim() : department.trim() || null;

    const initialContacts = supportsMultipleContacts(type)
      ? officers.filter((o) => o.firstName.trim()).map(officerToPayload)
      : (singleContact.firstName.trim() ? [officerToPayload(singleContact)] : []);

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/student-outreach/stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campus_slug: campusSlug,
          stakeholder_type: type,
          organization_name: orgName.trim(),
          department: departmentValue,
          programs: programsValue,
          notes: notes.trim() || null,
          research_data: { website: website.trim() || undefined },
          initial_contact: initialContacts[0] ?? null,
          request_professor_approval: type === "dept_head" && requestProfApproval,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      const newId = data.outreach.id;

      // Add any additional officers for orgs (the API only takes one
      // initial contact; loop for the rest).
      if (initialContacts.length > 1) {
        for (const officer of initialContacts.slice(1)) {
          await fetch(`/api/admin/student-outreach/${newId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "add_contact", ...officer }),
          });
        }
      }

      onCreated(newId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 1: campus picker ────────────────────────────────────────────

  const campusStep = (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Step 1 — Pick a campus
      </p>
      <StyledSelect
        value={campusSlug}
        onChange={(val) => setCampusSlug(val)}
        placeholder="— select a campus —"
        size="sm"
        options={[
          { value: "", label: "— select a campus —" },
          ...campuses.map((c) => ({ value: c.slug, label: c.name })),
        ]}
      />
    </div>
  );

  // ── Step 2: type picker (with "where to find" hint) ────────────────

  const typeStep = (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Step 2 — Who are you adding?
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {TYPES.map((t) => {
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              title={TYPE_FINDER_HINTS[t]}
              className={`rounded-lg border p-3 text-left transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <p className={`text-sm font-medium ${active ? "text-white" : "text-gray-900"}`}>
                {STAKEHOLDER_TYPE_LABELS[t]}
              </p>
              <p className={`mt-0.5 text-xs ${active ? "text-gray-300" : "text-gray-500"}`}>
                {TYPE_SUBHEADS[t]}
              </p>
            </button>
          );
        })}
      </div>
      {type && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-900">
          💡 {TYPE_FINDER_HINTS[type]}
        </p>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add stakeholder</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

          {campusStep}

          {campusSlug && typeStep}

          {type === "professor" && <ProfessorRedirect onPickDeptHead={() => setType("dept_head")} onPickAdvisor={() => setType("advisor")} />}

          {type && type !== "professor" && campusSlug && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Step 3 — Fill in the details
              </p>

              <Field
                label={`${orgNameLabel(type)} *`}
                value={orgName}
                onChange={setOrgName}
                placeholder={orgNamePlaceholder(type)}
              />

              {/* Department — dept_head only */}
              {type === "dept_head" && (
                <SelectWithOther
                  label="Department *"
                  value={department}
                  otherValue={departmentOther}
                  onChange={(v) => setDepartment(v)}
                  onOtherChange={setDepartmentOther}
                  options={DEPARTMENTS}
                />
              )}

              {/* Programs */}
              {singleProgram(type) ? (
                <Select
                  label="Program *"
                  value={programs[0] ?? ""}
                  onChange={(v) => setPrograms(v ? [v] : [])}
                  options={programOptions.map((p) => ({ value: p, label: p }))}
                />
              ) : (
                <MultiSelect
                  label="Programs (pick all that apply)"
                  values={programs}
                  onToggle={(v) => {
                    setPrograms((cur) => cur.includes(v) ? cur.filter((p) => p !== v) : [...cur, v]);
                  }}
                  options={programOptions}
                />
              )}
              {programs.includes(OTHER) && (
                <Field
                  label="Other program(s)"
                  value={programsOther}
                  onChange={setProgramsOther}
                  placeholder="Comma-separated if more than one"
                />
              )}

              <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." />

              {/* Dept head: professor approval shortcut */}
              {type === "dept_head" && (
                <div className="rounded-md border border-amber-100 bg-amber-50/60 p-3">
                  <p className="text-xs text-amber-900">
                    💡 Department heads commonly gate access to professors. If you plan to ask
                    this dept head for permission to contact their faculty, check the box and
                    we'll auto-track the approval request with a 5-day follow-up.
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-sm text-amber-900">
                    <input
                      type="checkbox"
                      checked={requestProfApproval}
                      onChange={(e) => setRequestProfApproval(e.target.checked)}
                    />
                    Plan to ask for permission to contact professors
                  </label>
                </div>
              )}

              <hr className="my-3 border-gray-100" />

              {/* Contacts */}
              {supportsMultipleContacts(type) ? (
                <OfficersBuilder
                  type={type}
                  officers={officers}
                  setOfficers={setOfficers}
                />
              ) : (
                <SingleContactForm
                  type={type}
                  contact={singleContact}
                  setContact={setSingleContact}
                />
              )}

              <Field label="Notes" value={notes} onChange={setNotes} multiline />
            </>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {type !== "professor" && (
            <button
              onClick={submit}
              disabled={submitting || !type || !orgName.trim() || !campusSlug}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create + open"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

// ── Professor redirect screen ────────────────────────────────────────────

function ProfessorRedirect({
  onPickDeptHead,
  onPickAdvisor,
}: {
  onPickDeptHead: () => void;
  onPickAdvisor: () => void;
}) {
  return (
    <div className="rounded-md border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900 space-y-3">
      <p className="font-medium">Professors require permission first.</p>
      <p>
        We don't contact professors directly until a Department Head or Advisor has granted
        permission. The right path is:
      </p>
      <ol className="ml-5 list-decimal space-y-1">
        <li>Add the Department Head (or Advisor) for the relevant department.</li>
        <li>Build the relationship and request approval to contact professors.</li>
        <li>Once granted, use <strong>Bulk Import Professors</strong> on the campus page.</li>
      </ol>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onPickDeptHead}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Department Head
        </button>
        <button
          onClick={onPickAdvisor}
          className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Add Advisor instead
        </button>
      </div>
    </div>
  );
}

// ── Officer builder (student orgs) ───────────────────────────────────────

function OfficersBuilder({
  type,
  officers,
  setOfficers,
}: {
  type: StakeholderType;
  officers: OfficerDraft[];
  setOfficers: (next: OfficerDraft[]) => void;
}) {
  const update = (idx: number, patch: Partial<OfficerDraft>) => {
    setOfficers(officers.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };
  const remove = (idx: number) => setOfficers(officers.filter((_, i) => i !== idx));
  const add = () => setOfficers([...officers, blankOfficer()]);

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
        💡 <strong>Add multiple officers.</strong> Most student orgs route info through whichever
        officer is online first — President, VP, and the outreach/events officer at minimum.
        We'll email each of them so we don't rely on one inbox.
      </div>

      {officers.map((o, i) => (
        <div key={i} className="space-y-2 rounded-md border border-gray-100 bg-white p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-700">Officer {i + 1}{i === 0 ? " (primary)" : ""}</p>
            {officers.length > 1 && (
              <button
                onClick={() => remove(i)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="First name" value={o.firstName} onChange={(v) => update(i, { firstName: v })} />
            <Field label="Last name" value={o.lastName} onChange={(v) => update(i, { lastName: v })} />
          </div>
          <Select
            label="Role"
            value={o.role}
            onChange={(v) => update(i, { role: v })}
            options={ROLES_BY_TYPE[type].map((r) => ({ value: r, label: r }))}
          />
          {o.role === OTHER && (
            <Field
              label="Other role"
              value={o.roleOther}
              onChange={(v) => update(i, { roleOther: v })}
            />
          )}
          <Field label="Email" value={o.email} onChange={(v) => update(i, { email: v })} type="email" />
          <Field label="Phone" value={o.phone} onChange={(v) => update(i, { phone: v })} />
        </div>
      ))}
      <button
        onClick={add}
        className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 w-full"
      >
        + Add another officer
      </button>
    </div>
  );
}

// ── Single contact form (advisor / dept_head) ───────────────────────────

function SingleContactForm({
  type,
  contact,
  setContact,
}: {
  type: StakeholderType;
  contact: OfficerDraft;
  setContact: (next: OfficerDraft) => void;
}) {
  const update = (patch: Partial<OfficerDraft>) => setContact({ ...contact, ...patch });
  const showTitle = type === "dept_head" || type === "professor";
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Contact</p>
      {showTitle && (
        <Field
          label="Title"
          value={contact.title}
          onChange={(v) => update({ title: v })}
          placeholder="Dr."
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <Field label="First name" value={contact.firstName} onChange={(v) => update({ firstName: v })} />
        <Field label="Last name" value={contact.lastName} onChange={(v) => update({ lastName: v })} />
      </div>
      <Select
        label="Role"
        value={contact.role}
        onChange={(v) => update({ role: v })}
        options={ROLES_BY_TYPE[type].map((r) => ({ value: r, label: r }))}
      />
      {contact.role === OTHER && (
        <Field label="Other role" value={contact.roleOther} onChange={(v) => update({ roleOther: v })} />
      )}
      <Field label="Email" value={contact.email} onChange={(v) => update({ email: v })} type="email" />
      <Field label="Phone" value={contact.phone} onChange={(v) => update({ phone: v })} />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function officerToPayload(o: OfficerDraft) {
  return {
    title: o.title.trim() || null,
    first_name: o.firstName.trim(),
    last_name: o.lastName.trim(),
    role: (o.role === OTHER ? o.roleOther.trim() : o.role) || null,
    email: o.email.trim() || null,
    phone: o.phone.trim() || null,
    is_primary: false,
  };
}

function orgNameLabel(type: StakeholderType): string {
  switch (type) {
    case "student_org": return "Organization name";
    case "advisor": return "Office / advisor name";
    case "dept_head": return "Office / department name";
    case "professor": return "Professor name";
  }
}

function orgNamePlaceholder(type: StakeholderType): string {
  switch (type) {
    case "student_org": return "Berkeley Pre-Med Society";
    case "advisor": return "Office of Pre-Health Advising";
    case "dept_head": return "Department of Biology";
    case "professor": return "Dr. Jane Smith";
  }
}

// ── UI primitives ────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = "text", multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
        />
      )}
    </label>
  );
}

function Select({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <StyledSelect
      label={label}
      value={value}
      onChange={onChange}
      placeholder="— select —"
      size="sm"
      options={[
        { value: "", label: "— select —" },
        ...options,
      ]}
    />
  );
}

function SelectWithOther({
  label, value, otherValue, onChange, onOtherChange, options,
}: {
  label: string;
  value: string;
  otherValue: string;
  onChange: (v: string) => void;
  onOtherChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Select
        label={label}
        value={value}
        onChange={onChange}
        options={options.map((o) => ({ value: o, label: o }))}
      />
      {value === OTHER && (
        <Field label="Other" value={otherValue} onChange={onOtherChange} />
      )}
    </div>
  );
}

function MultiSelect({
  label, values, onToggle, options,
}: {
  label: string;
  values: string[];
  onToggle: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {o}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onToggle(OTHER)}
          className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
            values.includes(OTHER)
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {OTHER}
        </button>
      </div>
    </div>
  );
}
