/**
 * Navigator letter review prompt — a self-contained fact-check brief TJ can
 * paste into an external AI (ChatGPT, Perplexity, Grok) before approving
 * drafts in /admin/benefits.
 *
 * Design constraints (locked 2026-07-31):
 * - The unit of verification is the PROGRAM, not the letter: a letter's
 *   checkable claims (phone, hours, documents, savings) all come from the
 *   pick snapshot, so letters are grouped under their program and each
 *   program's claims appear once no matter how many letters reference it.
 * - The reviewer is scoped to verification, fit, and blind spots — and
 *   explicitly forbidden from rewriting the letters (external models
 *   otherwise "improve" the deliberate plain voice into AI-speak).
 * - Output ends with a machine-applicable CORRECTIONS block so verified
 *   fixes can be patched into data/pipeline, not just this one letter.
 * - Redaction: family names are replaced with [first name]; no emails or
 *   identifiers are ever included. Facts (state, care need, age/income
 *   bands) stay — they're what makes the fit judgment possible.
 *
 * Pure module, no server imports — used by the admin client for both the
 * per-draft copy button and the Draft-ready batch export.
 */

export interface ReviewPick {
  programId?: string;
  stateId?: string | null;
  name?: string;
  shortName?: string;
  contactLabel?: string;
  contactPhone?: string;
  contactHours?: string | null;
  documents?: string[];
  savingsRange?: string | null;
}

export interface ReviewItem {
  draft: { subject: string; body: string; sms: string | null };
  /** State abbreviation or name as shown in the queue ("SC"). */
  state: string | null;
  /** Humanized care need ("Paying for care"), null when unknown. */
  careNeed: string | null;
  /** Humanized held facts ("age 80, not on Medicaid, income $1,500–$2,500/mo"). */
  situation: string | null;
  /** Intake completion ISO date. */
  completedAt: string | null;
  /** First name, used ONLY to redact the letter text — never emitted. */
  firstName: string | null;
  pick: ReviewPick | null;
}

/** Words that show up as placeholder "names" in profile data — redacting
 *  them would mangle ordinary prose ("paying for care" → "paying for
 *  [first name]"). 17 of the first 18 live drafts had displayName
 *  "Care Seeker", so this guard is load-bearing, not paranoia. */
const PLACEHOLDER_NAME_WORDS = new Set(["care", "seeker", "family", "senior", "unnamed", "test"]);

function redact(text: string, firstName: string | null): string {
  if (!firstName || firstName.length < 2) return text;
  if (PLACEHOLDER_NAME_WORDS.has(firstName.toLowerCase())) return text;
  const escaped = firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Case-sensitive on purpose: letters use the name properly capitalized,
  // and a case-insensitive match turns word-names (May, Grace, Will) into
  // prose-mangling false positives.
  return text.replace(new RegExp(`\\b${escaped}\\b`, "g"), "[first name]");
}

function programClaims(pick: ReviewPick, state: string): string {
  const lines: string[] = [];
  lines.push(
    `1. "${pick.name ?? pick.shortName}" is a real, currently operating program in ${state} that serves older adults.`,
  );
  if (pick.contactPhone) {
    lines.push(
      `2. Calling ${pick.contactPhone} currently reaches ${pick.contactLabel ?? "the program"}${
        pick.contactHours ? ` (stated hours: ${pick.contactHours})` : ""
      }, and that line handles ${pick.shortName ?? pick.name} inquiries.`,
    );
  }
  if (pick.documents?.length) {
    lines.push(
      `${lines.length + 1}. These are appropriate documents to have ready for a first call: ${pick.documents.join("; ")}.`,
    );
  }
  if (pick.savingsRange) {
    lines.push(
      `${lines.length + 1}. Typical savings for enrolled participants: ${pick.savingsRange}.`,
    );
  }
  return lines.join("\n");
}

function letterSection(item: ReviewItem, label: string): string {
  const facts = [
    item.state,
    item.careNeed ? `looking into: ${item.careNeed.toLowerCase()}` : null,
    item.situation,
    item.completedAt
      ? `completed our benefits intake ${new Date(item.completedAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const parts = [
    `### ${label} (${facts || "no facts held"})`,
    "",
    `SUBJECT: ${redact(item.draft.subject, item.firstName)}`,
    "",
    redact(item.draft.body, item.firstName),
  ];
  if (item.draft.sms?.trim()) {
    parts.push("", `COMPANION TEXT: ${redact(item.draft.sms, item.firstName)}`);
  }
  return parts.join("\n");
}

/** Build the full paste-ready review prompt for one or many drafts. */
export function buildNavigatorReviewPrompt(items: ReviewItem[]): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group letters by program so each program's claims are verified once.
  const groups = new Map<string, ReviewItem[]>();
  for (const item of items) {
    const key = item.pick
      ? `${item.pick.stateId ?? item.state ?? "?"}/${item.pick.programId ?? item.pick.name ?? "?"}`
      : `no-pick-${groups.size}`;
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }

  const header = `# Fact-check request: first-step benefits letters (${items.length} letter${items.length === 1 ? "" : "s"}, ${groups.size} program${groups.size === 1 ? "" : "s"})

You are an independent benefits fact-checker reviewing letters written by Olera (olera.care), a senior-care platform. Each letter gives one family of an older adult a single "first step": one government benefit program worth calling, the phone number, and the documents to have ready before dialing. Recipients are mostly low-income seniors or their adult children. A wrong number or a poor program pick wastes the one call they may attempt. Today's date is ${today} — verify against CURRENT sources, not what was true last year.

## Your four jobs, in order

1. VERIFY every numbered claim under each program against current official sources (state .gov sites and the program operators themselves). For phone numbers, confirm the number still reaches the named organization for the named program today.
2. JUDGE THE PICK: given each family's stated facts, is this program the right FIRST call? Would an experienced benefits counselor in that state start somewhere else? Note: our letters only ever say a program is "worth a call" — we never claim the family qualifies, and you should not either.
3. FLAG RISK: quote any sentence in a letter that could mislead, overpromise, or damage trust with a vulnerable reader.
4. BLIND SPOTS: what would a seasoned benefits counselor add or do differently — application deadlines, waitlist realities, a better entry door into the same benefit, or a related program that fits these facts better?

## Ground rules

- Cite an official source URL for every verdict. If you cannot find a source that confirms or refutes a claim, write "could not verify" — never guess and never fill the gap from general knowledge.
- Our program data was last centrally verified in spring 2026. Income limits and phone menus change; check currency, not just existence.
- Do NOT rewrite the letters. Do not critique tone, style, or word choice — the plain voice is deliberate. Only quote wording when it creates factual or trust risk.
- Family names are redacted as [first name]. Do not speculate about identities.

## Required output

For each program, a findings table:

| # | Claim | Verdict (confirmed / outdated / wrong / could not verify) | Current value if different | Official source URL | Severity (high / med / low) |

Then, for each letter: two or three sentences on pick fit, plus any risk flags.

Finish the whole review with a single CORRECTIONS block listing only the claims that need changing, one per line, exactly in this form:

[STATE] [program name]: [field] — [our value] → [correct value] (source URL)

That block gets applied to our program database, so include only what you verified against a source.`;

  const sections: string[] = [header];
  let groupIndex = 0;
  for (const [, groupItems] of groups) {
    groupIndex++;
    const first = groupItems[0];
    const state = first.state ?? first.pick?.stateId ?? "unknown state";
    sections.push("---");
    if (first.pick) {
      sections.push(
        `## Program ${groupIndex}: ${first.pick.name ?? first.pick.shortName} (${state})`,
        "",
        "Claims to verify:",
        programClaims(first.pick, String(state)),
      );
    } else {
      sections.push(
        `## Program ${groupIndex}: (pick data missing)`,
        "",
        "No structured claims were stored for this letter — extract and verify the program name, phone number, and documents directly from the letter text below.",
      );
    }
    groupItems.forEach((item, i) => {
      sections.push(
        "",
        letterSection(item, groupItems.length === 1 ? "Letter" : `Letter ${String.fromCharCode(65 + i)}`),
      );
    });
  }

  return sections.join("\n");
}
