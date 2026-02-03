"use client";

import type { OnboardingData } from "@/app/onboarding/page";
import type { ProfileCategory } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface ProfileInfoStepProps {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
  onComplete: () => void;
  submitting: boolean;
}

const ORG_CATEGORIES: { value: ProfileCategory; label: string }[] = [
  { value: "assisted_living", label: "Assisted Living" },
  { value: "independent_living", label: "Independent Living" },
  { value: "memory_care", label: "Memory Care" },
  { value: "nursing_home", label: "Nursing Home / Skilled Nursing" },
  { value: "home_care_agency", label: "Home Care Agency" },
  { value: "home_health_agency", label: "Home Health Agency" },
  { value: "hospice_agency", label: "Hospice" },
  { value: "inpatient_hospice", label: "Inpatient Hospice" },
  { value: "rehab_facility", label: "Rehabilitation Facility" },
  { value: "adult_day_care", label: "Adult Day Care" },
  { value: "wellness_center", label: "Wellness Center" },
];

const CARE_TYPES = [
  "Assisted Living",
  "Memory Care",
  "Independent Living",
  "Skilled Nursing",
  "Home Care",
  "Home Health",
  "Hospice",
  "Respite Care",
  "Adult Day Care",
  "Rehabilitation",
];

const TIMELINES = [
  { value: "immediate", label: "As soon as possible" },
  { value: "within_1_month", label: "Within a month" },
  { value: "within_3_months", label: "Within 3 months" },
  { value: "exploring", label: "Just exploring options" },
];

export default function ProfileInfoStep({
  data,
  onChange,
  onComplete,
  submitting,
}: ProfileInfoStepProps) {
  const intent = data.intent;

  const handleCareTypeToggle = (careType: string) => {
    const current = data.careTypes;
    if (current.includes(careType)) {
      onChange({ careTypes: current.filter((ct) => ct !== careType) });
    } else {
      onChange({ careTypes: [...current, careType] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
  };

  const isValid =
    data.displayName.trim().length > 0 && data.zip.trim().length > 0;

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
        {intent === "family"
          ? "Tell us about your care needs"
          : intent === "organization"
          ? "Tell us about your organization"
          : "Set up your caregiver profile"}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        {intent === "family"
          ? "We'll use this to find the best matches for you."
          : "You can add more details later in your profile editor."}
      </p>

      <div className="space-y-6">
        <Input
          label={
            intent === "family"
              ? "Your name"
              : intent === "organization"
              ? "Organization name"
              : "Your name"
          }
          name="displayName"
          value={data.displayName}
          onChange={(e) =>
            onChange({ displayName: (e.target as HTMLInputElement).value })
          }
          placeholder={
            intent === "organization"
              ? "e.g., Sunrise Senior Living"
              : "First and last name"
          }
          required
        />

        {intent === "organization" && (
          <div className="space-y-1.5">
            <label
              htmlFor="category"
              className="block text-base font-medium text-gray-700"
            >
              Type of organization
            </label>
            <select
              id="category"
              value={data.category || ""}
              onChange={(e) =>
                onChange({
                  category: (e.target.value as ProfileCategory) || null,
                })
              }
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
            >
              <option value="">Select a category</option>
              {ORG_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="City"
            name="city"
            value={data.city}
            onChange={(e) =>
              onChange({ city: (e.target as HTMLInputElement).value })
            }
            placeholder="City"
          />
          <Input
            label="State"
            name="state"
            value={data.state}
            onChange={(e) =>
              onChange({ state: (e.target as HTMLInputElement).value })
            }
            placeholder="e.g., TX"
          />
        </div>

        <Input
          label="ZIP code"
          name="zip"
          value={data.zip}
          onChange={(e) =>
            onChange({ zip: (e.target as HTMLInputElement).value })
          }
          placeholder="e.g., 78701"
          required
        />

        {/* Care types selection */}
        <div className="space-y-2">
          <label className="block text-base font-medium text-gray-700">
            {intent === "family" ? "What type of care do you need?" : "Care types offered"}
          </label>
          <div className="flex flex-wrap gap-2">
            {CARE_TYPES.map((ct) => (
              <button
                key={ct}
                type="button"
                onClick={() => handleCareTypeToggle(ct)}
                className={[
                  "px-4 py-2 rounded-lg text-base font-medium transition-colors border min-h-[44px]",
                  data.careTypes.includes(ct)
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
                ].join(" ")}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        {intent === "family" && (
          <>
            <div className="space-y-1.5">
              <label
                htmlFor="timeline"
                className="block text-base font-medium text-gray-700"
              >
                When do you need care?
              </label>
              <select
                id="timeline"
                value={data.timeline}
                onChange={(e) => onChange({ timeline: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
              >
                <option value="">Select a timeline</option>
                {TIMELINES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Your relationship to the person needing care"
              name="relationship"
              value={data.relationshipToRecipient}
              onChange={(e) =>
                onChange({
                  relationshipToRecipient: (e.target as HTMLInputElement).value,
                })
              }
              placeholder="e.g., Son, Daughter, Spouse"
            />
          </>
        )}

        <div className="pt-4">
          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={!isValid}
            loading={submitting}
          >
            {intent === "organization" ? "Next: Find your organization" : "Complete setup"}
          </Button>
        </div>
      </div>
    </form>
  );
}
