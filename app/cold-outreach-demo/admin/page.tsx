"use client";

/**
 * Cold Outreach Admin Demo — Simplified
 *
 * Simple flow:
 * 1. Select a city
 * 2. See all unclaimed providers in that city
 * 3. Start sequence (2 emails)
 * 4. After sequence: Claimed vs Needs Follow-up
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Select from "@/components/ui/Select";

// ============================================================
// Types
// ============================================================

type ProviderStatus = "not_contacted" | "sequence_sent" | "claimed" | "needs_followup";

type Provider = {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  category: string | null;
  views: number;
  status: ProviderStatus;
};

type CityOption = {
  city: string;
  state: string;
  count: number;
};

type ApiResponse = {
  rows: Provider[];
  total: number;
  cities: CityOption[];
};

// ============================================================
// Main Component
// ============================================================

export default function ColdOutreachAdminPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [city, setCity] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  // Fetch data when city changes
  const fetchData = useCallback(async () => {
    if (!city) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ city });
      const res = await fetch(`/api/admin/cold-outreach-demo?${params}`);
      if (!res.ok) throw new Error((await res.json()).error || "Failed to load");
      const json = await res.json();
      setData(json);
      setSelectedIds(new Set()); // Reset selection
      setSentIds(new Set()); // Reset sent state
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [city]);

  // Fetch cities on mount
  useEffect(() => {
    async function loadCities() {
      try {
        const res = await fetch("/api/admin/cold-outreach-demo");
        if (!res.ok) return;
        const json = await res.json();
        setData((prev) => prev ?? { rows: [], total: 0, cities: json.cities });
      } catch {
        // Ignore - cities will load when user selects one
      }
    }
    loadCities();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // City options for dropdown
  const cityOptions = useMemo(
    () => [
      { value: "", label: "Select a city..." },
      ...(data?.cities ?? []).map((c) => ({
        value: c.state ? `${c.city}, ${c.state}` : c.city,
        label: c.state
          ? `${c.city}, ${c.state} (${c.count} providers)`
          : `${c.city} (${c.count} providers)`,
      })),
    ],
    [data?.cities]
  );

  // Providers with email (can be contacted)
  const contactableProviders = useMemo(
    () => (data?.rows ?? []).filter((p) => p.email),
    [data?.rows]
  );

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === contactableProviders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contactableProviders.map((p) => p.id)));
    }
  };

  // Simulate sending sequence
  const handleSendSequence = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSending(false);
    // Track which providers were sent to
    setSentIds((prev) => new Set([...prev, ...selectedIds]));
    setSelectedIds(new Set());
  };

  const allSelected = selectedIds.size === contactableProviders.length && contactableProviders.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="flex items-center gap-2">
                <Image src="/images/olera-logo.png" alt="Olera" width={24} height={24} />
                <span className="font-semibold text-gray-900">Admin</span>
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-600 text-sm">Cold Outreach</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-medium rounded">
              DEMO
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Cold Outreach</h1>
          <p className="text-gray-600 mt-1">
            Select a city and send profile completion emails to unclaimed providers.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* City Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select City
          </label>
          <div className="max-w-sm">
            <Select
              options={cityOptions}
              value={city ?? ""}
              onChange={(value) => setCity(value || null)}
              placeholder="Select a city..."
              size="md"
              searchable
              searchPlaceholder="Search cities..."
            />
          </div>
        </div>

        {/* Provider List */}
        {city && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Loading providers...</div>
            ) : !data || data.rows.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No unclaimed providers in this city.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      disabled={contactableProviders.length === 0}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-600">
                      {data.rows.length} providers
                      {contactableProviders.length < data.rows.length && (
                        <span className="text-gray-400">
                          {" "}({contactableProviders.length} with email)
                        </span>
                      )}
                    </span>
                  </div>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleSendSequence}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Send to {selectedIds.size} providers
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Sent Success Banner */}
                {sentIds.size > 0 && (
                  <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-900">Sequence started!</p>
                      <p className="text-xs text-emerald-700">
                        Email 1 sent now. Email 2 will be sent in 3 days if no response.
                      </p>
                    </div>
                  </div>
                )}

                {/* Provider Rows */}
                <ul className="divide-y divide-gray-100">
                  {data.rows.map((provider) => {
                    const hasEmail = !!provider.email;
                    const isSelected = selectedIds.has(provider.id);
                    const wasSent = sentIds.has(provider.id);

                    return (
                      <li
                        key={provider.id}
                        className={`flex items-center gap-4 px-4 py-3 ${
                          !hasEmail ? "opacity-50" : "hover:bg-gray-50"
                        } ${isSelected ? "bg-primary-50" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(provider.id)}
                          disabled={!hasEmail || wasSent}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {provider.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {provider.email ?? "No email"}
                            {provider.category && (
                              <span className="text-gray-400">
                                {" · "}{formatCategory(provider.category)}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Views */}
                        {provider.views > 0 && (
                          <span className="text-xs text-gray-500">
                            {provider.views} views
                          </span>
                        )}

                        {/* Status after sending */}
                        {wasSent && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Sequence sent
                          </span>
                        )}

                        {!hasEmail && (
                          <span className="text-xs text-gray-400">No email</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Empty State - No city selected */}
        {!city && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium">Select a city to get started</p>
            <p className="text-sm text-gray-500 mt-1">
              You&apos;ll see all unclaimed providers in that city.
            </p>
          </div>
        )}

        {/* Email Preview */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">Email Preview</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/images/for-providers/team/logan.jpg"
                alt="Logan"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">Dr. Logan DuBose</p>
                <p className="text-xs text-gray-400">logan@olera.care</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">
                Subject: Families are looking at your listing on Olera
              </p>
              <p className="mb-3">Hi,</p>
              <p className="mb-3">
                We found your listing on the web and added it to Olera so families
                searching for senior care can discover you.
              </p>
              <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mb-3">
                <p className="font-semibold text-primary-900">
                  X families viewed your profile this month.
                </p>
              </div>
              <p>
                Complete your profile so families can see your photos, services,
                and what makes you special.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-[13px] text-amber-800">
            <span className="font-medium">Demo:</span> This simulates the cold outreach flow.
            No actual emails are sent.
          </p>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Helper Functions
// ============================================================

function formatCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
