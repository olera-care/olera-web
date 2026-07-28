"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * FactChips — the tappable half of the /m recognition row (Phase 3).
 *
 * The "what we know" panel was always meant to ASK, not just recite: facts
 * we hold render as regular chips; the gaps render as dashed "+ Add" chips
 * that expand into one-tap options inline. Every answer PATCHes
 * /api/benefits/update-enrichment (the results token is the auth — a POST
 * body, never a GET that writes), then router.refresh() re-runs the server
 * re-rank so the family SEES their matches sharpen. That refresh is the
 * payoff that makes answering feel worth it.
 */

export interface KnownFacts {
  age: number | null;
  medicaidStatus: string | null;
  incomeBand: string | null;
}

interface FactChipsProps {
  token: string;
  profileId: string;
  facts: KnownFacts;
  /** True when the payments chip already says Medicaid — the inferred "On
   *  Medicaid" fact chip would just repeat it. */
  suppressMedicaidChip?: boolean;
}

const AGE_LABELS: Record<number, string> = {
  60: "Under 65",
  70: "Age 65 to 74",
  80: "Age 75 to 84",
  87: "Age 85 or older",
};

const MEDICAID_LABELS: Record<string, string> = {
  alreadyHas: "On Medicaid",
  applying: "Applying for Medicaid",
  notSure: "Medicaid: not sure",
  doesNotHave: "No Medicaid yet",
};

const INCOME_LABELS: Record<string, string> = {
  under1500: "Income under $1,500/mo",
  under2500: "Income $1,500 to $2,500/mo",
  under4000: "Income $2,500 to $4,000/mo",
  over4000: "Income over $4,000/mo",
  under6000: "Income $4,000 to $6,000/mo",
  over6000: "Income over $6,000/mo",
};

type Ask = "age" | "medicaid" | "income";

const ASK_CONFIG: Record<Ask, { addLabel: string; prompt: string; options: { label: string; value: string }[] }> = {
  age: {
    addLabel: "+ Add age",
    prompt: "How old is the person needing care?",
    options: [
      { label: "Under 65", value: "60" },
      { label: "65 to 74", value: "70" },
      { label: "75 to 84", value: "80" },
      { label: "85 or older", value: "87" },
    ],
  },
  medicaid: {
    addLabel: "+ Medicaid?",
    prompt: "Do they have Medicaid?",
    options: [
      { label: "Yes, they have it", value: "alreadyHas" },
      { label: "Applying or not sure", value: "notSure" },
      { label: "No", value: "doesNotHave" },
    ],
  },
  income: {
    addLabel: "+ Add income",
    prompt: "About how much is their monthly income?",
    options: [
      { label: "Under $1,500", value: "under1500" },
      { label: "$1,500 to $2,500", value: "under2500" },
      { label: "$2,500 to $4,000", value: "under4000" },
      { label: "Over $4,000", value: "over4000" },
      { label: "Prefer not to say", value: "preferNotToSay" },
    ],
  },
};

const FIELD_FOR_ASK: Record<Ask, string> = {
  age: "ageBand",
  medicaid: "medicaidStatus",
  income: "incomeRange",
};

export default function FactChips({ token, profileId, facts, suppressMedicaidChip }: FactChipsProps) {
  const router = useRouter();
  const [open, setOpen] = useState<Ask | null>(null);
  const [saved, setSaved] = useState<Partial<Record<Ask, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [isRefreshing, startTransition] = useTransition();

  const knownChips: string[] = [];
  if (facts.age != null) knownChips.push(AGE_LABELS[facts.age] || `Age ${facts.age}`);
  else if (saved.age) knownChips.push(AGE_LABELS[parseInt(saved.age, 10)] || `Age ${saved.age}`);
  if (facts.medicaidStatus) {
    if (!suppressMedicaidChip) knownChips.push(MEDICAID_LABELS[facts.medicaidStatus] || "Medicaid: answered");
  } else if (saved.medicaid) knownChips.push(MEDICAID_LABELS[saved.medicaid] || "Medicaid: answered");
  if (facts.incomeBand && facts.incomeBand !== "preferNotToSay") {
    knownChips.push(INCOME_LABELS[facts.incomeBand] || "Income: shared");
  } else if (saved.income && saved.income !== "preferNotToSay") {
    knownChips.push(INCOME_LABELS[saved.income] || "Income: shared");
  }

  const gaps: Ask[] = [];
  if (facts.age == null && !saved.age) gaps.push("age");
  if (!facts.medicaidStatus && !saved.medicaid) gaps.push("medicaid");
  if (!facts.incomeBand && !saved.income) gaps.push("income");

  const answer = (ask: Ask, value: string) => {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    fetch("/api/benefits/update-enrichment", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        token,
        source: "m_chips",
        [FIELD_FOR_ASK[ask]]: value,
      }),
    })
      .then((res) => {
        if (res.ok) {
          setSaved((prev) => ({ ...prev, [ask]: value }));
          setOpen(null);
          // Re-run the server re-rank so the list visibly sharpens.
          startTransition(() => router.refresh());
        } else {
          setSaveError(true);
        }
      })
      .catch(() => {
        // The options stay open so they can retry.
        setSaveError(true);
      })
      .finally(() => setSaving(false));
  };

  return (
    <>
      {knownChips.map((c) => (
        <span
          key={c}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[13px] font-medium text-gray-700"
        >
          {c}
        </span>
      ))}
      {gaps.map((ask) => (
        <button
          key={ask}
          onClick={() => setOpen(open === ask ? null : ask)}
          className={`rounded-full border border-dashed px-3 py-1 text-[13px] font-medium transition-colors ${
            open === ask
              ? "border-gray-500 bg-gray-100 text-gray-800"
              : "border-gray-300 bg-transparent text-gray-500 hover:border-gray-400 hover:text-gray-700"
          }`}
        >
          {ASK_CONFIG[ask].addLabel}
        </button>
      ))}
      {isRefreshing && (
        <span className="rounded-full px-1 py-1 text-[13px] font-medium text-emerald-700">
          Updating your matches…
        </span>
      )}
      {open && (
        <div className="w-full basis-full pt-2">
          <p className="text-[14px] font-medium text-gray-800">{ASK_CONFIG[open].prompt}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ASK_CONFIG[open].options.map((opt) => (
              <button
                key={opt.value}
                disabled={saving}
                onClick={() => answer(open, opt.value)}
                className="rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-[13px] font-medium text-gray-800 transition-colors hover:border-gray-900 hover:bg-gray-900 hover:text-white disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {saveError && (
            <p className="mt-2 text-[13px] text-red-600" role="alert">
              That didn&apos;t save. Please tap it again.
            </p>
          )}
        </div>
      )}
    </>
  );
}
