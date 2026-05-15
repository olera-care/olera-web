"use client";

import { useState, useMemo, useRef } from "react";

/* ─── Option Data ─────────────────────────────────────────── */

const CARE_SPECIALTIES = [
  "Companionship", "Dementia care", "Parkinson\u2019s care", "Post-surgery recovery",
  "Meal prep", "Light housekeeping", "Medication reminders", "Mobility assistance",
  "Transportation", "Errands and shopping", "Pet care",
];

const LANGUAGES = [
  "English", "Spanish", "Mandarin", "Vietnamese", "French", "Hindi", "Arabic",
];

const HOBBIES = [
  "Reading", "Cooking", "Music", "Gardening", "Sports", "Art and crafts",
  "Travel", "Board games and puzzles", "Movies and TV", "Outdoors and hiking", "Volunteering",
];

const EXPERIENCE_LEVELS = [
  { value: "first_time", label: "First time", subtitle: "We\u2019ll provide training to get you started" },
  { value: "some", label: "Some experience", subtitle: "1\u20132 years" },
  { value: "several", label: "Several years", subtitle: "3\u20135 years" },
  { value: "extensive", label: "Extensive experience", subtitle: "5+ years" },
];

/* ─── Types ───────────────────────────────────────────────── */

export interface WorkEntry {
  title: string;
  company: string;
  startYear: string;
  endYear: string;
  current: boolean;
}

export interface ProfileFormState {
  photoPreview: string | null;
  photoFile: File | null;
  personalityQuote: string;
  aboutMe: string;
  careSpecialties: string[];
  careSpecialtyOther: string;
  experienceLevel: string;
  experienceDescription: string;
  workExperience: WorkEntry[];
  languages: string[];
  languageOther: string;
  primaryLanguage: string;
  hobbies: string[];
  hobbyOther: string;
  whyCare: string;
  videoFile: File | null;
  videoPreview: string | null;
}

export const INITIAL_PROFILE: ProfileFormState = {
  photoPreview: null,
  photoFile: null,
  personalityQuote: "",
  aboutMe: "",
  careSpecialties: [],
  careSpecialtyOther: "",
  experienceLevel: "",
  experienceDescription: "",
  workExperience: [],
  languages: [],
  languageOther: "",
  primaryLanguage: "English",
  hobbies: [],
  hobbyOther: "",
  whyCare: "",
  videoFile: null,
  videoPreview: null,
};

/* ─── Shared UI pieces ────────────────────────────────────── */

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

/* ─── Profile Completion Tracker ──────────────────────────── */

function CompletionTracker({ profile }: { profile: ProfileFormState }) {
  const items = useMemo(() => [
    { label: "Photo added", done: !!profile.photoPreview },
    { label: "Personality quote", done: profile.personalityQuote.trim().length > 0 },
    { label: "About me", done: profile.aboutMe.trim().length >= 100 },
    { label: "Care specialties", done: profile.careSpecialties.length > 0, recommended: true },
    { label: "Experience level", done: !!profile.experienceLevel },
    { label: "Languages", done: profile.languages.length > 0 },
    { label: "Hobbies", done: profile.hobbies.length > 0, recommended: true },
    { label: "Video intro", done: !!profile.videoPreview, boost: true },
  ], [profile]);

  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sticky top-[180px]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900">Profile completion</p>
        <span className="text-sm font-bold text-primary-600">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full transition-all duration-500 bg-primary-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            {item.done ? (
              <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />
            )}
            <span className={`text-xs ${item.done ? "text-gray-500 line-through" : "text-gray-700"}`}>
              {item.label}
            </span>
            {!item.done && item.boost && (
              <span className="text-[10px] bg-warning-50 text-warning-600 px-1.5 py-0.5 rounded font-medium">3x more requests</span>
            )}
            {!item.done && item.recommended && (
              <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded font-medium">recommended</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Step 2 Component ───────────────────────────────── */

export default function Step2Profile({
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const toggle = (key: "careSpecialties" | "languages" | "hobbies", value: string) => {
    setProfile((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v: string) => v !== value) : [...p[key], value],
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, photoFile: file, photoPreview: url }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, videoFile: file, videoPreview: url }));
  };

  const canContinue = useMemo(() => {
    return (
      !!profile.photoPreview &&
      profile.personalityQuote.trim().length > 0 &&
      profile.aboutMe.trim().length >= 100 &&
      profile.careSpecialties.length > 0 &&
      profile.languages.length > 0
    );
  }, [profile]);

  const missingFields = useMemo(() => {
    const m: string[] = [];
    if (!profile.photoPreview) m.push("profile photo");
    if (!profile.personalityQuote.trim()) m.push("personality quote");
    if (profile.aboutMe.trim().length < 100) m.push("about me (100+ chars)");
    if (profile.careSpecialties.length === 0) m.push("at least one care specialty");
    if (profile.languages.length === 0) m.push("at least one language");
    return m;
  }, [profile]);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to step 1
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          Build your profile
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Families will see this when they&apos;re searching for caregivers. Take your time &mdash; you can save and come back anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 items-start">
        {/* Left: form sections */}
        <div className="space-y-6">
          {/* ── Section A: The basics ── */}
          <SectionCard title="The basics" subtitle="Your photo, headline, and bio.">
            {/* Photo upload */}
            <div className="mb-6">
              <RequiredLabel>Profile photo</RequiredLabel>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary-400 bg-gray-50 hover:bg-primary-25 flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden"
              >
                {profile.photoPreview ? (
                  <>
                    <img src={profile.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Change</span>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                    <span className="text-xs text-gray-400">Add photo</span>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-400">Photo tips: Warm, casual, smiling. Good lighting. Looking at the camera.</p>
                <p className="text-xs text-gray-400">Avoid: lab coats, scrubs, suits, clinical settings.</p>
              </div>
            </div>


            {/* About me */}
            <div>
              <RequiredLabel>Tell families about yourself</RequiredLabel>
              <textarea
                value={profile.aboutMe}
                onChange={(e) => { if (e.target.value.length <= 500) setProfile((p) => ({ ...p, aboutMe: e.target.value })); }}
                placeholder="Share a bit about your background, why you want to do this work, and what families can expect from you."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-400">
                  {profile.aboutMe.length < 100 ? `${100 - profile.aboutMe.length} more characters needed` : "Be genuine and specific."}
                </p>
                <span className={`text-xs font-medium ${profile.aboutMe.length >= 450 ? "text-warning-500" : "text-gray-400"}`}>
                  {profile.aboutMe.length}/500
                </span>
              </div>
            </div>
          </SectionCard>

          {/* ── Section B: Background and skills ── */}
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
              <div className="mt-4">
                <OptionalLabel>Briefly describe your experience</OptionalLabel>
                <textarea
                  value={profile.experienceDescription}
                  onChange={(e) => setProfile((p) => ({ ...p, experienceDescription: e.target.value }))}
                  placeholder="I helped care for my grandmother for two years, and worked as a volunteer at a senior center..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">Even informal experience counts &mdash; family caregiving, volunteer work, summer jobs.</p>
              </div>
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

          {/* ── Section C: A bit about you ── */}
          <SectionCard title="A bit about you" subtitle="Helps families connect with you on a personal level.">
            {/* Hobbies */}
            <div className="mb-6">
              <OptionalLabel>What do you enjoy in your free time?</OptionalLabel>
              <ChipSelect
                options={HOBBIES}
                selected={profile.hobbies}
                onToggle={(v) => toggle("hobbies", v)}
                otherValue={profile.hobbyOther}
                onOtherChange={(v) => setProfile((p) => ({ ...p, hobbyOther: v }))}
              />
            </div>

            {/* Why care */}
            <div className="mb-6">
              <OptionalLabel>Why do you want to provide care?</OptionalLabel>
              <textarea
                value={profile.whyCare}
                onChange={(e) => { if (e.target.value.length <= 300) setProfile((p) => ({ ...p, whyCare: e.target.value })); }}
                placeholder="Watching my grandmother lose her memory inspired me to help other families through similar experiences..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-400">This often resonates with families and helps you stand out.</p>
                <span className={`text-xs font-medium ${profile.whyCare.length >= 270 ? "text-warning-500" : "text-gray-400"}`}>
                  {profile.whyCare.length}/300
                </span>
              </div>
            </div>

            {/* Video intro */}
            <div>
              <OptionalLabel>Add a 45-second video intro</OptionalLabel>
              <p className="text-xs text-gray-400 mb-3">Caregivers with video intros get 3x more requests. Just introduce yourself and share why you&apos;re excited to help families.</p>
              {profile.videoPreview ? (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video src={profile.videoPreview} controls className="w-full max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={() => setProfile((p) => ({ ...p, videoFile: null, videoPreview: null }))}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-xl p-8 text-center cursor-pointer hover:bg-primary-25 transition-colors"
                >
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-600">Upload a video</p>
                  <p className="text-xs text-gray-400 mt-1">MP4, MOV, or WebM &middot; Max 45 seconds</p>
                </div>
              )}
              <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              {!profile.videoPreview && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  You can always add this later.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right: completion tracker (desktop only) */}
        <div className="hidden lg:block">
          <CompletionTracker profile={profile} />
        </div>
      </div>

      {/* Mobile completion tracker */}
      <div className="lg:hidden mt-6">
        <CompletionTracker profile={profile} />
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors order-2 sm:order-1"
        >
          Save and continue later
        </button>
        <div className="relative order-1 sm:order-2 w-full sm:w-auto group">
          <button
            onClick={onContinue}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-[15px] font-semibold transition-colors shadow-sm bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20"
          >
            Continue to identity verification
          </button>
        </div>
      </div>
    </div>
  );
}
