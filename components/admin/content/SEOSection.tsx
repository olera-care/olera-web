"use client";

import ImageDropZone from "./ImageDropZone";

interface SEOSectionProps {
  formData: Record<string, unknown>;
  updateField: (field: string, value: unknown) => void;
  articleId: string;
}

export default function SEOSection({ formData, updateField, articleId }: SEOSectionProps) {
  const metaTitle = (formData.meta_title as string) || "";
  const metaDescription = (formData.meta_description as string) || "";
  const ogTitle = (formData.og_title as string) || "";
  const ogDescription = (formData.og_description as string) || "";
  const focusKeyword = (formData.focus_keyword as string) || "";
  const canonicalUrl = (formData.canonical_url as string) || "";
  const noindex = !!formData.noindex;

  // Fallback chain for preview
  const previewTitle = metaTitle || ogTitle || (formData.title as string) || "Untitled";
  const previewDescription =
    metaDescription || ogDescription || (formData.excerpt as string) || "";
  const previewUrl = canonicalUrl || `olera.care/resources/${formData.slug || "..."}`;

  return (
    <div className="space-y-6">
      {/* Google Snippet Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Google Snippet Preview
        </label>
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-xl">
          <p className="text-sm text-green-700 truncate">{previewUrl}</p>
          <p className="text-lg text-blue-700 font-medium leading-snug truncate">
            {previewTitle.length > 60
              ? previewTitle.slice(0, 57) + "..."
              : previewTitle}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
            {previewDescription.length > 160
              ? previewDescription.slice(0, 157) + "..."
              : previewDescription || "No description set."}
          </p>
        </div>
      </div>

      {/* Meta Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Meta Title
        </label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => updateField("meta_title", e.target.value || null)}
          placeholder={`Defaults to: ${(formData.title as string) || "article title"}`}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-400">Recommended: 50-60 characters</p>
          <p
            className={`text-xs ${
              metaTitle.length > 60 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {metaTitle.length}/60
          </p>
        </div>
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Meta Description
        </label>
        <textarea
          value={metaDescription}
          onChange={(e) =>
            updateField("meta_description", e.target.value || null)
          }
          rows={3}
          placeholder={`Defaults to: ${(formData.excerpt as string)?.slice(0, 80) || "article excerpt"}...`}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-400">Recommended: 120-160 characters</p>
          <p
            className={`text-xs ${
              metaDescription.length > 160 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {metaDescription.length}/160
          </p>
        </div>
      </div>

      {/* Focus Keyword */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Focus Keyword
        </label>
        <input
          type="text"
          value={focusKeyword}
          onChange={(e) => updateField("focus_keyword", e.target.value || null)}
          placeholder="e.g. home health care"
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
      </div>

      {/* OG Card Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Social Card Preview
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden max-w-md">
          {!!(formData.og_image_url || formData.cover_image_url) && (
            <img
              src={(formData.og_image_url || formData.cover_image_url) as string}
              alt="OG preview"
              className="w-full h-40 object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="p-3">
            <p className="text-xs text-gray-500 uppercase">olera.care</p>
            <p className="font-semibold text-sm text-gray-900 line-clamp-2 mt-0.5">
              {ogTitle || metaTitle || (formData.title as string) || "Untitled"}
            </p>
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
              {ogDescription || metaDescription || (formData.excerpt as string) || ""}
            </p>
          </div>
        </div>
      </div>

      {/* OG Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            OG Title
          </label>
          <input
            type="text"
            value={ogTitle}
            onChange={(e) => updateField("og_title", e.target.value || null)}
            placeholder="Defaults to meta title"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            OG Description
          </label>
          <input
            type="text"
            value={ogDescription}
            onChange={(e) =>
              updateField("og_description", e.target.value || null)
            }
            placeholder="Defaults to meta description"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* OG Image */}
      <ImageDropZone
        currentUrl={formData.og_image_url as string | null}
        articleId={articleId}
        onUpload={(url) => updateField("og_image_url", url)}
        onRemove={() => updateField("og_image_url", null)}
        label="OG Image"
      />
      {!formData.og_image_url && !!formData.cover_image_url && (
        <button
          type="button"
          onClick={() => updateField("og_image_url", formData.cover_image_url)}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Use cover image as OG image
        </button>
      )}

      {/* Canonical + noindex */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Canonical URL
          </label>
          <input
            type="text"
            value={canonicalUrl}
            onChange={(e) =>
              updateField("canonical_url", e.target.value || null)
            }
            placeholder={`Defaults to: https://olera.care/resources/${formData.slug || "..."}`}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer py-2.5">
            <input
              type="checkbox"
              checked={noindex}
              onChange={(e) => updateField("noindex", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">
              noindex (hide from search engines)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
