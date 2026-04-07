import Image from "next/image";
import type { Profile, ProfileCategory, VerificationState } from "@/lib/types";
import Badge from "@/components/ui/Badge";
import DashboardSectionCard from "./DashboardSectionCard";

// Inline pure helpers to avoid importing provider-utils (which has server deps)
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const categoryLabels: Record<ProfileCategory, string> = {
  home_care_agency: "Home Care",
  home_health_agency: "Home Health",
  hospice_agency: "Hospice",
  independent_living: "Independent Living",
  assisted_living: "Assisted Living",
  memory_care: "Memory Care",
  nursing_home: "Nursing Home",
  inpatient_hospice: "Inpatient Hospice",
  rehab_facility: "Rehabilitation",
  adult_day_care: "Adult Day Care",
  wellness_center: "Wellness Center",
  private_caregiver: "Private Caregiver",
};

function formatCategory(category: ProfileCategory | null): string | null {
  if (!category) return null;
  return categoryLabels[category] || null;
}

interface ProfileOverviewCardProps {
  profile: Profile;
  completionPercent: number;
  onEdit?: () => void;
  onVerify?: () => void;
}

export default function ProfileOverviewCard({
  profile,
  completionPercent,
  onEdit,
  onVerify,
}: ProfileOverviewCardProps) {
  const location = [profile.address, profile.city, profile.state]
    .filter(Boolean)
    .join(", ");
  const initials = getInitials(profile.display_name);
  const verificationState = profile.verification_state;
  const isVerified = verificationState === "verified";
  const isPending = verificationState === "pending";
  const isUnverified = verificationState === "unverified" || !verificationState;

  return (
    <DashboardSectionCard
      title=""
      completionPercent={completionPercent}
      id="overview"
    >
      <div>
        {/* Provider identity */}
        <div className="mb-5">
          {/* Mobile: stacked layout */}
          <div className="sm:hidden">
            {/* Top row: Avatar + Controls */}
            <div className="flex items-start justify-between gap-4 mb-3">
              {profile.image_url ? (
                <Image
                  src={profile.image_url}
                  alt={profile.display_name}
                  width={72}
                  height={72}
                  sizes="72px"
                  className="w-[72px] h-[72px] rounded-xl object-cover shrink-0 ring-2 ring-primary-100 ring-offset-2"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/10 border border-primary-100/60">
                  <span className="text-lg font-display font-bold text-primary-700">
                    {initials}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onEdit}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-900 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200 min-h-[44px]"
                  aria-label="Edit profile overview"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  completionPercent >= 100
                    ? "bg-success-50 text-success-700"
                    : "bg-primary-50 text-primary-700"
                }`}>
                  {completionPercent}%
                </span>
              </div>
            </div>
            {/* Bottom: Provider info - full width */}
            <div>
              {profile.category && (
                <p className="text-xs font-semibold tracking-widest text-primary-600 uppercase mb-1">
                  {formatCategory(profile.category)}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 font-display">
                  {profile.display_name}
                </h2>
                {isVerified && <Badge variant="verified">Verified</Badge>}
              </div>
              {location && (
                <p className="text-[15px] text-gray-500 mt-1">{location}</p>
              )}
            </div>
          </div>

          {/* Desktop: horizontal layout */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Avatar / Logo */}
            {profile.image_url ? (
              <Image
                src={profile.image_url}
                alt={profile.display_name}
                width={80}
                height={80}
                sizes="80px"
                className="w-20 h-20 rounded-xl object-cover shrink-0 ring-2 ring-primary-100 ring-offset-2"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/10 border border-primary-100/60">
                <span className="text-xl font-display font-bold text-primary-700">
                  {initials}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              {profile.category && (
                <p className="text-xs font-semibold tracking-widest text-primary-600 uppercase mb-1">
                  {formatCategory(profile.category)}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 font-display truncate">
                  {profile.display_name}
                </h2>
                {isVerified && <Badge variant="verified">Verified</Badge>}
              </div>
              {location && (
                <p className="text-[15px] text-gray-500 mt-0.5">{location}</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onEdit}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-900 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all duration-200"
                aria-label="Edit profile overview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                completionPercent >= 100
                  ? "bg-success-50 text-success-700"
                  : "bg-primary-50 text-primary-700"
              }`}>
                {completionPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Verification Status Section - only show for unverified/pending */}
        {!isVerified && (
          <VerificationSection
            state={verificationState}
            onVerify={onVerify}
          />
        )}

        {/* Contact Information */}
        <div className="border-t border-gray-100 pt-5 mb-5">
          <h4 className="text-[15px] font-medium text-gray-700 mb-3">
            Contact Information
          </h4>
          <div className="space-y-4">
            <ContactRow
              icon="phone"
              label="Phone"
              value={profile.phone}
            />
            <ContactRow
              icon="email"
              label="Email"
              value={profile.email}
            />
            <ContactRow
              icon="website"
              label="Website"
              value={profile.website}
            />
          </div>
        </div>

      </div>
    </DashboardSectionCard>
  );
}

function ContactRow({
  icon,
  label,
  value,
}: {
  icon: "phone" | "email" | "website";
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-vanilla-50 border border-warm-100/40 flex items-center justify-center shrink-0">
        {icon === "phone" && (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
        )}
        {icon === "email" && (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
        )}
        {icon === "website" && (
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
            />
          </svg>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-[15px] truncate ${value ? "text-gray-700" : "text-gray-400"}`}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}

/**
 * Elegant verification section for unverified/pending providers.
 * Modern design - subtle, informative, not alarming.
 */
function VerificationSection({
  state,
  onVerify,
}: {
  state: VerificationState | undefined;
  onVerify?: () => void;
}) {
  const isPending = state === "pending";

  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50/80 to-white overflow-hidden">
      <div className="px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3.5">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isPending
              ? "bg-blue-50 border border-blue-100"
              : "bg-gray-100 border border-gray-200"
          }`}>
            {isPending ? (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-[15px] font-semibold text-gray-900">
                {isPending ? "Verification in Progress" : "Verification"}
              </h4>
              {isPending && (
                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full">
                  Under Review
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              {isPending
                ? "We're reviewing your submission. This usually takes 1-2 business days."
                : "Your contact info is hidden from families. Verified providers get 2x more inquiries."
              }
            </p>

            {/* CTA */}
            {!isPending && onVerify && (
              <button
                type="button"
                onClick={onVerify}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors group"
              >
                <span>Complete verification</span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {isPending && onVerify && (
              <button
                type="button"
                onClick={onVerify}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              >
                Update submission
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
