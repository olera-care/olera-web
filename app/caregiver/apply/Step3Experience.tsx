"use client";

import { useState } from "react";
import type { ProfileFormState, WorkEntry } from "./Step2Profile";
import OleraSelect from "./OleraSelect";

/* ─── Option Data ─────────────────────────────────────────── */

const CARE_SPECIALTIES = [
  "Companionship", "Dementia care", "Parkinson\u2019s care", "Post-surgery recovery",
  "Meal prep", "Light housekeeping", "Medication reminders", "Mobility assistance",
  "Transportation", "Errands and shopping", "Pet care",
];

const LANGUAGES = [
  "English", "Spanish", "Mandarin", "Vietnamese", "French", "Hindi", "Arabic",
];

const YEAR_OPTIONS = Array.from({ length: 15 }, (_, i) => String(2026 - i));

const EXPERIENCE_LEVELS = [
  { value: "first_time", label: "First time", subtitle: "We\u2019ll provide training to get you started" },
  { value: "some", label: "Some experience", subtitle: "1\u20132 years" },
  { value: "several", label: "Several years", subtitle: "3\u20135 years" },
  { value: "extensive", label: "Extensive experience", subtitle: "5+ years" },
];

/* ─── Shared UI ───────────────────────────────────────────── */

function ChipSelect({ options, selected, onToggle, otherValue, onOtherChange, placeholder }: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors border ${
              active
                ? "bg-primary-50 border-primary-300 text-primary-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {active && (
              <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
            {opt}
          </button>
        );
      })}
      {onOtherChange !== undefined && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { if (!selected.includes("Other")) onToggle("Other"); }}
            className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors border ${
              selected.includes("Other")
                ? "bg-primary-50 border-primary-300 text-primary-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            + Other
          </button>
          {selected.includes("Other") && (
            <input
              type="text"
              value={otherValue}
              onChange={(e) => onOtherChange(e.target.value)}
              placeholder={placeholder || "Specify..."}
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
            />
          )}
        </div>
      )}
    </div>
  );
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children} <span className="text-error-400">*</span>
    </label>
  );
}

function OptionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children} <span className="text-gray-400 font-normal text-xs">(optional)</span>
    </label>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7">
      <h3 className="text-lg font-semibold text-gray-900 mb-0.5">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mb-5">{subtitle}</p>}
      {!subtitle && <div className="mb-5" />}
      {children}
    </div>
  );
}

/* ─── Work Experience Form ─────────────────────────────────── */

function WorkExperienceForm({ onAdd }: { onAdd: (entry: WorkEntry) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [current, setCurrent] = useState(false);

  const handleAdd = () => {
    if (!title.trim() || !company.trim() || !startYear) return;
    onAdd({ title: title.trim(), company: company.trim(), startYear, endYear: current ? "" : endYear, current });
    setTitle("");
    setCompany("");
    setStartYear("");
    setEndYear("");
    setCurrent(false);
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-300 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add work experience
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Job title (e.g. Home Health Aide)"
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
      <input
        type="text"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company or organization"
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      />
      <div className="grid grid-cols-2 gap-3">
        <OleraSelect
          value={startYear}
          onChange={setStartYear}
          options={YEAR_OPTIONS}
          placeholder="Start year"
        />
        {current ? (
          <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500">
            Present
          </div>
        ) : (
          <OleraSelect
            value={endYear}
            onChange={setEndYear}
            options={YEAR_OPTIONS}
            placeholder="End year"
          />
        )}
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={current}
          onChange={(e) => setCurrent(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-gray-600">I currently work here</span>
      </label>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!title.trim() || !company.trim() || !startYear}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium transition-colors"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────── */

export default function Step3Experience({
  profile,
  setProfile,
  onBack,
  onContinue,
}: {
  profile: ProfileFormState;
  setProfile: React.Dispatch<React.SetStateAction<ProfileFormState>>;
  onBack: () => void;
  onContinue: () => void;
}) {
  const toggle = (key: "careSpecialties" | "languages" | "hobbies", value: string) => {
    setProfile((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v: string) => v !== value) : [...p[key], value],
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to about you
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          Your experience
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Help families understand what you can offer and get to know you personally.
        </p>
      </div>

      <div className="space-y-6">
        {/* Background and skills */}
        <SectionCard title="Your background and skills" subtitle="Help families understand what you can offer.">
          {/* Care specialties */}
          <div className="mb-6">
            <RequiredLabel>What kind of care can you provide?</RequiredLabel>
            <p className="text-xs text-gray-400 mb-3">Select all that apply. You can add more later.</p>
            <ChipSelect
              options={CARE_SPECIALTIES}
              selected={profile.careSpecialties}
              onToggle={(v) => toggle("careSpecialties", v)}
              otherValue={profile.careSpecialtyOther}
              onOtherChange={(v) => setProfile((p) => ({ ...p, careSpecialtyOther: v }))}
            />
          </div>

          {/* Experience level */}
          <div className="mb-6">
            <OptionalLabel>How much experience do you have with seniors?</OptionalLabel>
            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((lvl) => (
                <label
                  key={lvl.value}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                    profile.experienceLevel === lvl.value
                      ? "border-primary-300 bg-primary-25 ring-1 ring-primary-300"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="experience"
                    value={lvl.value}
                    checked={profile.experienceLevel === lvl.value}
                    onChange={() => setProfile((p) => ({ ...p, experienceLevel: lvl.value }))}
                    className="mt-0.5 w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lvl.label}</p>
                    <p className="text-xs text-gray-400">{lvl.subtitle}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Work experience - resume style */}
          <div className="mb-6">
            <OptionalLabel>Work experience</OptionalLabel>
            <p className="text-xs text-gray-400 mb-3">Add caregiving, volunteer, or related jobs. Even informal experience counts.</p>

            {/* Existing entries */}
            {profile.workExperience.length > 0 && (
              <div className="space-y-2 mb-4">
                {profile.workExperience.map((job, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{job.title}</p>
                      <p className="text-xs text-gray-500">{job.company} &middot; {job.startYear} &ndash; {job.current ? "Present" : job.endYear}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, workExperience: p.workExperience.filter((_, j) => j !== i) }))}
                      className="w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-error-500 transition-colors flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add job form */}
            <WorkExperienceForm
              onAdd={(entry) => setProfile((p) => ({ ...p, workExperience: [...p.workExperience, entry] }))}
            />
          </div>

          {/* Languages */}
          <div>
            <RequiredLabel>Languages you speak</RequiredLabel>
            <ChipSelect
              options={LANGUAGES}
              selected={profile.languages}
              onToggle={(v) => {
                toggle("languages", v);
                if (!profile.primaryLanguage && !profile.languages.includes(v)) {
                  setProfile((p) => ({ ...p, primaryLanguage: v }));
                }
              }}
              otherValue={profile.languageOther}
              onOtherChange={(v) => setProfile((p) => ({ ...p, languageOther: v }))}
              placeholder="Add language..."
            />
            {profile.languages.length > 1 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1.5">Primary language:</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setProfile((p) => ({ ...p, primaryLanguage: lang }))}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        profile.primaryLanguage === lang
                          ? "bg-primary-100 text-primary-700 border border-primary-300"
                          : "bg-gray-100 text-gray-500 border border-transparent hover:bg-gray-200"
                      }`}
                    >
                      {lang} {profile.primaryLanguage === lang && "\u2605"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors order-2 sm:order-1"
        >
          Save and continue later
        </button>
        <button
          onClick={onContinue}
          className="order-1 sm:order-2 w-full sm:w-auto px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-colors shadow-sm bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20"
        >
          Continue to verification
        </button>
      </div>
    </div>
  );
}
