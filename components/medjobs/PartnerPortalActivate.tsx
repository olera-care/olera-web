"use client";

/**
 * "Agree & continue" — Recruitment Partner self-activation (Chunk 3.1).
 * Posts the portal token to /api/medjobs/partner/activate; on success refreshes
 * the page (the server component re-renders the active state).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PartnerPortalActivate({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/medjobs/partner/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not activate");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not activate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={activate}
        disabled={loading}
        className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {loading ? "Setting up…" : "Agree & continue →"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
