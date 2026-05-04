"use client";

import { useEffect, useState } from "react";
import {
  STAKEHOLDER_TYPE_LABELS,
  type Campus,
  type StakeholderType,
} from "@/lib/student-outreach/types";

interface Props {
  campuses: Campus[];
  defaultCampusSlug?: string;
  onClose: () => void;
  onCreated: (outreachId: string) => void;
}

const TYPES: StakeholderType[] = ["student_org", "advisor", "dept_head", "professor"];

export function AddStakeholderModal({
  campuses,
  defaultCampusSlug,
  onClose,
  onCreated,
}: Props) {
  const [campusSlug, setCampusSlug] = useState(defaultCampusSlug ?? campuses[0]?.slug ?? "");
  const [type, setType] = useState<StakeholderType>("student_org");
  const [orgName, setOrgName] = useState("");
  const [department, setDepartment] = useState("");
  const [programs, setPrograms] = useState("pre-med, pre-pa, pre-nursing");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactInstagram, setContactInstagram] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const submit = async () => {
    setErr(null);
    if (!campusSlug) return setErr("Campus required");
    if (!orgName.trim()) return setErr("Organization / person name required");
    if (type === "professor") return setErr("Professors are added via Bulk Professor Import after granting permission. Add a Dept Head or Advisor here first.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/student-outreach/stakeholders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campus_slug: campusSlug,
          stakeholder_type: type,
          organization_name: orgName.trim(),
          department: department.trim() || null,
          programs: programs.split(",").map((s) => s.trim()).filter(Boolean),
          notes: notes.trim() || null,
          research_data: { website: website.trim() || undefined },
          initial_contact: contactName.trim()
            ? {
                name: contactName.trim(),
                role: contactRole.trim() || null,
                email: contactEmail.trim() || null,
                phone: contactPhone.trim() || null,
                instagram: contactInstagram.trim() || null,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      onCreated(data.outreach.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add stakeholder</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {err && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
          )}

          <Select label="Campus *" value={campusSlug} onChange={setCampusSlug} options={
            campuses.map((c) => ({ value: c.slug, label: c.name }))
          } />

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-600">Stakeholder type *</span>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    type === t
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {STAKEHOLDER_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
            {type === "professor" && (
              <p className="mt-1 text-xs text-amber-700">
                Professors require permission first. Add the Dept Head or Advisor, request approval, then bulk-import professors from the Campus page.
              </p>
            )}
          </div>

          <Field label={type === "advisor" || type === "professor" ? "Person / office name *" : "Organization name *"} value={orgName} onChange={setOrgName} placeholder={
            type === "student_org" ? "Berkeley Pre-Med Society" :
            type === "advisor" ? "Office of Pre-Health Advising" :
            type === "dept_head" ? "Department of Biology" :
            "Dr. Jane Smith"
          } />

          {(type === "dept_head" || type === "professor") && (
            <Field label="Department" value={department} onChange={setDepartment} placeholder="Biology" />
          )}

          <Field label="Programs (comma-separated)" value={programs} onChange={setPrograms} placeholder="pre-med, pre-pa, pre-nursing" />
          <Field label="Website" value={website} onChange={setWebsite} placeholder="https://..." />

          <hr className="my-3" />
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">First contact (optional)</p>

          <Field label="Name" value={contactName} onChange={setContactName} />
          <Field label="Role" value={contactRole} onChange={setContactRole} placeholder="President / Pre-Health Advisor / ..." />
          <Field label="Email" value={contactEmail} onChange={setContactEmail} type="email" />
          <Field label="Phone" value={contactPhone} onChange={setContactPhone} />
          <Field label="Instagram" value={contactInstagram} onChange={setContactInstagram} placeholder="@handle" />
          <Field label="Notes" value={notes} onChange={setNotes} multiline />
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting || !orgName.trim() || !campusSlug || type === "professor"}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create + open"}
          </button>
        </footer>
      </div>
    </div>
  );
}

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
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
      >
        <option value="">— select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
