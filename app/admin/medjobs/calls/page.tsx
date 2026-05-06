"use client";

import { MedJobsEntityListPage } from "@/components/admin/medjobs/MedJobsEntityListPage";

export default function MedJobsCallsPage() {
  return (
    <MedJobsEntityListPage
      tab="calls"
      title="MedJobs · Calls"
      subtitle="Phone calls due today and recently logged — active queue plus history."
    />
  );
}
