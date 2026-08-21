/**
 * Street-level address agreement.
 *
 * Used to decide whether a Google Place a provider is pointing at is plausibly
 * the same physical location as the address on their profile. It is a guard
 * against a provider adopting some other business's Google rating, not a
 * validation of address quality, so it deliberately compares only the street
 * portion: suite/unit numbers, punctuation and the usual abbreviation pairs
 * ("Drive"/"Dr", "North"/"N") are noise for that question and produce false
 * mismatches if left in.
 *
 * Google returns `formattedAddress` as a full postal string
 * ("1800 Teague Dr Suite 404, Sherman, TX 75090, USA") while profiles store the
 * street line alone, so only the segment before the first comma is compared.
 */

const SUFFIXES: Record<string, string> = {
  street: "st", str: "st",
  avenue: "ave", av: "ave",
  boulevard: "blvd",
  drive: "dr",
  road: "rd",
  lane: "ln",
  court: "ct",
  place: "pl",
  parkway: "pkwy",
  highway: "hwy",
  terrace: "ter",
  circle: "cir",
  square: "sq",
  trail: "trl",
  north: "n", south: "s", east: "e", west: "w",
  northwest: "nw", northeast: "ne", southwest: "sw", southeast: "se",
};

/** Everything from a unit designator onward is dropped. */
const UNIT_MARKER = /\b(ste|suite|unit|apt|apartment|rm|room|bldg|building|fl|floor|dept)\b.*$/;

/**
 * Reduce an address to a comparable street key. Returns "" when there is
 * nothing usable, which callers must treat as "cannot compare" rather than
 * as a match.
 */
export function streetKey(address: string | null | undefined): string {
  if (!address) return "";
  const streetLine = address.split(",")[0] ?? "";
  const cleaned = streetLine
    .toLowerCase()
    .replace(/[.]/g, " ")
    .replace(/#\s*[\w-]+/g, " ")
    .replace(UNIT_MARKER, " ")
    .replace(/[^a-z0-9\s]/g, " ");
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => SUFFIXES[word] ?? word)
    .join(" ")
    .trim();
}

export type AddressAgreement =
  | { agrees: true }
  | { agrees: false; reason: "indeterminate" | "different-street" };

/**
 * Compare a profile address against a Google Place's formatted address.
 *
 * Fails closed on missing data: with nothing to compare we cannot claim the
 * two are the same place, so the caller should refuse rather than allow.
 */
export function addressesAgree(
  profileAddress: string | null | undefined,
  placeFormattedAddress: string | null | undefined,
): AddressAgreement {
  const a = streetKey(profileAddress);
  const b = streetKey(placeFormattedAddress);
  if (!a || !b) return { agrees: false, reason: "indeterminate" };
  if (a === b) return { agrees: true };
  return { agrees: false, reason: "different-street" };
}
