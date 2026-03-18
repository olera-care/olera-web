"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { FamilyMetadata } from "@/lib/types";

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "ASAP",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Exploring",
};

interface ConnectionRow {
  id: string;
  type: string;
  status: string;
  message: string | null;
  created_at: string;
  to_profile: {
    id: string;
    display_name: string;
    type: string;
    slug: string;
  } | null;
}

function getStatusVariant(status: string): "pending" | "verified" | "rejected" | "default" {
  switch (status) {
    case "pending": return "pending";
    case "accepted": return "verified";
    case "declined": return "rejected";
    default: return "default";
  }
}

export default function AdminCareSeekerDetailPage() {
  const { seekerId } = useParams<{ seekerId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [seeker, setSeeker] = useState<any>(null);
  const [connections, setConnections] = useState<ConnectionRow[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);

  const fetchSeeker = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/care-seekers/${seekerId}`);
      if (!res.ok) {
        router.push("/admin/care-seekers");
        return;
      }
      const data = await res.json();
      setSeeker(data.seeker);
      setConnections(data.connections ?? []);
      setConnectionCount(data.connectionCount ?? 0);
    } catch (err) {
      console.error("Failed to fetch care seeker:", err);
    } finally {
      setLoading(false);
    }
  }, [seekerId, router]);

  useEffect(() => {
    fetchSeeker();
  }, [fetchSeeker]);

  async function handleDelete() {
    if (!confirm(`Permanently delete "${seeker?.display_name}"? This will also delete all their connections. This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/care-seekers/${seekerId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/care-seekers");
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!seeker) return null;

  const meta = (seeker.metadata || {}) as FamilyMetadata;
  const isGuest = !seeker.account_id;

  return (
    <div className="max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/care-seekers"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Care Seekers
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{seeker.display_name}</h1>
        <div className="flex items-center gap-3 mt-2">
          {isGuest ? (
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
              Guest (unclaimed)
            </span>
          ) : (
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
              Claimed account
            </span>
          )}
          <span className="text-sm text-gray-500">
            {connectionCount} connection{connectionCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Identity */}
        <Section title="Identity">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="Name" value={seeker.display_name} />
            <ReadOnlyField label="Email" value={seeker.email} />
            <ReadOnlyField label="Phone" value={seeker.phone} />
            <ReadOnlyField
              label="Location"
              value={seeker.city && seeker.state ? `${seeker.city}, ${seeker.state}` : seeker.city || seeker.state}
            />
            <ReadOnlyField label="Account Status" value={isGuest ? "Guest (no account)" : "Claimed"} />
            <ReadOnlyField label="Source" value={seeker.source} />
          </div>
        </Section>

        {/* Care Needs */}
        <Section title="Care Needs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="Relationship to Recipient" value={meta.relationship_to_recipient} />
            <ReadOnlyField
              label="Care Types"
              value={seeker.care_types?.length > 0 ? seeker.care_types.join(", ") : null}
            />
            <ReadOnlyField
              label="Timeline"
              value={meta.timeline ? TIMELINE_LABELS[meta.timeline] || meta.timeline : null}
            />
            <div className="sm:col-span-2">
              <ReadOnlyField label="About Situation" value={meta.about_situation} />
            </div>
          </div>
        </Section>

        {/* Enrichment */}
        <Section title="Enrichment">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField label="Living Situation" value={meta.living_situation} />
            <ReadOnlyField label="Schedule Preference" value={meta.schedule_preference} />
            <ReadOnlyField label="Care Location" value={meta.care_location} />
            <ReadOnlyField
              label="Language Preference"
              value={Array.isArray(meta.language_preference) ? meta.language_preference.join(", ") : meta.language_preference}
            />
            <ReadOnlyField
              label="Contact Preference"
              value={meta.contact_preference}
            />
          </div>
        </Section>

        {/* Budget */}
        <Section title="Budget">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ReadOnlyField
              label="Budget Range"
              value={
                meta.budget_min || meta.budget_max
                  ? `$${meta.budget_min ?? "?"} – $${meta.budget_max ?? "?"}`
                  : null
              }
            />
            <ReadOnlyField
              label="Payment Methods"
              value={meta.payment_methods?.length ? meta.payment_methods.join(", ") : null}
            />
          </div>
        </Section>

        {/* Connection History */}
        <Section title="Connection History">
          {connections.length === 0 ? (
            <p className="text-sm text-gray-400">No connections found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Provider</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Type</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {connections.map((conn) => (
                    <tr key={conn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        {conn.to_profile?.slug ? (
                          <Link
                            href={`/provider/${conn.to_profile.slug}`}
                            target="_blank"
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            {conn.to_profile.display_name}
                          </Link>
                        ) : (
                          <span className="text-gray-900">{conn.to_profile?.display_name ?? "Unknown"}</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="default">{conn.type}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant={getStatusVariant(conn.status)}>{conn.status}</Badge>
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(conn.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
              <p className="text-sm text-red-600 mt-1">
                Permanently delete this care seeker and all their connections. This cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting..." : "Delete Care Seeker"}
            </button>
          </div>
        </div>
      </div>
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

function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-400">Not provided</span>}</p>
    </div>
  );
}
