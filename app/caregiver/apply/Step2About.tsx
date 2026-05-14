"use client";

import { useRef } from "react";
import type { ProfileFormState } from "./Step2Profile";

/* ─── Option Data ─────────────────────────────────────────── */

const HOBBIES = [
  "Reading", "Cooking", "Music", "Gardening", "Sports", "Art and crafts",
  "Travel", "Board games and puzzles", "Movies and TV", "Outdoors and hiking", "Volunteering",
];

/* ─── Shared UI ───────────────────────────────────────────── */

function ChipSelect({ options, selected, onToggle, otherValue, onOtherChange }: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
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
              placeholder="Specify..."
              className="px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-40"
            />
          )}
        </div>
      )}
    </div>
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

/* ─── Component ───────────────────────────────────────────── */

export default function Step2About({
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

  const toggle = (key: "hobbies", value: string) => {
    setProfile((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v: string) => v !== value) : [...p[key], value],
    }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, videoFile: file, videoPreview: url }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, photoFile: file, photoPreview: url }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to step 1
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-gray-900">
          About you
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Families will see this when they&apos;re searching for caregivers. Take your time &mdash; you can save and come back anytime.
        </p>
      </div>

      <div className="space-y-6">
      {/* Photo + About me card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-6">
        {/* Photo upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Profile photo <span className="text-error-400">*</span>
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tell families about yourself <span className="text-error-400">*</span>
          </label>
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
      </div>

      {/* A bit about you */}
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
            <p className="text-xs text-gray-400 mt-2 text-center">You can always add this later.</p>
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
          Continue to experience
        </button>
      </div>
    </div>
  );
}
