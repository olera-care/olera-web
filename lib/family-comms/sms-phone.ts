/**
 * Does this text contain the program's number? Compared on digits so
 * "1-800-555-0100" and "(800) 555-0100" match, and so "2-1-1" matches "211".
 * A number with fewer than 3 digits cannot be verified and fails closed.
 *
 * Shared by the navigator composer (drops a companion text without the
 * number) and the send path (falls back to the template, which always has
 * it), so the two can never disagree about what counts as "has the number".
 */
export function smsCarriesPhone(sms: string, phone: string | null | undefined): boolean {
  const want = (phone || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (want.length < 3) return false;
  const have = sms.replace(/\D/g, "");
  return have.includes(want);
}
