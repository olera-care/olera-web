"use client";

import { MedJobsEntityListPage } from "@/components/admin/medjobs/MedJobsEntityListPage";

/**
 * MedJobs · Replies — full operational repository for the Replies
 * queue. Active replies + closed history. The In Basket version of
 * the Replies tab smart-hides when empty; this page always shows
 * everything.
 */
export default function MedJobsRepliesPage() {
  return (
    <MedJobsEntityListPage
      tab="replies"
      title="MedJobs · Replies"
      subtitle="Email replies, callbacks, and voicemails — active queue plus history. Click any row to open the drawer."
    />
  );
}
