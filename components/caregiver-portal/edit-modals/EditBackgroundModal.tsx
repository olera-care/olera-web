"use client";

import { useState, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import type { BaseEditModalProps } from "./types";

const ENTRY_TAGS = [
  { value: "paid", label: "Paid" },
  { value: "volunteer", label: "Volunteer" },
  { value: "family", label: "Family" },
  { value: "clinical", label: "Clinical" },
  { value: "internship", label: "Internship" },
  { value: "other", label: "Other" },
] as const;

type EntryTag = (typeof ENTRY_TAGS)[number]["value"];

interface ExperienceEntry {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date?: string;
  tag: EntryTag;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatMonth(ym: string): string {
  const [year, month] = ym.split("-");
  if (!month) return year;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const TAG_STYLES: Record<string, string> = {
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  volunteer: "bg-blue-50 text-blue-700 border-blue-200",
  family: "bg-amber-50 text-amber-700 border-amber-200",
  clinical: "bg-purple-50 text-purple-700 border-purple-200",
  internship: "bg-indigo-50 text-indigo-700 border-indigo-200",
  other: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function EditBackgroundModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const [entries, setEntries] = useState<ExperienceEntry[]>(
    (meta.experience_entries || []).map((e) => ({ ...e, id: e.id || generateId() }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add-entry form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newIsCurrent, setNewIsCurrent] = useState(false);
  const [newTag, setNewTag] = useState<EntryTag>("paid");

  const hasChanges = JSON.stringify(entries) !== JSON.stringify(meta.experience_entries || []);

  function addEntry() {
    if (!newTitle.trim() || !newStartDate) return;
    const entry: ExperienceEntry = {
      id: generateId(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      start_date: newStartDate,
      end_date: newIsCurrent ? undefined : newEndDate || undefined,
      tag: newTag,
    };
    setEntries((prev) => [entry, ...prev]);
    setNewTitle("");
    setNewDescription("");
    setNewStartDate("");
    setNewEndDate("");
    setNewIsCurrent(false);
    setNewTag("paid");
    setShowAddForm(false);
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: { experience_entries: entries },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  }

  const sortedEntries = [...entries].sort((a, b) => (b.start_date > a.start_date ? 1 : -1));

  const footerContent = (
    <div className="pt-4 border-t border-gray-100">
      {guidedMode && guidedStep && guidedTotal && (
        <div className="flex gap-0.5 px-1 mb-4">
          {Array.from({ length: guidedTotal }, (_, i) => (
            <div key={i} className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${i + 1 <= guidedStep ? "bg-primary-600" : "bg-gray-100"}`} />
          ))}
        </div>
      )}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={guidedMode && onGuidedBack ? onGuidedBack : onClose}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
        >
          {guidedMode && onGuidedBack ? "Back" : "Cancel"}
        </button>

        {guidedMode && guidedStep && guidedTotal && (
          <span className="text-xs text-gray-400">Step {guidedStep} of {guidedTotal}</span>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || (!hasChanges && !guidedMode)}
          className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            entries.length > 0
              ? "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : guidedMode ? "Save & Next" : "Done"}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title="" size="2xl" footer={footerContent}>
      <div className="px-2">
        <div className="min-h-[360px] pt-4">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-50 flex items-center justify-center">
                <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Experience timeline</h3>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">
                Add your caregiving roles — paid, volunteer, family, or clinical.
              </p>
            </div>

            {/* Existing entries */}
            {sortedEntries.length > 0 && (
              <div className="relative pl-4 border-l-2 border-gray-200 space-y-3 mb-4">
                {sortedEntries.map((entry) => {
                  const tagLabel = ENTRY_TAGS.find((t) => t.value === entry.tag)?.label || entry.tag;
                  const tagClass = TAG_STYLES[entry.tag] || TAG_STYLES.other;
                  return (
                    <div key={entry.id} className="relative group">
                      <div className="absolute -left-[calc(1rem+5px)] top-1.5 w-2 h-2 rounded-full bg-primary-500" />
                      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-gray-900 truncate">{entry.title}</p>
                              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagClass}`}>
                                {tagLabel}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {formatMonth(entry.start_date)} – {entry.end_date ? formatMonth(entry.end_date) : "Present"}
                            </p>
                            {entry.description && <p className="text-xs text-gray-500 mt-1">{entry.description}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                            aria-label="Remove entry"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add entry form */}
            {showAddForm ? (
              <div className="border border-primary-200 bg-primary-50/30 rounded-2xl p-4 space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Role or title (e.g. Caregiver at Sunrise)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300"
                />
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief description (optional)"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300"
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                    <input
                      type="month"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                    {newIsCurrent ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">Present</div>
                    ) : (
                      <input
                        type="month"
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300"
                      />
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsCurrent}
                    onChange={(e) => setNewIsCurrent(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">I currently do this</span>
                </label>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ENTRY_TAGS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setNewTag(t.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          newTag === t.value
                            ? "bg-primary-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addEntry}
                    disabled={!newTitle.trim() || !newStartDate}
                    className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add experience
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-auto max-w-md mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
