"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MOCK_RESOURCES,
  getFeaturedResources,
  searchResources,
} from "@/data/mock/resources";
import { Resource, RESOURCE_CATEGORY_CONFIG } from "@/types/resource";
import { CareTypeId, CARE_TYPE_CONFIG, ALL_CARE_TYPES } from "@/types/forum";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Hero Featured Card - Cinematic
function HeroCard({ resource }: { resource: Resource }) {
  return (
    <Link href={`/resources/${resource.slug}`} className="group block relative">
      <article className="relative h-[520px] rounded-[2rem] overflow-hidden">
        {/* Image with ken burns effect */}
        <div className="absolute inset-0">
          <img
            src={resource.coverImage}
            alt={resource.title}
            className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-10">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white/90 text-xs font-medium rounded-full border border-white/10">
                Featured
              </span>
              <span className="text-white/50 text-sm">
                {resource.readingTime}
              </span>
            </div>

            <h2 className="text-4xl font-bold text-white mb-3 leading-[1.15] tracking-tight">
              {resource.title}
            </h2>

            <p className="text-white/60 text-lg leading-relaxed mb-6 line-clamp-2">
              {resource.subtitle}
            </p>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <span className="text-white text-sm font-medium">
                  {resource.author.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">{resource.author.name}</p>
                <p className="text-white/40 text-xs">{resource.author.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hover arrow */}
        <div className="absolute bottom-10 right-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 border border-white/10">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </article>
    </Link>
  );
}

// Side Featured Cards
function SideCard({ resource, index }: { resource: Resource; index: number }) {
  return (
    <Link href={`/resources/${resource.slug}`} className="group block">
      <article className="flex gap-5 py-6 border-b border-gray-100 last:border-0">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-primary-600 mb-2 block">
            {RESOURCE_CATEGORY_CONFIG[resource.category].label}
          </span>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
            {resource.title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
            {resource.excerpt}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{resource.author.name}</span>
            <span>·</span>
            <span>{resource.readingTime}</span>
          </div>
        </div>
        <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src={resource.coverImage}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </article>
    </Link>
  );
}

// Grid Card - Refined
function GridCard({ resource }: { resource: Resource }) {
  return (
    <Link href={`/resources/${resource.slug}`} className="group block">
      <article className="h-full">
        {/* Image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-gray-100">
          <img
            src={resource.coverImage}
            alt={resource.title}
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          />
          {/* Category pill on image */}
          <div className="absolute top-4 left-4">
            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full shadow-sm">
              {RESOURCE_CATEGORY_CONFIG[resource.category].label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 leading-snug group-hover:text-primary-600 transition-colors">
            {resource.title}
          </h3>

          <p className="text-gray-500 leading-relaxed line-clamp-2 mb-4">
            {resource.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {resource.author.name.split(" ").map(n => n[0]).join("")}
                </span>
              </div>
              <span className="text-sm text-gray-500">{resource.author.name}</span>
            </div>
            <span className="text-xs text-gray-400">{resource.readingTime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function ResourcesPageContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCareType, setActiveCareType] = useState<CareTypeId | "all">(
    (typeParam as CareTypeId) || "all"
  );

  const featuredResources = useMemo(() => getFeaturedResources(), []);

  const filteredResources = useMemo(() => {
    let resources = MOCK_RESOURCES;

    if (activeCareType !== "all") {
      resources = resources.filter((r) => r.careTypes.includes(activeCareType));
    }

    if (searchQuery.trim()) {
      resources = searchResources(searchQuery);
      if (activeCareType !== "all") {
        resources = resources.filter((r) => r.careTypes.includes(activeCareType));
      }
    }

    return resources;
  }, [activeCareType, searchQuery]);

  const nonFeaturedResources = useMemo(() => {
    if (searchQuery || activeCareType !== "all") return filteredResources;
    return filteredResources.filter((r) => !r.featured);
  }, [filteredResources, searchQuery, activeCareType]);

  const showFeatured = !searchQuery && activeCareType === "all";

  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-5 tracking-tight">
              Resources
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Expert guides and practical advice to help you make confident decisions about senior care.
            </p>
          </div>

          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-8">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-11 pr-4 py-3.5 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400 shadow-sm"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCareType("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCareType === "all"
                  ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
              }`}
            >
              All Topics
            </button>
            {ALL_CARE_TYPES.map((careType) => (
              <button
                key={careType}
                onClick={() => setActiveCareType(careType)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCareType === careType
                    ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                {CARE_TYPE_CONFIG[careType].label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {showFeatured && featuredResources.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Main Hero */}
            <div className="lg:col-span-3">
              {featuredResources[0] && <HeroCard resource={featuredResources[0]} />}
            </div>

            {/* Side List */}
            <div className="lg:col-span-2">
              <div className="h-full flex flex-col">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Trending
                </h3>
                {featuredResources.slice(1, 4).map((resource, index) => (
                  <SideCard key={resource.id} resource={resource} index={index} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Divider */}
      {showFeatured && <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="border-t border-gray-100" /></div>}

      {/* Main Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : activeCareType === "all"
              ? "All Articles"
              : CARE_TYPE_CONFIG[activeCareType].label}
          </h2>
          <span className="text-sm text-gray-400">
            {(showFeatured ? nonFeaturedResources : filteredResources).length} articles
          </span>
        </div>

        {(showFeatured ? nonFeaturedResources : filteredResources).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
            {(showFeatured ? nonFeaturedResources : filteredResources).map((resource) => (
              <GridCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCareType("all"); }}
              className="text-primary-600 font-medium hover:text-primary-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>

      {/* Newsletter */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Get caregiving insights delivered weekly
            </h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Join 10,000+ families receiving our curated guides, expert tips, and community highlights.
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-4 bg-white/10 border border-white/10 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent placeholder:text-gray-500"
              />
              <button className="px-6 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Free forever. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="max-w-2xl mb-12">
          <div className="h-16 w-64 bg-gray-100 rounded-2xl mb-5 animate-pulse" />
          <div className="h-8 w-96 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-14 w-full max-w-md bg-gray-100 rounded-xl animate-pulse mb-8" />
        <div className="flex gap-2">
          {[1,2,3,4].map(i => <div key={i} className="h-10 w-24 bg-gray-100 rounded-full animate-pulse" />)}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-[520px] bg-gray-100 rounded-[2rem] animate-pulse" />
      </div>
    </main>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ResourcesPageContent />
    </Suspense>
  );
}
