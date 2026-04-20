/**
 * Format a YYYY-MM-DD date as "April 20, 2026" without UTC-midnight shift.
 *
 * Using `new Date("2026-04-20")` treats the input as UTC midnight, which
 * renders as the previous day in negative-offset timezones. Parsing the
 * components explicitly keeps the date stable in every locale.
 */
export function formatReviewDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const parts = iso.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return iso;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
