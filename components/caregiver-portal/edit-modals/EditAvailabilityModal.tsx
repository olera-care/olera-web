"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveStudentProfile } from "./save-profile";
import ModalFooter from "./ModalFooter";
import type { BaseEditModalProps } from "./types";
import { SEASONAL_STATUS_OPTIONS, SEASON_LABELS, getCurrentSeasonKey } from "@/lib/medjobs-helpers";

const COMMITMENT_SUGGESTIONS = [
  "I am committed to working caregiving shifts around my class schedule for at least 6 months. Outside of class and exam periods, I am available for shifts including evenings, weekends, and overnights.",
  "I plan to work as a caregiver for multiple semesters. I will keep my schedule updated and give at least 2 weeks notice before any changes. I understand reliability is critical for the families I serve.",
  "Caregiving is part of my professional development plan. I am committed to 6-12 months of consistent availability, working all hours outside of my coursework, and communicating proactively about schedule changes.",
];

const AVAILABILITY_SNIPPETS = [
  "I have no planned travel and am available for shifts anytime outside of class.",
  "I can pick up additional shifts during holidays and semester breaks.",
  "I have reliable transportation and can drive to clients within 30 minutes.",
  "I am flexible with short-notice shift changes and happy to cover for others.",
  "I will update my profile with specific finals and travel dates as they are confirmed.",
];

const SEASONS = ["spring", "summer", "fall", "winter"] as const;

export default function EditAvailabilityModal({
  profile,
  onClose,
  onSaved,
  guidedMode,
  guidedStep,
  guidedTotal,
  onGuidedBack,
}: BaseEditModalProps) {
  const meta = profile.metadata;
  const currentSeason = getCurrentSeasonKey();
  const currentYear = new Date().getFullYear();

  const [commitmentStatement, setCommitmentStatement] = useState(meta.commitment_statement || "");
  const [prnWilling, setPrnWilling] = useState(!!meta.prn_willing);
  const [advanceNoticePledge, setAdvanceNoticePledge] = useState(!!meta.advance_notice_pledge);
  const [yearRoundAvailability, setYearRoundAvailability] = useState(meta.year_round_availability || {});
  const [availabilityNotes, setAvailabilityNotes] = useState(meta.availability_notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    commitmentStatement !== (meta.commitment_statement || "") ||
    prnWilling !== !!meta.prn_willing ||
    advanceNoticePledge !== !!meta.advance_notice_pledge ||
    JSON.stringify(yearRoundAvailability) !== JSON.stringify(meta.year_round_availability || {}) ||
    availabilityNotes !== (meta.availability_notes || "");

  const isValid = commitmentStatement.trim().length >= 50;

  async function handleSave() {
    if (!hasChanges && !guidedMode) {
      onClose();
      return;
    }

    if (!isValid) {
      setError("Commitment statement must be at least 50 characters");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveStudentProfile({
        profileId: profile.id,
        metadataFields: {
          commitment_statement: commitmentStatement.trim(),
          prn_willing: prnWilling,
          advance_notice_pledge: advanceNoticePledge,
          year_round_availability: yearRoundAvailability,
          availability_notes: availabilityNotes.trim() || null,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const handleSeasonChange = (season: string, status: string) => {
    setYearRoundAvailability((prev) => ({
      ...prev,
      [season]: { status, year: currentYear },
    }));
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit Availability & Commitment"
      size="2xl"
      footer={
        <ModalFooter
          saving={saving}
          hasChanges={hasChanges}
          onClose={onClose}
          onSave={handleSave}
          guidedMode={guidedMode}
          guidedStep={guidedStep}
          guidedTotal={guidedTotal}
          onGuidedBack={onGuidedBack}
        />
      }
    >
      <div className="space-y-6 pt-4">
        {/* Info callout */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50/60">
          <svg className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            This is the #1 thing providers look at. They need to know you&apos;re committed to taking shifts around coursework for 6+ months.
          </p>
        </div>

        {/* Commitment statement */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Commitment statement <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Describe your commitment to taking caregiving shifts around your coursework for 6+ months. Visible to providers.
          </p>
          {!commitmentStatement && (
            <div className="mb-3 space-y-2">
              <p className="text-xs text-gray-400">Use a suggestion as a starting point:</p>
              {COMMITMENT_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCommitmentStatement(s)}
                  className="w-full text-left px-3 py-2 border border-gray-200 hover:border-gray-400 rounded-lg text-xs text-gray-600 transition-colors leading-relaxed"
                >
                  {s.slice(0, 80)}...
                </button>
              ))}
            </div>
          )}
          <textarea
            value={commitmentStatement}
            onChange={(e) => setCommitmentStatement(e.target.value)}
            placeholder="Describe your commitment to taking shifts, your availability outside of class, and how long you plan to work..."
            rows={4}
            className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
          />
          <span className={`text-xs mt-1 block ${commitmentStatement.trim().length < 50 ? "text-amber-500" : "text-gray-400"}`}>
            {commitmentStatement.trim().length} chars {commitmentStatement.trim().length < 50 && `(${50 - commitmentStatement.trim().length} more needed)`}
          </span>
        </div>

        {/* Additional commitments */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Additional commitments</label>
          <p className="text-xs text-gray-500 mb-3">These show providers you understand the responsibility.</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPrnWilling(!prnWilling)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                prnWilling ? "border-2 border-gray-900 bg-gray-50" : "border border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 mt-0.5 transition-colors ${
                prnWilling ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300"
              }`}>
                {prnWilling && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-gray-700">I am okay to be on-call / PRN until a client needs shifts that fit my schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setAdvanceNoticePledge(!advanceNoticePledge)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                advanceNoticePledge ? "border-2 border-gray-900 bg-gray-50" : "border border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 shrink-0 mt-0.5 transition-colors ${
                advanceNoticePledge ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300"
              }`}>
                {advanceNoticePledge && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span className="text-sm text-gray-700">I commit to keeping my availability and course schedule updated regularly and will work with office staff if anything changes</span>
            </button>
          </div>
        </div>

        {/* Year-round availability */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Year-round availability</label>
          <div className="space-y-2">
            {SEASONS.map((season) => {
              const data = yearRoundAvailability[season] as { status?: string; year?: number } | undefined;
              const isCurrent = season === currentSeason;
              return (
                <div key={season} className={`rounded-lg border p-3 ${isCurrent ? "border-primary-200 bg-primary-50/30" : "border-gray-100"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {SEASON_LABELS[season]} {isCurrent ? currentYear : season === "winter" ? `${currentYear}–${currentYear + 1}` : currentYear}
                      {isCurrent && <span className="ml-2 text-xs text-primary-600 font-normal">(current)</span>}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {SEASONAL_STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSeasonChange(season, opt.value)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          data?.status === opt.value ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Availability notes */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Availability notes</label>
          <p className="text-xs text-gray-500 mb-2">Finals, spring break, known travel — the more detail, the better your chances.</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {AVAILABILITY_SNIPPETS.map((snippet, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAvailabilityNotes((prev) => prev ? `${prev.trimEnd()} ${snippet}` : snippet)}
                className="px-2.5 py-1 border border-gray-200 hover:border-gray-400 rounded-full text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
              >
                {snippet.length > 45 ? snippet.slice(0, 45) + "..." : snippet}
              </button>
            ))}
          </div>
          <textarea
            value={availabilityNotes}
            onChange={(e) => setAvailabilityNotes(e.target.value)}
            placeholder="Add any notes about your availability..."
            rows={3}
            className="w-full border border-gray-200 focus:border-gray-900 outline-none rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 transition-colors resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
