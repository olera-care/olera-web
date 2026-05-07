"use client";

import { MedJobsEntityListPage } from "@/components/admin/medjobs/MedJobsEntityListPage";

/**
 * MedJobs · Prospects — full operational repository for partner
 * prospects (stakeholders being researched). The In Basket version
 * of the Prospects tab uses ResearchTabContent's collapsible
 * Provider/Partner sections; this dedicated page is the running
 * archive of partner-prospect rows specifically. Provider prospects
 * (virtual catchment rows) live in the In Basket only — they aren't
 * persisted entities, so a history view doesn't apply.
 */
export default function MedJobsProspectsPage() {
  return (
    <MedJobsEntityListPage
      tab="prospects"
      title="MedJobs · Prospects"
      subtitle="Partner prospects being researched — active queue plus history. Provider prospects in catchment live in the In Basket."
    />
  );
}
