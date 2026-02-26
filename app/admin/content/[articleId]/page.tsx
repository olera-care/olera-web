"use client";

import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { slugify } from "@/lib/slugify";
import { ALL_RESOURCE_CATEGORIES, RESOURCE_CATEGORY_CONFIG } from "@/types/resource";
import { ALL_CARE_TYPES, CARE_TYPE_CONFIG } from "@/types/forum";
import type { ContentArticle, ContentStatus } from "@/types/content";
import ImageDropZone from "@/components/admin/content/ImageDropZone";
import SEOSection from "@/components/admin/content/SEOSection";

const TiptapEditor = lazy(() => import("@/components/admin/content/TiptapEditor"));

export default function AdminContentEditorPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [originalData, setOriginalData] = useState<Record<string, unknown>>({});

  const fetchArticle = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/content/${articleId}`);
      if (!res.ok) {
        router.push("/admin/content");
        return;
      }
      const data = await res.json();
      setFormData({ ...data.article });
      setOriginalData({ ...data.article });
    } catch (err) {
      console.error("Failed to fetch article:", err);
    } finally {
      setLoading(false);
    }
  }, [articleId, router]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // Dirty tracking
  const isDirty = useMemo(() => {
    for (const key of Object.keys(formData)) {
      if (JSON.stringify(formData[key]) !== JSON.stringify(originalData[key]))
        return true;
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
      if (JSON.stringify(formData[key]) !== JSON.stringify(originalData[key])) {
        delta[key] = formData[key];
      }
    }

    if (Object.keys(delta).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/content/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delta),
      });

      if (res.ok) {
        // Re-fetch to get server-computed fields (published_at, updated_at)
        const detailRes = await fetch(`/api/admin/content/${articleId}`);
        if (detailRes.ok) {
          const data = await detailRes.json();
          setFormData({ ...data.article });
          setOriginalData({ ...data.article });
        } else {
          setOriginalData({ ...formData });
        }
        setSaveMessage({ type: "success", text: "Changes saved." });
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

  // Auto-generate slug from title
  function handleTitleChange(value: string) {
    updateField("title", value);
    // Only auto-generate slug if it hasn't been manually customized
    const currentSlug = formData.slug as string;
    const originalTitle = originalData.title as string;
    if (!currentSlug || currentSlug === slugify(originalTitle || "")) {
      updateField("slug", slugify(value));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  const article = formData as unknown as ContentArticle;
  const status = article.status as ContentStatus;

  const statusVariant: Record<ContentStatus, "default" | "verified" | "pending" | "rejected"> = {
    draft: "pending",
    published: "verified",
    archived: "rejected",
  };

  return (
    <div className="max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/content"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Content
        </Link>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span
              className={`text-sm ${saveMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
            >
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
        <h1 className="text-2xl font-bold text-gray-900 truncate">{article.title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={statusVariant[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {article.featured && (
            <Badge variant="pro">Featured</Badge>
          )}
          {article.published_at && (
            <span className="text-sm text-gray-500">
              Published {new Date(article.published_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <Section title="Basic Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FieldInput
                label="Title"
                value={formData.title as string}
                onChange={handleTitleChange}
              />
            </div>
            <div className="sm:col-span-2">
              <FieldInput
                label="Subtitle"
                value={formData.subtitle as string}
                onChange={(v) => updateField("subtitle", v)}
              />
            </div>
            <FieldInput
              label="Slug"
              value={formData.slug as string}
              onChange={(v) => updateField("slug", v)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={(formData.category as string) || "guide"}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                {ALL_RESOURCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {RESOURCE_CATEGORY_CONFIG[cat].label}
                  </option>
                ))}
              </select>
            </div>
            <FieldInput
              label="Reading Time"
              value={formData.reading_time as string}
              onChange={(v) => updateField("reading_time", v)}
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Excerpt</label>
            <textarea
              value={(formData.excerpt as string) || ""}
              onChange={(e) => updateField("excerpt", e.target.value)}
              rows={3}
              placeholder="Brief summary shown in article cards..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </Section>

        {/* Author */}
        <Section title="Author">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldInput
              label="Author Name"
              value={formData.author_name as string}
              onChange={(v) => updateField("author_name", v)}
            />
            <FieldInput
              label="Author Role"
              value={formData.author_role as string}
              onChange={(v) => updateField("author_role", v)}
            />
          </div>
        </Section>

        {/* Content */}
        <Section title="Content">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Article Body</label>
          <Suspense
            fallback={
              <div className="border border-gray-300 rounded-lg p-8 text-center text-gray-400">
                Loading editor...
              </div>
            }
          >
            <TiptapEditor
              content={formData.content_json as Record<string, unknown> | null}
              articleId={articleId}
              onChange={(json, html) => {
                updateField("content_json", json);
                updateField("content_html", html);
              }}
            />
          </Suspense>
        </Section>

        {/* Settings */}
        <Section title="Settings">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={(formData.status as string) || "draft"}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">&nbsp;</label>
              <label className="flex items-center gap-2 cursor-pointer py-2.5">
                <input
                  type="checkbox"
                  checked={!!formData.featured}
                  onChange={(e) => updateField("featured", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Featured article</span>
              </label>
            </div>
          </div>

          {/* Care Types */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Care Types</label>
            <div className="flex flex-wrap gap-2">
              {ALL_CARE_TYPES.map((ct) => {
                const selected = ((formData.care_types as string[]) || []).includes(ct);
                return (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => {
                      const current = (formData.care_types as string[]) || [];
                      if (selected) {
                        updateField("care_types", current.filter((c) => c !== ct));
                      } else {
                        updateField("care_types", [...current, ct]);
                      }
                    }}
                    className={[
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                      selected
                        ? "bg-primary-50 border-primary-300 text-primary-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300",
                    ].join(" ")}
                  >
                    {CARE_TYPE_CONFIG[ct].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="mt-4">
            <FieldInput
              label="Tags (comma-separated)"
              value={((formData.tags as string[]) || []).join(", ")}
              onChange={(v) =>
                updateField(
                  "tags",
                  v.split(",").map((t) => t.trim()).filter(Boolean)
                )
              }
            />
          </div>
        </Section>

        {/* Cover Image */}
        <Section title="Cover Image">
          <ImageDropZone
            currentUrl={formData.cover_image_url as string | null}
            articleId={articleId}
            onUpload={(url) => updateField("cover_image_url", url)}
            onRemove={() => updateField("cover_image_url", null)}
          />
        </Section>

        {/* SEO */}
        <Section title="SEO">
          <SEOSection
            formData={formData}
            updateField={updateField}
            articleId={articleId}
          />
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
  placeholder,
}: {
  label: string;
  value: string | number | null | undefined;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
      />
    </div>
  );
}
