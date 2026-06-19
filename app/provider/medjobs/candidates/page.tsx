import type { Metadata } from "next";
import HireCaregiversBoard from "@/components/medjobs/HireCaregiversBoard";

export const metadata: Metadata = {
  title: "Hire Caregivers | Olera",
};

/**
 * The signed-in provider's "Hire caregivers" board — candidate tiles + a
 * campus map, filtered by university and availability. Gated by the provider
 * layout (HUB_ROUTES includes /provider/medjobs). The public marketing +
 * preview surface is /medjobs/candidates.
 */
export default function ProviderHireCaregiversPage() {
  return (
    <main className="min-h-screen bg-white">
      <HireCaregiversBoard />
    </main>
  );
}
