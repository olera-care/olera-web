"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────

interface Variant {
  id: string;
  variant_key: string;
  name: string;
  is_control: boolean;
  is_active: boolean;
  allocation_percent: number;
  subject: string;
  body: string;
  enrolled_count: number;
  claimed_count: number;
  created_at: string;
  notes: string | null;
}

interface VariantStats {
  variant_id: string;
  variant_key: string;
  name: string;
  is_control: boolean;
  enrolled_count: number;
  opened_count: number;
  clicked_count: number;
  claimed_count: number;
  claim_rate: number;
}

interface CreateVariantForm {
  variant_key: string;
  name: string;
  subject: string;
  body: string;
  is_control: boolean;
  allocation_percent: number;
  notes: string;
}

const DEFAULT_FORM: CreateVariantForm = {
  variant_key: "",
  name: "",
  subject: "",
  body: "",
  is_control: false,
  allocation_percent: 25,
  notes: "",
};

// ── Component ─────────────────────────────────────────────────────────────

export function VariantTestingPanel() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stats, setStats] = useState<VariantStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateVariantForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [previewVariant, setPreviewVariant] = useState<Variant | null>(null);

  // Fetch variants and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [variantsRes, statsRes] = await Promise.all([
        fetch("/api/admin/provider-outreach/variants"),
        fetch("/api/admin/provider-outreach/variant-stats"),
      ]);

      if (!variantsRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [variantsData, statsData] = await Promise.all([
        variantsRes.json(),
        statsRes.json(),
      ]);

      setVariants(variantsData.variants || []);
      setStats(statsData.variants || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create variant
  const handleCreate = async () => {
    if (!createForm.variant_key || !createForm.name || !createForm.subject || !createForm.body) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/provider-outreach/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create variant");
      }

      setShowCreateModal(false);
      setCreateForm(DEFAULT_FORM);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create variant");
    } finally {
      setSaving(false);
    }
  };

  // Toggle variant active state
  const toggleActive = async (variant: Variant) => {
    try {
      const res = await fetch("/api/admin/provider-outreach/variants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: variant.id,
          is_active: !variant.is_active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update variant");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update variant");
    }
  };

  // Update allocation percentage
  const updateAllocation = async (variant: Variant, newPercent: number) => {
    try {
      const res = await fetch("/api/admin/provider-outreach/variants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: variant.id,
          allocation_percent: newPercent,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update allocation");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update allocation");
    }
  };

  // Delete variant
  const deleteVariant = async (variant: Variant) => {
    if (!confirm(`Delete variant "${variant.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/provider-outreach/variants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: variant.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete variant");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete variant");
    }
  };

  // Get stats for a variant
  const getStatsForVariant = (variantId: string): VariantStats | undefined => {
    return stats.find((s) => s.variant_id === variantId);
  };

  // Check if any variants are active
  const hasActiveVariants = variants.some((v) => v.is_active);

  // Calculate total allocation
  const totalAllocation = variants
    .filter((v) => v.is_active)
    .reduce((sum, v) => sum + v.allocation_percent, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Email Variant Testing</h2>
          <p className="text-sm text-gray-500 mt-1">
            A/B test different Day 0 email variants to find the best-performing first email.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
        >
          Create Variant
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Status Banner */}
      <div className={`rounded-lg border p-4 ${
        hasActiveVariants
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              hasActiveVariants ? "bg-green-500" : "bg-gray-400"
            }`} />
            <span className={`text-sm font-medium ${
              hasActiveVariants ? "text-green-700" : "text-gray-600"
            }`}>
              {hasActiveVariants
                ? `Testing Active (${variants.filter(v => v.is_active).length} variants, ${totalAllocation}% allocation)`
                : "Testing Inactive"
              }
            </span>
          </div>
          {totalAllocation !== 100 && hasActiveVariants && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Warning: Allocation totals {totalAllocation}%, not 100%
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {hasActiveVariants
            ? "New provider launches will be randomly assigned to active variants."
            : "Activate variants to start testing. Default intro template will be used for all launches."
          }
        </p>
      </div>

      {/* Variants Table */}
      {variants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">No variants created yet.</p>
          <p className="text-xs text-gray-400 mt-1">
            Create a variant to start A/B testing different Day 0 emails.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allocation
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrolled
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opens
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Claimed
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {variants.map((variant) => {
                const variantStats = getStatsForVariant(variant.id);
                return (
                  <tr key={variant.id} className={variant.is_active ? "bg-green-50/30" : ""}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{variant.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{variant.variant_key}</p>
                        </div>
                        {variant.is_control && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Control
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(variant)}
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors ${
                          variant.is_active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {variant.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={variant.allocation_percent}
                        onChange={(e) => updateAllocation(variant, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                      />
                      <span className="ml-1 text-xs text-gray-500">%</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 tabular-nums">
                      {variantStats?.enrolled_count ?? variant.enrolled_count}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 tabular-nums">
                      {variantStats?.opened_count ?? 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 tabular-nums">
                      {variantStats?.clicked_count ?? 0}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900 tabular-nums">
                      {variantStats?.claimed_count ?? variant.claimed_count}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-medium tabular-nums ${
                        (variantStats?.claim_rate ?? 0) > 10
                          ? "text-green-600"
                          : (variantStats?.claim_rate ?? 0) > 5
                            ? "text-amber-600"
                            : "text-gray-600"
                      }`}>
                        {variantStats?.claim_rate ?? 0}%
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewVariant(variant)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Preview"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingVariant(variant)}
                          className="text-gray-500 hover:text-gray-700"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteVariant(variant)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Email Variant</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variant Key <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="intro_v2_shorter"
                      value={createForm.variant_key}
                      onChange={(e) => setCreateForm({ ...createForm, variant_key: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-500">Unique key for this variant</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Shorter Value Prop"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                    <p className="mt-1 text-xs text-gray-500">Human-readable name</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="We've created a free profile for {provider_name}"
                    value={createForm.subject}
                    onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">Use {"{provider_name}"}, {"{city}"}, etc. for placeholders</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Body <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={10}
                    placeholder="Hi {provider_name},&#10;&#10;I'm Dr. Logan DuBose..."
                    value={createForm.body}
                    onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Markdown format. Use **bold**, [link](url), and {"{claim_url}"} for the CTA.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Allocation %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={createForm.allocation_percent}
                      onChange={(e) => setCreateForm({ ...createForm, allocation_percent: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>
                  <div className="flex items-center gap-4 pt-6">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={createForm.is_control}
                        onChange={(e) => setCreateForm({ ...createForm, is_control: e.target.checked })}
                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      />
                      Mark as control (baseline)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Internal notes about this variant..."
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Variant"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewVariant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setPreviewVariant(null)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Preview: {previewVariant.name}
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Subject</p>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {previewVariant.subject}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Body</p>
                  <div className="text-sm text-gray-900 bg-gray-50 px-3 py-3 rounded-lg whitespace-pre-wrap font-mono text-xs">
                    {previewVariant.body}
                  </div>
                </div>

                {previewVariant.notes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</p>
                    <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      {previewVariant.notes}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setPreviewVariant(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (similar to Create but with existing values) */}
      {editingVariant && (
        <EditVariantModal
          variant={editingVariant}
          onClose={() => setEditingVariant(null)}
          onSave={async (updates) => {
            try {
              const res = await fetch("/api/admin/provider-outreach/variants", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingVariant.id, ...updates }),
              });

              if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update variant");
              }

              setEditingVariant(null);
              await fetchData();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to update variant");
            }
          }}
        />
      )}
    </div>
  );
}

// ── Edit Modal Component ──────────────────────────────────────────────────

function EditVariantModal({
  variant,
  onClose,
  onSave,
}: {
  variant: Variant;
  onClose: () => void;
  onSave: (updates: Partial<Variant>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: variant.name,
    subject: variant.subject,
    body: variant.body,
    is_control: variant.is_control,
    allocation_percent: variant.allocation_percent,
    notes: variant.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Edit Variant: {variant.variant_key}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                rows={10}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allocation %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.allocation_percent}
                  onChange={(e) => setForm({ ...form, allocation_percent: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_control}
                    onChange={(e) => setForm({ ...form, is_control: e.target.checked })}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  Mark as control (baseline)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
