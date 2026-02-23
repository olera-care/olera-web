import Link from "next/link";
import type { Profile, ProfileCategory } from "@/lib/types";
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
}

export default function ProfileOverviewCard({
  profile,
  completionPercent,
}: ProfileOverviewCardProps) {
  const location = [profile.address, profile.city, profile.state]
    .filter(Boolean)
    .join(", ");
  const initials = getInitials(profile.display_name);
  const isVerified = profile.verification_state === "verified";

  return (
    <DashboardSectionCard
      title=""
      completionPercent={completionPercent}
      id="overview"
    >
      {/* Custom header — replaces DashboardSectionCard's default title */}
      <div className="-mt-5">
        {/* Provider identity */}
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar / Logo */}
          {profile.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.image_url}
              alt={profile.display_name}
              className="w-16 h-16 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary-600">
                {initials}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 truncate">
                {profile.display_name}
              </h2>
              {isVerified && <Badge variant="verified">Verified</Badge>}
            </div>
            {location && (
              <p className="text-sm text-gray-500 mt-0.5">{location}</p>
            )}
          </div>

          {/* See public view */}
          {profile.slug && (
            <Link
              href={`/provider/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors shrink-0 border border-gray-200 rounded-lg px-3 py-1.5"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              See public view
            </Link>
          )}
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-100 pt-5 mb-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Contact Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

        {/* Care categories */}
        <div className="border-t border-gray-100 pt-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Care categories
          </h4>
          {profile.care_types && profile.care_types.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.category && (
                <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 border border-primary-100">
                  {formatCategory(profile.category)}
                </span>
              )}
              {profile.care_types.map((ct) => (
                <span
                  key={ct}
                  className="px-3 py-1.5 rounded-full text-sm text-gray-600 bg-gray-50 border border-gray-200"
                >
                  {ct}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No care categories added yet.
            </p>
          )}
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
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
        {icon === "phone" && (
          <svg
            className="w-4 h-4 text-gray-500"
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
            className="w-4 h-4 text-gray-500"
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
            className="w-4 h-4 text-gray-500"
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
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm ${value ? "text-gray-700" : "text-gray-400"}`}>
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
}
