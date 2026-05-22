"use client";

/**
 * Bulk Professor Import.
 *
 * Used after a dept_head/advisor row has obtained permission. Admin pastes
 * names (and optionally emails) and the modal creates one professor row
 * per entry under the parent's campus + department, all linked back via
 * permission_dependency_id.
 *
 * Supported paste formats (one per line):
 *   Jane Doe
 *   Jane Doe <jane@uni.edu>
 *   Jane Doe, jane@uni.edu
 *   Jane Doe, jane@uni.edu, Professor of Biology
 */

import { useEffect, useMemo, useState } from "react";
import type { OutreachRow } from "@/lib/student-outreach/types";
import Select from "@/components/ui/Select";

interface Props {
  parentCandidates: OutreachRow[]; // dept_head and advisor rows in the same campus
  defaultParentId?: string;
  onClose: () => void;
  onCreated: (count: number) => void;
}

interface ParsedEntry {
  name: string;
  email: string | null;
  role: string | null;
  ok: boolean;
  reason?: string;
}

// v8.7: this modal only opens once a dept_head has been granted "Email
// professors directly" — so every imported professor inherits direct
// permission. The earlier per-import permission picker (Via Dept / Via
// Listserv / Direct) was redundant under the simplified binary model.
const IMPORT_PERMISSION = "granted_direct" as const;

export function BulkProfessorImportModal({
  parentCandidates,
  defaultParentId,
  onClose,
  onCreated,
}: Props) {
  const [parentId, setParentId] = useState(defaultParentId ?? parentCandidates[0]?.id ?? "");
  const [department, setDepartment] = useState("");
  const [paste, setPaste] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    skipped: Array<{ name: string; reason: string }>;
    errors: Array<{ index: number; reason: string }>;
  } | null>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Pre-fill department from parent if available.
  const parent = parentCandidates.find((p) => p.id === parentId);
  useEffect(() => {
    if (parent?.department && !department) setDepartment(parent.department);
  }, [parent, department]);

  const parsed = useMemo<ParsedEntry[]>(() => parseEntries(paste), [paste]);
  const validCount = parsed.filter((p) => p.ok).length;

  const submit = async () => {
    setErr(null);
    if (!parentId) return setErr("Parent (dept head/advisor) required");
    if (validCount === 0) return setErr("No valid entries to import");

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/student-outreach/bulk-professors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_outreach_id: parentId,
          permission: IMPORT_PERMISSION,
          department: department.trim() || null,
          entries: parsed.filter((p) => p.ok).map((p) => ({
            name: p.name,
            email: p.email,
            role: p.role,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult({
        created: data.created_count ?? 0,
        skipped: data.skipped ?? [],
        errors: data.parse_errors ?? [],
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Bulk import professors</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Creates one professor row per valid entry, linked to the chosen parent's permission.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">
            <span aria-hidden>×</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {err && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
          )}

          {result ? (
            <div className="space-y-2">
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Created <strong>{result.created}</strong> professor{result.created === 1 ? "" : "s"}.
              </p>
              {result.skipped.length > 0 && (
                <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Skipped {result.skipped.length}:
                  <ul className="mt-1 list-disc pl-4">
                    {result.skipped.map((s, i) => (
                      <li key={i}>{s.name} — {s.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-800">
                  Parse errors on {result.errors.length} line(s):
                  <ul className="mt-1 list-disc pl-4">
                    {result.errors.map((e, i) => (
                      <li key={i}>Line {e.index + 1}: {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <Select
                label="Parent (dept head / advisor) *"
                value={parentId}
                onChange={(val) => setParentId(val)}
                placeholder={parentCandidates.length === 0 ? "No eligible parents in this campus" : "Select parent..."}
                size="sm"
                options={parentCandidates.map((p) => ({
                  value: p.id,
                  label: `${p.organization_name}${p.department ? ` (${p.department})` : ""} — ${p.stakeholder_type}`,
                }))}
              />

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">Department</span>
                <input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Biology"
                  className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-600">
                  Paste names + emails (one per line)
                </span>
                <textarea
                  value={paste}
                  onChange={(e) => setPaste(e.target.value)}
                  rows={10}
                  placeholder={[
                    "Jane Doe <jane@uni.edu>",
                    "John Roe, john@uni.edu, Professor",
                    "Pat Lee  pat@uni.edu",
                  ].join("\n")}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-xs focus:border-gray-400 focus:outline-none"
                />
              </label>

              {parsed.length > 0 && (
                <div className="rounded-md border border-gray-100 bg-gray-50 p-3 text-xs">
                  <p className="mb-2 font-medium text-gray-700">
                    Preview: {validCount} valid · {parsed.length - validCount} invalid
                  </p>
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {parsed.map((p, i) => (
                      <li
                        key={i}
                        className={p.ok ? "text-gray-700" : "text-red-600"}
                      >
                        {i + 1}. {p.name} {p.email ? `<${p.email}>` : ""}
                        {p.role ? ` — ${p.role}` : ""}
                        {!p.ok && p.reason && <em className="ml-1">({p.reason})</em>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          {result ? (
            <button
              onClick={() => { onCreated(result.created); onClose(); }}
              className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={submitting}
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || validCount === 0 || !parentId}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {submitting ? "Creating…" : `Create ${validCount} professor${validCount === 1 ? "" : "s"}`}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function parseEntries(text: string): ParsedEntry[] {
  return text
    .split("\n")
    .map((raw) => raw.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseOne(line));
}

function parseOne(line: string): ParsedEntry {
  // 1) "Name <email>"
  const angle = line.match(/^(.+?)\s*<\s*([^>\s]+)\s*>(.*)$/);
  if (angle) {
    const name = angle[1].trim();
    const email = angle[2].trim();
    const rest = angle[3].replace(/^[,\s-]+/, "").trim() || null;
    return validate({ name, email, role: rest });
  }

  // 2) Comma-separated: "Name, email[, role]"
  if (line.includes(",")) {
    const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
    const name = parts[0] ?? "";
    const email = (parts[1] ?? "").includes("@") ? parts[1] : null;
    const role = email ? parts.slice(2).join(", ") || null : parts.slice(1).join(", ") || null;
    return validate({ name, email, role });
  }

  // 3) Whitespace-separated with embedded email anywhere
  const emailMatch = line.match(/[^\s,]+@[^\s,]+/);
  if (emailMatch) {
    const email = emailMatch[0];
    const name = line.replace(email, "").trim().replace(/[,\s-]+$/, "");
    return validate({ name, email, role: null });
  }

  // 4) Name only
  return validate({ name: line, email: null, role: null });
}

function validate(p: { name: string; email: string | null; role: string | null }): ParsedEntry {
  if (!p.name) return { ...p, ok: false, reason: "missing name" };
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
    return { ...p, ok: false, reason: "invalid email" };
  }
  return { ...p, ok: true };
}
