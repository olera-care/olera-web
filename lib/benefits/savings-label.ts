/**
 * One honest dollar label for a program's savingsRange string.
 *
 * The old parsers took the LAST dollar figure in the string and called it
 * "Up to $X". That turned "$1,500 – $3,600/year" (a typical range) into a
 * maximum, "Up to $298/month ($3,576/year)" into "Up to $3,576/mo", and a
 * program maximum like TX LIHEAP's "Up to $12,600/year, though most
 * households receive far less" into an "estimated benefit".
 *
 * Rules:
 *   - "$A – $B/period" at the start       → kind "range": "$A to $B/yr"
 *   - "Up to $X..." at the start          → kind "max":   "Up to $X/mo"
 *     (the FIRST figure, with the period written right after it)
 *   - "$X/period" / "$X+/period" at start → kind "amount": "$X/yr"
 *   - anything else                       → null (callers fall back to a
 *     non-dollar headline)
 */

export type BenefitAmountKind = "range" | "max" | "amount";

export interface BenefitAmountLabel {
  text: string;
  kind: BenefitAmountKind;
}

const FIG = String.raw`\$\s?([\d,]+(?:\.\d+)?)`;

/** "/mo" | "/yr" | "" from the text immediately following a figure. */
function periodAfter(rest: string): string {
  const m = rest.match(/^\+?\s*(?:\/|per\s+|a\s+)?\s*(month|mo|year|yr|annually|monthly)\b/i);
  if (!m) return "";
  return /^mo/i.test(m[1]) || /monthly/i.test(m[1]) ? "/mo" : "/yr";
}

export function benefitAmountLabel(range?: string | null): BenefitAmountLabel | null {
  if (!range) return null;
  const s = range.trim();

  // An open top ("$5,000 – $20,000+/year") keeps its "+".
  const r = s.match(new RegExp(`^${FIG}\\s*(?:–|—|-|to)\\s*${FIG}(\\+?)`, "i"));
  if (r) {
    const period = periodAfter(s.slice(r[0].length));
    return { text: `$${r[1]} to $${r[2]}${r[3]}${period}`, kind: "range" };
  }

  const u = s.match(new RegExp(`^up to\\s+${FIG}`, "i"));
  if (u) {
    const period = periodAfter(s.slice(u[0].length));
    return { text: `Up to $${u[1]}${period}`, kind: "max" };
  }

  const a = s.match(new RegExp(`^${FIG}(\\+?)`, "i"));
  if (a) {
    const rest = s.slice(a[0].length);
    const period = periodAfter(rest);
    // "$298/month maximum for one person" is a maximum, not the amount.
    if (!a[2] && /^\S*\s+maximum\b/i.test(rest)) {
      return { text: `Up to $${a[1]}${period}`, kind: "max" };
    }
    return { text: `$${a[1]}${a[2]}${period}`, kind: "amount" };
  }

  return null;
}

/** Short caption for under the figure. */
export function benefitAmountCaption(kind: BenefitAmountKind): string {
  if (kind === "range") return "Typical range. Your amount depends on income and household.";
  if (kind === "max") return "Program maximum. Most households get less, based on income and household.";
  return "Your amount depends on income and household.";
}

/** Very short caption for tight spaces (the mobile sticky bar). */
export function benefitAmountShortCaption(kind: BenefitAmountKind): string {
  if (kind === "range") return "Typical range";
  if (kind === "max") return "Program maximum";
  return "Depends on income";
}
