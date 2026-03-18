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

    // Get user's account first
    const { data: account } = await supabase
      .from("accounts")
      .select("id, active_profile_id")
      .eq("user_id", user.id)
      .single();

    if (!account?.active_profile_id) return null;

    // Get city from active profile
    const { data: profile } = await supabase
      .from("business_profiles")
      .select("city")
      .eq("id", account.active_profile_id)
      .single();

    return profile?.city || null;
  } catch {
    return null;
  }
}

export default async function WelcomePage({ searchParams }: WelcomePageProps) {
  let destination = "/portal/inbox";
  let userCity: string | null = null;
  let finalProviders: MatchProvider[] = [];

  try {
    const params = await searchParams;
    destination = params.next || "/portal/inbox";

    // Fetch user city and providers in parallel for speed
    // Wrap in try-catch to prevent server errors from crashing the page
    const [fetchedCity, providers] = await Promise.all([
      getUserCity().catch(() => null),
      fetchProviders(null).catch(() => []),
    ]);

    userCity = fetchedCity;
    finalProviders = providers;

    // If we got a city, try to get city-specific providers
    if (userCity && providers.length > 0) {
      const cityProviders = await fetchProviders(userCity).catch(() => []);
      if (cityProviders.length > 0) {
        finalProviders = cityProviders;
      }
    }
  } catch (err) {
    console.error("[welcome] Server component error:", err);
    // Continue with defaults - don't crash the page
  }

  return (
    <WelcomeClient
      destination={destination}
      initialProviders={finalProviders}
      initialCity={userCity}
    />
  );
}
