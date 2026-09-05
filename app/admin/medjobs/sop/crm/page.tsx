"use client";

import SopReader, { type SopJump } from "@/components/admin/medjobs/SopReader";

/**
 * SOP · CRM — the User Success Manager's view of the operating system.
 *
 * CRM is the workspace label; the operating role is User Success Manager, and
 * the document uses that term throughout. Built from
 * docs/medjobs/roles-src/CRM.md.
 */

const JUMPS: SopJump[] = [
  { label: "Provider success", page: 2, title: "PR3 client success" },
  { label: "University activation", page: 3, title: "ST3 to ST7 university activation" },
  { label: "Portal exceptions", page: 5, title: "ST8, QUAL, MA1 and MA2, where you handle exceptions" },
  { label: "Hire confirmed", page: 6, title: "MA3 hire confirmed" },
  { label: "Six shifts", page: 7, title: "MA4 six or more shifts worked, confirmed" },
  { label: "Billing", page: 8, title: "MA5 bill issued and collected" },
  { label: "List call", page: 9, title: "The monthly client list call" },
  { label: "Gaps", page: 10, title: "Gaps and decisions needed", divide: true },
  { label: "Traceability", page: 12, title: "Every section against its source in the master" },
];

export default function MedJobsSopCrmPage() {
  return (
    <SopReader
      doc="crm"
      title="SOP · CRM"
      description="User Success Manager Operations. PR3, ST3 to ST7, MA3 to MA5 and the monthly list call, plus the four Portal stages where this role handles exceptions. A filtered view of the System document, not a separate operating model."
      jumps={JUMPS}
      openAt={1}
    />
  );
}
