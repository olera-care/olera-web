"use client";

import { useState, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

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
}

const STEPS = [
  { id: "basics", title: "Basic Info", subtitle: "Let's start with the basics" },
  { id: "contact", title: "Contact", subtitle: "How can providers reach you?" },
  { id: "care", title: "Care Needs", subtitle: "Tell us about the care situation" },
  { id: "payment", title: "Payment", subtitle: "How will care be paid for?" },
] as const;

type StepId = typeof STEPS[number]["id"];

export default function ProfileWizard({
  profile,
  userEmail,
  onClose,
  onComplete,
}: ProfileWizardProps) {
  const meta = (profile.metadata || {}) as FamilyMetadata;

  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Overview fields
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");

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

        case "care":
          updates = {
            care_types: careTypes,
          };
          metaUpdates = {
            relationship_to_recipient: careRecipient || undefined,
            age: age ? Number(age) : undefined,
            care_needs: careNeeds.length > 0 ? careNeeds : undefined,
            timeline: timeline || undefined,
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

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step — show celebration
      setShowCelebration(true);
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
      setShowCelebration(true);
    }
  };

  const handleFinish = () => {
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

  // ── Celebration Screen ──
  if (showCelebration) {
    return (
      <Modal isOpen onClose={onClose} size="md">
        <div className="py-8 px-4 text-center">
          {/* Animated checkmark */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-primary-100 animate-ping opacity-30" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-display font-semibold text-gray-900 mb-2">
            Looking good!
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Your profile is ready. Providers can now learn more about you and your care needs.
          </p>

          <button
            onClick={handleFinish}
            className="w-full max-w-xs mx-auto flex items-center justify-center px-6 py-3 text-text-md font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
          >
            Continue
          </button>
        </div>
      </Modal>
    );
  }

  // ── Main Wizard ──
  const step = STEPS[currentStep];

  return (
    <Modal isOpen onClose={onClose} size="2xl">
      <div className="flex flex-col min-h-[500px]">
        {/* Progress Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={[
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    i < currentStep
                      ? "bg-primary-600 text-white"
                      : i === currentStep
                      ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600"
                      : "bg-gray-100 text-gray-400",
                  ].join(" ")}
                >
                  {i < currentStep ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={[
                      "w-12 sm:w-20 h-1 mx-2 rounded-full transition-all",
                      i < currentStep ? "bg-primary-600" : "bg-gray-100",
                    ].join(" ")}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step title */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{step.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{step.subtitle}</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Step 1: Basics ── */}
          {step.id === "basics" && (
            <div className="space-y-5">
              <Input
                label="Your name"
                value={displayName}
                onChange={(e) => setDisplayName((e.target as HTMLInputElement).value)}
                placeholder="Full name"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity((e.target as HTMLInputElement).value)}
                  placeholder="e.g. Houston"
                />
                <Input
                  label="State"
                  value={state}
                  onChange={(e) => setState((e.target as HTMLInputElement).value)}
                  placeholder="e.g. TX"
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Contact ── */}
          {step.id === "contact" && (
            <div className="space-y-5">
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
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
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

          {/* ── Step 3: Care Needs ── */}
          {step.id === "care" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
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
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
                  Type of care needed
                </label>
                <div className="flex flex-wrap gap-1.5">
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
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
                  What kind of help is needed?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CARE_NEED_OPTIONS.map((need) =>
                    renderPill(need, careNeeds.includes(need), () =>
                      setCareNeeds((prev) =>
                        prev.includes(need) ? prev.filter((x) => x !== need) : [...prev, need]
                      )
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
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

          {/* ── Step 4: Payment ── */}
          {step.id === "payment" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
                  How will care be paid for?
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Select all that apply. This helps providers understand your situation.
                </p>
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

              <div className="mt-6 p-4 rounded-xl bg-primary-50/50 border border-primary-100">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">You may qualify for benefits</p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      After completing your profile, check our Benefits Finder to discover programs that could help cover care costs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            {/* Left side - Back or Skip */}
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
                  onClick={onClose}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                >
                  Close
                </button>
              )}
            </div>

            {/* Right side - Skip & Next */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSkip}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
              >
                Skip
              </button>
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
      </div>
    </Modal>
  );
}
