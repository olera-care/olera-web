"use client";

import SopReader, { type SopJump } from "@/components/admin/medjobs/SopReader";
import RoleOrientation from "@/components/admin/medjobs/RoleOrientation";

/**
 * SOP · Sales — the Sales Lead's view of the operating system.
 *
 * Built from docs/medjobs/roles-src/SALES.md.
 */

const JUMPS: SopJump[] = [
  { label: "Receiving the handoff", dest: "receiving", title: "Receiving the Admin Team handoff" },
  { label: "Provider meetings", dest: "pr2", title: "PR2 provider meeting held" },
  { label: "Advisor meetings", dest: "st2", title: "ST2 advisor meeting held" },
  { label: "After the handoff", dest: "after", title: "Where the Sales Lead stays involved" },
  { label: "User Success handoff", dest: "handoff", title: "The handoff to the User Success Manager" },
  { label: "Exceptions", dest: "exceptions", title: "Exceptions and escalation" },
  { label: "Gaps", dest: "gaps", title: "Gaps and decisions needed", divide: true },
  { label: "Traceability", dest: "trace", title: "Every section against its source in the master" },
];

export default function MedJobsSopSalesPage() {
  return (
    <SopReader
      doc="sales"
      title="MedJobs Sales"
      readerLabel="Standard Operating Procedure"
      jumps={JUMPS}
      openAt={JUMPS[0]}
      above={(jump) => <RoleOrientation role="sales" onJump={jump} />}
    />
  );
}
