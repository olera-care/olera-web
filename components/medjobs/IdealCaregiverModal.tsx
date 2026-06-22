"use client";

import { useState } from "react";
import { SKILLS } from "@/lib/medjobs/skills";
import type { HoursPerWeek, OpportunityProfile } from "@/lib/medjobs/opportunity";

/**
 * IdealCaregiverModal — the reconciled "Your ideal caregiver" capture.
 *
 * Optional, skippable enrichment that sharpens matches and fills the
 * student-facing "Who we're looking for" section. The provider is already live
 * from the eligibility screener, so nothing here is required. Folds the useful
 * fields from the old job-posting modal (certs/skills/hours/pay) into one short
 * form that persists to business_profiles.metadata via /api/medjobs/opportunity.
 */

const CERTIFICATIONS = [
  "CPR certified",
  "First Aid certified",
  "CNA (Certified Nursing Assistant)",
  "HHA (Home Health Aide)",
  "BLS certified",
  "Dementia care training",
  "CPI / de-escalation training",
  "Fall prevention training",
];

const HOURS: { value: HoursPerWeek; label: string }[] = [
  { value: "0_10", label: "Up to 10" },
  { value: "10_20", label: "10–20" },
  { value: "20_30", label: "20–30" },
  { value: "30_plus", label: "30+" },
];

const btnPrimary =
  "w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40";
const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-base placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent";

function Chip({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
        on ? "border-primary-600 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
      }`}
    >
      {label}
    </button>
  );
}

export default function IdealCaregiverModal({
  initial,
  profileId,
  onClose,
  onSaved,
}: {
  initial?: OpportunityProfile;
  /** Optional explicit provider profile id; server falls back to the account's. */
  profileId?: string;
  onClose: () => void;
  onSaved: (saved: OpportunityProfile) => void | Promise<void>;
}) {
  const [certs, setCerts] = useState<string[]>(initial?.certifications ?? []);
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  const [hours, setHours] = useState<HoursPerWeek | undefined>(initial?.hours_per_week);
  const [payMin, setPayMin] = useState(initial?.pay_min ?? "");
  const [payMax, setPayMax] = useState(initial?.pay_max ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = async () => {
    setSaving(true);
    setError(null);
    const opportunity: OpportunityProfile = {
      certifications: certs,
      skills,
      hours_per_week: hours,
      pay_min: payMin.trim() || undefined,
      pay_max: payMax.trim() || undefined,
    };
    try {
      const res = await fetch("/api/medjobs/opportunity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId, opportunity }),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || "Could not save");
      }
      await onSaved(opportunity);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <div>
            <h3 className="font-serif text-xl text-gray-900">Sharpen your matches</h3>
            <p className="mt-1 text-sm text-gray-500">
              You&apos;re already live. Add a little to match better — all optional.
            </p>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Certifications a plus</p>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATIONS.map((c) => (
                <Chip key={c} on={certs.includes(c)} onClick={() => toggle(certs, setCerts, c)} label={c} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Hours / week</p>
            <div className="grid grid-cols-4 gap-2">
              {HOURS.map((h) => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setHours(hours === h.value ? undefined : h.value)}
                  className={`rounded-xl border px-2 py-2 text-sm transition-colors ${
                    hours === h.value ? "border-primary-600 bg-primary-50 text-gray-900" : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Pay range (optional)</p>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">$</span>
              <input value={payMin} onChange={(e) => setPayMin(e.target.value)} inputMode="numeric" placeholder="15" className={fieldClass} />
              <span className="text-gray-400">–</span>
              <input value={payMax} onChange={(e) => setPayMax(e.target.value)} inputMode="numeric" placeholder="20" className={fieldClass} />
              <span className="whitespace-nowrap text-sm text-gray-400">/hr</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Skills (optional)</p>
            <div className="flex flex-wrap gap-2">
              {SKILLS.slice(0, 12).map((s) => (
                <Chip key={s} on={skills.includes(s)} onClick={() => toggle(skills, setSkills, s)} label={s} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300">
              Skip for now
            </button>
            <button type="button" disabled={saving} onClick={save} className={`flex-1 ${btnPrimary}`}>
              {saving ? "Saving…" : "See my matches →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
