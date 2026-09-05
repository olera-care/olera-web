"use client";

import SopReader, { type SopJump } from "@/components/admin/medjobs/SopReader";

/**
 * SOP · Admin — the Admin Team's view of the operating system.
 *
 * Built from docs/medjobs/roles-src/ADMIN.md, which is derived from the master
 * matrix. The PDF carries the same section navigation internally as real
 * anchor links; these page numbers mirror it. Re-derive them after a rebuild:
 * docs/medjobs/roles-src/README.md says how.
 */

const JUMPS: SopJump[] = [
  { label: "Provider outreach", page: 1, title: "PR1 and PR-OUT" },
  { label: "University outreach", page: 5, title: "ST1 and ST-OUT" },
  { label: "Booking and handoff", page: 7, title: "Booking, and the handoff to the Sales Lead" },
  { label: "Daily queues", page: 8, title: "Daily queues, logging and follow-up" },
  { label: "Exceptions", page: 9, title: "Exceptions and escalation" },
  { label: "Gaps", page: 10, title: "Gaps and decisions needed", divide: true },
  { label: "Traceability", page: 11, title: "Every section against its source in the master" },
];

export default function MedJobsSopAdminPage() {
  return (
    <SopReader
      doc="admin"
      title="SOP · Admin"
      description="Admin Team Operations. PR1, PR-OUT, ST1 and ST-OUT, the booking that ends both pipelines, and the daily queues. A filtered view of the System document, not a separate operating model."
      jumps={JUMPS}
      openAt={1}
    />
  );
}
