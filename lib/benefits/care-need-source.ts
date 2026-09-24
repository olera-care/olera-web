/**
 * Where a benefits intake's `careNeed` came from.
 *
 * Not every intake surface asks the family what they need. The program-page
 * card (components/waiver-library/ProgramBenefitsCard.tsx) has never had a
 * care-need question: ProgramPageV3 derives the need from the program being
 * read, with "payingForCare" as the catch-all. So a family who signed up on
 * the LIHEAP page carries careNeed "payingForCare" that they never chose.
 *
 * Presenting that as their words did real damage (2026-09-24): of 35 pending
 * entry-program letters with a "questionable" fit read, about 30 were flagged
 * only because "LIHEAP doesn't address their stated need to pay for care", a
 * need nobody stated. This module is the single place that decides whether a
 * need is the family's own, so the composer, the fit gate and every display
 * treat it the same way.
 *
 * Pure: no server or DB imports.
 */

export type CareNeedSource =
  /** The family picked the need themselves (provider-page 3-step, wizards). */
  | "stated"
  /** Derived from the /benefits/{state}/{program} page they signed up on. */
  | "inferred_from_page"
  /** Guessed from the question they typed (provider-page empathic arm). */
  | "inferred_from_question";

const SOURCES: ReadonlySet<string> = new Set([
  "stated",
  "inferred_from_page",
  "inferred_from_question",
]);

/** Is this path a program page (`/benefits/{state}/{program}`)? */
export function isProgramPagePath(entrySource: string | null | undefined): boolean {
  if (!entrySource) return false;
  let pathname: string;
  try {
    pathname = new URL(entrySource, "https://olera.care").pathname;
  } catch {
    return false;
  }
  return /^\/benefits\/[^/]+\/[^/]+\/?$/.test(pathname);
}

/**
 * Decide provenance for one intake.
 *
 * 1. An explicit flag wins (`careNeedSource` sent by the surface since
 *    2026-09-24, stored on benefits_results.answers and on the
 *    benefits_completed event as care_need_source).
 * 2. Otherwise the intake's entry source: the program-page card is the only
 *    save-results caller mounted on /benefits/{state}/{program}, and it has
 *    never asked for a need, so a program-page entry means inferred. The
 *    entry source is read from the benefits_completed event (same intake as
 *    the need, present since June) or from benefits_results.requested_program
 *    (written by the same call since 2026-08-25).
 * 3. Otherwise "stated". Empathic-arm intakes from before the flag cannot be
 *    told apart from the 3-step flow and read as stated.
 */
export function readCareNeedSource(opts: {
  explicit?: unknown;
  entrySource?: string | null;
  requestedProgram?: unknown;
}): CareNeedSource {
  if (typeof opts.explicit === "string" && SOURCES.has(opts.explicit)) {
    return opts.explicit as CareNeedSource;
  }
  if (isProgramPagePath(opts.entrySource)) return "inferred_from_page";
  if (opts.requestedProgram && typeof opts.requestedProgram === "object") return "inferred_from_page";
  return "stated";
}

/**
 * Provenance from a family profile's metadata, plus the latest
 * benefits_completed event's metadata when the caller has it.
 */
export function careNeedSourceFromMeta(
  profileMeta: Record<string, unknown> | null | undefined,
  intakeEventMeta?: Record<string, unknown> | null,
): CareNeedSource {
  const results = (profileMeta as {
    benefits_results?: { answers?: { careNeedSource?: unknown }; requested_program?: unknown };
  } | null | undefined)?.benefits_results;
  const ev = intakeEventMeta ?? null;
  return readCareNeedSource({
    explicit: ev?.care_need_source ?? results?.answers?.careNeedSource,
    entrySource: typeof ev?.entry_source === "string" ? (ev.entry_source as string) : null,
    requestedProgram: results?.requested_program,
  });
}

/** The need is our guess, not the family's words. */
export function isInferredCareNeed(source: CareNeedSource | null | undefined): boolean {
  return source === "inferred_from_page" || source === "inferred_from_question";
}
