"use client";

import { useState, useEffect, useCallback, useRef, type ChangeEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { useProfileCompleteness, type SectionStatus } from "./completeness";
import { BenefitsFinderBanner } from "./ProfileEditContent";
import Pill from "@/components/providers/connection-card/Pill";
import Input from "@/components/ui/Input";

// ── Constants ──

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "As soon as possible",
  within_1_month: "Within a month",
  within_3_months: "In a few months",
  exploring: "Just researching",
};

const CONTACT_PREF_LABELS: Record<string, string> = {
  call: "Phone call",
  text: "Text message",
  email: "Email",
};

const CONTACT_METHODS = ["Call", "Text", "Email"] as const;
const CARE_RECIPIENTS = ["Myself", "My parent", "My spouse", "Someone else"];
const CARE_TYPES = [
  "Home Care", "Home Health Care", "Assisted Living", "Memory Care",
  "Nursing Home", "Independent Living", "Adult Day Care",
  "Rehabilitation", "Private Caregiver",
];
const TIMELINES = [
  { value: "immediate", label: "As soon as possible" },
  { value: "within_1_month", label: "Within a month" },
  { value: "within_3_months", label: "In a few months" },
  { value: "exploring", label: "Just researching" },
];
const PAYMENT_OPTIONS = [
  "Medicare", "Medicaid", "Private insurance", "Private pay",
  "Veterans benefits", "Long-term care insurance", "I'm not sure",
];
const CARE_NEED_OPTIONS = [
  "Personal Care", "Household Tasks", "Health Management",
  "Companionship", "Financial Help", "Memory Care", "Mobility Help",
];
const LIVING_OPTIONS = [
  "Lives alone", "Lives with family", "Lives with caregiver",
  "Assisted living facility", "Other",
];
const SCHEDULE_OPTIONS = [
  "Mornings", "Afternoons", "Evenings", "Overnight", "Full-time", "Flexible",
];
const LANGUAGE_OPTIONS = ["English", "Spanish", "French", "Mandarin", "Other"];

function readLanguages(meta: FamilyMetadata): string[] {
  const v = meta.language_preference;
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v) return [v];
  return [];
}

// ── Main Component ──

interface FamilyProfileViewProps {
  /** Override the profile to render. Falls back to activeProfile from context. */
  profile?: BusinessProfile | null;
}

export default function FamilyProfileView({ profile: profileProp }: FamilyProfileViewProps = {}) {
  const { user, activeProfile, refreshAccountData } = useAuth();
  const [editingSection, setEditingSection] = useState<number | null>(null);

  const profile = (profileProp ?? activeProfile) as BusinessProfile;
  const meta = (profile?.metadata || {}) as FamilyMetadata;
  const userEmail = user?.email || "";

  const { percentage, sectionStatus } = useProfileCompleteness(profile, userEmail);

  // ── Form state ──
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [country, setCountry] = useState(meta.country || "");
  const [city, setCity] = useState(profile?.city || "");
  const [state, setState] = useState(profile?.state || "");
  const [email, setEmail] = useState(profile?.email || userEmail || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [contactPref, setContactPref] = useState<string>(meta.contact_preference || "");
  const [careRecipient, setCareRecipient] = useState(meta.relationship_to_recipient || "");
  const [age, setAge] = useState(meta.age ? String(meta.age) : "");
  const [careTypes, setCareTypes] = useState<string[]>(profile?.care_types || []);
  const [careNeeds, setCareNeeds] = useState<string[]>(meta.care_needs || []);
  const [timeline, setTimeline] = useState(meta.timeline || "");
  const [notes, setNotes] = useState(profile?.description || "");
  const [payments, setPayments] = useState<string[]>(meta.payment_methods || []);
  const [living, setLiving] = useState(meta.living_situation || "");
  const [schedule, setSchedule] = useState(meta.schedule_preference || "");
  const [careLocation, setCareLocation] = useState(meta.care_location || "");
  const [languages, setLanguages] = useState<string[]>(readLanguages(meta));
  const [about, setAbout] = useState(meta.about_situation || "");

  // Image upload
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form state when profile refreshes
  useEffect(() => {
    if (!profile) return;
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

  // ── Save logic ──
  const savingRef = useRef(false);
  const saveToDbRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const saveToDb = useCallback(async () => {
    if (savingRef.current || !isSupabaseConfigured() || !profile) return;
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

      await refreshAccountData();
    } catch (err) {
      console.error("[olera] auto-save failed:", err);
    } finally {
      savingRef.current = false;
    }
  }, [profile?.id, displayName, country, city, state, email, phone, contactPref, careRecipient, age, careTypes, careNeeds, timeline, notes, payments, living, schedule, careLocation, languages, about, refreshAccountData]);

  saveToDbRef.current = saveToDb;

  const deferredSave = useCallback(() => {
    setTimeout(() => saveToDbRef.current(), 50);
  }, []);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be under 5MB.");
      return;
    }
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("profileId", profile.id);
      formData.append("setAsProfilePhoto", "true");
      const res = await fetch("/api/profile/upload-image", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json();
        setImageError(data.error || "Upload failed.");
        return;
      }
      await refreshAccountData();
    } catch {
      setImageError("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditToggle = (section: number) => {
    if (editingSection === section) {
      // Save and close
      saveToDb();
      setEditingSection(null);
    } else {
      // Save current section if open, then switch
      if (editingSection !== null) saveToDb();
      setEditingSection(section);
    }
  };

  const handleCancel = () => {
    // Revert form state from profile and close
    if (profile) {
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
    }
    setEditingSection(null);
  };

  if (!profile) return null;

  // ── Derived display values ──
  const location = [profile.city, profile.state, meta.country].filter(Boolean).join(", ");
  const careTypesDisplay = profile.care_types?.length ? profile.care_types.join(", ") : null;
  const timelineDisplay = meta.timeline ? TIMELINE_LABELS[meta.timeline] || meta.timeline : null;

  const combineSectionStatus = (): SectionStatus => {
    const statuses = [sectionStatus[4], sectionStatus[5], sectionStatus[6]].filter(Boolean);
    if (statuses.length === 0) return "empty";
    if (statuses.every((s) => s === "complete")) return "complete";
    if (statuses.every((s) => s === "empty")) return "empty";
    return "incomplete";
  };

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl bg-white border border-gray-200/80 shadow-sm divide-y divide-gray-100">
      {/* ── Profile Header ── */}
      <div className={`${editingSection === 0 ? "bg-gray-50/50" : ""} transition-colors`}>
        <div className="p-6 flex items-center gap-5">
          <div className="shrink-0">
            <div className="w-[88px] h-[88px] rounded-full overflow-hidden bg-gray-50 ring-[3px] ring-gray-100 shadow-xs flex items-center justify-center">
              {profile.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.image_url} alt={profile.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-0.5 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-display font-bold text-gray-900 truncate tracking-tight">
              {profile.display_name || "Your Name"}
            </h2>
            <p className="text-base text-gray-500 mt-1">
              {location || "Location not set"}
              <span className="mx-1.5 text-gray-300">&middot;</span>
              Family care seeker
            </p>
            {percentage < 100 && (
              <div className="flex items-center gap-2.5 mt-2.5">
                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${percentage >= 80 ? "bg-gray-700" : "bg-warning-400"}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={`text-xs font-medium ${percentage >= 80 ? "text-gray-600" : "text-warning-600"}`}>
                  {percentage}%
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleEditToggle(0)}
            className="shrink-0 self-start mt-1 text-[14px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {editingSection === 0 ? "Cancel" : "Edit"}
          </button>
        </div>

        {/* Inline edit: Basic Info */}
        {editingSection === 0 && (
          <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-5">
            {/* Photo upload */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">Profile photo</label>
              <div className="flex items-center gap-4">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={imageUploading} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                  className="w-20 h-20 rounded-full overflow-hidden bg-gray-50 ring-[3px] ring-gray-100 hover:ring-warm-200 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-center group relative shrink-0"
                >
                  {profile.image_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={profile.image_url} alt={profile.display_name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-full flex flex-col items-center justify-center gap-0.5">
                        <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">Change</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5 text-gray-400 group-hover:text-gray-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-[9px] font-medium">Add</span>
                    </div>
                  )}
                  {imageUploading && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-full">
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </button>
                <div className="text-sm text-gray-500">
                  <p className="font-medium text-gray-700">{profile.image_url ? "Change photo" : "Add a photo"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, or WebP. Max 5MB.</p>
                </div>
              </div>
              {imageError && <p className="text-sm text-red-600 mt-2">{imageError}</p>}
            </div>
            <Input label="Display name" value={displayName} onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="Your full name" />
            <Input label="Country" value={country} onChange={(e) => setCountry((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. United States, Ghana" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="City" value={city} onChange={(e) => setCity((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. Houston" />
              <Input label="State / Region" value={state} onChange={(e) => setState((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. TX" />
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={() => { saveToDb(); setEditingSection(null); }} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Contact Information ── */}
      <SectionCard
        title="Contact Information"
        status={sectionStatus[1]}
        isEditing={editingSection === 1}
        onEdit={() => handleEditToggle(1)}
        onCancel={handleCancel}
        onSave={() => { saveToDb(); setEditingSection(null); }}
        editContent={
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
        }
      >
        <div className="divide-y divide-gray-50">
          <ViewRow label="Email" value={profile.email || userEmail || null} />
          <ViewRow label="Phone" value={profile.phone} />
          <ViewRow label="Preferred contact method" value={meta.contact_preference ? CONTACT_PREF_LABELS[meta.contact_preference] || meta.contact_preference : null} />
        </div>
      </SectionCard>

      {/* ── Care Preferences ── */}
      <SectionCard
        title="Care Preferences"
        status={sectionStatus[2]}
        isEditing={editingSection === 2}
        onEdit={() => handleEditToggle(2)}
        onCancel={handleCancel}
        onSave={() => { saveToDb(); setEditingSection(null); }}
        editContent={
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
        }
      >
        <div className="divide-y divide-gray-50">
          <ViewRow label="Who needs care" value={meta.relationship_to_recipient || null} />
          <ViewRow label="Age of person needing care" value={meta.age ? String(meta.age) : null} />
          <ViewRow label="Type of care" value={careTypesDisplay} />
          <ViewRow label="Care needs" value={meta.care_needs && meta.care_needs.length > 0 ? meta.care_needs.join(", ") : null} />
          <ViewRow label="Timeline" value={timelineDisplay} />
          <ViewRow label="Additional notes" value={profile.description || null} />
        </div>
      </SectionCard>

      {/* ── Payment & Benefits ── */}
      <SectionCard
        title="Payment & Benefits"
        status={sectionStatus[3]}
        isEditing={editingSection === 3}
        onEdit={() => handleEditToggle(3)}
        onCancel={handleCancel}
        onSave={() => { saveToDb(); setEditingSection(null); }}
        editContent={
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <Pill key={opt} label={opt} selected={payments.includes(opt)} onClick={() => { setPayments((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]); deferredSave(); }} small />
              ))}
            </div>
            {meta.saved_benefits && meta.saved_benefits.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Saved from Benefits Finder</label>
                <div className="flex flex-wrap gap-2">
                  {meta.saved_benefits.map((benefit) => (
                    <span key={benefit} className="px-3.5 py-2 text-sm rounded-full border border-gray-200 bg-gray-50 text-gray-600 font-normal">
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <BenefitsFinderBanner />
          </div>
        }
      >
        {meta.payment_methods && meta.payment_methods.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {meta.payment_methods.map((method) => (
              <span key={method} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-[#F5F4F1] text-gray-700">
                {method}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-gray-300 mb-4">&mdash;</p>
        )}
        {meta.saved_benefits && meta.saved_benefits.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Saved Benefits</p>
            <div className="flex flex-wrap gap-2">
              {meta.saved_benefits.map((benefit) => (
                <span key={benefit} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-50 text-gray-600 border border-gray-200">
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}
        <BenefitsFinderBanner />
      </SectionCard>

      {/* ── More About Your Situation ── */}
      <SectionCard
        title="More About Your Situation"
        status={combineSectionStatus()}
        isEditing={editingSection === 4}
        onEdit={() => handleEditToggle(4)}
        onCancel={handleCancel}
        onSave={() => { saveToDb(); setEditingSection(null); }}
        editContent={
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">Living situation</label>
              <div className="flex flex-col gap-2">
                {LIVING_OPTIONS.map((opt) => (
                  <Pill key={opt} label={opt} selected={living === opt} onClick={() => { setLiving(opt); deferredSave(); }} small />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2.5">What times of day?</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SCHEDULE_OPTIONS.map((opt) => (
                  <Pill key={opt} label={opt} selected={schedule === opt} onClick={() => { setSchedule(opt); deferredSave(); }} small />
                ))}
              </div>
            </div>
            <Input label="Care location / area" value={careLocation} onChange={(e) => setCareLocation((e.target as HTMLInputElement).value)} onBlur={() => saveToDb()} placeholder="e.g. North Austin, near Anderson Mill" />
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
        }
      >
        <div className="divide-y divide-gray-50">
          <ViewRow label="Living situation" value={meta.living_situation || null} />
          <ViewRow label="Schedule preference" value={meta.schedule_preference || null} />
          <ViewRow label="Care location" value={meta.care_location || null} />
          <ViewRow label="Language preference" value={Array.isArray(meta.language_preference) ? meta.language_preference.join(", ") : meta.language_preference || null} />
          <ViewRow label="About the care situation" value={meta.about_situation ? (meta.about_situation.length > 80 ? meta.about_situation.slice(0, 80) + "..." : meta.about_situation) : null} />
        </div>
      </SectionCard>
      </div>
    </div>
  );
}

// ── Helper Components ──

function SectionBadge({ status }: { status: SectionStatus | undefined }) {
  if (!status || status === "complete") {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success-50">
        <svg className="w-3 h-3 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }
  const label = status === "empty" ? "Not added" : "Incomplete";
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
      {label}
    </span>
  );
}

function SectionCard({
  title,
  status,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  editContent,
  children,
}: {
  title: string;
  status: SectionStatus | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  editContent: React.ReactNode;
  children: React.ReactNode;
}) {
  const editLabel = isEditing ? "Cancel" : status === "empty" ? "Add \u2192" : "Edit";

  return (
    <div className={`p-6 ${isEditing ? "bg-gray-50/50" : ""} transition-colors`}>
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-4">
        <h3 className="text-[15px] font-display font-bold text-gray-900">{title}</h3>
        <SectionBadge status={status} />
        <button
          type="button"
          onClick={isEditing ? onCancel : onEdit}
          className="ml-auto text-[14px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          {editLabel}
        </button>
      </div>

      {isEditing ? (
        <div>
          {editContent}
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
              Done
            </button>
          </div>
        </div>
      ) : (
        <div role="button" tabIndex={0} onClick={onEdit} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEdit(); } }} className="cursor-pointer">
          {children}
        </div>
      )}
    </div>
  );
}

function ViewRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="py-3.5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      {value ? (
        <p className="text-[15px] text-gray-900 mt-1">{value}</p>
      ) : (
        <p className="text-[15px] text-gray-300 mt-1">&mdash;</p>
      )}
    </div>
  );
}
