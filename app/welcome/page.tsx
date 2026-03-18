import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import WelcomeClient from "@/components/welcome/WelcomeClient";

export const metadata: Metadata = {
  title: "Welcome | Olera",
  description: "Tell us about your care needs so we can help you find the right providers.",
};

interface WelcomePageProps {
  searchParams: Promise<{ next?: string }>;
}

interface MatchProvider {
  provider_id: string;
  provider_name: string;
  provider_logo: string | null;
  provider_images: string | null;
  provider_category: string;
  city: string | null;
  state: string | null;
  google_rating: number | null;
}

/**
 * Fetch top-rated providers for the welcome page.
 * Tries user's city first, falls back to national top-rated.
 */
async function fetchProviders(userCity: string | null): Promise<MatchProvider[]> {
  try {
    const supabase = await createClient();

    // Base query: top-rated providers with images, ordered deterministically
    const baseQuery = () => supabase
      .from("olera-providers")
      .select("provider_id, provider_name, provider_logo, provider_images, provider_category, city, state, google_rating")
      .eq("deleted", false)
      .not("google_rating", "is", null)
      .gte("google_rating", 4.0)
      .not("provider_images", "is", null)
      .order("google_rating", { ascending: false })
      .order("provider_name", { ascending: true }) // Secondary sort for deterministic results
      .limit(6);

    // Try city-specific first if we have a city
    if (userCity) {
      const { data: cityProviders, error: cityError } = await baseQuery()
        .eq("city", userCity);

      if (!cityError && cityProviders && cityProviders.length > 0) {
        return cityProviders as MatchProvider[];
      }
    }

    // Fallback to national top-rated
    const { data: nationalProviders, error: nationalError } = await baseQuery();

    if (!nationalError && nationalProviders) {
      return nationalProviders as MatchProvider[];
    }

    return [];
  } catch (err) {
    console.error("[welcome] Server-side provider fetch failed:", err);
    return [];
  }
}

/**
 * Get user's city from their profile (if authenticated)
 */
async function getUserCity(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Get user's family profile city
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("city")
      .eq("user_id", user.id)
      .eq("type", "family")
      .single();

    return profile?.city || null;
  } catch {
    return null;
  }
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  const params = await searchParams;
  const destination = params.next || "/portal/inbox";

  // Fetch user city and providers in parallel for speed
  const [userCity, providers] = await Promise.all([
    getUserCity(),
    // Start with national — will refine with city below
    fetchProviders(null),
  ]);

  // If we got a city, try to get city-specific providers
  // (This is a small optimization — if city fetch fails, we already have national)
  let finalProviders = providers;
  if (userCity && providers.length > 0) {
    const cityProviders = await fetchProviders(userCity);
    if (cityProviders.length > 0) {
      finalProviders = cityProviders;
    }
  }

  return (
    <WelcomeClient
      destination={destination}
      initialProviders={finalProviders}
      initialCity={userCity}
    />
  );
}
