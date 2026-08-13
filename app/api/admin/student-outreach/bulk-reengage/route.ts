/**
 * POST /api/admin/student-outreach/bulk-reengage
 *
 * Bulk re-engage multiple outreach rows from the Follow-up tab. Each row
 * gets enrolled into a re-engagement cadence (Day 0 email, Day 3 call,
 * Day 7 email) using the same enrollCustomCadence machinery.
 *
 * Body:
 *   outreach_ids: string[]     — rows to re-engage
 *   dry_run?: boolean          — true = preview only, returns counts + emails
 *   assigned_to?: string       — optional admin user_id for call task assignment
 *
 * Response:
 *   dry_run=true:
 *     { preview: true, valid: number, invalid: number, prospects: [...], emails: {...} }
 *   dry_run=false:
 *     { processed: number, succeeded: number, skipped: number, results: [...] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { enrollCustomCadence, type CustomEmailStep } from "@/lib/medjobs/smartlead-bridge";
import {
  reengagementIntroEmail,
  reengagementFinalEmail,
  reengagementCallScript,
  substituteVars,
  type TemplateContext,
} from "@/lib/student-outreach/templates";
import { nextBusinessDayET } from "@/lib/student-outreach/business-day";
import type { ResearchData, StakeholderType } from "@/lib/student-outreach/types";

type DB = ReturnType<typeof getServiceClient>;

// Minimal type for rows returned from our selective query
interface OutreachRowPartial {
  id: string;
  organization_name: string;
  status: string;
  stakeholder_type: StakeholderType | null;
  kind: string;
  research_data: ResearchData;
  campus_id: string;
  campus: { id: string; name: string; slug: string | null; city: string | null }[] | null;
}
const DAY_MS = 86_400_000;

// Statuses eligible for re-engagement (follow-up tab rows that completed cadence)
// Only no_response_closed is allowed - these are rows whose initial cadence
// completed without a reply. outreach_sent rows are still in their initial cadence.
const REENGAGEABLE_STATUSES = new Set([
  "no_response_closed",
]);

interface ProspectPreview {
  id: string;
  organization_name: string;
  campus_name: string;
  email: string | null;
  first_name: string | null;
  valid: boolean;
  skip_reason: string | null;
}

interface EmailPreview {
  day_0: { subject: string; body: string };
  day_3_call: { script: string };
  day_7: { subject: string; body: string };
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const ids = body.outreach_ids as string[] | undefined;
  const dryRun = body.dry_run === true;
  const assignedTo = (body.assigned_to as string | undefined) ?? user.id;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "outreach_ids required" }, { status: 400 });
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: "Max 100 rows at once" }, { status: 400 });
  }

  const db = getServiceClient();

  // Fetch outreach rows with campus info
  const { data: rowsData, error: fetchErr } = await db
    .from("student_outreach")
    .select(`
      id, organization_name, status, stakeholder_type, kind,
      research_data, campus_id,
      campus:student_outreach_campuses!campus_id(id, name, slug, city)
    `)
    .in("id", ids);

  if (fetchErr || !rowsData) {
    return NextResponse.json({ error: "Failed to fetch rows" }, { status: 500 });
  }

  // Fetch decision maker contacts from student_outreach_contacts table
  const { data: contactsData } = await db
    .from("student_outreach_contacts")
    .select("outreach_id, email, first_name, last_name, name")
    .in("outreach_id", ids)
    .eq("status", "active");

  type ContactRow = {
    outreach_id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    name: string | null;
  };
  const contactByOutreach = new Map<string, ContactRow>();
  for (const c of (contactsData ?? []) as ContactRow[]) {
    // Take the first active contact per outreach
    if (!contactByOutreach.has(c.outreach_id)) {
      contactByOutreach.set(c.outreach_id, c);
    }
  }

  // Helper to extract general contact email from research_data
  // (for providers that have no decision makers but have a general contact)
  function getGeneralContactEmail(researchData: ResearchData): {
    email: string | null;
  } {
    const gc = researchData?.general_contact;
    if (!gc?.email) return { email: null };
    // General contact is a business inbox — no person's name, so firstName stays null
    // (emails will use "Hi there," salutation)
    return { email: gc.email };
  }

  // Build preview data
  const prospects: ProspectPreview[] = [];
  const validRows: Array<{
    row: OutreachRowPartial;
    campus: { name: string; slug: string | null; city: string | null };
    email: string;
    first_name: string | null;
    last_name: string | null;
  }> = [];

  for (const r of rowsData) {
    const row = r as OutreachRowPartial;
    // Supabase nested selects return arrays; take first element
    const campusData = Array.isArray(row.campus) ? row.campus[0] : row.campus;
    const contact = contactByOutreach.get(row.id);

    // Try decision maker contact first, then fall back to general contact email
    let email = contact?.email?.trim() || null;
    let firstName = contact?.first_name ?? null;
    let lastName = contact?.last_name ?? null;

    if (!email) {
      // No decision maker email — check general contact in research_data
      const gc = getGeneralContactEmail(row.research_data);
      email = gc.email?.trim() || null;
      // General contact is a business inbox — no person's name
      // (emails will use "Hi there," salutation)
      firstName = null;
      lastName = null;
    }

    const campusInfo = campusData ?? { name: "Unknown Campus", slug: null, city: null };

    let skipReason: string | null = null;
    if (!email) {
      skipReason = "no_email";
    } else if (!REENGAGEABLE_STATUSES.has(row.status)) {
      skipReason = `invalid_status:${row.status}`;
    }

    prospects.push({
      id: row.id,
      organization_name: row.organization_name,
      campus_name: campusInfo.name,
      email,
      first_name: firstName,
      valid: skipReason === null,
      skip_reason: skipReason,
    });

    if (!skipReason && email) {
      validRows.push({
        row,
        campus: campusInfo,
        email,
        first_name: firstName,
        last_name: lastName,
      });
    }
  }

  // Build templated emails for preview (use first valid row or generic context)
  // Admin name for templates - consistently "Graize" across the workflow
  const adminFirstName = "Graize";
  const sampleCtx: TemplateContext = validRows.length > 0
    ? {
        stakeholder_type: validRows[0].row.stakeholder_type ?? "advisor",
        organization_name: validRows[0].row.organization_name,
        campus_name: validRows[0].campus.name,
        admin_first_name: adminFirstName,
      }
    : {
        stakeholder_type: "advisor",
        organization_name: "{organization_name}",
        campus_name: "{campus_name}",
        admin_first_name: adminFirstName,
      };

  const day0 = reengagementIntroEmail(sampleCtx);
  const day7 = reengagementFinalEmail(sampleCtx);
  const day3Call = reengagementCallScript(sampleCtx);

  const emailPreview: EmailPreview = {
    day_0: { subject: day0.subject, body: day0.body },
    day_3_call: { script: day3Call.script },
    day_7: { subject: day7.subject, body: day7.body },
  };

  // Dry run: return preview
  if (dryRun) {
    return NextResponse.json({
      preview: true,
      valid: validRows.length,
      invalid: prospects.length - validRows.length,
      prospects,
      emails: emailPreview,
    });
  }

  // Execute re-engagement for each valid row
  const results: Array<{ id: string; ok: boolean; reason?: string }> = [];
  const now = Date.now();

  for (const { row, campus, email, first_name, last_name } of validRows) {
    try {
      const ok = await enrollReengagement(
        db,
        row,
        campus,
        email,
        first_name,
        last_name,
        assignedTo,
        adminFirstName,
        now,
      );
      results.push({ id: row.id, ok, reason: ok ? undefined : "enrollment_failed" });
    } catch (err) {
      results.push({ id: row.id, ok: false, reason: err instanceof Error ? err.message : "failed" });
    }
  }

  // Add skipped rows to results
  for (const p of prospects) {
    if (!p.valid) {
      results.push({ id: p.id, ok: false, reason: p.skip_reason ?? "invalid" });
    }
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.ok).length,
    skipped: results.filter((r) => !r.ok).length,
    results,
  });
}

async function enrollReengagement(
  db: DB,
  row: OutreachRowPartial,
  campus: { name: string; slug: string | null; city: string | null },
  email: string,
  firstName: string | null,
  lastName: string | null,
  assignedTo: string,
  adminFirstName: string,
  now: number,
): Promise<boolean> {
  const ctx: TemplateContext = {
    stakeholder_type: row.stakeholder_type ?? "advisor",
    organization_name: row.organization_name,
    campus_name: campus.name,
    admin_first_name: adminFirstName,
  };

  // Build email steps
  const day0 = reengagementIntroEmail(ctx);
  const day7 = reengagementFinalEmail(ctx);
  const day3Call = reengagementCallScript(ctx);

  // Substitute variables for emails
  const varsForSubstitution = {
    salutation: firstName ?? "there",
    first_name: firstName ?? undefined,
    organization_name: row.organization_name,
    campus_name: campus.name,
    admin_first_name: adminFirstName,
  };

  const emailSteps: CustomEmailStep[] = [
    {
      day: 0,
      subject: substituteVars(day0.subject, varsForSubstitution),
      body: substituteVars(day0.body, varsForSubstitution),
    },
    {
      day: 7,
      subject: substituteVars(day7.subject, varsForSubstitution),
      body: substituteVars(day7.body, varsForSubstitution),
    },
  ];

  // 1. Provision Smartlead campaign + enroll lead (best-effort)
  const yyyymm = new Date().toISOString().slice(0, 7);
  let emailDelivery = "smartlead_pending";
  let campaignId: number | undefined;

  try {
    const enroll = await enrollCustomCadence({
      outreach_id: row.id,
      organizationName: row.organization_name,
      campus: {
        name: campus.name,
        city: campus.city,
        slug: campus.slug,
      },
      campaignName: `MedJobs Re-engage — ${row.organization_name} — ${yyyymm}`,
      emailSteps,
      recipient: {
        email,
        first_name: firstName,
        last_name: lastName,
        contact_id: null,
      },
      is_partner: row.kind !== "provider",
      stakeholder_type: row.stakeholder_type,
    });

    if (enroll.skipped_reason) {
      emailDelivery = `smartlead_skipped_${enroll.skipped_reason}`;
    } else if (!enroll.ok || !enroll.campaign_id) {
      emailDelivery = "smartlead_error";
      console.error(
        "[bulk-reengage] enrollment error:",
        enroll.errors.map((e) => `${e.stage}: ${e.message}`).join("; "),
      );
    } else {
      emailDelivery = "smartlead_enrolled";
      campaignId = enroll.campaign_id;
    }
  } catch (e) {
    emailDelivery = "smartlead_error";
    console.error("[bulk-reengage] enrollment threw:", e instanceof Error ? e.message : e);
  }

  // 2. Queue Day 3 call task
  const callScript = substituteVars(day3Call.script, varsForSubstitution);
  const callDueAt = nextBusinessDayET(new Date(now + 3 * DAY_MS));

  await db.from("student_outreach_tasks").insert({
    outreach_id: row.id,
    task_type: "outreach_followup_call",
    due_at: callDueAt.toISOString(),
    payload: {
      cadence: "reengagement",
      day: 3,
      label: "Re-engagement check-in call",
      script: callScript,
      recipient_name: firstName ?? row.organization_name,
      recipient_phone: null, // Phone fetched from contacts table in drawer
      recipient_contact_id: null,
    },
    created_by: assignedTo,
  });

  // 3. Persist re-engagement campaign linkage
  if (campaignId) {
    const nextResearch: ResearchData = {
      ...(row.research_data as ResearchData),
      smartlead_custom: {
        campaign_id: campaignId,
        lead_email: email,
        enrolled_at: new Date().toISOString(),
        name: "Re-engagement",
      },
    };
    await db.from("student_outreach").update({ research_data: nextResearch }).eq("id", row.id);
  }

  // 4. Update status to outreach_sent (re-activates the row)
  await db
    .from("student_outreach")
    .update({
      status: "outreach_sent",
      last_edited_by: assignedTo,
      last_edited_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  // 5. Log touchpoint
  await db.from("student_outreach_touchpoints").insert({
    outreach_id: row.id,
    touchpoint_type: "note_added",
    notes: "Bulk re-engagement launched",
    payload: {
      reason: "bulk_reengagement_launched",
      email_delivery: emailDelivery,
      email_steps: emailSteps.length,
      call_scheduled: true,
    },
    created_by: assignedTo,
  });

  return emailDelivery !== "smartlead_error";
}
