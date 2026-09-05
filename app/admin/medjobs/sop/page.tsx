"use client";

import SopReader, { type SopJump } from "@/components/admin/medjobs/SopReader";
import SopOrientation from "@/components/admin/medjobs/SopOrientation";

/**
 * SOP · System — the full MedJobs 2.0 Master Implementation Matrix.
 *
 * The canonical source of truth for the operating model. The Admin, Sales and
 * CRM pages are role views of this document, not separate operating models.
 *
 * Jumps address PDF named destinations, which Chromium writes for every heading
 * the contents block links to. Only the two targets with no heading of their
 * own carry a page number: the flow map, and the deferred build list.
 */

const JUMPS: SopJump[] = [
  { label: "System", page: 2, title: "The whole flow on one page" },
  { label: "PR1", dest: "pr1-target-list-built-and-pre-flight-complete", title: "Target list built and pre-flight complete", divide: true },
  { label: "PR-OUT", dest: "pr-out-outbound-work", title: "Outbound work" },
  { label: "PR2", dest: "pr2-provider-meeting-held", title: "Provider meeting held" },
  { label: "PR3", dest: "pr3-client-success", title: "Client success" },
  { label: "ST1", dest: "st1-target-advisors", title: "Target advisors", divide: true },
  { label: "ST-OUT", dest: "st-out-university-outbound", title: "University outbound" },
  { label: "ST2", dest: "st2-advisor-meeting-held", title: "Advisor meeting held" },
  { label: "ST3–ST7", dest: "st3st7-university-activation", title: "University activation" },
  { label: "ST8", dest: "st8-student-application-submitted", title: "Student application submitted" },
  { label: "QUAL", dest: "qual-portal-vets-the-application", title: "Portal vets the application", divide: true },
  { label: "MA1", dest: "ma1-candidate-intro", title: "Candidate intro" },
  { label: "MA2", dest: "ma2-interview-held", title: "Interview held" },
  { label: "MA3", dest: "ma3-hire-confirmed", title: "Hire confirmed" },
  { label: "MA4", dest: "ma4-six-or-more-shifts-worked-confirmed", title: "Six or more shifts worked, confirmed" },
  { label: "MA5", dest: "ma5-bill-issued-and-collected", title: "Bill issued and collected" },
  { label: "Deferred", page: 39, title: "Everything the matrix describes that does not work that way yet", divide: true },
];

export default function MedJobsSopSystemPage() {
  return (
    <SopReader
      doc="system"
      title="SOP · System"
      description="MedJobs 2.0 Master Implementation Matrix. Every stage in three layers: user journey and technology, the procedure, and the system handoff. This is the source of truth; Admin, Sales and CRM are role views of it."
      jumps={JUMPS}
      openAt={JUMPS[0]}
      above={(jump) => <SopOrientation onJump={jump} />}
    />
  );
}
