/**
 * Build the default email-template snapshots for one stakeholder.
 * Mirrors the initialization logic in PreFlightReviewModal — same templates,
 * same days. Used by the Research-tab bulk-start flow when admin doesn't
 * want to review each email individually before firing.
 *
 * Extracted from app/admin/student-outreach/page.tsx as part of the
 * v9.0 MedJobs reorg (Phase 0).
 */

import { OUTREACH_DAYS_BY_TYPE } from "./cadence";
import { getTemplate } from "./templates";
import type { EmailSnapshot } from "./sequencer";
import type { StakeholderType } from "./types";

export function buildDefaultEmailSnapshots(args: {
  stakeholder_type: StakeholderType;
  organization_name: string;
  campus_name: string;
}): EmailSnapshot[] {
  const days = OUTREACH_DAYS_BY_TYPE[args.stakeholder_type] ?? [];
  const out: EmailSnapshot[] = [];
  for (const d of days) {
    for (const step of d.steps) {
      if (step.channel !== "email" || !step.template) continue;
      const tpl = getTemplate(step.template, {
        stakeholder_type: args.stakeholder_type,
        organization_name: args.organization_name,
        campus_name: args.campus_name,
      });
      out.push({ day: d.day, template: step.template, subject: tpl.subject, body: tpl.body });
    }
  }
  return out;
}
