"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPosting, updatePosting } from "@/lib/medjobs/job-postings";
import type { JobPosting } from "@/lib/medjobs/job-postings";
import { SKILLS } from "@/lib/medjobs/skills";

// ═══════════════════════════════════════════════════════════════════════════
// Data
// ═══════════════════════════════════════════════════════════════════════════

type Commitment = "one_term" | "multiple_terms";

interface Category {
  value: string;
  label: string;
  description: string;
  /** Keywords that trigger auto-select when typed in the title */
  keywords: string[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { value: "memory_care", label: "Memory care support", description: "assisting residents with dementia and Alzheimer\u2019s", keywords: ["memory", "dementia", "alzheimer"] },
  { value: "activities", label: "Activities and engagement", description: "running games, outings, and social programs", keywords: ["activit", "engagement", "games", "social program"] },
  { value: "dining", label: "Dining and mealtime support", description: "helping residents at meals", keywords: ["dining", "meal", "food", "nutrition"] },
  { value: "companionship", label: "Resident companionship", description: "one-on-one time and presence with residents", keywords: ["companion", "one-on-one", "visit"] },
];

const EXTRA_CATEGORIES: Category[] = [
  { value: "wellness", label: "Wellness and check-in support", description: "routine visits and well-being checks on residents", keywords: ["wellness", "check-in", "well-being"] },
  { value: "mobility", label: "Mobility and transport support", description: "helping residents move around the facility and to appointments", keywords: ["mobil", "transport", "transfer", "wheelchair"] },
  { value: "recreation", label: "Recreation and outings", description: "accompanying residents on group activities and trips", keywords: ["recreation", "outing", "trip"] },
  { value: "recovery", label: "Recovery and rehab support", description: "non-clinical help for residents recovering from a stay or procedure", keywords: ["recover", "rehab", "post-op", "surgery"] },
  { value: "overnight", label: "Evening and overnight presence", description: "companionship and support during night hours", keywords: ["evening", "overnight", "night"] },
  { value: "welcome", label: "New resident welcome", description: "helping residents settle in and orient to the facility", keywords: ["welcome", "orient", "settle", "new resident"] },
];

const ALL_CATEGORIES = [...DEFAULT_CATEGORIES, ...EXTRA_CATEGORIES];

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

// SKILLS imported from @/lib/medjobs/skills

// ═══════════════════════════════════════════════════════════════════════════
// ChipPicker — reusable search-and-select with removable chips
// ═══════════════════════════════════════════════════════════════════════════

function ChipPicker({
  options,
  selected,
  onChange,
  max,
  placeholder,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max: number;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const lowerQuery = query.trim().toLowerCase();
  const filtered = options.filter(
    (o) => !selected.includes(o) && o.toLowerCase().includes(lowerQuery)
  );

  const atCap = selected.length >= max;

  const add = useCallback(
    (item: string) => {
      if (atCap) return;
      onChange([...selected, item]);
      setQuery("");
    },
    [selected, onChange, atCap]
  );

  const remove = useCallback(
    (item: string) => onChange(selected.filter((s) => s !== item)),
    [selected, onChange]
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={wrapperRef}>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-800 border border-primary-200"
            >
              {item}
              <button
                type="button"
                onClick={() => remove(item)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-primary-200/60 transition-colors"
                aria-label={`Remove ${item}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input + dropdown */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={atCap ? `Limit reached (${max})` : placeholder}
          disabled={atCap}
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />

        {open && filtered.length > 0 && !atCap && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => { add(item); setOpen(true); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-800 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// JobPostingBuilder
// ═══════════════════════════════════════════════════════════════════════════

interface ProviderInfo {
  name: string;
  location: string | null;
  category: string | null;
  description: string | null;
  profileSlug: string | null;
}

export default function JobPostingBuilder({
  onClose,
  onPublish,
  provider,
  editingId,
  initialData,
}: {
  onClose: () => void;
  onPublish?: () => void;
  provider?: ProviderInfo | null;
  /** When set, the builder edits an existing posting instead of creating one. */
  editingId?: string;
  /** Pre-fill fields when editing. */
  initialData?: JobPosting;
}) {
  const isEditing = !!editingId;
  const [step, setStep] = useState(isEditing ? 6 : 1);
  const [commitment, setCommitment] = useState<Commitment | null>(initialData?.commitment ?? null);

  // Step 2 state
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [categoriesManual, setCategoriesManual] = useState<Set<string>>(new Set(initialData?.categories ?? []));
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showAllCategories, setShowAllCategories] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Step 3 state
  const [certifications, setCertifications] = useState<string[]>(initialData?.certifications ?? []);
  const [skills, setSkills] = useState<string[]>(initialData?.skills ?? []);

  // Step 4 state
  const [hoursPerWeek, setHoursPerWeek] = useState<string | null>(initialData?.hoursPerWeek ?? null);
  const [payMin, setPayMin] = useState(initialData?.payMin ?? "");
  const [payMax, setPayMax] = useState(initialData?.payMax ?? "");

  // Step 5 state
  const [description, setDescription] = useState(initialData?.description ?? "");

  // Step 6 state
  const [positionsNeeded, setPositionsNeeded] = useState(String(initialData?.positionsNeeded ?? "1"));

  // When editing from review, Continue returns to step 6 instead of advancing
  const [returnTo, setReturnTo] = useState<number | null>(null);

  const titleQuery = title.trim().toLowerCase();

  // Progress bar helper
  const progressPct = Math.round((step / 6) * 100);

  /** Jump to a step for editing; Continue on that step returns to review */
  const editStep = (s: number) => { setReturnTo(6); setStep(s); };
  /** Advance to the next step, or back to review if editing */
  const advance = (nextStep: number) => { const dest = returnTo ?? nextStep; setReturnTo(null); setStep(dest); };

  // Shared progress header rendered at the top of each step
  const progressHeader = (
    <div className="mb-6">
      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-primary-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="mt-2 text-sm font-medium text-gray-400">Step {step} of 6</p>
    </div>
  );

  // ─── Step 1: Commitment ───
  if (step === 1) {
    const commitmentOptions: { value: Commitment; title: string; description: string }[] = [
      { value: "one_term", title: "One term", description: "A single semester of recurring shifts." },
      { value: "multiple_terms", title: "Multiple terms", description: "Ongoing care across more than one semester." },
    ];

    return (
      <div className="max-w-lg mx-auto">
        {progressHeader}
        <h2 className="text-xl font-semibold text-gray-900">
          Let&apos;s start with the commitment.
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          This helps students know what they&apos;re signing up for before they apply.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {commitmentOptions.map((opt) => {
            const selected = commitment === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCommitment(opt.value)}
                className={`text-left rounded-xl border-2 p-4 transition-all ${
                  selected
                    ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <p className={`text-sm font-semibold ${selected ? "text-gray-900" : "text-gray-700"}`}>
                  {opt.title}
                </p>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            disabled={!commitment}
            onClick={() => advance(2)}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {returnTo ? "Save & return" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 2: Title & Category ───
  if (step === 2) {
    const matchedValues = new Set(
      titleQuery.length >= 3
        ? ALL_CATEGORIES
            .filter((c) =>
              c.keywords.some((kw) => titleQuery.includes(kw))
            )
            .map((c) => c.value)
        : []
    );

    const effectiveCategories = new Set([
      ...Array.from(categoriesManual),
      ...Array.from(matchedValues).filter((v) => !dismissed.has(v)),
    ]);

    const basePool = showAllCategories ? ALL_CATEGORIES : DEFAULT_CATEGORIES;
    const matched = ALL_CATEGORIES.filter((c) => matchedValues.has(c.value));
    const unmatched = basePool.filter((c) => !matchedValues.has(c.value));
    const visibleCategories = matched.length > 0 ? [...matched, ...unmatched] : basePool;

    const seen = new Set<string>();
    const dedupedCategories = visibleCategories.filter((c) => {
      if (seen.has(c.value)) return false;
      seen.add(c.value);
      return true;
    });

    const toggleCategory = (value: string) => {
      const isCurrentlyOn = effectiveCategories.has(value);
      if (isCurrentlyOn) {
        if (matchedValues.has(value)) {
          setDismissed((prev) => new Set(prev).add(value));
        }
        setCategoriesManual((prev) => { const next = new Set(prev); next.delete(value); return next; });
      } else {
        setCategoriesManual((prev) => new Set(prev).add(value));
        setDismissed((prev) => { const next = new Set(prev); next.delete(value); return next; });
      }
    };

    const canContinue = title.trim().length > 0 && effectiveCategories.size > 0;

    return (
      <div className="max-w-lg mx-auto">
        {progressHeader}
        <h2 className="text-base font-semibold text-gray-900">
          Write a title for your job posting.
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Keep it short and specific. Name the role and what you need, like &ldquo;Memory care support, weekday evenings.&rdquo;
        </p>

        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Part-Time Evening Memory Care Assistant"
          className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300"
        />

        <h3 className="mt-6 text-base font-semibold text-gray-900">Care categories</h3>
        <p className="mt-1 text-sm text-gray-500">We auto-select based on your title. Uncheck any that don&apos;t apply.</p>

        <div className="mt-3 space-y-1">
          {dedupedCategories.map((cat) => {
            const isMatch = matchedValues.has(cat.value);
            const isSelected = effectiveCategories.has(cat.value);
            return (
              <label
                key={cat.value}
                className={`flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary-50 ring-1 ring-primary-300"
                    : isMatch
                      ? "bg-primary-50/60"
                      : "hover:bg-gray-50/60"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategory(cat.value)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <p className={`text-sm ${
                    isSelected
                      ? "font-semibold text-primary-800"
                      : isMatch
                        ? "font-semibold text-primary-700"
                        : "font-medium text-gray-700"
                  }`}>
                    {cat.label}
                  </p>
                  <p className={`text-xs leading-relaxed ${isMatch || isSelected ? "text-primary-600/70" : "text-gray-500"}`}>
                    {cat.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {!showAllCategories && (
          <button
            type="button"
            onClick={() => setShowAllCategories(true)}
            className="mt-2 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            See all categories
          </button>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Back
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => advance(3)}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {returnTo ? "Save & return" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 3: Certifications & Skills ───
  if (step === 3) {
    const canContinue = certifications.length >= 1 && skills.length >= 1;

    return (
      <div className="max-w-lg mx-auto">
        {progressHeader}
        {/* ── Certifications ── */}
        <h2 className="text-base font-semibold text-gray-900">
          Certifications and training
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Pick the certifications this role requires. Add 3 to 5.
        </p>
        <div className="mt-3">
          <ChipPicker
            options={CERTIFICATIONS}
            selected={certifications}
            onChange={setCertifications}
            max={5}
            placeholder="Search certifications\u2026"
          />
        </div>

        {/* ── Skills ── */}
        <h2 className="mt-8 text-base font-semibold text-gray-900">
          Skills
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add the skills this role needs. For the best results, add 3 to 5.
        </p>
        <div className="mt-3">
          <ChipPicker
            options={SKILLS}
            selected={skills}
            onChange={setSkills}
            max={10}
            placeholder="Search skills\u2026"
          />
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Back
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => advance(4)}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {returnTo ? "Save & return" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 4: Hours & Pay ───
  if (step === 4) {
    const hoursOptions = [
      { value: "0_10", label: "0\u201310 hours" },
      { value: "10_20", label: "10\u201320 hours" },
      { value: "20_30", label: "20\u201330 hours" },
      { value: "30_plus", label: "30+ hours" },
    ];

    const canContinue =
      hoursPerWeek !== null &&
      payMin.trim().length > 0 &&
      payMax.trim().length > 0;

    return (
      <div className="max-w-lg mx-auto">
        {progressHeader}
        {/* ── Hours per week ── */}
        <h2 className="text-base font-semibold text-gray-900">
          How many hours per week?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Give students a sense of the time commitment.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {hoursOptions.map((opt) => {
            const selected = hoursPerWeek === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHoursPerWeek(opt.value)}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                  selected
                    ? "border-gray-900 bg-gray-50 text-gray-900 ring-1 ring-gray-900"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* ── Pay range ── */}
        <h2 className="mt-8 text-base font-semibold text-gray-900">
          What&apos;s the pay range?
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Set an hourly range students can expect.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              min="0"
              value={payMin}
              onChange={(e) => setPayMin(e.target.value)}
              placeholder="Min"
              className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-sm text-gray-400">to</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              min="0"
              value={payMax}
              onChange={(e) => setPayMax(e.target.value)}
              placeholder="Max"
              className="w-full rounded-xl border border-gray-200 pl-7 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <span className="text-sm text-gray-400 shrink-0">per hour</span>
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => setStep(3)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Back
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => advance(5)}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {returnTo ? "Save & return" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 5: Description ───
  if (step === 5) {
    const wordCount = description.trim().length === 0
      ? 0
      : description.trim().split(/\s+/).length;
    const MAX_WORDS = 500;

    const handleDescriptionChange = (text: string) => {
      const words = text.trim().split(/\s+/);
      if (text.trim().length > 0 && words.length > MAX_WORDS) {
        // Cap at MAX_WORDS
        setDescription(words.slice(0, MAX_WORDS).join(" "));
      } else {
        setDescription(text);
      }
    };

    return (
      <div className="max-w-lg mx-auto">
        {progressHeader}
        <h2 className="text-base font-semibold text-gray-900">
          Describe the role.
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Add up to 500 words on what the job includes and any details a student would find relevant. The more specific you are, the better we can match you.
        </p>

        <textarea
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          rows={10}
          placeholder="What will the student be doing day-to-day? Include schedule details, care setting, and anything that makes this role unique."
          className="mt-3 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 resize-y"
        />

        <div className="mt-2 flex justify-end text-xs">
          <p className={wordCount >= MAX_WORDS ? "text-amber-600 font-medium" : "text-gray-400"}>
            {wordCount} / {MAX_WORDS} words
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => setStep(4)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Back
          </button>
          <button
            type="button"
            onClick={() => advance(6)}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {returnTo ? "Save & return" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 6: Review & Publish ───
  if (step === 6) {
    // Recompute effective categories for display
    const words6 = titleQuery.length >= 3 ? titleQuery : "";
    const matchedVals6 = new Set(
      words6.length >= 3
        ? ALL_CATEGORIES.filter((c) => c.keywords.some((kw) => words6.includes(kw))).map((c) => c.value)
        : []
    );
    const effectiveCats6 = new Set([
      ...Array.from(categoriesManual),
      ...Array.from(matchedVals6).filter((v) => !dismissed.has(v)),
    ]);
    const categoryLabels = ALL_CATEGORIES.filter((c) => effectiveCats6.has(c.value)).map((c) => c.label);

    const hoursLabels: Record<string, string> = {
      "0_10": "0\u201310 hours",
      "10_20": "10\u201320 hours",
      "20_30": "20\u201330 hours",
      "30_plus": "30+ hours",
    };
    const commitmentLabel = commitment === "one_term" ? "One term" : "Multiple terms";

    const editBtn = (targetStep: number) => (
      <button
        type="button"
        onClick={() => editStep(targetStep)}
        className="text-xs font-medium text-primary-700 hover:text-primary-800 transition-colors"
      >
        Edit
      </button>
    );

    return (
      <div className="max-w-lg mx-auto">
        {progressHeader}
        {/* Company overview — pulled from provider profile */}
        {provider ? (
          <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">{provider.name}</p>
                {provider.location && <p className="mt-0.5 text-sm text-gray-500">{provider.location}</p>}
                {provider.category && (
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{provider.category.replace(/_/g, " ")}</p>
                )}
                {provider.description && (
                  <p className="mt-1.5 text-sm text-gray-600 line-clamp-3">{provider.description}</p>
                )}
              </div>
              {provider.profileSlug && (
                <a
                  href="/portal/profile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary-700 hover:text-primary-800 transition-colors shrink-0"
                >
                  Edit profile
                </a>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              We pulled this from your profile. If you&apos;d like to make any changes, press the edit button.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 p-4 mb-6">
            <p className="text-sm text-gray-400 italic">No profile found. Sign in as a provider to attach your facility.</p>
          </div>
        )}

        <h2 className="text-base font-semibold text-gray-900">Review your posting.</h2>
        <p className="mt-1 text-sm text-gray-500">Check everything looks right before it goes live. You can edit any section.</p>

        <div className="mt-6 space-y-5">
            {/* Title */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Title</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">{title}</p>
              </div>
              {editBtn(2)}
            </div>

            <hr className="border-gray-100" />

            {/* Commitment */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Commitment</p>
                <p className="mt-1 text-sm text-gray-700">{commitmentLabel}</p>
              </div>
              {editBtn(1)}
            </div>

            <hr className="border-gray-100" />

            {/* Categories */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Care categories</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {categoryLabels.map((l) => (
                    <span key={l} className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-800 border border-primary-200">
                      {l}
                    </span>
                  ))}
                </div>
              </div>
              {editBtn(2)}
            </div>

            <hr className="border-gray-100" />

            {/* Certifications */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Certifications</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {certifications.map((c) => (
                    <span key={c} className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              {editBtn(3)}
            </div>

            <hr className="border-gray-100" />

            {/* Skills */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              {editBtn(3)}
            </div>

            <hr className="border-gray-100" />

            {/* Hours & Pay */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Hours &amp; pay</p>
                <p className="mt-1 text-sm text-gray-700">
                  {hoursPerWeek ? hoursLabels[hoursPerWeek] : "\u2014"} per week &middot; ${payMin}\u2013${payMax}/hr
                </p>
              </div>
              {editBtn(4)}
            </div>

            <hr className="border-gray-100" />

            {/* Description */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Description</p>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line line-clamp-4">{description}</p>
              </div>
              {editBtn(5)}
            </div>

            <hr className="border-gray-100" />

            {/* Positions needed */}
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Positions needed</p>
              <p className="mt-1 text-sm text-gray-500">How many students do you need for this role?</p>
              <div className="mt-2 flex items-center gap-3">
                {["1", "2", "3", "4", "5"].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPositionsNeeded(n)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-all ${
                      positionsNeeded === n
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  value={Number(positionsNeeded) > 5 ? positionsNeeded : ""}
                  onChange={(e) => { if (e.target.value) setPositionsNeeded(e.target.value); }}
                  onFocus={() => { if (Number(positionsNeeded) <= 5) setPositionsNeeded(""); }}
                  placeholder="More"
                  className="w-16 h-10 rounded-lg border border-gray-200 text-center text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

          </div>

        {/* ── Footer ── */}
        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => setStep(5)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              const data = {
                title,
                commitment: commitment!,
                categories: [...effectiveCats6],
                certifications,
                skills,
                hoursPerWeek: hoursPerWeek!,
                payMin,
                payMax,
                description,
                positionsNeeded: Math.max(1, Number(positionsNeeded) || 1),
              };
              if (isEditing && editingId) {
                updatePosting(editingId, data);
              } else {
                createPosting(data);
              }
              onPublish?.();
              onClose();
            }}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {isEditing ? "Save changes" : "Publish posting"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
