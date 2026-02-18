"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { PROVIDERS_TABLE } from "@/lib/types/provider";
import SimilarProvidersRow from "@/components/providers/SimilarProvidersRow";
import BrowseByCareTypeSection from "@/components/home/BrowseByCareTypeSection";


interface ProviderInfo {
  name: string;
  slug: string;
  imageUrl: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
}

function ConnectedPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const connectionId = params.connectionId as string;

  // Instant display from URL search params
  const nameFromParams = searchParams.get("name") || "";
  const slugFromParams = searchParams.get("slug") || "";

  const [provider, setProvider] = useState<ProviderInfo>({
    name: nameFromParams,
    slug: slugFromParams,
    imageUrl: null,
    category: null,
    city: null,
    state: null,
  });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchProviderData() {
      if (!isSupabaseConfigured() || !connectionId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();

        // Get the connection to find to_profile_id
        const { data: connection } = await supabase
          .from("connections")
          .select("to_profile_id")
          .eq("id", connectionId)
          .single();

        if (!connection) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        // Get provider's business_profile
        const { data: profile } = await supabase
          .from("business_profiles")
          .select("display_name, slug, image_url, category, care_types, city, state, source_provider_id")
          .eq("id", connection.to_profile_id)
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        let imageUrl = profile.image_url;
        let category = profile.category || profile.care_types?.[0] || null;
        const city = profile.city;
        const state = profile.state;

        // If iOS provider, fetch image from olera-providers table
        if (!imageUrl && profile.source_provider_id) {
          const { data: iosProvider } = await supabase
            .from(PROVIDERS_TABLE)
            .select("provider_images, provider_logo, provider_category")
            .eq("provider_id", profile.source_provider_id)
            .single();

          if (iosProvider) {
            imageUrl = iosProvider.provider_logo ||
              iosProvider.provider_images?.split(" | ")?.[0] || null;
            if (!category) {
              category = iosProvider.provider_category;
            }
          }
        }

        setProvider({
          name: profile.display_name || nameFromParams,
          slug: profile.slug || slugFromParams,
          imageUrl,
          category,
          city,
          state,
        });
      } catch (err) {
        console.error("[connected] fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProviderData();
  }, [connectionId, nameFromParams, slugFromParams]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection not found</h1>
          <p className="text-gray-500 mb-6">This connection may have been removed or the link is invalid.</p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-xl text-sm font-semibold text-white transition-colors"
          >
            Browse providers
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        {/* Section 1: Success Card */}
        <section className="pt-12 pb-4">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">
              {/* Checkmark */}
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Provider image */}
              {provider.imageUrl && (
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={provider.imageUrl}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {loading && !provider.name
                  ? "Connecting..."
                  : `You've connected with ${provider.name}`}
              </h1>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Your request has been sent. Start a conversation to learn more about their services.
              </p>

              {/* Primary CTA */}
              <Link
                href="/portal/inbox"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
              >
                Start Messaging
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: Similar Providers */}
        {provider.category && (
          <SimilarProvidersRow
            category={provider.category}
            city={provider.city || undefined}
            state={provider.state || undefined}
            excludeSlug={provider.slug}
          />
        )}

        {/* Section 3: Browse by Care Type */}
        <BrowseByCareTypeSection />
      </div>
  );
}

export default function ConnectedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ConnectedPageContent />
    </Suspense>
  );
}
