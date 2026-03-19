"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { saveProfile } from "@/components/provider-dashboard/edit-modals/save-profile";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { BusinessProfile, FamilyMetadata } from "@/lib/types";

// ── Options ──

const RELATIONSHIP_OPTIONS = [
  { value: "myself", label: "Myself" },
  { value: "my_parent", label: "My parent" },
  { value: "my_spouse", label: "My spouse" },
  { value: "someone_else", label: "Someone else" },
];

const CARE_TYPE_OPTIONS = [
  "Assisted Living",
  "Home Care",
  "Home Health",
  "Memory Care",
  "Companion Care",
  "Hospice",
  "Skilled Nursing",
  "Respite Care",
  "Adult Day Care",
  "Rehabilitation",
  "Personal Care",
  "Independent Living",
];

const TIMELINE_OPTIONS = [
  { value: "immediate", label: "Immediately" },
  { value: "within_1_month", label: "Within 1 month" },
  { value: "within_3_months", label: "Within 3 months" },
  { value: "exploring", label: "Just exploring" },
];

const SCHEDULE_OPTIONS = [
  "Mornings",
  "Afternoons",
  "Evenings",
  "Overnight",
  "Full-time",
  "Flexible",
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

// ── Component ──

interface EditCarePostModalProps {
  profile: BusinessProfile;
  userEmail?: string;
  onClose: () => void;
  onSaved: () => void;
}

const STEPS = [
  { id: 1, title: "Care Details", subtitle: "Who needs care and what type?" },
  { id: 2, title: "Location & Schedule", subtitle: "Where and when do you need care?" },
  { id: 3, title: "Timeline & Payment", subtitle: "When and how will you pay?" },
  { id: 4, title: "Additional Info", subtitle: "Any other details?" },
] as const;

const TOTAL_STEPS = STEPS.length;

export default function EditCarePostModal({
  profile,
  userEmail,
  onClose,
  onSaved,
}: EditCarePostModalProps) {
  const meta = (profile.metadata || {}) as FamilyMetadata;

  // Step state
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Care details
  const [relationship, setRelationship] = useState(meta.relationship_to_recipient || "");
  const [age, setAge] = useState(meta.age?.toString() || "");
  const [careTypes, setCareTypes] = useState<string[]>(
    Array.isArray(profile.care_types) ? [...profile.care_types] : []
  );

  // Step 2: Location & schedule
  const [city, setCity] = useState(profile.city || "");
  const [state, setState] = useState(profile.state || "");
  const [schedule, setSchedule] = useState(meta.schedule_preference || "");

  // Step 3: Timeline & payment
  const [timeline, setTimeline] = useState(meta.timeline || "");
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    Array.isArray(meta.payment_methods) ? [...meta.payment_methods] : []
  );

  // Step 4: Additional info
  const [aboutSituation, setAboutSituation] = useState(profile.description || "");
  const [phone, setPhone] = useState(profile.phone || "");

  function toggleCareType(ct: string) {
    setCareTypes((prev) =>
      prev.includes(ct) ? prev.filter((c) => c !== ct) : [...prev, ct]
    );
  }

  function togglePayment(pm: string) {
    setPaymentMethods((prev) =>
      prev.includes(pm) ? prev.filter((p) => p !== pm) : [...prev, pm]
    );
  }

  const hasChanges = true; // Always allow saving since we're editing a care profile

  async function handleSave() {
    // If not last step, just advance
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }

    // Last step — save
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        profileId: profile.id,
        // Always update all fields shown in this modal
        topLevelFields: {
          care_types: careTypes,
          city: city || undefined,
          state: state || undefined,
          phone: phone || undefined,
          description: aboutSituation || undefined,
        },
        metadataFields: {
          relationship_to_recipient: relationship || undefined,
          age: age ? parseInt(age, 10) : undefined,
          schedule_preference: schedule || undefined,
          timeline: timeline || undefined,
          payment_methods: paymentMethods.length > 0 ? paymentMethods : undefined,
        },
        existingMetadata: (profile.metadata || {}) as Record<string, unknown>,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  // Get current step metadata
  const currentStepData = STEPS.find(s => s.id === step) || STEPS[0];

  // Step header for Modal title — aligns with close button
  const stepHeader = (
    <div>
      <p className="text-sm text-gray-400 mb-1">
        Step <span className="font-semibold text-gray-600">{step}</span> of {TOTAL_STEPS}
      </p>
      <h2 className="text-xl font-semibold text-gray-900">{currentStepData.title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{currentStepData.subtitle}</p>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={stepHeader}
      size="2xl"
      footer={
        <div className="flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {saving
              ? "Saving..."
              : step === TOTAL_STEPS
                ? "Finish"
                : "Next"}
          </button>
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* ── Step 1: Care details ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Who needs care */}
            <Select
              label="Who needs care"
              options={RELATIONSHIP_OPTIONS}
              value={relationship}
              onChange={setRelationship}
              placeholder="Select..."
            />

            {/* Age */}
            <Input
              label="Age of person needing care"
              type="number"
              value={age}
              onChange={(e) => setAge((e.target as HTMLInputElement).value)}
              placeholder="e.g. 89"
              min={0}
              max={120}
            />

            {/* Types of care needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Types of care needed
              </label>
              <div className="flex flex-wrap gap-2">
                {CARE_TYPE_OPTIONS.map((ct) => {
                  const isSelected = careTypes.includes(ct);
                  return (
                    <button
                      key={ct}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => toggleCareType(ct)}
                      className={[
                        "px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                        isSelected
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-white border-warm-100 text-gray-900 hover:border-warm-200",
                      ].join(" ")}
                    >
                      {ct}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Location & schedule ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
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
                placeholder="e.g. Texas"
              />
            </div>

            {/* Schedule preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Schedule preference
              </label>
              <div className="flex flex-wrap gap-2">
                {SCHEDULE_OPTIONS.map((opt) => {
                  const isSelected = schedule === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSchedule(isSelected ? "" : opt)}
                      className={[
                        "px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                        isSelected
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-white border-warm-100 text-gray-900 hover:border-warm-200",
                      ].join(" ")}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Timeline & payment ── */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Timeline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                When do you need care?
              </label>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map((opt) => {
                  const isSelected = timeline === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTimeline(isSelected ? "" : opt.value)}
                      className={[
                        "px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                        isSelected
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-white border-warm-100 text-gray-900 hover:border-warm-200",
                      ].join(" ")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment methods */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Payment method
              </label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((pm) => {
                  const isSelected = paymentMethods.includes(pm);
                  return (
                    <button
                      key={pm}
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      onClick={() => togglePayment(pm)}
                      className={[
                        "px-3.5 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                        isSelected
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "bg-white border-warm-100 text-gray-900 hover:border-warm-200",
                      ].join(" ")}
                    >
                      {pm}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Additional info ── */}
        {step === 4 && (
          <div className="space-y-5">
            <Input
              as="textarea"
              label="About your situation"
              value={aboutSituation}
              onChange={(e) => setAboutSituation((e.target as HTMLTextAreaElement).value)}
              placeholder="Share anything that might help providers understand your needs..."
              rows={4}
            />

            <Input
              label="Phone number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone((e.target as HTMLInputElement).value)}
              placeholder="(555) 123-4567"
              helpText="Only shared with providers you connect with."
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
