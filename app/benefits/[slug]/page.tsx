import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getStateById, allStates } from "@/data/waiver-library";
import { pipelineDrafts } from "@/data/pipeline-drafts";
import { StatePageV2 } from "@/components/waiver-library/StatePageV2";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Resolve a slug to either a state or a region entity.
 *
 * Lookup order:
 * 1. Direct state id match (e.g., "michigan" → michigan state data)
 * 2. Region slug in pipeline-drafts (e.g., "miami-dade-county-fl")
 */
function resolveSlug(slug: string) {
  // Check if slug matches a state id (e.g., "michigan", "texas")
  const state = getStateById(slug);
  if (state && state.programs.length > 0) {
    const drafts = pipelineDrafts[state.abbreviation];
    if (drafts?.stateOverview) {
      return { type: "state" as const, state, overview: drafts.stateOverview };
    }
    // State exists but no v2 overview — redirect to existing state page
    return { type: "state-redirect" as const, stateId: slug };
  }

  // Check if slug matches a region in pipeline-drafts
  for (const [key, drafts] of Object.entries(pipelineDrafts)) {
    if (drafts.isRegion && drafts.slug === slug && drafts.stateOverview) {
      // Build a synthetic state-like object for the region
      return {
        type: "region" as const,
        regionName: drafts.regionName || slug,
        parentState: drafts.parentState,
        overview: drafts.stateOverview,
        programs: drafts.programs,
        slug: drafts.slug,
        key,
      };
    }
  }

  return null;
}

export async function generateStaticParams() {
  const slugs: { slug: string }[] = [];

  // Add states that have v2 overviews
  for (const state of allStates) {
    const drafts = pipelineDrafts[state.abbreviation];
    if (drafts?.stateOverview) {
      slugs.push({ slug: state.id });
    }
  }

  // Add regions
  for (const [, drafts] of Object.entries(pipelineDrafts)) {
    if (drafts.isRegion && drafts.slug && drafts.stateOverview) {
      slugs.push({ slug: drafts.slug });
    }
  }

  return slugs;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveSlug(slug);

  if (!resolved || resolved.type === "state-redirect") return {};

  const name = resolved.type === "state"
    ? resolved.state.name
    : resolved.regionName;

  const programCount = resolved.type === "state"
    ? resolved.state.programs.length
    : resolved.programs.length;

  const title = `Senior Benefits in ${name} | Olera`;
  const description = `${programCount} senior benefit programs in ${name}. Find help paying for care, staying at home, food assistance, and more.`;

  return {
    title,
    description,
    alternates: { canonical: `/benefits/${slug}` },
    openGraph: { title, description, url: `/benefits/${slug}`, siteName: "Olera", type: "website" },
  };
}

export default async function BenefitsSlugPage({ params }: Props) {
  const { slug } = await params;
  const resolved = resolveSlug(slug);

  if (!resolved) notFound();

  if (resolved.type === "state-redirect") {
    redirect(`/waiver-library/${resolved.stateId}`);
  }

  if (resolved.type === "state") {
    return <StatePageV2 state={resolved.state} overview={resolved.overview} />;
  }

  // Region: build a state-like object from pipeline data
  const regionAsState = {
    id: resolved.slug,
    name: resolved.regionName,
    abbreviation: resolved.parentState || resolved.slug.toUpperCase().slice(0, 2),
    description: "",
    programs: resolved.programs.map((draft) => ({
      id: draft.id,
      name: draft.name,
      shortName: draft.shortName,
      tagline: draft.tagline,
      description: draft.intro?.split(".")[0] || "",
      savingsRange: draft.savingsRange || "",
      savingsSource: draft.savingsSource || "",
      savingsVerified: draft.savingsVerified || false,
      eligibilityHighlights: draft.structuredEligibility?.summary || [],
      applicationSteps: draft.applicationGuide?.steps || [],
      forms: [],
      programType: draft.programType as "benefit" | "resource" | "navigator" | "employment",
      intro: draft.intro,
      faqs: draft.faqs,
      phone: draft.phone,
      sourceUrl: draft.sourceUrl,
      contentStatus: draft.contentStatus,
    })),
  };

  return (
    <StatePageV2
      state={regionAsState as any}
      overview={resolved.overview}
    />
  );
}
