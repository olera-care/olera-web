"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCitySearch } from "@/hooks/use-city-search";
import type { StudentMetadata, StudentProgramTrack, IntendedProfessionalSchool } from "@/lib/types";

const PROGRAM_TRACKS: { value: StudentProgramTrack; label: string }[] = [
  { value: "pre_med", label: "Pre-Med" },
  { value: "pre_pa", label: "Pre-PA" },
  { value: "pre_nursing", label: "Pre-Nursing" },
  { value: "nursing", label: "Nursing" },
  { value: "pre_health", label: "Pre-Health" },
  { value: "other", label: "Other" },
];

const INTENDED_SCHOOLS: { value: IntendedProfessionalSchool; label: string }[] = [
  { value: "medicine", label: "Medicine" },
  { value: "nursing", label: "Nursing" },
  { value: "pa", label: "Physician Assistant" },
  { value: "pt", label: "Physical Therapy" },
  { value: "public_health", label: "Public Health" },
  { value: "undecided", label: "Undecided" },
];

const AVAILABILITY_OPTIONS = [
  { value: "part_time", label: "Part Time" },
  { value: "full_time", label: "Full Time" },
  { value: "flexible", label: "Flexible" },
  { value: "summer_only", label: "Summer Only" },
  { value: "weekends", label: "Weekends" },
];

const AVAILABILITY_TYPE_OPTIONS = [
  { value: "in_between_classes", label: "Between Classes" },
  { value: "evenings", label: "Evenings" },
  { value: "weekends", label: "Weekends" },
  { value: "overnights", label: "Overnights" },
];

const SEASONAL_OPTIONS = [
  { value: "summer", label: "Summer" },
  { value: "winter_break", label: "Winter Break" },
  { value: "fall_semester", label: "Fall Semester" },
  { value: "spring_semester", label: "Spring Semester" },
];

const DURATION_OPTIONS = [
  { value: "1_semester", label: "1 Semester" },
  { value: "multiple_semesters", label: "Multiple Semesters" },
  { value: "1_plus_year", label: "1+ Year" },
];

const HOURS_RANGE_OPTIONS = [
  { value: "5-10", label: "5-10 hours" },
  { value: "10-15", label: "10-15 hours" },
  { value: "15-20", label: "15-20 hours" },
  { value: "20+", label: "20+ hours" },
];

const SEEKING_OPTIONS = [
  { value: "actively_looking", label: "Actively Looking" },
  { value: "open", label: "Open to Opportunities" },
  { value: "not_looking", label: "Not Looking" },
];

const COMMON_CERTIFICATIONS = ["CNA", "BLS", "CPR / First Aid", "HHA", "MA", "EMT"];

export default function AdminMedJobsDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [originalData, setOriginalData] = useState<Record<string, unknown>>({});
  const [slug, setSlug] = useState("");
  const [applicationCount, setApplicationCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // City search
  const [cityQuery, setCityQuery] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const { results: cityResults, preload: preloadCities } = useCitySearch(cityQuery);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStudent = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/medjobs/${studentId}`);
      if (!res.ok) {
        router.push("/admin/medjobs");
        return;
      }
      const data = await res.json();
      const student = data.student;
      const meta = (student.metadata || {}) as StudentMetadata;

      // Flatten student fields + metadata into a single form object
      const flat: Record<string, unknown> = {
        display_name: student.display_name,
        email: student.email,
        phone: student.phone,
        city: student.city,
        state: student.state,
        image_url: student.image_url,
        is_active: student.is_active,
        // Metadata fields
        university: meta.university,
        campus: meta.campus,
        major: meta.major,
        graduation_year: meta.graduation_year,
        gpa: meta.gpa,
        program_track: meta.program_track,
        intended_professional_school: meta.intended_professional_school,
        certifications: meta.certifications || [],
        years_caregiving: meta.years_caregiving,
        care_experience_types: meta.care_experience_types || [],
        languages: meta.languages || [],
        availability_type: meta.availability_type,
        availability_types: meta.availability_types || [],
        seasonal_availability: meta.seasonal_availability || [],
        duration_commitment: meta.duration_commitment,
        hours_per_week_range: meta.hours_per_week_range,
        hours_per_week: meta.hours_per_week,
        available_start: meta.available_start,
        transportation: meta.transportation,
        willing_to_relocate: meta.willing_to_relocate,
        max_commute_miles: meta.max_commute_miles,
        acknowledgments_completed: meta.acknowledgments_completed,
        acknowledgment_date: meta.acknowledgment_date,
        resume_url: meta.resume_url,
        video_intro_url: meta.video_intro_url,
        linkedin_url: meta.linkedin_url,
        drivers_license_url: meta.drivers_license_url,
        drivers_license_uploaded_at: meta.drivers_license_uploaded_at,
        car_insurance_url: meta.car_insurance_url,
        car_insurance_uploaded_at: meta.car_insurance_uploaded_at,
        total_verified_hours: meta.total_verified_hours,
        profile_completeness: meta.profile_completeness,
        seeking_status: meta.seeking_status,
      };

      setFormData(flat);
      setOriginalData(flat);
      setSlug(student.slug);
      setApplicationCount(data.applicationCount ?? 0);
    } catch (err) {
      console.error("Failed to fetch student:", err);
    } finally {
      setLoading(false);
    }
  }, [studentId, router]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const isDirty = useMemo(() => {
    for (const key of Object.keys(formData)) {
      const a = formData[key];
      const b = originalData[key];
      if (Array.isArray(a) && Array.isArray(b)) {
        if (JSON.stringify(a) !== JSON.stringify(b)) return true;
      } else if (a !== b) return true;
    }
    return false;
  }, [formData, originalData]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function updateField(field: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);

    const delta: Record<string, unknown> = {};
    for (const key of Object.keys(formData)) {
      const a = formData[key];
      const b = originalData[key];
      if (Array.isArray(a) && Array.isArray(b)) {
        if (JSON.stringify(a) !== JSON.stringify(b)) delta[key] = a;
      } else if (a !== b) {
        delta[key] = a;
      }
    }

    if (Object.keys(delta).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/medjobs/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delta),
      });

      if (res.ok) {
        setOriginalData({ ...formData });
        setSaveMessage({ type: "success", text: "Changes saved." });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const err = await res.json();
        setSaveMessage({ type: "error", text: err.error || "Failed to save." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${formData.display_name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/medjobs/${studentId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/medjobs");
      } else {
        setSaveMessage({ type: "error", text: "Failed to delete." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("profileId", studentId);

      const res = await fetch("/api/medjobs/upload-photo", { method: "POST", body });
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, image_url: data.imageUrl }));
        setOriginalData((prev) => ({ ...prev, image_url: data.imageUrl }));
        setSaveMessage({ type: "success", text: "Photo uploaded." });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveMessage({ type: "error", text: err.error || "Failed to upload." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error uploading photo." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePhotoRemove() {
    if (!confirm("Remove this student's photo?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/medjobs/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: null }),
      });
      if (res.ok) {
        setFormData((prev) => ({ ...prev, image_url: null }));
        setOriginalData((prev) => ({ ...prev, image_url: null }));
        setSaveMessage({ type: "success", text: "Photo removed." });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setSaveMessage({ type: "error", text: "Failed to remove photo." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/medjobs"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to MedJobs
        </Link>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {saveMessage.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{formData.display_name as string}</h1>
        <div className="flex items-center gap-3 mt-2">
          {formData.seeking_status ? (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              formData.seeking_status === "actively_looking"
                ? "bg-emerald-100 text-emerald-700"
                : formData.seeking_status === "open"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {SEEKING_OPTIONS.find((o) => o.value === formData.seeking_status)?.label || String(formData.seeking_status)}
            </span>
          ) : null}
          <span className="text-sm text-gray-500">{applicationCount} application{applicationCount !== 1 ? "s" : ""}</span>
          <Link
            href={`/medjobs/candidates/${slug}`}
            target="_blank"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Public Profile &rarr;
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Section title="Basic Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="Full Name" value={formData.display_name as string} onChange={(v) => updateField("display_name", v)} />
            <FieldInput label="Email" value={formData.email as string} onChange={(v) => updateField("email", v || null)} />
            <FieldInput label="Phone" value={formData.phone as string} onChange={(v) => updateField("phone", v || null)} />
          </div>
        </Section>

        {/* Photo */}
        <Section title="Photo">
          {formData.image_url ? (
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                <img
                  src={formData.image_url as string}
                  alt={formData.display_name as string}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="space-y-3 pt-1">
                <p className="text-sm text-gray-500 break-all max-w-md">{formData.image_url as string}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {uploading ? "Uploading..." : "Replace Photo"}
                  </button>
                  <button
                    onClick={handlePhotoRemove}
                    disabled={saving}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-3">No photo uploaded</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 disabled:opacity-50 transition-colors"
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
            className="hidden"
          />
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 relative" ref={cityDropdownRef}>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                value={showCityDropdown ? cityQuery : (formData.city as string) ?? ""}
                onChange={(e) => {
                  setCityQuery(e.target.value);
                  if (!showCityDropdown) setShowCityDropdown(true);
                }}
                onFocus={() => {
                  preloadCities();
                  setCityQuery((formData.city as string) ?? "");
                  setShowCityDropdown(true);
                }}
                placeholder="Search city or ZIP..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              {showCityDropdown && cityResults.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {cityResults.map((result) => (
                    <button
                      key={result.full}
                      type="button"
                      onClick={() => {
                        updateField("city", result.city);
                        updateField("state", result.state);
                        setShowCityDropdown(false);
                        setCityQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                    >
                      {result.full}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <FieldInput label="State" value={formData.state as string} onChange={(v) => updateField("state", v || null)} />
          </div>
        </Section>

        {/* Education */}
        <Section title="Education">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="University" value={formData.university as string} onChange={(v) => updateField("university", v || undefined)} />
            <FieldInput label="Campus" value={formData.campus as string} onChange={(v) => updateField("campus", v || undefined)} />
            <FieldInput label="Major" value={formData.major as string} onChange={(v) => updateField("major", v || undefined)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Intended Professional School</label>
              <select
                value={(formData.intended_professional_school as string) || ""}
                onChange={(e) => updateField("intended_professional_school", e.target.value || undefined)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
              >
                <option value="">Select...</option>
                {INTENDED_SCHOOLS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Program Track (legacy)</label>
              <select
                value={(formData.program_track as string) || ""}
                onChange={(e) => updateField("program_track", e.target.value || undefined)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
              >
                <option value="">Select...</option>
                {PROGRAM_TRACKS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <FieldInput
              label="Graduation Year"
              value={formData.graduation_year as number}
              onChange={(v) => updateField("graduation_year", v === "" ? undefined : Number(v))}
              type="number"
            />
            <FieldInput
              label="GPA"
              value={formData.gpa as number}
              onChange={(v) => updateField("gpa", v === "" ? undefined : Number(v))}
              type="number"
              step="0.01"
            />
          </div>
        </Section>

        {/* Experience & Certifications */}
        <Section title="Experience & Certifications">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              label="Years Caregiving"
              value={formData.years_caregiving as number}
              onChange={(v) => updateField("years_caregiving", v === "" ? undefined : Number(v))}
              type="number"
            />
            <FieldInput
              label="Total Verified Hours"
              value={formData.total_verified_hours as number}
              onChange={(v) => updateField("total_verified_hours", v === "" ? undefined : Number(v))}
              type="number"
            />
          </div>

          {/* Certifications */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Certifications</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CERTIFICATIONS.map((cert) => {
                const certs = (formData.certifications as string[]) || [];
                const selected = certs.includes(cert);
                return (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => {
                      const updated = selected ? certs.filter((c) => c !== cert) : [...certs, cert];
                      updateField("certifications", updated);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-primary-100 text-primary-700 border-primary-300"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {cert}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Care experience */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Care Experience Types</label>
            <input
              type="text"
              value={((formData.care_experience_types as string[]) || []).join(", ")}
              onChange={(e) => {
                const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                updateField("care_experience_types", arr);
              }}
              placeholder="dementia, post_surgical, mobility..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>

          {/* Languages */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
            <input
              type="text"
              value={((formData.languages as string[]) || []).join(", ")}
              onChange={(e) => {
                const arr = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                updateField("languages", arr);
              }}
              placeholder="English, Spanish..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
          </div>
        </Section>

        {/* Availability */}
        <Section title="Availability">
          {/* New structured fields */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Availability Types</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_TYPE_OPTIONS.map((opt) => {
                const types = (formData.availability_types as string[]) || [];
                const selected = types.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const updated = selected ? types.filter((t) => t !== opt.value) : [...types, opt.value];
                      updateField("availability_types", updated);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-primary-100 text-primary-700 border-primary-300"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Seasonal Availability</label>
            <div className="flex flex-wrap gap-2">
              {SEASONAL_OPTIONS.map((opt) => {
                const seasons = (formData.seasonal_availability as string[]) || [];
                const selected = seasons.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const updated = selected ? seasons.filter((s) => s !== opt.value) : [...seasons, opt.value];
                      updateField("seasonal_availability", updated);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      selected
                        ? "bg-primary-100 text-primary-700 border-primary-300"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Duration Commitment</label>
              <select
                value={(formData.duration_commitment as string) || ""}
                onChange={(e) => updateField("duration_commitment", e.target.value || undefined)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
              >
                <option value="">Select...</option>
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Hours per Week Range</label>
              <select
                value={(formData.hours_per_week_range as string) || ""}
                onChange={(e) => updateField("hours_per_week_range", e.target.value || undefined)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
              >
                <option value="">Select...</option>
                {HOURS_RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Legacy fields */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">Legacy fields (old profiles)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Availability Type (legacy)</label>
                <select
                  value={(formData.availability_type as string) || ""}
                  onChange={(e) => updateField("availability_type", e.target.value || undefined)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                >
                  <option value="">Select...</option>
                  {AVAILABILITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <FieldInput
                label="Hours per Week (legacy)"
                value={formData.hours_per_week as number}
                onChange={(v) => updateField("hours_per_week", v === "" ? undefined : Number(v))}
                type="number"
              />
              <FieldInput
                label="Max Commute (miles)"
                value={formData.max_commute_miles as number}
                onChange={(v) => updateField("max_commute_miles", v === "" ? undefined : Number(v))}
                type="number"
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={!!formData.transportation}
                    onChange={(e) => updateField("transportation", e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Has Transportation
                </label>
              </div>
            </div>
          </div>
        </Section>

        {/* Links & Media */}
        <Section title="Links & Media">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="Resume URL" value={formData.resume_url as string} onChange={(v) => updateField("resume_url", v || undefined)} />
            <FieldInput label="Video Intro URL" value={formData.video_intro_url as string} onChange={(v) => updateField("video_intro_url", v || undefined)} />
            <FieldInput label="LinkedIn URL" value={formData.linkedin_url as string} onChange={(v) => updateField("linkedin_url", v || undefined)} />
          </div>
        </Section>

        {/* Documents */}
        <Section title="Documents">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Driver&apos;s License</label>
              {formData.drivers_license_url ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-800">Uploaded</p>
                    {formData.drivers_license_uploaded_at ? (
                      <p className="text-xs text-emerald-600 truncate">
                        {new Date(formData.drivers_license_uploaded_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-amber-700">Not uploaded</p>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Car Insurance</label>
              {formData.car_insurance_url ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-800">Uploaded</p>
                    {formData.car_insurance_uploaded_at ? (
                      <p className="text-xs text-emerald-600 truncate">
                        {new Date(formData.car_insurance_uploaded_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-amber-700">Not uploaded</p>
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Status */}
        <Section title="Status">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Seeking Status</label>
              <select
                value={(formData.seeking_status as string) || ""}
                onChange={(e) => updateField("seeking_status", e.target.value || undefined)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
              >
                <option value="">Select...</option>
                {SEEKING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <FieldInput
              label="Profile Completeness (%)"
              value={formData.profile_completeness as number}
              onChange={(v) => updateField("profile_completeness", v === "" ? undefined : Number(v))}
              type="number"
            />
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!formData.is_active}
                  onChange={(e) => updateField("is_active", e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!formData.acknowledgments_completed}
                  onChange={(e) => updateField("acknowledgments_completed", e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Acknowledgments
              </label>
            </div>
          </div>
        </Section>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
              <p className="text-sm text-red-600 mt-1">
                Permanently delete this student profile. This cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Delete Student
            </button>
          </div>
        </div>
      </div>

      {/* Bottom save bar */}
      {isDirty && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 py-4 mt-6 -mx-4 px-4 sm:-mx-6 sm:px-6 flex items-center justify-end gap-3">
          <span className="text-sm text-amber-600">You have unsaved changes</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (val: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
      />
    </div>
  );
}
