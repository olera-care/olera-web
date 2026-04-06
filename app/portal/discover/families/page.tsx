"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { canEngage } from "@/lib/membership";
import type { Profile, FamilyMetadata } from "@/lib/types";
import UpgradePrompt from "@/components/providers/UpgradePrompt";
import ConnectButton from "@/components/shared/ConnectButton";
import EmptyState from "@/components/ui/EmptyState";

const TIMELINE_LABELS: Record<string, string> = {
  immediate: "Immediate",
  within_1_month: "Within 1 month",
  within_3_months: "Within 3 months",
  exploring: "Just exploring",
};

export default function DiscoverFamiliesPage() {
  const { activeProfile, membership } = useAuth();
  const [families, setFamilies] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const isProvider =
    activeProfile?.type === "organization" ||
    activeProfile?.type === "caregiver";

  // Verification check - only verified providers get full access
  const isVerified = activeProfile?.verification_state === "verified";
  const verificationState = activeProfile?.verification_state;

  // Full access requires both verification AND membership access
  const hasMembershipAccess = canEngage(
    activeProfile?.type,
    membership,
    "view_inquiry_details"
  );
  const hasFullAccess = isVerified && hasMembershipAccess;

  const profileId = activeProfile?.id;

  useEffect(() => {
    if (!profileId || !isProvider || !isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const fetchFamilies = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("business_profiles")
          .select("id, display_name, city, state, type, care_types, metadata, image_url, slug")
          .eq("type", "family")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) console.error("[olera] discover families error:", error.message);
        setFamilies((data as Profile[]) || []);
      } catch (err) {
        console.error("[olera] discover families failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFamilies();
  }, [profileId, isProvider]);

  if (!isProvider) {
    return (
      <div className="px-8 py-6">
        <EmptyState
          title="Provider access required"
          description="Switch to an organization or caregiver profile to browse families."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading families...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Families Looking for Care
        </h1>
        <p className="text-lg text-gray-600 mt-1">
          Connect with families in your area who are looking for care services.
        </p>
      </div>

      {/* Verification prompt - show if not verified */}
      {!isVerified && (
        <VerificationAccessBanner verificationState={verificationState} />
      )}

      {/* Membership upgrade prompt - only show if verified but no membership access */}
      {isVerified && !hasMembershipAccess && (
        <div className="mb-8">
          <UpgradePrompt context="browse family profiles and initiate contact" />
        </div>
      )}

      {families.length === 0 ? (
        <EmptyState
          title="No families found"
          description="Families who sign up will appear here."
        />
      ) : (
        <>
          <p className="text-base text-gray-500 mb-6">
            {families.length} famil{families.length !== 1 ? "ies" : "y"} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {families.map((family) => (
              <FamilyCard
                key={family.id}
                family={family}
                hasFullAccess={hasFullAccess}
                isVerified={isVerified}
                fromProfileId={activeProfile?.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
    </div>
  );
}

function FamilyCard({
  family,
  hasFullAccess,
  isVerified,
  fromProfileId,
}: {
  family: Profile;
  hasFullAccess: boolean;
  isVerified: boolean;
  fromProfileId?: string;
}) {
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false);
  const meta = family.metadata as FamilyMetadata;
  const locationStr = [family.city, family.state].filter(Boolean).join(", ");
  const timeline = meta?.timeline
    ? TIMELINE_LABELS[meta.timeline] || meta.timeline
    : null;
  const careNeeds = meta?.care_needs || family.care_types || [];

  // Get first name only for limited access
  const firstName = getFirstName(family.display_name);

  // Determine what to show based on access level
  const showFullDetails = isVerified;

  const cardBody = (
    <>
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar - person silhouette for unverified, initial for verified */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
          showFullDetails
            ? "bg-secondary-100 text-secondary-700"
            : "bg-gray-100 text-gray-400"
        }`}>
          {showFullDetails ? (
            family.display_name.charAt(0).toUpperCase()
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {showFullDetails ? family.display_name : firstName}
          </h3>
          {locationStr && (
            <p className="text-sm text-gray-500">
              {showFullDetails ? locationStr : "Location available after verification"}
            </p>
          )}
        </div>
      </div>

      {timeline && (
        <p className="text-base text-gray-600 mb-2">
          <span className="font-medium">Timeline:</span> {timeline}
        </p>
      )}

      {careNeeds.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {careNeeds.map((need) => (
            <span
              key={need}
              className="bg-secondary-50 text-secondary-700 text-xs px-2.5 py-1 rounded-full"
            >
              {need}
            </span>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors duration-200">
        {/* Card content - not clickable since no profile page exists */}
        <div className="p-6">
          {cardBody}
        </div>

        {/* Contact button area */}
        {fromProfileId && (
          <div className="px-6 pb-6 -mt-2">
            {hasFullAccess ? (
              <ConnectButton
                fromProfileId={fromProfileId}
                toProfileId={family.id}
                toName={family.display_name}
                connectionType="inquiry"
                label="Initiate Contact"
                sentLabel="Contact Sent"
                fullWidth
              />
            ) : isVerified ? (
              // Verified but no membership - link to upgrade page
              <Link
                href="/provider/pro"
                className="block w-full py-2.5 text-sm font-medium text-center text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                Upgrade to contact
              </Link>
            ) : (
              // Not verified - show locked button that opens verify prompt
              <button
                type="button"
                onClick={() => setShowVerifyPrompt(true)}
                className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Contact {firstName}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Verification prompt modal */}
      {showVerifyPrompt && (
        <VerifyToContactModal
          familyName={firstName}
          onClose={() => setShowVerifyPrompt(false)}
        />
      )}
    </>
  );
}

function getFirstName(name: string): string {
  if (!name) return "Someone";
  // Trim and split by space, take first part
  const firstName = name.trim().split(" ")[0];
  return firstName || "Someone";
}

function VerificationAccessBanner({
  verificationState,
}: {
  verificationState?: string;
}) {
  const isPending = verificationState === "pending";

  return (
    <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          {isPending ? (
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">
            {isPending ? "Verification in Progress" : "Limited Access Mode"}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isPending
              ? "We're reviewing your verification request. Once approved, you'll see full family details and be able to initiate contact."
              : "You're seeing limited information. Verify your business to unlock full family details, locations, and the ability to initiate contact."}
          </p>
          {!isPending && (
            <Link
              href="/provider"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-amber-700 hover:text-amber-800"
            >
              Complete verification
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function VerifyToContactModal({
  familyName,
  onClose,
}: {
  familyName: string;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          {/* Content */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Verify to contact {familyName}
          </h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Complete a quick verification to unlock messaging and see full family details. Most verifications are approved within 1-2 business days.
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/provider"
              className="block w-full py-3 text-center text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
            >
              Complete Verification
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
