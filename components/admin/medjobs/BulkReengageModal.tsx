"use client";

/**
 * BulkReengageModal — bulk re-engagement launcher for Follow-up tab.
 *
 * Shows:
 *   - Header with prospect count
 *   - Summary of valid/invalid rows
 *   - Prospects list (scrollable, clickable to preview)
 *   - Personalized email/call preview by day for selected prospect
 *   - Launch button
 *
 * Uses the /api/admin/student-outreach/bulk-reengage endpoint:
 *   - dry_run=true for preview
 *   - dry_run=false for execution
 */

import { useEffect, useState } from "react";
import {
  reengagementIntroEmail,
  reengagementFinalEmail,
  reengagementCallScript,
  substituteVars,
  type TemplateContext,
} from "@/lib/student-outreach/templates";

interface ProspectPreview {
  id: string;
  organization_name: string;
  campus_name: string;
  stakeholder_type: string | null;
  email: string | null;
  first_name: string | null;
  valid: boolean;
  skip_reason: string | null;
}

// Per-prospect edits (subject/body/script can be customized)
interface ProspectEdits {
  day_0_subject: string;
  day_0_body: string;
  day_3_script: string;
  day_7_subject: string;
  day_7_body: string;
}

interface Props {
  outreachIds: string[];
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

export function BulkReengageModal({ outreachIds, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<"day_0" | "day_3" | "day_7">("day_0");

  // Preview data
  const [prospects, setProspects] = useState<ProspectPreview[]>([]);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  // Selected prospect for email preview
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);

  // Editable templates per prospect (keyed by prospect ID)
  const [prospectEdits, setProspectEdits] = useState<Map<string, ProspectEdits>>(new Map());

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Helper to generate default edits for a prospect
  const generateDefaultEdits = (prospect: ProspectPreview): ProspectEdits => {
    const validTypes = ["student_org", "advisor", "professor", "dept_head"];
    const stakeholderType = validTypes.includes(prospect.stakeholder_type ?? "")
      ? (prospect.stakeholder_type as "student_org" | "advisor" | "professor" | "dept_head")
      : "advisor";

    const ctx: TemplateContext = {
      stakeholder_type: stakeholderType,
      organization_name: prospect.organization_name,
      campus_name: prospect.campus_name,
      admin_first_name: "Graize",
    };

    const vars = {
      salutation: prospect.first_name ?? "there",
      first_name: prospect.first_name ?? undefined,
      organization_name: prospect.organization_name,
      campus_name: prospect.campus_name,
      admin_first_name: "Graize",
    };

    const day0 = reengagementIntroEmail(ctx);
    const day7 = reengagementFinalEmail(ctx);
    const day3Call = reengagementCallScript(ctx);

    return {
      day_0_subject: substituteVars(day0.subject, vars),
      day_0_body: substituteVars(day0.body, vars),
      day_3_script: substituteVars(day3Call.script, vars),
      day_7_subject: substituteVars(day7.subject, vars),
      day_7_body: substituteVars(day7.body, vars),
    };
  };

  // Fetch preview on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/student-outreach/bulk-reengage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outreach_ids: outreachIds, dry_run: true }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Failed to load preview");
          return;
        }
        const prospectsList = (data.prospects ?? []) as ProspectPreview[];
        setProspects(prospectsList);
        setValidCount(data.valid ?? 0);
        setInvalidCount(data.invalid ?? 0);

        // Initialize edits for all valid prospects
        const editsMap = new Map<string, ProspectEdits>();
        for (const p of prospectsList) {
          if (p.valid) {
            editsMap.set(p.id, generateDefaultEdits(p));
          }
        }
        setProspectEdits(editsMap);

        // Auto-select first valid prospect for preview
        const firstValid = prospectsList.find((p) => p.valid);
        if (firstValid) setSelectedProspectId(firstValid.id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [outreachIds]);

  // Update a specific field for the selected prospect
  const updateEdit = (field: keyof ProspectEdits, value: string) => {
    if (!selectedProspectId) return;
    setProspectEdits((prev) => {
      const next = new Map(prev);
      const current = next.get(selectedProspectId);
      if (current) {
        next.set(selectedProspectId, { ...current, [field]: value });
      }
      return next;
    });
  };

  // Helper to escape regex special characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Apply current prospect's edits to all other valid prospects
  const applyToAll = () => {
    if (!selectedProspectId) return;
    const currentEdits = prospectEdits.get(selectedProspectId);
    if (!currentEdits) return;

    // Move lookup outside the loop (fix #4)
    const selectedProspect = prospects.find((pr) => pr.id === selectedProspectId);
    if (!selectedProspect) return;

    const selectedVars = {
      salutation: selectedProspect.first_name ?? "there",
      organization_name: selectedProspect.organization_name,
      campus_name: selectedProspect.campus_name,
    };

    setProspectEdits((prev) => {
      const next = new Map(prev);
      // For each valid prospect, apply the current template but re-personalize
      for (const p of prospects) {
        if (p.valid && p.id !== selectedProspectId) {
          // Re-substitute variables for this prospect while keeping the edited structure
          const vars = {
            salutation: p.first_name ?? "there",
            organization_name: p.organization_name,
            campus_name: p.campus_name,
          };

          let day0Subject = currentEdits.day_0_subject;
          let day0Body = currentEdits.day_0_body;
          let day3Script = currentEdits.day_3_script;
          let day7Subject = currentEdits.day_7_subject;
          let day7Body = currentEdits.day_7_body;

          // Replace organization name
          if (selectedVars.organization_name !== vars.organization_name) {
            const regex = new RegExp(escapeRegex(selectedVars.organization_name), 'g');
            day0Subject = day0Subject.replace(regex, vars.organization_name);
            day0Body = day0Body.replace(regex, vars.organization_name);
            day3Script = day3Script.replace(regex, vars.organization_name);
            day7Subject = day7Subject.replace(regex, vars.organization_name);
            day7Body = day7Body.replace(regex, vars.organization_name);
          }

          // Replace campus name
          if (selectedVars.campus_name !== vars.campus_name) {
            const regex = new RegExp(escapeRegex(selectedVars.campus_name), 'g');
            day0Subject = day0Subject.replace(regex, vars.campus_name);
            day0Body = day0Body.replace(regex, vars.campus_name);
            day3Script = day3Script.replace(regex, vars.campus_name);
            day7Subject = day7Subject.replace(regex, vars.campus_name);
            day7Body = day7Body.replace(regex, vars.campus_name);
          }

          // Replace salutation with common greeting patterns (fix #1 and #3)
          // Matches: Hi/Hello/Dear {name}, or Hi/Hello/Dear {name}
          if (selectedVars.salutation !== vars.salutation) {
            const greetings = ["Hi", "Hello", "Dear", "Hey"];
            for (const greeting of greetings) {
              // With comma
              const regexWithComma = new RegExp(
                `${greeting} ${escapeRegex(selectedVars.salutation)},`,
                'g'
              );
              day0Body = day0Body.replace(regexWithComma, `${greeting} ${vars.salutation},`);
              day7Body = day7Body.replace(regexWithComma, `${greeting} ${vars.salutation},`);

              // Without comma (at end of line or before newline)
              const regexNoComma = new RegExp(
                `${greeting} ${escapeRegex(selectedVars.salutation)}(?=\\n|$)`,
                'g'
              );
              day0Body = day0Body.replace(regexNoComma, `${greeting} ${vars.salutation}`);
              day7Body = day7Body.replace(regexNoComma, `${greeting} ${vars.salutation}`);
            }
          }

          next.set(p.id, {
            day_0_subject: day0Subject,
            day_0_body: day0Body,
            day_3_script: day3Script,
            day_7_subject: day7Subject,
            day_7_body: day7Body,
          });
        }
      }
      return next;
    });
  };

  // Get current prospect's edits (or generated preview)
  const currentEdits = selectedProspectId ? prospectEdits.get(selectedProspectId) : null;

  // Launch re-engagement
  const handleLaunch = async () => {
    if (validCount === 0) return;
    setLaunching(true);
    setError(null);
    try {
      // Convert Map to plain object for JSON serialization
      const customTemplates: Record<string, ProspectEdits> = {};
      for (const [id, edits] of prospectEdits) {
        customTemplates[id] = edits;
      }

      const res = await fetch("/api/admin/student-outreach/bulk-reengage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outreach_ids: outreachIds,
          dry_run: false,
          custom_templates: customTemplates,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Launch failed");
        return;
      }
      await onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setLaunching(false);
    }
  };

  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !launching) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, launching]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const validProspects = prospects.filter((p) => p.valid);
  const invalidProspects = prospects.filter((p) => !p.valid);

  // Get selected prospect
  const selectedProspect = selectedProspectId
    ? prospects.find((p) => p.id === selectedProspectId)
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Launch Re-engagement Sequence
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {outreachIds.length} prospect{outreachIds.length === 1 ? "" : "s"} selected
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={launching}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Close"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-4 rounded-lg bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary-600">{validCount}</span>
                  <span className="text-sm text-gray-600">valid</span>
                </div>
                {invalidCount > 0 && (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-400">{invalidCount}</span>
                      <span className="text-sm text-gray-500">skipped</span>
                    </div>
                  </>
                )}
              </div>

              {/* Prospects list */}
              {validProspects.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-900">
                    Will be re-engaged ({validProspects.length})
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      Click to preview email
                    </span>
                  </h4>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200">
                    <ul className="divide-y divide-gray-100">
                      {validProspects.map((p) => (
                        <li
                          key={p.id}
                          onClick={() => setSelectedProspectId(p.id)}
                          className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
                            selectedProspectId === p.id
                              ? "bg-primary-50 border-l-2 border-l-primary-500"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-medium ${
                              selectedProspectId === p.id ? "text-primary-700" : "text-gray-900"
                            }`}>
                              {p.organization_name}
                            </p>
                            <p className="truncate text-xs text-gray-500">{p.campus_name}</p>
                          </div>
                          <span className="ml-2 shrink-0 text-xs text-gray-400">
                            {p.email ?? "no email"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {invalidProspects.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-500">
                    Will be skipped ({invalidProspects.length})
                  </h4>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50">
                    <ul className="divide-y divide-gray-100">
                      {invalidProspects.map((p) => (
                        <li key={p.id} className="flex items-center justify-between px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-gray-600">
                              {p.organization_name}
                            </p>
                          </div>
                          <span className="ml-2 shrink-0 text-xs text-red-500">
                            {p.skip_reason?.replace(/_/g, " ") ?? "invalid"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Email/Call Preview */}
              {currentEdits && selectedProspect && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      Sequence Preview
                      <span className="ml-2 text-xs font-normal text-gray-500">
                        for {selectedProspect.organization_name}
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      {isEditing && (
                        <button
                          onClick={applyToAll}
                          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Apply to all ({validCount})
                        </button>
                      )}
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          isEditing
                            ? "bg-primary-100 text-primary-700"
                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {isEditing ? "Done editing" : "Edit"}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200">
                    {/* Day tabs */}
                    <div className="flex border-b border-gray-200">
                      {[
                        { key: "day_0", label: "Day 0 · Email" },
                        { key: "day_3", label: "Day 3 · Call" },
                        { key: "day_7", label: "Day 7 · Email" },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setPreviewTab(t.key as typeof previewTab)}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            previewTab === t.key
                              ? "border-b-2 border-primary-600 text-primary-600"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    {/* Preview content */}
                    <div className="p-4">
                      {previewTab === "day_0" && (
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium text-gray-600">Subject:</span>{" "}
                            {isEditing ? (
                              <input
                                type="text"
                                value={currentEdits.day_0_subject}
                                onChange={(e) => updateEdit("day_0_subject", e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEdits.day_0_subject}</span>
                            )}
                          </div>
                          {isEditing ? (
                            <textarea
                              value={currentEdits.day_0_body}
                              onChange={(e) => updateEdit("day_0_body", e.target.value)}
                              rows={6}
                              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          ) : (
                            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                              {currentEdits.day_0_body}
                            </div>
                          )}
                        </div>
                      )}
                      {previewTab === "day_3" && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">Call Script:</p>
                          {isEditing ? (
                            <textarea
                              value={currentEdits.day_3_script}
                              onChange={(e) => updateEdit("day_3_script", e.target.value)}
                              rows={4}
                              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          ) : (
                            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                              {currentEdits.day_3_script}
                            </div>
                          )}
                        </div>
                      )}
                      {previewTab === "day_7" && (
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="font-medium text-gray-600">Subject:</span>{" "}
                            {isEditing ? (
                              <input
                                type="text"
                                value={currentEdits.day_7_subject}
                                onChange={(e) => updateEdit("day_7_subject", e.target.value)}
                                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                              />
                            ) : (
                              <span className="text-gray-900">{currentEdits.day_7_subject}</span>
                            )}
                          </div>
                          {isEditing ? (
                            <textarea
                              value={currentEdits.day_7_body}
                              onChange={(e) => updateEdit("day_7_body", e.target.value)}
                              rows={6}
                              className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          ) : (
                            <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                              {currentEdits.day_7_body}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500">
            {validCount > 0
              ? `${validCount} email${validCount === 1 ? "" : "s"} + ${validCount} call${validCount === 1 ? "" : "s"} will be scheduled`
              : "No valid prospects to re-engage"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={launching}
              className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              disabled={launching || validCount === 0 || loading}
              className="rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {launching ? "Launching…" : `Launch Re-engagement (${validCount})`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
