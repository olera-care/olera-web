"use client";

/**
 * PartnerCategoryStatus — compact per-category prospecting status line.
 *
 * The research card/Site card persists until ALL THREE partner categories are
 * audited-complete (advising offices, student orgs, department heads). This
 * line shows which are done so the admin can see the remaining work at a glance:
 *
 *   Advising ✓ · Orgs ◻ · Dept heads ◻
 *
 * Fed by partner_research.audit[subtype].complete_at (see the campuses PATCH /
 * queue + campuses routes).
 */

const CATEGORIES: { key: "advisor" | "student_org" | "dept_head"; label: string }[] = [
  { key: "advisor", label: "Advising" },
  { key: "student_org", label: "Orgs" },
  { key: "dept_head", label: "Dept heads" },
];

export function PartnerCategoryStatus({
  audit,
  className = "",
}: {
  audit?: { advisor: boolean; student_org: boolean; dept_head: boolean };
  className?: string;
}) {
  if (!audit) return null;
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-2 text-[11px] ${className}`}>
      {CATEGORIES.map((c) => {
        const done = audit[c.key];
        return (
          <span
            key={c.key}
            className={done ? "text-emerald-700" : "text-gray-400"}
            title={done ? `${c.label} prospecting complete` : `${c.label} prospecting not yet complete`}
          >
            {c.label} {done ? "✓" : "◻"}
          </span>
        );
      })}
    </span>
  );
}
