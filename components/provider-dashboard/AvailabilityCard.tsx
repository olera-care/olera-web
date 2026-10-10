"use client";

import { useState } from "react";
import DashboardSectionCard from "./DashboardSectionCard";
import { saveProfile } from "./edit-modals/save-profile";
import { acceptingSince, availabilityLabel, AVAILABILITY_FRESH_DAYS } from "@/lib/provider-comms/availability";

interface AvailabilityCardProps {
  profileId: string;
  /** Raw business_profiles.metadata, the base saveProfile merges into. */
  rawMetadata: Record<string, unknown>;
  onSaved: () => Promise<void>;
}

/**
 * "Accepting new clients" switch. The same field building email 2 sets; on
 * the public page only a fresh yes shows (lib/provider-comms/availability.ts).
 * Switching it on again restarts the 90 days.
 */
export default function AvailabilityCard({ profileId, rawMetadata, onSaved }: AvailabilityCardProps) {
  const since = acceptingSince(rawMetadata);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const on = optimistic ?? since !== null;

  const toggle = async () => {
    const next = !on;
    setOptimistic(next);
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        profileId,
        metadataFields: {
          accepting_new_clients: next,
          accepting_new_clients_at: new Date().toISOString(),
          accepting_new_clients_source: "dashboard",
        },
        existingMetadata: rawMetadata,
      });
      await onSaved();
    } catch {
      setOptimistic(null);
      setError("That didn't save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardSectionCard title="Accepting new clients" id="availability">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          {on
            ? `Families see "Accepting new clients" on your page${since ? `, updated ${availabilityLabel(since)}` : ""}. It turns off by itself after ${AVAILABILITY_FRESH_DAYS} days unless you update it.`
            : "Turn this on and families see that you're taking new clients before they call."}
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Accepting new clients"
          disabled={saving}
          onClick={toggle}
          className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-60 ${on ? "bg-primary-600" : "bg-gray-300"}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
    </DashboardSectionCard>
  );
}
