import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStateById, allStates, type WaiverProgram, type StateData } from "@/data/waiver-library";
import { pipelineDrafts, type PipelineDraft } from "@/data/pipeline-drafts";
import { ProgramPageV3 } from "@/components/waiver-library/ProgramPageV3";
import { getRelatedArticles } from "@/lib/content";
import { getDisplayName } from "@/lib/program-name";

interface Props {
  params: Promise<{ slug: string; program: string }>;
}

/**
 * Convert a pipeline draft into a WaiverProgram shape for rendering.
 * Direct 1:1 mapping — no merge layer, pipeline is canonical.
 */
function draftToWaiverProgram(draft: PipelineDraft): WaiverProgram {
  return {
    id: draft.id,
    name: draft.name,
    shortName: draft.shortName,
    tagline: draft.tagline,
    description: draft.intro?.split(".")[0] || draft.tagline || "",
    savingsRange: draft.savingsRange || "",
    savingsSource: draft.savingsSource || "",
    savingsVerified: draft.savingsVerified || false,
    eligibilityHighlights: draft.structuredEligibility?.summary || [],
    applicationSteps: (draft.applicationGuide?.steps || []).map((s) => ({
      step: s.step,
      title: s.title,
      description: s.description,
    })),
    forms: [],
    programType: draft.programType as WaiverProgram["programType"],
    complexity: draft.complexity as WaiverProgram["complexity"],
    geographicScope: draft.geographicScope as WaiverProgram["geographicScope"],
    intro: draft.intro,
    structuredEligibility: draft.structuredEligibility as WaiverProgram["structuredEligibility"],
    applicationGuide: draft.applicationGuide as WaiverProgram["applicationGuide"],
    contentSections: draft.contentSections as WaiverProgram["contentSections"],
    faqs: draft.faqs,
    phone: draft.phone || undefined,
    sourceUrl: draft.sourceUrl || undefined,
    contentStatus: draft.contentStatus as WaiverProgram["contentStatus"],
    draftedAt: draft.draftedAt,
    documentsNeeded: draft.documentsNeeded,
    contacts: draft.contacts,
    applicationNotes: draft.applicationNotes,
    relatedPrograms: draft.relatedPrograms,
    regionalApplications: draft.regionalApplications,
    layoutIntent: draft.layoutIntent as WaiverProgram["layoutIntent"],
    icon: draft.icon,
  };
}

/**
 * Resolve a (slug, program) pair to a program + state. Reads only from
 * pipeline-drafts. Waiver-library is consulted for state name/abbreviation
 * metadata. No merge layer.
 */
function resolveProgram(slug: string, programId: string): {
  state: StateData;
  program: WaiverProgram;
} | null {
  // Try state slug first
  const stateMetadata = getStateById(slug);
  if (stateMetadata) {
    const drafts = pipelineDrafts[stateMetadata.abbreviation];
    if (drafts?.programs) {
      const draft = drafts.programs.find((d) => d.id === programId);
      if (draft) {
        const state: StateData = {
          ...stateMetadata,
          programs: (drafts.programs || []).map(draftToWaiverProgram),
        };
        return { state, program: draftToWaiverProgram(draft) };
      }
    }
  }

  // Try region slug
  for (const [, drafts] of Object.entries(pipelineDrafts)) {
    if (drafts.isRegion && drafts.slug === slug && drafts.programs) {
      const draft = drafts.programs.find((d) => d.id === programId);
      if (draft) {
        const state: StateData = {
          id: drafts.slug,
          name: drafts.regionName || slug,
          abbreviation: drafts.parentState || slug.toUpperCase().slice(0, 2),
          description: "",
          programs: (drafts.programs || []).map(draftToWaiverProgram),
        };
        return { state, program: draftToWaiverProgram(draft) };
      }
    }
  }

  return null;
}

export async function generateStaticParams() {
  const params: { slug: string; program: string }[] = [];

  for (const state of allStates) {
    const drafts = pipelineDrafts[state.abbreviation];
    if (!drafts?.programs) continue;
    for (const d of drafts.programs) {
      params.push({ slug: state.id, program: d.id });
    }
  }

  // Regions
  for (const [, drafts] of Object.entries(pipelineDrafts)) {
    if (drafts.isRegion && drafts.slug && drafts.programs) {
      for (const d of drafts.programs) {
        params.push({ slug: drafts.slug, program: d.id });
      }
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, program: programId } = await params;
  const resolved = resolveProgram(slug, programId);
  if (!resolved) return {};

  const { state, program } = resolved;
  const displayName = getDisplayName(program, state);
  const title = `${displayName} | Benefits Hub | Olera`;
  const description = `${program.tagline} Learn about eligibility, home care benefits, and how to apply for ${program.shortName} in ${state.name}.`;

  return {
    title,
    description,
    alternates: { canonical: `/benefits/${slug}/${programId}` },
    openGraph: {
      title,
      description,
      url: `/benefits/${slug}/${programId}`,
      siteName: "Olera",
      type: "website",
    },
  };
}

export default async function BenefitsProgramPage({ params }: Props) {
  const { slug, program: programId } = await params;
  const resolved = resolveProgram(slug, programId);
  if (!resolved) notFound();

  const { state, program } = resolved;

  // Related articles (best-effort, non-blocking)
  const careTypes = ["senior-care", "home-care", "medicaid"];
  const articles = await getRelatedArticles("", careTypes, 2, slug === "texas" ? "texas" : undefined)
    .then((a) => a.map((art) => ({
      slug: art.slug,
      title: art.title,
      cover_image_url: art.cover_image_url,
      reading_time_minutes: art.reading_time ? parseInt(art.reading_time) || null : null,
      section: art.section,
    })))
    .catch(() => []);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Benefits Hub", item: "https://olera.care/benefits" },
      { "@type": "ListItem", position: 2, name: state.name, item: `https://olera.care/benefits/${slug}` },
      { "@type": "ListItem", position: 3, name: getDisplayName(program, state), item: `https://olera.care/benefits/${slug}/${programId}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProgramPageV3 program={program} state={state} relatedArticles={articles} />
    </>
  );
}
