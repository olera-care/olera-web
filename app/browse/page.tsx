import type { Metadata } from "next";
import BrowseClient from "@/components/browse/BrowseClient";

// SEO metadata for each care type
const careTypeSEO: Record<string, { title: string; description: string }> = {
  "": {
    title: "Find Senior Care Services Near You | Olera",
    description:
      "Browse trusted senior care providers in your area. Compare home care, assisted living, memory care, nursing homes, and more. Read reviews and find the perfect care solution.",
  },
  "home-care": {
    title: "Home Care Services Near You | Olera",
    description:
      "Find compassionate home care providers offering personal care, companionship, meal preparation, and daily living assistance. Compare ratings and prices.",
  },
  "home-health": {
    title: "Home Health Care Services | Olera",
    description:
      "Discover skilled home health services including nursing care, physical therapy, wound care, and medical assistance. Licensed healthcare professionals near you.",
  },
  "assisted-living": {
    title: "Assisted Living Communities Near You | Olera",
    description:
      "Explore assisted living facilities offering 24/7 care, social activities, dining services, and personalized support. Find the perfect community for your loved one.",
  },
  "memory-care": {
    title: "Memory Care Facilities for Alzheimer's & Dementia | Olera",
    description:
      "Find specialized memory care communities for Alzheimer's and dementia. Secure environments with therapeutic programs and trained caregivers.",
  },
  "nursing-homes": {
    title: "Nursing Homes & Skilled Nursing Facilities | Olera",
    description:
      "Compare nursing homes offering 24/7 skilled nursing care, rehabilitation services, and long-term care. Find quality facilities with top ratings.",
  },
  "independent-living": {
    title: "Independent Living Communities for Seniors | Olera",
    description:
      "Discover independent living communities with active lifestyles, amenities, social events, and maintenance-free living for vibrant seniors.",
  },
};

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    state?: string;
    location?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: BrowsePageProps): Promise<Metadata> {
  const params = await searchParams;
  const seo = careTypeSEO[params.type || ""] || careTypeSEO[""];

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
    },
  };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const searchQuery = params.q || params.location || "";
  const careType = params.type || "";

  return <BrowseClient careType={careType} searchQuery={searchQuery} />;
}
