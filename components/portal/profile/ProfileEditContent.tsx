"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import Pill from "@/components/providers/connection-card/Pill";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const STEPS = [
  "Basic Info",
  "Contact Information",
  "Care Preferences",
  "Payment & Benefits",
  "Living Situation",
  "Schedule & Location",
  "Language & More",
];

const CONTACT_METHODS = ["Call", "Text", "Email"] as const;
const CARE_RECIPIENTS = ["Myself", "My parent", "My spouse", "Someone else"];
const CARE_TYPES = [
  "Home Care",
  "Home Health Care",
  "Assisted Living",
  "Memory Care",
  "Nursing Home",
  "Independent Living",
  "Hospice Care",
  "Adult Day Care",
  "Rehabilitation",
  "Private Caregiver",
];
const TIMELINES = [
  { value: "immediate", label: "As soon as possible" },
  { value: "within_1_month", label: "Within a month" },
  { value: "within_3_months", label: "In a few months" },
  { value: "exploring", label: "Just researching" },
];
const PAYMENT_OPTIONS = [
  "Medicare",
  "Medicaid",
  "Private insurance",
  "Private pay",
  "Veterans benefits",
  "Long-term care insurance",
  "I'm not sure",
];
const CARE_NEED_OPTIONS = [
  "Personal Care",
  "Household Tasks",
  "Health Management",
  "Companionship",
  "Financial Help",
  "Memory Care",
  "Mobility Help",
];
const LIVING_OPTIONS = [
  "Lives alone",
  "Lives with family",
  "Lives with caregiver",
  "Assisted living facility",
  "Other",
];
const SCHEDULE_OPTIONS = [
  "Mornings",
  "Afternoons",
  "Evenings",
  "Overnight",
  "Full-time",
  "Flexible",
];
const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Mandarin", "Other"];

interface ProfileEditContentProps {
  profile: BusinessProfile;
  userEmail: string;
  onSaved: () => Promise<void>;
  onClose: () => void;
  initialStep?: number;
}

/** Safely read language_preference from metadata (handles legacy string values) */
function readLanguages(meta: FamilyMetadata): string[] {
  const v = meta.language_preference;
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v) return [v];
  return [];
}

export default function ProfileEditContent({
  profile,
  userEmail,
  onSaved,
  onClose,
  initialStep = 0,
}: ProfileEditContentProps) {
  const [step, setStep] = useState(initialStep);

  // Form state
  const meta = (profile.metadata || {}) as FamilyMetadata;
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [country, setCountry] = useState(meta.country || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [email, setEmail] = useState(profile.email || userEmail || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [contactPref, setContactPref] = useState<string>(meta.contact_preference || "");
  const [careRecipient, setCareRecipient] = useState(meta.relationship_to_recipient || "");
  const [age, setAge] = useState(meta.age ? String(meta.age) : "");
  const [careTypes, setCareTypes] = useState<string[]>(profile.care_types || []);
  const [careNeeds, setCareNeeds] = useState<string[]>(meta.care_needs || []);
  const [timeline, setTimeline] = useState(meta.timeline || "");
  const [notes, setNotes] = useState(profile.description || "");
  const [payments, setPayments] = useState<string[]>(meta.payment_methods || []);
  const [living, setLiving] = useState(meta.living_situation || "");
  const [schedule, setSchedule] = useState(meta.schedule_preference || "");
  const [careLocation, setCareLocation] = useState(meta.care_location || "");
  const [languages, setLanguages] = useState<string[]>(readLanguages(meta));
  const [about, setAbout] = useState(meta.about_situation || "");

  const savingRef = useRef(false);
  const saveToDbRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Sync from profile when it changes (after save + refresh)
  useEffect(() => {
    const m = (profile.metadata || {}) as FamilyMetadata;
    setDisplayName(profile.display_name || "");
    setCountry(m.country || "");
    setCity(profile.city || "");
    setState(profile.state || "");
    setEmail(profile.email || userEmail || "");
    setPhone(profile.phone || "");
    setContactPref(m.contact_preference || "");
    setCareRecipient(m.relationship_to_recipient || "");
    setAge(m.age ? String(m.age) : "");
    setCareTypes(profile.care_types || []);
    setCareNeeds(m.care_needs || []);
    setTimeline(m.timeline || "");
    setNotes(profile.description || "");
    setPayments(m.payment_methods || []);
    setLiving(m.living_situation || "");
    setSchedule(m.schedule_preference || "");
    setCareLocation(m.care_location || "");
    setLanguages(readLanguages(m));
    setAbout(m.about_situation || "");
  }, [profile, userEmail]);

  const saveToDb = useCallback(async () => {
    if (savingRef.current || !isSupabaseConfigured()) return;
    savingRef.current = true;
    try {
      const supabase = createClient();
      const { data: current } = await supabase
        .from("business_profiles")
        .select("metadata")
        .eq("id", profile.id)
        .single();

      const merged = {
        ...(current?.metadata || {}),
        country: country || undefined,
        contact_preference: contactPref || undefined,
        relationship_to_recipient: careRecipient || undefined,
        age: age ? Number(age) : undefined,
        timeline: timeline || undefined,
        payment_methods: payments.length > 0 ? payments : undefined,
        care_needs: careNeeds.length > 0 ? careNeeds : undefined,
        living_situation: living || undefined,
        schedule_preference: schedule || undefined,
        care_location: careLocation || undefined,
        language_preference: languages.length > 0 ? languages : undefined,
        about_situation: about || undefined,
      };

      await supabase
        .from("business_profiles")
        .update({
          display_name: displayName || null,
          city: city || null,
          state: state || null,
          email: email || null,
          phone: phone || null,
          description: notes || null,
          care_types: careTypes,
          metadata: merged,
        })
        .eq("id", profile.id);

      await onSaved();
    } catch (err) {
      console.error("[olera] auto-save failed:", err);
    } finally {
      savingRef.current = false;
    }
  }, [profile.id, displayName, country, city, state, email, phone, contactPref, careRecipient, careTypes, timeline, notes, payments, living, schedule, careLocation, languages, about, onSaved]);

  // Keep ref in sync so deferred pill saves always use the latest function
  saveToDbRef.current = saveToDb;

  /** Schedule a save on next tick — pill selections update state then save via ref */
  const deferredSave = useCallback(() => {
    setTimeout(() => saveToDbRef.current(), 50);
  }, []);

  const handleClose = () => {
    saveToDb();
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-7 py-5 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
          <p className="text-sm mt-0.5">
            <span className="font-semibold text-gray-900">Step {step + 1}</span>
            <span className="text-gray-400"> of {STEPS.length} &middot; {STEPS[step]}</span>
          </p>
        </div>
        <button type="button" onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {step === 0 && (
          <div className="space-y-5">
            <Input label="Display name" value={displayName} onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="Your full name" />
            <Input label="Country" value={country} onChange={(e) => setCountry((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. United States, Ghana" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" value={city} onChange={(e) => setCity((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. Houston" />
              <Input label="State / Region" value={state} onChange={(e) => setState((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. TX" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Input label="Email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} />
            <Input label="Phone number" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} />
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">How would you like providers to contact you?</label>
              <div className="flex flex-wrap gap-2">
                {CONTACT_METHODS.map((m) => (
                  <Pill key={m} label={m} selected={contactPref === m.toLowerCase()} onClick={() => { setContactPref(m.toLowerCase()); deferredSave(); }} small />
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">Who needs care?</label>
              <div className="flex gap-2">
                {CARE_RECIPIENTS.map((r) => (
                  <Pill key={r} label={r} selected={careRecipient === r} onClick={() => { setCareRecipient(r); deferredSave(); }} small />
                ))}
              </div>
            </div>
            <Input label="Age of person needing care" type="number" placeholder="e.g. 72" value={age} onChange={(e) => setAge((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} />
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">Type of care needed</label>
              <div className="flex flex-wrap gap-1.5">
                {CARE_TYPES.map((ct) => (
                  <Pill key={ct} label={ct} selected={careTypes.includes(ct)} onClick={() => { setCareTypes((prev) => prev.includes(ct) ? prev.filter((x) => x !== ct) : [...prev, ct]); deferredSave(); }} small />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">Care needs</label>
              <div className="flex flex-wrap gap-1.5">
                {CARE_NEED_OPTIONS.map((need) => (
                  <Pill key={need} label={need} selected={careNeeds.includes(need)} onClick={() => { setCareNeeds((prev) => prev.includes(need) ? prev.filter((x) => x !== need) : [...prev, need]); deferredSave(); }} small />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">How soon do you need care?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TIMELINES.map((t) => (
                  <Pill key={t.value} label={t.label} selected={timeline === t.value} onClick={() => { setTimeline(t.value); deferredSave(); }} small />
                ))}
              </div>
            </div>
            <Input label="Additional notes" as="textarea" rows={3} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} onBlur={() => saveToDb()} placeholder="Any details about the care situation..." />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <Pill key={opt} label={opt} selected={payments.includes(opt)} onClick={() => { setPayments((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]); deferredSave(); }} small />
              ))}
            </div>
            {meta.saved_benefits && meta.saved_benefits.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Saved from Benefits Finder
                </label>
                <div className="flex flex-wrap gap-2">
                  {meta.saved_benefits.map((benefit) => (
                    <span
                      key={benefit}
                      className="px-3.5 py-2 text-sm rounded-full border-[1.5px] border-amber-300 bg-amber-50 text-amber-700 font-normal"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <BenefitsFinderBanner />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div className="flex flex-col gap-2">
              {LIVING_OPTIONS.map((opt) => (
                <Pill key={opt} label={opt} selected={living === opt} onClick={() => { setLiving(opt); deferredSave(); }} small />
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">What times of day?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SCHEDULE_OPTIONS.map((opt) => (
                  <Pill key={opt} label={opt} selected={schedule === opt} onClick={() => { setSchedule(opt); deferredSave(); }} small />
                ))}
              </div>
            </div>
            <Input label="Care location / area" value={careLocation} onChange={(e) => setCareLocation((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. North Austin, near Anderson Mill" />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">Language preference</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <Pill key={opt} label={opt} selected={languages.includes(opt)} onClick={() => { setLanguages((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]); deferredSave(); }} small />
                ))}
              </div>
            </div>
            <div>
              <Input label="About the care situation" as="textarea" rows={4} value={about} onChange={(e) => setAbout((e.target as HTMLTextAreaElement).value)} onBlur={() => saveToDb()} placeholder="Tell providers more about daily life and what you're looking for..." maxLength={500} />
              <p className="text-sm text-gray-400 mt-1 text-right">{about.length}/500</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-7 py-4 border-t border-gray-200 flex items-center justify-between shrink-0 bg-white">
        {step > 0 ? (
          <Button variant="secondary" size="md" onClick={() => { saveToDb(); setStep(step - 1); }}>&larr; Back</Button>
        ) : <div />}
        {step < STEPS.length - 1 ? (
          <Button size="md" onClick={() => { saveToDb(); setStep(step + 1); }}>Next: {STEPS[step + 1]} &rarr;</Button>
        ) : (
          <Button size="md" onClick={handleClose}>Done &#10003;</Button>
        )}
      </div>
    </div>
  );
}

/** Benefits Finder CTA — reusable across edit content and profile view */
export function BenefitsFinderBanner() {
  return (
    <a
      href="/benefits"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-gray-900">Not sure what you qualify for?</p>
        <p className="text-sm text-amber-700 font-medium">Try our Benefits Finder</p>
      </div>
      <svg className="w-5 h-5 text-amber-300 shrink-0 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
