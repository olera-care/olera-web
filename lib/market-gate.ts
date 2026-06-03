/**
 * Gate for the "Your Market" experience (provider client-acquisition diagnostic).
 *
 * While we dogfood with the Aggie test provider, the diagnostic-default Find Families
 * tab and the post-Q&A teaser redirect are shown only to Aggie / TJ, or to anyone who
 * appends `?market=1` (for previews). Flipping this on for everyone is a one-line change:
 * make `marketGateEnabled` return `true`.
 */
export function marketGateEnabled(opts: { displayName?: string | null; email?: string | null }): boolean {
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("market")) return true;
  const name = (opts.displayName || "").toLowerCase();
  const email = (opts.email || "").toLowerCase();
  return name.includes("aggie") || email === "tfalohun@gmail.com";
}
