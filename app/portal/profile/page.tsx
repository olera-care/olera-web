"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { ProfileCategory } from "@/lib/types";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

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

interface FormData {
  display_name: string;
  description: string;
  category: ProfileCategory | "";
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  care_types: string[];
}

export default function PortalProfilePage() {
  const { activeProfile, refreshAccountData } = useAuth();
  const [form, setForm] = useState<FormData>({
    display_name: "",
    description: "",
    category: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    care_types: [],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill form from active profile
  useEffect(() => {
    if (activeProfile) {
      setForm({
        display_name: activeProfile.display_name || "",
        description: activeProfile.description || "",
        category: activeProfile.category || "",
        phone: activeProfile.phone || "",
        email: activeProfile.email || "",
        website: activeProfile.website || "",
        address: activeProfile.address || "",
        city: activeProfile.city || "",
        state: activeProfile.state || "",
        zip: activeProfile.zip || "",
        care_types: activeProfile.care_types || [],
      });
    }
  }, [activeProfile]);

  if (!activeProfile) {
    return (
      <EmptyState
        title="No profile found"
        description="Complete onboarding to set up your profile."
        action={<Link href="/onboarding"><Button>Complete setup</Button></Link>}
      />
    );
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleCareTypeToggle = (careType: string) => {
    setForm((prev) => {
      const current = prev.care_types;
      const updated = current.includes(careType)
        ? current.filter((ct) => ct !== careType)
        : [...current, careType];
      return { ...prev, care_types: updated };
    });
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured()) return;

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name,
          description: form.description || null,
          category: form.category || null,
          phone: form.phone || null,
          email: form.email || null,
          website: form.website || null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          zip: form.zip || null,
          care_types: form.care_types,
        })
        .eq("id", activeProfile.id);

      if (updateError) throw updateError;

      await refreshAccountData();
      setSaved(true);
    } catch (err) {
      console.error("Profile update error:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isOrg = activeProfile.type === "organization";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit profile</h1>
        <p className="text-lg text-gray-600 mt-1">
          Keep your information up to date so families can find you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic info section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Basic information
          </h2>
          <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
            <Input
              label={isOrg ? "Organization name" : "Display name"}
              name="display_name"
              value={form.display_name}
              onChange={(e) =>
                handleChange(
                  "display_name",
                  (e.target as HTMLInputElement).value
                )
              }
              required
            />

            <Input
              label="Description"
              name="description"
              as="textarea"
              value={form.description}
              onChange={(e) =>
                handleChange(
                  "description",
                  (e.target as HTMLTextAreaElement).value
                )
              }
              placeholder="Tell families about your services, philosophy, and what makes you different."
              rows={4}
            />

            {isOrg && (
              <div className="space-y-1.5">
                <label
                  htmlFor="category"
                  className="block text-base font-medium text-gray-700"
                >
                  Organization type
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
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
          </div>
        </section>

        {/* Contact section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Contact information
          </h2>
          <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
            <Input
              label="Phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={(e) =>
                handleChange("phone", (e.target as HTMLInputElement).value)
              }
              placeholder="(555) 123-4567"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={(e) =>
                handleChange("email", (e.target as HTMLInputElement).value)
              }
              placeholder="contact@example.com"
            />
            <Input
              label="Website"
              name="website"
              type="url"
              value={form.website}
              onChange={(e) =>
                handleChange("website", (e.target as HTMLInputElement).value)
              }
              placeholder="https://example.com"
            />
          </div>
        </section>

        {/* Location section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Location
          </h2>
          <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
            <Input
              label="Street address"
              name="address"
              value={form.address}
              onChange={(e) =>
                handleChange("address", (e.target as HTMLInputElement).value)
              }
              placeholder="123 Main Street"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                name="city"
                value={form.city}
                onChange={(e) =>
                  handleChange("city", (e.target as HTMLInputElement).value)
                }
              />
              <Input
                label="State"
                name="state"
                value={form.state}
                onChange={(e) =>
                  handleChange("state", (e.target as HTMLInputElement).value)
                }
              />
            </div>
            <Input
              label="ZIP code"
              name="zip"
              value={form.zip}
              onChange={(e) =>
                handleChange("zip", (e.target as HTMLInputElement).value)
              }
            />
          </div>
        </section>

        {/* Care types section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {activeProfile.type === "family"
              ? "Care types needed"
              : "Care types offered"}
          </h2>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {CARE_TYPES.map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => handleCareTypeToggle(ct)}
                  className={[
                    "px-4 py-2 rounded-lg text-base font-medium transition-colors border min-h-[44px]",
                    form.care_types.includes(ct)
                      ? "bg-primary-50 border-primary-500 text-primary-700"
                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400",
                  ].join(" ")}
                >
                  {ct}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Submit */}
        {error && (
          <div
            className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-base"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button type="submit" size="lg" loading={saving}>
            {saved ? "Saved" : "Save changes"}
          </Button>
          {saved && (
            <span className="text-base text-primary-600 font-medium">
              Changes saved successfully.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
