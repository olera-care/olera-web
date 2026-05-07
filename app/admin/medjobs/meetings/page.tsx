"use client";

import { MedJobsEntityListPage } from "@/components/admin/medjobs/MedJobsEntityListPage";

export default function MedJobsMeetingsPage() {
  return (
    <MedJobsEntityListPage
      tab="meetings"
      title="MedJobs · Meetings"
      subtitle="Stakeholders coordinating a time and meetings on the calendar — active queue plus history."
    />
  );
}
