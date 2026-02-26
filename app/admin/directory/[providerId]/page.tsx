"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { PROVIDER_CATEGORIES } from "@/lib/types";
import type { DirectoryProvider } from "@/lib/types";

interface ImageMetadata {
  id: string;
  provider_id: string;
  image_url: string;
  source_field: string;
  image_type: string;
  classification_method: string;
  classification_confidence: number;
  quality_score: number;
  width: number | null;
  height: number | null;
  is_accessible: boolean;
  is_hero: boolean;
  review_status: string;
}

export default function AdminDirectoryDetailPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [originalData, setOriginalData] = useState<Record<string, unknown>>({});
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [rawImages, setRawImages] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProvider = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/directory/${providerId}`);
      if (!res.ok) {
        router.push("/admin/directory");
        return;
      }
      const data = await res.json();
      setFormData({ ...data.provider });
      setOriginalData({ ...data.provider });
      setImages(data.images ?? []);
      setRawImages(data.rawImages ?? []);
    } catch (err) {
      console.error("Failed to fetch provider:", err);
    } finally {
      setLoading(false);
    }
  }, [providerId, router]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  // Dirty tracking
  const isDirty = useMemo(() => {
    for (const key of Object.keys(formData)) {
      if (formData[key] !== originalData[key]) return true;
    }
    return false;
  }, [formData, originalData]);

  // Warn on navigation when dirty
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function updateField(field: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);

    // Compute delta
    const delta: Record<string, unknown> = {};
    for (const key of Object.keys(formData)) {
      if (formData[key] !== originalData[key]) {
        delta[key] = formData[key];
      }
    }

    if (Object.keys(delta).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/directory/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delta),
      });

      if (res.ok) {
        setOriginalData({ ...formData });
        setSaveMessage({ type: "success", text: "Changes saved successfully." });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const err = await res.json();
        setSaveMessage({ type: "error", text: err.error || "Failed to save." });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleImageAction(action: string, imageUrl?: string, newType?: string) {
    setActionLoading(`${action}-${imageUrl || ""}`);
    try {
      const res = await fetch(`/api/admin/images/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, image_url: imageUrl, new_type: newType }),
      });
      if (res.ok) {
        // Refresh detail to get updated images
        const detailRes = await fetch(`/api/admin/directory/${providerId}`);
        if (detailRes.ok) {
          const data = await detailRes.json();
          setImages(data.images ?? []);
          setRawImages(data.rawImages ?? []);
          // Update hero_image_url in form if it changed
          if (data.provider.hero_image_url !== formData.hero_image_url) {
            setFormData((prev) => ({ ...prev, hero_image_url: data.provider.hero_image_url }));
            setOriginalData((prev) => ({ ...prev, hero_image_url: data.provider.hero_image_url }));
          }
        }
      }
    } catch (err) {
      console.error("Image action failed:", err);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  const provider = formData as unknown as DirectoryProvider;

  return (
    <div className="max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/directory"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Directory
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
        <h1 className="text-2xl font-bold text-gray-900">{provider.provider_name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="default">{provider.provider_category}</Badge>
          <Badge variant={provider.deleted ? "rejected" : "verified"}>
            {provider.deleted ? "Deleted" : "Published"}
          </Badge>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Section title="Basic Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput label="Provider Name" value={formData.provider_name as string} onChange={(v) => updateField("provider_name", v)} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={(formData.provider_category as string) || ""}
                onChange={(e) => updateField("provider_category", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                {PROVIDER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <FieldInput label="Main Category" value={formData.main_category as string} onChange={(v) => updateField("main_category", v)} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={(formData.provider_description as string) || ""}
              onChange={(e) => updateField("provider_description", e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldInput label="Phone" value={formData.phone as string} onChange={(v) => updateField("phone", v)} />
            <FieldInput label="Email" value={formData.email as string} onChange={(v) => updateField("email", v)} />
            <FieldInput label="Website" value={formData.website as string} onChange={(v) => updateField("website", v)} />
          </div>
        </Section>

        {/* Location */}
        <Section title="Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FieldInput label="Address" value={formData.address as string} onChange={(v) => updateField("address", v)} />
            </div>
            <FieldInput label="City" value={formData.city as string} onChange={(v) => updateField("city", v)} />
            <FieldInput label="State" value={formData.state as string} onChange={(v) => updateField("state", v)} />
            <FieldInput label="Zipcode" value={formData.zipcode as string} onChange={(v) => updateField("zipcode", v === "" ? null : Number(v))} type="number" />
            <FieldInput label="Latitude" value={formData.lat as string} onChange={(v) => updateField("lat", v === "" ? null : Number(v))} type="number" step="any" />
            <FieldInput label="Longitude" value={formData.lon as string} onChange={(v) => updateField("lon", v === "" ? null : Number(v))} type="number" step="any" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Place ID</label>
              <input
                type="text"
                value={(formData.place_id as string) || ""}
                readOnly
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </Section>

        {/* Pricing */}
        <Section title="Pricing">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldInput label="Lower Price" value={formData.lower_price as string} onChange={(v) => updateField("lower_price", v === "" ? null : Number(v))} type="number" />
            <FieldInput label="Upper Price" value={formData.upper_price as string} onChange={(v) => updateField("upper_price", v === "" ? null : Number(v))} type="number" />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Contact for Price</label>
              <select
                value={(formData.contact_for_price as string) ?? ""}
                onChange={(e) => updateField("contact_for_price", e.target.value || null)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">—</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            </div>
          </div>
        </Section>

        {/* Scores */}
        <Section title="Scores">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FieldInput label="Google Rating" value={formData.google_rating as string} onChange={(v) => updateField("google_rating", v === "" ? null : Number(v))} type="number" step="0.1" />
            <FieldInput label="Community Score" value={formData.community_Score as string} onChange={(v) => updateField("community_Score", v === "" ? null : Number(v))} type="number" step="0.1" />
            <FieldInput label="Value Score" value={formData.value_score as string} onChange={(v) => updateField("value_score", v === "" ? null : Number(v))} type="number" step="0.1" />
            <FieldInput label="Info Availability" value={formData.information_availability_score as string} onChange={(v) => updateField("information_availability_score", v === "" ? null : Number(v))} type="number" step="0.1" />
          </div>
        </Section>

        {/* Images */}
        <Section title="Images">
          {/* Hero image display */}
          {!!formData.hero_image_url && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Current Hero Image</p>
              <div className="w-48 h-32 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={formData.hero_image_url as string}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <FieldInput label="Provider Logo URL" value={formData.provider_logo as string} onChange={(v) => updateField("provider_logo", v || null)} />
          </div>

          {/* Classified images */}
          {images.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Classified Images</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 border-2 border-transparent hover:border-primary-400 transition-colors">
                      {img.is_accessible ? (
                        <img
                          src={img.image_url}
                          alt=""
                          className={`w-full h-full ${img.image_type === "logo" ? "object-contain p-2" : "object-cover"}`}
                          onError={(e) => { (e.target as HTMLImageElement).className = "hidden"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Inaccessible</div>
                      )}

                      {img.is_hero && (
                        <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold" title="Hero image">
                          ★
                        </div>
                      )}

                      <div className="absolute top-1 right-1">
                        <Badge variant={img.image_type === "photo" ? "verified" : img.image_type === "logo" ? "pending" : "default"}>
                          {img.image_type}
                        </Badge>
                      </div>

                      {img.review_status === "admin_overridden" && (
                        <div className="absolute bottom-1 left-1 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                          Overridden
                        </div>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      <p>{img.classification_method} ({(img.classification_confidence * 100).toFixed(0)}%)</p>
                      {img.width && img.height && <p>{img.width}x{img.height}</p>}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-1">
                      {img.image_type !== "photo" && (
                        <button
                          onClick={() => handleImageAction("override_type", img.image_url, "photo")}
                          disabled={actionLoading !== null}
                          className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                        >
                          Mark Photo
                        </button>
                      )}
                      {img.image_type !== "logo" && (
                        <button
                          onClick={() => handleImageAction("override_type", img.image_url, "logo")}
                          disabled={actionLoading !== null}
                          className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                        >
                          Mark Logo
                        </button>
                      )}
                      {!img.is_hero && img.is_accessible && (
                        <button
                          onClick={() => handleImageAction("set_hero", img.image_url)}
                          disabled={actionLoading !== null}
                          className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                        >
                          Set Hero
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleImageAction("mark_reviewed")}
                  disabled={actionLoading !== null}
                  className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  Mark All Reviewed
                </button>
                {!!formData.hero_image_url && (
                  <button
                    onClick={() => handleImageAction("clear_hero")}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    Clear Hero (Use Stock)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Raw images fallback */}
          {images.length === 0 && rawImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-3">
                Raw images from provider record — run classification script for AI analysis.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {rawImages.map((url, i) => (
                  <div key={i} className="relative">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <button
                        onClick={() => handleImageAction("set_hero", url)}
                        disabled={actionLoading !== null}
                        className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                      >
                        Set as Hero
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {!!formData.hero_image_url && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleImageAction("clear_hero")}
                    disabled={actionLoading !== null}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                  >
                    Clear Hero (Use Stock)
                  </button>
                </div>
              )}
            </div>
          )}

          {images.length === 0 && rawImages.length === 0 && (
            <p className="text-sm text-gray-500">No images found for this provider.</p>
          )}
        </Section>

        {/* Status */}
        <Section title="Status">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.deleted}
                onChange={(e) => updateField("deleted", e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Deleted</span>
            </label>
            {!!formData.deleted_at && (
              <span className="text-sm text-gray-500">
                Deleted at: {new Date(formData.deleted_at as string).toLocaleString()}
              </span>
            )}
          </div>
        </Section>
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
