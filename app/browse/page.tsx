import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import BrowseFilters from "@/components/browse/BrowseFilters";
import ProfileCard, { profileToCard } from "@/components/shared/ProfileCard";

const CARE_TYPE_OPTIONS = [
  "Assisted Living",
  "Memory Care",
  "Independent Living",
  "Skilled Nursing",
  "Home Care",
  "Home Health",
  "Hospice",
  "Respite Care",
  "Adult Day Care",
  "Rehabilitation",
];

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    state?: string;
    location?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const searchQuery = params.q || params.location || "";
  const careTypeFilter = params.type || "";
  const stateFilter = params.state || "";

  let profiles: Profile[] = [];
  let fetchError = false;

  try {
    const supabase = await createClient();
    let query = supabase
      .from("profiles")
      .select("*")
      .neq("type", "family")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(50);

    // Text search on display_name or city
    if (searchQuery) {
      query = query.or(
        `display_name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,zip.eq.${searchQuery}`
      );
    }

    // State filter
    if (stateFilter) {
      query = query.ilike("state", stateFilter);
    }

    // Care type filter
    if (careTypeFilter) {
      // Map URL slug back to display name
      const careTypeName = CARE_TYPE_OPTIONS.find(
        (ct) => ct.toLowerCase().replace(/\s+/g, "-") === careTypeFilter
      );
      if (careTypeName) {
        query = query.contains("care_types", [careTypeName]);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error("Browse fetch error:", error.message);
      fetchError = true;
    } else {
      profiles = (data as Profile[]) || [];
    }
  } catch {
    fetchError = true;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Browse Care Providers
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Find and compare trusted senior care providers in your area.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <BrowseFilters
          careTypes={CARE_TYPE_OPTIONS}
          currentQuery={searchQuery}
          currentType={careTypeFilter}
          currentState={stateFilter}
        />
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {fetchError ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">
              Unable to load providers. Please try again later.
            </p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No providers found
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {searchQuery || careTypeFilter || stateFilter
                ? "Try adjusting your filters or search term."
                : "No providers have been listed yet."}
            </p>
            {(searchQuery || careTypeFilter || stateFilter) && (
              <Link
                href="/browse"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="text-base text-gray-500 mb-6">
              {profiles.length} provider{profiles.length !== 1 ? "s" : ""} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} card={profileToCard(profile)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
