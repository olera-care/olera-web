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

// Neutral tag styles - same as card for visual consistency
const TAG_STYLES: Record<string, string> = {
  paid: "bg-gray-100 text-gray-700 border-gray-200",
  volunteer: "bg-gray-100 text-gray-700 border-gray-200",
  family: "bg-gray-100 text-gray-700 border-gray-200",
  clinical: "bg-gray-100 text-gray-700 border-gray-200",
  internship: "bg-gray-100 text-gray-700 border-gray-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
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

  const headerContent = (
    <h2 className="text-xl sm:text-[22px] font-semibold text-gray-900">Experience</h2>
  );

  return (
    <Modal isOpen onClose={onClose} title={headerContent} size="2xl" footer={footerContent}>
      <div className="pt-2">
        <p className="text-sm text-gray-600 mb-4">
          Add your caregiving roles — paid, volunteer, family, or clinical.
        </p>

        {/* Existing entries */}
        {sortedEntries.length > 0 && (
          <div className="space-y-3 mb-4">
            {sortedEntries.map((entry) => {
              const tagLabel = ENTRY_TAGS.find((t) => t.value === entry.tag)?.label || entry.tag;
              const tagClass = TAG_STYLES[entry.tag] || TAG_STYLES.other;
              return (
                <div key={entry.id} className="group bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagClass}`}>
                          {tagLabel}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatMonth(entry.start_date)} – {entry.end_date ? formatMonth(entry.end_date) : "Present"}
                      </p>
                      {entry.description && <p className="text-sm text-gray-500 mt-1">{entry.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="shrink-0 p-1 text-gray-400 hover:text-red-500 active:text-red-600 transition-colors"
                      aria-label="Remove entry"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add entry form */}
        {showAddForm ? (
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Role or title (e.g. Caregiver at Sunrise)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
              autoFocus
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                <input
                  type="month"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                {newIsCurrent ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">Present</div>
                ) : (
                  <input
                    type="month"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500"
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
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                onClick={addEntry}
                disabled={!newTitle.trim() || !newStartDate}
                className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add experience
          </button>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 text-center" role="alert">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
