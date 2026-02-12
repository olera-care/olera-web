"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
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
const CARE_RECIPIENTS = ["Myself", "A loved one"];
const CARE_TYPES = [
  "Help with daily activities",
  "Company & companionship",
  "Skilled nursing",
  "Personal care",
  "Memory & dementia support",
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
const LANGUAGE_OPTIONS = ["English", "Spanish", "Both", "Other"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialStep?: number;
  profile: BusinessProfile;
  userEmail: string;
  onSaved: () => Promise<void>;
}

export default function ProfileEditDrawer({
  isOpen,
  onClose,
  initialStep = 0,
  profile,
  userEmail,
  onSaved,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(initialStep);
  const [visible, setVisible] = useState(false);

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
  const [careTypes, setCareTypes] = useState<string[]>(profile.care_types || []);
  const [timeline, setTimeline] = useState(meta.timeline || "");
  const [notes, setNotes] = useState(profile.description || "");
  const [payments, setPayments] = useState<string[]>(meta.payment_methods || []);
  const [living, setLiving] = useState(meta.living_situation || "");
  const [schedule, setSchedule] = useState(meta.schedule_preference || "");
  const [careLocation, setCareLocation] = useState(meta.care_location || "");
  const [language, setLanguage] = useState(meta.language_preference || "");
  const [about, setAbout] = useState(meta.about_situation || "");

  const savingRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (isOpen) setStep(initialStep); }, [isOpen, initialStep]);
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

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
    setCareTypes(profile.care_types || []);
    setTimeline(m.timeline || "");
    setNotes(profile.description || "");
    setPayments(m.payment_methods || []);
    setLiving(m.living_situation || "");
    setSchedule(m.schedule_preference || "");
    setCareLocation(m.care_location || "");
    setLanguage(m.language_preference || "");
    setAbout(m.about_situation || "");
  }, [profile, userEmail]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleEscape]);

  const saveToDb = useCallback(async () => {
    if (savingRef.current || !isSupabaseConfigured()) return;
    savingRef.current = true;
    try {
      const supabase = createClient();
      // Read current metadata to merge
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
        timeline: timeline || undefined,
        payment_methods: payments.length > 0 ? payments : undefined,
        living_situation: living || undefined,
        schedule_preference: schedule || undefined,
        care_location: careLocation || undefined,
        language_preference: language || undefined,
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
  }, [profile.id, displayName, country, city, state, email, phone, contactPref, careRecipient, careTypes, timeline, notes, payments, living, schedule, careLocation, language, about, onSaved]);

  // Auto-save on selection changes (pills)
  const handlePillSave = useCallback((setter: () => void) => {
    setter();
    // Defer save to next tick so state updates
    setTimeout(() => saveToDb(), 50);
  }, [saveToDb]);

  const handleClose = () => {
    saveToDb();
    onClose();
  };

  if (!mounted || !isOpen) return null;

  const drawerContent = (
    <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" onClick={handleClose} />

      {/* Panel */}
      <div className={`absolute right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${visible ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
            <p className="text-sm text-gray-500 mt-0.5">Step {step + 1} of {STEPS.length} &middot; {STEPS[step]}</p>
          </div>
          <button type="button" onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step progress bar */}
        <div className="flex gap-1 px-6 pt-3 shrink-0">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { saveToDb(); setStep(i); }}
              className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary-600" : "bg-gray-200"}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Basic Info</h4>
                <p className="text-sm text-gray-500 mb-5">Your name and where you&apos;re located.</p>
              </div>
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
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Contact Information</h4>
                <p className="text-sm text-gray-500 mb-5">How providers can reach you.</p>
              </div>
              <Input label="Email" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} />
              <Input label="Phone number" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} />
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2.5">How would you like providers to contact you?</label>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_METHODS.map((m) => (
                    <Pill key={m} label={m} selected={contactPref === m.toLowerCase()} onClick={() => { setContactPref(m.toLowerCase()); setTimeout(saveToDb, 50); }} small />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Care Preferences</h4>
                <p className="text-sm text-gray-500 mb-5">What kind of care are you looking for?</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2.5">Who needs care?</label>
                <div className="flex gap-2">
                  {CARE_RECIPIENTS.map((r) => (
                    <Pill key={r} label={r} selected={careRecipient === r} onClick={() => { setCareRecipient(r); setTimeout(saveToDb, 50); }} small />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2.5">Type of care</label>
                <div className="flex flex-col gap-1.5">
                  {CARE_TYPES.map((ct) => (
                    <Pill key={ct} label={ct} selected={careTypes.includes(ct)} onClick={() => { setCareTypes((prev) => prev.includes(ct) ? prev.filter((x) => x !== ct) : [...prev, ct]); setTimeout(saveToDb, 50); }} small />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2.5">How soon do you need care?</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TIMELINES.map((t) => (
                    <Pill key={t.value} label={t.label} selected={timeline === t.value} onClick={() => { setTimeline(t.value); setTimeout(saveToDb, 50); }} small />
                  ))}
                </div>
              </div>
              <Input label="Additional notes" as="textarea" rows={3} value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} onBlur={() => saveToDb()} placeholder="Any details about the care situation..." />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Payment & Benefits</h4>
                <p className="text-sm text-gray-500 mb-5">How are you planning to pay for care? Select all that apply.</p>
              </div>
              <div className="flex flex-col gap-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <Pill key={opt} label={opt} selected={payments.includes(opt)} onClick={() => { setPayments((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]); setTimeout(saveToDb, 50); }} small />
                ))}
              </div>
              <a
                href="/benefits"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100/60 transition-colors"
              >
                <svg className="w-5 h-5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <div>
                  <p className="text-base font-semibold text-gray-800">Not sure what you qualify for?</p>
                  <p className="text-sm text-gray-500">Benefits Finder &rarr;</p>
                </div>
              </a>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Living Situation</h4>
                <p className="text-sm text-gray-500 mb-5">Where does the person who needs care live?</p>
              </div>
              <div className="flex flex-col gap-2">
                {LIVING_OPTIONS.map((opt) => (
                  <Pill key={opt} label={opt} selected={living === opt} onClick={() => { setLiving(opt); setTimeout(saveToDb, 50); }} small />
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Schedule & Location</h4>
                <p className="text-sm text-gray-500 mb-5">When and where is care needed?</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2.5">What times of day?</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SCHEDULE_OPTIONS.map((opt) => (
                    <Pill key={opt} label={opt} selected={schedule === opt} onClick={() => { setSchedule(opt); setTimeout(saveToDb, 50); }} small />
                  ))}
                </div>
              </div>
              <Input label="Care location / area" value={careLocation} onChange={(e) => setCareLocation((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. North Austin, near Anderson Mill" />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">Language & More</h4>
                <p className="text-sm text-gray-500 mb-5">Any additional preferences or details.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2.5">Language preference</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <Pill key={opt} label={opt} selected={language === opt} onClick={() => { setLanguage(opt); setTimeout(saveToDb, 50); }} small />
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
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0 bg-white">
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
    </div>
  );

  return createPortal(drawerContent, document.body);
}
