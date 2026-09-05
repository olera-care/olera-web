"use client";

import SopReader, { type SopJump } from "@/components/admin/medjobs/SopReader";

/**
 * SOP · Sales — the Sales Lead's view of the operating system.
 *
 * Built from docs/medjobs/roles-src/SALES.md. See the Admin page for how the
 * page numbers are derived.
 */

const JUMPS: SopJump[] = [
  { label: "Receiving the handoff", page: 1, title: "Receiving the Admin Team handoff" },
  { label: "Provider meetings", page: 2, title: "PR2 provider meeting held" },
  { label: "Advisor meetings", page: 3, title: "ST2 advisor meeting held" },
  { label: "After the handoff", page: 5, title: "Where the Sales Lead stays involved" },
  { label: "User Success handoff", page: 6, title: "The handoff to the User Success Manager" },
  { label: "Exceptions", page: 7, title: "Exceptions and escalation" },
  { label: "Gaps", page: 8, title: "Gaps and decisions needed", divide: true },
  { label: "Traceability", page: 9, title: "Every section against its source in the master" },
];

export default function MedJobsSopSalesPage() {
  return (
    <SopReader
      doc="sales"
      title="SOP · Sales"
      description="Sales Lead Operations. PR2 and ST2, what each meeting must capture, and the boundary with the User Success Manager. A filtered view of the System document, not a separate operating model."
      jumps={JUMPS}
      openAt={1}
    />
  );
}
