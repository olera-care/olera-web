import type { Metadata } from "next";
import FamiliesBoard from "@/components/medjobs/FamiliesBoard";
import MedjobsMarketing from "@/components/medjobs/MedjobsMarketing";

// Migrated from the retired /medjobs landing so the indexed page survives.
export const metadata: Metadata = {
  title: "Olera's Student Caregiver Program | Olera",
  description:
    "A paid caregiving program for pre-health students. Earn healthcare experience, a credential, and references for medical, PA, and nursing school. Providers: match with vetted student caregivers for recurring coverage.",
  openGraph: {
    title: "Olera's Student Caregiver Program | Olera",
    description:
      "A paid caregiving program for pre-health students. Earn healthcare experience, a credential, and references toward your health career.",
  },
};

export default function MedjobsFamiliesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Interactive board (hero, filters, Top Jobs, Explore, screener) — client island */}
      <FamiliesBoard />
      {/* Static "understand" half — server-rendered for SEO; anchor #how-it-works */}
      <MedjobsMarketing />
    </main>
  );
}
