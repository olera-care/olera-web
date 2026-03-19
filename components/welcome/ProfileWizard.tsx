"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import ProfileCompleteModal from "@/components/welcome/ProfileCompleteModal";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCitySearch } from "@/hooks/use-city-search";
import { useClickOutside } from "@/hooks/use-click-outside";

// ── Draft Storage ──
const DRAFT_KEY = "olera_profile_wizard_draft";

interface ProfileWizardDraft {
  step: number;
  displayName: string;
  city: string;
  state: string;
  locationInput: string;
  email: string;
  phone: string;
  contactPref: string;
  careRecipient: string;
  age: string;
  careTypes: string[];
  careNeeds: string[];
  timeline: string;
  payments: string[];
  savedAt: number;
}

function saveDraft(draft: Omit<ProfileWizardDraft, "savedAt">) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch { /* localStorage not available */ }
}

function loadDraft(): ProfileWizardDraft | null {
  try {
    const stored = localStorage.getItem(DRAFT_KEY);
    if (!stored) return null;
    const draft = JSON.parse(stored) as ProfileWizardDraft;
    // Expire drafts older than 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - draft.savedAt > sevenDays) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch { /* localStorage not available */ }
}

// ── Options ──

const CONTACT_METHODS = ["Call", "Text", "Email"] as const;
const CARE_RECIPIENTS = ["Myself", "My parent", "My spouse", "Someone else"];
const CARE_TYPES = [
  "Home Care", "Home Health Care", "Assisted Living", "Memory Care",
  "Nursing Home", "Independent Living", "Hospice Care", "Adult Day Care",
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
  "Companionship", "Memory Care", "Mobility Help",
];

// ── Types ──

interface ProfileWizardProps {
  profile: BusinessProfile;
  userEmail?: string;
  onClose: () => void;
  onComplete: () => void;
  /** Called after each step is saved — use to refresh profile data */
  onStepSaved?: () => void;
}

const STEPS = [
  { id: "basics", title: "Basic Info", subtitle: "Let's start with the basics" },
  { id: "contact", title: "Contact", subtitle: "How can providers reach you?" },
  { id: "recipient", title: "Care Recipient", subtitle: "Tell us about who needs care" },
  { id: "care", title: "Care Preferences", subtitle: "What type of care are you looking for?" },
  { id: "payment", title: "Payment", subtitle: "Select all that apply" },
] as const;

type StepId = typeof STEPS[number]["id"];

export default function ProfileWizard({
  profile,
  userEmail,
  onClose,
  onComplete,
  onStepSaved,
}: ProfileWizardProps) {
  const meta = (profile.metadata || {}) as FamilyMetadata;

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Overview fields
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");

  // Location autocomplete
  const [locationInput, setLocationInput] = useState(
    profile.city && profile.state ? `${profile.city}, ${profile.state}` : ""
  );
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const { results: cityResults, preload: preloadCities } = useCitySearch(locationInput);

  useClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));

  const handleLocationSelect = (result: { city: string; state: string; full: string }) => {
    setCity(result.city);
    setState(result.state);
    setLocationInput(result.full);
    setShowLocationDropdown(false);
  };

  // Contact fields
  const [email, setEmail] = useState(profile.email || userEmail || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [contactPref, setContactPref] = useState<string>(meta.contact_preference || "");

  // Care fields
  const [careRecipient, setCareRecipient] = useState(meta.relationship_to_recipient || "");
  const [age, setAge] = useState(meta.age ? String(meta.age) : "");
  const [careTypes, setCareTypes] = useState<string[]>(profile.care_types || []);
  const [careNeeds, setCareNeeds] = useState<string[]>(meta.care_needs || []);
  const [timeline, setTimeline] = useState(meta.timeline || "");

  // Payment fields
  const [payments, setPayments] = useState<string[]>(meta.payment_methods || []);

  // Draft restoration state
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<ProfileWizardDraft | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    if (draftRestored) return;
    const draft = loadDraft();
    if (draft && draft.step > 0) {
      // Only prompt if they made progress
      setPendingDraft(draft);
      setShowDraftPrompt(true);
    }
    setDraftRestored(true);
  }, [draftRestored]);

  const restoreDraft = useCallback(() => {
    if (!pendingDraft) return;
    setCurrentStep(pendingDraft.step);
    setDisplayName(pendingDraft.displayName);
    setCity(pendingDraft.city);
    setState(pendingDraft.state);
    setLocationInput(pendingDraft.locationInput);
    setEmail(pendingDraft.email);
    setPhone(pendingDraft.phone);
    setContactPref(pendingDraft.contactPref);
    setCareRecipient(pendingDraft.careRecipient);
    setAge(pendingDraft.age);
    setCareTypes(pendingDraft.careTypes);
    setCareNeeds(pendingDraft.careNeeds);
    setTimeline(pendingDraft.timeline);
    setPayments(pendingDraft.payments);
    setShowDraftPrompt(false);
    setPendingDraft(null);
  }, [pendingDraft]);

  const discardDraft = useCallback(() => {
    clearDraft();
    setShowDraftPrompt(false);
    setPendingDraft(null);
  }, []);

  // Auto-save draft when state changes (debounced by step navigation)
  useEffect(() => {
    if (!draftRestored || showDraftPrompt) return;
    // Only save if user has made some progress
    if (currentStep === 0 && !displayName && !city && !email) return;

    saveDraft({
      step: currentStep,
      displayName,
      city,
      state,
      locationInput,
      email,
      phone,
      contactPref,
      careRecipient,
      age,
      careTypes,
      careNeeds,
      timeline,
      payments,
    });
  }, [
    draftRestored, showDraftPrompt, currentStep,
    displayName, city, state, locationInput,
    email, phone, contactPref, careRecipient,
    age, careTypes, careNeeds, timeline, payments,
  ]);

  const saveCurrentStep = useCallback(async () => {
    if (!isSupabaseConfigured() || !profile) return true;
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: current } = await supabase
        .from("business_profiles")
        .select("metadata")
        .eq("id", profile.id)
        .single();

      const existingMeta = (current?.metadata || {}) as Record<string, unknown>;
      let updates: Record<string, unknown> = {};
      let metaUpdates: Record<string, unknown> = {};

      const stepId = STEPS[currentStep].id;

      switch (stepId) {
        case "basics":
          updates = {
            display_name: displayName || null,
            city: city || null,
            state: state || null,
          };
          break;

        case "contact":
          updates = {
            email: email || null,
            phone: phone || null,
          };
          metaUpdates = {
            contact_preference: contactPref || undefined,
          };
          break;

        case "recipient":
          metaUpdates = {
            relationship_to_recipient: careRecipient || undefined,
            age: age ? Number(age) : undefined,
            timeline: timeline || undefined,
          };
          break;

        case "care":
          updates = {
            care_types: careTypes,
          };
          metaUpdates = {
            care_needs: careNeeds.length > 0 ? careNeeds : undefined,
          };
          break;

        case "payment":
          metaUpdates = {
            payment_methods: payments.length > 0 ? payments : undefined,
          };
          break;
      }

      await supabase
        .from("business_profiles")
        .update({
          ...updates,
          metadata: { ...existingMeta, ...metaUpdates },
        })
        .eq("id", profile.id);

      return true;
    } catch (err) {
      console.error("[ProfileWizard] Save failed:", err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [
    profile, currentStep, displayName, city, state,
    email, phone, contactPref, careRecipient, age,
    careTypes, careNeeds, timeline, payments,
  ]);

  const handleNext = async () => {
    const saved = await saveCurrentStep();
    if (!saved) return;

    // Notify parent to refresh profile data (updates percentage)
    onStepSaved?.();

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step — clear draft and show completion modal
      clearDraft();
      setShowCompleteModal(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      clearDraft();
      setShowCompleteModal(true);
    }
  };

  // Called when user clicks Continue in the completion modal
  const handleContinue = () => {
    clearDraft();
    onComplete();
  };

  const renderPill = (
    label: string,
    isSelected: boolean,
    onClick: () => void
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={[
        "px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200",
        isSelected
          ? "bg-primary-50 border-primary-300 text-primary-700"
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50",
      ].join(" ")}
    >
      {label}
    </button>
  );

  // ── Profile Complete Modal ──
  if (showCompleteModal) {
    return (
      <ProfileCompleteModal
        isOpen
        onContinue={handleContinue}
      />
    );
  }

  // ── Main Wizard ──
  const step = STEPS[currentStep];

  // Draft restoration prompt
  if (showDraftPrompt && pendingDraft) {
    return (
      <Modal isOpen onClose={onClose} size="md">
        <div className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Continue where you left off?</h2>
          <p className="text-sm text-gray-500 mb-6">
            You were on step {pendingDraft.step + 1} of {STEPS.length}
          </p>
          <div className="flex gap-3">
            <button
              onClick={discardDraft}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Start fresh
            </button>
            <button
              onClick={restoreDraft}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // Step header for Modal title
  const stepHeader = (
    <div>
      {/* Step indicator with emphasis */}
      <p className="text-sm text-gray-400 mb-1">
        Step <span className="font-semibold text-gray-600">{currentStep + 1}</span> of {STEPS.length}
      </p>
      <h2 className="text-xl font-semibold text-gray-900">{step.title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{step.subtitle}</p>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} size="2xl" title={stepHeader}>
      <div className="flex flex-col min-h-[420px]">
        {/* Form Content — overflow visible on step 1 for dropdown */}
        <div className={`flex-1 pt-5 ${step.id === "basics" ? "overflow-visible" : "overflow-y-auto"}`}>
          {/* ── Step 1: Basics ── */}
          {step.id === "basics" && (
            <div className="space-y-6">
              <Input
                label="Your name"
                value={displayName}
                onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)}
                placeholder="Full name"
              />

              {/* Location with autocomplete */}
              <div className="relative" ref={locationDropdownRef}>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => {
                      setLocationInput(e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    onFocus={() => {
                      preloadCities();
                      setShowLocationDropdown(true);
                    }}
                    placeholder="Start typing a city..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>

                {/* Dropdown */}
                {showLocationDropdown && cityResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                    {cityResults.map((result, index) => (
                      <button
                        key={`${result.city}-${result.state}-${index}`}
                        type="button"
                        onClick={() => handleLocationSelect(result)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-900 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{result.full}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Contact ── */}
          {step.id === "contact" && (
            <div className="space-y-6">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail((e.target as HTMLInputElement).value)}
                placeholder="your@email.com"
              />

              <Input
                label="Phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
                placeholder="(555) 123-4567"
              />

              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  How would you like to be contacted?
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_METHODS.map((m) =>
                    renderPill(m, contactPref === m.toLowerCase(), () =>
                      setContactPref(m.toLowerCase())
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Care Recipient ── */}
          {step.id === "recipient" && (
            <div className="space-y-6">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Who needs care?
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARE_RECIPIENTS.map((r) =>
                    renderPill(r, careRecipient === r, () => setCareRecipient(r))
                  )}
                </div>
              </div>

              <Input
                label="Their age"
                type="number"
                value={age}
                onChange={(e) => setAge((e.target as HTMLInputElement).value)}
                placeholder="e.g. 72"
              />

              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  How soon do you need care?
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIMELINES.map((t) =>
                    renderPill(t.label, timeline === t.value, () => setTimeline(t.value))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 4: Care Preferences ── */}
          {step.id === "care" && (
            <div className="space-y-6">
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  Type of care needed
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARE_TYPES.map((ct) =>
                    renderPill(ct, careTypes.includes(ct), () =>
                      setCareTypes((prev) =>
                        prev.includes(ct) ? prev.filter((x) => x !== ct) : [...prev, ct]
                      )
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-900 mb-3">
                  What kind of help is needed?
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARE_NEED_OPTIONS.map((need) =>
                    renderPill(need, careNeeds.includes(need), () =>
                      setCareNeeds((prev) =>
                        prev.includes(need) ? prev.filter((x) => x !== need) : [...prev, need]
                      )
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 5: Payment ── */}
          {step.id === "payment" && (
            <div className="space-y-1">
              <label className="block text-base font-semibold text-gray-900 mb-3">
                How will care be paid for?
              </label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((opt) =>
                  renderPill(opt, payments.includes(opt), () =>
                    setPayments((prev) =>
                      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                    )
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            {/* Left side - Skip (step 1) or Back (step 2+) */}
            <div>
              {currentStep > 0 ? (
                <button
                  onClick={handleBack}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={handleSkip}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              )}
            </div>

            {/* Right side - Next only */}
            <button
              onClick={handleNext}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : currentStep === STEPS.length - 1 ? (
                "Finish"
              ) : (
                <>
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
