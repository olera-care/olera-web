"use client";

import SopReader, { type SopJump } from "@/components/admin/medjobs/SopReader";
import RoleOrientation from "@/components/admin/medjobs/RoleOrientation";

/**
 * SOP · Admin — the Admin Team's view of the operating system.
 *
 * Built from docs/medjobs/roles-src/ADMIN.md, which is derived from the master
 * matrix. The PDF carries the same section navigation internally as real
 * anchor links; these jump bar addresses them by name, so a rebuild that repaginates the
 * document cannot break it.
 */

const JUMPS: SopJump[] = [
  { label: "Provider outreach", dest: "pr1", title: "PR1 and PR-OUT" },
  { label: "University outreach", dest: "st1", title: "ST1 and ST-OUT" },
  { label: "Booking and handoff", dest: "booking", title: "Booking, and the handoff to the Sales Lead" },
  { label: "Daily queues", dest: "queues", title: "Daily queues, logging and follow-up" },
  { label: "Exceptions", dest: "exceptions", title: "Exceptions and escalation" },
  { label: "Gaps", dest: "gaps", title: "Gaps and decisions needed", divide: true },
  { label: "Traceability", dest: "trace", title: "Every section against its source in the master" },
];

export default function MedJobsSopAdminPage() {
  return (
    <SopReader
      doc="admin"
      title="SOP · Admin"
      jumps={JUMPS}
      openAt={JUMPS[0]}
      above={(jump) => <RoleOrientation role="admin" onJump={jump} />}
    />
  );
}
