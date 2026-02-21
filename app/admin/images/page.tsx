"use client";

import { useEffect, useState, useCallback } from "react";
import Badge from "@/components/ui/Badge";

type StatusFilter = "needs_review" | "has_photo" | "logo_only" | "no_images" | "all";

interface ProviderImageSummary {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  city: string | null;
  state: string | null;
  hero_image_url: string | null;
  image_count: number;
  photo_count: number;
  logo_count: number;
  min_confidence: number | null;
  needs_review: boolean;
}

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

interface ProviderDetail {
  provider: {
    provider_id: string;
    provider_name: string;
    provider_category: string;
    city: string | null;
    state: string | null;
    hero_image_url: string | null;
  };
  images: ImageMetadata[];
}

export default function AdminImagesPage() {
  const [providers, setProviders] = useState<ProviderImageSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("needs_review");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProviderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/images?status=${filter}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers ?? []);
        setTotal(data.total ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch providers:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  async function toggleDetail(providerId: string) {
    if (expandedId === providerId) {
      setExpandedId(null);
      setDetail(null);
      return;
    }

    setExpandedId(providerId);
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/admin/images/${providerId}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleAction(providerId: string, action: string, imageUrl?: string, newType?: string) {
    setActionLoading(`${providerId}-${action}-${imageUrl || ""}`);
    try {
      const res = await fetch(`/api/admin/images/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, image_url: imageUrl, new_type: newType }),
      });
      if (res.ok) {
        // Refresh detail
        const detailRes = await fetch(`/api/admin/images/${providerId}`);
        if (detailRes.ok) {
          setDetail(await detailRes.json());
        }
        // Refresh list
        fetchProviders();
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  }

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: "Needs Review", value: "needs_review" },
    { label: "Has Photo", value: "has_photo" },
    { label: "Logo Only", value: "logo_only" },
    { label: "No Images", value: "no_images" },
    { label: "All", value: "all" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Image Management</h1>
        <p className="text-lg text-gray-600 mt-1">
          Review and manage provider image classifications.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setExpandedId(null); setDetail(null); }}
            className={[
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              filter === tab.value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
        <span className="self-center text-sm text-gray-500 ml-2">
          {total} providers
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      ) : providers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No providers found for this filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {providers.map((provider) => (
            <div key={provider.provider_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Provider row */}
              <div
                className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleDetail(provider.provider_id)}
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  {provider.hero_image_url ? (
                    <img
                      src={provider.hero_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {provider.provider_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {provider.provider_category} &middot; {[provider.city, provider.state].filter(Boolean).join(", ") || "No location"}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-500">
                    {provider.photo_count} photo{provider.photo_count !== 1 ? "s" : ""}, {provider.logo_count} logo{provider.logo_count !== 1 ? "s" : ""}
                  </span>
                  {provider.min_confidence !== null && (
                    <ConfidenceBadge confidence={provider.min_confidence} />
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === provider.provider_id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Detail panel */}
              {expandedId === provider.provider_id && (
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                  {detailLoading ? (
                    <p className="text-sm text-gray-500 py-4">Loading images...</p>
                  ) : detail && detail.images.length > 0 ? (
                    <>
                      {/* Image grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                        {detail.images.map((img) => (
                          <div key={img.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 border-2 border-transparent hover:border-primary-400 transition-colors">
                              {img.is_accessible ? (
                                <img
                                  src={img.image_url}
                                  alt=""
                                  className={`w-full h-full ${img.image_type === "logo" ? "object-contain p-2" : "object-cover"}`}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "";
                                    (e.target as HTMLImageElement).className = "hidden";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  Inaccessible
                                </div>
                              )}

                              {/* Hero star */}
                              {img.is_hero && (
                                <div className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold" title="Hero image">
                                  ★
                                </div>
                              )}

                              {/* Type badge */}
                              <div className="absolute top-1 right-1">
                                <Badge variant={img.image_type === "photo" ? "verified" : img.image_type === "logo" ? "pending" : "default"}>
                                  {img.image_type}
                                </Badge>
                              </div>

                              {/* Override indicator */}
                              {img.review_status === "admin_overridden" && (
                                <div className="absolute bottom-1 left-1 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                  Overridden
                                </div>
                              )}
                            </div>

                            {/* Image info */}
                            <div className="mt-1 text-xs text-gray-500">
                              <p>{img.classification_method} ({(img.classification_confidence * 100).toFixed(0)}%)</p>
                              {img.width && img.height && <p>{img.width}x{img.height}</p>}
                            </div>

                            {/* Per-image actions */}
                            <div className="mt-1 flex flex-wrap gap-1">
                              {img.image_type !== "photo" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(provider.provider_id, "override_type", img.image_url, "photo"); }}
                                  disabled={actionLoading !== null}
                                  className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                >
                                  Mark Photo
                                </button>
                              )}
                              {img.image_type !== "logo" && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(provider.provider_id, "override_type", img.image_url, "logo"); }}
                                  disabled={actionLoading !== null}
                                  className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 disabled:opacity-50"
                                >
                                  Mark Logo
                                </button>
                              )}
                              {!img.is_hero && img.is_accessible && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleAction(provider.provider_id, "set_hero", img.image_url); }}
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

                      {/* Provider-level actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => handleAction(provider.provider_id, "mark_reviewed")}
                          disabled={actionLoading !== null}
                          className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                          Mark All Reviewed
                        </button>
                        {provider.hero_image_url && (
                          <button
                            onClick={() => handleAction(provider.provider_id, "clear_hero")}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          >
                            Clear Hero (Use Stock)
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 py-4">
                      No classified images. Run the classification script first.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let color: string;
  if (confidence >= 0.8) {
    color = "bg-green-100 text-green-700";
  } else if (confidence >= 0.5) {
    color = "bg-yellow-100 text-yellow-700";
  } else {
    color = "bg-red-100 text-red-700";
  }

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {(confidence * 100).toFixed(0)}%
    </span>
  );
}
