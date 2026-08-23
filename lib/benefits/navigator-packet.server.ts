import {
  CLEARANCE_MAX_AGE_DAYS,
  routePacket,
  statesDollarFigure,
  type DraftLintHit,
  type NavigatorPacket,
} from "./navigator-packet";
import {
  PACKET_MODELS,
  checkRails,
  factsFromProfile,
  judgeFit,
  programContext,
  readClearance,
  stateProgramNames,
} from "./navigator-gates.server";
import type { BenefitsNavigatorMeta } from "@/lib/family-comms/benefits-navigator.server";

/**
 * Build the packet for one composed letter.
 *
 * Never throws. A stage that fails records itself in `packet.errors`, which
 * the router turns into a hold — the same posture as the family-answers
 * engine, and for the same reason: a partial packet a human can read beats a
 * letter stuck in limbo with nothing to show for it.
 */

/** Fields the builder needs off the family's profile row. */
export interface PacketProfileInput {
  care_types?: string[] | null;
  state?: string | null;
  metadata?: Record<string, unknown> | null;
  /**
   * metadata.care_need from the family's benefits_completed event. Callers
   * MUST supply it: it is the single most important input to the fit gate,
   * and it does not live on the profile row.
   */
  careNeed?: string | null;
}

function intakeAgeDays(metadata: Record<string, unknown> | null | undefined): number | null {
  const results = (metadata as { benefits_results?: { completed_at?: unknown } } | null | undefined)
    ?.benefits_results;
  const at = typeof results?.completed_at === "string" ? results.completed_at : null;
  if (!at) return null;
  const then = new Date(at);
  if (Number.isNaN(then.getTime())) return null;
  return Math.floor((Date.now() - then.getTime()) / 86_400_000);
}

/**
 * Pure string checks over the draft itself, mirroring the subset of
 * scripts/benefits-draft-lint.js that needs no database.
 *
 * The `{link}` punctuation check is not hypothetical: on 2026-08-23 it fired
 * on 78 of 130 pending drafts. Some SMS clients pull a trailing character into
 * the tapped URL, so the family taps their plan link and gets a 404 — on the
 * channel that is the ONLY delivery for a text-only family.
 */
export function draftLintHits(sms: string | null): DraftLintHit[] {
  const hits: DraftLintHit[] = [];
  const text = sms?.trim();
  if (!text) return hits;

  if (!text.includes("{link}")) {
    hits.push({
      check: "sms-assembly",
      severity: "high",
      detail: "companion text has no {link} placeholder, so the plan link is never inserted",
    });
    return hits;
  }
  if (/\{link\}[^\s]/.test(text)) {
    hits.push({
      check: "sms-assembly",
      severity: "medium",
      detail: "punctuation sits flush against {link}; some clients pull it into the tapped URL",
    });
  }
  if (/https?:\/\//.test(text)) {
    hits.push({
      check: "sms-assembly",
      severity: "high",
      detail: "companion text writes its own link; the send path appends the only one that should exist",
    });
  }
  return hits;
}

export async function buildNavigatorPacket(
  profile: PacketProfileInput,
  navigator: BenefitsNavigatorMeta,
): Promise<NavigatorPacket> {
  const errors: string[] = [];
  const builtAt = new Date().toISOString();
  const models: Record<string, string> = {};

  // Saved edits are the letter that would actually send, so they are what
  // gets judged — never the superseded AI original.
  const body = navigator.edited_body ?? navigator.body ?? "";
  const sms = navigator.edited_sms ?? navigator.sms ?? null;

  const facts = factsFromProfile(profile);
  if (profile.careNeed === undefined) {
    // Not a crash, but the fit gate is materially worse without it, and a
    // silently-omitted need is what made 92 letters look fact-free.
    errors.push("careNeed was not supplied — fit judged without the family's stated need");
  }
  const ageDays = intakeAgeDays(profile.metadata);

  const base = {
    version: 1 as const,
    builtAt,
    facts,
    intakeAgeDays: ageDays,
    statesDollarFigure: statesDollarFigure(body),
    lint: draftLintHits(sms),
  };

  // No directional facts means the pick was never a judgment we were entitled
  // to make, so the expensive gates have nothing to judge. Short-circuiting
  // here is not just thrift (it skips a fit read on roughly half the queue) —
  // running fit on a fact-free family would produce a verdict that reads as
  // informative and is not.
  if (!facts.enoughToPick) {
    const { route, holds } = routePacket({
      facts,
      fit: [],
      rails: [],
      clearance: null,
      lint: base.lint,
      intakeAgeDays: ageDays,
      statesDollarFigure: base.statesDollarFigure,
    });
    return { ...base, fit: [], rails: [], clearance: null, route, holds, models };
  }

  const pick = navigator.pick ?? null;
  const clearance = pick
    ? readClearance(pick.stateId ?? null, pick.programId, CLEARANCE_MAX_AGE_DAYS)
    : null;
  if (pick && !clearance) errors.push("program not found in the deployed pipeline bundle");

  const factsBlock = [...facts.directional, ...facts.screening]
    .map((f) => `- ${f}`)
    .join("\n");

  const context = pick ? programContext(pick.stateId ?? null, pick.programId) : null;

  const [fit, rails] = await Promise.all([
    pick
      ? judgeFit({
          factsBlock,
          programName: pick.name,
          programSummary: context?.summary ?? "",
          eligibilitySummary: context?.eligibility ?? "",
          stateProgramNames: stateProgramNames(pick.stateId ?? null),
        })
      : Promise.resolve([]),
    checkRails(body, sms),
  ]);

  if (pick && fit.length === 0) errors.push("no fit read came back usable");
  models[PACKET_MODELS.fitPrimary] = "fit";
  models[PACKET_MODELS.fitSecond] = "fit";
  models[PACKET_MODELS.rails] = "rails";

  const { route, holds } = routePacket({
    facts,
    fit,
    rails,
    clearance,
    lint: base.lint,
    intakeAgeDays: ageDays,
    statesDollarFigure: base.statesDollarFigure,
    errors,
  });

  return {
    ...base,
    fit,
    rails,
    clearance,
    route,
    holds,
    models,
    errors: errors.length ? errors : undefined,
  };
}
