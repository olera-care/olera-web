import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HireCaregiversBoard from "@/components/medjobs/HireCaregiversBoard";
import { MEDJOBS_MARKETPLACE_V2_HIDDEN } from "@/lib/medjobs/flags";

export const metadata: Metadata = {
  title: "Hire Caregivers | Olera",
};

/**
 * The signed-in provider's "Hire caregivers" board (Gen 2). For the interview-
 * scheduling MVP this is consolidated into the provider home (/provider/caregivers,
 * the interview calendar + opportunity profile). When the marketplace-v2 flag is
 * on (MVP default), redirect there; flip the env var to restore this board.
 */
export default function ProviderHireCaregiversPage() {
  if (MEDJOBS_MARKETPLACE_V2_HIDDEN) redirect("/provider/caregivers");
  return (
    <main className="min-h-screen bg-white">
      <HireCaregiversBoard />
    </main>
  );
}
