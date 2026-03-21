"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";

// ============================================================
// Types
// ============================================================

type Step = 1 | 2 | 3 | 4;

interface ProfileEditWizardProps {
  profile: BusinessProfile;
  userEmail?: string;
  onClose: () => void;
  onSaved: () => void;
  /** Optional: start at a specific step */
  initialStep?: Step;
}

// ============================================================
// Constants
// ============================================================

const STEP_TITLES: Record<Step, string> = {
  1: "Basic Information",
  2: "Contact Details",
  3: "Care Preferences",
  4: "Payment & Benefits",
};

const STEP_SUBTITLES: Record<Step, string> = {
  1: "Tell us about yourself",
  2: "How can providers reach you?",
  3: "What kind of care do you need?",
  4: "How will you pay for care?",
};

const WHO_OPTIONS = [
  { id: "Myself", label: "Myself", icon: "user" },
  { id: "My parent", label: "My parent", icon: "parent" },
  { id: "My spouse", label: "My spouse", icon: "heart" },
  { id: "Someone else", label: "Someone else", icon: "people" },
] as const;

const CARE_TYPES = [
  "Home Care",
  "Home Health Care",
  "Assisted Living",
  "Memory Care",
  "Nursing Home",
  "Independent Living",
  "Hospice Care",
  "Adult Day Care",
] as const;

const CONTACT_METHODS = [
  { id: "call", label: "Phone call" },
  { id: "text", label: "Text message" },
  { id: "email", label: "Email" },
] as const;

const TIMELINES = [
  { value: "immediate", label: "As soon as possible" },
  { value: "within_1_month", label: "Within a month" },
  { value: "within_3_months", label: "In a few months" },
  { value: "exploring", label: "Just researching" },
] as const;

const PAYMENT_OPTIONS = [
  "Medicare",
  "Medicaid",
  "Private insurance",
  "Private pay",
  "Veterans benefits",
  "Long-term care insurance",
] as const;

// ============================================================
// Helper Components
// ============================================================

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            i < current
              ? "bg-primary-600"
              : i === current
              ? "bg-primary-600 scale-125"
              : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function StepNav({
  steps,
  current,
  onSelect,
}: {
  steps: { num: Step; label: string }[];
  current: Step;
  onSelect: (step: Step) => void;
}) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {steps.map(({ num, label }) => (
        <button
          key={num}
          type="button"
          onClick={() => onSelect(num)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            current === num
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function WhoIcon({ type }: { type: string }) {
  const iconClass = "w-5 h-5";

  switch (type) {
    case "user":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case "parent":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "heart":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "people":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    default:
      return null;
  }
}

// ============================================================
// Main Component
// ============================================================

export default function ProfileEditWizard({
  profile,
  userEmail = "",
  onClose,
  onSaved,
  initialStep = 1,
}: ProfileEditWizardProps) {
  const { refreshAccountData } = useAuth();
  const meta = (profile.metadata || {}) as FamilyMetadata;

  // Step state
  const [step, setStep] = useState<Step>(initialStep);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Step 1: Basic Info
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [locationInput, setLocationInput] = useState(
    profile.city && profile.state ? `${profile.city}, ${profile.state}` : ""
  );
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput);
  useClickOutside(cityDropdownRef, () => setShowCityDropdown(false));

  // Image upload
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [localImageUrl, setLocalImageUrl] = useState(profile.image_url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Contact
  const [email, setEmail] = useState(profile.email || userEmail || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [contactPref, setContactPref] = useState<string>(meta.contact_preference || "");

  // Step 3: Care Preferences
  const [whoNeedsCare, setWhoNeedsCare] = useState(meta.relationship_to_recipient || "");
  const [careTypes, setCareTypes] = useState<string[]>(profile.care_types || []);
  const [timeline, setTimeline] = useState(meta.timeline || "");

  // Step 4: Payment
  const [payments, setPayments] = useState<string[]>(meta.payment_methods || []);

  // Preload cities on mount
  useEffect(() => {
    preloadCities();
  }, [preloadCities]);

  // Handle city selection
  const handleCitySelect = (cityName: string, stateCode: string) => {
    setCity(cityName);
    setState(stateCode);
    setLocationInput(`${cityName}, ${stateCode}`);
    setShowCityDropdown(false);
  };

  // Handle image upload
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
      const data = await res.json();
      setLocalImageUrl(data.url || profile.image_url);
    } catch {
      setImageError("Failed to upload image. Please try again.");
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Toggle care type selection
  const toggleCareType = (type: string) => {
    setCareTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Toggle payment option
  const togglePayment = (option: string) => {
    setPayments((prev) =>
      prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option]
    );
  };

  // Auto-save function (doesn't close modal)
  const saveChanges = useCallback(async () => {
    if (!isSupabaseConfigured() || !profile) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: current } = await supabase
        .from("business_profiles")
        .select("metadata")
        .eq("id", profile.id)
        .single();

      const existingMeta = (current?.metadata || {}) as Record<string, unknown>;

      const updatedMeta = {
        ...existingMeta,
        contact_preference: contactPref || undefined,
        relationship_to_recipient: whoNeedsCare || undefined,
        timeline: timeline || undefined,
        payment_methods: payments.length > 0 ? payments : undefined,
      };

      await supabase
        .from("business_profiles")
        .update({
          display_name: displayName || null,
          city: city || null,
          state: state || null,
          email: email || null,
          phone: phone || null,
          care_types: careTypes,
          metadata: updatedMeta,
        })
        .eq("id", profile.id);

      await refreshAccountData();
    } catch (err) {
      console.error("[ProfileEditWizard] Auto-save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [
    profile,
    displayName,
    city,
    state,
    email,
    phone,
    contactPref,
    whoNeedsCare,
    careTypes,
    timeline,
    payments,
    refreshAccountData,
  ]);

  // Track if initial load is done (to prevent saving on mount)
  const initialLoadDone = useRef(false);
  useEffect(() => {
    initialLoadDone.current = true;
  }, []);

  // Debounced auto-save when any field changes
  useEffect(() => {
    if (!initialLoadDone.current) return;

    setHasChanges(true);
    const timer = setTimeout(() => {
      saveChanges();
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [
    displayName,
    city,
    state,
    email,
    phone,
    contactPref,
    whoNeedsCare,
    careTypes,
    timeline,
    payments,
    saveChanges,
  ]);

  // Handle close - just close, changes are already saved
  const handleClose = useCallback(() => {
    onSaved(); // Refresh parent data
    onClose();
  }, [onSaved, onClose]);

  // Step validation (optional - for visual feedback)
  const isStep1Valid = displayName.trim().length > 0;
  const isStep3Valid = careTypes.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-display font-bold text-gray-900">
              Edit Profile
            </h2>
            <StepNav
              steps={[
                { num: 1, label: "Info" },
                { num: 2, label: "Contact" },
                { num: 3, label: "Care" },
                { num: 4, label: "Payment" },
              ]}
              current={step}
              onSelect={setStep}
            />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-[400px]">
            {/* Form Content */}
            <div className="p-6 lg:p-8">
              {/* Step title */}
              <div className="mb-6">
                <p className="text-sm font-medium text-primary-600 mb-1">
                  Step {step} of 4
                </p>
                <h3 className="text-xl lg:text-2xl font-display font-bold text-gray-900">
                  {STEP_TITLES[step]}
                </h3>
                <p className="text-gray-500 mt-1">
                  {STEP_SUBTITLES[step]}
                </p>
              </div>

              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* Photo upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Profile photo
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={imageUploading}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading}
                        className="w-20 h-20 rounded-full overflow-hidden bg-gray-50 ring-[3px] ring-gray-100 hover:ring-primary-200 shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center group relative shrink-0"
                      >
                        {localImageUrl ? (
                          <>
                            <Image
                              src={localImageUrl}
                              alt={displayName || "Profile"}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all rounded-full flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-0.5 text-gray-400 group-hover:text-primary-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                        )}
                        {imageUploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full">
                            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                      <div className="text-sm">
                        <p className="font-medium text-gray-700">
                          {localImageUrl ? "Change photo" : "Add a photo"}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          JPG, PNG or WebP. Max 5MB.
                        </p>
                      </div>
                    </div>
                    {imageError && (
                      <p className="text-sm text-red-600 mt-2">{imageError}</p>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Location */}
                  <div ref={cityDropdownRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      ref={cityInputRef}
                      type="text"
                      value={locationInput}
                      onChange={(e) => {
                        setLocationInput(e.target.value);
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      placeholder="Search for your city..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                    {showCityDropdown && cityResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {cityResults.map((result) => (
                          <button
                            key={`${result.city}-${result.state}`}
                            type="button"
                            onClick={() => handleCitySelect(result.city, result.state)}
                            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                          >
                            <span className="font-medium text-gray-900">{result.city}</span>
                            <span className="text-gray-500">, {result.state}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Contact Details */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  {/* Preferred contact method */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Preferred contact method
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {CONTACT_METHODS.map(({ id, label }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setContactPref(id)}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                            contactPref === id
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Care Preferences */}
              {step === 3 && (
                <div className="space-y-6">
                  {/* Who needs care */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      Who needs care?
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {WHO_OPTIONS.map(({ id, label, icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setWhoNeedsCare(id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            whoNeedsCare === id
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className={`${whoNeedsCare === id ? "text-primary-600" : "text-gray-400"}`}>
                            <WhoIcon type={icon} />
                          </div>
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Care types */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      What type of care are you looking for?
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {CARE_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleCareType(type)}
                          className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                            careTypes.includes(type)
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-3">
                      When do you need care?
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {TIMELINES.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTimeline(value)}
                          className={`p-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                            timeline === value
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Payment & Benefits */}
              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">
                      How do you plan to pay for care?
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Select all that apply. This helps providers understand your options.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => togglePayment(option)}
                          className={`p-3 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                            payments.includes(option)
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                payments.includes(option)
                                  ? "border-primary-500 bg-primary-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {payments.includes(option) && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {option}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Benefits finder CTA */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-warm-50 to-vanilla-100 border border-warm-200/60">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-warm-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Not sure what you qualify for?</h4>
                        <p className="text-sm text-gray-600 mt-0.5">
                          Use our Benefits Finder to discover programs that can help cover care costs.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[120px]">
            {hasChanges && (
              saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Changes saved</span>
                </>
              )
            )}
          </div>

          <ProgressDots current={step - 1} total={4} />

          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
