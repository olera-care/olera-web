"use client";

import DashboardPage from "@/components/provider-dashboard/DashboardPage";
import MedjobsProviderBanner from "@/components/medjobs/MedjobsProviderBanner";

export default function ProviderPage() {
  return (
    <>
      <MedjobsProviderBanner />
      <DashboardPage />
    </>
  );
}
