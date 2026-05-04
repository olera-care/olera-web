"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Campus } from "@/lib/student-outreach/types";

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/student-outreach/campuses");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setCampuses(data.campuses ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Campuses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Universities you're targeting for student outreach. Each campus groups its own
            stakeholders (orgs, advisors, dept heads, professors).
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/student-outreach"
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Outreach queue
          </Link>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            + Add campus
          </button>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {campuses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/student-outreach/campus/${c.slug}`}
                className="block rounded-lg border border-gray-100 bg-white p-4 transition-colors hover:bg-gray-50"
              >
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  {!c.is_active && " · inactive"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <AddCampusModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); refetch(); }} />
      )}
    </div>
  );
}

function AddCampusModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/student-outreach/campuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, city, state }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-900">Add campus</h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100" aria-label="Close">×</button>
        </header>
        <div className="space-y-3 px-6 py-4">
          {err && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <Field label="Slug *" value={slug} onChange={setSlug} placeholder="ucla" />
          <Field label="Name *" value={name} onChange={setName} placeholder="University of California Los Angeles" />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="State" value={state} onChange={setState} placeholder="CA" />
        </div>
        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-3">
          <button onClick={onClose} disabled={submitting} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting || !slug.trim() || !name.trim()} className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50">
            {submitting ? "Creating…" : "Create"}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
      />
    </label>
  );
}
