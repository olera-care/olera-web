"use client";

import SopReader, { type SopJump } from "@/components/admin/medjobs/SopReader";

/**
 * SOP · System — the full MedJobs 2.0 Master Implementation Matrix.
 *
 * The canonical source of truth for the operating model. The Admin, Sales and
 * CRM pages are role views of this document, not separate operating models.
 *
 * Page numbers are positions in the built PDF. Rebuilding the matrix can move
 * them; docs/medjobs/matrix-src/README.md says how to re-derive them.
 */

const JUMPS: SopJump[] = [
  { label: "System", page: 2, title: "The whole flow on one page" },
  { label: "PR1", page: 3, title: "Target list built and pre-flight complete", divide: true },
  { label: "PR-OUT", page: 7, title: "Outbound work" },
  { label: "PR2", page: 11, title: "Provider meeting held" },
  { label: "PR3", page: 13, title: "Client success" },
  { label: "ST1", page: 15, title: "Target advisors", divide: true },
  { label: "ST-OUT", page: 18, title: "University outbound" },
  { label: "ST2", page: 22, title: "Advisor meeting held" },
  { label: "ST3–ST7", page: 23, title: "University activation" },
  { label: "ST8", page: 25, title: "Student application submitted" },
  { label: "QUAL", page: 31, title: "Portal vets the application", divide: true },
  { label: "MA1", page: 32, title: "Candidate intro" },
  { label: "MA2", page: 33, title: "Interview held" },
  { label: "MA3", page: 35, title: "Hire confirmed" },
  { label: "MA4", page: 36, title: "Six or more shifts worked, confirmed" },
  { label: "MA5", page: 37, title: "Bill issued and collected" },
  { label: "Deferred", page: 39, title: "Everything the matrix describes that does not work that way yet", divide: true },
];

export default function MedJobsSopSystemPage() {
  return (
    <SopReader
      doc="system"
      title="SOP · System"
      description="MedJobs 2.0 Master Implementation Matrix. Every stage in three layers: user journey and technology, the procedure, and the system handoff. This is the source of truth; Admin, Sales and CRM are role views of it."
      jumps={JUMPS}
      openAt={2}
    />
  );
}
