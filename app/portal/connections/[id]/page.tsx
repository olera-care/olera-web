"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Connection, Profile, OrganizationMetadata, CaregiverMetadata, FamilyMetadata } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import UpgradePrompt from "@/components/providers/UpgradePrompt";

interface ConnectionDetail extends Connection {
  fromProfile: Profile | null;
  toProfile: Profile | null;
}

export default function ConnectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeProfile, membership } = useAuth();
  const [connection, setConnection] = useState<ConnectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState("");

  const connectionId = params.id as string;

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";

  const hasFullAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );

  useEffect(() => {
    if (!activeProfile || !connectionId || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchConnection = async () => {
      const supabase = createClient();

      // Fetch by primary key — fast single-row lookup
      const { data, error: fetchError } = await supabase
        .from("connections")
        .select(
          "id, type, status, from_profile_id, to_profile_id, message, created_at, updated_at"
        )
        .eq("id", connectionId)
        .single();

      if (fetchError || !data) {
        setError("Connection not found.");
        setLoading(false);
        return;
      }

      const conn = data as Connection;

      // Verify this user owns this connection
      if (
        conn.from_profile_id !== activeProfile.id &&
        conn.to_profile_id !== activeProfile.id
      ) {
        setError("Connection not found.");
        setLoading(false);
        return;
      }

      // Fetch both profiles (only the columns we display)
      const profileIds = [conn.from_profile_id, conn.to_profile_id];
      const { data: profiles } = await supabase
        .from("business_profiles")
        .select(
          "id, display_name, description, image_url, city, state, address, zip, type, email, phone, website, slug, care_types, metadata"
        )
        .in("id", profileIds);

      const profileMap = new Map(
        ((profiles as Profile[]) || []).map((p) => [p.id, p])
      );

      setConnection({
        ...conn,
        fromProfile: profileMap.get(conn.from_profile_id) || null,
        toProfile: profileMap.get(conn.to_profile_id) || null,
      });
      setLoading(false);
    };

    fetchConnection();
  }, [activeProfile, connectionId]);

  const handleStatusUpdate = async (newStatus: "accepted" | "declined" | "archived") => {
    if (!isSupabaseConfigured() || !activeProfile || !connection) return;

    setResponding(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("id", connection.id)
        .or(`to_profile_id.eq.${activeProfile.id},from_profile_id.eq.${activeProfile.id}`);

      if (updateError) throw new Error(updateError.message);

      setConnection((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(msg);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="px-8 py-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection not found</h2>
          <Link href="/portal/connections" className="text-primary-600 hover:underline">
            Back to connections
          </Link>
        </div>
      </div>
    );
  }

  const isInbound = connection.to_profile_id === activeProfile?.id;
  const otherProfile = isInbound ? connection.fromProfile : connection.toProfile;
  const shouldBlur = isProvider && !hasFullAccess && isInbound;

  const typeLabel =
    connection.type === "inquiry" ? "Inquiry"
    : connection.type === "invitation" ? "Invitation"
    : connection.type === "application" ? "Application"
    : connection.type;

  const statusBadge: Record<string, { variant: "default" | "pending" | "verified" | "trial"; label: string }> = {
    pending: { variant: "pending", label: "Pending" },
    accepted: { variant: "verified", label: "Accepted" },
    declined: { variant: "default", label: "Declined" },
    archived: { variant: "default", label: "Archived" },
  };
  const badge = statusBadge[connection.status] || statusBadge.pending;

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <Link
          href="/portal/connections"
          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to connections
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-base" role="alert">
          {error}
        </div>
      )}

      {/* Connection header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {typeLabel}: {shouldBlur ? blurName(otherProfile?.display_name || "Unknown") : otherProfile?.display_name || "Unknown"}
          </h1>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          <span>{isInbound ? "Received" : "Sent"} {new Date(connection.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
          <span>{isInbound ? "From" : "To"}: {shouldBlur ? "***" : otherProfile?.display_name || "Unknown"}</span>
        </div>

        {connection.message && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Note:</p>
            <p className="text-base text-gray-700">
              {shouldBlur ? blurText(connection.message) : connection.message}
            </p>
          </div>
        )}

        {/* Action buttons */}
        {isInbound && hasFullAccess && connection.status === "pending" && (
          <div className="mt-6 flex gap-3">
            <Button onClick={() => handleStatusUpdate("accepted")} loading={responding}>
              Accept
            </Button>
            <Button variant="secondary" onClick={() => handleStatusUpdate("declined")} loading={responding}>
              Decline
            </Button>
          </div>
        )}

        {/* Next steps for accepted connections */}
        {connection.status === "accepted" && otherProfile && (
          <div className="mt-6 bg-primary-50 rounded-lg p-5">
            <h3 className="text-base font-semibold text-primary-900 mb-3">
              Next Steps
            </h3>
            <div className="flex flex-wrap gap-3">
              {/* Primary CTA: Propose a time */}
              {otherProfile.email && (
                <a
                  href={`mailto:${otherProfile.email}?subject=${encodeURIComponent(`Schedule a meeting — ${otherProfile.display_name}`)}&body=${encodeURIComponent(`Hi ${otherProfile.display_name.split(" ")[0]},\n\nI'd like to schedule a time to connect. Would any of these times work for you?\n\n- \n- \n- \n\nLooking forward to hearing from you.\n\nBest regards`)}`}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Propose a Time
                </a>
              )}
              {otherProfile.phone && (
                <a
                  href={`tel:${otherProfile.phone}`}
                  className="inline-flex items-center gap-2 bg-white text-primary-700 font-medium px-4 py-2.5 rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </a>
              )}
              {otherProfile.email && (
                <a
                  href={`mailto:${otherProfile.email}`}
                  className="inline-flex items-center gap-2 bg-white text-primary-700 font-medium px-4 py-2.5 rounded-lg border border-primary-200 hover:bg-primary-100 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusUpdate("archived")}
                loading={responding}
              >
                Archive
              </Button>
            </div>
            {!otherProfile.phone && !otherProfile.email && (
              <p className="text-sm text-primary-600 mt-2">
                No contact information provided yet. Check back later or view their full profile.
              </p>
            )}
          </div>
        )}

        {shouldBlur && (
          <div className="mt-6">
            <UpgradePrompt context="view full profile details and respond" />
          </div>
        )}
      </div>

      {/* Other party's profile (inline) */}
      {otherProfile && !shouldBlur && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isInbound ? "Their" : "Recipient"} Profile
          </h2>

          <ProfileEmbed profile={otherProfile} showContact={connection.status === "accepted"} />
        </div>
      )}
    </div>
  );
}

function ProfileEmbed({ profile, showContact }: { profile: Profile; showContact: boolean }) {
  const locationStr = [profile.city, profile.state].filter(Boolean).join(", ");
  const fullLocationStr = [profile.address, profile.city, profile.state].filter(Boolean).join(", ");
  const meta = profile.metadata as OrganizationMetadata & CaregiverMetadata & FamilyMetadata;

  const rateStr =
    meta?.hourly_rate_min && meta?.hourly_rate_max
      ? `$${meta.hourly_rate_min}-${meta.hourly_rate_max}/hr`
      : null;
  const priceRange = meta?.price_range || rateStr;

  // Profile page link — providers go to /provider/slug, families go to /profile/id
  const profileHref =
    (profile.type === "organization" || profile.type === "caregiver") && profile.slug
      ? `/provider/${profile.slug}`
      : `/profile/${profile.id}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xl font-bold shrink-0">
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{profile.display_name}</h3>
          <p className="text-sm text-gray-500">
            {profile.type === "organization" ? "Organization" : profile.type === "caregiver" ? "Caregiver" : "Family"}
            {locationStr && ` \u00B7 ${locationStr}`}
          </p>
        </div>
      </div>

      {profile.description && (
        <p className="text-base text-gray-600">{profile.description}</p>
      )}

      {profile.care_types.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.care_types.map((type) => (
            <span key={type} className="bg-primary-50 text-primary-700 text-sm px-3 py-1 rounded-full">
              {type}
            </span>
          ))}
        </div>
      )}

      {/* Family-specific info */}
      {profile.type === "family" && (
        <div className="grid grid-cols-2 gap-4">
          {meta?.timeline && (
            <div>
              <dt className="text-sm text-gray-500">Timeline</dt>
              <dd className="text-gray-900 font-medium">
                {meta.timeline === "immediate" ? "Immediate" :
                 meta.timeline === "within_1_month" ? "Within 1 month" :
                 meta.timeline === "within_3_months" ? "Within 3 months" :
                 meta.timeline === "exploring" ? "Just exploring" : meta.timeline}
              </dd>
            </div>
          )}
          {meta?.relationship_to_recipient && (
            <div>
              <dt className="text-sm text-gray-500">Relationship</dt>
              <dd className="text-gray-900 font-medium">{meta.relationship_to_recipient}</dd>
            </div>
          )}
          {meta?.budget_min != null && meta?.budget_max != null && (
            <div>
              <dt className="text-sm text-gray-500">Budget Range</dt>
              <dd className="text-gray-900 font-medium">
                ${meta.budget_min.toLocaleString()} &ndash; ${meta.budget_max.toLocaleString()}/mo
              </dd>
            </div>
          )}
          {meta?.care_needs && meta.care_needs.length > 0 && (
            <div className="col-span-2">
              <dt className="text-sm text-gray-500 mb-1">Care Needs</dt>
              <dd className="flex flex-wrap gap-2">
                {meta.care_needs.map((need) => (
                  <span key={need} className="bg-secondary-50 text-secondary-700 text-xs px-2.5 py-1 rounded-full">
                    {need}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>
      )}

      {/* Caregiver-specific info */}
      {profile.type === "caregiver" && (
        <div className="grid grid-cols-2 gap-4">
          {meta?.years_experience && (
            <div>
              <dt className="text-sm text-gray-500">Experience</dt>
              <dd className="text-gray-900 font-medium">{meta.years_experience} years</dd>
            </div>
          )}
          {rateStr && (
            <div>
              <dt className="text-sm text-gray-500">Rate</dt>
              <dd className="text-gray-900 font-medium">{rateStr}</dd>
            </div>
          )}
          {meta?.availability && (
            <div>
              <dt className="text-sm text-gray-500">Availability</dt>
              <dd className="text-gray-900 font-medium">{meta.availability}</dd>
            </div>
          )}
          {meta?.languages && meta.languages.length > 0 && (
            <div>
              <dt className="text-sm text-gray-500">Languages</dt>
              <dd className="text-gray-900 font-medium">{meta.languages.join(", ")}</dd>
            </div>
          )}
          {meta?.certifications && meta.certifications.length > 0 && (
            <div className="col-span-2">
              <dt className="text-sm text-gray-500 mb-1">Certifications</dt>
              <dd className="flex flex-wrap gap-2">
                {meta.certifications.map((cert) => (
                  <span key={cert} className="bg-secondary-50 text-secondary-700 text-xs px-2.5 py-1 rounded-full">
                    {cert}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>
      )}

      {/* Organization-specific info */}
      {profile.type === "organization" && (
        <div className="grid grid-cols-2 gap-4">
          {meta?.year_founded && (
            <div>
              <dt className="text-sm text-gray-500">Year Founded</dt>
              <dd className="text-gray-900 font-medium">{meta.year_founded}</dd>
            </div>
          )}
          {meta?.bed_count && (
            <div>
              <dt className="text-sm text-gray-500">Capacity</dt>
              <dd className="text-gray-900 font-medium">{meta.bed_count} beds</dd>
            </div>
          )}
          {meta?.staff_count && (
            <div>
              <dt className="text-sm text-gray-500">Staff</dt>
              <dd className="text-gray-900 font-medium">{meta.staff_count} members</dd>
            </div>
          )}
          {priceRange && (
            <div>
              <dt className="text-sm text-gray-500">Pricing</dt>
              <dd className="text-gray-900 font-medium">{priceRange}</dd>
            </div>
          )}
          {meta?.accepted_payments && meta.accepted_payments.length > 0 && (
            <div className="col-span-2">
              <dt className="text-sm text-gray-500 mb-1">Accepted Payments</dt>
              <dd className="text-gray-900 font-medium">{meta.accepted_payments.join(", ")}</dd>
            </div>
          )}
          {meta?.amenities && meta.amenities.length > 0 && (
            <div className="col-span-2">
              <dt className="text-sm text-gray-500 mb-1">Amenities &amp; Services</dt>
              <dd className="flex flex-wrap gap-2">
                {meta.amenities.map((amenity) => (
                  <span key={amenity} className="bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full">
                    {amenity}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </div>
      )}

      {/* Expanded location — shown when connection is accepted */}
      {showContact && fullLocationStr && fullLocationStr !== locationStr && (
        <div>
          <p className="text-sm text-gray-500">Full Address</p>
          <p className="text-gray-900">{fullLocationStr}{profile.zip ? ` ${profile.zip}` : ""}</p>
        </div>
      )}

      {/* Contact info — only shown when connection is accepted */}
      {showContact && (
        <div className="bg-primary-50 rounded-lg p-4 mt-4">
          <p className="text-sm font-medium text-primary-800 mb-2">Contact Information</p>
          {profile.phone && (
            <p className="text-base text-primary-700">
              Phone: <a href={`tel:${profile.phone}`} className="underline">{profile.phone}</a>
            </p>
          )}
          {profile.email && (
            <p className="text-base text-primary-700">
              Email: <a href={`mailto:${profile.email}`} className="underline">{profile.email}</a>
            </p>
          )}
          {profile.website && (
            <p className="text-base text-primary-700">
              Website: <a href={profile.website} target="_blank" rel="noopener noreferrer" className="underline">{profile.website}</a>
            </p>
          )}
          {!profile.phone && !profile.email && !profile.website && (
            <p className="text-sm text-primary-600">No contact information provided yet.</p>
          )}
        </div>
      )}

      {/* Link to full profile page */}
      <Link
        href={profileHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-600 hover:underline text-sm font-medium inline-flex items-center gap-1"
      >
        View full profile
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Link>
    </div>
  );
}

function blurName(name: string): string {
  if (!name) return "***";
  const parts = name.split(" ");
  return parts.map((p) => p.charAt(0) + "***").join(" ");
}

function blurText(text: string): string {
  if (!text) return "";
  if (text.length <= 20) return "*".repeat(text.length);
  return text.substring(0, 20) + "...";
}
