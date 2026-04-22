"use client";

import { Suspense } from "react";
import DashboardPage from "@/components/provider-dashboard/DashboardPage";

export default function ProviderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
        </div>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
