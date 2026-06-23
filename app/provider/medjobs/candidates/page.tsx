import type { Metadata } from "next";
import HireCaregiversBoard from "@/components/medjobs/HireCaregiversBoard";

export const metadata: Metadata = {
  title: "Hire Caregivers | Olera",
};

/**
 * The signed-in provider's "Hire Caregivers" board — the map-based mirror of the
 * student Find Jobs board: catchment students on a map + "Schedule interview."
 * This is the canonical signed-in provider surface. The post-a-job (Gen-2)
 * machinery has been stripped from the board; the marketplace-v2 flag still
 * hides post-a-job + inbox elsewhere.
 */
export default function ProviderHireCaregiversPage() {
  return (
    <main className="min-h-screen bg-white">
      <HireCaregiversBoard />
    </main>
  );
}
